import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { Document } from './entities/document.entity';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { EncryptionService } from '../encryption/encryption.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditLogAction } from '../audit-logs/entities/audit-log.entity';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { S3Client } from '@aws-sdk/client-s3';

@Injectable()
export class DocumentsService {
  private readonly s3client: S3Client;
  private supabase: SupabaseClient;
  private bucketName: string;

  constructor(
    @InjectRepository(Document)
    private documentsRepository: Repository<Document>,
    private configService: ConfigService,
    private encryptionService: EncryptionService,
    private auditLogsService: AuditLogsService,
  ) {
    // // Initialize AWS S3 client
    // this.s3client = new S3Client({
    //   region: this.configService.getOrThrow('AWS_S3_REGION'),
    // });

    // Initialize Supabase client
    this.supabase = createClient(
      this.configService.get<string>('supabase.url') ?? (() => { throw new Error('Supabase URL is not defined'); })(),
      this.configService.get<string>('supabase.key') ?? (() => { throw new Error('Supabase Key is not defined'); })(),
    );
    this.bucketName = this.configService.get<string>('supabase.bucket') ?? (() => { throw new Error('Supabase Bucket is not defined'); })();
    
    // Ensure bucket exists
    this.initBucket();
  }

  private async initBucket() {
    const { data: buckets } = await this.supabase.storage.listBuckets();
    const bucketExists = buckets?.find(bucket => bucket.name === this.bucketName);
    
    if (!bucketExists) {
      await this.supabase.storage.createBucket(this.bucketName, {
        public: false,
      });
    }
  }

  async uploadDocument(file: Express.Multer.File, createDocumentDto: CreateDocumentDto, userId: string, req: any) {
    try {
      const encrypt = createDocumentDto.encrypt !== false; // Default to true if not specified
      let fileBuffer = file.buffer;
      let encryptionIv = '';
      
      // Generate a unique file path in the bucket
      const fileExt = file.originalname.split('.').pop();
      const uniqueFileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/${uniqueFileName}`;
      
      // Calculate original file hash before encryption
      const fileHash = this.encryptionService.generateHash(fileBuffer);
      
      // Encrypt the file if requested
      if (encrypt) {
        const iv = crypto.randomBytes(16);
        encryptionIv = iv.toString('hex');
        const cipher = crypto.createCipheriv(
          this.configService.get<string>('encryption.algorithm') ?? (() => { throw new Error('Encryption algorithm is not defined'); })(),
          Buffer.from(this.configService.get<string>('encryption.secretKey') ?? (() => { throw new Error('Encryption secret key is not defined'); })(), 'hex'),
          iv
        );
        
        const encryptedBuffer = Buffer.concat([
          cipher.update(fileBuffer),
          cipher.final()
        ]);
        
        fileBuffer = encryptedBuffer;
      }
      
      // Upload to Supabase Storage
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(filePath, fileBuffer, {
          contentType: file.mimetype,
          upsert: false,
        });
      
      if (error) {
        throw new InternalServerErrorException(`Failed to upload to storage: ${error.message}`);
      }

    //   // Upload to Amazon s3 Storage
    //   await this.s3client.send(
    //     new PutObjectCommand({
    //      Bucket: this.configService.getOrThrow('AWS_S3_BUCKET'),
    //      Key: filePath,
    //      Body: fileBuffer,
    //    })
    //  );

      // Create document record
      const document = this.documentsRepository.create({
        filename: file.originalname,
        description: createDocumentDto.description,
        contentType: file.mimetype,
        size: file.size,
        path: filePath,
        hash: fileHash,
        encryptionIv,
        isEncrypted: encrypt,
        ownerId: userId,
      });
      
      const savedDocument = await this.documentsRepository.save(document);
      
      // Log the upload action
      await this.auditLogsService.createAuditLog({
        action: AuditLogAction.UPLOAD,
        userId: userId ?? undefined,
        documentId: savedDocument.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      return savedDocument;
    } catch (error) {
      throw new InternalServerErrorException(`Document upload failed: ${error.message}`);
    }
  }

  async findAllByUser(userId: string, page = 1, limit = 10) {
    const [documents, total] = await this.documentsRepository.findAndCount({
      where: { ownerId: userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    return {
      data: documents,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const document = await this.documentsRepository.findOne({
      where: { id },
    });
    
    if (!document) {
      throw new NotFoundException(`Document with ID "${id}" not found`);
    }
    
    // Ensure the user is the owner of the document
    if (document.ownerId !== userId) {
      throw new UnauthorizedException('You do not have permission to access this document');
    }
    
    return document;
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto, userId: string, req: any) {
    const document = await this.findOne(id, userId);
    
    Object.assign(document, updateDocumentDto);
    const updatedDocument = await this.documentsRepository.save(document);
    
    // Log the update action
    await this.auditLogsService.createAuditLog({
      action: AuditLogAction.UPDATE,
      userId: userId ?? undefined,
      documentId: document.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    return updatedDocument;
  }

  async remove(id: string, userId: string, req: any) {
    const document = await this.findOne(id, userId);
    
    // Delete from Supabase Storage
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([document.path]);
    
    if (error) {
      throw new InternalServerErrorException(`Failed to delete from storage: ${error.message}`);
    }
    
    // Log the delete action
    await this.auditLogsService.createAuditLog({
      action: AuditLogAction.DELETE,
      userId: userId ?? undefined,
      documentId: document.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    // First, delete all related audit logs
    await this.auditLogsService.deleteAuditLogsByDocumentId(document.id);
    
    // Then delete the document
    await this.documentsRepository.remove(document);
    
    return { success: true };
  }

  async downloadDocument(id: string, userId: string | null, accessLinkId: string | null, req: any) {
    let document: Document;
    
    if (userId) {
      // If user is authenticated, check ownership
      document = await this.findOne(id, userId);
    } else if (accessLinkId) {
      // If using access link, the validation would be done in the AccessLinksService
      const foundDocument = await this.documentsRepository.findOne({
        where: { id },
      });

      if (!foundDocument) {
        throw new NotFoundException(`Document with ID "${id}" not found`);
      }

      document = foundDocument;
      
      if (!document) {
        throw new NotFoundException(`Document with ID "${id}" not found`);
      }
    } else {
      throw new UnauthorizedException('Authentication or valid access link required');
    }
    
    // Get file from Supabase Storage
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .download(document.path);
    
    if (error) {
      throw new InternalServerErrorException(`Failed to download file: ${error.message}`);
    }
    
    let fileBuffer = await data.arrayBuffer();
    fileBuffer = Buffer.from(fileBuffer);
    
    // Log the download action
    await this.auditLogsService.createAuditLog({
      action: AuditLogAction.DOWNLOAD,
      userId: userId ?? undefined,
      accessLinkId: accessLinkId ?? undefined,
      documentId: document.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    // Decrypt if necessary
    if (document.isEncrypted && document.encryptionIv) {
      const iv = Buffer.from(document.encryptionIv, 'hex');
      const decipher = crypto.createDecipheriv(
        this.configService.get<string>('encryption.algorithm') ?? (() => { throw new Error('Encryption algorithm is not defined'); })(),
        Buffer.from(this.configService.get<string>('encryption.secretKey') ?? (() => { throw new Error('Encryption secret key is not defined'); })(), 'hex'),
        iv
      );
      
      fileBuffer = Buffer.concat([
        decipher.update(new Uint8Array(fileBuffer)),
        decipher.final()
      ]);
    }
    
    return {
      buffer: fileBuffer,
      filename: document.filename,
      contentType: document.contentType,
    };
  }
}
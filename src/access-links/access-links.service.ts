import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { AccessLink } from './entities/access-link.entity';
import { CreateAccessLinkDto } from './dto/create-access-link.dto';
import { DocumentsService } from '../documents/documents.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditLogAction } from '../audit-logs/entities/audit-log.entity';

@Injectable()
export class AccessLinksService {
  constructor(
    @InjectRepository(AccessLink)
    private accessLinksRepository: Repository<AccessLink>,
    private documentsService: DocumentsService,
    private configService: ConfigService,
    private auditLogsService: AuditLogsService,
  ) {}

  async create(createAccessLinkDto: CreateAccessLinkDto, userId: string, req: any) {
    const document = await this.documentsService.findOne(createAccessLinkDto.documentId, userId);
    
    const token = crypto.randomBytes(24).toString('hex');
    
    const expiresAt = createAccessLinkDto.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const accessLink = this.accessLinksRepository.create({
      token,
      documentId: document.id,
      createdById: userId,
      expiresAt: expiresAt,
      maxViews: createAccessLinkDto.maxViews || 0,
      currentViews: 0,
    });
    
    const savedLink = await this.accessLinksRepository.save(accessLink);
    
    await this.auditLogsService.createAuditLog({
      action: AuditLogAction.SHARE,
      userId,
      documentId: document.id,
      accessLinkId: savedLink.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    const baseUrl = this.configService.get<string>('app.baseUrl');
    return {
      ...savedLink,
      accessUrl: `${baseUrl}/api/access/${savedLink.token}`,
    };
  }

  async findAllByUser(userId: string, page = 1, limit = 10) {
    const [links, total] = await this.accessLinksRepository.findAndCount({
      where: { createdById: userId },
      relations: ['document'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    const baseUrl = this.configService.get<string>('app.baseUrl');
    const enrichedLinks = links.map(link => ({
      ...link,
      accessUrl: `${baseUrl}/access/${link.token}`,
    }));
    
    return {
      data: enrichedLinks,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findLinksByDocument(documentId: string, userId: string) {
    await this.documentsService.findOne(documentId, userId);
    
    const links = await this.accessLinksRepository.find({
      where: { documentId },
      order: { createdAt: 'DESC' },
    });
    
    const baseUrl = this.configService.get<string>('app.baseUrl');
    return links.map(link => ({
      ...link,
      accessUrl: `${baseUrl}/access/${link.token}`,
    }));
  }

  async findOne(id: string, userId: string) {
    const link = await this.accessLinksRepository.findOne({
      where: { id },
      relations: ['document'],
    });
    
    if (!link) {
      throw new NotFoundException(`Access link with ID "${id}" not found`);
    }
    
    if (link.createdById !== userId) {
      throw new UnauthorizedException('You do not have permission to access this link');
    }
    
    const baseUrl = this.configService.get<string>('app.baseUrl');
    return {
      ...link,
      accessUrl: `${baseUrl}/access/${link.token}`,
    };
  }

  async remove(id: string, userId: string) {
    const link = await this.findOne(id, userId);
    await this.accessLinksRepository.delete(id);
    return { success: true };
  }

  async validateAccessLink(token: string, req: any) {
    const link = await this.accessLinksRepository.findOne({
      where: { token },
      relations: ['document'],
    });
    
    if (!link) {
      throw new NotFoundException('Invalid or expired access link');
    }
    
    if (link.expiresAt && new Date() > link.expiresAt) {
      throw new BadRequestException('Access link has expired');
    }
    
    if (link.maxViews > 0 && link.currentViews >= link.maxViews) {
      throw new BadRequestException('Access link has reached maximum number of views');
    }
    
    link.currentViews += 1;
    await this.accessLinksRepository.save(link);
    
    await this.auditLogsService.createAuditLog({
      action: AuditLogAction.VIEW,
      accessLinkId: link.id,
      documentId: link.document.id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
    
    return {
      documentId: link.document.id,
      accessLinkId: link.id,
      document: link.document,
    };
  }
}
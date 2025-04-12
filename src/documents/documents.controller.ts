import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, Query, Req, UseGuards, Res, StreamableFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { DocumentResponseDto } from './dto/document-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';
import { Express } from 'express';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')  
  @ApiOperation({ summary: 'Upload a new document' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully', type: DocumentResponseDto })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        description: {
          type: 'string',
        },
        encrypt: {
          type: 'boolean',
          default: true,
        },
      },
    },
  })
  @ApiBearerAuth()
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() createDocumentDto: CreateDocumentDto,
    @Req() req: any,
  ) {
    // Extract properties from the request body
    const dto = {
      description: createDocumentDto.description,
      encrypt: createDocumentDto.encrypt !== undefined ? createDocumentDto.encrypt : true,
    };
    
    // Validate file existence
    if (!file) {
      throw new Error('File is required');
    }
    
    return this.documentsService.uploadDocument(file, dto, req.user.id, req);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all documents for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of documents', type: [DocumentResponseDto] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiBearerAuth()
  findAll(@Query('page') page = 1, @Query('limit') limit = 10, @Req() req: any) {
    return this.documentsService.findAllByUser(req.user.id, page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get document details by ID' })
  @ApiResponse({ status: 200, description: 'Document details', type: DocumentResponseDto })
  @ApiBearerAuth()
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiResponse({ status: 200, description: 'Document updated', type: DocumentResponseDto })
  @ApiBearerAuth()
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
    @Req() req: any,
  ) {
    return this.documentsService.update(id, updateDocumentDto, req.user.id, req);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a document' })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  @ApiBearerAuth()
  remove(@Param('id') id: string, @Req() req: any) {
    return this.documentsService.remove(id, req.user.id, req);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Download a document' })
  @ApiResponse({ status: 200, description: 'Document file stream' })
  @ApiBearerAuth()
  async download(
    @Param('id') id: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename, contentType } = await this.documentsService.downloadDocument(id, req.user.id, null, req);
    
    res.set({
      'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      'Content-Type': contentType,
    });
    
    return new StreamableFile(new Uint8Array(buffer));
  }
}
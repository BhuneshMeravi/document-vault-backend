import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req, Query, Res, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AccessLinksService } from './access-links.service';
import { CreateAccessLinkDto } from './dto/create-access-link.dto';
import { AccessLinkResponseDto } from './dto/access-link-response.dto';
import { DocumentsService } from '../documents/documents.service';
import { StreamableFile } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import * as express from 'express';

@ApiTags('access-links')
@Controller('access-links')
export class AccessLinksController {
  constructor(
    private readonly accessLinksService: AccessLinksService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create an access link for a document' })
  @ApiResponse({ status: 201, description: 'Access link created', type: AccessLinkResponseDto })
  @ApiBearerAuth()
  create(@Body() createAccessLinkDto: CreateAccessLinkDto, @Req() req: any) {
    return this.accessLinksService.create(createAccessLinkDto, req.user.id, req);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all access links created by the user' })
  @ApiResponse({ status: 200, description: 'List of access links', type: [AccessLinkResponseDto] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiBearerAuth()
  findAll(@Query('page') page = 1, @Query('limit') limit = 10, @Req() req: any) {
    return this.accessLinksService.findAllByUser(req.user.id, page, limit);
  }

  @Get('document/:documentId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all access links for a specific document' })
  @ApiResponse({ status: 200, description: 'List of access links', type: [AccessLinkResponseDto] })
  @ApiBearerAuth()
  findByDocument(@Param('documentId') documentId: string, @Req() req: any) {
    return this.accessLinksService.findLinksByDocument(documentId, req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get an access link by ID' })
  @ApiResponse({ status: 200, description: 'Access link details', type: AccessLinkResponseDto })
  @ApiBearerAuth()
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.accessLinksService.findOne(id, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete an access link' })
  @ApiResponse({ status: 200, description: 'Access link deleted' })
  @ApiBearerAuth()
  remove(@Param('id') id: string, @Req() req: any) {
    return this.accessLinksService.remove(id, req.user.id);
  }
}

@ApiTags('public-access')
@Controller('access')
export class PublicAccessController {
  constructor(
    private readonly accessLinksService: AccessLinksService,
    private readonly documentsService: DocumentsService,
  ) {}

  @Get(':token')
  @ApiOperation({ summary: 'Access and view a document using an access link token' })
  @ApiResponse({ status: 200, description: 'Document file stream' })
  async accessDocument(
    @Param('token') token: string,
    @Req() req: any,
    @Res({ passthrough: true }) res: express.Response,
    @Query('download') download?: string,
  ) {
    const { documentId, accessLinkId } = await this.accessLinksService.validateAccessLink(token, req);
    
    const { buffer, filename, contentType } = await this.documentsService.downloadDocument(documentId, null, accessLinkId, req);
    
    // Set appropriate headers based on content type and download parameter
    const isViewable = this.isViewableInBrowser(contentType);
    const shouldDownload = download === 'true' || !isViewable;
    
    if (shouldDownload) {
      // Force download with 'attachment'
      res.set({
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Content-Type': contentType,
      });
    } else {
      // Allow browser to display with 'inline'
      res.set({
        'Content-Disposition': `inline; filename="${encodeURIComponent(filename)}"`,
        'Content-Type': contentType,
      });
    }
    
    return new StreamableFile(new Uint8Array(buffer));
  }
  
  private isViewableInBrowser(contentType: string): boolean {
    const viewableTypes = [
      'application/pdf',
      'text/plain',
      'text/html',
      'text/css',
      'text/javascript',
      'text/csv',
      'text/xml',
      'application/json',
      'application/xml',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/svg+xml',
      'image/webp',
      'audio/mpeg',
      'audio/ogg',
      'audio/wav',
      'video/mp4',
      'video/webm',
      'video/ogg'
    ];
    
    return viewableTypes.includes(contentType);
  }
}
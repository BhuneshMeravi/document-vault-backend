import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditLogsService } from './audit-logs.service';
import { AuditLogResponseDto } from './dto/audit-log-response.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';


@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get('document/:documentId')
  @ApiOperation({ summary: 'Get audit logs for a specific document' })
  @ApiResponse({ status: 200, description: 'List of audit logs', type: [AuditLogResponseDto] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiBearerAuth()
  findByDocument(
    @Param('documentId') documentId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.auditLogsService.findByDocument(documentId, page, limit);
  }

  @Get('user')
  @ApiOperation({ summary: 'Get audit logs for the current user' })
  @ApiResponse({ status: 200, description: 'List of audit logs', type: [AuditLogResponseDto] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiBearerAuth()
  findByUser(@Query('page') page = 1, @Query('limit') limit = 50, @Req() req: any) {
    return this.auditLogsService.findByUser(req.user.id, page, limit);
  }
}
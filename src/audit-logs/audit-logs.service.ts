import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditLogAction } from './entities/audit-log.entity';

interface CreateAuditLogParams {
  action: AuditLogAction;
  documentId: string;
  userId?: string;
  accessLinkId?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
  ) {}

  async createAuditLog(params: CreateAuditLogParams): Promise<AuditLog> {
    const auditLog = this.auditLogsRepository.create({
      action: params.action,
      documentId: params.documentId,
      userId: params.userId,
      accessLinkId: params.accessLinkId,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });

    return this.auditLogsRepository.save(auditLog);
  }

  async findByDocument(documentId: string, page = 1, limit = 50) {
    const [logs, total] = await this.auditLogsRepository.findAndCount({
      where: { documentId },
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findByUser(userId: string, page = 1, limit = 50) {
    const [logs, total] = await this.auditLogsRepository.findAndCount({
      where: { userId },
      order: { timestamp: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // In audit-logs.service.ts
  async deleteAuditLogsByDocumentId(documentId: string) {
    return this.auditLogsRepository.delete({ documentId });
  }
}

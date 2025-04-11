import { ApiProperty } from '@nestjs/swagger';
import { AuditLogAction } from '../entities/audit-log.entity';

export class AuditLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: AuditLogAction })
  action: AuditLogAction;

  @ApiProperty({ required: false })
  userId?: string;

  @ApiProperty({ required: false })
  accessLinkId?: string;

  @ApiProperty()
  documentId: string;

  @ApiProperty({ required: false })
  ipAddress?: string;

  @ApiProperty()
  timestamp: Date;
}

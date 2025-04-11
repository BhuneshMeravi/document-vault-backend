import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessLinksController } from './access-links.controller';
import { PublicAccessController } from './access-links.controller';
import { AccessLinksService } from './access-links.service';
import { AccessLink } from './entities/access-link.entity';
import { DocumentsModule } from '../documents/documents.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccessLink]),
    DocumentsModule,
    AuditLogsModule,
  ],
  controllers: [AccessLinksController, PublicAccessController],
  providers: [AccessLinksService],
  exports: [AccessLinksService],
})
export class AccessLinksModule {}
import { Module } from '@nestjs/common';
// import { PaginationService } from './services/pagination.service';
import { EmailService } from './services/email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class CommonModule {}

// PaginationService,
// PaginationService,

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateDocumentDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
  
  @ApiProperty({ default: true })
  @IsOptional()
  encrypt?: boolean;
}
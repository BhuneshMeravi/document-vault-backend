import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateDocumentDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  filename?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
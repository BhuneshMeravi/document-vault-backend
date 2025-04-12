import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateDocumentDto {

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;
  
  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  encrypt?: boolean;
}
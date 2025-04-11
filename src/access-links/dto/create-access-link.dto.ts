import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsDate, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAccessLinkDto {
  @ApiProperty()
  @IsUUID()
  documentId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @ApiProperty({ required: false, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxViews?: number;
}
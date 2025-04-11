import { ApiProperty } from '@nestjs/swagger';

export class AccessLinkResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  documentId: string;

  @ApiProperty()
  accessUrl: string;

  @ApiProperty({ required: false })
  expiresAt?: Date;

  @ApiProperty()
  maxViews: number;

  @ApiProperty()
  currentViews: number;

  @ApiProperty()
  createdAt: Date;
}
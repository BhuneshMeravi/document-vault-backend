import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty({ message: 'Email is required' })
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  name: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @IsNotEmpty({ message: 'Password is required' })
  @ApiProperty({ example: 'password123', description: 'User password' })
  password: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'user', description: 'User role', default: 'user' })
    role?: string;
}
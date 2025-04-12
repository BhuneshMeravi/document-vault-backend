import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert } from 'typeorm';
import { Document } from '../../documents/entities/document.entity';
import { AccessLink } from '../../access-links/entities/access-link.entity';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcryptjs';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: 'The unique identifier of the user' })
  id: string;

  @Column({ unique: true })
  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  email: string;

  @Column()
  @Exclude()
  password: string; // This will store the hashed password

  @Column()
  @ApiProperty({ description: 'User full name', example: 'John Doe' })
  name: string;

  @Column({ default: false })
  @ApiProperty({ description: 'Whether the user email is verified' })
  isEmailVerified: boolean;

  @Column({ default: 'user' })
  @ApiProperty({ description: 'User role', enum: ['user', 'admin'] })
  role: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Document, document => document.owner)
  documents: Document[];

  @OneToMany(() => AccessLink, accessLink => accessLink.createdBy)
  accessLinks: AccessLink[];

  @BeforeInsert()
  async hashPassword() {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
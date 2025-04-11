import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Document } from '../../documents/entities/document.entity';
import { User } from '../../users/entities/user.entity';

@Entity('access_links')
export class AccessLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  token: string;

  @Column({ nullable: true })
  expiresAt: Date;

  @Column({ default: 0 })
  maxViews: number;

  @Column({ default: 0 })
  currentViews: number;

  @Column()
  createdById: string;

  @ManyToOne(() => User, user => user.accessLinks)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  documentId: string;

  @ManyToOne(() => Document, document => document.accessLinks)
  @JoinColumn({ name: 'documentId' })
  document: Document;
}
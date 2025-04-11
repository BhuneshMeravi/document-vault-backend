import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Document } from '../../documents/entities/document.entity';

export enum AuditLogAction {
  UPLOAD = 'UPLOAD',
  DOWNLOAD = 'DOWNLOAD',
  VIEW = 'VIEW',
  SHARE = 'SHARE',
  DELETE = 'DELETE',
  UPDATE = 'UPDATE',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AuditLogAction,
  })
  action: AuditLogAction;

  @Column({ nullable: true })
  userId: string;

  @Column({ nullable: true })
  accessLinkId: string;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  documentId: string;

  @ManyToOne(() => Document, document => document.auditLogs)
  @JoinColumn({ name: 'documentId' })
  document: Document;
}
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { AccessLink } from '../../access-links/entities/access-link.entity';
import { AuditLog } from '../../audit-logs/entities/audit-log.entity';
import { User } from '../../users/entities/user.entity';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  filename: string;

  @Column({ nullable: true })
  description: string;
  
  @Column()
  contentType: string;

  @Column()
  size: number;

  @Column()
  path: string;

  @Column()
  hash: string;

  @Column()
  encryptionIv: string;

  @Column({ default: true })
  isEncrypted: boolean;

  @Column()
  ownerId: string;

  @ManyToOne(() => User, user => user.documents)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => AccessLink, accessLink => accessLink.document)
  accessLinks: AccessLink[];

  @OneToMany(() => AuditLog, auditLog => auditLog.document, { cascade: true, onDelete: 'CASCADE' })
  auditLogs: AuditLog[];
}

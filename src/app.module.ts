import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { DocumentsModule } from './documents/documents.module';
import { AccessLinksModule } from './access-links/access-links.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import configuration from './config/configuration';
import { EncryptionModule } from './encryption/encryption.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        ssl: {
          rejectUnauthorized: false,
        },
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: ['error', 'warn'],
      }),
    }),
    AuthModule,
    UsersModule,
    DocumentsModule,
    AccessLinksModule,
    AuditLogsModule,
    EncryptionModule,
  ],
})
export class AppModule {}
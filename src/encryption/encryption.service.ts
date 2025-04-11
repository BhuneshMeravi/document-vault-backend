import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm: string;
  private readonly secretKey: Buffer;
  private readonly ivLength = 16; // For AES, this is always 16 bytes

  constructor(private configService: ConfigService) {
    this.algorithm = this.configService.get<string>('encryption.algorithm') || 'aes-256-cbc';
    const key = this.configService.get<string>('encryption.secretKey');
    if (!key) {
      throw new Error('Encryption secret key is not defined in the configuration.');
    }
    this.secretKey = Buffer.from(key, 'hex');
  }

  encrypt(text: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Prepend IV to the encrypted text for decryption later
    return iv.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText: string): string {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedData = textParts[1];
    
    const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);
    
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Generate a hash for the file content
  generateHash(content: Buffer): string {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }
}
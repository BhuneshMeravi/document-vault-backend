import { Injectable, Logger, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { Otp, OtpType } from '../entities/otp.entity';
import { User } from '../../users/entities/user.entity';
import { EmailService } from '../../common/services/email.service';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    @InjectRepository(Otp)
    private otpsRepository: Repository<Otp>,
    private emailService: EmailService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  // Generate a random 6-digit OTP
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Create and save OTP for a user
  async createOtp(userId: string, type: OtpType): Promise<Otp> {
    try {
      const user = await this.usersService.findOne(userId);
      
      // Check if there's an existing unused OTP
      const existingOtp = await this.otpsRepository.findOne({
        where: {
          userId,
          type,
          isUsed: false,
          expiresAt: MoreThan(new Date()),
        },
      });

      // If an existing valid OTP is found, return it
      if (existingOtp) {
        return existingOtp;
      }

      // Generate a new OTP
      const code = this.generateOtp();
      
      // Set expiration (10 minutes)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      // Create and save the OTP
      const otp = this.otpsRepository.create({
        code,
        type,
        userId: user.id,
        expiresAt,
      });

      return await this.otpsRepository.save(otp);
    } catch (error) {
      this.logger.error(`Failed to create OTP for user ${userId}`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to create verification code');
    }
  }

  // Send email verification OTP
  async sendEmailVerificationOtp(userId: string): Promise<void> {
    try {
      const user = await this.usersService.findOne(userId);
      
      if (user.isEmailVerified) {
        throw new BadRequestException('Email is already verified');
      }

      const otp = await this.createOtp(userId, OtpType.EMAIL_VERIFICATION);
      await this.emailService.sendOtpEmail(user.email, otp.code);
    } catch (error) {
      this.logger.error(`Failed to send verification OTP for user ${userId}`, error);
      throw error;
    }
  }

  // Send password reset OTP
  async sendPasswordResetOtp(email: string): Promise<void> {
    try {
      const user = await this.usersService.findByEmail(email);
      
      if (!user) {
        // For security reasons, don't reveal if email exists or not
        this.logger.warn(`Password reset attempted for non-existent email: ${email}`);
        return;
      }

      const otp = await this.createOtp(user.id, OtpType.PASSWORD_RESET);
      await this.emailService.sendPasswordResetOtp(email, otp.code);
    } catch (error) {
      this.logger.error(`Failed to send password reset OTP for ${email}`, error);
      // Don't reveal if email exists or not
      return;
    }
  }

  // Verify OTP
  async verifyOtp(userId: string, code: string, type: OtpType): Promise<boolean> {
    try {
      const otp = await this.otpsRepository.findOne({
        where: {
          userId,
          code,
          type,
          isUsed: false,
        },
      });

      if (!otp) {
        throw new BadRequestException('Invalid verification code');
      }

      if (new Date() > otp.expiresAt) {
        throw new BadRequestException('Verification code has expired');
      }

      // Mark OTP as used
      otp.isUsed = true;
      await this.otpsRepository.save(otp);

      return true;
    } catch (error) {
      this.logger.error(`OTP verification failed for user ${userId}`, error);
      throw error;
    }
  }

  // Verify email with OTP
  async verifyEmail(userId: string, code: string): Promise<User> {
    try {
      const isValid = await this.verifyOtp(userId, code, OtpType.EMAIL_VERIFICATION);
      
      if (isValid) {
        // Update user's email verification status
        const user = await this.usersService.update(userId, { isEmailVerified: true });
        return user;
      }
      throw new BadRequestException('Invalid verification code');
    } catch (error) {
      this.logger.error(`Email verification failed for user ${userId}`, error);
      throw error;
    }
  }

  // Reset password with OTP
  async resetPasswordWithOtp(email: string, code: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.usersService.findByEmail(email);
      
      if (!user) {
        throw new BadRequestException('Invalid email');
      }

      const isValid = await this.verifyOtp(user.id, code, OtpType.PASSWORD_RESET);
      
      if (isValid) {
        // Hash the new password manually since the @BeforeInsert hook won't run on update
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update with hashed password
        await this.usersService.update(user.id, { password: hashedPassword });
        return true;
      }
      
      return false;
    } catch (error) {
      this.logger.error(`Password reset failed for ${email}`, error);
      throw error;
    }
  }
}
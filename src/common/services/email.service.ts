import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // For a production app, you'd use something like SendGrid or Amazon SES
    // This is a sample setup for development

    // let testAccount = nodemailer.createTestAccount();

    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST', 'smtp.ethereal.email'),
      port: this.configService.get('EMAIL_PORT', 587),
      secure: false,
      auth: {
        user: 'isabell.gibson55@ethereal.email',
        pass: 'S2pjABWSbg18n6FN2u',
      },
    });
  }

  async sendOtpEmail(to: string, otp: string): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get('EMAIL_FROM', 'no-reply@yourdomain.com'),
        to,
        subject: 'Email Verification OTP',
        text: `Your verification code is: ${otp}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Verification</h2>
            <p>Thank you for registering. Please use the code below to verify your email address:</p>
            <div style="background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this email, please ignore it.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${to}`, error);
      throw new Error('Failed to send email');
    }
  }

  async sendPasswordResetOtp(to: string, otp: string): Promise<void> {
    try {
      const mailOptions = {
        from: this.configService.get('EMAIL_FROM', 'no-reply@yourdomain.com'),
        to: "iambhunesh@gmail.com",
        subject: 'Password Reset OTP',
        text: `Your password reset code is: ${otp}. It will expire in 10 minutes.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset</h2>
            <p>You have requested to reset your password. Please use the code below:</p>
            <div style="background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this, please secure your account immediately.</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset OTP email sent to ${to}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset OTP email to ${to}`,
        error,
      );
      throw new Error('Failed to send email');
    }
  }
}

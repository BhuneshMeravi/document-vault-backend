import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerificationService } from './services/verification.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private verificationService: VerificationService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        return null;
      }

      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        return null;
      }

      // We don't want to expose the password
      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      throw new InternalServerErrorException('Error validating user');
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const user = await this.validateUser(loginDto.email, loginDto.password);
      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const payload = { 
        sub: user.id, 
        email: user.email,
        role: user.role
      };
      
      return {
        user,
        accessToken: this.jwtService.sign(payload),
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error during login');
    }
  }

  async register(registerDto: RegisterDto) {
    try {
      const user = await this.usersService.create(registerDto);
      
      const payload = { 
        sub: user.id, 
        email: user.email,
        role: user.role
      };
      
      // Send verification email
    try {
        await this.verificationService.sendEmailVerificationOtp(user.id);
      } catch (error) {
        // this.logger.error(`Failed to send verification email on registration: ${error.message}`);
        throw error
        // Continue with registration even if email sending fails
      }
      
      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken: this.jwtService.sign(payload),
      };
    } catch (error) {
      throw error; // The users service already handles specific errors
    }
  }
}
import { 
    Controller, 
    Post, 
    Body, 
    UseGuards, 
    HttpCode, 
    HttpStatus,
    Request,
    BadRequestException,
    InternalServerErrorException,
    UnauthorizedException,
    Response
  } from '@nestjs/common';
  import { AuthService } from './auth.service';
  import { LocalAuthGuard } from './guards/local-auth.guard';
  import { RegisterDto } from './dto/register.dto';
  import { LoginDto } from './dto/login.dto';
  import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
  import { VerifyEmailDto } from './dto/verify-email.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerificationService } from './services/verification.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
  
  @ApiTags('auth')
  @Controller('auth')
  export class AuthController {
    constructor(private authService: AuthService,
        private verificationService: VerificationService,
    ) {}
  
    @Post('register')
    @ApiOperation({ summary: 'Register a new user' })
    @ApiBody({ type: RegisterDto })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'User successfully registered' })
    @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Email already in use' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data' })
    async register(@Body() registerDto: RegisterDto, @Response() res) {
      try {
        return await this.authService.register(registerDto, res);
      } catch (error) {
        if (error.status === HttpStatus.CONFLICT) {
          throw error;
        }
        if (error.status === HttpStatus.BAD_REQUEST) {
          throw new BadRequestException(error.message);
        }
        throw new InternalServerErrorException('Registration failed');
      }
    }
  
    @UseGuards(LocalAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('login')
    @ApiOperation({ summary: 'Login with email and password' })
    @ApiBody({ type: LoginDto })
    @ApiResponse({ status: HttpStatus.OK, description: 'Login successful' })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
    async login(@Body() loginDto: LoginDto, @Response() res) {
      try {
        return await this.authService.login(loginDto, res);
      } catch (error) {
        if (error.status === HttpStatus.UNAUTHORIZED) {
          throw error;
        }
        throw new InternalServerErrorException('Login failed');
      }
    }

    @Post('send-verification-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send email verification OTP' })
  @ApiResponse({ status: 200, description: 'Verification email sent' })
  @ApiResponse({ status: 400, description: 'Email already verified' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async sendVerificationEmail(@Request() req) {
    await this.verificationService.sendEmailVerificationOtp(req.user.id);
    return { message: 'Verification email sent successfully' };
  }

  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify email with OTP' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async verifyEmail(@Request() req, @Body() verifyEmailDto: VerifyEmailDto) {
    await this.verificationService.verifyEmail(req.user.id, verifyEmailDto.code);
    return { message: 'Email verified successfully' };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset OTP' })
  @ApiBody({ type: RequestPasswordResetDto })
  @ApiResponse({ status: 200, description: 'If email exists, reset instructions sent' })
  async forgotPassword(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    await this.verificationService.sendPasswordResetOtp(requestPasswordResetDto.email);
    // For security, always return success even if email doesn't exist
    return { message: 'If your email is registered, you will receive password reset instructions' };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using OTP' })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  @ApiResponse({ status: 400, description: 'Invalid or expired code' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.verificationService.resetPasswordWithOtp(
      resetPasswordDto.email,
      resetPasswordDto.code,
      resetPasswordDto.newPassword,
    );
    return { message: 'Password reset successfully' };
  }

  @Post('logout')
  async logout(@Response() res) {
    // res.clearCookie('auth_token');
    return res.status(HttpStatus.OK).json({
      message: 'Logged out successfully',
    });
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('verify')
  async verify(@Request() req) {
    if (!req.user) {
      throw new UnauthorizedException();
    }
    
    return {
      user: req.user,
    };
  }
}
  
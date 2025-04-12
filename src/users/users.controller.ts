import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    UnauthorizedException,
    Request,
    NotFoundException,
    ConflictException,
    InternalServerErrorException,
    Query,
  } from '@nestjs/common';
  import { UsersService } from './users.service';
  import { CreateUserDto } from './dto/create-user.dto';
  import { UpdateUserDto } from './dto/update-user.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
  import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
  
  @ApiTags('users')
  @Controller('users')
  export class UsersController {
    constructor(private readonly usersService: UsersService) {}
  
    @UseGuards(JwtAuthGuard)
    @Get()
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all users (admin only)' })
    @ApiResponse({ status: 200, description: 'Return all users' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
    async findAll(@Request() req, @Query() paginationQuery: PaginationQueryDto) {
      try {
        // Only admin can access all users
        if (req.user.role !== 'admin') {
          throw new UnauthorizedException('Admin access required');
        }
        return this.usersService.findAll(paginationQuery);
      } catch (error) {
        if (error instanceof UnauthorizedException) {
          throw error;
        }
        throw new InternalServerErrorException('Error retrieving users');
      }
    }
  
    @UseGuards(JwtAuthGuard)
    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Return the current user' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getProfile(@Request() req) {
      try {
        return this.usersService.findOne(req.user.id);
      } catch (error) {
        throw new InternalServerErrorException('Error retrieving profile');
      }
    }
  
    @UseGuards(JwtAuthGuard)
    @Get(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiResponse({ status: 200, description: 'Return a user by ID' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async findOne(@Param('id') id: string, @Request() req) {
      try {
        // Users can only access their own info unless they're admin
        if (req.user.id !== id && req.user.role !== 'admin') {
          throw new UnauthorizedException('Access denied');
        }
        return this.usersService.findOne(id);
      } catch (error) {
        if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
          throw error;
        }
        throw new InternalServerErrorException('Error retrieving user');
      }
    }
  
    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update user' })
    @ApiResponse({ status: 200, description: 'User updated successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Request() req) {
      try {
        // Users can only update their own info unless they're admin
        if (req.user.id !== id && req.user.role !== 'admin') {
          throw new UnauthorizedException('Access denied');
        }
        return this.usersService.update(id, updateUserDto);
      } catch (error) {
        if (error instanceof NotFoundException || error instanceof UnauthorizedException || error instanceof ConflictException) {
          throw error;
        }
        throw new InternalServerErrorException('Error updating user');
      }
    }
  
    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete user' })
    @ApiResponse({ status: 200, description: 'User deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async remove(@Param('id') id: string, @Request() req) {
      try {
        // Users can only delete their own account unless they're admin
        if (req.user.id !== id && req.user.role !== 'admin') {
          throw new UnauthorizedException('Access denied');
        }
        await this.usersService.remove(id);
        return { message: 'User deleted successfully' };
      } catch (error) {
        if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
          throw error;
        }
        throw new InternalServerErrorException('Error deleting user');
      }
    }
  }
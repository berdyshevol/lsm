import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from './user.entity';
import { UsersService } from './users.service';
import { UpdateRoleDto } from './dto/update-role.dto';

@ApiTags('users')
@ApiCookieAuth('access_token')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of all users without passwords',
  })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/role')
  @ApiOperation({ summary: "Change a user's role (admin only)" })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 400, description: 'Invalid role or UUID' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — not admin or self-role change',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateRole(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    const adminId = (req.user as { id: string }).id;
    if (adminId === id) {
      throw new ForbiddenException('Cannot change your own role');
    }
    return this.usersService.updateRole(id, dto.role);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
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
import { UserRole } from '../users/user.entity';
import { CoursesService } from './courses.service';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@ApiTags('modules')
@ApiCookieAuth('access_token')
@Controller('courses/:courseId/modules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Instructor)
export class ModulesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'List modules with nested lessons for a course' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'List of modules with lessons' })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — not an instructor or not owner',
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  findAll(
    @Req() req: Request,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    const instructorId = (req.user as { id: string }).id;
    return this.coursesService.findModulesByCourse(courseId, instructorId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a module in a course' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({ status: 201, description: 'Module created' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid UUID' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — not an instructor or not owner',
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  create(
    @Req() req: Request,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateModuleDto,
  ) {
    const instructorId = (req.user as { id: string }).id;
    return this.coursesService.createModule(courseId, instructorId, dto);
  }

  @Patch(':moduleId')
  @ApiOperation({ summary: 'Update a module' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiParam({ name: 'moduleId', description: 'Module UUID' })
  @ApiResponse({ status: 200, description: 'Module updated' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid UUID' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — not an instructor or not owner',
  })
  @ApiResponse({ status: 404, description: 'Course or module not found' })
  update(
    @Req() req: Request,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: UpdateModuleDto,
  ) {
    const instructorId = (req.user as { id: string }).id;
    return this.coursesService.updateModule(
      courseId,
      moduleId,
      instructorId,
      dto,
    );
  }

  @Delete(':moduleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a module and its lessons' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiParam({ name: 'moduleId', description: 'Module UUID' })
  @ApiResponse({ status: 200, description: 'Module deleted' })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — not an instructor or not owner',
  })
  @ApiResponse({ status: 404, description: 'Course or module not found' })
  async remove(
    @Req() req: Request,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
  ) {
    const instructorId = (req.user as { id: string }).id;
    await this.coursesService.removeModule(courseId, moduleId, instructorId);
    return { message: 'Module deleted' };
  }
}

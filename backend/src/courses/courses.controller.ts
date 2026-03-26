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
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiTags('courses')
@ApiCookieAuth('access_token')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Instructor)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ status: 201, description: 'Course created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden — not an instructor' })
  create(@Req() req: Request, @Body() dto: CreateCourseDto) {
    const instructorId = (req.user as { id: string }).id;
    return this.coursesService.create(instructorId, dto);
  }

  @Get('my')
  @ApiOperation({
    summary: 'List courses owned by the authenticated instructor',
  })
  @ApiResponse({ status: 200, description: 'List of own courses' })
  @ApiResponse({ status: 403, description: 'Forbidden — not an instructor' })
  findMy(@Req() req: Request) {
    const instructorId = (req.user as { id: string }).id;
    return this.coursesService.findByInstructor(instructorId);
  }

  @Get()
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Admin)
  @ApiOperation({ summary: 'List all courses (catalog)' })
  @ApiResponse({
    status: 200,
    description: 'List of all courses with module and lesson counts',
  })
  findAll() {
    return this.coursesService.findAll();
  }

  @Get('all')
  @Roles(UserRole.Admin)
  @ApiOperation({
    summary: 'List all courses (admin — includes instructor name)',
  })
  @ApiResponse({
    status: 200,
    description: 'All platform courses with instructor name and counts',
  })
  @ApiResponse({ status: 403, description: 'Forbidden — admin only' })
  findAllAdmin() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Admin)
  @ApiOperation({ summary: 'Get course detail with modules and lessons' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({
    status: 200,
    description: 'Course detail with nested structure',
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findOneWithDetails(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a course' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'Course updated' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid UUID' })
  @ApiResponse({ status: 403, description: 'Forbidden — not owner' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  update(
    @Req() req: Request,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    const instructorId = (req.user as { id: string }).id;
    return this.coursesService.update(id, instructorId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a course' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'Course deleted' })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 403, description: 'Forbidden — not owner' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async remove(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
    const instructorId = (req.user as { id: string }).id;
    await this.coursesService.remove(id, instructorId);
    return { message: 'Course deleted' };
  }
}

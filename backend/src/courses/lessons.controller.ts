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
  Inject,
  forwardRef,
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
import { UserRole } from '../users/user.entity';
import { CoursesService } from './courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@ApiTags('lessons')
@ApiCookieAuth('access_token')
@Controller('courses/:courseId/modules/:moduleId/lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Instructor)
export class LessonsController {
  constructor(
    private readonly coursesService: CoursesService,
    @Inject(forwardRef(() => EnrollmentsService))
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  @Get(':lessonId')
  @Roles(UserRole.Student, UserRole.Instructor, UserRole.Admin)
  @ApiOperation({
    summary: 'Get lesson content (enrollment required for students)',
  })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiParam({ name: 'moduleId', description: 'Module UUID' })
  @ApiParam({ name: 'lessonId', description: 'Lesson UUID' })
  @ApiResponse({ status: 200, description: 'Lesson content returned' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — not enrolled or not owner',
  })
  @ApiResponse({
    status: 404,
    description: 'Course, module, or lesson not found',
  })
  async getLessonContent(
    @Req() req: Request,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    const user = req.user as { id: string; role: UserRole };
    const userId = user.id;
    const role = user.role;

    if (role === UserRole.Admin) {
      return this.coursesService.findLessonWithContent(
        courseId,
        moduleId,
        lessonId,
      );
    } else if (role === UserRole.Instructor) {
      const course = await this.coursesService.findOneOrFail(courseId);
      if (course.instructorId !== userId) {
        throw new ForbiddenException('Not your course');
      }
      return this.coursesService.findLessonWithContent(
        courseId,
        moduleId,
        lessonId,
      );
    } else {
      const enrolled = await this.enrollmentsService.isEnrolled(
        userId,
        courseId,
      );
      if (!enrolled) {
        throw new ForbiddenException('Not enrolled in this course');
      }
      return this.coursesService.findLessonWithContent(
        courseId,
        moduleId,
        lessonId,
      );
    }
  }

  @Post()
  @ApiOperation({ summary: 'Create a lesson in a module' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiParam({ name: 'moduleId', description: 'Module UUID' })
  @ApiResponse({ status: 201, description: 'Lesson created' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid UUID' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — not an instructor or not owner',
  })
  @ApiResponse({ status: 404, description: 'Course or module not found' })
  create(
    @Req() req: Request,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Body() dto: CreateLessonDto,
  ) {
    const instructorId = (req.user as { id: string }).id;
    return this.coursesService.createLesson(
      courseId,
      moduleId,
      instructorId,
      dto,
    );
  }

  @Patch(':lessonId')
  @ApiOperation({ summary: 'Update a lesson' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiParam({ name: 'moduleId', description: 'Module UUID' })
  @ApiParam({ name: 'lessonId', description: 'Lesson UUID' })
  @ApiResponse({ status: 200, description: 'Lesson updated' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid UUID' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — not an instructor or not owner',
  })
  @ApiResponse({
    status: 404,
    description: 'Course, module, or lesson not found',
  })
  update(
    @Req() req: Request,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: UpdateLessonDto,
  ) {
    const instructorId = (req.user as { id: string }).id;
    return this.coursesService.updateLesson(
      courseId,
      moduleId,
      lessonId,
      instructorId,
      dto,
    );
  }

  @Delete(':lessonId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a lesson' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiParam({ name: 'moduleId', description: 'Module UUID' })
  @ApiParam({ name: 'lessonId', description: 'Lesson UUID' })
  @ApiResponse({ status: 200, description: 'Lesson deleted' })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden — not an instructor or not owner',
  })
  @ApiResponse({
    status: 404,
    description: 'Course, module, or lesson not found',
  })
  async remove(
    @Req() req: Request,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('moduleId', ParseUUIDPipe) moduleId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    const instructorId = (req.user as { id: string }).id;
    await this.coursesService.removeLesson(
      courseId,
      moduleId,
      lessonId,
      instructorId,
    );
    return { message: 'Lesson deleted' };
  }
}

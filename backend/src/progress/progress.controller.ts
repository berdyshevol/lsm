import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
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
import { ProgressService } from './progress.service';

@ApiTags('progress')
@ApiCookieAuth('access_token')
@Controller('progress')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Student)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post('courses/:courseId/lessons/:lessonId/complete')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark a lesson as complete' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiParam({ name: 'lessonId', description: 'Lesson UUID' })
  @ApiResponse({ status: 200, description: 'Progress summary returned' })
  @ApiResponse({ status: 403, description: 'Forbidden — not enrolled' })
  @ApiResponse({ status: 404, description: 'Lesson not found in course' })
  markComplete(
    @Req() req: Request,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    const userId = (req.user as { id: string }).id;
    return this.progressService.markComplete(userId, courseId, lessonId);
  }

  @Get('courses/:courseId')
  @ApiOperation({ summary: 'Get progress for a course' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'Progress summary returned' })
  @ApiResponse({ status: 403, description: 'Forbidden — not enrolled' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  getProgress(
    @Req() req: Request,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    const userId = (req.user as { id: string }).id;
    return this.progressService.getProgress(userId, courseId);
  }
}

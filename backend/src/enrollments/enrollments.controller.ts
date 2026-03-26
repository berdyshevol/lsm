import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
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
import { EnrollmentsService } from './enrollments.service';

@ApiTags('enrollments')
@ApiCookieAuth('access_token')
@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Student)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post('courses/:courseId')
  @ApiOperation({ summary: 'Enroll authenticated student in a course' })
  @ApiParam({ name: 'courseId', description: 'Course UUID' })
  @ApiResponse({ status: 201, description: 'Enrollment created' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 409, description: 'Already enrolled in this course' })
  enroll(
    @Req() req: Request,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    const userId = (req.user as { id: string }).id;
    return this.enrollmentsService.enroll(userId, courseId);
  }

  @Get('my')
  @ApiOperation({
    summary: 'Get all courses the authenticated student is enrolled in',
  })
  @ApiResponse({ status: 200, description: 'List of enrolled courses' })
  findMy(@Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.enrollmentsService.findMyEnrollments(userId);
  }
}

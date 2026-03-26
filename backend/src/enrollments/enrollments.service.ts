import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from './enrollment.entity';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepository: Repository<Enrollment>,
    private readonly coursesService: CoursesService,
  ) {}

  async enroll(userId: string, courseId: string): Promise<Enrollment> {
    // Verify course exists (throws 404 if not)
    await this.coursesService.findOneOrFail(courseId);

    // Check duplicate at application level
    const existing = await this.enrollmentsRepository.findOne({
      where: { userId, courseId },
    });
    if (existing) {
      throw new ConflictException('Already enrolled in this course');
    }

    // Save with DB unique constraint as TOCTOU race safety net
    try {
      const enrollment = this.enrollmentsRepository.create({
        userId,
        courseId,
      });
      return await this.enrollmentsRepository.save(enrollment);
    } catch (error: unknown) {
      // PostgreSQL unique violation code 23505
      if ((error as Record<string, unknown>)?.code === '23505') {
        throw new ConflictException('Already enrolled in this course');
      }
      throw error;
    }
  }

  async findMyEnrollments(userId: string): Promise<Enrollment[]> {
    return this.enrollmentsRepository.find({
      where: { userId },
      relations: ['course', 'course.instructor'],
      order: { enrolledAt: 'DESC' },
    });
  }

  async isEnrolled(userId: string, courseId: string): Promise<boolean> {
    const count = await this.enrollmentsRepository.count({
      where: { userId, courseId },
    });
    return count > 0;
  }
}

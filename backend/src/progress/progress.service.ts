import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { LessonProgress } from './lesson-progress.entity';
import { CoursesService } from '../courses/courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';

export interface ProgressSummary {
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  completedLessonIds: string[];
}

@Injectable()
export class ProgressService {
  private readonly logger = new Logger(ProgressService.name);

  constructor(
    @InjectRepository(LessonProgress)
    private readonly lessonProgressRepository: Repository<LessonProgress>,
    private readonly coursesService: CoursesService,
    private readonly enrollmentsService: EnrollmentsService,
  ) {}

  async markComplete(
    userId: string,
    courseId: string,
    lessonId: string,
  ): Promise<ProgressSummary> {
    const enrolled = await this.enrollmentsService.isEnrolled(userId, courseId);
    if (!enrolled) {
      throw new ForbiddenException('Not enrolled in this course');
    }

    const course = await this.coursesService.findOneWithDetails(courseId);
    const allLessonIds = course.modules.flatMap((m) =>
      m.lessons.map((l) => l.id),
    );
    if (!allLessonIds.includes(lessonId)) {
      throw new NotFoundException('Lesson not found in this course');
    }

    const existing = await this.lessonProgressRepository.findOne({
      where: { userId, lessonId },
    });
    if (!existing) {
      try {
        const record = this.lessonProgressRepository.create({
          userId,
          lessonId,
        });
        await this.lessonProgressRepository.save(record);
      } catch (error: unknown) {
        // PostgreSQL unique violation code 23505 — concurrent request already inserted
        if ((error as Record<string, unknown>)?.code !== '23505') {
          throw error;
        }
      }
    }

    return this.getProgress(userId, courseId);
  }

  async getProgress(
    userId: string,
    courseId: string,
  ): Promise<ProgressSummary> {
    const enrolled = await this.enrollmentsService.isEnrolled(userId, courseId);
    if (!enrolled) {
      throw new ForbiddenException('Not enrolled in this course');
    }

    const course = await this.coursesService.findOneWithDetails(courseId);
    const allLessonIds = course.modules.flatMap((m) =>
      m.lessons.map((l) => l.id),
    );
    const totalLessons = allLessonIds.length;

    if (totalLessons === 0) {
      return {
        totalLessons: 0,
        completedLessons: 0,
        percentage: 0,
        completedLessonIds: [],
      };
    }

    const completedRecords = await this.lessonProgressRepository.find({
      where: { userId, lessonId: In(allLessonIds) },
    });
    const completedLessons = completedRecords.length;
    const completedLessonIds = completedRecords.map((r) => r.lessonId);
    const percentage = Math.round((completedLessons / totalLessons) * 100);

    return { totalLessons, completedLessons, percentage, completedLessonIds };
  }
}

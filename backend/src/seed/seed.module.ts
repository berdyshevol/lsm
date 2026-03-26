import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Course } from '../courses/course.entity';
import { CourseModule as CourseModuleEntity } from '../courses/course-module.entity';
import { Lesson } from '../courses/lesson.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { LessonProgress } from '../progress/lesson-progress.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Course,
      CourseModuleEntity,
      Lesson,
      Enrollment,
      LessonProgress,
    ]),
  ],
  providers: [SeedService],
})
export class SeedModule {}

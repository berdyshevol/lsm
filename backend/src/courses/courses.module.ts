import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './course.entity';
import { CourseModule } from './course-module.entity';
import { Lesson } from './lesson.entity';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { ModulesController } from './modules.controller';
import { LessonsController } from './lessons.controller';
import { EnrollmentsModule } from '../enrollments/enrollments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Course, CourseModule, Lesson]),
    forwardRef(() => EnrollmentsModule),
  ],
  controllers: [CoursesController, ModulesController, LessonsController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}

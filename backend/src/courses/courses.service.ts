import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from './course.entity';
import { CourseModule } from './course-module.entity';
import { Lesson } from './lesson.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
    @InjectRepository(CourseModule)
    private readonly courseModulesRepository: Repository<CourseModule>,
    @InjectRepository(Lesson)
    private readonly lessonsRepository: Repository<Lesson>,
  ) {}

  // ─── Course Methods ───────────────────────────────────────────────────────

  async create(instructorId: string, dto: CreateCourseDto): Promise<Course> {
    const course = this.coursesRepository.create({ ...dto, instructorId });
    return this.coursesRepository.save(course);
  }

  async findByInstructor(instructorId: string): Promise<Course[]> {
    return this.coursesRepository.find({
      where: { instructorId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneOrFail(id: string): Promise<Course> {
    const course = await this.coursesRepository.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async findAll(): Promise<
    (Omit<Course, 'modules'> & { moduleCount: number; lessonCount: number })[]
  > {
    const courses = await this.coursesRepository.find({
      relations: ['instructor', 'modules', 'modules.lessons'],
      order: { createdAt: 'DESC' },
    });
    return courses.map((course) => {
      const moduleCount = course.modules?.length ?? 0;
      const lessonCount =
        course.modules?.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) ??
        0;
      // Strip nested modules/lessons from catalog response (AC #1: counts only)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { modules, ...courseWithoutModules } = course;
      return { ...courseWithoutModules, moduleCount, lessonCount };
    });
  }

  async findOneWithDetails(id: string): Promise<Course> {
    const course = await this.coursesRepository.findOne({
      where: { id },
      relations: ['instructor', 'modules', 'modules.lessons'],
      order: { modules: { orderIndex: 'ASC', lessons: { orderIndex: 'ASC' } } },
    });
    if (!course) throw new NotFoundException('Course not found');
    // Strip lesson content from response
    course.modules?.forEach((m) => {
      m.lessons?.forEach((l) => {
        delete (l as unknown as Record<string, unknown>)['content'];
      });
    });
    return course;
  }

  async update(
    id: string,
    instructorId: string,
    dto: UpdateCourseDto,
  ): Promise<Course> {
    const course = await this.findOneOrFail(id);
    if (course.instructorId !== instructorId)
      throw new ForbiddenException('Not your course');
    Object.assign(course, dto);
    return this.coursesRepository.save(course);
  }

  async remove(id: string, instructorId: string): Promise<void> {
    const course = await this.findOneOrFail(id);
    if (course.instructorId !== instructorId)
      throw new ForbiddenException('Not your course');
    await this.coursesRepository.remove(course);
  }

  // ─── Ownership Helper ─────────────────────────────────────────────────────

  private async verifyCourseOwnership(
    courseId: string,
    instructorId: string,
  ): Promise<Course> {
    const course = await this.findOneOrFail(courseId);
    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('Not your course');
    }
    return course;
  }

  // ─── Module Methods ───────────────────────────────────────────────────────

  async createModule(
    courseId: string,
    instructorId: string,
    dto: CreateModuleDto,
  ): Promise<CourseModule> {
    await this.verifyCourseOwnership(courseId, instructorId);
    const module = this.courseModulesRepository.create({ ...dto, courseId });
    return this.courseModulesRepository.save(module);
  }

  async findModulesByCourse(
    courseId: string,
    instructorId: string,
  ): Promise<CourseModule[]> {
    await this.verifyCourseOwnership(courseId, instructorId);
    return this.courseModulesRepository.find({
      where: { courseId },
      relations: ['lessons'],
      order: { orderIndex: 'ASC', lessons: { orderIndex: 'ASC' } },
    });
  }

  async updateModule(
    courseId: string,
    moduleId: string,
    instructorId: string,
    dto: UpdateModuleDto,
  ): Promise<CourseModule> {
    await this.verifyCourseOwnership(courseId, instructorId);
    const module = await this.courseModulesRepository.findOne({
      where: { id: moduleId, courseId },
    });
    if (!module) throw new NotFoundException('Module not found');
    Object.assign(module, dto);
    return this.courseModulesRepository.save(module);
  }

  async removeModule(
    courseId: string,
    moduleId: string,
    instructorId: string,
  ): Promise<void> {
    await this.verifyCourseOwnership(courseId, instructorId);
    const module = await this.courseModulesRepository.findOne({
      where: { id: moduleId, courseId },
    });
    if (!module) throw new NotFoundException('Module not found');
    await this.courseModulesRepository.remove(module);
  }

  // ─── Lesson Methods ───────────────────────────────────────────────────────

  async createLesson(
    courseId: string,
    moduleId: string,
    instructorId: string,
    dto: CreateLessonDto,
  ): Promise<Lesson> {
    await this.verifyCourseOwnership(courseId, instructorId);
    const module = await this.courseModulesRepository.findOne({
      where: { id: moduleId, courseId },
    });
    if (!module) throw new NotFoundException('Module not found');
    const lesson = this.lessonsRepository.create({ ...dto, moduleId });
    return this.lessonsRepository.save(lesson);
  }

  async updateLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
    instructorId: string,
    dto: UpdateLessonDto,
  ): Promise<Lesson> {
    await this.verifyCourseOwnership(courseId, instructorId);
    const module = await this.courseModulesRepository.findOne({
      where: { id: moduleId, courseId },
    });
    if (!module) throw new NotFoundException('Module not found');
    const lesson = await this.lessonsRepository.findOne({
      where: { id: lessonId, moduleId },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    Object.assign(lesson, dto);
    return this.lessonsRepository.save(lesson);
  }

  async removeLesson(
    courseId: string,
    moduleId: string,
    lessonId: string,
    instructorId: string,
  ): Promise<void> {
    await this.verifyCourseOwnership(courseId, instructorId);
    const module = await this.courseModulesRepository.findOne({
      where: { id: moduleId, courseId },
    });
    if (!module) throw new NotFoundException('Module not found');
    const lesson = await this.lessonsRepository.findOne({
      where: { id: lessonId, moduleId },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.lessonsRepository.remove(lesson);
  }

  async findLessonWithContent(
    courseId: string,
    moduleId: string,
    lessonId: string,
  ): Promise<Lesson> {
    const module = await this.courseModulesRepository.findOne({
      where: { id: moduleId, courseId },
    });
    if (!module) throw new NotFoundException('Module not found');
    const lesson = await this.lessonsRepository.findOne({
      where: { id: lessonId, moduleId },
    });
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }
}

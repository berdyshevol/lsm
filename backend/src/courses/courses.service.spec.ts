/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { Course } from './course.entity';
import { CourseModule } from './course-module.entity';
import { Lesson } from './lesson.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

describe('CoursesService', () => {
  let service: CoursesService;

  const mockCoursesRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockModulesRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockLessonsRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const instructorId = 'instructor-uuid-1';
  const courseId = 'course-uuid-1';
  const moduleId = 'module-uuid-1';
  const lessonId = 'lesson-uuid-1';

  const mockCourse: Course = {
    id: courseId,
    title: 'Test Course',
    description: 'A test course description',
    instructorId,
    instructor: {} as any,
    modules: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockModule: CourseModule = {
    id: moduleId,
    title: 'Test Module',
    orderIndex: 0,
    courseId,
    course: {} as any,
    lessons: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockLesson: Lesson = {
    id: lessonId,
    title: 'Test Lesson',
    content: '# Lesson content',
    orderIndex: 0,
    moduleId,
    module: {} as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CoursesService,
        {
          provide: getRepositoryToken(Course),
          useValue: mockCoursesRepository,
        },
        {
          provide: getRepositoryToken(CourseModule),
          useValue: mockModulesRepository,
        },
        {
          provide: getRepositoryToken(Lesson),
          useValue: mockLessonsRepository,
        },
      ],
    }).compile();

    service = module.get<CoursesService>(CoursesService);
  });

  // ─── Course Tests ──────────────────────────────────────────────────────────

  describe('create', () => {
    it('should create and return a course', async () => {
      const dto: CreateCourseDto = {
        title: 'Test Course',
        description: 'A test course description',
      };
      mockCoursesRepository.create.mockReturnValue(mockCourse);
      mockCoursesRepository.save.mockResolvedValue(mockCourse);

      const result = await service.create(instructorId, dto);

      expect(mockCoursesRepository.create).toHaveBeenCalledWith({
        ...dto,
        instructorId,
      });
      expect(mockCoursesRepository.save).toHaveBeenCalledWith(mockCourse);
      expect(result).toEqual(mockCourse);
    });
  });

  describe('findByInstructor', () => {
    it('should return courses owned by the instructor', async () => {
      mockCoursesRepository.find.mockResolvedValue([mockCourse]);

      const result = await service.findByInstructor(instructorId);

      expect(mockCoursesRepository.find).toHaveBeenCalledWith({
        where: { instructorId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockCourse]);
    });

    it('should return empty array when instructor has no courses', async () => {
      mockCoursesRepository.find.mockResolvedValue([]);

      const result = await service.findByInstructor(instructorId);

      expect(result).toEqual([]);
    });
  });

  describe('findOneOrFail', () => {
    it('should return a course when found', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);

      const result = await service.findOneOrFail(courseId);

      expect(mockCoursesRepository.findOne).toHaveBeenCalledWith({
        where: { id: courseId },
      });
      expect(result).toEqual(mockCourse);
    });

    it('should throw NotFoundException when course not found', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneOrFail('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return a course when owner', async () => {
      const dto: UpdateCourseDto = { title: 'Updated Title' };
      const updatedCourse = { ...mockCourse, title: 'Updated Title' };
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);
      mockCoursesRepository.save.mockResolvedValue(updatedCourse);

      const result = await service.update(courseId, instructorId, dto);

      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundException when course does not exist', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', instructorId, {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not the owner', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);

      await expect(
        service.update(courseId, 'other-instructor-id', { title: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should remove the course when owner', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);
      mockCoursesRepository.remove.mockResolvedValue(undefined);

      await service.remove(courseId, instructorId);

      expect(mockCoursesRepository.remove).toHaveBeenCalledWith(mockCourse);
    });

    it('should throw NotFoundException when course does not exist', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent-id', instructorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not the owner', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);

      await expect(
        service.remove(courseId, 'other-instructor-id'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Module Tests ──────────────────────────────────────────────────────────

  describe('createModule', () => {
    it('should create and return a module when course owner', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);
      mockModulesRepository.create.mockReturnValue(mockModule);
      mockModulesRepository.save.mockResolvedValue(mockModule);

      const dto = { title: 'Test Module', orderIndex: 0 };
      const result = await service.createModule(courseId, instructorId, dto);

      expect(mockModulesRepository.create).toHaveBeenCalledWith({
        ...dto,
        courseId,
      });
      expect(result).toEqual(mockModule);
    });

    it('should throw ForbiddenException when not the course owner', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);

      await expect(
        service.createModule(courseId, 'other-instructor', {
          title: 'M',
          orderIndex: 0,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when course not found', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createModule('bad-id', instructorId, {
          title: 'M',
          orderIndex: 0,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findModulesByCourse', () => {
    it('should return modules with lessons when course owner', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);
      mockModulesRepository.find.mockResolvedValue([mockModule]);

      const result = await service.findModulesByCourse(courseId, instructorId);

      expect(mockModulesRepository.find).toHaveBeenCalledWith({
        where: { courseId },
        relations: ['lessons'],
        order: { orderIndex: 'ASC', lessons: { orderIndex: 'ASC' } },
      });
      expect(result).toEqual([mockModule]);
    });

    it('should return empty array when course has no modules', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);
      mockModulesRepository.find.mockResolvedValue([]);

      const result = await service.findModulesByCourse(courseId, instructorId);

      expect(result).toEqual([]);
    });

    it('should throw ForbiddenException when not the course owner', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);

      await expect(
        service.findModulesByCourse(courseId, 'other-instructor'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateModule', () => {
    it('should update and return a module when course owner', async () => {
      const updated = { ...mockModule, title: 'Updated Module' };
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);
      mockModulesRepository.findOne.mockResolvedValue(mockModule);
      mockModulesRepository.save.mockResolvedValue(updated);

      const result = await service.updateModule(
        courseId,
        moduleId,
        instructorId,
        { title: 'Updated Module' },
      );

      expect(result.title).toBe('Updated Module');
    });

    it('should throw NotFoundException when module not found', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);
      mockModulesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateModule(courseId, 'bad-module-id', instructorId, {
          title: 'X',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not the course owner', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);

      await expect(
        service.updateModule(courseId, moduleId, 'other-instructor', {
          title: 'X',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeModule', () => {
    it('should remove the module when course owner', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);
      mockModulesRepository.findOne.mockResolvedValue(mockModule);
      mockModulesRepository.remove.mockResolvedValue(undefined);

      await service.removeModule(courseId, moduleId, instructorId);

      expect(mockModulesRepository.remove).toHaveBeenCalledWith(mockModule);
    });

    it('should throw NotFoundException when module not found', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);
      mockModulesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeModule(courseId, 'bad-module-id', instructorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not the course owner', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);

      await expect(
        service.removeModule(courseId, moduleId, 'other-instructor'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ─── Lesson Tests ──────────────────────────────────────────────────────────

  describe('createLesson', () => {
    it('should create and return a lesson when course owner and module exists', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);
      mockModulesRepository.findOne.mockResolvedValue(mockModule);
      mockLessonsRepository.create.mockReturnValue(mockLesson);
      mockLessonsRepository.save.mockResolvedValue(mockLesson);

      const dto = { title: 'Lesson', content: '# Content', orderIndex: 0 };
      const result = await service.createLesson(
        courseId,
        moduleId,
        instructorId,
        dto,
      );

      expect(mockLessonsRepository.create).toHaveBeenCalledWith({
        ...dto,
        moduleId,
      });
      expect(result).toEqual(mockLesson);
    });

    it('should throw NotFoundException when module not found', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);
      mockModulesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createLesson(courseId, 'bad-module', instructorId, {
          title: 'L',
          content: 'c',
          orderIndex: 0,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not the course owner', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);

      await expect(
        service.createLesson(courseId, moduleId, 'other-instructor', {
          title: 'L',
          content: 'c',
          orderIndex: 0,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateLesson', () => {
    it('should update and return a lesson when owner', async () => {
      const updated = { ...mockLesson, title: 'Updated Lesson' };
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);
      mockModulesRepository.findOne.mockResolvedValue(mockModule);
      mockLessonsRepository.findOne.mockResolvedValue(mockLesson);
      mockLessonsRepository.save.mockResolvedValue(updated);

      const result = await service.updateLesson(
        courseId,
        moduleId,
        lessonId,
        instructorId,
        { title: 'Updated Lesson' },
      );

      expect(result.title).toBe('Updated Lesson');
    });

    it('should throw NotFoundException when lesson not found', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);
      mockModulesRepository.findOne.mockResolvedValue(mockModule);
      mockLessonsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateLesson(courseId, moduleId, 'bad-lesson', instructorId, {
          title: 'X',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when module not found', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);
      mockModulesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateLesson(courseId, 'bad-module', lessonId, instructorId, {
          title: 'X',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not the course owner', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);

      await expect(
        service.updateLesson(courseId, moduleId, lessonId, 'other-instructor', {
          title: 'X',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('removeLesson', () => {
    it('should remove the lesson when owner', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);
      mockModulesRepository.findOne.mockResolvedValue(mockModule);
      mockLessonsRepository.findOne.mockResolvedValue(mockLesson);
      mockLessonsRepository.remove.mockResolvedValue(undefined);

      await service.removeLesson(courseId, moduleId, lessonId, instructorId);

      expect(mockLessonsRepository.remove).toHaveBeenCalledWith(mockLesson);
    });

    it('should throw NotFoundException when lesson not found', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);
      mockModulesRepository.findOne.mockResolvedValue(mockModule);
      mockLessonsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeLesson(courseId, moduleId, 'bad-lesson', instructorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when module not found', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);
      mockModulesRepository.findOne.mockResolvedValue(null);

      await expect(
        service.removeLesson(courseId, 'bad-module', lessonId, instructorId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when not the course owner', async () => {
      mockCoursesRepository.findOne.mockResolvedValue(mockCourse);

      await expect(
        service.removeLesson(courseId, moduleId, lessonId, 'other-instructor'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

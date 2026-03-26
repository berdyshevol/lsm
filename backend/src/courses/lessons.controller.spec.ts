/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { LessonsController } from './lessons.controller';
import { CoursesService } from './courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { Lesson } from './lesson.entity';
import { UserRole } from '../users/user.entity';

describe('LessonsController', () => {
  let controller: LessonsController;

  const mockCoursesService = {
    createLesson: jest.fn(),
    updateLesson: jest.fn(),
    removeLesson: jest.fn(),
    findLessonWithContent: jest.fn(),
    findOneOrFail: jest.fn(),
  };

  const mockEnrollmentsService = {
    isEnrolled: jest.fn(),
  };

  const instructorId = 'instructor-uuid-1';
  const courseId = 'course-uuid-1';
  const moduleId = 'module-uuid-1';
  const lessonId = 'lesson-uuid-1';

  const mockRequest = {
    user: {
      id: instructorId,
      name: 'Instructor',
      email: 'i@test.com',
      role: UserRole.Instructor,
    },
  } as unknown as Request;

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
      controllers: [LessonsController],
      providers: [
        { provide: CoursesService, useValue: mockCoursesService },
        { provide: EnrollmentsService, useValue: mockEnrollmentsService },
      ],
    }).compile();

    controller = module.get<LessonsController>(LessonsController);
  });

  describe('getLessonContent', () => {
    it('should return lesson for admin without checks', async () => {
      const adminReq = {
        user: { id: 'admin-id', role: UserRole.Admin },
      } as unknown as Request;
      mockCoursesService.findLessonWithContent.mockResolvedValue(mockLesson);

      const result = await controller.getLessonContent(
        adminReq,
        courseId,
        moduleId,
        lessonId,
      );

      expect(mockCoursesService.findLessonWithContent).toHaveBeenCalledWith(
        courseId,
        moduleId,
        lessonId,
      );
      expect(result).toEqual(mockLesson);
    });

    it('should return lesson for instructor who owns the course', async () => {
      mockCoursesService.findOneOrFail.mockResolvedValue({
        id: courseId,
        instructorId,
      });
      mockCoursesService.findLessonWithContent.mockResolvedValue(mockLesson);

      const result = await controller.getLessonContent(
        mockRequest,
        courseId,
        moduleId,
        lessonId,
      );

      expect(result).toEqual(mockLesson);
    });

    it('should throw ForbiddenException for instructor who does not own course', async () => {
      mockCoursesService.findOneOrFail.mockResolvedValue({
        id: courseId,
        instructorId: 'other-instructor',
      });

      await expect(
        controller.getLessonContent(mockRequest, courseId, moduleId, lessonId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should return lesson for enrolled student', async () => {
      const studentReq = {
        user: { id: 'student-id', role: UserRole.Student },
      } as unknown as Request;
      mockEnrollmentsService.isEnrolled.mockResolvedValue(true);
      mockCoursesService.findLessonWithContent.mockResolvedValue(mockLesson);

      const result = await controller.getLessonContent(
        studentReq,
        courseId,
        moduleId,
        lessonId,
      );

      expect(mockEnrollmentsService.isEnrolled).toHaveBeenCalledWith(
        'student-id',
        courseId,
      );
      expect(result).toEqual(mockLesson);
    });

    it('should throw ForbiddenException for unenrolled student', async () => {
      const studentReq = {
        user: { id: 'student-id', role: UserRole.Student },
      } as unknown as Request;
      mockEnrollmentsService.isEnrolled.mockResolvedValue(false);

      await expect(
        controller.getLessonContent(studentReq, courseId, moduleId, lessonId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should propagate NotFoundException when lesson not found', async () => {
      mockCoursesService.findOneOrFail.mockResolvedValue({
        id: courseId,
        instructorId,
      });
      mockCoursesService.findLessonWithContent.mockRejectedValue(
        new NotFoundException('Lesson not found'),
      );

      await expect(
        controller.getLessonContent(mockRequest, courseId, moduleId, lessonId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should call service.createLesson and return the created lesson', async () => {
      const dto = { title: 'Test Lesson', content: '# Content', orderIndex: 0 };
      mockCoursesService.createLesson.mockResolvedValue(mockLesson);

      const result = await controller.create(
        mockRequest,
        courseId,
        moduleId,
        dto,
      );

      expect(mockCoursesService.createLesson).toHaveBeenCalledWith(
        courseId,
        moduleId,
        instructorId,
        dto,
      );
      expect(result).toEqual(mockLesson);
    });

    it('should propagate NotFoundException when module not found', async () => {
      mockCoursesService.createLesson.mockRejectedValue(
        new NotFoundException('Module not found'),
      );

      await expect(
        controller.create(mockRequest, courseId, 'bad-module', {
          title: 'L',
          content: 'c',
          orderIndex: 0,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException when not the course owner', async () => {
      mockCoursesService.createLesson.mockRejectedValue(
        new ForbiddenException('Not your course'),
      );

      await expect(
        controller.create(mockRequest, courseId, moduleId, {
          title: 'L',
          content: 'c',
          orderIndex: 0,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should call service.updateLesson and return the updated lesson', async () => {
      const dto = { title: 'Updated Lesson' };
      const updated = { ...mockLesson, title: 'Updated Lesson' };
      mockCoursesService.updateLesson.mockResolvedValue(updated);

      const result = await controller.update(
        mockRequest,
        courseId,
        moduleId,
        lessonId,
        dto,
      );

      expect(mockCoursesService.updateLesson).toHaveBeenCalledWith(
        courseId,
        moduleId,
        lessonId,
        instructorId,
        dto,
      );
      expect(result).toEqual(updated);
    });

    it('should propagate NotFoundException when lesson not found', async () => {
      mockCoursesService.updateLesson.mockRejectedValue(
        new NotFoundException('Lesson not found'),
      );

      await expect(
        controller.update(mockRequest, courseId, moduleId, 'bad-id', {
          title: 'X',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException from service', async () => {
      mockCoursesService.updateLesson.mockRejectedValue(
        new ForbiddenException('Not your course'),
      );

      await expect(
        controller.update(mockRequest, courseId, moduleId, lessonId, {
          title: 'X',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should call service.removeLesson and return message', async () => {
      mockCoursesService.removeLesson.mockResolvedValue(undefined);

      const result = await controller.remove(
        mockRequest,
        courseId,
        moduleId,
        lessonId,
      );

      expect(mockCoursesService.removeLesson).toHaveBeenCalledWith(
        courseId,
        moduleId,
        lessonId,
        instructorId,
      );
      expect(result).toEqual({ message: 'Lesson deleted' });
    });

    it('should propagate NotFoundException when lesson not found', async () => {
      mockCoursesService.removeLesson.mockRejectedValue(
        new NotFoundException('Lesson not found'),
      );

      await expect(
        controller.remove(mockRequest, courseId, moduleId, 'bad-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException when not the owner', async () => {
      mockCoursesService.removeLesson.mockRejectedValue(
        new ForbiddenException('Not your course'),
      );

      await expect(
        controller.remove(mockRequest, courseId, moduleId, lessonId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

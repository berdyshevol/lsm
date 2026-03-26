import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { UserRole } from '../users/user.entity';

describe('ProgressController', () => {
  let controller: ProgressController;

  const mockProgressService = {
    markComplete: jest.fn(),
    getProgress: jest.fn(),
  };

  const userId = 'student-uuid-1';
  const courseId = 'course-uuid-1';
  const lessonId = 'lesson-uuid-1';

  const mockRequest = {
    user: { id: userId, role: UserRole.Student },
  } as unknown as Request;

  const mockProgressSummary = {
    totalLessons: 5,
    completedLessons: 2,
    percentage: 40,
    completedLessonIds: [lessonId, 'lesson-uuid-2'],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProgressController],
      providers: [{ provide: ProgressService, useValue: mockProgressService }],
    }).compile();

    controller = module.get<ProgressController>(ProgressController);
  });

  describe('markComplete', () => {
    it('should call service.markComplete with userId from request', async () => {
      mockProgressService.markComplete.mockResolvedValue(mockProgressSummary);

      const result = await controller.markComplete(
        mockRequest,
        courseId,
        lessonId,
      );

      expect(mockProgressService.markComplete).toHaveBeenCalledWith(
        userId,
        courseId,
        lessonId,
      );
      expect(result).toEqual(mockProgressSummary);
    });

    it('should propagate ForbiddenException from service', async () => {
      mockProgressService.markComplete.mockRejectedValue(
        new ForbiddenException('Not enrolled in this course'),
      );

      await expect(
        controller.markComplete(mockRequest, courseId, lessonId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getProgress', () => {
    it('should call service.getProgress and return summary', async () => {
      mockProgressService.getProgress.mockResolvedValue(mockProgressSummary);

      const result = await controller.getProgress(mockRequest, courseId);

      expect(mockProgressService.getProgress).toHaveBeenCalledWith(
        userId,
        courseId,
      );
      expect(result).toEqual(mockProgressSummary);
    });

    it('should propagate ForbiddenException from service', async () => {
      mockProgressService.getProgress.mockRejectedValue(
        new ForbiddenException('Not enrolled in this course'),
      );

      await expect(
        controller.getProgress(mockRequest, courseId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

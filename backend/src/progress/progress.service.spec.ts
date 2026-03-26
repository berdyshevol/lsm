import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { LessonProgress } from './lesson-progress.entity';
import { CoursesService } from '../courses/courses.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';

describe('ProgressService', () => {
  let service: ProgressService;

  const mockProgressRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockCoursesService = {
    findOneWithDetails: jest.fn(),
  };

  const mockEnrollmentsService = {
    isEnrolled: jest.fn(),
  };

  const userId = 'user-uuid-1';
  const courseId = 'course-uuid-1';
  const lessonId1 = 'lesson-uuid-1';
  const lessonId2 = 'lesson-uuid-2';

  const mockCourseWithDetails = {
    id: courseId,
    modules: [
      {
        id: 'module-uuid-1',
        lessons: [{ id: lessonId1 }, { id: lessonId2 }],
      },
    ],
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: getRepositoryToken(LessonProgress),
          useValue: mockProgressRepository,
        },
        { provide: CoursesService, useValue: mockCoursesService },
        { provide: EnrollmentsService, useValue: mockEnrollmentsService },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
  });

  describe('markComplete', () => {
    it('should throw ForbiddenException if not enrolled', async () => {
      mockEnrollmentsService.isEnrolled.mockResolvedValue(false);

      await expect(
        service.markComplete(userId, courseId, lessonId1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if lesson not in course', async () => {
      mockEnrollmentsService.isEnrolled.mockResolvedValue(true);
      mockCoursesService.findOneWithDetails.mockResolvedValue(
        mockCourseWithDetails,
      );

      await expect(
        service.markComplete(userId, courseId, 'unknown-lesson-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create progress record and return summary on first completion', async () => {
      mockEnrollmentsService.isEnrolled.mockResolvedValue(true);
      mockCoursesService.findOneWithDetails.mockResolvedValue(
        mockCourseWithDetails,
      );
      mockProgressRepository.findOne.mockResolvedValue(null);
      mockProgressRepository.create.mockReturnValue({
        userId,
        lessonId: lessonId1,
      });
      mockProgressRepository.save.mockResolvedValue({});
      const completedRecords = [
        { userId, lessonId: lessonId1, completedAt: new Date() },
      ];
      mockProgressRepository.find.mockResolvedValue(completedRecords);

      const result = await service.markComplete(userId, courseId, lessonId1);

      expect(mockProgressRepository.create).toHaveBeenCalledWith({
        userId,
        lessonId: lessonId1,
      });
      expect(mockProgressRepository.save).toHaveBeenCalled();
      expect(result).toEqual({
        totalLessons: 2,
        completedLessons: 1,
        percentage: 50,
        completedLessonIds: [lessonId1],
      });
    });

    it('should handle concurrent duplicate insert gracefully (unique constraint race)', async () => {
      mockEnrollmentsService.isEnrolled.mockResolvedValue(true);
      mockCoursesService.findOneWithDetails.mockResolvedValue(
        mockCourseWithDetails,
      );
      mockProgressRepository.findOne.mockResolvedValue(null);
      mockProgressRepository.create.mockReturnValue({
        userId,
        lessonId: lessonId1,
      });
      mockProgressRepository.save.mockRejectedValue(
        Object.assign(new Error('duplicate key'), { code: '23505' }),
      );
      const completedRecords = [
        { userId, lessonId: lessonId1, completedAt: new Date() },
      ];
      mockProgressRepository.find.mockResolvedValue(completedRecords);

      const result = await service.markComplete(userId, courseId, lessonId1);

      expect(result).toEqual({
        totalLessons: 2,
        completedLessons: 1,
        percentage: 50,
        completedLessonIds: [lessonId1],
      });
    });

    it('should be idempotent — skip insert if already completed', async () => {
      mockEnrollmentsService.isEnrolled.mockResolvedValue(true);
      mockCoursesService.findOneWithDetails.mockResolvedValue(
        mockCourseWithDetails,
      );
      mockProgressRepository.findOne.mockResolvedValue({
        userId,
        lessonId: lessonId1,
        completedAt: new Date(),
      });
      const completedRecords = [
        { userId, lessonId: lessonId1, completedAt: new Date() },
      ];
      mockProgressRepository.find.mockResolvedValue(completedRecords);

      const result = await service.markComplete(userId, courseId, lessonId1);

      expect(mockProgressRepository.create).not.toHaveBeenCalled();
      expect(mockProgressRepository.save).not.toHaveBeenCalled();
      expect(result).toEqual({
        totalLessons: 2,
        completedLessons: 1,
        percentage: 50,
        completedLessonIds: [lessonId1],
      });
    });
  });

  describe('getProgress', () => {
    it('should throw ForbiddenException if not enrolled', async () => {
      mockEnrollmentsService.isEnrolled.mockResolvedValue(false);

      await expect(service.getProgress(userId, courseId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return zero progress for course with no lessons', async () => {
      mockEnrollmentsService.isEnrolled.mockResolvedValue(true);
      mockCoursesService.findOneWithDetails.mockResolvedValue({
        id: courseId,
        modules: [],
      });

      const result = await service.getProgress(userId, courseId);

      expect(result).toEqual({
        totalLessons: 0,
        completedLessons: 0,
        percentage: 0,
        completedLessonIds: [],
      });
      expect(mockProgressRepository.find).not.toHaveBeenCalled();
    });

    it('should return correct progress summary', async () => {
      mockEnrollmentsService.isEnrolled.mockResolvedValue(true);
      mockCoursesService.findOneWithDetails.mockResolvedValue(
        mockCourseWithDetails,
      );
      mockProgressRepository.find.mockResolvedValue([
        { userId, lessonId: lessonId1, completedAt: new Date() },
        { userId, lessonId: lessonId2, completedAt: new Date() },
      ]);

      const result = await service.getProgress(userId, courseId);

      expect(result).toEqual({
        totalLessons: 2,
        completedLessons: 2,
        percentage: 100,
        completedLessonIds: [lessonId1, lessonId2],
      });
    });

    it('should round percentage to nearest integer', async () => {
      mockEnrollmentsService.isEnrolled.mockResolvedValue(true);
      mockCoursesService.findOneWithDetails.mockResolvedValue({
        id: courseId,
        modules: [
          {
            id: 'module-uuid-1',
            lessons: [
              { id: lessonId1 },
              { id: lessonId2 },
              { id: 'lesson-uuid-3' },
            ],
          },
        ],
      });
      mockProgressRepository.find.mockResolvedValue([
        { userId, lessonId: lessonId1, completedAt: new Date() },
      ]);

      const result = await service.getProgress(userId, courseId);

      expect(result.percentage).toBe(33); // Math.round(1/3 * 100)
    });
  });
});

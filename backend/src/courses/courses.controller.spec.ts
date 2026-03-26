/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { Course } from './course.entity';
import { UserRole } from '../users/user.entity';

describe('CoursesController', () => {
  let controller: CoursesController;

  const mockService = {
    create: jest.fn(),
    findByInstructor: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const instructorId = 'instructor-uuid-1';
  const courseId = 'course-uuid-1';

  const mockRequest = {
    user: {
      id: instructorId,
      name: 'Instructor',
      email: 'i@test.com',
      role: UserRole.Instructor,
    },
  } as unknown as Request;

  const mockCourse: Course = {
    id: courseId,
    title: 'Test Course',
    description: 'A test course description',
    instructorId,
    instructor: {} as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CoursesController],
      providers: [{ provide: CoursesService, useValue: mockService }],
    }).compile();

    controller = module.get<CoursesController>(CoursesController);
  });

  describe('create', () => {
    it('should call service.create with instructorId and dto', async () => {
      const dto = { title: 'Test Course', description: 'Desc' };
      mockService.create.mockResolvedValue(mockCourse);

      const result = await controller.create(mockRequest, dto);

      expect(mockService.create).toHaveBeenCalledWith(instructorId, dto);
      expect(result).toEqual(mockCourse);
    });
  });

  describe('findMy', () => {
    it('should call service.findByInstructor with instructorId', async () => {
      mockService.findByInstructor.mockResolvedValue([mockCourse]);

      const result = await controller.findMy(mockRequest);

      expect(mockService.findByInstructor).toHaveBeenCalledWith(instructorId);
      expect(result).toEqual([mockCourse]);
    });
  });

  describe('update', () => {
    it('should call service.update with id, instructorId, and dto', async () => {
      const dto = { title: 'Updated' };
      const updated = { ...mockCourse, title: 'Updated' };
      mockService.update.mockResolvedValue(updated);

      const result = await controller.update(mockRequest, courseId, dto);

      expect(mockService.update).toHaveBeenCalledWith(
        courseId,
        instructorId,
        dto,
      );
      expect(result).toEqual(updated);
    });

    it('should propagate NotFoundException from service', async () => {
      mockService.update.mockRejectedValue(
        new NotFoundException('Course not found'),
      );

      await expect(
        controller.update(mockRequest, 'nonexistent-id', {}),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException from service', async () => {
      mockService.update.mockRejectedValue(
        new ForbiddenException('Not your course'),
      );

      await expect(
        controller.update(mockRequest, courseId, { title: 'Hacked' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should call service.remove and return message', async () => {
      mockService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(mockRequest, courseId);

      expect(mockService.remove).toHaveBeenCalledWith(courseId, instructorId);
      expect(result).toEqual({ message: 'Course deleted' });
    });

    it('should propagate NotFoundException from service', async () => {
      mockService.remove.mockRejectedValue(
        new NotFoundException('Course not found'),
      );

      await expect(
        controller.remove(mockRequest, 'nonexistent-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException from service', async () => {
      mockService.remove.mockRejectedValue(
        new ForbiddenException('Not your course'),
      );

      await expect(controller.remove(mockRequest, courseId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});

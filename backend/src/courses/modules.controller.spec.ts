/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import type { Request } from 'express';
import { ModulesController } from './modules.controller';
import { CoursesService } from './courses.service';
import { CourseModule } from './course-module.entity';
import { UserRole } from '../users/user.entity';

describe('ModulesController', () => {
  let controller: ModulesController;

  const mockService = {
    findModulesByCourse: jest.fn(),
    createModule: jest.fn(),
    updateModule: jest.fn(),
    removeModule: jest.fn(),
  };

  const instructorId = 'instructor-uuid-1';
  const courseId = 'course-uuid-1';
  const moduleId = 'module-uuid-1';

  const mockRequest = {
    user: {
      id: instructorId,
      name: 'Instructor',
      email: 'i@test.com',
      role: UserRole.Instructor,
    },
  } as unknown as Request;

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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ModulesController],
      providers: [{ provide: CoursesService, useValue: mockService }],
    }).compile();

    controller = module.get<ModulesController>(ModulesController);
  });

  describe('findAll', () => {
    it('should return modules for the course', async () => {
      mockService.findModulesByCourse.mockResolvedValue([mockModule]);

      const result = await controller.findAll(mockRequest, courseId);

      expect(mockService.findModulesByCourse).toHaveBeenCalledWith(
        courseId,
        instructorId,
      );
      expect(result).toEqual([mockModule]);
    });

    it('should propagate ForbiddenException from service', async () => {
      mockService.findModulesByCourse.mockRejectedValue(
        new ForbiddenException('Not your course'),
      );

      await expect(controller.findAll(mockRequest, courseId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('create', () => {
    it('should call service.createModule and return the created module', async () => {
      const dto = { title: 'Test Module', orderIndex: 0 };
      mockService.createModule.mockResolvedValue(mockModule);

      const result = await controller.create(mockRequest, courseId, dto);

      expect(mockService.createModule).toHaveBeenCalledWith(
        courseId,
        instructorId,
        dto,
      );
      expect(result).toEqual(mockModule);
    });

    it('should propagate NotFoundException from service', async () => {
      mockService.createModule.mockRejectedValue(
        new NotFoundException('Course not found'),
      );

      await expect(
        controller.create(mockRequest, courseId, { title: 'M', orderIndex: 0 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException from service', async () => {
      mockService.createModule.mockRejectedValue(
        new ForbiddenException('Not your course'),
      );

      await expect(
        controller.create(mockRequest, courseId, { title: 'M', orderIndex: 0 }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should call service.updateModule and return the updated module', async () => {
      const dto = { title: 'Updated Module' };
      const updated = { ...mockModule, title: 'Updated Module' };
      mockService.updateModule.mockResolvedValue(updated);

      const result = await controller.update(
        mockRequest,
        courseId,
        moduleId,
        dto,
      );

      expect(mockService.updateModule).toHaveBeenCalledWith(
        courseId,
        moduleId,
        instructorId,
        dto,
      );
      expect(result).toEqual(updated);
    });

    it('should propagate NotFoundException when module not found', async () => {
      mockService.updateModule.mockRejectedValue(
        new NotFoundException('Module not found'),
      );

      await expect(
        controller.update(mockRequest, courseId, 'bad-id', { title: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should call service.removeModule and return message', async () => {
      mockService.removeModule.mockResolvedValue(undefined);

      const result = await controller.remove(mockRequest, courseId, moduleId);

      expect(mockService.removeModule).toHaveBeenCalledWith(
        courseId,
        moduleId,
        instructorId,
      );
      expect(result).toEqual({ message: 'Module deleted' });
    });

    it('should propagate NotFoundException when module not found', async () => {
      mockService.removeModule.mockRejectedValue(
        new NotFoundException('Module not found'),
      );

      await expect(
        controller.remove(mockRequest, courseId, 'bad-id'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should propagate ForbiddenException when not the owner', async () => {
      mockService.removeModule.mockRejectedValue(
        new ForbiddenException('Not your course'),
      );

      await expect(
        controller.remove(mockRequest, courseId, moduleId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});

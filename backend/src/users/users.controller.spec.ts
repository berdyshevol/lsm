import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserRole } from './user.entity';
import type { Request } from 'express';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<Partial<UsersService>>;

  const mockUser: User = {
    id: 'uuid-admin',
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'hashed',
    role: UserRole.Admin,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStudent: User = {
    id: 'uuid-student',
    name: 'Student User',
    email: 'student@example.com',
    password: 'hashed',
    role: UserRole.Student,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    usersService = {
      findAll: jest.fn(),
      updateRole: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [mockUser, mockStudent];
      (usersService.findAll as jest.Mock).mockResolvedValue(users);

      const result = await controller.findAll();
      expect(result).toEqual(users);
      expect(usersService.findAll).toHaveBeenCalled();
    });
  });

  describe('updateRole', () => {
    it('should update the role of a different user', async () => {
      const updatedUser = { ...mockStudent, role: UserRole.Instructor };
      (usersService.updateRole as jest.Mock).mockResolvedValue(updatedUser);

      const req = { user: { id: 'uuid-admin' } } as unknown as Request;
      const result = await controller.updateRole(req, 'uuid-student', {
        role: UserRole.Instructor,
      });

      expect(result).toEqual(updatedUser);
      expect(usersService.updateRole).toHaveBeenCalledWith(
        'uuid-student',
        UserRole.Instructor,
      );
    });

    it('should throw ForbiddenException when admin tries to change own role', () => {
      const req = { user: { id: 'uuid-admin' } } as unknown as Request;

      expect(() =>
        controller.updateRole(req, 'uuid-admin', { role: UserRole.Student }),
      ).toThrow(ForbiddenException);
    });
  });
});

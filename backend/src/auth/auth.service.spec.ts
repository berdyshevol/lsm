/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User, UserRole } from '../users/user.entity';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;
  let jwtService: jest.Mocked<Partial<JwtService>>;

  const mockUser: User = {
    id: 'uuid-123',
    name: 'Test User',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    role: UserRole.Student,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findByEmailWithPassword: jest.fn(),
      create: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('jwt-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return AuthUser when credentials are valid', async () => {
      usersService.findByEmailWithPassword!.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(
        'test@example.com',
        'password123',
      );
      expect(result).toBeDefined();
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
      expect(result).toEqual({
        id: 'uuid-123',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.Student,
      });
    });

    it('should return null when user not found', async () => {
      usersService.findByEmailWithPassword!.mockResolvedValue(null);

      const result = await service.validateUser(
        'notfound@example.com',
        'password123',
      );
      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      usersService.findByEmailWithPassword!.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(
        'test@example.com',
        'wrongpassword',
      );
      expect(result).toBeNull();
    });
  });

  describe('signToken', () => {
    it('should return a JWT token with name in payload', () => {
      const result = service.signToken({
        id: 'uuid-123',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.Student,
      });
      expect(result).toBe('jwt-token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'uuid-123',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.Student,
      });
    });
  });

  describe('register', () => {
    it('should create a new user and return AuthUser shape', async () => {
      usersService.findByEmail!.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      usersService.create!.mockResolvedValue(mockUser);

      const result = await service.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
      expect(result).toEqual({
        id: 'uuid-123',
        name: 'Test User',
        email: 'test@example.com',
        role: UserRole.Student,
      });
      expect(usersService.create).toHaveBeenCalledWith({
        name: 'Test User',
        email: 'test@example.com',
        password: 'hashed-password',
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      usersService.findByEmail!.mockResolvedValue(mockUser);

      await expect(
        service.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException on DB unique constraint violation', async () => {
      usersService.findByEmail!.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const dbError = new Error('duplicate key') as Error & { code: string };
      dbError.code = '23505';
      usersService.create!.mockRejectedValue(dbError);

      await expect(
        service.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});

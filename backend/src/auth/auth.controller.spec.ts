/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService, AuthUser, TOKEN_TTL_SECONDS } from './auth.service';
import { UserRole } from '../users/user.entity';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Partial<AuthService>>;

  const mockUser: AuthUser = {
    id: 'uuid-123',
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.Student,
  };

  const mockResponse = {
    cookie: jest.fn(),
  } as any;

  const mockRequest = {
    user: mockUser,
  } as any;

  beforeEach(async () => {
    authService = {
      register: jest.fn().mockResolvedValue(mockUser),
      signToken: jest.fn().mockReturnValue('jwt-token'),
      validateUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('development'),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('POST /auth/register', () => {
    it('should register a user, set cookie, and return AuthUser', async () => {
      const dto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await controller.register(dto, mockResponse);

      expect(authService.register).toHaveBeenCalledWith(dto);
      expect(authService.signToken).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        'jwt-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: TOKEN_TTL_SECONDS * 1000,
        }),
      );
      expect(result).toEqual(mockUser);
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('createdAt');
      expect(result).not.toHaveProperty('updatedAt');
    });
  });

  describe('POST /auth/login', () => {
    it('should set cookie and return user from request', () => {
      const result = controller.login(mockRequest, mockResponse);

      expect(authService.signToken).toHaveBeenCalledWith(mockUser);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        'jwt-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: TOKEN_TTL_SECONDS * 1000,
        }),
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('GET /auth/me', () => {
    it('should return the authenticated user', () => {
      const result = controller.me(mockRequest);
      expect(result).toEqual(mockUser);
    });
  });

  describe('POST /auth/logout', () => {
    it('should clear cookie and return confirmation', () => {
      const result = controller.logout(mockResponse);

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        '',
        expect.objectContaining({
          httpOnly: true,
          maxAge: 0,
        }),
      );
      expect(result).toEqual({ message: 'Logged out' });
    });
  });
});

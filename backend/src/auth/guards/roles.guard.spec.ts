/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../users/user.entity';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user: any): ExecutionContext {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as any;
  }

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = createMockContext({
      id: '1',
      role: UserRole.Student,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.Instructor]);
    const context = createMockContext({
      id: '1',
      role: UserRole.Instructor,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.Admin]);
    const context = createMockContext({
      id: '1',
      role: UserRole.Student,
    });

    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow access when user has one of multiple required roles', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.Instructor,
      UserRole.Admin,
    ]);
    const context = createMockContext({
      id: '1',
      role: UserRole.Admin,
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when request.user is undefined', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.Admin]);
    const context = createMockContext(undefined);

    expect(guard.canActivate(context)).toBe(false);
  });
});

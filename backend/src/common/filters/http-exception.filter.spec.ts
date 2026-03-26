/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import {
  HttpException,
  HttpStatus,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockHost: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => ({}),
      }),
    };
  });

  it('should handle HttpException with object response', () => {
    const exception = new BadRequestException(['email must be an email']);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 400,
      message: ['email must be an email'],
      error: 'Bad Request',
    });
  });

  it('should handle ConflictException (409)', () => {
    const exception = new ConflictException('Email already exists');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 409,
      message: 'Email already exists',
      error: 'Conflict',
    });
  });

  it('should handle UnauthorizedException (401)', () => {
    const exception = new UnauthorizedException('Invalid credentials');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 401,
      message: 'Invalid credentials',
      error: 'Unauthorized',
    });
  });

  it('should handle ForbiddenException (403)', () => {
    const exception = new ForbiddenException('Forbidden');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 403,
      message: 'Forbidden',
      error: 'Forbidden',
    });
  });

  it('should handle non-HttpException as 500', () => {
    const exception = new Error('Something went wrong');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      error: 'Internal Server Error',
    });
  });

  it('should handle HttpException with string response using title case', () => {
    const exception = new HttpException('Custom error', HttpStatus.BAD_GATEWAY);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(502);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 502,
      message: 'Custom error',
      error: 'Bad Gateway',
    });
  });
});

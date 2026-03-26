import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';

export async function createTestApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();
  return app;
}

interface ResponseWithCookies {
  headers: Record<string, string | string[] | undefined>;
}

export function extractCookies(res: ResponseWithCookies): string {
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) return '';
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

export async function loginAs(
  app: INestApplication<App>,
  email: string,
  password = 'password123',
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(201);
  const cookies = extractCookies(res);
  if (!cookies || !cookies.includes('access_token=')) {
    throw new Error(`Login failed for ${email}: no access_token cookie`);
  }
  return cookies;
}

/**
 * Register a new user and optionally promote to a different role via admin.
 * Returns cookies for the new user.
 */
export async function createTestUser(
  app: INestApplication<App>,
  opts: {
    role?: 'Student' | 'Instructor' | 'Admin';
    suffix?: string;
  } = {},
): Promise<{ cookies: string; userId: string; email: string }> {
  const role = opts.role ?? 'Student';
  const prefix = opts.suffix ?? 'test';
  const suffix = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const email = `e2e-${role.toLowerCase()}-${suffix}@test.local`;

  const regRes = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ name: `E2E ${role}`, email, password: 'password123' })
    .expect(201);

  const userId = regRes.body.id;

  if (role !== 'Student') {
    // Promote via admin (admin@lms.com is seeded with Admin role)
    const adminCookies = await loginAs(app, 'admin@lms.com');
    await request(app.getHttpServer())
      .patch(`/api/users/${userId}/role`)
      .set('Cookie', adminCookies)
      .send({ role })
      .expect(200);
  }

  const cookies = await loginAs(app, email);
  return { cookies, userId, email };
}

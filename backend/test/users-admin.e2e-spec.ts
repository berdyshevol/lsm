import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, createTestUser, loginAs } from './helpers/test-app';

describe('Users Admin (e2e)', () => {
  let app: INestApplication<App>;
  let adminCookies: string;
  let instructorCookies: string;
  let studentCookies: string;
  let targetUserId: string;

  beforeAll(async () => {
    app = await createTestApp();

    const admin = await createTestUser(app, { role: 'Admin', suffix: 'admin-test' });
    adminCookies = admin.cookies;

    const instructor = await createTestUser(app, { role: 'Instructor', suffix: 'admin-test' });
    instructorCookies = instructor.cookies;

    const student = await createTestUser(app, { role: 'Student', suffix: 'admin-test' });
    studentCookies = student.cookies;

    // Register a user to use as the role-change target
    const target = await createTestUser(app, { role: 'Student', suffix: 'role-target' });
    targetUserId = target.userId;
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/users', () => {
    it('should list all users for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/users')
        .set('Cookie', adminCookies)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
      for (const user of res.body) {
        expect(user.password).toBeUndefined();
      }
    });

    it('should return 403 for non-admin (instructor)', async () => {
      await request(app.getHttpServer())
        .get('/api/users')
        .set('Cookie', instructorCookies)
        .expect(403);
    });

    it('should return 403 for non-admin (student)', async () => {
      await request(app.getHttpServer())
        .get('/api/users')
        .set('Cookie', studentCookies)
        .expect(403);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer()).get('/api/users').expect(401);
    });
  });

  describe('PATCH /api/users/:id/role', () => {
    it('should change a user role', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/users/${targetUserId}/role`)
        .set('Cookie', adminCookies)
        .send({ role: 'Instructor' })
        .expect(200);

      expect(res.body.role).toBe('Instructor');
    });

    it('should return 403 when admin changes own role', async () => {
      const meRes = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', adminCookies);
      const adminId = meRes.body.id;

      await request(app.getHttpServer())
        .patch(`/api/users/${adminId}/role`)
        .set('Cookie', adminCookies)
        .send({ role: 'Student' })
        .expect(403);
    });

    it('should return 400 for invalid role', async () => {
      await request(app.getHttpServer())
        .patch(`/api/users/${targetUserId}/role`)
        .set('Cookie', adminCookies)
        .send({ role: 'SuperAdmin' })
        .expect(400);
    });

    it('should return 403 for non-admin', async () => {
      await request(app.getHttpServer())
        .patch(`/api/users/${targetUserId}/role`)
        .set('Cookie', studentCookies)
        .send({ role: 'Admin' })
        .expect(403);
    });

    it('should return 404 for nonexistent user', async () => {
      await request(app.getHttpServer())
        .patch('/api/users/00000000-0000-0000-0000-000000000000/role')
        .set('Cookie', adminCookies)
        .send({ role: 'Student' })
        .expect(404);
    });
  });
});

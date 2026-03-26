import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, createTestUser } from './helpers/test-app';

describe('Courses (e2e)', () => {
  let app: INestApplication<App>;
  let instructorCookies: string;
  let studentCookies: string;
  let adminCookies: string;

  beforeAll(async () => {
    app = await createTestApp();
    const instructor = await createTestUser(app, { role: 'Instructor', suffix: 'courses' });
    instructorCookies = instructor.cookies;
    const student = await createTestUser(app, { role: 'Student', suffix: 'courses' });
    studentCookies = student.cookies;
    const admin = await createTestUser(app, { role: 'Admin', suffix: 'courses' });
    adminCookies = admin.cookies;
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/courses', () => {
    it('should allow instructor to create a course', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/courses')
        .set('Cookie', instructorCookies)
        .send({ title: 'E2E Test Course', description: 'A course for testing' })
        .expect(201);

      expect(res.body).toMatchObject({
        title: 'E2E Test Course',
        description: 'A course for testing',
      });
      expect(res.body.id).toBeDefined();
    });

    it('should return 403 for student creating a course', async () => {
      await request(app.getHttpServer())
        .post('/api/courses')
        .set('Cookie', studentCookies)
        .send({ title: 'Student Course', description: 'Should fail' })
        .expect(403);
    });

    it('should return 400 for missing title', async () => {
      await request(app.getHttpServer())
        .post('/api/courses')
        .set('Cookie', instructorCookies)
        .send({ description: 'No title provided' })
        .expect(400);
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/api/courses')
        .send({ title: 'Unauth', description: 'Should fail' })
        .expect(401);
    });
  });

  describe('GET /api/courses', () => {
    it('should list all courses for any authenticated user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/courses')
        .set('Cookie', studentCookies)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/courses/my', () => {
    it('should list courses owned by the instructor', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/courses/my')
        .set('Cookie', instructorCookies)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should return 403 for non-instructor', async () => {
      await request(app.getHttpServer())
        .get('/api/courses/my')
        .set('Cookie', studentCookies)
        .expect(403);
    });
  });

  describe('GET /api/courses/all', () => {
    it('should list all courses for admin', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/courses/all')
        .set('Cookie', adminCookies)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 403 for non-admin', async () => {
      await request(app.getHttpServer())
        .get('/api/courses/all')
        .set('Cookie', studentCookies)
        .expect(403);
    });
  });

  describe('GET /api/courses/:id', () => {
    it('should return course details with modules', async () => {
      const listRes = await request(app.getHttpServer())
        .get('/api/courses')
        .set('Cookie', studentCookies);
      const courseId = listRes.body[0].id;

      const res = await request(app.getHttpServer())
        .get(`/api/courses/${courseId}`)
        .set('Cookie', studentCookies)
        .expect(200);

      expect(res.body).toMatchObject({ id: courseId });
      expect(res.body.title).toBeDefined();
    });

    it('should return 404 for nonexistent course', async () => {
      await request(app.getHttpServer())
        .get('/api/courses/00000000-0000-0000-0000-000000000000')
        .set('Cookie', studentCookies)
        .expect(404);
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app.getHttpServer())
        .get('/api/courses/not-a-uuid')
        .set('Cookie', studentCookies)
        .expect(400);
    });
  });

  describe('PATCH /api/courses/:id', () => {
    let courseId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/courses')
        .set('Cookie', instructorCookies)
        .send({ title: 'To Update', description: 'Will be updated' })
        .expect(201);
      courseId = res.body.id;
    });

    it('should update course as owner', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/courses/${courseId}`)
        .set('Cookie', instructorCookies)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(res.body.title).toBe('Updated Title');
    });

    it('should return 403 for non-owner', async () => {
      await request(app.getHttpServer())
        .patch(`/api/courses/${courseId}`)
        .set('Cookie', studentCookies)
        .send({ title: 'Hacked' })
        .expect(403);
    });
  });

  describe('DELETE /api/courses/:id', () => {
    let courseId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/api/courses')
        .set('Cookie', instructorCookies)
        .send({ title: 'To Delete', description: 'Will be deleted' })
        .expect(201);
      courseId = res.body.id;
    });

    it('should delete course as owner', async () => {
      await request(app.getHttpServer())
        .delete(`/api/courses/${courseId}`)
        .set('Cookie', instructorCookies)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/courses/${courseId}`)
        .set('Cookie', instructorCookies)
        .expect(404);
    });

    it('should return 404 for already deleted course', async () => {
      await request(app.getHttpServer())
        .delete(`/api/courses/${courseId}`)
        .set('Cookie', instructorCookies)
        .expect(404);
    });
  });
});

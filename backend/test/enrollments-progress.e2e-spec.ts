import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, createTestUser } from './helpers/test-app';

describe('Enrollments & Progress (e2e)', () => {
  let app: INestApplication<App>;
  let instructorCookies: string;
  let studentCookies: string;
  let courseId: string;
  let moduleId: string;
  let lessonId: string;

  beforeAll(async () => {
    app = await createTestApp();

    const instructor = await createTestUser(app, { role: 'Instructor', suffix: 'enroll' });
    instructorCookies = instructor.cookies;

    const student = await createTestUser(app, { role: 'Student', suffix: 'enroll' });
    studentCookies = student.cookies;

    // Create a course with module and lesson
    const courseRes = await request(app.getHttpServer())
      .post('/api/courses')
      .set('Cookie', instructorCookies)
      .send({ title: 'Enrollment Test Course', description: 'For enrollment E2E tests' })
      .expect(201);
    courseId = courseRes.body.id;

    const moduleRes = await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/modules`)
      .set('Cookie', instructorCookies)
      .send({ title: 'Enroll Module', orderIndex: 0 })
      .expect(201);
    moduleId = moduleRes.body.id;

    const lessonRes = await request(app.getHttpServer())
      .post(`/api/courses/${courseId}/modules/${moduleId}/lessons`)
      .set('Cookie', instructorCookies)
      .send({
        title: 'Enroll Lesson',
        content: 'Lesson content for enrollment test',
        orderIndex: 0,
      })
      .expect(201);
    lessonId = lessonRes.body.id;
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  describe('Enrollments', () => {
    describe('POST /api/enrollments/courses/:courseId', () => {
      it('should enroll student in a course', async () => {
        const res = await request(app.getHttpServer())
          .post(`/api/enrollments/courses/${courseId}`)
          .set('Cookie', studentCookies)
          .expect(201);

        expect(res.body).toMatchObject({ courseId });
      });

      it('should return 409 for duplicate enrollment', async () => {
        await request(app.getHttpServer())
          .post(`/api/enrollments/courses/${courseId}`)
          .set('Cookie', studentCookies)
          .expect(409);
      });

      it('should return 403 for non-student role', async () => {
        await request(app.getHttpServer())
          .post(`/api/enrollments/courses/${courseId}`)
          .set('Cookie', instructorCookies)
          .expect(403);
      });

      it('should return 404 for nonexistent course', async () => {
        await request(app.getHttpServer())
          .post('/api/enrollments/courses/00000000-0000-0000-0000-000000000000')
          .set('Cookie', studentCookies)
          .expect(404);
      });
    });

    describe('GET /api/enrollments/my', () => {
      it('should list enrolled courses', async () => {
        const res = await request(app.getHttpServer())
          .get('/api/enrollments/my')
          .set('Cookie', studentCookies)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Progress', () => {
    describe('POST /api/progress/courses/:courseId/lessons/:lessonId/complete', () => {
      it('should mark a lesson as complete', async () => {
        const res = await request(app.getHttpServer())
          .post(`/api/progress/courses/${courseId}/lessons/${lessonId}/complete`)
          .set('Cookie', studentCookies)
          .expect(200);

        expect(res.body).toBeDefined();
      });

      it('should return 403 for non-enrolled student', async () => {
        const notEnrolled = await createTestUser(app, {
          role: 'Student',
          suffix: 'not-enrolled',
        });

        await request(app.getHttpServer())
          .post(`/api/progress/courses/${courseId}/lessons/${lessonId}/complete`)
          .set('Cookie', notEnrolled.cookies)
          .expect(403);
      });
    });

    describe('GET /api/progress/courses/:courseId', () => {
      it('should return progress for enrolled student', async () => {
        const res = await request(app.getHttpServer())
          .get(`/api/progress/courses/${courseId}`)
          .set('Cookie', studentCookies)
          .expect(200);

        expect(res.body).toBeDefined();
      });
    });

    describe('Lesson access after enrollment', () => {
      it('should allow enrolled student to view lesson content', async () => {
        const res = await request(app.getHttpServer())
          .get(
            `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
          )
          .set('Cookie', studentCookies)
          .expect(200);

        expect(res.body.content).toBeDefined();
      });
    });
  });
});

import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, createTestUser } from './helpers/test-app';

describe('Modules & Lessons (e2e)', () => {
  let app: INestApplication<App>;
  let instructorCookies: string;
  let studentCookies: string;
  let courseId: string;

  beforeAll(async () => {
    app = await createTestApp();

    const instructor = await createTestUser(app, { role: 'Instructor', suffix: 'modless' });
    instructorCookies = instructor.cookies;

    const student = await createTestUser(app, { role: 'Student', suffix: 'modless' });
    studentCookies = student.cookies;

    // Create a course for module/lesson tests
    const courseRes = await request(app.getHttpServer())
      .post('/api/courses')
      .set('Cookie', instructorCookies)
      .send({ title: 'ModLesson Test Course', description: 'For module/lesson E2E' })
      .expect(201);
    courseId = courseRes.body.id;
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  describe('Modules CRUD', () => {
    let moduleId: string;

    describe('POST /api/courses/:courseId/modules', () => {
      it('should create a module', async () => {
        const res = await request(app.getHttpServer())
          .post(`/api/courses/${courseId}/modules`)
          .set('Cookie', instructorCookies)
          .send({ title: 'Module 1', orderIndex: 0 })
          .expect(201);

        expect(res.body).toMatchObject({
          title: 'Module 1',
          orderIndex: 0,
        });
        expect(res.body.id).toBeDefined();
        moduleId = res.body.id;
      });

      it('should return 403 for non-owner', async () => {
        await request(app.getHttpServer())
          .post(`/api/courses/${courseId}/modules`)
          .set('Cookie', studentCookies)
          .send({ title: 'Hack Module', orderIndex: 0 })
          .expect(403);
      });

      it('should return 400 for missing title', async () => {
        await request(app.getHttpServer())
          .post(`/api/courses/${courseId}/modules`)
          .set('Cookie', instructorCookies)
          .send({ orderIndex: 0 })
          .expect(400);
      });
    });

    describe('GET /api/courses/:courseId/modules', () => {
      it('should list modules for a course', async () => {
        const res = await request(app.getHttpServer())
          .get(`/api/courses/${courseId}/modules`)
          .set('Cookie', instructorCookies)
          .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
      });
    });

    describe('PATCH /api/courses/:courseId/modules/:moduleId', () => {
      it('should update a module', async () => {
        const res = await request(app.getHttpServer())
          .patch(`/api/courses/${courseId}/modules/${moduleId}`)
          .set('Cookie', instructorCookies)
          .send({ title: 'Updated Module' })
          .expect(200);

        expect(res.body.title).toBe('Updated Module');
      });
    });

    describe('Lessons CRUD', () => {
      let lessonId: string;

      describe('POST /api/courses/:courseId/modules/:moduleId/lessons', () => {
        it('should create a lesson', async () => {
          const res = await request(app.getHttpServer())
            .post(`/api/courses/${courseId}/modules/${moduleId}/lessons`)
            .set('Cookie', instructorCookies)
            .send({
              title: 'Lesson 1',
              content: '## Hello\n\nThis is lesson content.',
              orderIndex: 0,
            })
            .expect(201);

          expect(res.body).toMatchObject({
            title: 'Lesson 1',
            orderIndex: 0,
          });
          expect(res.body.id).toBeDefined();
          lessonId = res.body.id;
        });

        it('should return 403 for non-owner', async () => {
          await request(app.getHttpServer())
            .post(`/api/courses/${courseId}/modules/${moduleId}/lessons`)
            .set('Cookie', studentCookies)
            .send({
              title: 'Hack Lesson',
              content: 'Should fail',
              orderIndex: 0,
            })
            .expect(403);
        });

        it('should return 400 for missing content', async () => {
          await request(app.getHttpServer())
            .post(`/api/courses/${courseId}/modules/${moduleId}/lessons`)
            .set('Cookie', instructorCookies)
            .send({ title: 'No Content', orderIndex: 1 })
            .expect(400);
        });
      });

      describe('GET lesson content', () => {
        it('should return lesson content for instructor owner', async () => {
          const res = await request(app.getHttpServer())
            .get(
              `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
            )
            .set('Cookie', instructorCookies)
            .expect(200);

          expect(res.body).toMatchObject({ title: 'Lesson 1' });
          expect(res.body.content).toBeDefined();
        });

        it('should return 403 for unenrolled student', async () => {
          await request(app.getHttpServer())
            .get(
              `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
            )
            .set('Cookie', studentCookies)
            .expect(403);
        });
      });

      describe('PATCH lesson', () => {
        it('should update a lesson', async () => {
          const res = await request(app.getHttpServer())
            .patch(
              `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
            )
            .set('Cookie', instructorCookies)
            .send({ title: 'Updated Lesson' })
            .expect(200);

          expect(res.body.title).toBe('Updated Lesson');
        });
      });

      describe('DELETE lesson', () => {
        it('should delete a lesson', async () => {
          await request(app.getHttpServer())
            .delete(
              `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
            )
            .set('Cookie', instructorCookies)
            .expect(200);
        });
      });
    });

    describe('DELETE /api/courses/:courseId/modules/:moduleId', () => {
      it('should delete a module', async () => {
        await request(app.getHttpServer())
          .delete(`/api/courses/${courseId}/modules/${moduleId}`)
          .set('Cookie', instructorCookies)
          .expect(200);
      });
    });
  });
});

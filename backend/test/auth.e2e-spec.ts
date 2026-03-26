import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, extractCookies } from './helpers/test-app';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  const uid = Date.now();

  beforeAll(async () => {
    app = await createTestApp();
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and set cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Auth Test User',
          email: `auth-reg-${uid}@e2e.test`,
          password: 'password123',
        })
        .expect(201);

      expect(res.body).toMatchObject({
        name: 'Auth Test User',
        email: `auth-reg-${uid}@e2e.test`,
        role: 'Student',
      });
      expect(res.body.id).toBeDefined();
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Dupe User',
          email: `auth-reg-${uid}@e2e.test`,
          password: 'password123',
        })
        .expect(409);
    });

    it('should return 400 for missing fields', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: '' })
        .expect(400);
    });

    it('should return 400 for invalid email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'not-an-email', password: 'password123' })
        .expect(400);
    });

    it('should return 400 for short password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          name: 'Test',
          email: `short-pw-${uid}@e2e.test`,
          password: '12',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials and set cookie', async () => {
      // Use the user we just registered (known good state)
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: `auth-reg-${uid}@e2e.test`, password: 'password123' })
        .expect(201);

      expect(res.body).toMatchObject({
        email: `auth-reg-${uid}@e2e.test`,
        role: 'Student',
      });
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 for wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: `auth-reg-${uid}@e2e.test`, password: 'wrongpass' })
        .expect(401);
    });

    it('should return 401 for nonexistent user', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'nobody@nowhere.com', password: 'password123' })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return authenticated user profile', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: `auth-reg-${uid}@e2e.test`, password: 'password123' });
      const cookies = extractCookies(loginRes);

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', cookies)
        .expect(200);

      expect(res.body).toMatchObject({
        email: `auth-reg-${uid}@e2e.test`,
        role: 'Student',
      });
      expect(res.body.id).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear the access_token cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(201);

      expect(res.body).toEqual({ message: 'Logged out' });
      const setCookie = res.headers['set-cookie'];
      expect(setCookie).toBeDefined();
      const cookieStr = Array.isArray(setCookie)
        ? setCookie.join('; ')
        : setCookie;
      expect(cookieStr).toContain('access_token=');
    });
  });
});

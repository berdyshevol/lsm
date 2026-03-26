import { test, expect, request as apiRequest } from '@playwright/test';

const uid = Date.now();
const instructorEmail = `pw-instructor-${uid}@e2e.test`;

test.beforeAll(async () => {
  const api = await apiRequest.newContext({ baseURL: 'http://localhost:3001' });

  const regRes = await api.post('/api/auth/register', {
    data: { name: 'PW Instructor', email: instructorEmail, password: 'password123' },
  });
  const userId = (await regRes.json()).id;

  const adminLogin = await api.post('/api/auth/login', {
    data: { email: 'admin@lms.com', password: 'password123' },
  });
  const setCookie = adminLogin.headers()['set-cookie'] ?? '';
  const adminCookie = setCookie.split(';')[0];

  await api.patch(`/api/users/${userId}/role`, {
    data: { role: 'Instructor' },
    headers: { Cookie: adminCookie },
  });

  await api.dispose();
});

async function loginAsInstructor(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(instructorEmail);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/my-courses', { timeout: 15_000 });
}

test.describe('Instructor Workflows', () => {
  test.describe.configure({ mode: 'serial' });

  test('should view my courses page', async ({ page }) => {
    await loginAsInstructor(page);
    await expect(page).toHaveURL(/\/my-courses/);
    await expect(page.getByRole('heading', { name: 'My Courses' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('should create a new course and redirect to editor', async ({ page }) => {
    await loginAsInstructor(page);

    await page.getByRole('button', { name: /create course/i }).click();

    // Fill the create course dialog
    await page.getByLabel('Title').fill('Playwright Test Course');
    await page.getByLabel('Description').fill('A course created by Playwright E2E test');

    // Submit the dialog form (the button inside the dialog says "Create Course")
    await page.locator('[role="dialog"]').getByRole('button', { name: /create course/i }).click();

    // After creation, the app redirects to the course editor
    await page.waitForURL(/\/my-courses\/[a-f0-9-]+\/edit/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/edit/);
  });

  test('should see created course in my courses list', async ({ page }) => {
    await loginAsInstructor(page);

    await expect(page.getByText('Playwright Test Course')).toBeVisible({
      timeout: 10_000,
    });
  });
});

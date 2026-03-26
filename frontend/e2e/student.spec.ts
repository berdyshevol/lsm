import { test, expect, Page } from '@playwright/test';

const uid = Date.now();
const studentEmail = `pw-student-${uid}@e2e.test`;

async function registerAndLoginAsStudent(page: Page) {
  await page.goto('/register');
  await page.getByLabel('Name').fill('PW Student');
  await page.getByLabel('Email').fill(studentEmail);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL('**/my-learning', { timeout: 15_000 });
}

async function loginAsStudent(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(studentEmail);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL('**/my-learning', { timeout: 15_000 });
}

test.describe('Student Workflows', () => {
  test.describe.configure({ mode: 'serial' });

  test('should register as student and see my learning page', async ({
    page,
  }) => {
    await registerAndLoginAsStudent(page);
    await expect(page).toHaveURL(/\/my-learning/);
  });

  test('should browse the course catalog', async ({ page }) => {
    await loginAsStudent(page);
    await page.getByRole('link', { name: /browse courses/i }).first().click();
    await page.waitForURL('**/courses');
    await expect(
      page.getByRole('heading', { name: 'Course Catalog' }),
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('NestJS Basics').first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test('should view course details', async ({ page }) => {
    await loginAsStudent(page);
    await page.getByRole('link', { name: /browse courses/i }).first().click();
    await page.waitForURL('**/courses');
    await page.getByText('NestJS Basics').first().click();
    await page.waitForURL(/\/courses\/[a-f0-9-]+/, { timeout: 10_000 });
    await expect(
      page.getByRole('heading', { name: 'NestJS Basics' }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should see Enroll button for non-enrolled course', async ({
    page,
  }) => {
    await loginAsStudent(page);
    await page.getByRole('link', { name: /browse courses/i }).first().click();
    await page.waitForURL('**/courses');
    await page.getByText('NestJS Basics').first().click();
    await page.waitForURL(/\/courses\/[a-f0-9-]+/, { timeout: 10_000 });
    await expect(
      page.getByRole('button', { name: /enroll/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should enroll in a course', async ({ page }) => {
    await loginAsStudent(page);
    await page.getByRole('link', { name: /browse courses/i }).first().click();
    await page.waitForURL('**/courses');
    await page.getByText('NestJS Basics').first().click();
    await page.waitForURL(/\/courses\/[a-f0-9-]+/, { timeout: 10_000 });
    await page.getByRole('button', { name: /enroll/i }).click();
    await expect(
      page.getByRole('button', { name: /continue learning/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('should navigate to lesson from enrolled course', async ({ page }) => {
    await loginAsStudent(page);
    await page.getByRole('link', { name: /browse courses/i }).first().click();
    await page.waitForURL('**/courses');
    await page.getByText('NestJS Basics').first().click();
    await page.waitForURL(/\/courses\/[a-f0-9-]+/, { timeout: 10_000 });
    await page
      .getByRole('button', { name: /continue learning/i })
      .click();
    await page.waitForURL(/\/courses\/[a-f0-9-]+\/lessons\/[a-f0-9-]+/, {
      timeout: 10_000,
    });
    await expect(page).toHaveURL(/\/lessons\//);
  });
});

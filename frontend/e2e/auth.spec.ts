import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page with form fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Sign in', { exact: true }).first()).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('nobody@invalid.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('[data-sonner-toast]').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('should login as admin and redirect to admin/users', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@lms.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    // Admin role is correct in DB
    await page.waitForURL('**/admin/users', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/admin\/users/);
  });

  test('should navigate to registration page', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Register' }).click();
    await page.waitForURL('**/register');
    await expect(
      page.getByText('Create an account', { exact: true }).first(),
    ).toBeVisible();
  });

  test('should register a new user and redirect', async ({ page }) => {
    const uid = Date.now();
    await page.goto('/register');
    await page.getByLabel('Name').fill('PW Test User');
    await page.getByLabel('Email').fill(`pw-test-${uid}@e2e.test`);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Create account' }).click();
    // New users are students → /my-learning
    await page.waitForURL('**/my-learning', { timeout: 15_000 });
    await expect(page).toHaveURL(/\/my-learning/);
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    await page.goto('/my-learning');
    await page.waitForURL('**/login', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect Student from /my-courses to /my-learning', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('student@lms.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/my-learning', { timeout: 15_000 });
    await page.goto('/my-courses');
    await page.waitForURL('**/my-learning', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/my-learning/);
  });

  test('should redirect Instructor from /admin/users to /my-courses', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('instructor@lms.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/my-courses', { timeout: 15_000 });
    await page.goto('/admin/users');
    await page.waitForURL('**/my-courses', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/my-courses/);
  });

  test('should redirect Admin from /my-learning to /admin/users', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@lms.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await page.waitForURL('**/admin/users', { timeout: 15_000 });
    await page.goto('/my-learning');
    await page.waitForURL('**/admin/users', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/admin\/users/);
  });
});

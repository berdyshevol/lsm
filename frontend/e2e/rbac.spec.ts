import { test, expect, type Page } from '@playwright/test';

// ---------------------------------------------------------------------------
// Login helpers – use seeded demo accounts
// ---------------------------------------------------------------------------
async function loginAs(
  page: Page,
  email: string,
  expectedUrl: RegExp,
) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill('password123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(expectedUrl, { timeout: 15_000 });
}

const loginAsStudent = (page: Page) =>
  loginAs(page, 'student@lms.com', /\/my-learning/);

const loginAsInstructor = (page: Page) =>
  loginAs(page, 'instructor@lms.com', /\/my-courses/);

const loginAsAdmin = (page: Page) =>
  loginAs(page, 'admin@lms.com', /\/admin\/users/);

// ---------------------------------------------------------------------------
// 1. Route access – denied routes redirect to role-specific landing page
// ---------------------------------------------------------------------------
test.describe('RBAC – Route Redirects', () => {
  test.describe('Student denied routes', () => {
    test('Student → /admin/users redirects to /my-learning', async ({ page }) => {
      await loginAsStudent(page);
      await page.goto('/admin/users');
      await page.waitForURL('**/my-learning', { timeout: 10_000 });
      await expect(page).toHaveURL(/\/my-learning/);
    });

    test('Student → /admin/courses redirects to /my-learning', async ({ page }) => {
      await loginAsStudent(page);
      await page.goto('/admin/courses');
      await page.waitForURL('**/my-learning', { timeout: 10_000 });
      await expect(page).toHaveURL(/\/my-learning/);
    });

    test('Student → /my-courses/:id/edit redirects to /my-learning', async ({ page }) => {
      await loginAsStudent(page);
      await page.goto('/my-courses/00000000-0000-0000-0000-000000000000/edit');
      await page.waitForURL('**/my-learning', { timeout: 10_000 });
      await expect(page).toHaveURL(/\/my-learning/);
    });
  });

  test.describe('Instructor denied routes', () => {
    test('Instructor → /my-learning redirects to /my-courses', async ({ page }) => {
      await loginAsInstructor(page);
      await page.goto('/my-learning');
      await page.waitForURL('**/my-courses', { timeout: 10_000 });
      await expect(page).toHaveURL(/\/my-courses/);
    });

    test('Instructor → /admin/users redirects to /my-courses', async ({ page }) => {
      await loginAsInstructor(page);
      await page.goto('/admin/users');
      await page.waitForURL('**/my-courses', { timeout: 10_000 });
      await expect(page).toHaveURL(/\/my-courses/);
    });

    test('Instructor → /admin/courses redirects to /my-courses', async ({ page }) => {
      await loginAsInstructor(page);
      await page.goto('/admin/courses');
      await page.waitForURL('**/my-courses', { timeout: 10_000 });
      await expect(page).toHaveURL(/\/my-courses/);
    });
  });

  test.describe('Admin denied routes', () => {
    test('Admin → /my-courses redirects to /admin/users', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/my-courses');
      await page.waitForURL('**/admin/users', { timeout: 10_000 });
      await expect(page).toHaveURL(/\/admin\/users/);
    });

    test('Admin → /my-courses/:id/edit redirects to /admin/users', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/my-courses/00000000-0000-0000-0000-000000000000/edit');
      await page.waitForURL('**/admin/users', { timeout: 10_000 });
      await expect(page).toHaveURL(/\/admin\/users/);
    });

    test('Admin → /my-learning redirects to /admin/users', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/my-learning');
      await page.waitForURL('**/admin/users', { timeout: 10_000 });
      await expect(page).toHaveURL(/\/admin\/users/);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Public route protection – authenticated users bounced from /login & /register
// ---------------------------------------------------------------------------
test.describe('RBAC – Public Route Protection', () => {
  test('Authenticated Student visiting /login redirects to /my-learning', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/login');
    await page.waitForURL('**/my-learning', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/my-learning/);
  });

  test('Authenticated Instructor visiting /login redirects to /my-courses', async ({ page }) => {
    await loginAsInstructor(page);
    await page.goto('/login');
    await page.waitForURL('**/my-courses', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/my-courses/);
  });

  test('Authenticated Admin visiting /login redirects to /admin/users', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/login');
    await page.waitForURL('**/admin/users', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/admin\/users/);
  });

  test('Authenticated Student visiting /register redirects to /my-learning', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/register');
    await page.waitForURL('**/my-learning', { timeout: 10_000 });
    await expect(page).toHaveURL(/\/my-learning/);
  });
});

// ---------------------------------------------------------------------------
// 3. Shared routes – /courses catalog is accessible to every role
// ---------------------------------------------------------------------------
test.describe('RBAC – Shared Routes', () => {
  test('Student can access /courses catalog', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/courses');
    await expect(page.getByRole('heading', { name: 'Course Catalog' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Instructor can access /courses catalog', async ({ page }) => {
    await loginAsInstructor(page);
    await page.goto('/courses');
    await expect(page.getByRole('heading', { name: 'Course Catalog' })).toBeVisible({
      timeout: 10_000,
    });
  });

  test('Admin can access /courses catalog', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/courses');
    await expect(page.getByRole('heading', { name: 'Course Catalog' })).toBeVisible({
      timeout: 10_000,
    });
  });
});

// ---------------------------------------------------------------------------
// 4. Sidebar navigation – each role sees only its own links
// ---------------------------------------------------------------------------
test.describe('RBAC – Sidebar Navigation', () => {
  test('Student sidebar shows My Learning & Browse Courses only', async ({ page }) => {
    await loginAsStudent(page);
    const sidebar = page.locator('[data-sidebar="sidebar"]');

    // Visible nav items
    await expect(sidebar.getByText('My Learning')).toBeVisible();
    await expect(sidebar.getByText('Browse Courses')).toBeVisible();

    // Hidden nav items
    await expect(sidebar.getByText('My Courses')).not.toBeVisible();
    await expect(sidebar.getByText('Users')).not.toBeVisible();
    await expect(sidebar.getByText('All Courses')).not.toBeVisible();

    // Role badge
    await expect(sidebar.getByText('Student')).toBeVisible();
  });

  test('Instructor sidebar shows My Courses & Browse Courses only', async ({ page }) => {
    await loginAsInstructor(page);
    const sidebar = page.locator('[data-sidebar="sidebar"]');

    await expect(sidebar.getByText('My Courses')).toBeVisible();
    await expect(sidebar.getByText('Browse Courses')).toBeVisible();

    await expect(sidebar.getByText('My Learning')).not.toBeVisible();
    await expect(sidebar.getByText('Users')).not.toBeVisible();
    await expect(sidebar.getByText('All Courses')).not.toBeVisible();

    await expect(sidebar.getByText('Instructor')).toBeVisible();
  });

  test('Admin sidebar shows Users & All Courses only', async ({ page }) => {
    await loginAsAdmin(page);
    const sidebar = page.locator('[data-sidebar="sidebar"]');

    await expect(sidebar.getByText('Users')).toBeVisible();
    await expect(sidebar.getByText('All Courses')).toBeVisible();

    await expect(sidebar.getByText('My Learning')).not.toBeVisible();
    await expect(sidebar.getByText('My Courses')).not.toBeVisible();
    await expect(sidebar.getByText('Browse Courses')).not.toBeVisible();

    await expect(sidebar.locator('[data-slot="badge"]', { hasText: 'Admin' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Admin-only UI – user management table & role change dropdown
// ---------------------------------------------------------------------------
test.describe('RBAC – Admin UI Actions', () => {
  test('Admin sees user table with role change dropdowns', async ({ page }) => {
    await loginAsAdmin(page);

    // Users heading
    await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible({
      timeout: 10_000,
    });

    // Table columns
    const table = page.locator('table');
    await expect(table.getByText('Name')).toBeVisible();
    await expect(table.getByText('Email')).toBeVisible();
    await expect(table.getByText('Role')).toBeVisible();
    await expect(table.getByText('Actions')).toBeVisible();

    // At least the seeded demo users are listed
    await expect(table.getByText('student@lms.com')).toBeVisible({ timeout: 10_000 });

    // Role change dropdown exists (Select trigger)
    const roleSelects = table.locator('button[role="combobox"]');
    await expect(roleSelects.first()).toBeVisible();
  });

  test('Admin can access /admin/courses and see course list', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/courses');

    await expect(page.getByRole('heading', { name: 'All Courses' })).toBeVisible({
      timeout: 10_000,
    });

    // Table column headers
    await expect(page.getByRole('columnheader', { name: 'Title' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Instructor' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Modules' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Lessons' })).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 6. Instructor-only UI – "Create Course" button visibility
// ---------------------------------------------------------------------------
test.describe('RBAC – Instructor UI Elements', () => {
  test('Instructor sees Create Course button on /my-courses', async ({ page }) => {
    await loginAsInstructor(page);
    await expect(page.getByRole('button', { name: /create course/i })).toBeVisible({
      timeout: 10_000,
    });
  });
});

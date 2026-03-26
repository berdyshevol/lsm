# Story 1.5: Frontend Role-Based Route Guards

Status: ready-for-dev

## Story

As a **platform user**,
I want the frontend to enforce role-based access on routes and UI elements,
So that I cannot navigate to pages or see actions outside my role's permissions.

## Acceptance Criteria

1. **Given** an authenticated Student navigating to `/my-courses` or `/my-courses/:id/edit` **When** the route loads **Then** the Student is redirected to `/my-learning` (their default landing page).

2. **Given** an authenticated Student navigating to `/admin/users` or `/admin/courses` **When** the route loads **Then** the Student is redirected to `/my-learning`.

3. **Given** an authenticated Instructor navigating to `/my-learning` **When** the route loads **Then** the Instructor is redirected to `/my-courses`.

4. **Given** an authenticated Instructor navigating to `/admin/users` or `/admin/courses` **When** the route loads **Then** the Instructor is redirected to `/my-courses`.

5. **Given** an authenticated Admin navigating to `/my-learning` or `/my-courses` **When** the route loads **Then** the Admin is redirected to `/admin/users`.

6. **Given** any authenticated user on `/my-courses` page **When** the page renders **Then** the "Create Course" button is only visible to users with the Instructor role.

7. **Given** the `/courses` (Browse Courses) route **When** any authenticated user navigates there **Then** access is allowed for all roles (shared route).

8. **Given** the `/courses/:id` and `/courses/:id/lessons/:lessonId` routes **When** any authenticated user navigates there **Then** access is allowed for all roles (backend enforces enrollment check).

9. **Given** an unauthenticated user navigating to any protected route **When** the route loads **Then** existing behavior is preserved: redirect to `/login`.

## Tasks / Subtasks

- [ ] Task 1: Create `RoleRoute` guard component in `App.tsx` (AC: #1-5, #7-9)
  - [ ] Add a `RoleRoute` component that reads `user.role` from `useAuth()` and an `allowed` prop (array of roles)
  - [ ] If user role is NOT in `allowed`, redirect to `defaultLanding[user.role]` using `<Navigate replace />`
  - [ ] If user role IS in `allowed`, render `<Outlet />` (pass-through for nested routes)
  - [ ] Import `Outlet` from `react-router` (add to existing import)

- [ ] Task 2: Apply `RoleRoute` to protected routes in `App.tsx` (AC: #1-5, #7-8)
  - [ ] Wrap `/my-learning` route with `<RoleRoute allowed={['Student']} />`
  - [ ] Wrap `/my-courses` and `/my-courses/:id/edit` routes with `<RoleRoute allowed={['Instructor']} />`
  - [ ] Wrap `/admin/users` and `/admin/courses` routes with `<RoleRoute allowed={['Admin']} />`
  - [ ] Leave `/courses` route unguarded (shared across all roles)
  - [ ] Do NOT modify `ProtectedCourseDetailRoute` or `ProtectedLessonRoute` — they remain accessible to all authenticated users

- [ ] Task 3: Conditional "Create Course" button in `MyCoursesPage.tsx` (AC: #6)
  - [ ] Import `useAuth` from `@/hooks/useAuth`
  - [ ] Destructure `isInstructor` from `useAuth()`
  - [ ] Wrap the "Create Course" `<Button>` with `{isInstructor && (...)}`
  - [ ] Also wrap the EmptyState "Create your first course" CTA with `{isInstructor && (...)}`

- [ ] Task 4: Fix demo account roles in database (AC: prerequisite)
  - [ ] Via admin API: `PATCH /api/users/{student-id}/role` → `Student`
  - [ ] Via admin API: `PATCH /api/users/{instructor-id}/role` → `Instructor`
  - [ ] Note: This is a data fix, not a code fix. Roles were swapped via the admin UI at some point.

- [ ] Task 5: Update Playwright e2e tests (AC: #1-6)
  - [ ] Add test in `frontend/e2e/auth.spec.ts`: Student trying to access `/my-courses` is redirected to `/my-learning`
  - [ ] Add test: Instructor trying to access `/admin/users` is redirected to `/my-courses`
  - [ ] Add test: Admin trying to access `/my-learning` is redirected to `/admin/users`
  - [ ] Verify existing auth tests still pass (login redirects, registration flow)

- [ ] Task 6: Verify end-to-end (AC: all)
  - [ ] Run `cd frontend && npm run build` — must compile cleanly
  - [ ] Run `cd frontend && npm run lint` — must pass
  - [ ] Run `cd backend && npm run test:e2e` — all 59 backend tests pass
  - [ ] Run `cd frontend && npx playwright test` — all tests pass including new ones
  - [ ] Manual verification: login as Student, confirm cannot access `/my-courses` or `/admin/*`

## Dev Notes

### Critical: What Exists Already — USE, DO NOT RECREATE

**Auth infrastructure (Story 1.3, `src/hooks/useAuth.tsx`):**
- `useAuth()` hook provides: `{ user, isAuthenticated, isLoading, isAdmin, isInstructor, isStudent, login, register, logout }`
- Role booleans `isStudent`, `isInstructor`, `isAdmin` already exist at lines 88-90 — use these directly
- `User['role']` type is `'Student' | 'Instructor' | 'Admin'` (line 19)

**Route structure (Story 1.3, `src/App.tsx`):**
- `defaultLanding` map already exists at lines 17-21 — reuse for role redirect targets
- `ProtectedRoute` (line 23) already handles auth check — role guard nests inside it
- `PublicRoute` (line 77) already redirects authenticated users — do not modify

**Sidebar navigation (Story 1.3, `src/components/layout/AppSidebar.tsx`):**
- `navByRole` at lines 39-52 already restricts sidebar links per role — this is correct, but doesn't prevent direct URL navigation
- The sidebar only hides navigation links; it doesn't prevent route access

**MyCoursesPage (`src/pages/MyCoursesPage.tsx`):**
- Uses `useInstructorCourses()` hook — calls `GET /api/courses/my` which returns 403 for non-instructors (backend guard works)
- The issue is purely UI: button + empty state CTA render unconditionally

### Architecture Compliance

**Route nesting pattern — the RoleRoute fits inside existing ProtectedRoute:**
```
<Route element={<ProtectedRoute />}>        ← checks auth (existing)
  <Route element={<RoleRoute allowed={['Student']} />}>  ← checks role (NEW)
    <Route path="/my-learning" element={<MyLearningPage />} />
  </Route>
  <Route element={<RoleRoute allowed={['Instructor']} />}>
    <Route path="/my-courses" element={<MyCoursesPage />} />
    <Route path="/my-courses/:id/edit" element={<CourseEditorPage />} />
  </Route>
  <Route path="/courses" element={<CourseCatalogPage />} />  ← no role guard
  <Route element={<RoleRoute allowed={['Admin']} />}>
    <Route path="/admin/users" element={<AdminUsersPage />} />
    <Route path="/admin/courses" element={<AdminCoursesPage />} />
  </Route>
</Route>
```

**React Router v7** — use `react-router` package (NOT `react-router-dom`). Import `Outlet` and `Navigate` from `react-router`.

**No new files** — `RoleRoute` is a small component (~8 lines), define it in `App.tsx` alongside existing `ProtectedRoute`, `PublicRoute`, `RootRedirect`.

### File Modification Summary

| File | Change |
|------|--------|
| `frontend/src/App.tsx` | Add `RoleRoute` component, add `Outlet` import, wrap role-specific routes |
| `frontend/src/pages/MyCoursesPage.tsx` | Import `useAuth`, wrap Create Course button/CTA with `isInstructor` check |
| `frontend/e2e/auth.spec.ts` | Add 3+ role-based redirect tests |

### Anti-Patterns to Avoid

- **Do NOT create a separate RoleGuard file** — it's too small to justify a new file; keep it in App.tsx with the other route wrappers
- **Do NOT add role checks to every page component** — centralize in the router; only add UI-level checks for conditional elements (buttons, CTAs)
- **Do NOT modify backend** — backend RBAC already works correctly (403 on wrong role). This story is frontend-only.
- **Do NOT modify AppSidebar** — it already filters nav items by role correctly
- **Do NOT show a "403 Forbidden" page** — per UX spec (line 1133): unauthorized route → silent redirect to role's default landing page

### Testing Standards

**Playwright e2e test pattern (from existing `frontend/e2e/auth.spec.ts`):**
- Test helpers: use `page.goto()`, `page.fill()`, `page.click()`, `page.waitForURL()`
- Auth flow: fill email/password fields, click submit, wait for redirect
- Each test creates its own user via API or uses demo accounts
- Config: `playwright.config.ts` auto-starts both backend (port 3001) and frontend (port 3000)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 1, FR24, NFR3]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Lines 1133-1134: unauthorized route redirect pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md — Lines 382-383: auth boundary definition]
- [Source: frontend/src/App.tsx — Lines 17-21: defaultLanding, Lines 23-39: ProtectedRoute]
- [Source: frontend/src/hooks/useAuth.tsx — Lines 88-90: role booleans]
- [Source: frontend/src/pages/MyCoursesPage.tsx — Lines 20-23: unconditional Create Course button]

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
inputDocuments:
  - planning-artifacts/prd.md
  - planning-artifacts/architecture.md
  - planning-artifacts/ux-design-specification.md
---

# lsm - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for lsm, decomposing the requirements from the PRD, UX Design, and Architecture into implementable stories.

## Requirements Inventory

### Functional Requirements

- FR1: User can register with name, email, and password
- FR2: User can log in and receive a JWT access token
- FR3: User can log out
- FR4: User receives the Student role automatically upon registration
- FR5: Admin can view a list of all registered users
- FR6: Admin can change any user's role (Student, Instructor, Admin)
- FR7: Instructor can create a new course with title and description
- FR8: Instructor can edit their own courses
- FR9: Instructor can delete their own courses
- FR10: Instructor can view a list of their own courses
- FR11: Instructor can add modules to their course
- FR12: Instructor can edit and delete modules within their course
- FR13: Instructor can add lessons with markdown content to a module
- FR14: Instructor can edit and delete lessons within their modules
- FR15: Admin can view a list of all courses on the platform
- FR16: Student can browse a catalog of all courses
- FR17: Student can view course details (title, description, module/lesson structure)
- FR18: Student can enroll in a course
- FR19: Student can view a list of their enrolled courses
- FR20: Student can read lesson content (rendered markdown)
- FR21: Student can mark a lesson as complete
- FR22: Student can view their progress percentage per enrolled course
- FR23: System calculates progress as (completed lessons / total lessons) x 100%
- FR24: System restricts access to endpoints based on user role
- FR25: System provides auto-generated API documentation via Swagger
- FR26: System includes seed data: 3 users (admin@lms.com, instructor@lms.com, student@lms.com, password: password123), 2-3 courses with modules and lessons, one student enrolled with partial progress

### NonFunctional Requirements

- NFR1: Passwords hashed with bcrypt before storage
- NFR2: JWT token required for all protected API endpoints
- NFR3: Role-based guards enforce access control on every protected route
- NFR4: API returns proper HTTP status codes (401 Unauthorized, 403 Forbidden, 404 Not Found)
- NFR5: No sensitive data (passwords, tokens) exposed in API responses
- NFR6: UI built with shadcn/ui (Radix UI) providing WCAG AA compliance out of the box
- NFR7: Semantic HTML elements used for page structure
- NFR8: All interactive elements keyboard-navigable
- NFR9: Project follows typical NestJS modular structure (one module per domain)
- NFR10: API endpoints documented via Swagger decorators
- NFR11: Consistent error response format across all endpoints
- NFR12: TypeScript strict mode enabled

### Additional Requirements

- Starter template: NestJS CLI (`npx @nestjs/cli new backend --strict --package-manager npm`) for backend; shadcn/ui Vite template (`npx shadcn@latest init`) for frontend with specified component and dependency installations — must be the first implementation story
- Single-origin deployment: NestJS serves React build via `ServeStaticModule` — one Render web service, one URL, no CORS needed
- TypeORM Data Mapper pattern with repositories injected via DI; `synchronize: true`, no migrations for demo
- PostgreSQL + TypeORM 0.4.x + @nestjs/typeorm 11.0.0
- Passport auth: Local strategy (email+password → JWT) + JWT strategy (cookie extraction); JWT stored in httpOnly cookie (`SameSite=Lax`, `Secure` in production)
- Global exception filter: All errors normalized to `{ statusCode, message, error }` via `HttpExceptionFilter`
- Validation: `class-validator` + `class-transformer` via global `ValidationPipe`
- Frontend data layer: TanStack React Query v5 for server state; native `fetch` wrapper (`fetchApi`) with `credentials: 'include'`; `QueryClient` default `onError` for toast error handling
- Frontend state architecture: Server data (React Query), Auth state (React Context `useAuth`), UI state (local component state) — three layers, zero overlap
- Forms: react-hook-form + zod + shadcn Form
- Seed data creation order: Users → Courses → Modules → Lessons → Enrollments → Progress (TypeORM seeder on bootstrap)
- Progress → Lessons coupling: Progress module queries across Course → Module → Lesson hierarchy for percentage calculation
- Swagger with cookie auth configured so interviewer can test authenticated endpoints
- Monorepo structure: `/backend` + `/frontend` with separate `package.json` files
- Backend naming: `snake_case` DB tables/columns, `/api/` prefix for endpoints, `kebab-case` files, `PascalCase` classes, `camelCase` JSON responses
- Frontend naming: `PascalCase` component files, `camelCase` hooks/utils, domain-grouped folders
- React Router v7 (`react-router` package, not `react-router-dom`)
- API responses: direct data (no wrapper), consistent error format, ISO 8601 dates
- Backend module structure: `src/auth/`, `src/users/`, `src/courses/`, `src/enrollments/`, `src/progress/`, `src/common/filters/`, `src/seed/`
- Frontend structure: `src/pages/`, `src/components/ui/` (shadcn untouched), `src/components/layout/`, `src/components/course/`, `src/components/common/`, `src/hooks/`, `src/lib/`
- Environment variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`
- Deployment: Single Render web service (free tier) + Render PostgreSQL addon; frontend build output → `backend/public/`

### UX Design Requirements

- UX-DR1: DemoCredentials component — three one-click login buttons on the login page showing role icon + email + role label for each seed account (Student, Instructor, Admin). Loading state on clicked button, others disabled. Error toast on failure.
- UX-DR2: AppSidebar — role-aware global navigation. Nav items change per role: Student (My Learning, Browse Courses), Instructor (My Courses, Browse Courses), Admin (Users, All Courses). Active item highlighted with `bg-muted`. User section at bottom with DropdownMenu (Switch Account, Logout). App logo/name at top.
- UX-DR3: AppLayout — page shell wrapping all authenticated routes. Contains AppSidebar (left), main content area (`p-6`, `max-w-5xl`), Toaster (Sonner), and dynamic Breadcrumbs. Route detection switches between AppSidebar and CourseSidebar based on current route.
- UX-DR4: CourseSidebar — module/lesson navigation tree within a course. Two modes: interactive (lesson view, P0) with clickable lessons, checkmarks on completed, active lesson highlighted; read-only (course detail preview, P1) shows structure only. Course title + progress bar at top.
- UX-DR5: CourseCard — composed card (shadcn Card + Badge + Progress). Two variants: catalog (footer shows lesson count badge) and enrolled (footer shows progress bar + percentage). Hover shadow transition, entire card clickable link.
- UX-DR6: EmptyState — reusable component with contextual icon (lucide-react), heading, description, and CTA button. My Learning empty → "No courses yet" + "Browse Courses"; My Courses empty → "Create your first course" + "Create Course".
- UX-DR7: RoleBadge — color-coded role badges using shadcn Badge: Student (blue-100/blue-700), Instructor (green-100/green-700), Admin (red-100/red-700). Color always paired with text.
- UX-DR8: Breadcrumbs (P1) — dynamic breadcrumb from route params. Shows on pages with depth > 1 (e.g., Courses > NestJS Basics > Module 1 > Lesson 3). Clickable segments.
- UX-DR9: Cold start UX — if backend takes >3s to respond on first visit, display: "Server is waking up (free tier hosting) — this takes ~30 seconds on first visit." Info toast or inline message.
- UX-DR10: Optimistic UI for lesson completion — "Mark Complete" button changes to "Completed" immediately, sidebar checkmark appears (<200ms), progress bar recalculates client-side and ticks up. Reverts on API error with toast.
- UX-DR11: Enrollment flow — one-click "Enroll" button on course detail, changes to "Continue Learning" on same page (no redirect), toast "Enrolled successfully!", no duplicate enrollment possible.
- UX-DR12: Toast notification feedback via Sonner on all state-changing actions. Success (3s auto-dismiss), Error (5s, manual dismiss, includes next action suggestion), Info (until dismissed). Position: bottom-right.
- UX-DR13: Delete confirmation via shadcn AlertDialog — reusable ConfirmDeleteDialog accepting `itemType`, `itemName`, `onConfirm`. Used for courses, modules, and lessons.
- UX-DR14: Form patterns — validation on submit only (zod + react-hook-form + shadcn Form). Inline errors below fields. Submit button shows spinner + "Creating..." during API call. Form data preserved on API error.
- UX-DR15: Loading states — Skeleton placeholders for API calls exceeding 300ms. Cold start gets honest text message. No blank pages ever.
- UX-DR16: Responsive layout — desktop-first with Tailwind breakpoints. Sidebar visible at lg (1024px+), hamburger below. Catalog grid: 3-col (lg), 2-col (md), 1-col (mobile). Tables scroll horizontally on mobile. Forms: full-width mobile, max-w-md desktop.
- UX-DR17: Role-specific default landing pages — Student → My Learning, Instructor → My Courses, Admin → Users.
- UX-DR18: Switch Account flow — user menu "Switch Account" calls POST /auth/logout, clears React context + React Query cache + sidebar state, redirects to /login. Browser history preserved.
- UX-DR19: Enrollment-aware CTA on course detail — "Enroll" if not enrolled, "Continue Learning" + progress indicator if already enrolled.
- UX-DR20: Seed data as UX — realistic course titles/content (not lorem ipsum), student at ~42% progress (5/12 lessons), 2-3 courses with modules and lessons, short technical markdown content.
- UX-DR21: Sidebar context switching — when inside a course lesson route (`/courses/:id/lessons/:lessonId`), global AppSidebar yields to CourseSidebar. Never show two full sidebars simultaneously.
- UX-DR22: Skip link to main content for accessibility: `<a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>`
- UX-DR23: Navigation feedback — active sidebar item updates immediately on click, before content loads. Current-page indicator via `aria-current="page"`.
- UX-DR24: Button hierarchy — one primary button per page section; destructive buttons require AlertDialog; button labels are verbs ("Create", "Save", "Delete", "Enroll"); loading state shows spinner + action text.

### FR Coverage Map

- FR1: Epic 1 — User registration (name, email, password)
- FR2: Epic 1 — User login with JWT
- FR3: Epic 1 — User logout
- FR4: Epic 1 — Auto-assign Student role on registration
- FR5: Epic 5 — Admin views all users
- FR6: Epic 5 — Admin changes user roles
- FR7: Epic 2 — Instructor creates course
- FR8: Epic 2 — Instructor edits own courses
- FR9: Epic 2 — Instructor deletes own courses
- FR10: Epic 2 — Instructor views own courses
- FR11: Epic 2 — Instructor adds modules
- FR12: Epic 2 — Instructor edits/deletes modules
- FR13: Epic 2 — Instructor adds lessons (markdown)
- FR14: Epic 2 — Instructor edits/deletes lessons
- FR15: Epic 5 — Admin views all courses
- FR16: Epic 3 — Student browses course catalog
- FR17: Epic 3 — Student views course details
- FR18: Epic 3 — Student enrolls in course
- FR19: Epic 3 — Student views enrolled courses
- FR20: Epic 4 — Student reads lesson content
- FR21: Epic 4 — Student marks lesson complete
- FR22: Epic 4 — Student views progress percentage
- FR23: Epic 4 — System calculates progress
- FR24: Epic 1 — Role-based access control
- FR25: Epic 5 — Swagger API documentation
- FR26: Epic 6 — Seed data

## Epic List

### Epic 1: User Authentication & App Shell (4 stories)
Users can register, log in, navigate a role-aware application, and log out. The foundation everything else builds on — project scaffolding, auth flow, layout shell, and RBAC.
**FRs covered:** FR1, FR2, FR3, FR4, FR24
**NFRs addressed:** NFR1, NFR2, NFR3, NFR4, NFR5, NFR6, NFR7, NFR8, NFR9, NFR11, NFR12
**Key UX:** Login/Register pages, DemoCredentials (UX-DR1), AppLayout (UX-DR3), AppSidebar (UX-DR2), RoleBadge (UX-DR7), responsive sidebar (UX-DR16), Switch Account (UX-DR18), role-specific landing pages (UX-DR17), toast setup (UX-DR12), skip link (UX-DR22), navigation feedback (UX-DR23)

### Epic 2: Course Creation & Management (Instructor) (4 stories)
Instructors can create complete courses with modules and lessons, edit and delete their content. Full content authoring workflow.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14
**Key UX:** InstructorCourses page, CourseEditor page, form validation (UX-DR14, UX-DR15), delete confirmation (UX-DR13), EmptyState for My Courses (UX-DR6), toast feedback (UX-DR12), button hierarchy (UX-DR24)

### Epic 3: Course Discovery & Enrollment (Student)
Students can browse available courses, view course details with module/lesson structure, enroll, and see their enrolled courses.
**FRs covered:** FR16, FR17, FR18, FR19
**Key UX:** CourseCatalog page, CourseDetail page, CourseCard (UX-DR5), MyLearning page, enrollment-aware CTA (UX-DR11, UX-DR19), EmptyState for My Learning (UX-DR6), toast feedback (UX-DR12)

### Epic 4: Learning Experience & Progress Tracking (Student)
Students can read lesson content (rendered markdown), mark lessons complete, and track progress with visual feedback across the application.
**FRs covered:** FR20, FR21, FR22, FR23
**Key UX:** LessonView page, CourseSidebar interactive mode (UX-DR4), LessonContent with markdown rendering, optimistic UI for completion (UX-DR10), progress bars on MyLearning cards, sidebar context switching (UX-DR21)

### Epic 5: Platform Administration (Admin)
Admin can manage users, assign roles, and oversee all platform content. API documentation accessible for the interviewer.
**FRs covered:** FR5, FR6, FR15, FR25
**NFRs addressed:** NFR10
**Key UX:** AdminUsers page (data table + inline role dropdown), AdminCourses page (data table), Swagger/OpenAPI docs with cookie auth

### Epic 6: Seed Data, Polish & Deployment
The application is deployed with realistic seed data that tells its own story — a self-narrating demo ready for interviewer evaluation.
**FRs covered:** FR26
**Key UX:** Seed data design (UX-DR20), Breadcrumbs (UX-DR8), cold start UX (UX-DR9), CourseSidebar read-only mode (UX-DR4 P1), deployment to Render

## Epic 1: User Authentication & App Shell

Users can register, log in, navigate a role-aware application, and log out. The foundation everything else builds on — project scaffolding, auth flow, layout shell, and RBAC.

### Story 1.1: Project Scaffolding & Monorepo Configuration

As a **developer**,
I want the backend and frontend projects scaffolded with all dependencies installed,
So that development can begin on a properly configured monorepo.

**Acceptance Criteria:**

**Given** the project root directory
**When** the NestJS CLI scaffolds the backend (`npx @nestjs/cli new backend --strict --package-manager npm`)
**Then** `/backend` contains a working NestJS project with TypeScript strict mode, ESLint, and Prettier configured

**Given** the backend project
**When** TypeORM, Passport, Swagger, and other backend dependencies are installed
**Then** `@nestjs/typeorm`, `typeorm`, `pg`, `@nestjs/passport`, `passport`, `passport-local`, `passport-jwt`, `@nestjs/jwt`, `@nestjs/swagger`, `class-validator`, `class-transformer`, `bcrypt` are available, along with their `@types/*` dev dependencies

**Given** the project root directory
**When** the shadcn/ui Vite template scaffolds the frontend (`npx shadcn@latest init`)
**Then** `/frontend` contains a working React + TypeScript + Tailwind project with shadcn/ui configured

**Given** the frontend project
**When** shadcn components and additional dependencies are installed
**Then** all 17 shadcn components (card, button, progress, table, badge, breadcrumb, sidebar, input, textarea, select, accordion, scroll-area, skeleton, form, dropdown-menu, separator, label) are in `src/components/ui/`, and `@tanstack/react-query`, `sonner`, `react-router`, `react-hook-form`, `@hookform/resolvers`, `zod`, `@tailwindcss/typography`, `lucide-react` are installed

**Given** the frontend Vite configuration
**When** a dev proxy is configured for `/api` requests
**Then** requests to `/api/*` from the frontend dev server (port 3000) are proxied to the backend dev server (port 3001), enabling frontend-backend communication during development without CORS

**Given** both projects are scaffolded
**When** running `npm run start:dev` (backend) and `npm run dev` (frontend)
**Then** both development servers start without errors and the frontend can reach backend API via the Vite proxy

### Story 1.2: User Registration & Authentication API

As a **user**,
I want to register, log in, and log out of the platform,
So that I have secure access to role-appropriate features.

**Acceptance Criteria:**

**Given** no existing account
**When** a user sends `POST /api/auth/register` with `{ name, email, password }`
**Then** a new user is created with bcrypt-hashed password, assigned the Student role, an httpOnly JWT cookie is set, and the response body returns `{ id, name, email, role }` (no password in response)

**Given** invalid registration data (missing fields, invalid email, short password)
**When** the request is sent
**Then** the API returns 400 with validation errors in `{ statusCode, message, error }` format

**Given** a registered user
**When** they send `POST /api/auth/login` with correct `{ email, password }`
**Then** an httpOnly JWT cookie is set (`SameSite=Lax`, `Secure` in production, `Path=/`, `Max-Age=86400`) and response returns `{ id, name, email, role }`

**Given** invalid credentials
**When** a user sends `POST /api/auth/login`
**Then** the API returns 401 Unauthorized with consistent error format

**Given** an authenticated user
**When** they send `GET /api/auth/me`
**Then** the JWT is read from the httpOnly cookie and the response returns `{ id, name, email, role }`

**Given** an authenticated user
**When** they send `POST /api/auth/logout`
**Then** the httpOnly cookie is cleared (`Max-Age=0`) and the response confirms logout

**Given** no JWT cookie or an expired/invalid token
**When** a request is sent to any protected endpoint
**Then** the API returns 401 Unauthorized

**Given** the User entity
**When** created with TypeORM
**Then** the `users` table has columns: `id` (UUID), `name`, `email` (unique), `password`, `role` (enum: Student, Instructor, Admin, default Student), `created_at`, `updated_at` — using snake_case column names

**Given** the auth module
**When** guards are applied
**Then** `JwtAuthGuard` protects all routes requiring authentication, and the global `HttpExceptionFilter` normalizes all errors to `{ statusCode, message, error }`

**Given** the global configuration
**When** the app bootstraps
**Then** `ValidationPipe` is registered globally with `whitelist: true` and `transform: true`, and Swagger is bootstrapped at `/api/docs` with basic configuration (full decorator coverage and cookie auth testing deferred to Story 5.1)

### Story 1.3: Frontend Foundation & App Shell

As a **developer**,
I want the frontend infrastructure and app shell in place,
So that all subsequent frontend stories have routing, API communication, state management, and layout ready.

**Acceptance Criteria:**

**Given** the frontend application
**When** it loads
**Then** React Router v7 is configured with route placeholders for all pages, a `fetchApi` wrapper handles all API calls with `credentials: 'include'`, React Query `QueryClient` is set up with default `onError` showing toast via Sonner, and the `<Toaster />` component is mounted

**Given** an authenticated user on any page
**When** they view the app shell
**Then** they see an `AppLayout` with: `AppSidebar` (left, `w-64` on desktop, hamburger on mobile), main content area (`p-6`, `max-w-5xl`), and a skip link (`<a href="#main">Skip to content</a>`) hidden until focused

**Given** the `AppSidebar`
**When** rendered for different roles
**Then** it shows role-appropriate nav items — Student: My Learning, Browse Courses; Instructor: My Courses, Browse Courses; Admin: Users, All Courses — with active item highlighted (`bg-muted`), app name at top, and user section at bottom with DropdownMenu (Switch Account, Logout)

**Given** the `useAuth` hook
**When** the app mounts
**Then** it calls `GET /api/auth/me` to restore session state from the httpOnly cookie, showing a loading state until resolved

**Given** an unauthenticated user
**When** they try to access any authenticated route
**Then** they are redirected to `/login`

**Given** the `RoleBadge` component
**When** rendered for each role
**Then** it shows: Student (blue), Instructor (green), Admin (red) using shadcn Badge with appropriate color variants

### Story 1.4: Login, Register & Role-Based Navigation

As a **user**,
I want a polished login/register experience with one-click demo accounts and role-aware redirects,
So that I can access the application and immediately see features appropriate to my role.

**Acceptance Criteria:**

**Given** the login page at `/login`
**When** a user visits it
**Then** they see a login form (email + password fields using shadcn Form + react-hook-form + zod validation) and a "Demo Accounts" section below with three one-click buttons: Student (`student@lms.com`), Instructor (`instructor@lms.com`), Admin (`admin@lms.com`) — each showing role icon + email + role label

**Given** a demo credential button
**When** clicked
**Then** the button shows a loading spinner (others disabled), sends a login request, stores user in auth context, and redirects to the role's default landing page (Student → `/my-learning`, Instructor → `/my-courses`, Admin → `/admin/users`)

**Given** the register page at `/register`
**When** a user submits valid name, email, and password
**Then** registration succeeds, user is logged in automatically, and redirected to `/my-learning` (Student by default)

**Given** form validation errors
**When** the user submits invalid data
**Then** inline errors appear below the invalid fields; form data is preserved

**Given** the user clicks "Switch Account" in the dropdown menu
**When** the action executes
**Then** `POST /auth/logout` is called, React auth context is cleared, React Query cache is cleared, and the user is redirected to `/login`

## Epic 2: Course Creation & Management (Instructor)

Instructors can create complete courses with modules and lessons, edit and delete their content. Full content authoring workflow.

### Story 2.1: Course CRUD API & Entities

As an **instructor**,
I want to create, view, edit, and delete my courses,
So that I can manage my course catalog.

**Acceptance Criteria:**

**Given** an authenticated instructor
**When** they send `POST /api/courses` with `{ title, description }`
**Then** a new course is created owned by the instructor, and the response returns the course object with `{ id, title, description, instructorId, createdAt, updatedAt }`

**Given** an authenticated instructor
**When** they send `GET /api/courses/my`
**Then** the response returns only courses owned by this instructor

**Given** an authenticated instructor who owns the course
**When** they send `PATCH /api/courses/:id` with updated fields
**Then** the course is updated and the updated object is returned

**Given** this is the first epic requiring role-based access
**When** the `RolesGuard` and `@Roles()` decorator are implemented
**Then** `@Roles('Instructor')` restricts course CRUD endpoints to instructors only, and the guard pattern is reusable for all subsequent role-restricted endpoints

**Given** an authenticated instructor who does NOT own the course
**When** they send `PATCH /api/courses/:id` or `DELETE /api/courses/:id`
**Then** the API returns 403 Forbidden

**Given** an authenticated instructor who owns the course
**When** they send `DELETE /api/courses/:id`
**Then** the course and all its modules and lessons are deleted

**Given** the Course entity
**When** created with TypeORM
**Then** the `courses` table has columns: `id` (UUID), `title`, `description`, `instructor_id` (FK to users), `created_at`, `updated_at` — with a ManyToOne relation to User

**Given** any request with invalid/missing data
**When** sent to course endpoints
**Then** the API returns 400 with validation errors in consistent format

### Story 2.2: Module & Lesson CRUD API & Entities

As an **instructor**,
I want to add, edit, and delete modules and lessons within my courses,
So that I can structure course content with markdown lessons.

**Acceptance Criteria:**

**Given** an instructor who owns a course
**When** they send `POST /api/courses/:courseId/modules` with `{ title, orderIndex }`
**Then** a new module is created under that course and the module object is returned

**Given** an instructor who owns a course
**When** they send `PATCH /api/courses/:courseId/modules/:moduleId` with updated title or order
**Then** the module is updated

**Given** an instructor who owns a course
**When** they send `DELETE /api/courses/:courseId/modules/:moduleId`
**Then** the module and all its lessons are deleted

**Given** an instructor who owns a course
**When** they send `POST /api/courses/:courseId/modules/:moduleId/lessons` with `{ title, content, orderIndex }`
**Then** a new lesson is created with markdown content under that module

**Given** an instructor who owns a course
**When** they send `PATCH /api/courses/:courseId/modules/:moduleId/lessons/:lessonId` with updated fields
**Then** the lesson is updated

**Given** an instructor who owns a course
**When** they send `DELETE /api/courses/:courseId/modules/:moduleId/lessons/:lessonId`
**Then** the lesson is deleted

**Given** the CourseModule entity
**When** created with TypeORM
**Then** the `course_modules` table has: `id` (UUID), `title`, `order_index` (integer), `course_id` (FK), `created_at`, `updated_at` — ManyToOne to Course

**Given** the Lesson entity
**When** created with TypeORM
**Then** the `lessons` table has: `id` (UUID), `title`, `content` (text, markdown), `order_index` (integer), `module_id` (FK), `created_at`, `updated_at` — ManyToOne to CourseModule

**Given** an instructor who does NOT own the course
**When** they attempt any module or lesson CRUD operation
**Then** the API returns 403 Forbidden

### Story 2.3: Instructor Courses List & Create UI

As an **instructor**,
I want to see my courses and create new ones,
So that I can manage my course catalog through the browser.

**Acceptance Criteria:**

**Given** an authenticated instructor navigating to `/my-courses`
**When** the page loads
**Then** they see a list of their own courses with a "Create Course" button; if no courses exist, an EmptyState is shown ("Create your first course" + CTA button)

**Given** the instructor clicks "Create Course"
**When** they fill in title and description and submit
**Then** the form validates via zod on submit, the submit button shows a spinner + "Creating...", and on success a toast "Course created!" appears and they are redirected to the course editor page

**Given** the instructor clicks on an existing course
**When** the click occurs
**Then** they are navigated to the course editor page (`/my-courses/:id/edit`)

**Given** skeleton loading states
**When** the course list takes more than 300ms to load
**Then** Skeleton placeholders are shown instead of blank content

**Given** any API error during course creation
**When** the error occurs
**Then** a toast error appears with actionable message ("Could not save. Please try again."), form data is preserved

### Story 2.4: Course Editor — Module & Lesson Management UI

As an **instructor**,
I want to manage modules and lessons within a course through an editor page,
So that I can structure and update course content.

**Acceptance Criteria:**

**Given** the instructor on the course editor page (`/my-courses/:id/edit`)
**When** the page loads
**Then** they see the course title/description (editable), a list of modules (each expandable to show lessons), "Add Module" button, and within each module an "Add Lesson" button

**Given** the instructor edits the course title or description
**When** they save changes
**Then** the course is updated with toast feedback "Course updated!"

**Given** the instructor clicks "Add Module"
**When** they enter a module title and submit
**Then** the module appears in the list with toast feedback "Module added!"

**Given** the instructor clicks "Add Lesson" within a module
**When** they enter lesson title and markdown content and submit
**Then** the lesson appears under the module with toast feedback "Lesson added!"

**Given** the instructor clicks edit on a module or lesson
**When** the edit form appears pre-filled
**Then** they can update fields and save with toast feedback

**Given** the instructor clicks delete on a course, module, or lesson
**When** the delete button is clicked
**Then** a shadcn AlertDialog confirmation appears ("Delete [item type]?" with item name, Cancel + Delete buttons); on confirm, the item is deleted with toast feedback

**Given** any API error during CRUD operations
**When** the error occurs
**Then** a toast error appears with actionable message, form data is preserved, and no UI state is corrupted

**Given** skeleton loading states
**When** API calls take more than 300ms
**Then** Skeleton placeholders are shown instead of blank content

## Epic 3: Course Discovery & Enrollment (Student)

Students can browse available courses, view course details with module/lesson structure, enroll, and see their enrolled courses.

### Story 3.1: Course Catalog & Enrollment API

As a **student**,
I want API endpoints to browse courses, view details, enroll, and see my enrollments,
So that the backend supports the full discovery and enrollment flow.

**Acceptance Criteria:**

**Given** any authenticated user
**When** they send `GET /api/courses`
**Then** the response returns all courses with instructor name, and for each course the module/lesson structure (titles and count, not lesson content)

**Given** any authenticated user
**When** they send `GET /api/courses/:id`
**Then** the response returns the full course detail including title, description, instructor name, and nested modules with lesson titles (ordered by `order_index`) — but not lesson content

**Given** an authenticated student
**When** they send `POST /api/enrollments/courses/:courseId`
**Then** an enrollment record is created linking the student to the course, and the response confirms enrollment

**Given** a student already enrolled in a course
**When** they send `POST /api/enrollments/courses/:courseId` again
**Then** the API returns 409 Conflict (no duplicate enrollment)

**Given** an authenticated student
**When** they send `GET /api/enrollments/my`
**Then** the response returns all courses the student is enrolled in (progress percentage is NOT included in this epic — it will be added by Epic 4 when the progress module exists)

**Given** the Enrollment entity
**When** created with TypeORM
**Then** the `enrollments` table has: `id` (UUID), `user_id` (FK), `course_id` (FK), `enrolled_at` (timestamp) — with unique constraint on `(user_id, course_id)`

**Given** a non-student role
**When** they attempt to enroll
**Then** the API returns 403 Forbidden

### Story 3.2: Course Discovery & Enrollment UI

As a **student**,
I want to browse courses, see details, enroll with one click, and view my enrolled courses,
So that I can discover and commit to learning content.

**Acceptance Criteria:**

**Given** an authenticated student navigating to `/courses` (Browse Courses)
**When** the page loads
**Then** they see a page title "Course Catalog" and a 3-column card grid (responsive: 2-col md, 1-col mobile) with CourseCard components showing title, instructor name, description (2-line clamp), and lesson count badge

**Given** the CourseCard component
**When** rendered in catalog variant
**Then** the card shows hover shadow transition and the entire card is a clickable link to the course detail page

**Given** a student clicking a course card
**When** the course detail page loads at `/courses/:id`
**Then** they see the course title, description, instructor name, and a module/lesson accordion tree showing the full content structure (titles only, no content)

**Given** a student viewing a course they are NOT enrolled in
**When** the page renders
**Then** an "Enroll" primary button is displayed prominently

**Given** a student clicking "Enroll"
**When** the enrollment succeeds
**Then** the button changes to "Continue Learning" on the same page (no redirect), a toast shows "Enrolled successfully!", and the enrollment is persisted

**Given** a student viewing a course they ARE enrolled in
**When** the page renders
**Then** a "Continue Learning" button is shown, and clicking it navigates to the first lesson of the course (progress-aware navigation to first *incomplete* lesson is added in Epic 4 when progress tracking exists)

**Given** an authenticated student navigating to `/my-learning`
**When** the page loads
**Then** they see enrolled courses as CourseCard components showing title, instructor, and description (progress bar is NOT shown in this epic — it will be added by Epic 4); if no enrollments exist, an EmptyState is shown ("No courses yet" + "Browse Courses" CTA linking to `/courses`)

**Given** Skeleton loading states
**When** the catalog or my learning page data takes more than 300ms
**Then** Skeleton card placeholders are shown

## Epic 4: Learning Experience & Progress Tracking (Student)

Students can read lesson content (rendered markdown), mark lessons complete, and track progress with visual feedback across the application.

### Story 4.1: Progress Tracking API

As a **student**,
I want API endpoints to read lessons, mark them complete, and retrieve my progress,
So that the backend tracks my learning journey.

**Acceptance Criteria:**

**Given** an enrolled student
**When** they send `GET /api/courses/:courseId/modules/:moduleId/lessons/:lessonId`
**Then** the response returns the full lesson object including markdown `content`

**Given** a student NOT enrolled in the course
**When** they attempt to access a lesson
**Then** the API returns 403 Forbidden

**Given** an enrolled student
**When** they send `POST /api/progress/courses/:courseId/lessons/:lessonId/complete`
**Then** a lesson_progress record is created marking the lesson as completed, and the response returns the updated progress percentage for the course

**Given** a student marking an already-completed lesson
**When** the request is sent
**Then** the API returns the current progress without creating a duplicate record (idempotent)

**Given** an enrolled student
**When** they send `GET /api/progress/courses/:courseId`
**Then** the response returns: total lesson count, completed lesson count, percentage (`completedLessons / totalLessons * 100`), and a list of completed lesson IDs

**Given** the LessonProgress entity
**When** created with TypeORM
**Then** the `lesson_progress` table has: `id` (UUID), `user_id` (FK), `lesson_id` (FK), `completed_at` (timestamp) — with unique constraint on `(user_id, lesson_id)`

**Given** the progress calculation
**When** the system computes progress
**Then** it queries across the Course → Module → Lesson hierarchy to count total lessons, and counts completed LessonProgress records for the student, returning `Math.round((completed / total) * 100)`

### Story 4.2: Lesson View & Progress UI

As a **student**,
I want to read lesson content with a course sidebar showing my progress, and mark lessons complete with immediate visual feedback,
So that I experience a satisfying, trackable learning flow.

**Acceptance Criteria:**

**Given** an enrolled student navigating to `/courses/:courseId/lessons/:lessonId`
**When** the page loads
**Then** the AppSidebar is replaced by CourseSidebar (sidebar context switching — never two full sidebars), and the main content area shows the lesson's markdown content rendered with `@tailwindcss/typography` prose styling

**Given** the CourseSidebar in interactive mode
**When** rendered
**Then** it shows: course title at top, progress bar with percentage, collapsible module sections, lesson list under each module with completion icons (check for completed, empty circle for incomplete), and the current lesson highlighted with `bg-muted`

**Given** the student clicks a lesson in the CourseSidebar
**When** the navigation occurs
**Then** the lesson content updates and the active lesson highlighting moves to the clicked lesson

**Given** the student views an incomplete lesson
**When** the page renders
**Then** a "Mark Complete" primary button is displayed below the lesson content

**Given** the student clicks "Mark Complete"
**When** the button is clicked
**Then** the button immediately changes to "Completed" (disabled state) via optimistic UI, the sidebar checkmark appears for this lesson (<200ms), the progress bar recalculates client-side and ticks up, and the API call fires in the background

**Given** the API call for lesson completion fails
**When** the error is received
**Then** the button reverts to "Mark Complete", the sidebar checkmark is removed, the progress bar reverts, and a toast error appears: "Could not save progress. Please try again."

**Given** the student views an already-completed lesson
**When** the page renders
**Then** the button shows "Completed" (disabled) and the sidebar shows a checkmark for this lesson

**Given** the progress bar on the CourseSidebar
**When** a lesson is completed
**Then** the percentage updates immediately (client-side calculation: `completedLessons / totalLessons * 100`) and persists on page reload

**Given** the student returns to `/my-learning` after completing lessons
**When** the page loads
**Then** the CourseCard enrolled variant now shows the progress bar + percentage (upgrading the Epic 3 version that showed no progress)

**Given** the "Continue Learning" button on course detail (built in Epic 3)
**When** progress data is now available
**Then** the button navigates to the first *incomplete* lesson instead of the first lesson, and the course detail page shows a progress indicator for enrolled students

**Given** the `GET /api/enrollments/my` endpoint (built in Epic 3)
**When** progress data is now available
**Then** the response is enriched to include progress percentage per enrollment

## Epic 5: Platform Administration (Admin)

Admin can manage users, assign roles, and oversee all platform content. API documentation accessible for the interviewer.

### Story 5.1: Admin API Endpoints

As an **admin**,
I want API endpoints to list users, change roles, and view all courses,
So that I can manage the platform.

**Acceptance Criteria:**

**Given** an authenticated admin
**When** they send `GET /api/users`
**Then** the response returns all registered users with `{ id, name, email, role, createdAt }` (no passwords)

**Given** an authenticated admin
**When** they send `PATCH /api/users/:id/role` with `{ role: "Instructor" }`
**Then** the user's role is updated and the updated user object is returned

**Given** an admin attempting to change their own role
**When** the request is sent
**Then** the API returns 403 Forbidden with message "Cannot change your own role"

**Given** an invalid role value
**When** sent in the role update request
**Then** the API returns 400 with validation error

**Given** an authenticated admin
**When** they send `GET /api/courses/all`
**Then** the response returns all courses on the platform with instructor name, module count, and lesson count

**Given** a non-admin user
**When** they attempt to access admin endpoints (`GET /api/users`, `PATCH /api/users/:id/role`, `GET /api/courses/all`)
**Then** the API returns 403 Forbidden

**Given** all API endpoints across the application
**When** Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`) are applied to every controller
**Then** `GET /api/docs` renders the complete Swagger UI with all endpoints documented, grouped by module tag, with request/response DTO schemas visible

**Given** the interviewer opens Swagger UI at `/api/docs`
**When** they want to test authenticated endpoints
**Then** they can first call `POST /api/auth/login` with seed credentials via "Try it out", which sets the httpOnly cookie in the browser, and all subsequent "Try it out" calls on protected endpoints automatically include the cookie — no manual token copy-paste required

### Story 5.2: Admin Management UI

As an **admin**,
I want a users management page and an all-courses overview page,
So that I can manage roles and oversee platform content through the browser.

**Acceptance Criteria:**

**Given** an authenticated admin navigating to `/admin/users`
**When** the page loads
**Then** they see a page title "Users" and a full-width data table (shadcn Table) with columns: Name, Email, Role (as RoleBadge), Joined (date), and a role change dropdown

**Given** the role change dropdown on a user row
**When** the admin selects a new role (Student / Instructor / Admin)
**Then** the API call fires, the RoleBadge updates immediately, and a toast shows "Role updated!"

**Given** the admin's own row in the table
**When** rendered
**Then** the role dropdown is disabled (cannot change own role)

**Given** a role change API failure
**When** the error occurs
**Then** the dropdown reverts to the previous role and a toast error appears

**Given** an authenticated admin navigating to `/admin/courses`
**When** the page loads
**Then** they see a page title "All Courses" and a full-width data table with columns: Title, Instructor, Modules (count), Lessons (count), Created (date)

**Given** mobile viewport
**When** the admin tables render
**Then** tables have horizontal scroll (`overflow-x-auto`) with all columns preserved

**Given** Skeleton loading states
**When** table data takes more than 300ms
**Then** Skeleton row placeholders are shown

## Epic 6: Seed Data, Polish & Deployment

The application is deployed with realistic seed data that tells its own story — a self-narrating demo ready for interviewer evaluation.

### Story 6.1: Seed Data & Database Seeder

As an **interviewer**,
I want the application pre-loaded with realistic demo data,
So that I can immediately explore all features across all three roles without creating content from scratch.

**Acceptance Criteria:**

**Given** the database seeder runs on app bootstrap (or via CLI command)
**When** the seed executes in order: Users → Courses → Modules → Lessons → Enrollments → Progress
**Then** the following data is created:

**Given** seed users
**When** created
**Then** 3 users exist: `admin@lms.com` (Admin), `instructor@lms.com` (Instructor), `student@lms.com` (Student) — all with password `password123` (bcrypt hashed)

**Given** seed courses
**When** created by the instructor user
**Then** 2-3 courses exist with realistic titles (e.g., "NestJS Basics", "Docker for Beginners"), meaningful descriptions, and realistic module/lesson structures (e.g., 3 modules with 3-5 lessons each for the main course, totaling ~12 lessons)

**Given** seed lesson content
**When** created
**Then** each lesson contains short, realistic technical markdown content (headings, paragraphs, code blocks, lists) — not lorem ipsum

**Given** seed enrollment and progress
**When** created
**Then** the student user is enrolled in one course with ~42% progress (5 of 12 lessons marked complete — the first 5 lessons in sequential order across modules, so progress looks like natural linear learning). The Student's My Learning page immediately shows a course in progress with a "Continue Learning" entry point

**Given** the seeder runs against an already-seeded database
**When** executed
**Then** it either skips seeding (idempotent check) or clears and re-seeds without errors

### Story 6.2: UX Polish & Breadcrumbs

As an **interviewer**,
I want breadcrumbs for orientation, a read-only course preview sidebar, and graceful cold start handling,
So that the application feels considered and complete during evaluation.

**Acceptance Criteria:**

**Given** the Breadcrumbs component
**When** rendered on pages with depth > 1
**Then** it shows a dynamic breadcrumb trail built from route params: `Courses` → `Courses > NestJS Basics` → `Courses > NestJS Basics > Module 1 > Lesson 3`; each segment is a clickable link navigating up the hierarchy

**Given** the course detail page (`/courses/:id`)
**When** rendered for an unenrolled student
**Then** the module/lesson accordion tree shows a read-only CourseSidebar preview (structure only, no checkmarks, non-clickable lessons) so the student sees what they're committing to before enrollment

**Given** the login page on first visit
**When** the backend takes >3 seconds to respond (Render free tier cold start)
**Then** an honest message is displayed: "Server is waking up (free tier hosting) — this takes ~30 seconds on first visit" — either as an info toast or inline status message on the login page

**Given** the cold start message
**When** the backend responds successfully
**Then** the message disappears and the login page functions normally

### Story 6.3: Production Build & Deployment

As an **interviewer**,
I want to open a deployed URL and see a working LMS application,
So that I can evaluate the project in a live environment.

**Acceptance Criteria:**

**Given** the frontend project
**When** `npm run build` is executed
**Then** the production build outputs to `frontend/dist/`

**Given** the NestJS backend
**When** configured with `ServeStaticModule`
**Then** it serves the frontend build from `backend/public/` (the frontend dist is copied there during build), and all non-API routes fall through to `index.html` for SPA routing

**Given** the Render web service configuration
**When** deployed
**Then** the build command builds both frontend and backend, copies `frontend/dist/` to `backend/public/`, and starts the NestJS server

**Given** environment variables on Render
**When** configured
**Then** `DATABASE_URL` (Render PostgreSQL addon), `JWT_SECRET` (secure random string), and `NODE_ENV=production` are set

**Given** the deployed application
**When** the interviewer opens the URL
**Then** the login page loads (with cold start handling if needed), demo credentials work, all three role flows are functional, and Swagger docs are accessible at `/api/docs`

**Given** the httpOnly cookie in production
**When** set by the login endpoint
**Then** it includes `Secure` flag (HTTPS provided by Render)

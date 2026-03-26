# LMS — Learning Management System

Full-stack LMS with role-based access control, course management, student enrollment, and progress tracking.

**Backend:** NestJS 11, TypeORM, PostgreSQL, JWT (httpOnly cookies), Passport.js, Swagger
**Frontend:** React 19, React Router 7, TanStack Query 5, React Hook Form + Zod, shadcn/ui, Tailwind CSS
**Testing:** Jest + Supertest (API), Playwright (E2E)
**Deployment:** Render (free tier)

**Live:** https://lsm-fy53.onrender.com | **API Docs:** https://lsm-fy53.onrender.com/api/docs

> Free tier — first request may take 30-60s to wake up.

## Features

### Authentication & Authorization
- Registration, login, logout with JWT stored in httpOnly cookies (24h TTL)
- Three roles: **Student**, **Instructor**, **Admin** — assigned via custom `@Roles()` decorator + `RolesGuard`
- All users register as Student; Admin promotes roles manually
- Passwords hashed with bcrypt, excluded from all API responses

### Course Management (Instructor)
- Full CRUD for courses (title, description)
- Module management with ordering (`orderIndex`)
- Lesson management with markdown content (up to 50k chars) and ordering
- Ownership enforcement — instructors can only manage their own courses
- Cascade deletion: course -> modules -> lessons

### Course Discovery & Enrollment (Student)
- Course catalog with module/lesson counts
- Course detail view with full module/lesson hierarchy
- One-click enrollment with duplicate protection (DB unique constraint)
- "My Learning" dashboard with enrolled courses

### Progress Tracking
- Mark lessons as complete
- Per-course progress: completed lessons / total lessons as percentage
- Concurrent completion handling via DB unique constraint
- Optimistic UI updates with React Query

### Admin Panel
- User list with role management (dropdown role change)
- All-courses view with instructor names
- Self-role-change prevention

### Seed Data
Three users seeded on first startup (all password: `password123`):
- `admin@lms.com` (Admin)
- `instructor@lms.com` (Instructor)
- `student@lms.com` (Student)

Two courses by the instructor with modules, lessons, and sample student progress (~42%).

## API

22 endpoints across 7 modules. Full Swagger docs at `/api/docs`.

| Module | Endpoints |
|--------|-----------|
| Auth | `POST register`, `POST login`, `GET me`, `POST logout` |
| Courses | `POST`, `GET` (catalog), `GET /my`, `GET /all` (admin), `GET /:id`, `PATCH /:id`, `DELETE /:id` |
| Modules | `GET`, `POST`, `PATCH`, `DELETE` — nested under `/courses/:courseId/modules` |
| Lessons | `GET /:lessonId`, `POST`, `PATCH`, `DELETE` — nested under modules |
| Enrollments | `POST /courses/:courseId`, `GET /my` |
| Progress | `POST complete`, `GET /:courseId` |
| Users | `GET` (admin), `PATCH /:id/role` (admin) |

Consistent error responses: 400, 401, 403, 404, 409 with structured messages.

## Testing

**74 tests total — all passing.**

### Backend Unit Tests (13 files, Jest)
- Auth service & controller, roles guard
- Courses, modules, lessons — service & controller
- Users service & controller
- Progress service & controller
- HTTP exception filter

### Backend API E2E Tests (59 tests, Jest + Supertest)
Self-contained tests — each file creates its own users, no dependency on seed data.

| Suite | What's covered |
|-------|---------------|
| Auth | Register (valid, duplicate, validation), login, logout, unauthenticated access |
| Courses | Full CRUD, ownership checks, admin all-courses view |
| Modules & Lessons | CRUD, content access, cascade behavior |
| Enrollments & Progress | Enroll, duplicate prevention, lesson completion, progress calculation |
| Users (Admin) | List users, role changes, authorization checks, self-change prevention |

Error cases covered: 400 (validation), 401 (unauthenticated), 403 (forbidden/ownership), 404 (not found), 409 (conflict).

### Frontend E2E Tests (15 tests, Playwright)
| Suite | What's covered |
|-------|---------------|
| Auth | Login form, invalid credentials, admin redirect, registration, unauthenticated redirect |
| Student | Register, browse catalog, view course, enroll, navigate lessons |
| Instructor | View my courses, create course, verify creation |

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── auth/          # JWT strategy, guards, decorators
│   │   ├── users/         # User CRUD, admin role management
│   │   ├── courses/       # Courses, modules, lessons
│   │   ├── enrollments/   # Enrollment management
│   │   ├── progress/      # Lesson completion tracking
│   │   ├── seed/          # Database seeder
│   │   └── common/        # Exception filters
│   └── test/              # E2E tests + helpers
├── frontend/
│   ├── src/
│   │   ├── pages/         # Route pages
│   │   ├── components/    # UI components (shadcn/ui based)
│   │   ├── hooks/         # React Query hooks, auth
│   │   └── lib/           # API client, utilities
│   └── e2e/               # Playwright tests
└── render.yaml            # Deployment config
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL

### Setup

```bash
# Backend
cd backend
cp .env.example .env       # configure DATABASE_URL, JWT_SECRET
npm install
npm run start:dev          # http://localhost:3001

# Frontend
cd frontend
npm install
npm run dev                # http://localhost:3000 (proxies /api to backend)
```

### Run Tests

```bash
# Backend unit tests
cd backend && npm test

# Backend E2E tests (requires PostgreSQL)
cd backend && npm run test:e2e

# Frontend E2E tests (auto-starts dev servers)
cd frontend && npm run test:e2e        # headless
cd frontend && npm run test:e2e:ui     # interactive
```

### Deploy to Render

Push to GitHub and connect the repo on Render, or use the `render.yaml` blueprint:
- Web service builds both frontend and backend, serves the SPA from `backend/public/`
- PostgreSQL database provisioned automatically
- JWT_SECRET auto-generated

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Backend framework | NestJS 11 |
| ORM | TypeORM 0.3 |
| Database | PostgreSQL |
| Auth | Passport.js (JWT + Local), bcrypt |
| API docs | Swagger / OpenAPI |
| Frontend framework | React 19 |
| Routing | React Router 7 |
| Data fetching | TanStack React Query 5 |
| Forms | React Hook Form + Zod |
| UI components | shadcn/ui (Radix UI) |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| Notifications | Sonner |
| Backend testing | Jest, Supertest |
| Frontend testing | Playwright |

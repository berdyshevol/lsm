---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-25'
inputDocuments:
  - planning-artifacts/prd.md
  - planning-artifacts/ux-design-specification.md
workflowType: 'architecture'
project_name: 'lsm'
user_name: 'Berdyshevo'
date: '2026-03-25'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
26 FRs across 5 domains map to clear backend modules:
- **Auth module** (FR1-4): Registration, login, logout, auto-role assignment. JWT stored in httpOnly cookie.
- **Users module** (FR5-6): Admin-only user listing and role management.
- **Courses module** (FR7-15): Full CRUD for courses, modules, lessons. Instructor-scoped ownership. Admin read-all.
- **Enrollments module** (FR16-19): Course catalog browsing, enrollment, enrolled-course listing.
- **Progress module** (FR20-23): Lesson completion tracking, percentage calculation per enrollment.

Each domain maps 1:1 to a NestJS module — clean bounded contexts with minimal cross-module coupling. The main coupling point is the auth/RBAC layer which wraps all protected routes.

**Non-Functional Requirements:**
- **Security (NFR1-5):** bcrypt password hashing, JWT in httpOnly cookies, role-based guards on every protected route, proper HTTP status codes (401/403/404), no sensitive data in responses.
- **Accessibility (NFR6-8):** WCAG AA via shadcn/ui (Radix UI). Semantic HTML, keyboard navigation. Handled by component library choice.
- **Code Quality (NFR9-12):** NestJS modular structure, Swagger decorators on all endpoints, consistent error format, TypeScript strict mode.

**UX-Driven Architectural Requirements:**
- httpOnly cookie auth with CORS `credentials: true` — requires explicit origin configuration, impacts Swagger cookie forwarding
- Optimistic UI for lesson completion and enrollment — frontend needs state management capable of rollback
- Role-aware navigation — frontend routing and component rendering driven by auth context
- Cold start UX — frontend must handle backend wake-up delay gracefully (Render free tier: 30-60s)
- Sidebar context switching — global nav yields to course-level nav inside lessons, driven by route detection

**Scale & Complexity:**

- Primary domain: Full-stack web (NestJS REST API + React SPA)
- Complexity level: Low-Medium
- Estimated architectural components: 5 backend modules, 8 frontend pages, ~12 custom components
- Data model: ~6 entities (User, Course, Module, Lesson, Enrollment, Progress)

### Technical Constraints & Dependencies

- **1-day timeline** — architecture must be implementable rapidly; no exotic patterns
- **NestJS framework** — must demonstrate idiomatic usage (modules, DI, guards, interceptors, decorators, pipes)
- **PostgreSQL + TypeORM** — relational data model with ORM; `synchronize: true` acceptable for demo scope (no migrations)
- **Monorepo** (`/backend` + `/frontend`) — separate `package.json` files, separate dev ports (backend: 3001, frontend: 3000), API URL configured via environment variable (`VITE_API_URL`)
- **Render free tier** — single web service instance, PostgreSQL addon, cold starts, no background workers
- **shadcn/ui** — component library choice is locked; architecture should leverage its patterns
- **No tests in MVP** — deferred to Phase 2; architecture should still be testable

### Cross-Cutting Concerns Identified

1. **Authentication & Authorization** — JWT httpOnly cookie flow touches every protected endpoint and every frontend route. Single `useAuth` hook on frontend, Passport + Guards on backend.
2. **Global Exception Filter** — All NestJS errors must be normalized into a consistent JSON shape: `{ statusCode, message, error }`. Default NestJS exception handling produces inconsistent formats across HttpException, TypeORM errors, and validation pipes. A single global exception filter resolves this.
3. **Frontend Data Layer (React Query + fetchApi)** — TanStack React Query manages all server state (caching, loading/error states, optimistic updates with rollback). A thin native `fetch` wrapper (`fetchApi`) handles credentials, base URL, and HTTP error mapping (401→redirect to login, 403→redirect to role default page). `QueryClient` default error handler provides centralized error toasts. No Axios — native `fetch` with `credentials: 'include'`.
4. **Seed Data as Architectural Component** — Seed data is the interviewer's first impression and spans all modules. Requires explicit entity creation order: Users → Courses → Modules → Lessons → Enrollments → Progress. Entity IDs must be captured and threaded through the chain. Implemented as a TypeORM seeder running on app bootstrap or via CLI command.
5. **Progress→Lessons Coupling** — The Progress module's percentage calculation (`completedLessons / totalLessons`) requires querying across the Course→Module→Lesson hierarchy. Architecture must define whether Progress owns that cross-entity query or delegates to the Courses module.
6. **CORS Configuration** — httpOnly cookies require explicit origin + `credentials: true`. Must work in dev (localhost:3000→localhost:3001) and prod (Render domains).
7. **API Documentation** — Swagger decorators on every endpoint. Cookie auth must be configured to work in Swagger UI for the interviewer to test authenticated endpoints.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application as a co-located monorepo (`/backend` + `/frontend`). Two separate project scaffolds — NestJS backend + React SPA frontend as independent projects.

### Starter Options Considered

**Backend — NestJS CLI (`@nestjs/cli` v11.x):**
The official NestJS CLI is the only serious option. Generates idiomatic NestJS project structure with modules, controllers, services, and proper TypeScript configuration. Clean, minimal, exactly what a CTO expects.

**Frontend — shadcn/ui Vite template (single-step):**
As of shadcn CLI v4 (March 2026), `npx shadcn@latest init` scaffolds a complete Vite project template with React, TypeScript, Tailwind CSS, and dark mode pre-configured. Eliminates manual Tailwind/path-alias configuration and guarantees shadcn compatibility.

### Selected Starters

**Backend: NestJS CLI**

```bash
npx @nestjs/cli new backend --strict --package-manager npm
```

**Architectural decisions provided:**
- **Language & Runtime:** TypeScript with strict mode
- **Build Tooling:** `tsc` compiler, NestJS CLI build system
- **Testing Framework:** Jest pre-configured (deferred to Phase 2 but ready)
- **Code Quality:** ESLint + Prettier pre-configured
- **Code Organization:** Module-based structure (`src/app.module.ts`, `src/app.controller.ts`, `src/app.service.ts`)
- **Development Experience:** Hot reload via `nest start --watch`

**Frontend: shadcn/ui Vite Template**

```bash
npx shadcn@latest init
# Select: Vite template, React + TypeScript
```

Then add required components:
```bash
npx shadcn@latest add card button progress table badge breadcrumb sidebar input textarea select accordion scroll-area skeleton form dropdown-menu separator label
```

And install additional dependencies:
```bash
npm install @tanstack/react-query sonner react-router react-hook-form @hookform/resolvers zod @tailwindcss/typography lucide-react
npm install -D @tanstack/react-query-devtools
```

**Architectural decisions provided:**
- **Language & Runtime:** TypeScript with Vite
- **Styling Solution:** Tailwind CSS with CSS variables, shadcn/ui theme tokens
- **Build Tooling:** Vite (esbuild dev, Rollup production)
- **Code Organization:** `src/components/ui/` for shadcn primitives, `src/lib/utils.ts` for `cn()` helper
- **Development Experience:** Vite HMR, path aliases (`@/` → `src/`)

**Additional frontend dependencies rationale:**
- `@tanstack/react-query` — Server state management: caching, loading/error states, optimistic updates with rollback
- `@tanstack/react-query-devtools` (dev) — Query inspector for development and interviewer impression
- `sonner` — Toast notifications (UX spec requirement)
- `react-router` — Client-side routing (v7, replaces `react-router-dom`)
- `react-hook-form` + `@hookform/resolvers` + `zod` — Form validation (UX spec: shadcn Form component)
- `@tailwindcss/typography` — Markdown rendering prose styles (lesson content)
- `lucide-react` — Icon library (shadcn/ui default icon set)

### Frontend State Management Architecture

| Concern | Owner | Examples |
|---------|-------|---------|
| Server data | React Query | Courses, users, enrollments, progress |
| Auth state | React Context (`useAuth`) | Current user, role, login/logout |
| UI state | Local component state | Sidebar open/closed, form inputs, modals |

Three layers, zero overlap, no third-party state library.

**Note:** Project initialization using these commands should be the first implementation story.

## Core Architectural Decisions

### Critical Decisions

1. **Single-origin deployment** — NestJS serves React build via `ServeStaticModule`. One Render web service, one URL. No CORS needed.
2. **TypeORM Data Mapper** — Repositories injected via DI (idiomatic NestJS). `synchronize: true`, no migrations for demo.
3. **Passport auth** — Local strategy (login) + JWT strategy (cookie extraction for session validation).
4. **Global exception filter** — All errors normalized to `{ statusCode, message, error }`.
5. **React Router v7** — `react-router` package (not `react-router-dom`).

### Deferred Decisions (Post-MVP)

- Database migrations (replace `synchronize: true`)
- Refresh tokens
- CI/CD pipeline
- Monitoring/logging
- Rate limiting

### Data Architecture

- **Database:** PostgreSQL + TypeORM 0.4.x + @nestjs/typeorm 11.0.0 + `typeorm-naming-strategies` (SnakeNamingStrategy)
- **Configuration:** `@nestjs/config` + `joi` for env var validation on startup
- **Pattern:** Data Mapper (repositories injected via DI)
- **Schema sync:** `synchronize: true` — no migration files
- **Entities:** User, Course, Module, Lesson, Enrollment, Progress
- **Seed data:** TypeORM seeder on bootstrap. Order: Users → Courses → Modules → Lessons → Enrollments → Progress

### Authentication & Security

- **Strategy:** Passport Local (email+password → JWT) + Passport JWT (cookie extraction)
- **Token storage:** httpOnly cookie, `SameSite=Lax`, `Secure` in production
- **Session validation:** `GET /auth/me` reads cookie, returns user object
- **Guards:** `@UseGuards(JwtAuthGuard)` on protected routes, custom `@Roles()` decorator + `RolesGuard`
- **Password:** bcrypt hashing
- **CORS:** Not needed — same origin (NestJS serves frontend)

### API & Communication

- **Style:** REST, JSON
- **Docs:** Swagger via `@nestjs/swagger`, cookie auth configured for Swagger UI
- **Error handling:** Global `HttpExceptionFilter` → `{ statusCode, message, error }`
- **Validation:** `class-validator` + `class-transformer` via global `ValidationPipe`

### Frontend Architecture

- **Routing:** React Router v7
- **Server state:** TanStack React Query v5
- **Auth state:** React Context (`useAuth.tsx` exports both `AuthProvider` component and `useAuth` hook — lives in `hooks/` as a Context Provider + hook pattern, not a pure hook)
- **UI state:** Local component state
- **HTTP:** Native `fetch` wrapper (`fetchApi`)
- **Forms:** react-hook-form + zod + shadcn Form
- **Error handling:** QueryClient default `onError` → toast via sonner

### Infrastructure & Deployment

- **Hosting:** Single Render web service (free tier)
- **Build:** Frontend → `frontend/dist/`, NestJS serves via `ServeStaticModule`
- **Database:** Render PostgreSQL addon (free tier)
- **Env vars:** `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV` — validated on startup via `@nestjs/config` with Joi schema. Missing required vars cause a hard crash at boot, not a runtime surprise.
- **Logging:** NestJS built-in `Logger` class for structured logging. Each module uses a named logger instance (`new Logger('CoursesService')`). Sufficient for debugging via Render's log viewer.
- **Cold start:** Frontend shows "Server is waking up..." message (30-60s)

## Implementation Patterns & Consistency Rules

### Backend Naming (NestJS Standard)

- **DB tables:** `snake_case` plural — `users`, `courses`, `course_modules`, `lessons`, `enrollments`, `lesson_progress`
- **DB columns:** `snake_case` — `created_at`, `user_id`, `is_completed`
- **API endpoints:** `/api/` prefix, plural nouns — `/api/courses`, `/api/users`, `/api/courses/:id/modules`
- **Files:** `kebab-case` — `course.controller.ts`, `jwt-auth.guard.ts`, `create-course.dto.ts`
- **Classes:** `PascalCase` — `CourseController`, `JwtAuthGuard`, `CreateCourseDto`
- **JSON responses:** `camelCase` fields (TypeORM `snake_case` → `camelCase` via `typeorm-naming-strategies` package — install `typeorm-naming-strategies` and configure `SnakeNamingStrategy` in TypeORM data source options)

### Frontend Naming (React Standard)

- **Components:** `PascalCase` files and exports — `CourseCard.tsx`, `AppSidebar.tsx`
- **Hooks:** `camelCase` with `use` prefix — `useAuth.ts`, `useCourses.ts`
- **Utils:** `camelCase` — `fetchApi.ts`
- **Folders:** grouped by domain — `components/course/`, `components/layout/`, `components/common/`
- **Pages:** `PascalCase` — `CourseCatalog.tsx`, `LessonView.tsx`

### API Response Patterns

- **Success:** Direct data, no wrapper — `{ id, title, description }` or `[{ ... }]`
- **Error:** `{ statusCode: 404, message: "Course not found", error: "Not Found" }`
- **Dates:** ISO 8601 strings — `"2026-03-25T12:00:00.000Z"`
- **Pagination:** Not needed for MVP (small dataset)

### React Query Patterns

- **Query keys:** Entity-based arrays — `['courses']`, `['courses', id]`, `['enrollments', userId]`
- **Mutations:** Invalidate related queries on success — e.g., `queryClient.invalidateQueries({ queryKey: ['courses'] })`
- **Optimistic updates:** Use `onMutate` / `onError` rollback for lesson completion and enrollment
- **Error handling:** `QueryClient` default `onError` shows toast; individual queries can override

### File Organization Rules

- **Backend:** One NestJS module per domain — `src/auth/`, `src/users/`, `src/courses/`, `src/enrollments/`, `src/progress/`
- **Each module contains:** `*.module.ts`, `*.controller.ts`, `*.service.ts`, `*.entity.ts`, `dto/*.dto.ts`
- **Frontend pages:** `src/pages/` — one file per route
- **Frontend components:** `src/components/ui/` (shadcn, untouched), `src/components/layout/`, `src/components/course/`, `src/components/common/`
- **Frontend hooks:** `src/hooks/` — `useAuth.ts`, custom React Query hooks
- **Frontend lib:** `src/lib/` — `fetchApi.ts`, `utils.ts`

## Project Structure & Boundaries

### Complete Project Directory Structure

```
lsm/
├── backend/
│   ├── package.json
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── .env
│   ├── .env.example
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── local.strategy.ts
│   │   │   │   └── jwt.strategy.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   ├── decorators/
│   │   │   │   └── roles.decorator.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── user.entity.ts
│   │   │   └── dto/
│   │   │       └── update-role.dto.ts
│   │   ├── courses/
│   │   │   ├── courses.module.ts
│   │   │   ├── courses.controller.ts
│   │   │   ├── courses.service.ts
│   │   │   ├── course.entity.ts
│   │   │   ├── course-module.entity.ts
│   │   │   ├── lesson.entity.ts
│   │   │   └── dto/
│   │   │       ├── create-course.dto.ts
│   │   │       ├── update-course.dto.ts
│   │   │       ├── create-module.dto.ts
│   │   │       ├── update-module.dto.ts
│   │   │       ├── create-lesson.dto.ts
│   │   │       └── update-lesson.dto.ts
│   │   ├── enrollments/
│   │   │   ├── enrollments.module.ts
│   │   │   ├── enrollments.controller.ts
│   │   │   ├── enrollments.service.ts
│   │   │   └── enrollment.entity.ts
│   │   ├── progress/
│   │   │   ├── progress.module.ts
│   │   │   ├── progress.controller.ts
│   │   │   ├── progress.service.ts
│   │   │   └── lesson-progress.entity.ts
│   │   ├── common/
│   │   │   └── filters/
│   │   │       └── http-exception.filter.ts
│   │   └── seed/
│   │       └── seed.ts
│   └── public/                  ← React production build output (`frontend/dist/` copied here); not a static assets folder
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── components.json
│   ├── index.html
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── lib/
│   │   │   ├── fetchApi.ts
│   │   │   └── utils.ts
│   │   ├── hooks/
│   │   │   └── useAuth.tsx
│   │   ├── components/
│   │   │   ├── ui/              ← shadcn (untouched)
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx
│   │   │   │   ├── AppSidebar.tsx
│   │   │   │   └── Breadcrumbs.tsx
│   │   │   ├── course/
│   │   │   │   ├── CourseCard.tsx
│   │   │   │   ├── CourseSidebar.tsx
│   │   │   │   └── LessonContent.tsx
│   │   │   └── common/
│   │   │       ├── EmptyState.tsx
│   │   │       ├── RoleBadge.tsx
│   │   │       └── DemoCredentials.tsx
│   │   └── pages/
│   │       ├── LoginPage.tsx
│   │       ├── RegisterPage.tsx
│   │       ├── CourseCatalog.tsx
│   │       ├── CourseDetail.tsx
│   │       ├── LessonView.tsx
│   │       ├── MyLearning.tsx
│   │       ├── InstructorCourses.tsx
│   │       ├── CourseEditor.tsx
│   │       ├── AdminUsers.tsx
│   │       └── AdminCourses.tsx
│   └── dist/                    ← build output
├── .gitignore
└── README.md
```

### Requirements to Structure Mapping

| FR Domain | Backend Module | Frontend Pages | Key Components |
|-----------|---------------|----------------|----------------|
| Auth (FR1-4) | `src/auth/` | `LoginPage`, `RegisterPage` | `DemoCredentials`, `useAuth` |
| Users (FR5-6) | `src/users/` | `AdminUsers` | `RoleBadge` |
| Courses (FR7-15) | `src/courses/` | `InstructorCourses`, `CourseEditor`, `CourseCatalog`, `CourseDetail` | `CourseCard`, `CourseSidebar` |
| Enrollment (FR16-19) | `src/enrollments/` | `MyLearning` | `CourseCard` (enrolled variant) |
| Progress (FR20-23) | `src/progress/` | `LessonView` | `CourseSidebar`, `LessonContent` |
| Platform (FR24-26) | `common/filters/`, `seed/` | `AppLayout`, `AppSidebar` | `Breadcrumbs`, `EmptyState` |

### Architectural Boundaries

**Backend module boundaries:** Each module owns its entities, DTOs, controller, and service. Cross-module communication goes through injected services, never direct repository access across modules. Progress service injects Courses service to query lesson counts.

**Frontend data flow:** Pages fetch data via React Query hooks → pass data as props to components → components are pure UI. No API calls inside components — only in pages and hooks.

**Auth boundary:** Backend `JwtAuthGuard` + `RolesGuard` on every protected route. Frontend `useAuth` context wraps all authenticated routes — redirects to `/login` if no session.

## Architecture Validation

### Coherence: PASS

All technology choices are compatible and well-established:
- NestJS 11 + @nestjs/typeorm 11.0.0 + TypeORM 0.4.x + PostgreSQL
- React + Vite + TanStack React Query v5 + React Router v7 + shadcn/ui
- Single-origin deployment eliminates CORS — simplifies auth flow
- All patterns align with technology stack conventions

### Requirements Coverage: PASS

- **FR1-26:** All 26 functional requirements mapped to backend modules and frontend pages
- **NFR1-5 (Security):** bcrypt, JWT httpOnly cookies, role guards, proper HTTP status codes, no sensitive data in responses
- **NFR6-8 (Accessibility):** shadcn/ui (Radix UI) provides WCAG AA, semantic HTML, keyboard navigation
- **NFR9-12 (Code Quality):** NestJS modular structure, Swagger decorators, global exception filter, TypeScript strict mode

### Implementation Readiness: PASS

- All critical decisions documented with verified versions
- Naming conventions and patterns comprehensive enough to prevent AI agent conflicts
- Project structure maps every FR to specific files and directories
- Architectural boundaries clearly defined

### Architecture Completeness Checklist

- [x] Project context analyzed and validated
- [x] Starter templates selected with initialization commands
- [x] All critical architectural decisions documented with versions
- [x] Implementation patterns and naming conventions established
- [x] Complete project directory structure defined
- [x] Requirements mapped to structure
- [x] Architectural boundaries defined
- [x] Validation passed — no gaps found
- [x] Peer review completed — 6 findings incorporated (update DTOs, naming strategy package, env validation, logging, useAuth convention, public/ clarification)

**Status: READY FOR IMPLEMENTATION**

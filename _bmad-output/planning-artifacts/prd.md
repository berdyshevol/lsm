---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-02b-vision
  - step-02c-executive-summary
  - step-03-success
  - step-04-journeys
  - step-05-domain
  - step-06-innovation-skipped
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-polish
  - step-12-complete
inputDocuments:
  - 'user-provided-raw-prd (inline)'
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 0
  projectDocs: 1
classification:
  projectType: web_app
  domain: edtech
  complexity: low-medium
  projectContext: greenfield
---

# Product Requirements Document - LMS

**Author:** Berdyshevo
**Date:** 2026-03-24

## Executive Summary

A demo Learning Management System built with NestJS (backend) and React (frontend) to demonstrate full-stack development proficiency. The project serves as a portfolio piece for an employer seeking a developer to build an LMS product. It showcases the ability to rapidly learn and apply NestJS framework patterns, leverage AI-assisted development for speed, and deliver a working application with role-based access control, course management, and student progress tracking.

Target users within the demo: Admin (system management), Instructor (course creation), Student (enrollment and learning). The real audience: a technical interviewer evaluating NestJS competence, architectural understanding, and development velocity.

### What Makes This Special

1. **NestJS proficiency** — Proper use of modules, dependency injection, guards, interceptors, decorators, and pipes.
2. **Full-stack delivery** — Complete working application from API to UI, with JWT authentication, role-based authorization, and clean React frontend.
3. **Rapid development with AI tools** — Requirements to deployed application quickly, demonstrating modern development workflow.

The differentiator is not the LMS itself — it's the proof that the developer can build one correctly, quickly, and with clean architecture.

## Project Classification

- **Project Type:** Web Application (full-stack SPA — NestJS API + React frontend)
- **Domain:** EdTech (Learning Management System)
- **Complexity:** Low-Medium (demo scope, no regulatory/compliance requirements)
- **Project Context:** Greenfield
- **Architecture:** Typical NestJS modular architecture (Modules, Controllers, Services, Repositories, Guards, Interceptors, Pipes, Decorators)
- **Auth:** Custom JWT implementation (Passport.js + bcrypt)
- **Database:** PostgreSQL with TypeORM
- **Repository:** Monorepo (`/backend` + `/frontend`)
- **Deployment:** Render (free tier — web service + PostgreSQL)

## Success Criteria

### User Success

- Interviewer can open a deployed URL and see a working LMS application
- Interviewer can review Swagger docs and understand the full API surface
- Interviewer can browse the codebase and see typical NestJS modular architecture with clean separation of concerns
- Demo contains seed data showing realistic courses, modules, lessons, and enrolled students

### Business Success

- Project demonstrates sufficient NestJS proficiency to secure a developer position
- Developer (Berdyshevo) can confidently explain architectural decisions and NestJS patterns during interview
- Project completed and deployed within the preparation timeline (1 day)

### Technical Success

- All role-based flows work end-to-end: Admin manages users, Instructor creates courses, Student enrolls and tracks progress
- JWT auth functions correctly with proper guards
- Swagger documentation covers all API endpoints
- Application deployed and accessible on a free-tier hosting platform
- Clean project structure follows NestJS conventions

### Measurable Outcomes

- 100% of core user flows (auth, course CRUD, enrollment, progress tracking) working in deployed environment
- API fully documented via Swagger
- Deployment cost: $0 or near-zero (free tier)

## Product Scope

### MVP (Phase 1 — 1 Day)

**MVP Approach:** Minimum Demo — smallest feature set that demonstrates NestJS proficiency within a single day.
**Resource:** Solo developer + AI-assisted development
**Timeline:** 1 day (deadline: 2026-03-25)

**Core User Journeys Supported:**
- Student: browse → enroll → read lessons → track progress
- Instructor: create course → add modules → add lessons
- Admin: view users → change roles

**Must-Have Capabilities:**
- User registration and login (JWT, no refresh tokens)
- User logout
- Role-based access control (3 roles, custom guards, decorators)
- Course CRUD (title, description)
- Module and lesson management (markdown content)
- Student enrollment
- Lesson completion + progress percentage
- Admin: user list, role assignment, all courses view
- Swagger/OpenAPI documentation (auto-generated)
- Seed data (2-3 courses, sample users per role)
- Deployment to free tier (Render/Railway)

**Deferred from MVP:**
- Refresh token rotation
- Course thumbnails
- Draft/published workflow
- Unenrollment
- Unpublish with blocked access logic
- Unit and E2E tests (if time permits)
- Course search and filtering

### Growth Features (Phase 2)

- Refresh tokens
- Draft/published workflow + unpublish behavior
- Unenroll (hard delete, progress removed, re-enroll = fresh start)
- Unit and E2E tests
- Course thumbnails
- Quizzes with multiple choice questions
- WebSocket notifications
- Course search and filtering
- Instructor dashboard with enrollment analytics

### Vision (Phase 3)

- Video lessons
- Certificates of completion
- Payment integration
- Live classes
- Email notifications
- Rich text editor for lesson content

### Risk Mitigation Strategy

**Technical Risk:** NestJS is new — mitigated by AI-assisted development and focus on standard patterns
**Time Risk:** 1 day deadline — mitigated by aggressive scope cuts and AI code generation
**Deploy Risk:** Free tier limitations — mitigated by minimal data, single-instance deployment

## User Journeys

### Journey 1: Student — Алексей discovers and completes a course

**Opening Scene:** Алексей, 25, junior developer. He opens the LMS platform and sees a catalog of courses. He's looking for something to level up his skills.

**Rising Action:** He browses the course catalog, finds "NestJS Basics" by Марина. He reads the course description and enrolls. The course has 3 modules with 12 lessons total. He starts Module 1, reads the first lesson (markdown content), and marks it as complete. His progress bar shows 8%.

**Climax:** Over several sessions, Алексей works through lessons at his own pace. He can see his progress growing — 25%, 50%, 75%. The progress tracking gives him momentum to keep going.

**Resolution:** Алексей completes all 12 lessons. His progress shows 100%.

**Requirements revealed:** Course catalog browsing, enrollment, lesson reading (markdown rendering), lesson completion marking, progress calculation.

### Journey 2: Instructor — Марина builds a course

**Opening Scene:** Марина, 35, senior developer. She logs in and sees her Instructor dashboard — a list of her courses. Марина registered as a Student and was promoted to Instructor by Admin.

**Rising Action:** She creates a new course: "Docker для начинающих", adds a description. She adds 3 modules: "Basics", "Containers", "Docker Compose". Under each module she adds lessons with markdown content.

**Resolution:** Students start enrolling. Марина can edit her course content anytime.

**Requirements revealed:** Course CRUD, module management, lesson creation (markdown), instructor-scoped access (sees only own courses).

### Journey 3: Admin — Олег manages the platform

**Opening Scene:** Олег, system admin. He logs in and has access to the admin panel.

**Rising Action:** A new user Марина registered as a Student (default role). Олег opens the users list, finds Марина, and changes her role from Student to Instructor.

**Resolution:** Олег reviews the users list and all courses list to keep the platform healthy.

**Requirements revealed:** User listing, role management, all-courses view, admin-only access guards.

### Journey 4: Edge Cases (Post-MVP)

> Note: These scenarios are documented for Phase 2 implementation.

**Unpublish scenario:** Student is enrolled in a course at 60% progress. Instructor unpublishes the course. Student sees the course in "My Courses" but it is blocked — "Course temporarily unavailable". Progress is preserved. When republished, student continues from where they left off.

**Unenroll scenario:** Student unenrolls from a course. Enrollment and progress are permanently deleted (hard delete). Re-enrollment starts from scratch.

**Design decisions:** All users register as Student by default. Admin assigns roles manually via admin panel.

### Journey Requirements Summary

| Capability | MVP | Phase |
|---|---|---|
| User registration (all users get Student role) | ✅ | 1 |
| JWT auth | ✅ | 1 |
| Role-based access control (guards) | ✅ | 1 |
| Admin assigns roles manually | ✅ | 1 |
| Course catalog | ✅ | 1 |
| Course CRUD (own courses) | ✅ | 1 |
| Module & lesson management | ✅ | 1 |
| Enrollment | ✅ | 1 |
| Lesson reading (markdown) | ✅ | 1 |
| Progress tracking (% complete) | ✅ | 1 |
| User management (list, role change) | ✅ | 1 |
| All-courses view (admin) | ✅ | 1 |
| Draft/published workflow | ❌ | 2 |
| Unpublish = blocked for enrolled students | ❌ | 2 |
| Unenroll (hard delete) | ❌ | 2 |
| Refresh tokens | ❌ | 2 |

## Domain-Specific Requirements

### EdTech Domain — Demo Scope

**Compliance & Regulatory (Acknowledged, Out of Scope):**
- COPPA/FERPA, age verification, curriculum standards — not applicable for demo

**Accessibility (Minimum Level):**
- Semantic HTML elements (nav, main, article, section)
- Basic ARIA labels on interactive elements
- Keyboard navigability for core flows
- Sufficient color contrast ratios
- shadcn/ui (Radix UI) provides WCAG AA accessibility out of the box

**UI Technology Decision:**
- Frontend UI: shadcn/ui (Radix UI primitives + Tailwind CSS)
- MCP server configured for AI-assisted component generation
- Chosen for: modern look, accessibility built-in, AI-first design philosophy

## Web Application Specific Requirements

### Project-Type Overview

Single Page Application (SPA) with separated frontend and backend:
- **Backend:** NestJS REST API
- **Frontend:** React SPA with shadcn/ui (Radix UI + Tailwind CSS)
- **Communication:** REST API (JSON), no WebSockets in MVP

### Frontend Pages

1. Login / Register
2. Course Catalog
3. Course Detail
4. Lesson View
5. My Courses (student)
6. My Courses (instructor) + Create/Edit Course
7. Admin: Users
8. Admin: All Courses

### Browser Support

- Modern browsers only: Chrome, Firefox, Safari, Edge (latest 2 versions)

### Technical Architecture

- **SPA routing:** React Router for client-side navigation
- **API communication:** REST with JSON request/response format
- **State management:** React built-in state (useState/useContext) or lightweight solution
- **SEO:** Not required — demo application
- **Real-time:** Not required — all interactions are request/response based
- **Responsive design:** Basic responsive layout (desktop-first, mobile-friendly)
- **API documentation:** Swagger/OpenAPI auto-generated from NestJS decorators
- **Error handling:** Consistent error response format across all endpoints
- **CORS:** Configured for frontend-backend communication

## Functional Requirements

### User Management

- FR1: User can register with name, email, and password
- FR2: User can log in and receive a JWT access token
- FR3: User can log out
- FR4: User receives the Student role automatically upon registration
- FR5: Admin can view a list of all registered users
- FR6: Admin can change any user's role (Student, Instructor, Admin)

### Course Management

- FR7: Instructor can create a new course with title and description
- FR8: Instructor can edit their own courses
- FR9: Instructor can delete their own courses
- FR10: Instructor can view a list of their own courses
- FR11: Instructor can add modules to their course
- FR12: Instructor can edit and delete modules within their course
- FR13: Instructor can add lessons with markdown content to a module
- FR14: Instructor can edit and delete lessons within their modules
- FR15: Admin can view a list of all courses on the platform

### Course Discovery & Enrollment

- FR16: Student can browse a catalog of all courses
- FR17: Student can view course details (title, description, module/lesson structure)
- FR18: Student can enroll in a course
- FR19: Student can view a list of their enrolled courses

### Learning & Progress

- FR20: Student can read lesson content (rendered markdown)
- FR21: Student can mark a lesson as complete
- FR22: Student can view their progress percentage per enrolled course
- FR23: System calculates progress as (completed lessons / total lessons) × 100%

### Platform Administration

- FR24: System restricts access to endpoints based on user role
- FR25: System provides auto-generated API documentation via Swagger
- FR26: System includes seed data: 3 users (admin@lms.com, instructor@lms.com, student@lms.com, password: password123), 2-3 courses with modules and lessons, one student enrolled with partial progress

## Non-Functional Requirements

### Security

- NFR1: Passwords hashed with bcrypt before storage
- NFR2: JWT token required for all protected API endpoints
- NFR3: Role-based guards enforce access control on every protected route
- NFR4: API returns proper HTTP status codes (401 Unauthorized, 403 Forbidden, 404 Not Found)
- NFR5: No sensitive data (passwords, tokens) exposed in API responses

### Accessibility

- NFR6: UI built with shadcn/ui (Radix UI) providing WCAG AA compliance out of the box
- NFR7: Semantic HTML elements used for page structure
- NFR8: All interactive elements keyboard-navigable

### Code Quality

- NFR9: Project follows typical NestJS modular structure (one module per domain)
- NFR10: API endpoints documented via Swagger decorators
- NFR11: Consistent error response format across all endpoints
- NFR12: TypeScript strict mode enabled

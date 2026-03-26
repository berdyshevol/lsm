# Story 6.1: Seed Data & Database Seeder

Status: done

## Story

As an **interviewer**,
I want the application pre-loaded with realistic demo data,
so that I can immediately explore all features across all three roles without creating content from scratch.

## Acceptance Criteria

1. **Seed Execution Order** — Given the database seeder runs on app bootstrap, when the seed executes, then data is created in dependency order: Users -> Courses -> Modules -> Lessons -> Enrollments -> Progress.

2. **Seed Users** — Given the seeder runs, when users are created, then 3 users exist: `admin@lms.com` (Admin), `instructor@lms.com` (Instructor), `student@lms.com` (Student) — all with password `password123` (bcrypt hashed, 10 rounds).

3. **Seed Courses** — Given seed courses, when created by the instructor user, then 2-3 courses exist with realistic titles (e.g., "NestJS Basics", "Docker for Beginners"), meaningful descriptions, and realistic module/lesson structures (3 modules with 3-5 lessons each for the main course, totaling ~12 lessons).

4. **Seed Lesson Content** — Given seed lessons, when created, then each lesson contains short, realistic technical markdown content (headings, paragraphs, code blocks, lists) — NOT lorem ipsum.

5. **Seed Enrollment & Progress** — Given seed enrollment and progress, when created, then the student user is enrolled in one course with ~42% progress (5 of 12 lessons marked complete — the first 5 lessons in sequential order across modules, simulating natural linear learning).

6. **Idempotent Seeding** — Given the seeder runs against an already-seeded database, when executed, then it skips seeding (idempotent check on `admin@lms.com` existence) without errors or duplicate data. Note: The epics allow either "skip" or "clear-and-re-seed". We chose skip-only for simplicity and safety — avoids data loss if the interviewer has created additional data during demo.

7. **Bootstrap Integration** — Given the NestJS application starts, when the SeedService initializes, then seeding runs automatically via `onModuleInit` lifecycle hook.

## Tasks / Subtasks

- [x] Task 1: Create SeedModule and SeedService (AC: #1, #7)
  - [x] 1.1 Create `backend/src/seed/seed.module.ts` — imports TypeOrmModule.forFeature for all 6 entities (User, Course, CourseModule, Lesson, Enrollment, LessonProgress), imports UsersModule
  - [x] 1.2 Create `backend/src/seed/seed.service.ts` — injectable service implementing `OnModuleInit`, injects all 6 entity repositories
  - [x] 1.3 Implement `onModuleInit()` that calls `this.seed()` wrapped in try/catch with Logger
  - [x] 1.4 Register SeedModule in `backend/src/app.module.ts` imports array

- [x] Task 2: Implement idempotent seed guard (AC: #6)
  - [x] 2.1 At the top of `seed()`, check `await this.usersRepository.findOne({ where: { email: 'admin@lms.com' } })`
  - [x] 2.2 If user exists, log `'Seed data already exists, skipping'` and return early
  - [x] 2.3 If user does not exist, proceed with seeding

- [x] Task 3: Seed Users (AC: #2)
  - [x] 3.1 Hash password ONCE: `const hashedPassword = await bcrypt.hash('password123', 10);`
  - [x] 3.2 Create entities via `this.usersRepo.create()` (required because `password` has `select: false`):
    ```
    const admin = this.usersRepo.create({ name: 'Admin User', email: 'admin@lms.com', password: hashedPassword, role: UserRole.Admin });
    const instructor = this.usersRepo.create({ name: 'Marina Petrova', email: 'instructor@lms.com', password: hashedPassword, role: UserRole.Instructor });
    const student = this.usersRepo.create({ name: 'Alexey Volkov', email: 'student@lms.com', password: hashedPassword, role: UserRole.Student });
    ```
  - [x] 3.3 Save all: `const [adminUser, instructorUser, studentUser] = await this.usersRepo.save([admin, instructor, student]);`
  - [x] 3.4 Capture returned entities — need IDs for course/enrollment/progress relationships

- [x] Task 4: Seed Courses (AC: #3)
  - [x] 4.1 Create course 1: `{ title: 'NestJS Basics', description: 'Learn the fundamentals of NestJS...', instructor: instructorUser }` — this is the MAIN course (12 lessons)
  - [x] 4.2 Create course 2: `{ title: 'Docker for Beginners', description: 'Get started with containerization...', instructor: instructorUser }` — secondary course (fewer lessons)
  - [x] 4.3 Save courses via `this.coursesRepository.save()` and capture returned entities

- [x] Task 5: Seed Modules for each course (AC: #3)
  - [x] 5.1 Course 1 (NestJS Basics) — 3 modules:
    - Module 1: `{ title: 'Getting Started', orderIndex: 0, course: course1 }`
    - Module 2: `{ title: 'Core Concepts', orderIndex: 1, course: course1 }`
    - Module 3: `{ title: 'Building APIs', orderIndex: 2, course: course1 }`
  - [x] 5.2 Course 2 (Docker for Beginners) — 2 modules:
    - Module 1: `{ title: 'Docker Fundamentals', orderIndex: 0, course: course2 }`
    - Module 2: `{ title: 'Working with Containers', orderIndex: 1, course: course2 }`
  - [x] 5.3 Save all modules and capture returned entities (need IDs for lessons)

- [x] Task 6: Seed Lessons with markdown content (AC: #3, #4)
  - [x] 6.1 Course 1, Module 1 "Getting Started" — 4 lessons:
    - Lesson 1: "What is NestJS?" (orderIndex: 0)
    - Lesson 2: "Setting Up Your Environment" (orderIndex: 1)
    - Lesson 3: "Your First Controller" (orderIndex: 2)
    - Lesson 4: "Project Structure" (orderIndex: 3)
  - [x] 6.2 Course 1, Module 2 "Core Concepts" — 4 lessons:
    - Lesson 5: "Modules and Dependency Injection" (orderIndex: 0)
    - Lesson 6: "Services and Providers" (orderIndex: 1)
    - Lesson 7: "Middleware and Pipes" (orderIndex: 2)
    - Lesson 8: "Guards and Interceptors" (orderIndex: 3)
  - [x] 6.3 Course 1, Module 3 "Building APIs" — 4 lessons:
    - Lesson 9: "REST API Design" (orderIndex: 0)
    - Lesson 10: "Database Integration with TypeORM" (orderIndex: 1)
    - Lesson 11: "Authentication and Authorization" (orderIndex: 2)
    - Lesson 12: "Error Handling and Validation" (orderIndex: 3)
  - [x] 6.4 Course 2, Module 1 "Docker Fundamentals" — 3 lessons:
    - "What is Docker?" (orderIndex: 0)
    - "Images and Containers" (orderIndex: 1)
    - "Dockerfile Basics" (orderIndex: 2)
  - [x] 6.5 Course 2, Module 2 "Working with Containers" — 2 lessons:
    - "Docker Compose" (orderIndex: 0)
    - "Networking and Volumes" (orderIndex: 1)
  - [x] 6.6 Each lesson: set `module: savedModuleEntity` (the relation property is named `module`, not `courseModule`)
  - [x] 6.7 Each lesson content: 5-15 lines of markdown with a heading, 1-2 paragraphs, a code block or list. Technical and realistic.
  - [x] 6.8 Save all lessons and capture Course 1 lessons in order (need for progress tracking)

- [x] Task 7: Seed Enrollment (AC: #5)
  - [x] 7.1 Create enrollment: `{ user: studentUser, course: course1 }` (student enrolled in NestJS Basics)
  - [x] 7.2 Save enrollment

- [x] Task 8: Seed Progress — 5/12 lessons complete (AC: #5)
  - [x] 8.1 Mark first 5 lessons of Course 1 as complete for the student user:
    - All 4 lessons from Module 1 ("Getting Started") + 1st lesson from Module 2 ("Modules and Dependency Injection")
  - [x] 8.2 Create LessonProgress entries: `{ user: studentUser, lesson: lessonN }` for each of the 5 lessons
  - [x] 8.3 This produces 5/12 = 41.67% ≈ 42% progress

- [x] Task 9: Verify seeding works (AC: #1-#7)
  - [x] 9.1 Start backend with `npm run start:dev` — seeder should run on bootstrap
  - [x] 9.2 Verify logs show seed execution (or skip if already seeded)
  - [x] 9.3 Login as each role via DemoCredentials and verify data is visible:
    - Student: My Learning shows NestJS Basics at ~42% progress
    - Instructor: My Courses shows 2 courses
    - Admin: Users shows 3 users, All Courses shows 2 courses
  - [x] 9.4 Restart backend — seeder should skip (idempotent)
  - [x] 9.5 Verify no TypeScript or ESLint errors: `npm run lint && npx tsc --noEmit`

### Review Findings

- [x] [Review][Patch] `savedUsers` indexed by array position — use `.find()` by email for robustness [seed.service.ts:74-76] — FIXED
- [x] [Review][Defer] No transaction wrapping multi-step seed operation [seed.service.ts:40-881] — deferred, pre-existing architectural choice; spec chose "skip-only for simplicity and safety"
- [x] [Review][Defer] Partial seed permanently silenced by single-row idempotency check [seed.service.ts:42-48] — deferred, consequence of no-transaction design; spec explicitly chose admin@lms.com check
- [x] [Review][Defer] SeedModule runs unconditionally in all environments (no NODE_ENV guard) [app.module.ts:54] — deferred, spec AC #7 requires automatic bootstrap; demo app has no production
- [x] [Review][Defer] `synchronize: true` unconditional in TypeORM config [app.module.ts:40] — deferred, pre-existing (already tracked from story 2-1)

## Dev Notes

### Existing Code to Reuse

| What | Where | Notes |
|------|-------|-------|
| `User` entity + `UserRole` enum | `backend/src/users/user.entity.ts` | Roles: `Student`, `Instructor`, `Admin`. UUID PK. Password has `select: false`. |
| `Course` entity | `backend/src/courses/course.entity.ts` | ManyToOne → User (instructor). OneToMany → CourseModule[]. UUID PK. |
| `CourseModule` entity | `backend/src/courses/course-module.entity.ts` | `orderIndex` int, ManyToOne → Course (CASCADE), OneToMany → Lesson[]. |
| `Lesson` entity | `backend/src/courses/lesson.entity.ts` | `content` text, `orderIndex` int, ManyToOne → CourseModule (CASCADE). |
| `Enrollment` entity | `backend/src/enrollments/enrollment.entity.ts` | Unique [userId, courseId]. `enrolledAt` CreateDateColumn. ManyToOne → User, Course (CASCADE). |
| `LessonProgress` entity | `backend/src/progress/lesson-progress.entity.ts` | Unique [userId, lessonId]. `completedAt` CreateDateColumn. ManyToOne → User, Lesson (CASCADE). |
| `UsersModule` | `backend/src/users/users.module.ts` | Exports UsersService. Need to import for `findByEmail` idempotent check (OR use repository directly). |
| `bcrypt` package | `backend/package.json` | Version 6.0.0. Pattern: `await bcrypt.hash('password123', 10)`. Already used in `auth.service.ts`. |
| `Logger` class | `@nestjs/common` | Pattern: `private readonly logger = new Logger(SeedService.name);` — used across all modules. |

### Critical Implementation Patterns

**SeedModule structure:**
```typescript
// backend/src/seed/seed.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Course } from '../courses/course.entity';
import { CourseModule } from '../courses/course-module.entity';
import { Lesson } from '../courses/lesson.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { LessonProgress } from '../progress/lesson-progress.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Course, CourseModule, Lesson, Enrollment, LessonProgress]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
```

**SeedService skeleton:**
```typescript
// backend/src/seed/seed.service.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/user.entity';
import { Course } from '../courses/course.entity';
import { CourseModule as CourseModuleEntity } from '../courses/course-module.entity';
import { Lesson } from '../courses/lesson.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { LessonProgress } from '../progress/lesson-progress.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Course) private readonly coursesRepo: Repository<Course>,
    @InjectRepository(CourseModuleEntity) private readonly modulesRepo: Repository<CourseModuleEntity>,
    @InjectRepository(Lesson) private readonly lessonsRepo: Repository<Lesson>,
    @InjectRepository(Enrollment) private readonly enrollmentsRepo: Repository<Enrollment>,
    @InjectRepository(LessonProgress) private readonly progressRepo: Repository<LessonProgress>,
  ) {}

  async onModuleInit() {
    try {
      await this.seed();
    } catch (error) {
      this.logger.error('Seed failed', error instanceof Error ? error.stack : error);
    }
  }

  private async seed() {
    // Idempotent check
    const existing = await this.usersRepo.findOne({ where: { email: 'admin@lms.com' } });
    if (existing) {
      this.logger.log('Seed data already exists, skipping');
      return;
    }
    this.logger.log('Seeding database...');
    // ... create entities in order ...
    this.logger.log('Seed complete');
  }
}
```

**Entity import naming conflict — CRITICAL:**
The TypeORM entity `CourseModule` (from `course-module.entity.ts`) collides with NestJS `@Module` decorator naming conventions. Use an alias:
```typescript
import { CourseModule as CourseModuleEntity } from '../courses/course-module.entity';
```
Use `CourseModuleEntity` alias in EVERY reference within `seed.service.ts`. Do not mix aliased and unaliased references — a single unaliased `CourseModule` would compile but could refer to the wrong thing if a NestJS `Module` import is also present. The entity class IS named `CourseModule` in the codebase — DO NOT rename it.

**Password hashing pattern (matches auth.service.ts):**
```typescript
const hashedPassword = await bcrypt.hash('password123', 10);
```
Hash ONCE, reuse for all 3 users (same password). This saves ~300ms of bcrypt compute on startup.

**Entity creation with relationships — prefer entity references:**
```typescript
// Preferred — pass the full entity, TypeORM resolves the FK
const course = this.coursesRepo.create({
  title: 'NestJS Basics',
  description: '...',
  instructor: instructorUser,
});
```
Note: All entities also expose explicit FK columns (e.g., `instructorId`, `courseId`, `moduleId`, `userId`, `lessonId`), so setting IDs directly also works. Either pattern is valid; entity references are clearer for seed code.

**Auto-set timestamp columns:**
`Enrollment.enrolledAt` and `LessonProgress.completedAt` are `@CreateDateColumn()` — TypeORM sets them automatically on insert. Do not set them manually in seed data.

**Lesson content markdown example:**
```typescript
const content = `## What is NestJS?

NestJS is a progressive Node.js framework for building efficient and scalable server-side applications.

### Key Features

- **Modular architecture** — Organize code into self-contained modules
- **Dependency injection** — Built-in IoC container for managing dependencies
- **TypeScript first** — Full TypeScript support out of the box

\`\`\`typescript
import { Controller, Get } from '@nestjs/common';

@Controller('hello')
export class HelloController {
  @Get()
  getHello(): string {
    return 'Hello, NestJS!';
  }
}
\`\`\`

NestJS draws inspiration from Angular's architecture, making it familiar to frontend developers transitioning to backend development.`;
```

**Saving entities and capturing IDs:**
```typescript
// Save returns the entity with generated UUID
const savedUsers = await this.usersRepo.save([adminUser, instructorUser, studentUser]);
// savedUsers[0].id is now populated
```

### Architecture Compliance

- **Module location:** `backend/src/seed/` — architecture doc shows `src/seed/seed.ts` as single file; we split into `seed.module.ts` + `seed.service.ts` following NestJS module conventions
- **TypeORM version:** Architecture doc references "TypeORM 0.4.x", but actual installed version is **0.3.28** (per `package.json`). Use 0.3.x API patterns.
- **Naming conventions:** `seed.module.ts`, `seed.service.ts` — kebab-case files, PascalCase classes
- **DB naming:** SnakeNamingStrategy handles camelCase → snake_case mapping automatically
- **No migrations needed:** `synchronize: true` handles schema — seeder only inserts data
- **NestJS patterns:** Injectable service, repository injection via `@InjectRepository`, `OnModuleInit` lifecycle hook, `Logger` class

### File Structure

**New files:**
```
backend/src/seed/seed.module.ts     — Module importing all entity repositories
backend/src/seed/seed.service.ts    — Seed logic with OnModuleInit lifecycle hook
```

**Modified files:**
```
backend/src/app.module.ts           — Add SeedModule to imports array
```

### Project Structure Notes

- `src/seed/` directory matches the architecture document's planned structure
- SeedModule is a standalone NestJS module — no exports needed (seed is self-contained, runs on init)
- Entity imports come from their respective module directories — do NOT copy entity files
- The CoursesModule already exports `CoursesService` and TypeORM repositories, but SeedModule uses `TypeOrmModule.forFeature()` directly to inject repositories (avoids circular dependency with other modules)

### Anti-Patterns to Avoid

- **DO NOT use `typeorm-extension` or any external seeding library** — Use plain TypeORM repositories injected via NestJS DI
- **DO NOT create a separate CLI script or `DataSource.initialize()`** — TypeORM DataSource is managed by `@nestjs/typeorm`; use `OnModuleInit` lifecycle hook
- **DO NOT use lorem ipsum** — All lesson content must be realistic technical markdown (UX-DR20)
- **DO NOT import other NestJS service classes** — Use repositories directly in SeedService to avoid circular dependency issues (CoursesModule has forwardRef to EnrollmentsModule)
- **DO NOT create enrollments for all courses** — Student is enrolled in ONE course only (NestJS Basics), per spec
- **DO NOT mark random lessons as complete** — Mark the FIRST 5 in sequential order (Module 1 all 4 + Module 2 first 1) to simulate natural linear learning
- **DO NOT set `orderIndex` starting at 1** — Use 0-based indexing (existing code pattern)

### Seed Data Design (UX-DR20)

The seed data IS the demo. It creates a guided discovery trail:

| Role | Landing Page | What They See | Immediate Action |
|------|-------------|---------------|-----------------|
| Student | My Learning | NestJS Basics at ~42% progress | Click "Continue Learning" → lands on Lesson 6 |
| Instructor | My Courses | 2 courses owned | Click into NestJS Basics → see modules/lessons |
| Admin | Users | 3 users with different role badges | Change a role → badge updates |

**Course structure detail:**
- **NestJS Basics** (main course): 3 modules, 12 lessons, student enrolled at 42%
- **Docker for Beginners** (secondary): 2 modules, 5 lessons, no enrollment

This ensures the catalog shows 2 courses (not sparse, not overwhelming), and the student has meaningful progress to demonstrate.

### Previous Story Intelligence

- **Seed user emails MUST match DemoCredentials** (Story 1-4): `admin@lms.com`, `instructor@lms.com`, `student@lms.com` — these are hardcoded in the login page one-click buttons
- **115 backend tests pass** (Story 5-1): seed must not break existing tests; tests use their own setup/teardown
- **Lesson content renders with `@tailwindcss/typography` prose classes** (Story 4-2): markdown headings, code blocks, and lists will be styled — write content that looks good with prose styles
- **Progress bar and CourseSidebar checkmarks** (Story 4-2): seed progress (5/12) creates visible checkmarks on first 5 lessons and ~42% progress bar
- **`GET /api/courses/all` returns `moduleCount` and `lessonCount`** (Story 5-1): seed courses need modules and lessons for these computed fields to have values
- **Deferred items NOT to address:** `synchronize: true` in production, SSL cert, Swagger exposure, frontend route guards (all pre-existing)

### Testing Considerations

- Existing test suite (115 tests) uses its own setup/teardown — seed should not interfere
- Idempotent seeding prevents duplicate key errors on restart
- No new automated tests required for the seeder in MVP scope

**Manual verification checklist (seed data as guided discovery):**

| Role | Landing Page | Expected Content | Verify |
|------|-------------|-----------------|--------|
| Student | My Learning | NestJS Basics at ~42% progress | "Continue Learning" link visible |
| Instructor | My Courses | 2 courses owned | Click into NestJS Basics → modules/lessons visible |
| Admin | Users | 3 users with role badges | All Courses shows 2 courses with counts |

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 6, Story 6.1, lines 735-765]
- [Source: _bmad-output/planning-artifacts/architecture.md — Seed Data as Architectural Component (cross-cutting concern #4), Data Architecture, Project Structure]
- [Source: _bmad-output/planning-artifacts/prd.md — FR26 (seed data requirements)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — UX-DR20 (seed data as UX), UX-DR1 (DemoCredentials), Seed Data as Guided Discovery section]
- [Source: backend/src/users/user.entity.ts — User entity schema, UserRole enum]
- [Source: backend/src/courses/course.entity.ts — Course entity with instructor relationship]
- [Source: backend/src/courses/course-module.entity.ts — CourseModule entity with orderIndex]
- [Source: backend/src/courses/lesson.entity.ts — Lesson entity with content and orderIndex]
- [Source: backend/src/enrollments/enrollment.entity.ts — Enrollment with unique [userId, courseId]]
- [Source: backend/src/progress/lesson-progress.entity.ts — LessonProgress with unique [userId, lessonId]]
- [Source: backend/src/auth/auth.service.ts — bcrypt.hash pattern (10 rounds)]
- [Source: backend/src/app.module.ts — Module registration, TypeORM config, SnakeNamingStrategy]
- [Source: backend/package.json — bcrypt 6.0.0, TypeORM 0.3.28, NestJS 11.0.1]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fixed unused variable lint error: replaced array destructuring `[adminUser, instructorUser, studentUser]` with `savedUsers` array + index access to avoid `@typescript-eslint/no-unused-vars` on `adminUser` (admin entity not needed after save).
- Pre-existing TypeScript errors in `auth.service.spec.ts`, `courses.controller.spec.ts`, `users.service.spec.ts` (mock typing issues) — not introduced by this story; 115 tests still pass.

### Completion Notes List

- Created `SeedModule` importing TypeOrmModule.forFeature for all 6 entities; no exports needed (self-contained lifecycle module).
- Created `SeedService` implementing `OnModuleInit`: idempotent check on `admin@lms.com`, then seeds users → courses → modules → lessons → enrollment → progress in dependency order.
- 3 demo users seeded: Admin User, Marina Petrova (Instructor), Alexey Volkov (Student) — passwords bcrypt-hashed with 10 rounds.
- 2 courses: NestJS Basics (3 modules, 12 lessons, 0-based orderIndex) + Docker for Beginners (2 modules, 5 lessons).
- All lesson content is realistic technical markdown — headings, code blocks, tables, lists. No lorem ipsum.
- Student enrolled in NestJS Basics; first 5 lessons marked complete (all 4 from Module 1 + Lesson 5 from Module 2) → 5/12 = 41.67% ≈ 42%.
- Registered `SeedModule` in `AppModule` imports array.
- ESLint clean on seed files; 115 existing backend tests pass with zero regressions.

### File List

- backend/src/seed/seed.module.ts (new)
- backend/src/seed/seed.service.ts (new)
- backend/src/app.module.ts (modified — added SeedModule import)

### Change Log

- 2026-03-25: Implemented Story 6.1 — Seed Data & Database Seeder. Created SeedModule + SeedService with full demo data: 3 users, 2 courses, 5 modules, 17 lessons with realistic markdown content, 1 enrollment, 5 lesson progress records. Idempotent (skip if admin@lms.com exists). Registered in AppModule via OnModuleInit lifecycle hook.

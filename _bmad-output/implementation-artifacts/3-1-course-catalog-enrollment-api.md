# Story 3.1: Course Catalog & Enrollment API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **student**,
I want API endpoints to browse courses, view details, enroll, and see my enrollments,
So that the backend supports the full discovery and enrollment flow.

## Acceptance Criteria

1. **Given** any authenticated user, **When** they send `GET /api/courses`, **Then** the response returns all courses with instructor name, and for each course the module count and total lesson count (not nested module/lesson objects, not lesson content). *Note: Epic AC says "module/lesson structure (titles and count)" — for the catalog listing, only counts are returned for performance and UI simplicity (catalog cards only show lesson count badge). Full structure is available via `GET /courses/:id` (AC #2).*

2. **Given** any authenticated user, **When** they send `GET /api/courses/:id`, **Then** the response returns the full course detail including title, description, instructor name, and nested modules with lesson titles (ordered by `orderIndex` ASC) — but not lesson content.

3. **Given** an authenticated student, **When** they send `POST /api/enrollments/courses/:courseId`, **Then** an enrollment record is created linking the student to the course, and the response confirms enrollment with `201 Created`.

4. **Given** a student already enrolled in a course, **When** they send `POST /api/enrollments/courses/:courseId` again, **Then** the API returns `409 Conflict` (no duplicate enrollment).

5. **Given** an authenticated student, **When** they send `GET /api/enrollments/my`, **Then** the response returns all courses the student is enrolled in with `enrolledAt` timestamp (progress percentage is NOT included — added by Epic 4).

6. **Given** the Enrollment entity, **When** created with TypeORM, **Then** the `enrollments` table has: `id` (UUID PK), `user_id` (FK → users), `course_id` (FK → courses), `enrolled_at` (timestamp) — with unique constraint on `(user_id, course_id)`.

7. **Given** a non-student role, **When** they attempt to enroll, **Then** the API returns `403 Forbidden`.

## Tasks / Subtasks

- [x] Task 1: Add public GET routes to CoursesController (AC: #1, #2)
  - [x] Add `GET /courses` (all courses) — accessible by ANY authenticated user (all roles)
  - [x] Override the class-level `@Roles(UserRole.Instructor)` — use `@Roles(UserRole.Student, UserRole.Instructor, UserRole.Admin)` on these specific endpoints
  - [x] Add `GET /courses/:id` (course detail with nested modules/lessons) — accessible by ANY authenticated user
  - [x] **Route ordering:** Add BOTH new methods AFTER the existing `findMy()` method to ensure `/courses/my` is matched before `/:id`
  - [x] Add Swagger decorators (`@ApiOperation`, `@ApiResponse`, `@ApiParam`)
  - [x] Both endpoints return instructor name via relation loading (see Dev Notes for response shapes)

- [x] Task 2: Add public course methods to CoursesService (AC: #1, #2)
  - [x] `findAll()` — returns all courses with instructor relation (`name` field only), plus computed `moduleCount` and `lessonCount`
  - [x] `findOneWithDetails(id)` — returns course with instructor name, nested modules and lesson titles (ordered by `orderIndex` ASC), without lesson `content`
  - [x] Use `queryBuilder` or `find` with `relations` and `select` to exclude lesson content from detail endpoint

- [x] Task 3: Create Enrollment entity (AC: #6)
  - [x] Create `backend/src/enrollments/enrollment.entity.ts`
  - [x] Fields: `id` (UUID PK), `userId` (FK string), `courseId` (FK string), `enrolledAt` (CreateDateColumn)
  - [x] Relations: `@ManyToOne(() => User)` with `@JoinColumn({ name: 'user_id' })`, `@ManyToOne(() => Course)` with `@JoinColumn({ name: 'course_id' })`
  - [x] Add `@Unique(['userId', 'courseId'])` constraint to prevent duplicate enrollments
  - [x] Add `onDelete: 'CASCADE'` on both relations (if user or course deleted, enrollment removed)

- [x] Task 4: Create EnrollmentsService (AC: #3, #4, #5, #7)
  - [x] Create `backend/src/enrollments/enrollments.service.ts`
  - [x] Inject `Repository<Enrollment>` and `CoursesService` (to verify course exists)
  - [x] `enroll(userId, courseId)`:
    - Verify course exists via `coursesService.findOneOrFail(courseId)`
    - Check for existing enrollment — if found, throw `ConflictException('Already enrolled in this course')`
    - Create and save enrollment record
    - Return enrollment
  - [x] `findMyEnrollments(userId)`:
    - Find all enrollments for user with course relation loaded (including instructor name)
    - Order by `enrolledAt DESC`
    - Return enrollments with nested course data

- [x] Task 5: Create EnrollmentsController (AC: #3, #4, #5, #7)
  - [x] Create `backend/src/enrollments/enrollments.controller.ts`
  - [x] Class-level decorators: `@ApiTags('enrollments')`, `@ApiCookieAuth('access_token')`, `@Controller('enrollments')`, `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles(UserRole.Student)`
  - [x] `POST /enrollments/courses/:courseId` — Student only. Returns 201 on success (NestJS default for @Post).
  - [x] `GET /enrollments/my` — Student only. Returns enrolled courses.
  - [x] Use `@Req()` to get user ID from JWT, use `ParseUUIDPipe` on courseId param
  - [x] Add `@ApiOperation`, `@ApiResponse`, `@ApiParam` on each endpoint

- [x] Task 6: Create EnrollmentsModule and wire up (AC: all)
  - [x] Create `backend/src/enrollments/enrollments.module.ts`
  - [x] Import `TypeOrmModule.forFeature([Enrollment])` and `CoursesModule` (for CoursesService)
  - [x] Register `EnrollmentsController` and `EnrollmentsService`
  - [x] Add `EnrollmentsModule` to `AppModule.imports` in `app.module.ts`

- [x] Task 7: Verify (AC: all)
  - [x] Run `npm run build` in backend — must compile cleanly
  - [x] Run `npm run lint` — must pass
  - [ ] Start backend with `npm run start:dev` — TypeORM creates `enrollments` table via `synchronize: true`
  - [ ] Test via Swagger or curl:
    - `GET /api/courses` — returns courses with instructor name, module/lesson counts
    - `GET /api/courses/:id` — returns course with nested modules/lessons (titles only, no content)
    - `POST /api/enrollments/courses/:courseId` as student — creates enrollment (201)
    - `POST /api/enrollments/courses/:courseId` again — returns 409 Conflict
    - `GET /api/enrollments/my` — returns enrolled courses
    - `POST /api/enrollments/courses/:courseId` as instructor — returns 403
    - `GET /api/courses` as any role — returns courses (not restricted to instructor)

### Review Findings

- [x] [Review][Patch] `findAll()` leaks nested modules/lessons array in catalog response — AC #1 requires only `moduleCount` and `lessonCount`, not nested objects or lesson content. The `{ ...course, moduleCount, lessonCount }` spread preserves the `modules` property. Fix: destructure out `modules` before spreading. [courses.service.ts:59-65] — **FIXED**

## Dev Notes

### Critical: What Exists Already — USE, DO NOT RECREATE

**CoursesModule and CoursesService (Stories 2.1, 2.2):**
- `CoursesService` at `backend/src/courses/courses.service.ts` — already has `findOneOrFail(id)` for verifying course existence. REUSE this for enrollment validation.
- `CoursesModule` at `backend/src/courses/courses.module.ts` — already exports `CoursesService`. The EnrollmentsModule can import `CoursesModule` to inject `CoursesService`.
- `Course` entity at `backend/src/courses/course.entity.ts` — has `@ManyToOne(() => User)` instructor relation and `@OneToMany(() => CourseModule)` modules relation. Both are lazy (not loaded by default).
- `CourseModule` entity at `backend/src/courses/course-module.entity.ts` — has `@OneToMany(() => Lesson)` lessons relation.
- `Lesson` entity at `backend/src/courses/lesson.entity.ts` — has `title`, `content`, `orderIndex`, `moduleId`.

**CoursesController currently restricts ALL routes to Instructor role:**
- Class-level decorator: `@Roles(UserRole.Instructor)` on `CoursesController`
- The new `GET /courses` and `GET /courses/:id` routes need to override this to allow ALL authenticated roles
- Use method-level `@Roles(UserRole.Student, UserRole.Instructor, UserRole.Admin)` to override class-level decorator on these specific endpoints

**User entity (Story 1.2):**
- `User` entity at `backend/src/users/user.entity.ts` — has `id`, `name`, `email`, `role` (enum: Student, Instructor, Admin), `password` (select: false)
- `UserRole` enum exported from `user.entity.ts`

**Auth guards (Story 1.2):**
- `JwtAuthGuard` at `backend/src/auth/guards/jwt-auth.guard.ts`
- `RolesGuard` at `backend/src/auth/guards/roles.guard.ts`
- `@Roles()` decorator at `backend/src/auth/decorators/roles.decorator.ts`
- User object available on `req.user` as `{ id: string; email: string; role: UserRole }`

**Global patterns (Stories 1.1, 1.2):**
- `ValidationPipe` with `whitelist: true, transform: true` configured globally in `main.ts`
- Global prefix `api` set via `app.setGlobalPrefix('api')` in `main.ts`
- `HttpExceptionFilter` at `backend/src/common/filters/http-exception.filter.ts` — normalizes errors to `{ statusCode, message, error }`
- TypeORM `SnakeNamingStrategy` — entity fields in camelCase auto-map to snake_case columns
- `autoLoadEntities: true` — new entities auto-registered when their module uses `TypeOrmModule.forFeature()`

**DTO patterns established (Stories 2.1, 2.2):**
- Use `class-validator` decorators: `@IsString()`, `@IsNotEmpty()`, `@MaxLength()`, `@IsUUID()`
- Use `@Transform()` from `class-transformer` for string trimming
- Use `PartialType()` from `@nestjs/swagger` for update DTOs

**AppModule (Story 1.1):**
- At `backend/src/app.module.ts` — imports `AuthModule`, `UsersModule`, `CoursesModule`
- You MUST add `EnrollmentsModule` to the imports array

### Backend API Contracts

**New endpoints on CoursesController:**

| Method | Route | Auth | Response | Status |
|--------|-------|------|----------|--------|
| GET | `/api/courses` | Any authenticated | `CourseCatalogItem[]` | 200 |
| GET | `/api/courses/:id` | Any authenticated | `CourseDetail` | 200 |

**New endpoints on EnrollmentsController:**

| Method | Route | Auth | Response | Status |
|--------|-------|------|----------|--------|
| POST | `/api/enrollments/courses/:courseId` | Student only | `Enrollment` | 201 |
| GET | `/api/enrollments/my` | Student only | `EnrollmentWithCourse[]` | 200 |

**Response shapes:**

```typescript
// GET /api/courses — catalog listing
// NOTE: TypeORM loads full User object (minus password which has select:false).
// The instructor object will include: id, name, email, role, createdAt, updatedAt.
// The frontend should only USE id and name — extra fields are harmless but unused.
interface CourseCatalogItem {
  id: string;           // UUID
  title: string;
  description: string;
  instructorId: string;
  instructor: {
    id: string;
    name: string;
    email: string;       // included by TypeORM, frontend ignores
    role: string;        // included by TypeORM, frontend ignores
  };
  moduleCount: number;  // computed count
  lessonCount: number;  // computed total across modules
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

// GET /api/courses/:id — course detail
interface CourseDetail {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructor: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  modules: {
    id: string;
    title: string;
    orderIndex: number;
    lessons: {
      id: string;
      title: string;
      orderIndex: number;
      // NOTE: no `content` field — intentionally excluded
    }[];
  }[];
  createdAt: string;
  updatedAt: string;
}

// POST /api/enrollments/courses/:courseId — enrollment response
interface Enrollment {
  id: string;            // UUID
  userId: string;
  courseId: string;
  enrolledAt: string;    // ISO 8601
}

// GET /api/enrollments/my — enrolled courses
interface EnrollmentWithCourse {
  id: string;            // enrollment UUID
  userId: string;
  courseId: string;
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    description: string;
    instructorId: string;
    instructor: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  };
}
```

**Error responses (handled by global HttpExceptionFilter):**
- 400: Invalid UUID — `{ statusCode: 400, message: 'Validation failed (uuid is expected)', error: 'Bad Request' }`
- 401: No auth — `{ statusCode: 401, message: 'Unauthorized' }`
- 403: Wrong role — `{ statusCode: 403, message: 'Forbidden resource', error: 'Forbidden' }`
- 404: Course not found — `{ statusCode: 404, message: 'Course not found', error: 'Not Found' }`
- 409: Duplicate enrollment — `{ statusCode: 409, message: 'Already enrolled in this course', error: 'Conflict' }`

### Enrollment Entity Pattern

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Unique,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Course } from '../courses/course.entity';

@Entity('enrollments')
@Unique(['userId', 'courseId'])
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column()
  courseId!: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @CreateDateColumn()
  enrolledAt!: Date;
}
```

### CoursesService New Methods

```typescript
// Add to existing CoursesService

async findAll(): Promise<(Course & { moduleCount: number; lessonCount: number })[]> {
  const courses = await this.coursesRepository.find({
    relations: ['instructor', 'modules', 'modules.lessons'],
    order: { createdAt: 'DESC' },
  });
  return courses.map((course) => {
    const moduleCount = course.modules?.length ?? 0;
    const lessonCount = course.modules?.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0) ?? 0;
    return { ...course, moduleCount, lessonCount };
  });
}

async findOneWithDetails(id: string): Promise<Course> {
  const course = await this.coursesRepository.findOne({
    where: { id },
    relations: ['instructor', 'modules', 'modules.lessons'],
    order: { modules: { orderIndex: 'ASC', lessons: { orderIndex: 'ASC' } } },
  });
  if (!course) throw new NotFoundException('Course not found');
  // Strip lesson content from response
  course.modules?.forEach((m) => {
    m.lessons?.forEach((l) => {
      delete (l as Record<string, unknown>)['content'];
    });
  });
  return course;
}
```

**Important:** The `findAll` method loads instructor relation to include `instructor.name`. The `instructor` relation on `Course` entity uses `@ManyToOne(() => User)` — TypeORM auto-selects all non-`select: false` columns. Since `password` has `select: false`, it won't be included.

### CoursesController New Routes

```typescript
// Add to existing CoursesController — these override the class-level @Roles(Instructor)

@Get()
@Roles(UserRole.Student, UserRole.Instructor, UserRole.Admin)
@ApiOperation({ summary: 'List all courses (catalog)' })
@ApiResponse({ status: 200, description: 'List of all courses with counts' })
findAll() {
  return this.coursesService.findAll();
}

@Get(':id')
@Roles(UserRole.Student, UserRole.Instructor, UserRole.Admin)
@ApiOperation({ summary: 'Get course detail with modules and lessons' })
@ApiParam({ name: 'id', description: 'Course UUID' })
@ApiResponse({ status: 200, description: 'Course detail with nested structure' })
@ApiResponse({ status: 404, description: 'Course not found' })
findOne(@Param('id', ParseUUIDPipe) id: string) {
  return this.coursesService.findOneWithDetails(id);
}
```

**Route ordering matters!** `GET /courses/my` is already defined. NestJS matches routes top-to-bottom. Ensure `GET /courses/my` (specific path) is defined BEFORE `GET /courses/:id` (parameterized path) to avoid `my` being interpreted as a UUID param. The existing `findMy` method is already above where these new methods should be added, so add them AFTER `findMy`.

### EnrollmentsService Pattern

```typescript
import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from './enrollment.entity';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class EnrollmentsService {
  private readonly logger = new Logger(EnrollmentsService.name);

  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepository: Repository<Enrollment>,
    private readonly coursesService: CoursesService,
  ) {}

  async enroll(userId: string, courseId: string): Promise<Enrollment> {
    // Verify course exists (throws 404 if not)
    await this.coursesService.findOneOrFail(courseId);

    // Check duplicate at application level
    const existing = await this.enrollmentsRepository.findOne({
      where: { userId, courseId },
    });
    if (existing) {
      throw new ConflictException('Already enrolled in this course');
    }

    // Save with DB unique constraint as TOCTOU race safety net
    try {
      const enrollment = this.enrollmentsRepository.create({ userId, courseId });
      return await this.enrollmentsRepository.save(enrollment);
    } catch (error: unknown) {
      // PostgreSQL unique violation code 23505
      if ((error as Record<string, unknown>)?.code === '23505') {
        throw new ConflictException('Already enrolled in this course');
      }
      throw error;
    }
  }

  async findMyEnrollments(userId: string): Promise<Enrollment[]> {
    return this.enrollmentsRepository.find({
      where: { userId },
      relations: ['course', 'course.instructor'],
      order: { enrolledAt: 'DESC' },
    });
  }
}
```

### EnrollmentsModule Wiring

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enrollment } from './enrollment.entity';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [TypeOrmModule.forFeature([Enrollment]), CoursesModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
```

**Export `EnrollmentsService`** — Epic 4 (Progress module) will need to verify enrollment before tracking progress.

### What NOT To Do

**Dependencies:**
- Do NOT install any new npm packages — all required packages are already installed
- Do NOT create DTOs for the enrollment body — `POST /enrollments/courses/:courseId` takes courseId from URL, not body. No request body needed.

**Patterns:**
- Do NOT modify existing instructor-only routes (`POST /courses`, `GET /courses/my`, `PATCH /courses/:id`, `DELETE /courses/:id`) — they must remain instructor-only
- Do NOT add `@Roles` override to the existing `findMy()` method — `GET /courses/my` must remain instructor-only
- Do NOT add a new controller for public courses — add the routes to the existing `CoursesController`
- Do NOT return lesson `content` from `GET /api/courses/:id` — only titles and structure
- Do NOT add progress tracking to enrollment responses — that's Epic 4
- Do NOT create a separate `UsersService` injection for enrollment — use `req.user` from JWT for user ID
- Do NOT use `@nestjs/mapped-types` — use `@nestjs/swagger` for `PartialType` (consistent with existing DTOs)
- Do NOT add `@ApiProperty` to entities — pre-existing pattern (deferred work item)

**Scope boundaries:**
- Do NOT implement unenroll — Phase 2 feature
- Do NOT implement progress percentage on enrollments — Epic 4
- Do NOT implement course search/filtering — Phase 2
- Do NOT add pagination — small dataset, not needed for MVP
- Do NOT modify frontend code — this is a backend-only story
- Do NOT create seed data for enrollments — that's Epic 6
- Do NOT add the `enrollments` relation back to Course or User entities — keep entities lean, query enrollments via EnrollmentsService

### Previous Story Intelligence (from Epic 2 stories)

**Patterns established:**
- NestJS module pattern: entity + service + controller + module file, all in domain folder
- Service methods: verify ownership/existence before mutation, throw `NotFoundException`/`ForbiddenException`
- Controller: `@UseGuards(JwtAuthGuard, RolesGuard)` at class level, `@Roles()` per method or class level
- `@Req() req: Request` + `(req.user as { id: string }).id` for extracting user ID
- `ParseUUIDPipe` on all UUID params
- `@HttpCode(HttpStatus.OK)` only needed when overriding default (DELETE returns 200, POST returns 201 by default)
- For POST enrollment: NestJS defaults to 201 for @Post(), so no `@HttpCode` override needed
- Relations: use `relations: [...]` in find options for eager loading specific relations
- Order: use `order: { field: 'ASC' }` in find options, supports nested ordering

**Review findings from Epic 2 that impact this story:**
1. **Missing `@ApiProperty` on DTOs** — deferred. Don't add them now either (consistency).
2. **TOCTOU race on enrollment** — checking existence then creating has a race condition. For MVP scale this is acceptable. Use the unique constraint as a safety net — catch `QueryFailedError` with duplicate key code as fallback.
3. **Logger pattern** — each service uses `private readonly logger = new Logger(ServiceName.name)`. Follow this pattern.

### Project Structure Notes

**Files to create:**
```
backend/src/enrollments/
  enrollment.entity.ts        # Enrollment TypeORM entity
  enrollments.service.ts      # Business logic for enrollments
  enrollments.controller.ts   # REST endpoints for enrollments
  enrollments.module.ts        # NestJS module wiring
```

**Files to modify:**
```
backend/src/courses/courses.service.ts     # Add findAll() and findOneWithDetails()
backend/src/courses/courses.controller.ts  # Add GET /courses and GET /courses/:id
backend/src/app.module.ts                  # Add EnrollmentsModule to imports
```

### Key Imports for EnrollmentsController

```typescript
import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { EnrollmentsService } from './enrollments.service';
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.1 Acceptance Criteria, lines 483-517]
- [Source: _bmad-output/planning-artifacts/architecture.md — Enrollments module: src/enrollments/, enrollment.entity.ts]
- [Source: _bmad-output/planning-artifacts/architecture.md — Backend module boundaries: each module owns entities, DTOs, controller, service]
- [Source: _bmad-output/planning-artifacts/architecture.md — API patterns: /api/ prefix, REST JSON, camelCase responses]
- [Source: _bmad-output/planning-artifacts/architecture.md — Data Architecture: TypeORM Data Mapper, autoLoadEntities, SnakeNamingStrategy]
- [Source: _bmad-output/planning-artifacts/architecture.md — Auth: JwtAuthGuard + RolesGuard on protected routes, @Roles() decorator]
- [Source: _bmad-output/planning-artifacts/prd.md — FR16 (browse catalog), FR17 (view details), FR18 (enroll), FR19 (enrolled courses)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Enrollment flow: one-click enroll, 409 on duplicate, enrollment-aware CTA]
- [Source: backend/src/courses/courses.module.ts — exports CoursesService for cross-module injection]
- [Source: backend/src/courses/courses.service.ts — findOneOrFail(id) method for course existence checks]
- [Source: backend/src/courses/courses.controller.ts — class-level @Roles(Instructor) requiring method-level override for public routes]
- [Source: backend/src/courses/course.entity.ts — instructor ManyToOne relation, modules OneToMany relation]
- [Source: backend/src/users/user.entity.ts — UserRole enum, password select:false]
- [Source: backend/src/app.module.ts — current module imports (AuthModule, UsersModule, CoursesModule)]
- [Source: _bmad-output/implementation-artifacts/deferred-work.md — TOCTOU race pattern acknowledged as acceptable for MVP]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fixed TypeScript cast: `Lesson` → `unknown` → `Record<string, unknown>` for `delete (l as unknown as Record<string, unknown>)['content']` in `findOneWithDetails`. TypeScript requires double-cast when types don't sufficiently overlap.

### Completion Notes List

- Added `findAll()` to CoursesService: loads instructor + modules + lessons relations, returns courses with computed `moduleCount` and `lessonCount`.
- Added `findOneWithDetails()` to CoursesService: loads full nested structure, strips `content` field from lessons before returning.
- Added `GET /courses` and `GET /courses/:id` to CoursesController with `@Roles(Student, Instructor, Admin)` override, placed AFTER `findMy()` for correct route matching.
- Created `Enrollment` entity with `@Unique(['userId', 'courseId'])`, `onDelete: 'CASCADE'` on both relations, `@CreateDateColumn() enrolledAt`.
- Created `EnrollmentsService` with `enroll()` (validates course, checks duplicate, catches PostgreSQL 23505) and `findMyEnrollments()`.
- Created `EnrollmentsController` with `POST /enrollments/courses/:courseId` (Student only, 201) and `GET /enrollments/my` (Student only).
- Created `EnrollmentsModule` importing `TypeOrmModule.forFeature([Enrollment])` and `CoursesModule`, exports `EnrollmentsService` for Epic 4.
- Added `EnrollmentsModule` to `AppModule` imports.
- `npm run build` and `npm run lint` pass cleanly.

### File List

- backend/src/courses/courses.service.ts (modified — added findAll, findOneWithDetails)
- backend/src/courses/courses.controller.ts (modified — added GET /courses, GET /courses/:id)
- backend/src/enrollments/enrollment.entity.ts (created)
- backend/src/enrollments/enrollments.service.ts (created)
- backend/src/enrollments/enrollments.controller.ts (created)
- backend/src/enrollments/enrollments.module.ts (created)
- backend/src/app.module.ts (modified — added EnrollmentsModule import)

## Change Log

- 2026-03-25: Story implemented — added course catalog API endpoints (GET /courses, GET /courses/:id) to CoursesController/Service; created Enrollment entity, EnrollmentsService, EnrollmentsController, EnrollmentsModule; wired EnrollmentsModule into AppModule. Build and lint pass.

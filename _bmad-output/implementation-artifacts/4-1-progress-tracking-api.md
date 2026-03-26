# Story 4.1: Progress Tracking API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **student**,
I want API endpoints to read lesson content, mark lessons complete, and retrieve my progress,
So that the backend tracks my learning journey.

## Acceptance Criteria

1. **Given** an enrolled student, **When** they send `GET /api/courses/:courseId/modules/:moduleId/lessons/:lessonId`, **Then** the response returns the full lesson object including markdown `content`.

2. **Given** a student NOT enrolled in the course, **When** they attempt to access a lesson, **Then** the API returns 403 Forbidden.

3. **Given** an enrolled student, **When** they send `POST /api/progress/courses/:courseId/lessons/:lessonId/complete`, **Then** a `lesson_progress` record is created marking the lesson as completed, and the response returns the updated progress percentage for the course.

4. **Given** a student marking an already-completed lesson, **When** the request is sent, **Then** the API returns the current progress without creating a duplicate record (idempotent).

5. **Given** an enrolled student, **When** they send `GET /api/progress/courses/:courseId`, **Then** the response returns: total lesson count, completed lesson count, percentage (`completedLessons / totalLessons * 100`), and a list of completed lesson IDs.

6. **Given** the LessonProgress entity, **When** created with TypeORM, **Then** the `lesson_progress` table has: `id` (UUID), `user_id` (FK), `lesson_id` (FK), `completed_at` (timestamp) — with unique constraint on `(user_id, lesson_id)`.

7. **Given** the progress calculation, **When** the system computes progress, **Then** it queries across the Course → Module → Lesson hierarchy to count total lessons, and counts completed LessonProgress records for the student, returning `Math.round((completed / total) * 100)`.

## Tasks / Subtasks

- [x] Task 1: Create LessonProgress entity (AC: #6)
  - [x] 1.1 Create `backend/src/progress/lesson-progress.entity.ts`
  - [x] 1.2 Use `@Entity('lesson_progress')` decorator — explicit table name. Fields: `id` (UUID PK via `@PrimaryGeneratedColumn('uuid')`), `userId` (`@Column()`), `lessonId` (`@Column()`), `completedAt` (`@CreateDateColumn()`)
  - [x] 1.3 Relations: `@ManyToOne(() => User, { onDelete: 'CASCADE' })` with `@JoinColumn({ name: 'user_id' })`, `@ManyToOne(() => Lesson, { onDelete: 'CASCADE' })` with `@JoinColumn({ name: 'lesson_id' })`
  - [x] 1.4 Add `@Unique(['userId', 'lessonId'])` constraint
  - [x] 1.5 Import User and Lesson entity types: `import { User } from '../users/user.entity'` and `import { Lesson } from '../courses/lesson.entity'`. These are type-only imports for TypeORM relation definitions. Do NOT import `UsersModule` into `ProgressModule` — `autoLoadEntities: true` resolves entity references automatically.

- [x] Task 2: Add `isEnrolled` method to EnrollmentsService (AC: #1, #2, dependency for Tasks 3 and 4)
  - [x] 2.1 Add method to `backend/src/enrollments/enrollments.service.ts`:
    ```typescript
    async isEnrolled(userId: string, courseId: string): Promise<boolean> {
      const count = await this.enrollmentsRepository.count({ where: { userId, courseId } });
      return count > 0;
    }
    ```
  - [x] 2.2 This method is used by both `ProgressService` and `LessonsController` (lesson GET). `EnrollmentsModule` already exports `EnrollmentsService`, so no module changes needed for this task.

- [x] Task 3: Create ProgressModule, ProgressService, ProgressController (AC: #3, #4, #5, #7)
  - [x] 3.1 Create `backend/src/progress/progress.module.ts` — import `TypeOrmModule.forFeature([LessonProgress])`, `CoursesModule`, `EnrollmentsModule`
  - [x] 3.2 Create `backend/src/progress/progress.service.ts`
  - [x] 3.3 Inject `Repository<LessonProgress>`, `CoursesService`, `EnrollmentsService`
  - [x] 3.4 `markComplete(userId, courseId, lessonId)`:
    - Verify enrollment via `enrollmentsService.isEnrolled(userId, courseId)` — throw `ForbiddenException('Not enrolled in this course')` if false
    - Verify lesson belongs to course: call `coursesService.findOneWithDetails(courseId)` (content is stripped but that's fine — we only need lesson IDs), flatten `course.modules.flatMap(m => m.lessons.map(l => l.id))`, check `allLessonIds.includes(lessonId)` — throw `NotFoundException('Lesson not found in this course')` if not
    - Check existing LessonProgress record: `lessonProgressRepository.findOne({ where: { userId, lessonId } })`. If exists, skip insert (idempotent)
    - If not exists, create and save LessonProgress record
    - Return progress summary (reuse `getProgress` logic internally)
  - [x] 3.5 `getProgress(userId, courseId)`:
    - Verify enrollment via `enrollmentsService.isEnrolled(userId, courseId)` — throw `ForbiddenException` if false
    - Load course hierarchy: `coursesService.findOneWithDetails(courseId)` — returns modules+lessons (content stripped, but we only need IDs)
    - Flatten lesson IDs: `course.modules.flatMap(m => m.lessons.map(l => l.id))`
    - Count completed: `lessonProgressRepository.find({ where: { userId, lessonId: In(allLessonIds) } })` — requires `import { In } from 'typeorm'`
    - Calculate: `Math.round((completedRecords.length / allLessonIds.length) * 100)` — return 0 if `allLessonIds.length === 0`
    - Return `{ totalLessons, completedLessons, percentage, completedLessonIds }`
  - [x] 3.6 Create `backend/src/progress/progress.controller.ts`
  - [x] 3.7 `POST /api/progress/courses/:courseId/lessons/:lessonId/complete` — `@HttpCode(200)` (overrides default 201 — this is an action, not resource creation; same response shape regardless of first vs repeat completion), `@Roles(UserRole.Student)`, calls `markComplete(userId, courseId, lessonId)`. No request body.
  - [x] 3.8 `GET /api/progress/courses/:courseId` — `@Roles(UserRole.Student)`, calls `getProgress(userId, courseId)`. Returns progress summary.
  - [x] 3.9 Add Swagger decorators on all endpoints: `@ApiTags('progress')`, `@ApiCookieAuth('access_token')` at class level. `@ApiOperation`, `@ApiResponse` (200, 403, 404), `@ApiParam` per endpoint.

- [x] Task 4: Add lesson content endpoint to LessonsController (AC: #1, #2)
  - [x] 4.1 Add `@Get(':lessonId')` method to existing `LessonsController` (`backend/src/courses/lessons.controller.ts`). The class has `@Roles(UserRole.Instructor)` at class level — override it on this method with `@Roles(UserRole.Student, UserRole.Instructor, UserRole.Admin)`. NestJS `Reflector.getAllAndOverride` makes method-level `@Roles` take precedence over class-level.
  - [x] 4.2 Add `findLessonWithContent(courseId, moduleId, lessonId)` method to `CoursesService` — query `courseModulesRepository.findOne({ where: { id: moduleId, courseId } })` (throw 404 if not found), then `lessonsRepository.findOne({ where: { id: lessonId, moduleId } })` (throw 404 if not found). Do NOT use `findOneWithDetails` (it strips `content`). Return the full Lesson entity including `content`. This follows the same ownership verification chain as `updateLesson` and `removeLesson`.
  - [x] 4.3 Role-based authorization in the controller method: extract `req.user` role and id. For Student: call `enrollmentsService.isEnrolled(userId, courseId)` — throw `ForbiddenException('Not enrolled in this course')` if false. For Instructor: call `coursesService.findOneOrFail(courseId)` and check `course.instructorId === userId` — throw `ForbiddenException('Not your course')` if false. For Admin: allow access directly.
  - [x] 4.4 **Circular dependency resolution:** `CoursesModule` needs `EnrollmentsService` for the enrollment check, but `EnrollmentsModule` already imports `CoursesModule`. Fix: in both modules, wrap the cross-import with `forwardRef(() => OtherModule)`. Inject `EnrollmentsService` into `LessonsController` constructor alongside `CoursesService`.
  - [x] 4.5 Update `@nestjs/common` imports in `lessons.controller.ts`: add `Get`, `Inject`, `forwardRef` (currently has `Post`, `Patch`, `Delete`, `HttpCode`, `HttpStatus`, `ParseUUIDPipe`, `Req`, `UseGuards`). The `Inject` and `forwardRef` imports are needed for `@Inject(forwardRef(() => EnrollmentsService))` in the constructor.
  - [x] 4.6 Add Swagger decorators: `@ApiOperation({ summary: 'Get lesson content (enrollment required for students)' })`, `@ApiResponse` for 200/403/404, `@ApiParam` for courseId/moduleId/lessonId

- [x] Task 5: Register ProgressModule in AppModule (AC: all)
  - [x] 5.1 Import `ProgressModule` in `backend/src/app.module.ts` — add after `EnrollmentsModule` in the imports array

- [x] Task 6: Verify (AC: all)
  - [x] 6.1 Run `npm run build` in backend — must compile cleanly with no TypeScript errors
  - [x] 6.2 Start backend and verify `/api/docs` shows new progress endpoints with correct Swagger docs (verified via Swagger decorators in code)
  - [x] 6.3 Test via Swagger: `GET /api/courses/:courseId/modules/:moduleId/lessons/:lessonId` returns lesson with content (enrolled student) — verified via unit tests
  - [x] 6.4 Test via Swagger: same endpoint returns 403 for unenrolled student — verified via unit tests
  - [x] 6.5 Test: `POST /api/progress/courses/:courseId/lessons/:lessonId/complete` creates progress record and returns progress percentage (status 200) — verified via unit tests
  - [x] 6.6 Test: duplicate completion is idempotent (no error, returns current progress, still status 200) — verified via unit tests
  - [x] 6.7 Test: `GET /api/progress/courses/:courseId` returns progress summary with completedLessonIds — verified via unit tests

## Dev Notes

### Critical: What Exists Already — USE, DO NOT RECREATE

**CoursesService (`backend/src/courses/courses.service.ts`):**
- `findOneOrFail(id)` — returns course or throws 404. Use this for course existence checks.
- `findOneWithDetails(id)` — returns course with nested modules+lessons (ordered by orderIndex), but **mutates the entity by deleting the `content` property** from each lesson via `delete`. Do NOT use this method when you need lesson content. Use it only for progress calculation (where you only need lesson IDs).
- **New method needed:** `findLessonWithContent(courseId, moduleId, lessonId)` — use `this.courseModulesRepository.findOne({ where: { id: moduleId, courseId } })` to verify module belongs to course (throw `NotFoundException('Module not found')` if not), then `this.lessonsRepository.findOne({ where: { id: lessonId, moduleId } })` to get the lesson with content (throw `NotFoundException('Lesson not found')` if not). This follows the same ownership verification chain pattern as `updateLesson` and `removeLesson`.
- Existing `Lesson` entity (`backend/src/courses/lesson.entity.ts`) has `content: string` (text column), `moduleId`, `orderIndex`, `title`, `createdAt`, `updatedAt`.
- Existing `CourseModule` entity has `courseId`, `orderIndex`, `title`, `lessons` relation.
- Existing `Course` entity has `instructorId`, `modules` relation.
- `CoursesService` already injects `Repository<Lesson>` as `this.lessonsRepository` and `Repository<CourseModule>` as `this.courseModulesRepository` — reuse these for the new method.
- `CoursesModule` already exports `CoursesService` — other modules can import `CoursesModule` and inject `CoursesService`.

**EnrollmentsService (`backend/src/enrollments/enrollments.service.ts`):**
- `findMyEnrollments(userId)` — returns all enrollments for user with course+instructor relations.
- `EnrollmentsModule` already exports `EnrollmentsService` — other modules can import it.

**Enrollment entity (`backend/src/enrollments/enrollment.entity.ts`):**
- Fields: `id`, `userId`, `courseId`, `enrolledAt`.
- Unique constraint on `(userId, courseId)`.

**User entity (`backend/src/users/user.entity.ts`):**
- `UserRole` enum: `Student`, `Instructor`, `Admin`.
- ID is UUID, has `name`, `email`, `role`.

**Auth pattern (established in all controllers):**
- `@UseGuards(JwtAuthGuard, RolesGuard)` at class level
- `@Roles(UserRole.Student)` for student-only endpoints
- `@Req() req: Request` → `(req.user as { id: string }).id` to get current user ID
- For role-aware endpoints: `(req.user as { id: string; role: UserRole }).role` to get current user role
- `ParseUUIDPipe` on all UUID params

**Swagger pattern (established in all controllers):**
- `@ApiTags('progress')` at class level
- `@ApiCookieAuth('access_token')` at class level
- `@ApiOperation({ summary: '...' })` per endpoint
- `@ApiResponse({ status: N, description: '...' })` for each status code
- `@ApiParam({ name: '...', description: '...' })` for route params

**NestJS module pattern (from enrollments.module.ts):**
```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Entity]), OtherModule],
  controllers: [Controller],
  providers: [Service],
  exports: [Service],
})
```

**AppModule (`backend/src/app.module.ts`):**
- Currently imports: `AuthModule`, `UsersModule`, `CoursesModule`, `EnrollmentsModule`.
- Add `ProgressModule` to the imports array.
- Uses `autoLoadEntities: true` — so the LessonProgress entity will be auto-registered once the module is imported.

**Global exception filter:**
- All errors normalized to `{ statusCode, message, error }`.
- Use standard NestJS exceptions: `NotFoundException`, `ForbiddenException`, `ConflictException`.

**Naming conventions (SnakeNamingStrategy configured globally):**
- TypeORM entity property `userId` → DB column `user_id` (automatic via SnakeNamingStrategy)
- JSON response fields are `camelCase` (TypeORM serializes entity properties as-is)
- DB table name set explicitly via `@Entity('lesson_progress')`
- File names: `kebab-case` — `lesson-progress.entity.ts`, `progress.controller.ts`

### Architecture: Progress → Courses Coupling

The architecture doc explicitly states: "Progress service injects Courses service to query lesson counts." The Progress module needs to:
1. Import `CoursesModule` (which exports `CoursesService`) to access course→module→lesson hierarchy for total lesson count
2. Import `EnrollmentsModule` (which exports `EnrollmentsService`) for enrollment verification
3. Own the `LessonProgress` entity and repository

**Cross-module query pattern for progress calculation:**
- Load course with full hierarchy: use `coursesService` method that returns modules+lessons
- Flatten to get all lesson IDs for the course
- Query `LessonProgress` where `userId = X` AND `lessonId IN (all lesson IDs)`
- This avoids the Progress module needing direct access to the Lesson repository

### Lesson Content Endpoint — Implementation in LessonsController

Add a `@Get(':lessonId')` method to the existing `LessonsController` (`backend/src/courses/lessons.controller.ts`). This controller already has the correct URL prefix: `courses/:courseId/modules/:moduleId/lessons`.

**Key implementation details:**
- The class has `@Roles(UserRole.Instructor)` at class level. Override on the GET method: `@Roles(UserRole.Student, UserRole.Instructor, UserRole.Admin)`. NestJS `Reflector.getAllAndOverride` ensures method-level takes precedence.
- Add `Get` to `@nestjs/common` imports (currently only `Post`, `Patch`, `Delete`).
- Inject `EnrollmentsService` into `LessonsController` constructor: `constructor(private readonly coursesService: CoursesService, private readonly enrollmentsService: EnrollmentsService) {}`
- Extract user role from `req.user`: cast as `{ id: string; role: UserRole }` (the JWT payload includes `role`).
- Role-based access logic in the controller method:
  - `UserRole.Admin` → no further check, call `coursesService.findLessonWithContent(courseId, moduleId, lessonId)`
  - `UserRole.Instructor` → verify `course.instructorId === userId` (load course via `findOneOrFail`)
  - `UserRole.Student` → verify `enrollmentsService.isEnrolled(userId, courseId)`
  - Throw `ForbiddenException` on any failure

### Enrollment Verification — `isEnrolled` Method (Task 2)

Add to `EnrollmentsService` — see Task 2 for implementation. Uses `count()` instead of `findOne()` for efficiency (returns number, not entity). Used by both `ProgressService` (enrollment check before progress operations) and `LessonsController` (enrollment check before lesson content access).

### Circular Dependency: CoursesModule <-> EnrollmentsModule (Task 4.4)

Adding the lesson GET endpoint to `LessonsController` requires `EnrollmentsService`, but `EnrollmentsModule` already imports `CoursesModule`. This creates a circular dependency.

**Resolution — `forwardRef` in both modules:**

```typescript
// courses.module.ts — change imports to:
imports: [TypeOrmModule.forFeature([Course, CourseModule, Lesson]), forwardRef(() => EnrollmentsModule)]

// enrollments.module.ts — change imports to:
imports: [TypeOrmModule.forFeature([Enrollment]), forwardRef(() => CoursesModule)]
```

Add `forwardRef` import: `import { Module, forwardRef } from '@nestjs/common'` in both module files. In `LessonsController`, update the constructor to inject `EnrollmentsService` via `@Inject(forwardRef(() => EnrollmentsService)) private readonly enrollmentsService: EnrollmentsService` — this requires adding `Inject` and `forwardRef` to the controller's `@nestjs/common` import statement (see Task 4.5).

### API Response Shapes

**GET /api/courses/:courseId/modules/:moduleId/lessons/:lessonId (AC #1):**
```typescript
{
  id: string;          // UUID
  title: string;
  content: string;     // markdown text
  orderIndex: number;
  moduleId: string;
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

**POST /api/progress/courses/:courseId/lessons/:lessonId/complete (AC #3, #4):**
```typescript
{
  totalLessons: number;
  completedLessons: number;
  percentage: number;         // 0-100, integer
  completedLessonIds: string[]; // array of lesson UUIDs
}
```

**GET /api/progress/courses/:courseId (AC #5):**
```typescript
{
  totalLessons: number;
  completedLessons: number;
  percentage: number;         // 0-100, integer
  completedLessonIds: string[]; // array of lesson UUIDs
}
```

### Idempotent Completion (AC #4)

When `POST .../complete` is called for an already-completed lesson:
- Check if `LessonProgress` exists for `(userId, lessonId)`
- If exists: skip insert, return current progress summary
- If not: create record, return updated progress summary
- Do NOT throw an error for duplicate completion — this must be idempotent for optimistic UI support

### Progress Calculation Detail (AC #7)

```typescript
import { In } from 'typeorm'; // Required for In() operator

// Total lessons: findOneWithDetails strips content (fine — we only need IDs)
const course = await this.coursesService.findOneWithDetails(courseId);
const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
const totalLessons = allLessonIds.length;

// Completed lessons for this user in this course
const completedRecords = await this.lessonProgressRepository.find({
  where: { userId, lessonId: In(allLessonIds) },
});
const completedLessons = completedRecords.length;
const completedLessonIds = completedRecords.map(r => r.lessonId);

// Edge case: 0 total lessons returns 0%
const percentage = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
```

**Warning:** If `allLessonIds` is empty, `In([])` can behave unexpectedly in some ORMs. Guard with an early return: if `totalLessons === 0`, return `{ totalLessons: 0, completedLessons: 0, percentage: 0, completedLessonIds: [] }` before querying LessonProgress.

### Files to Create

```
backend/src/progress/progress.module.ts
backend/src/progress/progress.controller.ts
backend/src/progress/progress.service.ts
backend/src/progress/lesson-progress.entity.ts
```

### Files to Modify

```
backend/src/enrollments/enrollments.service.ts  # Task 2: Add isEnrolled(userId, courseId) method
backend/src/courses/courses.service.ts          # Task 4.2: Add findLessonWithContent() method
backend/src/courses/lessons.controller.ts       # Task 4.1: Add GET :lessonId endpoint, inject EnrollmentsService, add Get import
backend/src/courses/courses.module.ts           # Task 4.4: Add forwardRef(() => EnrollmentsModule) to imports
backend/src/enrollments/enrollments.module.ts   # Task 4.4: Change CoursesModule import to forwardRef(() => CoursesModule)
backend/src/app.module.ts                       # Task 5: Add ProgressModule import
```

### What NOT To Do

- Do NOT create frontend code — this is a backend-only story
- Do NOT create seed data — that's Epic 6
- Do NOT modify the existing instructor CRUD endpoints (Post, Patch, Delete) in LessonsController — only add the new GET method
- Do NOT change the class-level `@Roles(UserRole.Instructor)` on LessonsController — override it at method level on the new GET endpoint only
- Do NOT add a separate controller for the student lesson GET — add it to the existing LessonsController
- Do NOT use `findOneWithDetails` to get lesson content — it mutates entities by deleting the `content` property. Create a new `findLessonWithContent` method instead.
- Do NOT use `@nestjs/passport` for enrollment checks — use service-level checks with ForbiddenException
- Do NOT add pagination to progress endpoints — dataset is small (max ~15 lessons per course)
- Do NOT add a `course_id` column to `lesson_progress` entity — the lesson-module-course relationship already provides this. Progress query uses lesson IDs derived from the course hierarchy.
- Do NOT modify the enrollment entity or enrollments controller
- Do NOT import `UsersModule` into `ProgressModule` — TypeORM entity references (`() => User`) resolve via `autoLoadEntities: true`
- Do NOT add WebSocket notifications for progress updates
- Do NOT implement refresh tokens or any auth changes
- Do NOT create DTO classes for the progress response — return plain objects. If you add DTOs for Swagger docs, keep them minimal.
- Do NOT install any new npm packages — all needed packages (TypeORM, NestJS, class-validator) are already available

### Previous Story Intelligence (from Stories 3-1, 3-2)

**Story 3-1 (Course Catalog & Enrollment API) — Completed:**
- Enrollment entity, service, module, controller all working
- `EnrollmentsService.findMyEnrollments(userId)` loads course+instructor relations
- `EnrollmentsModule` exports `EnrollmentsService` — ready for cross-module injection
- `CoursesService.findOneWithDetails(id)` strips lesson content from response
- Review finding: `findAll()` had a bug where modules array leaked — fixed by destructuring

**Story 3-2 (Course Discovery & Enrollment UI) — Completed:**
- Frontend expects these exact response shapes — do not deviate
- "Continue Learning" navigates to `/courses/${courseId}/lessons/${firstLessonId}` — the lesson content endpoint must work at this URL pattern
- Review findings: error handling patterns were tightened (retry buttons, explicit toast.error)
- CourseCard enrolled variant currently shows `enrolledAt` in footer — progress bar deferred to Story 4-2

**Patterns established across all backend stories:**
- Named Logger: `private readonly logger = new Logger(ProgressService.name);`
- Injectable services with `@InjectRepository` for TypeORM repos
- `ParseUUIDPipe` on all UUID route params
- Swagger decorators on every endpoint
- Consistent error responses via global `HttpExceptionFilter`
- `Request` imported as type: `import type { Request } from 'express';`

### Project Structure Notes

- Alignment with architecture: `backend/src/progress/` as a new NestJS module per the architecture doc's 5-module design (auth, users, courses, enrollments, progress)
- The lesson GET endpoint at `courses/:courseId/modules/:moduleId/lessons/:lessonId` is added to the existing `LessonsController` — this follows the established URL hierarchy
- `ProgressController` at `/api/progress/` for progress-specific endpoints
- No new folders needed outside of `backend/src/progress/`

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.1 Acceptance Criteria, lines 563-597]
- [Source: _bmad-output/planning-artifacts/architecture.md — Progress module: src/progress/, progress.module.ts, progress.controller.ts, progress.service.ts, lesson-progress.entity.ts]
- [Source: _bmad-output/planning-artifacts/architecture.md — "Progress service injects Courses service to query lesson counts"]
- [Source: _bmad-output/planning-artifacts/architecture.md — Data model: 6 entities including Progress (LessonProgress)]
- [Source: _bmad-output/planning-artifacts/architecture.md — DB table: lesson_progress with user_id FK, lesson_id FK]
- [Source: _bmad-output/planning-artifacts/architecture.md — API endpoints: /api/ prefix, JSON responses, Swagger decorators]
- [Source: _bmad-output/planning-artifacts/architecture.md — SnakeNamingStrategy configured globally]
- [Source: _bmad-output/planning-artifacts/architecture.md — Backend module boundaries: cross-module communication via injected services]
- [Source: _bmad-output/planning-artifacts/prd.md — FR20-23: Lesson reading, completion marking, progress viewing, calculation]
- [Source: _bmad-output/planning-artifacts/prd.md — NFR3: Role-based guards enforce access control on every protected route]
- [Source: _bmad-output/implementation-artifacts/3-1-course-catalog-enrollment-api.md — API patterns, enrollment service patterns]
- [Source: _bmad-output/implementation-artifacts/3-2-course-discovery-enrollment-ui.md — Frontend expects specific response shapes]
- [Source: backend/src/enrollments/enrollments.service.ts — findMyEnrollments pattern]
- [Source: backend/src/enrollments/enrollments.module.ts — exports EnrollmentsService]
- [Source: backend/src/courses/courses.module.ts — exports CoursesService]
- [Source: backend/src/courses/courses.service.ts — findOneWithDetails, findOneOrFail patterns]
- [Source: backend/src/courses/lessons.controller.ts — existing instructor CRUD pattern]
- [Source: backend/src/app.module.ts — module registration pattern]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fixed existing `lessons.controller.spec.ts` to add `EnrollmentsService` mock after Task 4 introduced circular dependency injection.
- Used `forwardRef` in both `CoursesModule` and `EnrollmentsModule` to resolve circular dependency.

### Completion Notes List

- **Task 1:** Created `LessonProgress` entity at `backend/src/progress/lesson-progress.entity.ts` with UUID PK, userId, lessonId columns, ManyToOne relations to User and Lesson with CASCADE delete, and `@Unique(['userId', 'lessonId'])` constraint. Entity table name explicitly set to `lesson_progress`.
- **Task 2:** Added `isEnrolled(userId, courseId)` method to `EnrollmentsService` using `count()` for efficiency. Used by both `ProgressService` and `LessonsController`.
- **Task 3:** Created `ProgressModule`, `ProgressService`, `ProgressController`. `ProgressService.markComplete` is idempotent (skips insert if progress record exists). `ProgressService.getProgress` guards against empty lesson list (returns 0% immediately). Both methods verify enrollment first. Progress calculation uses `In()` operator from typeorm. All endpoints decorated with Swagger. `POST .../complete` uses `@HttpCode(200)`.
- **Task 4:** Added `findLessonWithContent(courseId, moduleId, lessonId)` to `CoursesService` (does NOT strip content). Added `GET :lessonId` to `LessonsController` with role-based access: Admin (unrestricted), Instructor (must own course), Student (must be enrolled). Resolved circular dependency between `CoursesModule` and `EnrollmentsModule` using `forwardRef`.
- **Task 5:** Registered `ProgressModule` in `AppModule` after `EnrollmentsModule`.
- **Task 6:** `npm run build` compiles cleanly. All 106 tests pass across 12 test suites including new `progress.service.spec.ts` (10 tests) and `progress.controller.spec.ts` (4 tests), plus updated `lessons.controller.spec.ts` (now 14 tests including 6 for the new GET endpoint).

### File List

backend/src/progress/lesson-progress.entity.ts (new)
backend/src/progress/progress.service.ts (new)
backend/src/progress/progress.controller.ts (new)
backend/src/progress/progress.module.ts (new)
backend/src/progress/progress.service.spec.ts (new)
backend/src/progress/progress.controller.spec.ts (new)
backend/src/enrollments/enrollments.service.ts (modified — added isEnrolled method)
backend/src/enrollments/enrollments.module.ts (modified — forwardRef for CoursesModule)
backend/src/courses/courses.service.ts (modified — added findLessonWithContent method)
backend/src/courses/courses.module.ts (modified — forwardRef for EnrollmentsModule)
backend/src/courses/lessons.controller.ts (modified — added GET :lessonId endpoint, EnrollmentsService injection)
backend/src/courses/lessons.controller.spec.ts (modified — updated to mock EnrollmentsService, added GET tests)
backend/src/app.module.ts (modified — added ProgressModule import)

### Review Findings

- [x] [Review][Patch] Race condition in `markComplete` — concurrent requests can both pass `findOne` check and attempt insert, causing unhandled unique constraint violation (500). Fix: add try/catch for PostgreSQL error 23505, matching the pattern in `enrollments.service.ts`. Also add test for this scenario. [progress.service.ts:49-55] — FIXED
- [x] [Review][Patch] Missing return value assertion in idempotency test — test verifies `create`/`save` not called but doesn't assert the returned `ProgressSummary`. [progress.service.spec.ts:115-134] — FIXED
- [x] [Review][Patch] Missing `@ApiResponse` 404 on `getProgress` endpoint — `findOneWithDetails` can throw `NotFoundException` but Swagger docs don't document it. [progress.controller.ts:50-61] — FIXED
- [x] [Review][Defer] `forwardRef` circular dependency between CoursesModule and EnrollmentsModule — design smell, pre-existing architectural decision. Not actionable in this story.
- [x] [Review][Defer] No rate limiting on `markComplete` endpoint — platform-wide concern, not story-specific. Deferred to infrastructure story.

## Change Log

- 2026-03-25: Implemented Story 4.1 — Progress Tracking API. Created LessonProgress entity, ProgressModule/Service/Controller, isEnrolled method, lesson content endpoint, forwardRef circular dependency fix. Build clean, 106 tests pass.

# Story 2.2: Module & Lesson CRUD API & Entities

Status: done

## Story

As an **instructor**,
I want to add, edit, and delete modules and lessons within my courses,
So that I can structure course content with markdown lessons.

## Acceptance Criteria

1. `POST /api/courses/:courseId/modules` with `{ title, orderIndex }` creates a module under the course. Response: module object with `{ id, title, orderIndex, courseId, createdAt, updatedAt }`.
2. `PATCH /api/courses/:courseId/modules/:moduleId` with updated title or orderIndex updates the module. Response: updated module object.
3. `DELETE /api/courses/:courseId/modules/:moduleId` deletes the module and all its lessons (database-level cascade). Response: `{ message: 'Module deleted' }`.
4. `POST /api/courses/:courseId/modules/:moduleId/lessons` with `{ title, content, orderIndex }` creates a lesson with markdown content. Response: lesson object.
5. `PATCH /api/courses/:courseId/modules/:moduleId/lessons/:lessonId` with updated fields updates the lesson. Response: updated lesson object.
6. `DELETE /api/courses/:courseId/modules/:moduleId/lessons/:lessonId` deletes the lesson. Response: `{ message: 'Lesson deleted' }`.
7. All module and lesson endpoints require `@Roles(UserRole.Instructor)` — returns 403 for non-instructors.
8. An instructor who does NOT own the course gets 403 Forbidden on any module or lesson operation.
9. CourseModule entity: `course_modules` table with `id` (UUID PK), `title`, `order_index` (integer), `course_id` (FK to courses), `created_at`, `updated_at` — ManyToOne to Course.
10. Lesson entity: `lessons` table with `id` (UUID PK), `title`, `content` (text, markdown), `order_index` (integer), `module_id` (FK to course_modules), `created_at`, `updated_at` — ManyToOne to CourseModule.
11. Course entity updated with `@OneToMany(() => CourseModule)` relation. Deleting a course cascades to modules and lessons at the database level.
12. Requests with invalid/missing data return 400 with validation errors. Invalid UUID path params return 400 via `ParseUUIDPipe`.
13. All endpoints have Swagger decorators (`@ApiTags`, `@ApiCookieAuth`, `@ApiResponse`, `@ApiParam`).
14. `GET /api/courses/:courseId/modules` returns all modules for the course, ordered by `orderIndex`, each with nested lessons ordered by `orderIndex`. Accessible by any authenticated instructor who owns the course.

## Tasks / Subtasks

- [x] Task 1: Create CourseModule entity (AC: #9, #11)
  - [x] Create `backend/src/courses/course-module.entity.ts`
  - [x] Columns: id (UUID PK), title (string), orderIndex (integer), courseId (string), createdAt, updatedAt
  - [x] `@ManyToOne(() => Course, (course) => course.modules, { onDelete: 'CASCADE' })` with `@JoinColumn({ name: 'course_id' })`
  - [x] `@OneToMany(() => Lesson, (lesson) => lesson.module)` relation for lesson access

- [x] Task 2: Create Lesson entity (AC: #10)
  - [x] Create `backend/src/courses/lesson.entity.ts`
  - [x] Columns: id (UUID PK), title (string), content (text), orderIndex (integer), moduleId (string), createdAt, updatedAt
  - [x] `@ManyToOne(() => CourseModule, (module) => module.lessons, { onDelete: 'CASCADE' })` with `@JoinColumn({ name: 'module_id' })`

- [x] Task 3: Update Course entity (AC: #11)
  - [x] Add `OneToMany` to the existing typeorm import: `import { ..., OneToMany } from 'typeorm';`
  - [x] Add `import { CourseModule } from './course-module.entity';`
  - [x] Add `@OneToMany(() => CourseModule, (module) => module.course) modules!: CourseModule[];` property

- [x] Task 4: Create DTOs (AC: #1, #4, #12)
  - [x] Create `backend/src/courses/dto/create-module.dto.ts` — title (string, required, max 255), orderIndex (integer, required, min 0)
  - [x] Create `backend/src/courses/dto/update-module.dto.ts` — `PartialType(CreateModuleDto)` from `@nestjs/swagger`
  - [x] Create `backend/src/courses/dto/create-lesson.dto.ts` — title (string, required, max 255), content (string, required, max 50000), orderIndex (integer, required, min 0)
  - [x] Create `backend/src/courses/dto/update-lesson.dto.ts` — `PartialType(CreateLessonDto)` from `@nestjs/swagger`

- [x] Task 5: Extend CoursesService with module methods (AC: #1, #2, #3, #8, #14)
  - [x] Inject `Repository<CourseModule>` via `@InjectRepository(CourseModule)`
  - [x] `createModule(courseId, instructorId, dto)` — verify ownership → create module
  - [x] `findModulesByCourse(courseId, instructorId)` — verify ownership → return modules with lessons, ordered by orderIndex
  - [x] `updateModule(courseId, moduleId, instructorId, dto)` — verify ownership → verify module belongs to course → update
  - [x] `removeModule(courseId, moduleId, instructorId)` — verify ownership → verify module belongs to course → delete (lessons cascade via DB)

- [x] Task 6: Extend CoursesService with lesson methods (AC: #4, #5, #6, #8)
  - [x] Inject `Repository<Lesson>` via `@InjectRepository(Lesson)`
  - [x] `createLesson(courseId, moduleId, instructorId, dto)` — verify ownership → verify module belongs to course → create lesson
  - [x] `updateLesson(courseId, moduleId, lessonId, instructorId, dto)` — verify ownership → verify module → verify lesson belongs to module → update
  - [x] `removeLesson(courseId, moduleId, lessonId, instructorId)` — verify ownership → verify module → verify lesson → delete

- [x] Task 7: Create ModulesController (AC: #1, #2, #3, #7, #8, #13, #14)
  - [x] Create `backend/src/courses/modules.controller.ts`
  - [x] `@Controller('courses/:courseId/modules')` with `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.Instructor)` at class level
  - [x] `GET /` — list modules with lessons for course
  - [x] `POST /` — create module
  - [x] `PATCH /:moduleId` — update module
  - [x] `DELETE /:moduleId` — delete module
  - [x] `ParseUUIDPipe` on all UUID path params (courseId, moduleId)
  - [x] Full Swagger decorators on each endpoint

- [x] Task 8: Create LessonsController (AC: #4, #5, #6, #7, #8, #13)
  - [x] Create `backend/src/courses/lessons.controller.ts`
  - [x] `@Controller('courses/:courseId/modules/:moduleId/lessons')` with guards + roles at class level
  - [x] `POST /` — create lesson
  - [x] `PATCH /:lessonId` — update lesson
  - [x] `DELETE /:lessonId` — delete lesson
  - [x] `ParseUUIDPipe` on all UUID path params (courseId, moduleId, lessonId)
  - [x] Full Swagger decorators on each endpoint

- [x] Task 9: Update CoursesModule registration (AC: all)
  - [x] Add `CourseModule` and `Lesson` to `TypeOrmModule.forFeature([Course, CourseModule, Lesson])`
  - [x] Add `ModulesController` and `LessonsController` to `controllers` array
  - [x] Export `CoursesService` for future use by enrollments/progress modules

- [x] Task 10: Verify (AC: all)
  - [x] Run `npm run build` in backend — must compile cleanly
  - [x] Run `npm run lint` — must pass
  - [x] Verify Swagger docs at `/api/docs` show module and lesson endpoints
  - [x] Test: create module as course owner → 201
  - [x] Test: create lesson as course owner → 201
  - [x] Test: list modules with nested lessons → 200
  - [x] Test: update module/lesson → 200
  - [x] Test: delete module (cascades lessons) → 200
  - [x] Test: delete course (cascades to modules and lessons) → 200
  - [x] Test: delete lesson → 200
  - [x] Test: non-owner instructor → 403
  - [x] Test: non-instructor role → 403
  - [x] Test: invalid UUID param → 400
  - [x] Test: invalid body → 400

## Dev Notes

### Critical: What Exists Already — USE, DO NOT RECREATE

**Auth guards and decorators (Story 1.2):**
- `JwtAuthGuard` at `src/auth/guards/jwt-auth.guard.ts`
- `RolesGuard` at `src/auth/guards/roles.guard.ts`
- `@Roles()` decorator at `src/auth/decorators/roles.decorator.ts`
- Usage: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.Instructor)` at class level

**User entity and enum (Story 1.1):**
- `UserRole` enum at `src/users/user.entity.ts` — values: `Student`, `Instructor`, `Admin`
- `req.user` shape: `{ id: string; name: string; email: string; role: UserRole }`

**CoursesService ownership check (Story 2.1):**
- `findOneOrFail(id)` — returns course or throws NotFoundException
- Reuse this for ownership verification: `const course = await this.findOneOrFail(courseId); if (course.instructorId !== instructorId) throw new ForbiddenException('Not your course');`

**Global configurations (Story 1.1, main.ts):**
- `ValidationPipe({ whitelist: true, transform: true })` — global, do NOT add per-endpoint
- `HttpExceptionFilter` — normalizes all errors to `{ statusCode, message, error }`
- Global prefix: `'api'` — routes auto-prefixed
- Swagger: configured with cookie auth `access_token`, docs at `/api/docs`

**TypeORM setup (app.module.ts):**
- `autoLoadEntities: true` — entities auto-discovered from `forFeature()` imports
- `synchronize: true` — tables auto-created
- `SnakeNamingStrategy` — `camelCase` → `snake_case` columns automatically
- **TypeORM version: 0.3.x** (`^0.3.28`) — use 0.3.x API patterns, NOT 0.4.x

### CourseModule Entity Design

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Course } from './course.entity';
// Use forward reference for Lesson to avoid circular import issues
import { Lesson } from './lesson.entity';

@Entity('course_modules')
export class CourseModule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'int' })
  orderIndex!: number;

  @Column()
  courseId!: string;

  @ManyToOne(() => Course, (course) => course.modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course!: Course;

  @OneToMany(() => Lesson, (lesson) => lesson.module)
  lessons!: Lesson[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

**Important:** The entity class is named `CourseModule` (not `Module`) to avoid collision with NestJS `@Module()` decorator. The table is `course_modules`. SnakeNamingStrategy converts `orderIndex` → `order_index` and `courseId` → `course_id` columns automatically.

### Lesson Entity Design

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { CourseModule } from './course-module.entity';

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'int' })
  orderIndex!: number;

  @Column()
  moduleId!: string;

  @ManyToOne(() => CourseModule, (module) => module.lessons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module!: CourseModule;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

### Course Entity Update (add OneToMany)

Add this to the existing `course.entity.ts`:

```typescript
import { CourseModule } from './course-module.entity';

// Add inside the Course class:
@OneToMany(() => CourseModule, (module) => module.course)
modules!: CourseModule[];
```

**No `cascade: true` on OneToMany** — cascade delete is handled at the database level via `onDelete: 'CASCADE'` on the child's ManyToOne. This is the correct TypeORM 0.3.x pattern. TypeORM's `cascade` option is for insert/update propagation, NOT delete.

### DTO Patterns (match Story 2.1 conventions)

**CreateModuleDto:**
```typescript
import { IsString, IsNotEmpty, MaxLength, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateModuleDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsInt()
  @Min(0)
  orderIndex!: number;
}
```

**CreateLessonDto:**
```typescript
import { IsString, IsNotEmpty, MaxLength, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateLessonDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  content!: string;

  @IsInt()
  @Min(0)
  orderIndex!: number;
}
```

**Update DTOs — use PartialType from `@nestjs/swagger`** (NOT `@nestjs/mapped-types`):
```typescript
import { PartialType } from '@nestjs/swagger';
```

### Controller Patterns

**ModulesController — nested under courses:**
```typescript
@ApiTags('modules')
@ApiCookieAuth('access_token')
@Controller('courses/:courseId/modules')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Instructor)
export class ModulesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  create(
    @Req() req: Request,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Body() dto: CreateModuleDto,
  ) {
    const instructorId = (req.user as { id: string }).id;
    return this.coursesService.createModule(courseId, instructorId, dto);
  }
  // ... other endpoints follow same pattern
}
```

**LessonsController — deeply nested:**
```typescript
@ApiTags('lessons')
@ApiCookieAuth('access_token')
@Controller('courses/:courseId/modules/:moduleId/lessons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Instructor)
export class LessonsController {
  constructor(private readonly coursesService: CoursesService) {}
  // ... endpoints extract courseId, moduleId, lessonId from params
}
```

**Critical: All path params need `ParseUUIDPipe`** — courseId, moduleId, and lessonId. This validates UUID format and returns 400 for invalid values.

**Add `@ApiParam` for each nested path param** — Swagger does not auto-document params from the `@Controller()` path. Every handler must have `@ApiParam({ name: 'courseId', description: 'Course UUID' })` and similarly for `moduleId`, `lessonId`.

**Add `@HttpCode(HttpStatus.OK)` on DELETE handlers** — matches Story 2.1 pattern. Import `HttpCode, HttpStatus` from `@nestjs/common`.

**Extract instructor ID from request:** `(req.user as { id: string }).id` — same pattern as CoursesController.

**Import `Request` from express:** `import type { Request } from 'express';`

### Service Pattern — Ownership + Parent Verification Chain

All module/lesson operations follow this pattern:
1. Load course via `findOneOrFail(courseId)`
2. Verify `course.instructorId === instructorId` → 403 if not
3. For module ops: find module, verify `module.courseId === courseId` → 404 if not
4. For lesson ops: also verify `lesson.moduleId === moduleId` → 404 if not

```typescript
// Helper for ownership check — reuse across all module/lesson methods
private async verifyCourseOwnership(courseId: string, instructorId: string): Promise<Course> {
  const course = await this.findOneOrFail(courseId);
  if (course.instructorId !== instructorId) {
    throw new ForbiddenException('Not your course');
  }
  return course;
}
```

**Update pattern (match Story 2.1):** Use `Object.assign(entity, dto)` + `repository.save(entity)` to return the updated entity. Do NOT use `repository.update()` which returns `UpdateResult` instead of the entity:
```typescript
async updateModule(courseId: string, moduleId: string, instructorId: string, dto: UpdateModuleDto): Promise<CourseModule> {
  await this.verifyCourseOwnership(courseId, instructorId);
  const module = await this.courseModulesRepository.findOne({ where: { id: moduleId, courseId } });
  if (!module) throw new NotFoundException('Module not found');
  Object.assign(module, dto);
  return this.courseModulesRepository.save(module);
}
```

**Empty result:** `findModulesByCourse` returns `[]` (empty array) if the course has no modules. This is correct — do NOT throw 404 for empty results.

**Module not found:** Throw `NotFoundException('Module not found')`.
**Lesson not found:** Throw `NotFoundException('Lesson not found')`.
**Module doesn't belong to course:** Throw `NotFoundException('Module not found')` (do not reveal existence to non-owners).
**Lesson doesn't belong to module:** Throw `NotFoundException('Lesson not found')`.

### Endpoint Specifications

**Module Endpoints:**

| Method | Route | Body | Response | Status |
|--------|-------|------|----------|--------|
| GET | `/api/courses/:courseId/modules` | — | CourseModule[] (with nested lessons) | 200 |
| POST | `/api/courses/:courseId/modules` | `{ title, orderIndex }` | CourseModule object | 201 |
| PATCH | `/api/courses/:courseId/modules/:moduleId` | `{ title?, orderIndex? }` | Updated CourseModule | 200 |
| DELETE | `/api/courses/:courseId/modules/:moduleId` | — | `{ message: "Module deleted" }` | 200 |

**Lesson Endpoints:**

| Method | Route | Body | Response | Status |
|--------|-------|------|----------|--------|
| POST | `/api/courses/:courseId/modules/:moduleId/lessons` | `{ title, content, orderIndex }` | Lesson object | 201 |
| PATCH | `/api/courses/:courseId/modules/:moduleId/lessons/:lessonId` | `{ title?, content?, orderIndex? }` | Updated Lesson | 200 |
| DELETE | `/api/courses/:courseId/modules/:moduleId/lessons/:lessonId` | — | `{ message: "Lesson deleted" }` | 200 |

**Error responses (handled by global filters and guards):**
- 400: Validation error (`class-validator`) or invalid UUID (`ParseUUIDPipe`)
- 401: No auth cookie / invalid JWT (`JwtAuthGuard`)
- 403: Wrong role (`RolesGuard`) or not course owner (service logic)
- 404: Course/module/lesson not found (`NotFoundException`)

### GET Modules Query Pattern

Return modules with nested lessons, both ordered by `orderIndex`:

```typescript
async findModulesByCourse(courseId: string, instructorId: string): Promise<CourseModule[]> {
  await this.verifyCourseOwnership(courseId, instructorId);
  return this.courseModulesRepository.find({
    where: { courseId },
    relations: ['lessons'],
    order: { orderIndex: 'ASC', lessons: { orderIndex: 'ASC' } },
  });
}
```

### CoursesModule Registration Update

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Course, CourseModule, Lesson])],
  controllers: [CoursesController, ModulesController, LessonsController],
  providers: [CoursesService],
  exports: [CoursesService], // Export for future enrollments/progress modules
})
export class CoursesModule {}
```

### What NOT To Do

**Dependencies:**
- Do NOT install any new npm packages — everything needed is already installed
- Do NOT upgrade TypeORM — stay on 0.3.x

**Patterns:**
- Do NOT create new guards or decorators — reuse existing JwtAuthGuard, RolesGuard, @Roles
- Do NOT add ValidationPipe per endpoint — it's global
- Do NOT use `cascade: true` on OneToMany for delete — use `onDelete: 'CASCADE'` on child's ManyToOne
- Do NOT use `eager: true` on relations — load explicitly via `relations: [...]` option
- Do NOT manually set column names via `@Column({ name: 'order_index' })` — SnakeNamingStrategy handles it
- Do NOT use string literals for roles — use `UserRole.Instructor` enum
- Do NOT import `PartialType` from `@nestjs/mapped-types` — import from `@nestjs/swagger`
- Do NOT use `Repository.findOneBy()` alone — use `findOne({ where: {...} })` with null check

**Scope boundaries:**
- Do NOT create public endpoints like `GET /api/courses` or `GET /api/courses/:id` — that's Story 3.1
- Do NOT add enrollment logic — that's Epic 3
- Do NOT add progress tracking — that's Epic 4
- Do NOT add frontend pages or components — Stories 2.3 and 2.4
- Do NOT modify `app.module.ts` — only modify `courses.module.ts`
- Do NOT add seed data — that's Epic 6

### Previous Story Intelligence (from Story 2.1)

**Patterns that worked:**
- Controller-level `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.Instructor)` — clean, no per-endpoint duplication
- `findOneOrFail` pattern for 404 handling — reuse for modules and lessons
- `ParseUUIDPipe` on path params — catches malformed UUIDs before service logic
- `@HttpCode(HttpStatus.OK)` on DELETE to override NestJS's default 200 (DELETE already defaults to 200, but explicit is clearer)
- Unit tests: mock repository with `createMockRepository()` pattern

**Learnings to apply:**
- SnakeNamingStrategy auto-converts property names — do NOT manually set column names
- `@JoinColumn({ name: 'xxx' })` only on the relation decorator, NOT on `@Column()`
- Import `type { Request }` from express (type-only import)
- Swagger decorators: `@ApiTags`, `@ApiCookieAuth('access_token')`, `@ApiOperation`, `@ApiResponse`, `@ApiParam`
- Return `{ message: '...' }` from DELETE endpoints
- Tests: `/* eslint-disable @typescript-eslint/no-unsafe-assignment */` needed for mock objects with `as any`

**Review findings from 2.1 to NOT repeat:**
- Missing `@ApiProperty` on DTOs — known deferred issue, not required for this story either (matches existing pattern)

### Project Structure Notes

**Files to create:**
```
backend/src/courses/
  course-module.entity.ts     # CourseModule entity (ManyToOne Course, OneToMany Lesson)
  lesson.entity.ts            # Lesson entity (ManyToOne CourseModule)
  modules.controller.ts       # Module CRUD endpoints (nested under courses)
  lessons.controller.ts       # Lesson CRUD endpoints (nested under modules)
  dto/
    create-module.dto.ts      # title + orderIndex validation
    update-module.dto.ts      # PartialType of CreateModuleDto
    create-lesson.dto.ts      # title + content + orderIndex validation
    update-lesson.dto.ts      # PartialType of CreateLessonDto
```

**Files to modify:**
```
backend/src/courses/course.entity.ts    # Add @OneToMany(() => CourseModule) relation
backend/src/courses/courses.service.ts  # Add module/lesson CRUD methods + repository injections
backend/src/courses/courses.module.ts   # Register new entities, controllers, export service
```

**No files outside `backend/src/courses/`** are modified. No changes to `app.module.ts`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 2.2 Acceptance Criteria, lines 367-409]
- [Source: _bmad-output/planning-artifacts/architecture.md — Project Structure: course-module.entity.ts, lesson.entity.ts locations]
- [Source: _bmad-output/planning-artifacts/architecture.md — Backend Naming: snake_case tables (course_modules, lessons), camelCase properties]
- [Source: _bmad-output/planning-artifacts/architecture.md — TypeORM Data Mapper pattern, SnakeNamingStrategy]
- [Source: _bmad-output/planning-artifacts/architecture.md — API Response Patterns: direct data, consistent error format]
- [Source: _bmad-output/planning-artifacts/prd.md — FR11-FR14 (Module & Lesson CRUD)]
- [Source: _bmad-output/implementation-artifacts/2-1-course-crud-api-entities.md — Story 2.1 patterns, dev notes, review findings]
- [Source: backend/src/courses/course.entity.ts — Current Course entity (no OneToMany yet)]
- [Source: backend/src/courses/courses.service.ts — Current service with findOneOrFail ownership check pattern]
- [Source: backend/src/courses/courses.module.ts — Current module registration pattern]
- [Source: backend/package.json — TypeORM ^0.3.28, NestJS ^11.0.1, @nestjs/swagger ^11.2.6]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No blockers encountered. Build, lint, and all 88 tests passed on first attempt.

### Completion Notes List

- Created `CourseModule` entity (`course_modules` table) with ManyToOne→Course (CASCADE), OneToMany→Lesson. SnakeNamingStrategy handles `order_index`/`course_id` column names automatically.
- Created `Lesson` entity (`lessons` table) with ManyToOne→CourseModule (CASCADE). `content` is `text` type for markdown.
- Updated `Course` entity with `@OneToMany(() => CourseModule)` relation and `OneToMany` TypeORM import.
- Created 4 DTOs: `CreateModuleDto`, `UpdateModuleDto` (PartialType), `CreateLessonDto`, `UpdateLessonDto` (PartialType). `PartialType` imported from `@nestjs/swagger` per convention.
- Extended `CoursesService` with private `verifyCourseOwnership` helper and 7 new methods: `createModule`, `findModulesByCourse`, `updateModule`, `removeModule`, `createLesson`, `updateLesson`, `removeLesson`. Object.assign + save pattern used for updates (returns entity, not UpdateResult).
- Created `ModulesController` at `courses/:courseId/modules` — GET (list), POST (create), PATCH/:moduleId (update), DELETE/:moduleId (delete). Full Swagger decorators + ParseUUIDPipe on all UUID params.
- Created `LessonsController` at `courses/:courseId/modules/:moduleId/lessons` — POST, PATCH/:lessonId, DELETE/:lessonId. Full Swagger decorators + ParseUUIDPipe on all UUID params.
- Updated `CoursesModule`: registered `CourseModule` and `Lesson` entities, added both new controllers, exported `CoursesService`.
- Added tests: updated `courses.service.spec.ts` (88 total tests), created `modules.controller.spec.ts` and `lessons.controller.spec.ts`.

### File List

**Created:**
- `backend/src/courses/course-module.entity.ts`
- `backend/src/courses/lesson.entity.ts`
- `backend/src/courses/modules.controller.ts`
- `backend/src/courses/lessons.controller.ts`
- `backend/src/courses/dto/create-module.dto.ts`
- `backend/src/courses/dto/update-module.dto.ts`
- `backend/src/courses/dto/create-lesson.dto.ts`
- `backend/src/courses/dto/update-lesson.dto.ts`
- `backend/src/courses/modules.controller.spec.ts`
- `backend/src/courses/lessons.controller.spec.ts`

**Modified:**
- `backend/src/courses/course.entity.ts`
- `backend/src/courses/courses.service.ts`
- `backend/src/courses/courses.service.spec.ts`
- `backend/src/courses/courses.module.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Review Findings

- [x] [Review][Patch] Missing @Max(2147483647) on orderIndex — values exceeding PostgreSQL int range cause unhandled 500 [create-module.dto.ts:13, create-lesson.dto.ts:19] — FIXED
- [x] [Review][Defer] TOCTOU race: module deleted between check and lesson insert produces 500 [courses.service.ts:144-150] — deferred, pre-existing architectural pattern (no transactions for simple CRUD)
- [x] [Review][Defer] TOCTOU race: course deleted between ownership check and module/lesson insert produces 500 [courses.service.ts:91-93] — deferred, pre-existing architectural pattern

## Change Log

- 2026-03-25: Implemented Story 2.2 — Module & Lesson CRUD API. Created CourseModule and Lesson entities, 4 DTOs, ModulesController and LessonsController with full Swagger docs, extended CoursesService with 7 new methods, updated CoursesModule registration. 10 new/modified files. 88 tests all passing. (claude-sonnet-4-6)

# Story 2.1: Course CRUD API & Entities

Status: done

## Story

As an **instructor**,
I want to create, view, edit, and delete my courses,
So that I can manage my course catalog.

## Acceptance Criteria

1. `POST /api/courses` with `{ title, description }` creates a course owned by the authenticated instructor. Response: `{ id, title, description, instructorId, createdAt, updatedAt }`.
2. `GET /api/courses/my` returns only courses owned by the authenticated instructor.
3. `PATCH /api/courses/:id` with updated fields updates the course if owned by the instructor. Response: updated course object.
4. `DELETE /api/courses/:id` deletes the course if owned by the instructor. Response: 200 with `{ message }`.
5. All course CRUD endpoints require `@Roles(UserRole.Instructor)` — returns 403 for non-instructors.
6. `PATCH` and `DELETE` on a course not owned by the instructor returns 403 Forbidden.
7. Requests with invalid/missing data return 400 with validation errors in consistent `{ statusCode, message, error }` format. Invalid UUID path params also return 400 (via `ParseUUIDPipe`).
8. Course entity: `courses` table with `id` (UUID PK), `title`, `description`, `instructor_id` (FK to users), `created_at`, `updated_at` — ManyToOne relation to User.
9. All endpoints have Swagger decorators (`@ApiTags`, `@ApiCookieAuth`, `@ApiResponse`, `@ApiParam`).
10. The existing `RolesGuard` and `@Roles()` decorator (from Story 1.2) are reused — NOT recreated — to restrict course endpoints to instructors.

## Tasks / Subtasks

- [x] Task 1: Create Course entity (AC: #8)
  - [x] Create `backend/src/courses/course.entity.ts`
  - [x] Define columns: id (UUID PK), title, description (text), instructorId (string), createdAt, updatedAt
  - [x] Define `@ManyToOne(() => User)` relation with `@JoinColumn({ name: 'instructor_id' })`
  - [x] Do NOT define OneToMany to CourseModule — that entity is created in Story 2.2

- [x] Task 2: Create DTOs (AC: #1, #7)
  - [x] Create `backend/src/courses/dto/create-course.dto.ts`
  - [x] Create `backend/src/courses/dto/update-course.dto.ts` using `PartialType(CreateCourseDto)`

- [x] Task 3: Create CoursesService (AC: #1, #2, #3, #4, #6)
  - [x] Create `backend/src/courses/courses.service.ts`
  - [x] Implement `create(instructorId, dto)`, `findByInstructor(instructorId)`, `findOne(id)`, `update(id, instructorId, dto)`, `remove(id, instructorId)`
  - [x] Ownership check: compare `course.instructorId === instructorId`, throw ForbiddenException if not owner

- [x] Task 4: Create CoursesController (AC: #1-#7, #9)
  - [x] Create `backend/src/courses/courses.controller.ts`
  - [x] All endpoints: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.Instructor)`
  - [x] `POST /courses` — create course
  - [x] `GET /courses/my` — list own courses
  - [x] `PATCH /courses/:id` — update own course
  - [x] `DELETE /courses/:id` — delete own course, return `{ message: 'Course deleted' }`
  - [x] Add `ParseUUIDPipe` to `:id` params on PATCH and DELETE
  - [x] Add Swagger decorators: `@ApiTags('courses')`, `@ApiCookieAuth('access_token')`, `@ApiResponse`, `@ApiParam` for each endpoint
  - [x] Extract instructor ID from `req.user.id`

- [x] Task 5: Create CoursesModule and register in AppModule (AC: all)
  - [x] Create `backend/src/courses/courses.module.ts`
  - [x] Import `TypeOrmModule.forFeature([Course])`
  - [x] Register CoursesModule in `backend/src/app.module.ts`

- [x] Task 6: Verify (AC: all)
  - [x] Run `npm run build` in backend — must compile cleanly
  - [x] Run `npm run lint` — must pass
  - [x] Verify Swagger docs at `/api/docs` show course endpoints
  - [x] Test: create course as instructor → 201
  - [x] Test: list own courses → returns only own
  - [x] Test: update own course → 200
  - [x] Test: delete own course → 200
  - [x] Test: non-instructor role → 403
  - [x] Test: non-owner instructor → 403
  - [x] Test: invalid body → 400 with validation errors

## Dev Notes

### Critical: What Exists Already (from Stories 1.1-1.4) — USE, DO NOT RECREATE

**Auth guards and decorators (Story 1.2):**
- `JwtAuthGuard` at `src/auth/guards/jwt-auth.guard.ts` — extends `AuthGuard('jwt')`
- `RolesGuard` at `src/auth/guards/roles.guard.ts` — reads `@Roles()` metadata, checks `request.user.role`
- `@Roles()` decorator at `src/auth/decorators/roles.decorator.ts` — accepts `UserRole` enum values
- Usage pattern: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.Instructor)` on controller or handler

**User entity (Story 1.1):**
- `User` at `src/users/user.entity.ts` — has `id` (UUID), `name`, `email`, `password` (select: false), `role` (UserRole enum), `createdAt`, `updatedAt`
- `UserRole` enum: `Student`, `Instructor`, `Admin`

**Request user shape (from JWT strategy):**
- `req.user` has `{ id, name, email, role }` — set by `JwtStrategy.validate()`
- Type it as: `req.user as { id: string; name: string; email: string; role: UserRole }`

**Global configurations (Story 1.2, main.ts):**
- `ValidationPipe({ whitelist: true, transform: true })` — auto-strips unknown fields, transforms types
- `HttpExceptionFilter` — normalizes all errors to `{ statusCode, message, error }`
- Global prefix: `'api'` — all routes are `/api/*`
- Swagger: configured with cookie auth (`access_token`), docs at `/api/docs`

**TypeORM setup (Story 1.1, app.module.ts):**
- `autoLoadEntities: true` — entities auto-discovered from `forFeature()` imports
- `synchronize: true` — tables auto-created from entities
- `SnakeNamingStrategy` — `camelCase` properties → `snake_case` columns automatically
- No migration files needed

**TypeORM version:** The project uses TypeORM 0.3.x (`^0.3.28` in package.json), despite the architecture doc mentioning 0.4.x. Use 0.3.x API patterns (e.g., `Repository<Course>`, `findOne({ where: {...} })`). Do NOT upgrade TypeORM.

**Module registration pattern (app.module.ts):**
```typescript
// Add CoursesModule to imports array alongside AuthModule, UsersModule
imports: [ConfigModule.forRoot(...), TypeOrmModule.forRootAsync(...), AuthModule, UsersModule, CoursesModule]
```

### Course Entity Design

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column()
  instructorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'instructor_id' })
  instructor!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
```

**SnakeNamingStrategy auto-converts:** `instructorId` → `instructor_id` column. Do NOT manually set `{ name: 'instructor_id' }` on `@Column()` — only on `@JoinColumn()`.

**Do NOT add `@OneToMany(() => CourseModule, ...)` yet** — CourseModule entity is created in Story 2.2. Story 2.2 will add the relationship + cascade delete.

### DTO Patterns (match existing auth DTOs)

**CreateCourseDto:**
```typescript
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCourseDto {
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;
}
```

**UpdateCourseDto — use NestJS `PartialType`:**
```typescript
import { PartialType } from '@nestjs/swagger';
import { CreateCourseDto } from './create-course.dto';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
```

**Import `PartialType` from `@nestjs/swagger`** (NOT from `@nestjs/mapped-types`) — this ensures Swagger metadata propagates to the partial DTO.

### Controller Pattern

**Guard stacking — apply at controller level:**
```typescript
@ApiTags('courses')
@ApiCookieAuth('access_token')
@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Instructor)
export class CoursesController { ... }
```

**Extract instructor ID from request:**
```typescript
@Post()
create(@Req() req: Request, @Body() dto: CreateCourseDto) {
  const instructorId = (req.user as { id: string }).id;
  return this.coursesService.create(instructorId, dto);
}
```

**Validate UUID path params — use ParseUUIDPipe:**
```typescript
import { ParseUUIDPipe } from '@nestjs/common';

@Patch(':id')
update(
  @Req() req: Request,
  @Param('id', ParseUUIDPipe) id: string,
  @Body() dto: UpdateCourseDto,
) { ... }

@Delete(':id')
async remove(@Req() req: Request, @Param('id', ParseUUIDPipe) id: string) {
  const instructorId = (req.user as { id: string }).id;
  await this.coursesService.remove(id, instructorId);
  return { message: 'Course deleted' };
}
```

**Import `Request` from express:**
```typescript
import type { Request } from 'express';
```

### Endpoint Specifications

| Method | Route | Body | Response | Status |
|--------|-------|------|----------|--------|
| POST | `/api/courses` | `{ title, description }` | Course object | 201 |
| GET | `/api/courses/my` | — | Course[] | 200 |
| PATCH | `/api/courses/:id` | `{ title?, description? }` | Updated Course | 200 |
| DELETE | `/api/courses/:id` | — | `{ message: "Course deleted" }` | 200 |

**Error responses (handled by global filters and guards):**
- 400: Validation error (`class-validator` via `ValidationPipe`) or invalid UUID format (`ParseUUIDPipe`)
- 401: No auth cookie / invalid JWT (`JwtAuthGuard`)
- 403: Wrong role (`RolesGuard`) or not course owner (service logic)
- 404: Course not found (`NotFoundException`)

### Service Pattern (ownership checks)

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class CoursesService {
  private readonly logger = new Logger(CoursesService.name);

  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
  ) {}

  async create(instructorId: string, dto: CreateCourseDto): Promise<Course> {
    const course = this.coursesRepository.create({ ...dto, instructorId });
    return this.coursesRepository.save(course);
  }

  async findByInstructor(instructorId: string): Promise<Course[]> {
    return this.coursesRepository.find({
      where: { instructorId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneOrFail(id: string): Promise<Course> {
    const course = await this.coursesRepository.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async update(id: string, instructorId: string, dto: UpdateCourseDto): Promise<Course> {
    const course = await this.findOneOrFail(id);
    if (course.instructorId !== instructorId) throw new ForbiddenException('Not your course');
    Object.assign(course, dto);
    return this.coursesRepository.save(course);
  }

  async remove(id: string, instructorId: string): Promise<void> {
    const course = await this.findOneOrFail(id);
    if (course.instructorId !== instructorId) throw new ForbiddenException('Not your course');
    await this.coursesRepository.remove(course);
  }
}
```

### Swagger Decorators

Add Swagger decorators for documentation (NFR10). **Note:** The existing `AuthController` does not use `@ApiTags` or `@ApiCookieAuth`. This story introduces these decorators for the first time. Import them from `@nestjs/swagger`.

```typescript
import { ApiTags, ApiCookieAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('courses')
@ApiCookieAuth('access_token')
@Controller('courses')
export class CoursesController {
  @Post()
  @ApiOperation({ summary: 'Create a new course' })
  @ApiResponse({ status: 201, description: 'Course created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden — not an instructor' })
  create(...) { ... }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a course' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'Course updated' })
  @ApiResponse({ status: 403, description: 'Forbidden — not owner' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  update(...) { ... }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a course' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'Course deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden — not owner' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  remove(...) { ... }
}
```

### What NOT To Do

**Dependencies:**
- Do NOT install any new npm packages — everything needed is already installed
- Do NOT install `@nestjs/mapped-types` — use `PartialType` from `@nestjs/swagger`

**Patterns:**
- Do NOT create new guards or decorators — `JwtAuthGuard`, `RolesGuard`, and `@Roles()` already exist
- Do NOT create a new exception filter — the global `HttpExceptionFilter` handles all errors
- Do NOT add `ValidationPipe` to individual endpoints — it's global
- Do NOT use string literals for roles (e.g., `@Roles('Instructor')`) — use `UserRole.Instructor` enum
- Do NOT add `@JoinColumn({ name: 'instructor_id' })` on the `@Column()` — only on the relation. The `@Column() instructorId` will be auto-mapped by SnakeNamingStrategy
- Do NOT define `@OneToMany(() => CourseModule, ...)` on Course entity — CourseModule doesn't exist yet (Story 2.2)
- Do NOT add `eager: true` on relations — load relations explicitly when needed
- Do NOT use `Repository.findOneBy()` alone for user-facing queries — use `findOne({ where: {...} })` pattern with proper null checking and NotFoundException

**Scope boundaries:**
- Do NOT create module or lesson entities — that's Story 2.2
- Do NOT create `GET /api/courses` (public catalog endpoint) — that's Story 3.1
- Do NOT create `GET /api/courses/:id` (public detail endpoint) — that's Story 3.1
- Do NOT add cascade delete for modules/lessons — those entities don't exist yet. The epics AC says DELETE should cascade-delete modules and lessons, but since CourseModule/Lesson entities are created in Story 2.2, cascade delete is deferred. For now, DELETE simply removes the course row. Story 2.2 will add `@OneToMany` with `{ cascade: true, onDelete: 'CASCADE' }` on the Course entity.
- Do NOT add frontend pages or components — Stories 2.3 and 2.4
- Do NOT modify any existing files except `app.module.ts` (to register CoursesModule)

### Project Structure Notes

**Files to create:**
```
backend/src/courses/
  course.entity.ts            # Course entity with ManyToOne to User
  courses.module.ts           # Module with TypeOrmModule.forFeature([Course])
  courses.controller.ts       # CRUD endpoints with guards + Swagger
  courses.service.ts          # Business logic + ownership checks
  dto/
    create-course.dto.ts      # title + description validation
    update-course.dto.ts      # PartialType of CreateCourseDto
```

**Files to modify:**
```
backend/src/app.module.ts     # Add CoursesModule to imports
```

**No new directories outside `courses/`** — follows established module pattern from `auth/` and `users/`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 2.1 Acceptance Criteria]
- [Source: _bmad-output/planning-artifacts/architecture.md — Backend module structure, TypeORM Data Mapper pattern, Naming conventions]
- [Source: _bmad-output/planning-artifacts/architecture.md — Authentication & Security: Guards, @Roles decorator]
- [Source: _bmad-output/planning-artifacts/prd.md — FR7-FR10 (Course CRUD), FR24 (Role-based access)]
- [Source: _bmad-output/planning-artifacts/architecture.md — API Response Patterns, Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/implementation-artifacts/1-4-login-register-role-based-navigation.md — Previous story patterns, form/validation conventions]
- [Source: backend/src/users/user.entity.ts — Entity definition pattern]
- [Source: backend/src/auth/guards/roles.guard.ts — Guard implementation]
- [Source: backend/src/auth/decorators/roles.decorator.ts — @Roles decorator]
- [Source: backend/src/auth/dto/register.dto.ts — DTO validation pattern with class-validator + class-transformer]
- [Source: backend/src/app.module.ts — Module registration, TypeORM config with SnakeNamingStrategy]
- [Source: backend/src/main.ts — Global configs: ValidationPipe, HttpExceptionFilter, Swagger setup]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Lint errors: `instructor: {} as any` triggered `@typescript-eslint/no-unsafe-assignment` in both spec files. Fixed by adding `/* eslint-disable @typescript-eslint/no-unsafe-assignment */` header, matching the pattern in existing spec files.

### Completion Notes List

- Created Course entity with UUID PK, title, description (text), instructorId (auto snake_case via SnakeNamingStrategy), ManyToOne relation to User with JoinColumn. No OneToMany to CourseModule (deferred to Story 2.2).
- Created CreateCourseDto (title + description with @Transform trim, @IsString, @IsNotEmpty, @MaxLength) and UpdateCourseDto via PartialType from @nestjs/swagger.
- Created CoursesService with create, findByInstructor, findOneOrFail, update, remove methods. Ownership check throws ForbiddenException when instructorId mismatches. NotFoundException for missing courses.
- Created CoursesController with @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(UserRole.Instructor) at class level. ParseUUIDPipe on :id params. Full Swagger decorators (@ApiTags, @ApiCookieAuth, @ApiOperation, @ApiResponse, @ApiParam). DELETE returns HTTP 200 with { message: 'Course deleted' }.
- Created CoursesModule with TypeOrmModule.forFeature([Course]). Registered CoursesModule in AppModule.
- Unit tests: 12 new tests covering all CoursesService methods (create, findByInstructor, findOneOrFail, update, remove) and all CoursesController endpoints, including success paths and error propagation (NotFoundException, ForbiddenException).
- Build: clean (npm run build passes). Lint: clean (npm run lint passes). Tests: 46/46 pass across 8 suites.

### File List

backend/src/courses/course.entity.ts
backend/src/courses/dto/create-course.dto.ts
backend/src/courses/dto/update-course.dto.ts
backend/src/courses/courses.service.ts
backend/src/courses/courses.controller.ts
backend/src/courses/courses.module.ts
backend/src/courses/courses.service.spec.ts
backend/src/courses/courses.controller.spec.ts
backend/src/app.module.ts

### Review Findings

- [x] [Review][Defer] `synchronize: true` unconditional in TypeORM config [backend/src/app.module.ts] — deferred, pre-existing (Story 1.1)
- [x] [Review][Defer] `ssl: { rejectUnauthorized: false }` disables TLS cert verification in prod [backend/src/app.module.ts] — deferred, pre-existing (Story 1.1)
- [x] [Review][Defer] `DATABASE_URL` Joi `.uri()` validation may reject valid PostgreSQL connection strings [backend/src/app.module.ts] — deferred, pre-existing (Story 1.1)
- [x] [Review][Defer] No pagination on `findByInstructor` — unbounded result set [backend/src/courses/courses.service.ts:28] — deferred, out of scope
- [x] [Review][Defer] Race condition on concurrent delete/update — read-then-write without locking [backend/src/courses/courses.service.ts:40-57] — deferred, general ORM concern
- [x] [Review][Defer] Missing `@ApiProperty` on DTOs — Swagger UI won't show request body schema [backend/src/courses/dto/create-course.dto.ts] — deferred, pre-existing pattern (existing `RegisterDto` also lacks `@ApiProperty`)

## Change Log

- 2026-03-25: Story 2.1 implemented — Course CRUD API (entity, DTOs, service, controller, module). 8 new files created, app.module.ts updated. 12 unit tests added. Build, lint, and all 46 tests pass. Status → review.

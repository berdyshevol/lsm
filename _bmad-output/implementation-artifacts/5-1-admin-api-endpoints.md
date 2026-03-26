# Story 5.1: Admin API Endpoints

Status: done

## Story

As an **admin**,
I want API endpoints to list users, change roles, and view all courses, plus comprehensive Swagger documentation across all controllers,
so that I can manage the platform and the interviewer can explore the full API surface.

## Acceptance Criteria

1. **List Users** — Given an authenticated admin, when they send `GET /api/users`, then the response returns all registered users with `{ id, name, email, role, createdAt }` (no passwords).

2. **Change Role** — Given an authenticated admin, when they send `PATCH /api/users/:id/role` with `{ role: "Instructor" }`, then the user's role is updated and the updated user object is returned (no password).

3. **Self-Role Prevention** — Given an admin attempting to change their own role, when the request is sent, then the API returns 403 Forbidden with message "Cannot change your own role".

4. **Invalid Role Validation** — Given an invalid role value, when sent in the role update request, then the API returns 400 with validation error.

5. **All Courses (Admin)** — Given an authenticated admin, when they send `GET /api/courses/all`, then the response returns all courses on the platform with instructor name, module count, and lesson count.

6. **Non-Admin Rejection** — Given a non-admin user, when they attempt to access admin endpoints (`GET /api/users`, `PATCH /api/users/:id/role`, `GET /api/courses/all`), then the API returns 403 Forbidden.

7. **Swagger Decorators** — Given all API endpoints across the application, when Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`/`@ApiCookieAuth`) are applied to every controller, then `GET /api/docs` renders the complete Swagger UI with all endpoints documented, grouped by module tag, with request/response DTO schemas visible.

8. **Swagger Cookie Auth Flow** — Given the interviewer opens Swagger UI at `/api/docs`, when they call `POST /api/auth/login` with seed credentials via "Try it out", which sets the httpOnly cookie, then all subsequent "Try it out" calls on protected endpoints automatically include the cookie — no manual token copy-paste required.

## Tasks / Subtasks

- [x] Task 1: Create UsersController with admin endpoints (AC: #1, #2, #3, #4, #6)
  - [x] 1.1 Create `backend/src/users/dto/update-role.dto.ts` with `role` field using `@IsEnum(UserRole)` validation
  - [x] 1.2 Create `backend/src/users/users.controller.ts` with `@ApiTags('users')`, `@ApiCookieAuth('access_token')`, `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles(UserRole.Admin)` at class level
  - [x] 1.3 Implement `GET /users` endpoint — calls `usersService.findAll()`, returns array of user objects without passwords
  - [x] 1.4 Implement `PATCH /users/:id/role` endpoint — checks `req.user.id !== param.id` (self-role prevention), calls `usersService.updateRole(id, dto.role)`, returns updated user
  - [x] 1.5 Register `UsersController` in `UsersModule`

- [x] Task 2: Add service methods to UsersService (AC: #1, #2, #3)
  - [x] 2.1 Add `findAll(): Promise<User[]>` — find all users ordered by `createdAt DESC` (password excluded by default via `select: false` on entity)
  - [x] 2.2 Add `findById(id: string): Promise<User>` — find by UUID, throw `NotFoundException` if not found
  - [x] 2.3 Add `updateRole(id: string, role: UserRole): Promise<User>` — find user, update role, save, return updated user

- [x] Task 3: Add admin all-courses endpoint (AC: #5, #6)
  - [x] 3.1 Add `GET /courses/all` endpoint to `CoursesController` with `@Roles(UserRole.Admin)` — MUST be placed before the `GET /courses/:id` route to avoid param parsing conflict
  - [x] 3.2 Reuse `coursesService.findAll()` which already returns courses with instructor name, moduleCount, lessonCount

- [x] Task 4: Add Swagger decorators to ALL controllers (AC: #7, #8)
  - [x] 4.1 Add `@ApiTags`, `@ApiCookieAuth`, `@ApiOperation`, `@ApiResponse` to `AuthController` (currently missing `@ApiTags('auth')` and `@ApiCookieAuth`)
  - [x] 4.2 Verify `CoursesController` decorators are complete (already has them)
  - [x] 4.3 Add Swagger decorators to `ModulesController` (`@ApiTags('modules')`) — already complete
  - [x] 4.4 Add Swagger decorators to `LessonsController` (`@ApiTags('lessons')`) — already complete
  - [x] 4.5 Add Swagger decorators to `EnrollmentsController` (`@ApiTags('enrollments')`) — already complete
  - [x] 4.6 Add Swagger decorators to `ProgressController` (`@ApiTags('progress')`) — already complete
  - [x] 4.7 Add `@ApiProperty()` decorators to ALL DTOs so request body schemas appear in Swagger UI
  - [x] 4.8 Verify Swagger cookie auth flow works: login via "Try it out" sets cookie, subsequent requests auto-include it

- [x] Task 5: Manual QA verification
  - [x] 5.1 `GET /api/users` as Admin → returns user list without passwords
  - [x] 5.2 `PATCH /api/users/:id/role` → role changes successfully
  - [x] 5.3 Self-role change → 403 "Cannot change your own role"
  - [x] 5.4 Invalid role → 400 validation error
  - [x] 5.5 `GET /api/courses/all` as Admin → returns all courses with instructor name + counts
  - [x] 5.6 All admin endpoints as Student/Instructor → 403
  - [x] 5.7 Swagger UI at `/api/docs` → all endpoints grouped by tag, DTO schemas visible
  - [x] 5.8 Swagger cookie auth flow works end-to-end

## Dev Notes

### Existing Code to Reuse

| What | Where | Notes |
|------|-------|-------|
| `UserRole` enum | `backend/src/users/user.entity.ts` | `Student`, `Instructor`, `Admin` |
| `User` entity | `backend/src/users/user.entity.ts` | `password` has `select: false` — already excluded from queries |
| `UsersService` | `backend/src/users/users.service.ts` | Has `findByEmail`, `create` — add `findAll`, `findById`, `updateRole` |
| `UsersModule` | `backend/src/users/users.module.ts` | Currently only exports `UsersService` — add `UsersController` |
| `JwtAuthGuard` | `backend/src/auth/guards/jwt-auth.guard.ts` | Standard JWT cookie validation |
| `RolesGuard` | `backend/src/auth/guards/roles.guard.ts` | Checks `@Roles()` decorator metadata |
| `@Roles()` decorator | `backend/src/auth/decorators/roles.decorator.ts` | Usage: `@Roles(UserRole.Admin)` |
| `CoursesService.findAll()` | `backend/src/courses/courses.service.ts:52` | Already returns courses with instructor relation, moduleCount, lessonCount — reuse for admin all-courses |
| `HttpExceptionFilter` | `backend/src/common/filters/http-exception.filter.ts` | Global filter normalizes all errors to `{ statusCode, message, error }` |
| Swagger setup | `backend/src/main.ts:16-23` | Already configured with cookie auth — do NOT modify |
| `ParseUUIDPipe` | NestJS built-in | Used in courses controller — follow same pattern for `:id` params |

### Critical Implementation Patterns

**Controller pattern (follow CoursesController exactly):**
```typescript
@ApiTags('users')
@ApiCookieAuth('access_token')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  // ...
}
```

**UpdateRoleDto pattern:**
```typescript
import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user.entity';

export class UpdateRoleDto {
  @ApiProperty({ enum: UserRole, example: 'Instructor' })
  @IsEnum(UserRole)
  role!: UserRole;
}
```

**Self-role prevention in controller (NOT service):**
```typescript
@Patch(':id/role')
@ApiOperation({ summary: 'Change a user\'s role' })
@ApiParam({ name: 'id', description: 'User UUID' })
@ApiResponse({ status: 200, description: 'Role updated' })
@ApiResponse({ status: 400, description: 'Invalid role or UUID' })
@ApiResponse({ status: 403, description: 'Forbidden — not admin or self-role change' })
@ApiResponse({ status: 404, description: 'User not found' })
updateRole(
  @Req() req: Request,
  @Param('id', ParseUUIDPipe) id: string,
  @Body() dto: UpdateRoleDto,
) {
  const adminId = (req.user as { id: string }).id;
  if (adminId === id) {
    throw new ForbiddenException('Cannot change your own role');
  }
  return this.usersService.updateRole(id, dto.role);
}
```

**Admin all-courses route placement (CRITICAL):**
The `GET /courses/all` route MUST be declared BEFORE `GET /courses/:id` in the controller. NestJS evaluates routes top-to-bottom — if `:id` comes first, "all" is parsed as a UUID and triggers `ParseUUIDPipe` error. Add the new endpoint method above the existing `findOne` method:

```typescript
// In CoursesController — add ABOVE findOne()
@Get('all')
@Roles(UserRole.Admin)
@ApiOperation({ summary: 'List all courses (admin — includes instructor name)' })
@ApiResponse({ status: 200, description: 'All platform courses with instructor name and counts' })
@ApiResponse({ status: 403, description: 'Forbidden — admin only' })
findAllAdmin() {
  return this.coursesService.findAll();
}
```

**Note:** `CoursesService.findAll()` already loads the `instructor` relation and computes `moduleCount`/`lessonCount`. The response includes `instructor: { id, name, email, role }` — the frontend will use `instructor.name` for display.

**DTO @ApiProperty pattern (add to ALL existing DTOs):**
```typescript
// Example: backend/src/courses/dto/create-course.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
  @ApiProperty({ example: 'NestJS Basics', maxLength: 255 })
  @Transform(...)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ example: 'Learn NestJS from scratch', maxLength: 5000 })
  @Transform(...)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  description!: string;
}
```

**DTOs that need @ApiProperty added (from deferred-work.md):**
- `backend/src/auth/dto/register.dto.ts`
- `backend/src/auth/dto/login.dto.ts`
- `backend/src/courses/dto/create-course.dto.ts`
- `backend/src/courses/dto/update-course.dto.ts`
- `backend/src/courses/dto/create-module.dto.ts`
- `backend/src/courses/dto/update-module.dto.ts`
- `backend/src/courses/dto/create-lesson.dto.ts`
- `backend/src/courses/dto/update-lesson.dto.ts`

**Controller Swagger audit (controllers needing decorators):**
- `AuthController` (`backend/src/auth/auth.controller.ts`) — missing `@ApiTags('auth')`, needs `@ApiOperation`/`@ApiResponse` on each method
- `ModulesController` (`backend/src/courses/modules.controller.ts`) — check for missing decorators
- `LessonsController` (`backend/src/courses/lessons.controller.ts`) — check for missing decorators
- `EnrollmentsController` (`backend/src/enrollments/enrollments.controller.ts`) — check for missing decorators
- `ProgressController` (`backend/src/progress/progress.controller.ts`) — check for missing decorators
- `CoursesController` — already has full Swagger decorators (use as reference)

### File Structure

**New files:**
```
backend/src/users/users.controller.ts    — Admin user management endpoints
backend/src/users/dto/update-role.dto.ts — Role update validation DTO
```

**Modified files:**
```
backend/src/users/users.module.ts        — Add UsersController to controllers array
backend/src/users/users.service.ts       — Add findAll(), findById(), updateRole()
backend/src/courses/courses.controller.ts — Add GET /courses/all admin endpoint (ABOVE :id route)
backend/src/auth/auth.controller.ts      — Add @ApiTags('auth'), @ApiOperation, @ApiResponse decorators
backend/src/courses/modules.controller.ts — Add missing Swagger decorators
backend/src/courses/lessons.controller.ts — Add missing Swagger decorators
backend/src/enrollments/enrollments.controller.ts — Add missing Swagger decorators
backend/src/progress/progress.controller.ts — Add missing Swagger decorators
backend/src/auth/dto/register.dto.ts     — Add @ApiProperty decorators
backend/src/auth/dto/login.dto.ts        — Add @ApiProperty decorators
backend/src/courses/dto/create-course.dto.ts  — Add @ApiProperty decorators
backend/src/courses/dto/update-course.dto.ts  — Add @ApiProperty decorators
backend/src/courses/dto/create-module.dto.ts  — Add @ApiProperty decorators
backend/src/courses/dto/update-module.dto.ts  — Add @ApiProperty decorators
backend/src/courses/dto/create-lesson.dto.ts  — Add @ApiProperty decorators
backend/src/courses/dto/update-lesson.dto.ts  — Add @ApiProperty decorators
```

### Project Structure Notes

- All new files follow existing `kebab-case` naming convention
- Users controller lives in `backend/src/users/` alongside existing service and entity
- DTO lives in `backend/src/users/dto/` folder (create `dto/` directory)
- Follow existing import style: NestJS decorators first, then swagger, then guards/decorators, then services/DTOs
- `@ApiCookieAuth('access_token')` (NOT `@ApiBearerAuth`) — this project uses httpOnly cookie auth, not bearer tokens
- All Swagger tags should match the NestJS module name: `auth`, `users`, `courses`, `modules`, `lessons`, `enrollments`, `progress`

### Anti-Patterns to Avoid

- **DO NOT create a separate admin controller/module** — Admin endpoints live in their domain controllers (`UsersController` for user management, `CoursesController` for course viewing). Admin access is controlled via `@Roles(UserRole.Admin)` decorator.
- **DO NOT add pagination** — Dataset is small (demo scope), no pagination needed per architecture doc.
- **DO NOT use `@ApiBearerAuth()`** — This project uses cookie auth. Use `@ApiCookieAuth('access_token')` everywhere.
- **DO NOT modify `main.ts`** — Swagger setup is already correct. Only add decorators to controllers and DTOs.
- **DO NOT create separate admin routes like `/api/admin/users`** — The epics spec says `GET /api/users` and `PATCH /api/users/:id/role`. Users controller is at `/users` prefix.
- **DO NOT include `updatedAt` in the user list response** — AC says `{ id, name, email, role, createdAt }` only. The entity has `select: false` on password which handles exclusion automatically, but be explicit about the response shape if needed.

### Previous Story Intelligence

**From Story 4-2 (Lesson View & Progress UI) — most recent done story:**
- No backend changes relevant to this story
- Frontend admin pages are stubs ("Coming Soon") — Story 5-2 will implement them
- `RoleBadge` component already exists and works

**From Story 4-1 (Progress Tracking API):**
- `forwardRef` pattern used for circular module dependencies — may be needed if Users module needs to import other modules
- Progress controller has guards pattern: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.Student)`

**From Story 2-1 (Course CRUD API):**
- Courses controller is the gold-standard reference for Swagger decorators
- `ParseUUIDPipe` used on all `:id` params
- `@HttpCode(HttpStatus.OK)` used on DELETE to override 201 default

**From Story 1-2 (User Registration & Auth API):**
- Auth controller is minimal on Swagger — needs `@ApiTags`, `@ApiOperation`, `@ApiResponse` added
- `@ApiBody({ type: LoginDto })` already on login (because of `@UseGuards(LocalAuthGuard)` which hides the body from Swagger auto-detection)

**From deferred-work.md — items this story addresses:**
- "Missing `@ApiProperty` on DTOs" — this story adds them to all DTOs
- "Swagger exposed in production" — acknowledged, NOT in scope (different concern)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 5, Story 5.1, lines 651-694]
- [Source: _bmad-output/planning-artifacts/architecture.md — Users module, API Patterns, Swagger configuration]
- [Source: _bmad-output/planning-artifacts/prd.md — FR5, FR6, FR15, FR24, FR25]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Admin Journey (lines 764-789), Swagger cookie auth]
- [Source: _bmad-output/implementation-artifacts/deferred-work.md — @ApiProperty gap, Swagger in production]
- [Source: backend/src/courses/courses.controller.ts — Swagger decorator reference pattern]
- [Source: backend/src/courses/courses.service.ts:52-69 — findAll() with instructor + counts]
- [Source: backend/src/users/user.entity.ts — UserRole enum, password select:false]
- [Source: backend/src/users/users.service.ts — current minimal service]
- [Source: backend/src/users/users.module.ts — no controller registered]
- [Source: backend/src/main.ts — Swagger setup with cookie auth]
- [Source: backend/src/auth/auth.controller.ts — missing @ApiTags, needs Swagger decorators]

### Review Findings

- [x] [Review][Patch] `GET /api/users` response includes `updatedAt` field — violates AC #1 explicit field list `{ id, name, email, role, createdAt }` [backend/src/users/users.service.ts:35] — FIXED: strip updatedAt in findAll()
- [x] [Review][Patch] `PATCH /users/:id/role` response includes `updatedAt` — inconsistent with AC #1/#2 response shape [backend/src/users/users.service.ts:48] — FIXED: strip updatedAt in updateRole()
- [x] [Review][Patch] `AppController` missing Swagger decorators — AC #7 requires all controllers documented [backend/src/app.controller.ts:4] — FIXED: added @ApiExcludeController()
- [x] [Review][Defer] Logout endpoint returns 201 instead of 200 — deferred, pre-existing [backend/src/auth/auth.controller.ts:82]
- [x] [Review][Defer] Stale role in JWT after admin changes a user's role — no token invalidation — deferred, pre-existing architectural decision [backend/src/auth/strategies/jwt.strategy.ts]
- [x] [Review][Defer] CoursesService.findAll() eagerly loads all modules then discards them — deferred, pre-existing perf concern [backend/src/courses/courses.service.ts]
- [x] [Review][Defer] No `forbidNonWhitelisted: true` in global ValidationPipe — deferred, pre-existing config [backend/src/main.ts]
- [x] [Review][Defer] No last-admin demotion protection — admin can demote all other admins — deferred, out of scope for demo [backend/src/users/users.controller.ts]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — implementation proceeded without blockers.

### Completion Notes List

- Created `UpdateRoleDto` with `@IsEnum(UserRole)` and `@ApiProperty` decorators.
- Created `UsersController` with `GET /users` and `PATCH /users/:id/role` — class-level `@Roles(UserRole.Admin)` enforces admin-only access. Self-role prevention implemented via synchronous ForbiddenException before async service call.
- Added `findAll`, `findById`, `updateRole` to `UsersService`. Password excluded automatically via `select: false` on entity column.
- Added `GET /courses/all` admin endpoint to `CoursesController` ABOVE `GET /courses/:id` to prevent NestJS route parsing conflict.
- Added `@ApiTags('auth')`, `@ApiCookieAuth`, `@ApiOperation`, `@ApiResponse` to `AuthController`. Other controllers (modules, lessons, enrollments, progress) already had full Swagger decorators — verified, no changes needed.
- Added `@ApiProperty` to `RegisterDto`, `LoginDto`, `CreateCourseDto`, `CreateModuleDto`, `CreateLessonDto`. `UpdateCourseDto`, `UpdateModuleDto`, `UpdateLessonDto` use `PartialType` from `@nestjs/swagger` which inherits from base class automatically.
- Registered `UsersController` in `UsersModule`.
- All 115 tests pass (13 test suites). Added 6 new tests for `UsersService` new methods and 3 tests for `UsersController` (findAll, updateRole success, self-role prevention).

### File List

backend/src/users/dto/update-role.dto.ts (new)
backend/src/users/users.controller.ts (new)
backend/src/users/users.controller.spec.ts (new)
backend/src/users/users.module.ts (modified)
backend/src/users/users.service.ts (modified)
backend/src/users/users.service.spec.ts (modified)
backend/src/courses/courses.controller.ts (modified)
backend/src/auth/auth.controller.ts (modified)
backend/src/auth/dto/register.dto.ts (modified)
backend/src/auth/dto/login.dto.ts (modified)
backend/src/courses/dto/create-course.dto.ts (modified)
backend/src/courses/dto/create-module.dto.ts (modified)
backend/src/courses/dto/create-lesson.dto.ts (modified)

### Change Log

- 2026-03-25: Implemented Story 5.1 — Admin API Endpoints. Added UsersController with GET /users and PATCH /users/:id/role (admin-only with self-role protection), extended UsersService with findAll/findById/updateRole, added GET /courses/all admin endpoint to CoursesController, completed Swagger documentation across all controllers and DTOs. 115 tests passing.

# Deferred Work

## Deferred from: code review of 1-1-project-scaffolding-monorepo-configuration (2026-03-25)

- ConfigModule not imported in AppModule — `@nestjs/config` is a dependency but ConfigModule.forRoot() is not added to AppModule. Story 1.2 should set this up with env validation via Joi.
- No ValidationPipe/CORS/API prefix in bootstrap() — `class-validator` and `class-transformer` are installed but not wired up. Story 1.2 should add `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))` and `app.setGlobalPrefix('api')`.
- ts-jest v29 may be incompatible with jest v30 — `backend/package.json` has jest ^30.0.0 but ts-jest ^29.2.5. Tests pass currently but may break with jest updates. Monitor or upgrade ts-jest when compatible version is available.
- Proxy /api has no matching backend global prefix — Vite proxies `/api` to backend but no `setGlobalPrefix('api')` is set. Story 1.2 should add the global prefix or add a rewrite rule to the proxy config.
- PORT not documented in .env.example — `main.ts` reads `process.env.PORT` but `.env.example` only documents DATABASE_URL, JWT_SECRET, NODE_ENV per AC #8. Consider adding PORT=3001 in a future story.

## Deferred from: code review of 1-2-user-registration-authentication-api (2026-03-25)

- Swagger exposed in production — `SwaggerModule.setup()` runs unconditionally. Gate behind `NODE_ENV !== 'production'` in a future hardening story.
- `forbidNonWhitelisted: true` not set on ValidationPipe — currently only `whitelist: true` (strips extra fields silently). Adding `forbidNonWhitelisted` would reject payloads with extra properties (defense-in-depth).
- JWT not verified against DB on each request — `JwtStrategy.validate()` returns claims from token directly without DB lookup. Deleted/demoted users retain access until token expires (24h). Add DB check or token revocation in a future story.
- No rate limiting on auth endpoints — `/auth/login` and `/auth/register` are unthrottled. Add `@nestjs/throttler` in a future story.
- Joi `.uri()` edge case — `DATABASE_URL` validated with `Joi.string().uri()` which may reject connection strings with un-encoded special characters in passwords.

## Deferred from: code review of 1-3-frontend-foundation-app-shell (2026-03-25)

- Content-Type: application/json set on bodyless GET/DELETE requests — `fetchApi` hardcodes `Content-Type: application/json` in headers for all requests including GET/DELETE. Future file upload stories will need to handle this (e.g., conditional header or allow override for FormData).
- No catch-all / 404 route for unmatched paths — navigating to undefined routes renders blank page. Add a `<Route path="*">` with a 404 page or redirect in a future story.
- Error toast 5s duration only enforced in mutation handler — Sonner `<Toaster>` global default is 3s. Only mutation `onError` handler explicitly sets `duration: 5000`. Future `toast.error()` calls elsewhere must include `{ duration: 5000 }` to meet AC#4 spec.

## Deferred from: code review of 2-1-course-crud-api-entities (2026-03-25)

- `synchronize: true` unconditional in TypeORM config — pre-existing from Story 1.1, applies schema changes on every start regardless of NODE_ENV
- `ssl: { rejectUnauthorized: false }` in production — pre-existing from Story 1.1, disables TLS cert verification for DB connection
- `DATABASE_URL` Joi `.uri()` validation — pre-existing from Story 1.1, may reject valid PostgreSQL connection strings with special characters
- No pagination on `findByInstructor` — returns all courses without limit/offset. Add pagination when course counts grow.
- Race condition on concurrent delete/update — read-then-write pattern without optimistic locking. Low risk at current scale.
- Missing `@ApiProperty` on DTOs — pre-existing pattern across all DTOs. Without Swagger CLI plugin, request body schemas won't appear in Swagger UI.

## Deferred from: code review of 1-4-login-register-role-based-navigation (2026-03-25)

- Fragile error type casting pattern — Error cast `(error as { message?: string | string[] })?.message` in catch blocks may miss cases where fetchApi throws non-standard errors or HTTP/2 empty statusText produces empty toast messages. Consider a shared `extractErrorMessage()` utility.
- No focus management on form error — When form submission fails, focus is not moved to the first invalid field or to the toast. Keyboard-only and screen-reader users may not notice the error. Consider adding focus management as an accessibility improvement.
- Network-down shows raw browser error string — When network is unavailable, `fetch()` throws TypeError with raw browser message (e.g., "Failed to fetch") shown directly in toast. Consider wrapping fetchApi to provide user-friendly network error messages.
- defaultLanding undefined for unknown roles — `defaultLanding[user.role]` in App.tsx returns undefined for roles not in the map, causing `<Navigate to={undefined} />`. Add a fallback default route.
- fetchApi non-JSON 200 body causes SyntaxError — `response.json()` in fetchApi success path has no catch for non-JSON bodies (e.g., HTML from reverse proxy). Consider adding error handling for malformed 200 responses.
- No query cache clearing on login — `useAuth.login()` does not clear React Query cache (unlike `logout()`). Stale data from a previous user session may briefly appear until queries refetch.
- Backend 200 with null/empty body causes silent failure — If login/register API returns 200 with null body, `setUser(null)` is called silently with no error shown to user.

## Deferred from: code review of 2-2-module-lesson-crud-api-entities (2026-03-25)

- TOCTOU race: module deleted between ownership check and lesson save → FK violation → 500. Requires wrapping related reads and writes in a database transaction, or catching QueryFailedError with FK violation code and returning 404/409.
- TOCTOU race: course deleted between ownership check and module save → FK violation → 500. Same pattern as above. Consistent with pre-existing approach from Story 2.1 (no transactions for simple CRUD).

## Deferred from: code review of 2-3-instructor-courses-list-create-ui (2026-03-25)

- No role-based guard on instructor routes — `ProtectedRoute` in `App.tsx` only checks `isAuthenticated`, not user role. Any authenticated user (Student, Admin) can navigate to `/my-courses` and `/my-courses/:id/edit`. Pre-existing architectural gap from Story 1.4. Add role-based route protection (e.g., `RoleRoute` wrapper or role checks in `ProtectedRoute`).

## Deferred from: code review of 2-4-course-editor-module-lesson-management-ui (2026-03-25)

- orderIndex collision on concurrent creates — `orderIndex: modules.length` is stale if two creates happen before cache refresh. By spec design; backend should compute orderIndex server-side for robustness.
- No role-based guard on CourseEditorPage route — pre-existing from Story 2.3, ProtectedRoute only checks isAuthenticated.
- Course fetched by filtering entire instructor list — deliberate spec decision to reuse cached query. Consider dedicated `useCourse(id)` hook as course count grows.
- No unsaved-changes warning on course editor — user can navigate away from dirty form without warning. Add React Router `useBlocker` or `beforeunload` listener in a future UX polish story.
- No 403/404 error discrimination — error state shows generic "Failed to load course data" for all error types. Inspect error statusCode to show contextual messages.
- XSS surface for markdown content at render site — lesson content (up to 50k chars) accepted without sanitization. The lesson viewer (future story) must sanitize HTML output from markdown rendering.
- Stale course data from shared list query — course editor uses `useInstructorCourses()` list with client-side filter. Consider dedicated single-course query as the app scales.

## Deferred from: code review of 3-2-course-discovery-enrollment-ui (2026-03-25)

- courseId closure capture in pre-existing mutation hooks — Hooks like `useCreateModule(courseId)`, `useUpdateModule(courseId)`, `useDeleteModule(courseId)` capture `courseId` from the outer scope at call time. If a parent component renders these hooks with a changed `courseId` without remounting, mutations will fire against the stale `courseId`. The `courseId` should be part of the `mutationFn` argument. Pre-existing pattern in `useCourses.ts`.
- useUpdateLesson missing orderIndex in updatable fields — `useUpdateLesson`'s `mutationFn` type only allows `title` and `content` as optional update fields, but `Lesson` includes `orderIndex`. Unlike `useUpdateModule` which allows `orderIndex`, lesson reordering is impossible through this hook. Pre-existing in `useCourses.ts`.

## Deferred from: code review of 4-1-progress-tracking-api (2026-03-25)

- `forwardRef` circular dependency between CoursesModule and EnrollmentsModule — design smell indicating tight coupling. Consider extracting shared logic into a separate module as the codebase grows. Pre-existing architectural decision.
- No rate limiting on `markComplete` endpoint — `POST /api/progress/courses/:courseId/lessons/:lessonId/complete` has no throttling. Platform-wide concern; add `@nestjs/throttler` in a future infrastructure story.

## Deferred from: code review of 5-1-admin-api-endpoints (2026-03-25)

- Logout endpoint returns 201 instead of 200 — `@Post('logout')` has no `@HttpCode(200)`, NestJS defaults POST to 201. Pre-existing from Story 1.2.
- Stale role in JWT after admin changes a user's role — `JwtStrategy.validate()` returns role from JWT payload without DB lookup. Demoted users retain old permissions until token expires (24h). Pre-existing architectural decision.
- CoursesService.findAll() eagerly loads all modules/lessons then discards them — fetches full object graph only to count and strip. Could use COUNT subquery instead. Pre-existing from Story 2.1.
- No `forbidNonWhitelisted: true` in global ValidationPipe — silently strips extra properties instead of rejecting. Pre-existing from Story 1.2.
- No last-admin demotion protection — admin can demote all other admins to Student, potentially leaving zero admins. Out of scope for demo project.

## Deferred from: code review of 5-2-admin-management-ui (2026-03-25)

- No admin role guard on client routes — `ProtectedRoute` only checks `isAuthenticated`, not `isAdmin`. Any authenticated user can navigate to `/admin/*` routes. Backend returns 403 but UI exposes the page. Pre-existing gap from Story 2.3.

## Deferred from: code review of 6-1-seed-data-database-seeder (2026-03-25)

- No transaction wrapping multi-step seed operation — If seed fails mid-execution, partial data persists and idempotency check prevents re-seeding. Recovery requires manual DB cleanup or reset.
- Partial seed permanently silenced by single-row idempotency check — Admin user check passes even if courses/modules/lessons/enrollment/progress weren't created. Consequence of no-transaction design.
- SeedModule runs unconditionally in all environments — No NODE_ENV guard on SeedModule import. In test environments, seeder runs on full app bootstrap. Demo app has no production deployment currently.

## Deferred from: code review of 4-2-lesson-view-progress-ui (2026-03-25)

- Concurrent markComplete rollback can undo sibling mutations — When two different lessons are marked complete in rapid succession and the first mutation fails, its onError rollback restores pre-first-click state, undoing the second mutation's optimistic update. Known React Query limitation; onSettled invalidation self-corrects.
- Enrollment redirect race/brief UI flash during render — `useEffect` with `navigate()` in LessonViewPage can briefly flash incorrect UI before redirect. Standard React Router pattern; cosmetic only.
- Unsafe type assertion on error object — `(lessonErrorData as { statusCode?: number })?.statusCode` in LessonViewPage is brittle. Needs investigation of fetchApi error shape; fallback "Lesson not found" behavior is acceptable.
- N+1 useProgress queries in MyLearningPage — Each `EnrolledCourseCard` fires its own `useProgress(courseId)` call. Requires batch progress API endpoint to fix properly. Impact depends on typical enrollment count.
- Sidebar fails silently on course query error — LessonLayout renders no sidebar when course query fails, leaving user without course navigation. Pre-existing layout pattern (AppLayout has same issue); lesson content still renders.
- No role-based guard on lesson routes — `ProtectedLessonRoute` only checks `isAuthenticated`, not user role. Pre-existing from Story 2.3. Enrollment check in LessonViewPage provides functional guard.

## Deferred from: code review of 6-3-production-build-deployment (2026-03-25)

- SSL `rejectUnauthorized: false` in production DB connection — TypeORM config disables certificate verification when NODE_ENV=production. Standard for Render managed PostgreSQL but reduces TLS security. Pre-existing from Story 1.1.
- DATABASE_URL manual parsing via `new URL()` may fail on passwords with un-encoded special characters — Render-generated URLs are safe, but manual DATABASE_URL values with `@`, `/`, or `#` in passwords will misparse. Pre-existing from Story 1.1.

## Deferred from: code review of 6-2-ux-polish-breadcrumbs (2026-03-25)

- Loading-state duplication in App.tsx — 5 route guards copy-paste identical loading spinners. Pre-existing pattern; story 6.2 added one more following convention.
- No loading/error state for layout sidebars — CourseDetailLayout and LessonLayout silently hide sidebar when data is loading. Pre-existing layout pattern.
- progress.percentage displayed without rounding — CourseDetailPage renders raw float percentage. Pre-existing code not introduced by this story.
- handleEnroll has no success/error feedback — Enroll mutation has no onSuccess/onError callbacks. Pre-existing from course detail page.
- Role-based route authorization absent — Only `isAuthenticated` checked in route guards, not roles. Pre-existing architectural choice noted in multiple prior reviews.

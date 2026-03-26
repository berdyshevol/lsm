# Story 2.3: Instructor Courses List & Create UI

Status: done

## Story

As an **instructor**,
I want to see my courses and create new ones,
So that I can manage my course catalog through the browser.

## Acceptance Criteria

1. Navigating to `/my-courses` as an authenticated instructor shows a page with "My Courses" title, a "Create Course" button, and a list of their own courses. If no courses exist, an EmptyState component is shown with "Create your first course" message and a CTA button.
2. Clicking "Create Course" opens a Dialog with a form containing title and description fields. The form validates via zod on submit. The submit button shows a spinner + "Creating..." while the API call is in progress. On success, a toast "Course created!" appears and the instructor is redirected to `/my-courses/:id/edit`.
3. Clicking on an existing course card navigates to `/my-courses/:id/edit` (the course editor page).
4. While the course list loads, Skeleton placeholders are shown instead of blank content.
5. Any API error during course creation shows a toast error ("Could not save. Please try again."), form data is preserved, and the Dialog remains open.

## Tasks / Subtasks

- [x] Task 1: Install missing shadcn `dialog` component (AC: #2)
  - [x] Run `npx shadcn@latest add dialog` in the `frontend/` directory
  - [x] Verify `frontend/src/components/ui/dialog.tsx` is created

- [x] Task 2: Create `EmptyState` reusable component (AC: #1)
  - [x] Create `frontend/src/components/common/EmptyState.tsx`
  - [x] Props: `icon` (lucide icon component), `title` (string), `description` (string), `action` (optional ReactNode for CTA button)
  - [x] Centered layout with muted icon, title, description text, and action slot

- [x] Task 3: Create `useCourses` React Query hook (AC: #1, #4)
  - [x] Create `frontend/src/hooks/useCourses.ts`
  - [x] `useInstructorCourses()` — calls `GET /api/courses/my`, returns `{ data, isLoading, error }`. Query key: `['courses', 'my']`
  - [x] `useCreateCourse()` — mutation calling `POST /api/courses` with `{ title, description }`. On success: invalidates `['courses', 'my']` query, returns created course. Query key for mutation: standard React Query mutation pattern.
  - [x] Define `Course` TypeScript interface: `{ id: string; title: string; description: string; instructorId: string; createdAt: string; updatedAt: string }`

- [x] Task 4: Create `CreateCourseDialog` component (AC: #2, #5)
  - [x] Create `frontend/src/components/course/CreateCourseDialog.tsx`
  - [x] Props: `open: boolean`, `onOpenChange: (open: boolean) => void`
  - [x] Form with react-hook-form + zod validation (matching LoginPage pattern):
    - `title`: string, required, max 255 chars
    - `description`: string, required, max 5000 chars (use `Textarea` component)
  - [x] Submit button: shows `Loader2` spinner + "Creating..." when submitting, "Create Course" when idle
  - [x] On success: toast "Course created!", close dialog, navigate to `/my-courses/:id/edit`
  - [x] On error: add custom `onError` on the mutation call to show "Could not save. Please try again." (overrides QueryClient default). Form data preserved, dialog stays open.
  - [x] On dialog close (user cancels): call `form.reset()` to clear stale data on reopen
  - [x] Uses `useCreateCourse()` mutation from `useCourses` hook
  - [x] Use `mutation.isPending` for submit button loading state (NOT `formState.isSubmitting` — mutation state is the source of truth for async API calls)

- [x] Task 5: Implement `MyCoursesPage` (AC: #1, #2, #3, #4)
  - [x] Replace the stub in `frontend/src/pages/MyCoursesPage.tsx`
  - [x] Key imports: `Plus`, `BookOpen` from `lucide-react`; `Card`, `CardHeader`, `CardTitle`, `CardContent` from `@/components/ui/card`; `Skeleton` from `@/components/ui/skeleton`; `Button` from `@/components/ui/button`; `useState` from `react`; `useInstructorCourses` from `@/hooks/useCourses`; `EmptyState` from `@/components/common/EmptyState`; `CourseCard` from `@/components/course/CourseCard`; `CreateCourseDialog` from `@/components/course/CreateCourseDialog`
  - [x] Page header: "My Courses" title (`text-3xl font-bold`) + "Create Course" `Button` with `Plus` icon (top-right, flex layout)
  - [x] Loading state: 3 Skeleton cards (matching course card dimensions)
  - [x] Empty state: `EmptyState` component with `BookOpen` icon, "No courses yet", "Create your first course to get started", CTA button opens create dialog
  - [x] Course list: grid of course cards (`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`), each card is a clickable `Card` linking to `/my-courses/:id/edit`
  - [x] Each course card shows: title (`CardTitle`), description truncated to 2 lines (`line-clamp-2`), date created (`text-sm text-muted-foreground`). Card link has `aria-label={course.title}`.
  - [x] `CreateCourseDialog` integrated — controlled via `useState` for open state
  - [x] Uses `useInstructorCourses()` hook for data

- [x] Task 5b: Create `CourseCard` reusable component (AC: #3)
  - [x] Create `frontend/src/components/course/CourseCard.tsx`
  - [x] Props: `course: Course` (from useCourses), `href: string` (link target)
  - [x] Renders shadcn `Card` wrapped in `Link`, displays title, truncated description, date
  - [x] Hover effect: `hover:shadow-md transition-shadow cursor-pointer`
  - [x] `aria-label={course.title}` on the Link wrapper
  - [x] This component will be reused by Story 3.2 (catalog) and Story 4.2 (enrolled courses) with variant props added later

- [x] Task 6: Create `CourseEditorPage` stub + route (AC: #2, #3)
  - [x] Create `frontend/src/pages/CourseEditorPage.tsx` as a minimal stub: display "Course Editor" title + "Coming Soon" (matches existing stub pattern)
  - [x] Add route `/my-courses/:id/edit` to `App.tsx` inside the `<ProtectedRoute>` block
  - [x] Import and register `CourseEditorPage` component

- [x] Task 7: Verify (AC: all)
  - [x] Run `npm run build` in frontend — must compile cleanly
  - [x] Run `npm run lint` — must pass (if configured)
  - [x] Verify: navigate to `/my-courses` as instructor → page renders with title and create button
  - [x] Verify: empty state shows when no courses exist
  - [x] Verify: skeleton loading states display during data fetch
  - [x] Verify: create course dialog opens, validates, submits, shows toast, redirects
  - [x] Verify: course cards render with title, description, date
  - [x] Verify: clicking a course card navigates to `/my-courses/:id/edit`
  - [x] Verify: API errors show toast, preserve form data

## Dev Notes

### Critical: What Exists Already — USE, DO NOT RECREATE

**Authentication and user context (Story 1.4):**
- `useAuth` hook at `src/hooks/useAuth.tsx` — provides `user`, `isAuthenticated`, `isInstructor`, `isAdmin`, `isStudent`
- User interface: `{ id: string; name: string; email: string; role: 'Student' | 'Instructor' | 'Admin' }`
- Auth context wraps all routes — no need to check auth in individual pages

**API client (Story 1.3):**
- `fetchApi` at `src/lib/fetchApi.ts` — `fetchApi.get<T>(url)`, `fetchApi.post<T>(url, body)`, `fetchApi.patch<T>(url, body)`, `fetchApi.delete<T>(url)`
- Cookies included automatically (`credentials: 'include'`)
- Errors thrown as objects: `{ statusCode, message, error }`

**React Query setup (Story 1.3):**
- `queryClient` at `src/lib/queryClient.ts` — configured with `staleTime: 30_000`, `retry: 1`, `refetchOnWindowFocus: false`
- Mutation default `onError` shows toast via `sonner` — toast error handling is automatic for mutations
- Import: `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'`

**Routing (Story 1.4):**
- `App.tsx` — React Router v7, routes inside `<ProtectedRoute>` render within `<AppLayout>` (sidebar + main content)
- `/my-courses` already routes to `MyCoursesPage`
- Instructor's default landing page is `/my-courses` (in `defaultLanding` map)
- Navigation: `useNavigate` from `react-router` — `navigate('/my-courses/${id}/edit')`

**Layout (Story 1.4):**
- `AppLayout` at `src/components/layout/AppLayout.tsx` — wraps page in `SidebarProvider` + `AppSidebar` + `<main>` with `p-6` and `max-w-5xl`
- `AppSidebar` — Instructor nav: "My Courses" (`/my-courses`) + "Browse Courses" (`/courses`)
- Pages render inside `<Outlet />` — no need to add layout wrappers in page components

**Form patterns (Story 1.4):**
- react-hook-form + zod + zodResolver pattern (see `LoginPage.tsx`):
  ```typescript
  const schema = z.object({ ... });
  type FormData = z.infer<typeof schema>;
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  ```
- Error display: `{errors.field && <p className="text-sm text-destructive">{errors.field.message}</p>}`
- **Loading state for mutations:** Use `mutation.isPending` from React Query (NOT `formState.isSubmitting`). The `LoginPage` uses `isSubmitting` because it calls `login()` directly in `handleSubmit`. For React Query mutations, `isPending` is the correct loading state.
- Submit button: `<Button disabled={isPending}>{isPending && <Loader2 />}{isPending ? 'Creating...' : 'Create Course'}</Button>`
- Toast on error: `toast.error(message, { duration: 5000 })`

**Architecture doc vs reality — shadcn Form component:**
- The architecture doc planned to use the shadcn `Form` component, but Story 1.3 installed react-hook-form + zod with manual Label/Input pattern instead. The shadcn `Form` component is NOT installed. Follow the established `LoginPage.tsx` pattern (direct react-hook-form + Label + Input), NOT the architecture doc's suggestion.

**shadcn UI components installed (Story 1.3):**
- Available: `button`, `card` (Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter), `input`, `textarea`, `label`, `skeleton`, `separator`, `dropdown-menu`, `badge`, `table`, `select`, `accordion`, `scroll-area`, `progress`, `breadcrumb`, `tooltip`, `sheet`, `sidebar`
- **NOT installed:** `dialog`, `form`, `alert-dialog` — Dialog MUST be installed for this story

**Existing custom components (Story 1.4):**
- `RoleBadge` at `src/components/common/RoleBadge.tsx` — colored role display
- `DemoCredentials` at `src/components/common/DemoCredentials.tsx` — demo login buttons (LoginPage only)
- `EmptyState` does NOT exist yet — must be created in this story

### Backend API Contracts (Stories 2.1, 2.2)

**Endpoints this story calls:**

| Method | Route | Body | Response | Status |
|--------|-------|------|----------|--------|
| GET | `/api/courses/my` | — | `Course[]` | 200 |
| POST | `/api/courses` | `{ title, description }` | `Course` object | 201 |

**Course response shape:**
```typescript
interface Course {
  id: string;          // UUID
  title: string;
  description: string;
  instructorId: string; // UUID
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}
```

**Error responses (handled by fetchApi + QueryClient):**
- 400: Validation error — `{ statusCode: 400, message: ['title must be...'], error: 'Bad Request' }`
- 401: No auth — redirected to login by auth context
- 403: Not an instructor — shouldn't happen since page is role-scoped

### React Query Hook Pattern

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetchApi';

interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  createdAt: string;
  updatedAt: string;
}

export function useInstructorCourses() {
  return useQuery<Course[]>({
    queryKey: ['courses', 'my'],
    queryFn: () => fetchApi.get<Course[]>('/api/courses/my'),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; description: string }) =>
      fetchApi.post<Course>('/api/courses', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'my'] });
    },
  });
}
```

**Navigation after create:** The `useCreateCourse` mutation returns the created `Course` object. In `CreateCourseDialog`, use `mutateAsync` or `mutate` with callbacks to access `course.id` for navigation:
```typescript
const createCourse = useCreateCourse();
const navigate = useNavigate();

const onSubmit = (data: FormData) => {
  createCourse.mutate(data, {
    onSuccess: (course) => {
      toast.success('Course created!');
      onOpenChange(false);
      navigate(`/my-courses/${course.id}/edit`);
    },
    onError: () => {
      toast.error('Could not save. Please try again.', { duration: 5000 });
    },
  });
};
```

Note: Per-call `onError` overrides the QueryClient default for this mutation. This ensures the AC-specified "Could not save. Please try again." message.

**Query key convention:** Entity-based arrays — `['courses', 'my']` for instructor's courses. This pattern must be consistent so Story 2.4 and future stories can invalidate correctly.

### Zod Schema for Create Course Form

```typescript
const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description too long'),
});
```

Must match backend `CreateCourseDto` validation constraints: title max 255, description max 5000.

### EmptyState Component Pattern

```typescript
interface EmptyStateProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  action?: React.ReactNode;
}
```

Centered layout: `flex flex-col items-center justify-center py-12 text-center`. Icon at `h-12 w-12 text-muted-foreground`, title as `text-lg font-medium` with an `id` attribute, description as `text-sm text-muted-foreground` with an `id` attribute. Action slot below description — CTA button should use `aria-describedby` referencing the description element's id.

This component is reused by Story 3.2 (MyLearning empty state) and Story 5.2 (admin empty states) — design for reuse.

### Course Card Design

Implemented as `CourseCard` component at `src/components/course/CourseCard.tsx`:
- Entire card wrapped in `Link` component — `aria-label={course.title}` on the Link
- Shows: `CardTitle` (course title), `CardDescription` (description, `line-clamp-2` for truncation), date in `CardFooter` or bottom of `CardContent`
- Hover effect: `hover:shadow-md transition-shadow cursor-pointer` on the Card (matches UX spec shadow-based hover pattern)
- Date format: use `new Date(course.createdAt).toLocaleDateString()` or similar

### Skeleton Loading Pattern

Show 3 skeleton cards in the same grid layout as course cards:
```tsx
{isLoading && (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 3 }).map((_, i) => (
      <Card key={i}>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    ))}
  </div>
)}
```

### Routing: CourseEditorPage Stub

Story 2.3 MUST create the route and stub page because:
- Create course redirects to `/my-courses/:id/edit`
- Course card clicks navigate to `/my-courses/:id/edit`
- The full editor implementation is Story 2.4

**Add to `App.tsx`:**
```typescript
import { CourseEditorPage } from '@/pages/CourseEditorPage';

// Inside <ProtectedRoute> routes:
<Route path="/my-courses/:id/edit" element={<CourseEditorPage />} />
```

**`CourseEditorPage.tsx` stub:**
```typescript
export function CourseEditorPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Course Editor</h1>
      <p className="text-muted-foreground">Coming Soon</p>
    </div>
  );
}
```

This matches the existing stub pattern used by `MyCoursesPage`, `CourseCatalogPage`, etc.

### Dialog Component Installation

**shadcn Dialog is NOT installed.** Run:
```bash
cd frontend && npx shadcn@latest add dialog
```

This creates `src/components/ui/dialog.tsx` with: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogTrigger`, `DialogClose`.

Usage pattern — **CRITICAL: wrap `<form>` inside DialogContent so submit button and Enter key work**:
```tsx
<Dialog open={open} onOpenChange={(open) => { if (!open) form.reset(); setOpen(open); }}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create Course</DialogTitle>
      <DialogDescription>Add a new course to your catalog.</DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* form fields here */}
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? 'Creating...' : 'Create Course'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

**Key imports for CreateCourseDialog:**
```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';
import { useCreateCourse } from '@/hooks/useCourses';
```

### What NOT To Do

**Dependencies:**
- Do NOT install any npm packages besides the shadcn `dialog` component — everything else is already installed
- Do NOT install `@nestjs/mapped-types` or any backend packages — this is a frontend-only story

**Patterns:**
- Do NOT use the shadcn `Form` component (not installed) — use the react-hook-form + zod + Label/Input pattern from `LoginPage.tsx`
- Do NOT create a new layout wrapper — pages render inside `AppLayout` via `<Outlet />`
- Do NOT add authentication checks in the page — `ProtectedRoute` already handles this
- Do NOT add the `Toaster` component — it's already in the layout
- Do NOT use Axios or any other HTTP library — use `fetchApi` from `src/lib/fetchApi.ts`
- Do NOT create a separate `/my-courses/new` route — use a Dialog on the existing `/my-courses` page
- Do NOT add error handling for mutations beyond what QueryClient provides — the default `onError` toast is automatic
- Do NOT use `eager` loading or pre-fetching — React Query handles caching with `staleTime: 30_000`

**Scope boundaries:**
- Do NOT implement the Course Editor page (Story 2.4) — only create the stub and route
- Do NOT implement module/lesson CRUD UI — that's Story 2.4
- Do NOT implement course delete from this page — delete is in the course editor (Story 2.4)
- Do NOT add a "Browse Courses" or catalog view — that's Story 3.2
- Do NOT implement enrollment or progress features — those are Epics 3 and 4
- Do NOT modify `AppSidebar.tsx` — instructor nav items are already configured
- Do NOT modify backend code — all API endpoints are implemented in Stories 2.1 and 2.2

### Previous Story Intelligence (from Stories 2.1, 2.2)

**Backend patterns established:**
- `GET /api/courses/my` returns `Course[]` ordered by `createdAt DESC` (newest first)
- `POST /api/courses` returns the created `Course` object with all fields
- TypeORM `SnakeNamingStrategy` means JSON responses use `camelCase` (`instructorId`, `createdAt`)
- Ownership is enforced server-side — frontend doesn't need ownership checks

**Review findings from 2.1/2.2 that may impact frontend:**
- Missing `@ApiProperty` on DTOs — Swagger won't show request body schema, but this doesn't affect frontend API calls
- No pagination on `GET /api/courses/my` — acceptable for demo scope (small dataset)

**Frontend patterns from Story 1.4:**
- `LoginPage` is the reference implementation for form patterns
- Error toast pattern: `toast.error(msg, { duration: 5000 })` — but for mutations, QueryClient handles this automatically
- Loader pattern: `<Loader2 className="h-4 w-4 animate-spin" />` from `lucide-react`
- Link pattern: `import { Link, useNavigate } from 'react-router'`

### Project Structure Notes

**Files to create:**
```
frontend/src/
  components/
    common/
      EmptyState.tsx           # Reusable empty state component
    course/
      CourseCard.tsx            # Reusable course card (clickable, hover shadow)
      CreateCourseDialog.tsx   # Dialog with create course form
  hooks/
    useCourses.ts              # React Query hooks for course data
  pages/
    CourseEditorPage.tsx        # Stub page for course editor (Story 2.4)
```

**Files to modify:**
```
frontend/src/
  pages/MyCoursesPage.tsx      # Replace stub with full implementation
  App.tsx                       # Add /my-courses/:id/edit route
```

**shadcn component to install:**
```
frontend/src/components/ui/dialog.tsx    # Via npx shadcn@latest add dialog
```

**Directory `frontend/src/components/course/` does NOT exist yet** — create it for `CreateCourseDialog.tsx`. This directory will hold all course-related components (future: `CourseCard.tsx`, `CourseSidebar.tsx`, `LessonContent.tsx`).

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 2.3 Acceptance Criteria, lines 411-437]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture: React Router v7, React Query v5, react-hook-form + zod]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Naming: PascalCase components, camelCase hooks, domain folders]
- [Source: _bmad-output/planning-artifacts/architecture.md — React Query Patterns: entity-based query keys, mutation invalidation]
- [Source: _bmad-output/planning-artifacts/architecture.md — File Organization Rules: pages/, components/course/, hooks/]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Journey 2: Instructor Course Management flow, lines 722-762]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Layout blueprint: My Courses (Instructor), line 651]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — EmptyState pattern: List + empty state, lines 829-831]
- [Source: _bmad-output/planning-artifacts/prd.md — FR7 (Instructor can create course), FR10 (Instructor can view own courses)]
- [Source: _bmad-output/implementation-artifacts/2-1-course-crud-api-entities.md — Course entity, API endpoints, service patterns]
- [Source: _bmad-output/implementation-artifacts/2-2-module-lesson-crud-api-entities.md — CoursesService exports, module registration]
- [Source: frontend/src/pages/LoginPage.tsx — Form pattern reference: react-hook-form + zod + zodResolver]
- [Source: frontend/src/hooks/useAuth.tsx — Auth context, User interface, role checks]
- [Source: frontend/src/lib/fetchApi.ts — API client pattern]
- [Source: frontend/src/lib/queryClient.ts — QueryClient config, mutation error handling]
- [Source: frontend/src/App.tsx — Routing structure, ProtectedRoute pattern]
- [Source: frontend/src/components/layout/AppLayout.tsx — Layout structure: SidebarProvider + Outlet]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- Installed shadcn `dialog` component via `npx shadcn@latest add dialog`
- Created `EmptyState` reusable component with icon, title, description, and optional action slot
- Created `useCourses.ts` with `useInstructorCourses` (GET /api/courses/my) and `useCreateCourse` (POST /api/courses) hooks; exported `Course` interface
- Created `CourseCard` component: Card wrapped in Link with hover shadow, aria-label, truncated description, date
- Created `CreateCourseDialog` component: react-hook-form + zod, mutation.isPending state, per-call onError override, form.reset on close
- Implemented `MyCoursesPage`: header with Create Course button, 3-skeleton loading state, EmptyState for empty list, course grid
- Created `CourseEditorPage` stub: "Course Editor" + "Coming Soon"
- Added `/my-courses/:id/edit` route to `App.tsx`
- `npm run build` and `npm run lint` both pass cleanly

### File List

- frontend/src/components/ui/dialog.tsx (created by shadcn)
- frontend/src/components/common/EmptyState.tsx (created)
- frontend/src/hooks/useCourses.ts (created)
- frontend/src/components/course/CreateCourseDialog.tsx (created)
- frontend/src/components/course/CourseCard.tsx (created)
- frontend/src/pages/MyCoursesPage.tsx (modified)
- frontend/src/pages/CourseEditorPage.tsx (created)
- frontend/src/App.tsx (modified)

### Review Findings

- [x] [Review][Patch] No error state for course list fetch failure — blank page when API errors [MyCoursesPage.tsx] — fixed: added error state with retry button
- [x] [Review][Patch] Double error toast on mutation failure — global onError + per-call onError both fire [useCourses.ts, CreateCourseDialog.tsx] — fixed: moved onError to hook level to override global default
- [x] [Review][Patch] Spinner icon lacks spacing before "Creating..." text [CreateCourseDialog.tsx:106] — fixed: added mr-2 to Loader2
- [x] [Review][Defer] No role-based guard on instructor routes — pre-existing architectural gap in ProtectedRoute [App.tsx] — deferred, pre-existing

### Change Log

- 2026-03-25: Implemented Story 2.3 — Instructor Courses List & Create UI. Created EmptyState, CourseCard, CreateCourseDialog components, useCourses hook, full MyCoursesPage implementation, CourseEditorPage stub, and /my-courses/:id/edit route.

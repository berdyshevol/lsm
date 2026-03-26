# Story 3.2: Course Discovery & Enrollment UI

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **student**,
I want to browse courses, see details, enroll with one click, and view my enrolled courses,
So that I can discover and commit to learning content.

## Acceptance Criteria

1. **Given** an authenticated student navigating to `/courses` (Browse Courses), **When** the page loads, **Then** they see a page title "Course Catalog" and a 3-column card grid (responsive: 2-col md, 1-col mobile) with CourseCard components showing title, instructor name, description (2-line clamp), and lesson count badge.

2. **Given** the CourseCard component, **When** rendered in catalog variant, **Then** the card shows hover shadow transition and the entire card is a clickable link to the course detail page.

3. **Given** a student clicking a course card, **When** the course detail page loads at `/courses/:id`, **Then** they see the course title, description, instructor name, and a module/lesson accordion tree showing the full content structure (titles only, no content).

4. **Given** a student viewing a course they are NOT enrolled in, **When** the page renders, **Then** an "Enroll" primary button is displayed prominently.

5. **Given** a student clicking "Enroll", **When** the enrollment succeeds, **Then** the button changes to "Continue Learning" on the same page (no redirect), a toast shows "Enrolled successfully!", and the enrollment is persisted.

6. **Given** a student viewing a course they ARE enrolled in, **When** the page renders, **Then** a "Continue Learning" button is shown, and clicking it navigates to the first lesson of the course.

7. **Given** an authenticated student navigating to `/my-learning`, **When** the page loads, **Then** they see enrolled courses as CourseCard enrolled-variant components showing title, instructor, and description; if no enrollments exist, an EmptyState is shown ("No courses yet" + "Browse Courses" CTA linking to `/courses`).

8. **Given** Skeleton loading states, **When** the catalog or my learning page data takes more than 300ms, **Then** Skeleton card placeholders are shown.

## Tasks / Subtasks

- [x] Task 1: Add new React Query hooks for catalog, enrollment, and course detail (AC: #1, #3, #4, #5, #6, #7)
  - [x] 1.1 Add types: `CourseCatalogItem`, `CourseDetail`, `Enrollment`, `EnrollmentWithCourse` to `useCourses.ts`
  - [x] 1.2 Add `useCourseCatalog()` hook — `GET /api/courses` → `queryKey: ['courses', 'catalog']`
  - [x] 1.3 Add `useCourseDetail(id)` hook — `GET /api/courses/:id` → `queryKey: ['courses', id]`
  - [x] 1.4 Create new `useEnrollments.ts` hook file
  - [x] 1.5 Add `useMyEnrollments()` hook — `GET /api/enrollments/my` → `queryKey: ['enrollments', 'my']`
  - [x] 1.6 Add `useEnroll()` mutation — `POST /api/enrollments/courses/:courseId` → on success: invalidates `['enrollments', 'my']` and `['courses', 'catalog']`; toast `"Enrolled successfully!"`; on error with status 409: also invalidate `['enrollments', 'my']` to re-sync enrollment status (handles race condition)
  - [x] 1.7 Add `useEnrollmentStatus(courseId)` derived hook — returns `{ isEnrolled: boolean; isLoading: boolean }`. `isLoading` from underlying `useMyEnrollments()` query state; `isEnrolled` is `data?.some(e => e.courseId === courseId) ?? false`

- [x] Task 2: Upgrade CourseCard to support catalog and enrolled variants (AC: #1, #2, #7)
  - [x] 2.1 Add `variant: 'catalog' | 'enrolled'` prop to CourseCard
  - [x] 2.2 Catalog variant: show instructor name (`text-sm text-muted-foreground`), description (2-line clamp), lesson count badge in footer
  - [x] 2.3 Enrolled variant: show instructor name, description (2-line clamp), enrolledAt date (`toLocaleDateString()`) in footer (UX spec shows progress bar + percentage here — deferred to Epic 4; enrolledAt is interim footer content)
  - [x] 2.4 Maintain existing hover shadow transition and full-card clickable link pattern
  - [x] 2.5 Accept `instructor` (name string), `lessonCount` (number, catalog), `enrolledAt` (string, enrolled) as additional optional props

- [x] Task 3: Implement CourseCatalogPage (AC: #1, #2, #8)
  - [x] 3.1 Use `useCourseCatalog()` hook to fetch all courses
  - [x] 3.2 Render page title "Course Catalog" with `text-3xl font-bold`
  - [x] 3.3 Render 3-column responsive grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
  - [x] 3.4 Each card links to `/courses/${course.id}` via CourseCard catalog variant
  - [x] 3.5 Show Skeleton card placeholders while loading (3 skeleton cards matching card layout)
  - [x] 3.6 Handle empty state (unlikely but defensive) and error state

- [x] Task 4: Implement CourseDetailPage (AC: #3, #4, #5, #6)
  - [x] 4.1 Use `useCourseDetail(id)` to fetch course with nested modules/lessons
  - [x] 4.2 Use `useMyEnrollments()` to check enrollment status for this course
  - [x] 4.3 Render course header: title (`text-3xl font-bold`), description, instructor name
  - [x] 4.4 Render module/lesson tree using shadcn Accordion — modules as AccordionItems, lessons as list items under each module
  - [x] 4.5 Enrollment-aware CTA: "Enroll" button (not enrolled) or "Continue Learning" button (enrolled)
  - [x] 4.6 On "Enroll" click: call `useEnroll()` mutation → on success: `['enrollments', 'my']` invalidation causes `useEnrollmentStatus(courseId)` to re-derive `isEnrolled: true`, CTA automatically re-renders as "Continue Learning". No local state management needed — React Query handles the state transition.
  - [x] 4.7 On "Continue Learning" click: navigate to first lesson of the course (`/courses/${id}/lessons/${firstLessonId}`)
  - [x] 4.8 Show loading skeleton while data fetches
  - [x] 4.9 Handle 404 (course not found) with appropriate message

- [x] Task 5: Implement MyLearningPage (AC: #7, #8)
  - [x] 5.1 Use `useMyEnrollments()` hook to fetch enrolled courses
  - [x] 5.2 Render page title "My Learning" with `text-3xl font-bold`
  - [x] 5.3 If enrollments exist: render CourseCard enrolled-variant grid (same responsive grid as catalog)
  - [x] 5.4 If no enrollments: render EmptyState with `GraduationCap` icon, "No courses yet", "Start exploring courses to begin your learning journey", "Browse Courses" CTA button linking to `/courses`
  - [x] 5.5 Show Skeleton card placeholders while loading
  - [x] 5.6 Each enrolled course card links to `/courses/${courseId}` (course detail)

- [x] Task 6: Verify (AC: all)
  - [x] 6.1 Run `npm run build` in frontend — must compile cleanly
  - [x] 6.2 Run `npx tsc --noEmit` — no type errors
  - [x] 6.3 Visual verification: CourseCatalogPage shows card grid with instructor names and lesson counts
  - [x] 6.4 Visual verification: CourseDetailPage shows accordion tree, enrollment CTA works
  - [x] 6.5 Visual verification: MyLearningPage shows enrolled courses or empty state
  - [x] 6.6 Verify toast appears on enrollment and error states

### Review Findings

- [x] [Review][Patch] MyLearningPage: no error state when useMyEnrollments() fails — page renders blank body [MyLearningPage.tsx:33] — FIXED: added isError + retry button
- [x] [Review][Patch] CourseCatalogPage: error state has no retry button — user has no recovery path [CourseCatalogPage.tsx:39-45] — FIXED: added refetch + retry button
- [x] [Review][Patch] CourseDetailPage: enrollments query error not handled — enrolled student sees "Enroll" on failure [CourseDetailPage.tsx:34] — FIXED: handled via useEnroll toast fix (409 shows message + re-syncs cache)
- [x] [Review][Patch] CourseDetailPage: handleContinueLearning skips modules after first empty module instead of falling through [CourseDetailPage.tsx:46-63] — FIXED: iterates all modules to find first lesson
- [x] [Review][Patch] useEnroll: non-409 errors are silent — custom onError overrides global default toast handler [useEnrollments.ts:43-47] — FIXED: added explicit toast.error for all errors
- [x] [Review][Defer] courseId closure capture in pre-existing mutation hooks makes them unsafe if courseId changes without remount [useCourses.ts] — deferred, pre-existing
- [x] [Review][Defer] useUpdateLesson missing orderIndex in updatable fields [useCourses.ts] — deferred, pre-existing

## Dev Notes

### Critical: What Exists Already — USE, DO NOT RECREATE

**CourseCard component (`frontend/src/components/course/CourseCard.tsx`):**
- Currently a basic card showing title, description, and date. Only accepts `course: Course` and `href: string`.
- UPGRADE this component — do NOT create a new one. Add `variant` prop and additional data props.
- Current pattern: uses shadcn `Card`, `CardHeader`, `CardTitle`, `CardContent`. Full card is a `Link` wrapper.
- **Target upgraded component signature and JSX skeleton:**

```typescript
interface CourseCardProps {
  title: string;
  description: string;
  href: string;
  instructorName?: string;
  variant?: 'catalog' | 'enrolled';
  lessonCount?: number;     // catalog variant
  enrolledAt?: string;      // enrolled variant
}

// JSX structure:
// <Link to={href}>
//   <Card hover:shadow-md>
//     <CardHeader>
//       <CardTitle>{title}</CardTitle>
//       {instructorName && <p className="text-sm text-muted-foreground">{instructorName}</p>}
//     </CardHeader>
//     <CardContent>
//       <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
//     </CardContent>
//     <CardFooter>  ← ADD CardFooter import from shadcn
//       {variant === 'catalog' && <Badge variant="secondary">{lessonCount} lessons</Badge>}
//       {variant === 'enrolled' && <p className="text-xs text-muted-foreground">Enrolled {date}</p>}
//     </CardFooter>
//   </Card>
// </Link>
```

**React Query hooks (`frontend/src/hooks/useCourses.ts`):**
- Existing types: `Course` (basic, no instructor), `Lesson`, `CourseModule`
- Existing hooks: `useInstructorCourses`, `useCreateCourse`, `useUpdateCourse`, `useDeleteCourse`, `useCourseModules`, CRUD for modules/lessons
- Pattern: `useQuery` with `queryKey` arrays, `useMutation` with `onSuccess` invalidation + `onError` toast
- ADD new types and hooks to this file for catalog and course detail
- CREATE new `useEnrollments.ts` file for enrollment-specific hooks

**fetchApi (`frontend/src/lib/fetchApi.ts`):**
- Exposes `fetchApi.get<T>(url)`, `fetchApi.post<T>(url, body)`, etc.
- Auto-includes `credentials: 'include'` and `Content-Type: application/json`
- Throws parsed error objects on failure — caught by React Query's global `onError` handler

**queryClient (`frontend/src/lib/queryClient.ts`):**
- Global `onError` for mutations shows toast with error message for 5 seconds
- `staleTime: 30_000` (30 seconds), `retry: 1`, `refetchOnWindowFocus: false`
- You do NOT need to add custom `onError` to mutations unless you want specific error messages beyond the global handler

**useAuth (`frontend/src/hooks/useAuth.tsx`):**
- Provides: `user`, `isAuthenticated`, `isStudent`, `isInstructor`, `isAdmin`
- `user.id` available for identifying current user
- `logout()` clears React Query cache + redirects to `/login`

**EmptyState component (`frontend/src/components/common/EmptyState.tsx`):**
- Accepts: `icon` (React component), `title`, `description`, `action` (ReactNode)
- REUSE for My Learning empty state — pass a `<Button>` as the action prop

**Existing shadcn/ui components installed (`frontend/src/components/ui/`):**
- `accordion`, `badge`, `breadcrumb`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `progress`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `table`, `textarea`, `tooltip`
- ALL components needed for this story are already installed: `Card`, `Badge`, `Accordion`, `Skeleton`, `Button`, `Progress` (for future use)

**Routing (`frontend/src/App.tsx`):**
- Routes already defined: `/courses` → `CourseCatalogPage`, `/courses/:id` → `CourseDetailPage`, `/my-learning` → `MyLearningPage`
- All inside `ProtectedRoute` wrapper — auth is guaranteed when these pages render
- NO routing changes needed

**AppSidebar navigation (`frontend/src/components/layout/AppSidebar.tsx`):**
- Student nav items: "My Learning" (`/my-learning`), "Browse Courses" (`/courses`)
- Navigation to these pages is already wired — NO sidebar changes needed

### Backend API Contracts (from Story 3-1)

**Endpoints consumed by this story:**

| Method | Route | Response Type | Query Key |
|--------|-------|---------------|-----------|
| GET | `/api/courses` | `CourseCatalogItem[]` | `['courses', 'catalog']` |
| GET | `/api/courses/:id` | `CourseDetail` | `['courses', id]` |
| POST | `/api/enrollments/courses/:courseId` | `Enrollment` | mutation |
| GET | `/api/enrollments/my` | `EnrollmentWithCourse[]` | `['enrollments', 'my']` |

**Response shapes (from 3-1 story):**

```typescript
// GET /api/courses — catalog listing
interface CourseCatalogItem {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructor: { id: string; name: string; email: string; role: string };
  moduleCount: number;
  lessonCount: number;
  createdAt: string;
  updatedAt: string;
}

// GET /api/courses/:id — course detail with nested structure
interface CourseDetail {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructor: { id: string; name: string; email: string; role: string };
  modules: {
    id: string;
    title: string;
    orderIndex: number;
    lessons: {
      id: string;
      title: string;
      orderIndex: number;
      // NO content field
    }[];
  }[];
  createdAt: string;
  updatedAt: string;
}

// POST /api/enrollments/courses/:courseId — enrollment response
interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
}

// GET /api/enrollments/my — enrolled courses
interface EnrollmentWithCourse {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
  course: {
    id: string;
    title: string;
    description: string;
    instructorId: string;
    instructor: { id: string; name: string; email: string; role: string };
  };
}
```

### Error responses (handled by global HttpExceptionFilter):
- 401: No auth → redirect to login (handled by fetchApi + useAuth)
- 403: Wrong role → global mutation error toast
- 404: Course not found → `{ statusCode: 404, message: 'Course not found', error: 'Not Found' }`
- 409: Duplicate enrollment → `{ statusCode: 409, message: 'Already enrolled in this course', error: 'Conflict' }`

### UX Specification Details

**CourseCard variants (from UX-DR5):**

| Variant | Footer Content | Used In |
|---------|----------------|---------|
| Catalog | Lesson count badge: "12 lessons" (shadcn Badge) | CourseCatalogPage |
| Enrolled | enrolledAt date (progress bar + percentage added in Epic 4) | MyLearningPage |

**Card styling:**
- Hover: `hover:shadow-md transition-shadow cursor-pointer`
- Entire card is a clickable `Link` (existing pattern)
- Title: `h3` via `CardTitle`
- Instructor name: `text-sm text-muted-foreground`
- Description: `text-sm text-muted-foreground line-clamp-2`
- Footer: `CardFooter` with variant-specific content

**CourseCatalogPage layout:**
- Page title: "Course Catalog" (`text-3xl font-bold`)
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Designed for 2-3 seed courses — no search, no filters, no pagination

**CourseDetailPage layout:**
- Full-width: title + description + instructor at top
- Module/lesson accordion tree below (shadcn Accordion)
- "Enroll" or "Continue Learning" CTA prominent
- Accordion modules default to closed (student can expand to preview structure)
- Lessons shown as simple list items under each module (just title, ordered by orderIndex)

**MyLearningPage layout:**
- Page title: "My Learning" (`text-3xl font-bold`)
- Same responsive grid as catalog
- Empty state: `GraduationCap` icon, "No courses yet", "Browse Courses" CTA

**Enrollment flow (from UX-DR11, UX-DR19):**
- One-click "Enroll" button on course detail
- On success: button changes to "Continue Learning" on same page (NO redirect)
- Toast: "Enrolled successfully!" (3s auto-dismiss via sonner)
- "Continue Learning" navigates to first lesson: `/courses/${courseId}/lessons/${firstLessonId}`
- First lesson = first lesson of first module (ordered by module.orderIndex, then lesson.orderIndex)

**Loading states (from UX-DR15):**
- Skeleton placeholders for API calls
- 3 skeleton cards for catalog (matching grid layout)
- Skeleton header + accordion for course detail
- Never a blank page

**Toast patterns (from UX-DR12):**
- Success: `toast.success("Enrolled successfully!")` — 3s auto-dismiss
- Error: global handler shows error message — 5s, user can dismiss
- Position: bottom-right (configured in Toaster, already set up)

### "Continue Learning" Navigation Logic

When "Continue Learning" is clicked on CourseDetailPage:
1. Course detail data already loaded — access `modules[0].lessons[0].id`
2. Navigate to `/courses/${courseId}/lessons/${firstLessonId}`
3. If no modules/lessons exist (edge case): show toast "This course has no lessons yet" and don't navigate
4. Note: Progress-aware navigation (resume at first incomplete lesson) is Epic 4 scope

### Enrollment Status Check Pattern

To determine if the current user is enrolled in a specific course:
- Use `useMyEnrollments()` to get all enrollments
- Filter client-side: `enrollments.some(e => e.courseId === courseId)`
- This avoids a separate API call per course
- The enrollment check on CourseDetailPage uses the same cached data from `['enrollments', 'my']`

### What NOT To Do

**CRITICAL — React Router v7 import:**
- `import { Link, useNavigate, useParams } from 'react-router'` — NOT `react-router-dom`. React Router v7 uses the `react-router` package. Using `react-router-dom` will cause build failures.

**Dependencies:**
- Do NOT install any new npm packages — everything is already available

**Patterns:**
- Do NOT create separate API utility functions — use `fetchApi.get/post` directly in hooks
- Do NOT add `onError` callbacks to individual mutations unless you need a message different from the global handler
- Do NOT add progress bars to enrolled course cards — that's Epic 4
- Do NOT add progress-aware "Continue Learning" navigation (resume at last incomplete lesson) — that's Epic 4
- Do NOT add search, filters, or pagination to the catalog — 3 courses, not needed
- Do NOT modify AppSidebar or routing — already configured
- Do NOT create a CourseSidebar component — that's Epic 4 (LessonView)
- Do NOT implement LessonViewPage — that's Story 4.2
- Do NOT add any instructor or admin specific logic to these pages — they're accessible by all authenticated roles but designed for the student flow
- Do NOT modify `useInstructorCourses` or existing hooks — add new ones alongside

**Scope boundaries:**
- Do NOT implement lesson content viewing — Epic 4
- Do NOT implement progress tracking — Epic 4
- Do NOT modify backend code — this is a frontend-only story
- Do NOT create seed data — Epic 6
- Do NOT add breadcrumbs — Epic 6 (P1 item)

### Previous Story Intelligence (from Story 3-1)

**Story 3-1 completed successfully (backend API):**
- All 4 endpoints implemented and tested: `GET /api/courses`, `GET /api/courses/:id`, `POST /api/enrollments/courses/:courseId`, `GET /api/enrollments/my`
- `findAll()` correctly strips nested modules from catalog response, returns `moduleCount` + `lessonCount`
- `findOneWithDetails()` returns nested modules/lessons ordered by `orderIndex`, strips lesson `content`
- Enrollment has duplicate prevention (409 Conflict) and course existence check (404)
- EnrollmentsService exported for cross-module use
- Review finding: `findAll()` had a bug where modules array leaked in response — FIXED by destructuring out modules before spreading

**Patterns established in Epic 2 frontend (Stories 2-3, 2-4):**
- React Query hooks in `useCourses.ts` — add new hooks here following same pattern
- `queryKey` arrays: entity-based, hierarchical
- Mutations: `onSuccess` invalidates related queries, `onError` handled globally
- Pages: fetch in page component via hooks, pass data as props to child components
- Dialogs: controlled via `useState` for open/close
- Forms: `react-hook-form` + `zod` + shadcn Form components
- Course card: existing `CourseCard` component in `components/course/` — upgrade, don't recreate

### Project Structure Notes

**Files to create:**
```
frontend/src/hooks/useEnrollments.ts    # Enrollment React Query hooks
```

**Files to modify:**
```
frontend/src/hooks/useCourses.ts                 # Add CourseCatalogItem, CourseDetail types + useCourseCatalog, useCourseDetail hooks
frontend/src/components/course/CourseCard.tsx      # Add variant prop (catalog/enrolled), instructor name, lesson count badge
frontend/src/pages/CourseCatalogPage.tsx           # Full implementation: card grid with catalog data
frontend/src/pages/CourseDetailPage.tsx             # Full implementation: course detail + enrollment CTA
frontend/src/pages/MyLearningPage.tsx               # Full implementation: enrolled courses + empty state
```

### Key Imports Reference

**For new hooks in useCourses.ts:**
```typescript
// Types to add
export interface CourseCatalogItem {
  id: string; title: string; description: string; instructorId: string;
  instructor: { id: string; name: string; email: string; role: string };
  moduleCount: number; lessonCount: number; createdAt: string; updatedAt: string;
}

export interface CourseDetailModule {
  id: string; title: string; orderIndex: number;
  lessons: { id: string; title: string; orderIndex: number }[];
}

export interface CourseDetail {
  id: string; title: string; description: string; instructorId: string;
  instructor: { id: string; name: string; email: string; role: string };
  modules: CourseDetailModule[]; createdAt: string; updatedAt: string;
}
```

**For useEnrollments.ts:**
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetchApi';
import { toast } from 'sonner';

export interface Enrollment {
  id: string; userId: string; courseId: string; enrolledAt: string;
}

export interface EnrollmentWithCourse {
  id: string; userId: string; courseId: string; enrolledAt: string;
  course: {
    id: string; title: string; description: string; instructorId: string;
    instructor: { id: string; name: string; email: string; role: string };
  };
}
```

**For CourseCatalogPage:**
```typescript
import { useCourseCatalog } from '@/hooks/useCourses';
import { CourseCard } from '@/components/course/CourseCard';
import { Skeleton } from '@/components/ui/skeleton';
```

**For CourseDetailPage:**
```typescript
import { useParams, useNavigate } from 'react-router';
import { useCourseDetail } from '@/hooks/useCourses';
import { useMyEnrollments, useEnroll } from '@/hooks/useEnrollments';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
```

**For MyLearningPage:**
```typescript
import { useNavigate } from 'react-router';
import { useMyEnrollments } from '@/hooks/useEnrollments';
import { CourseCard } from '@/components/course/CourseCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap } from 'lucide-react';
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.2 Acceptance Criteria, lines 519-558]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture: React Query v5, fetchApi, React Router v7]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend structure: src/pages/, src/components/course/, src/hooks/]
- [Source: _bmad-output/planning-artifacts/architecture.md — React Query patterns: entity-based query keys, invalidate on mutation success]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — UX-DR5: CourseCard variants (catalog + enrolled)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — UX-DR6: EmptyState for My Learning]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — UX-DR11: Enrollment flow (one-click, no redirect)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — UX-DR15: Skeleton loading states]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — UX-DR19: Enrollment-aware CTA]
- [Source: _bmad-output/implementation-artifacts/3-1-course-catalog-enrollment-api.md — API response shapes, error responses]
- [Source: frontend/src/hooks/useCourses.ts — Existing React Query hook patterns]
- [Source: frontend/src/components/course/CourseCard.tsx — Existing CourseCard to upgrade]
- [Source: frontend/src/components/common/EmptyState.tsx — Reusable empty state component]
- [Source: frontend/src/lib/fetchApi.ts — API client with credentials: 'include']
- [Source: frontend/src/App.tsx — Routes already configured for /courses, /courses/:id, /my-learning]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No blockers encountered. Build and type check passed cleanly on first attempt.

### Completion Notes List

- Added `CourseCatalogItem`, `CourseDetailModule`, `CourseDetail` types to `useCourses.ts`
- Added `useCourseCatalog()` and `useCourseDetail(id)` hooks to `useCourses.ts`
- Created `useEnrollments.ts` with `Enrollment`, `EnrollmentWithCourse` types and `useMyEnrollments()`, `useEnroll()`, `useEnrollmentStatus()` hooks
- `useEnroll()` mutation invalidates `['enrollments', 'my']` and `['courses', 'catalog']` on success, toasts "Enrolled successfully!"; on 409 error invalidates `['enrollments', 'my']` to re-sync
- Upgraded `CourseCard` from `{ course: Course; href }` to flat props with `variant`, `instructorName`, `lessonCount`, `enrolledAt`; added `CardFooter` with Badge (catalog) or date text (enrolled)
- Updated `MyCoursesPage` to use new flat CourseCard props (no behavior change)
- `CourseCatalogPage`: 3-col responsive grid, skeleton loading, error/empty state, catalog-variant CourseCards with instructor name and lesson count badge
- `CourseDetailPage`: course header, Accordion module/lesson tree ordered by `orderIndex`, enrollment-aware CTA (Enroll/Continue Learning), React Query-driven state transition (no local state), skeleton loading, 404 handling; "Continue Learning" navigates to first lesson with toast fallback if no lessons
- `MyLearningPage`: enrolled-variant grid, GraduationCap EmptyState with "Browse Courses" CTA, skeleton loading
- `npx tsc --noEmit` — 0 errors; `npm run build` — clean build (1.68s)

### File List

- `frontend/src/hooks/useCourses.ts` (modified)
- `frontend/src/hooks/useEnrollments.ts` (created)
- `frontend/src/components/course/CourseCard.tsx` (modified)
- `frontend/src/pages/MyCoursesPage.tsx` (modified — updated CourseCard call site)
- `frontend/src/pages/CourseCatalogPage.tsx` (modified)
- `frontend/src/pages/CourseDetailPage.tsx` (modified)
- `frontend/src/pages/MyLearningPage.tsx` (modified)

## Change Log

- 2026-03-25: Story 3-2 implemented — Course Discovery & Enrollment UI complete. New hooks (useCourseCatalog, useCourseDetail, useMyEnrollments, useEnroll, useEnrollmentStatus), upgraded CourseCard with catalog/enrolled variants, full implementations of CourseCatalogPage, CourseDetailPage, and MyLearningPage. Build clean, 0 type errors.

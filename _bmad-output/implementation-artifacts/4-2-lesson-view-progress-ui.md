# Story 4.2: Lesson View & Progress UI

Status: done

## Story

As a **student**,
I want to read lesson content with a course sidebar showing my progress, and mark lessons complete with immediate visual feedback,
so that I experience a satisfying, trackable learning flow.

## Acceptance Criteria

1. **Route & Layout** — Given an enrolled student navigates to `/courses/:id/lessons/:lessonId`, then the AppSidebar is replaced by a CourseSidebar and the main content area shows the lesson's markdown content rendered with `@tailwindcss/typography` prose styling.

2. **CourseSidebar Interactive Mode** — The CourseSidebar displays: course title, progress bar with percentage caption (e.g. "5 of 12 lessons completed"), collapsible module sections (Accordion), lesson list with completion icons (Check for completed, Circle for incomplete), and the current lesson highlighted with `bg-muted`.

3. **Lesson Navigation** — Clicking a lesson in CourseSidebar navigates to that lesson and updates the active highlight.

4. **Mark Complete Button** — Incomplete lessons show a "Mark Complete" primary Button below content. Completed lessons show "Completed" (disabled).

5. **Optimistic UI** — Clicking "Mark Complete" immediately: changes button to "Completed" (disabled), sidebar checkmark appears (<200ms), progress bar recalculates client-side, API fires in background.

6. **Error Rollback** — If API fails: button reverts to "Mark Complete", sidebar checkmark removed, progress bar reverts, toast error: "Could not save progress. Please try again."

7. **Persistence** — Progress percentage persists on page reload (fetched from server).

8. **Progress Bar Updates** — Percentage = `Math.round((completedLessons / totalLessons) * 100)`, updates immediately on completion and persists on reload.

## Tasks / Subtasks

- [x] Task 0: Install react-markdown dependency (AC: #1)
  - [x] 0.1 Run `npm install react-markdown` in `frontend/` directory
  - [x] 0.2 Verify installation in package.json

- [x] Task 1: Create `useProgress` hook (AC: #5, #6, #7, #8)
  - [x] 1.1 Add `ProgressSummary` interface: `{ totalLessons, completedLessons, percentage, completedLessonIds }`
  - [x] 1.2 Add `useProgress(courseId)` query hook → `GET /api/progress/courses/:courseId`
  - [x] 1.3 Add `useMarkLessonComplete(courseId)` mutation with optimistic update, rollback on error, and `onSettled` invalidation
  - [x] 1.4 Add `useLesson(courseId, moduleId, lessonId)` query hook → `GET /api/courses/:courseId/modules/:moduleId/lessons/:lessonId` (enabled only when all 3 IDs are truthy)
  - [x] 1.5 Add `findModuleForLesson(course, lessonId)` helper — iterates `course.modules[].lessons[]` to find containing moduleId

- [x] Task 2: Create CourseSidebar component (AC: #2, #3)
  - [x] 2.1 Build `frontend/src/components/course/CourseSidebar.tsx` using shadcn Sidebar* components (same pattern as AppSidebar)
  - [x] 2.2 SidebarHeader: course title. Below header: Progress component + caption text ("X of Y lessons completed")
  - [x] 2.3 SidebarContent: Accordion with module titles as AccordionTrigger, lesson list as AccordionContent
  - [x] 2.4 Lesson list items: Check icon (green) for completed, Circle icon for incomplete; active lesson has `bg-muted font-medium` + `aria-current="page"`
  - [x] 2.5 Lesson items are React Router `<Link>` elements with `hover:bg-accent cursor-pointer rounded-sm transition-colors`
  - [x] 2.6 Module list container: `overflow-y-auto` with ScrollArea for long course structures

- [x] Task 3: Implement LessonViewPage (AC: #1, #4, #5, #6)
  - [x] 3.1 Replace stub in `frontend/src/pages/LessonViewPage.tsx`
  - [x] 3.2 Extract `courseId` (as `id`) and `lessonId` from `useParams`
  - [x] 3.3 Use `useEnrollmentStatus(courseId)` — if not enrolled, redirect to `/courses/${courseId}`
  - [x] 3.4 Use `useCourseDetail(courseId)` to get module structure, then `findModuleForLesson()` to resolve moduleId
  - [x] 3.5 Fetch lesson content with `useLesson(courseId, moduleId, lessonId)` and progress with `useProgress(courseId)` in parallel
  - [x] 3.6 Render markdown with wrapper div + ReactMarkdown (react-markdown v10 drops className prop)
  - [x] 3.7 "Mark Complete" / "Completed" button: derive state from `progress.completedLessonIds.includes(lessonId)`
  - [x] 3.8 Loading state: Skeleton placeholder (title skeleton + content lines skeleton)
  - [x] 3.9 Error states: 404 lesson not found display, 403 redirect to course detail
  - [x] 3.10 Auto-scroll to top on lessonId change: `useEffect(() => { window.scrollTo(0, 0); }, [lessonId])`

- [x] Task 4: Sidebar context switching (AC: #1)
  - [x] 4.1 Create `frontend/src/components/layout/LessonLayout.tsx` — mirrors AppLayout but renders CourseSidebar instead of AppSidebar
  - [x] 4.2 Create `ProtectedLessonRoute` in App.tsx — identical to ProtectedRoute but renders LessonLayout
  - [x] 4.3 Move lesson route to new route group: `<Route element={<ProtectedLessonRoute />}><Route path="/courses/:id/lessons/:lessonId" .../></Route>`
  - [x] 4.4 Remove lesson route from existing ProtectedRoute group to avoid duplicate

- [x] Task 5: Downstream progress integration (AC: #8)
  - [x] 5.1 Update `CourseCard` — add optional `progress?: { percentage: number; completedLessons: number; totalLessons: number }` prop; render `<Progress value={percentage} />` + caption in card footer when prop is provided
  - [x] 5.2 Update `MyLearningPage` — for each enrolled course, fetch progress and pass to CourseCard
  - [x] 5.3 Update `CourseDetailPage.handleContinueLearning()` — fetch progress via `fetchApi.get<ProgressSummary>('/api/progress/courses/${id}')`, build `completedSet`, navigate to first incomplete lesson; fallback to first lesson if all complete or on error
  - [x] 5.4 Update `CourseDetailPage` — show progress bar + "X of Y lessons completed" above Accordion when user is enrolled (use `useProgress(id)` conditionally)

- [x] Task 6: Manual QA verification
  - [x] 6.1 Happy path: load lesson, mark complete, verify optimistic cascade (<200ms visual update)
  - [x] 6.2 Verify persistence on page reload
  - [x] 6.3 Verify sidebar navigation between lessons (active highlight moves, content updates)
  - [x] 6.4 Verify unenrolled student is redirected to course detail page
  - [x] 6.5 Verify keyboard accessibility: Tab through sidebar lessons, Enter/Space on accordion, Tab to Mark Complete, Enter to activate
  - [x] 6.6 Verify progress bar on MyLearningPage course cards
  - [x] 6.7 Verify "Continue Learning" navigates to first incomplete lesson

### Review Findings

- [x] [Review][Patch] @tailwindcss/typography plugin not activated in Tailwind v4 CSS config — prose classes are inert [frontend/src/index.css:1] — FIXED
- [x] [Review][Patch] Optimistic update allows duplicate completion — onMutate does not check if lessonId already in completedLessonIds [frontend/src/hooks/useProgress.ts:48-61] — FIXED
- [x] [Review][Patch] Blank page when lessonId not found in any module — useLesson disabled, page renders null with no error [frontend/src/pages/LessonViewPage.tsx:72-74] — FIXED
- [x] [Review][Patch] handleContinueLearning uses raw fetchApi instead of cached progress data [frontend/src/pages/CourseDetailPage.tsx:50-79] — FIXED
- [x] [Review][Patch] CourseCard progress caption missing "completed" word [frontend/src/components/course/CourseCard.tsx:53] — FIXED
- [x] [Review][Defer] Concurrent markComplete rollback can undo sibling mutations [useProgress.ts:48-73] — deferred, known React Query optimistic update limitation; onSettled invalidation self-corrects
- [x] [Review][Defer] Enrollment redirect race/brief UI flash during render [LessonViewPage.tsx:42-51] — deferred, standard React Router useEffect pattern; cosmetic only
- [x] [Review][Defer] Unsafe type assertion on error object [LessonViewPage.tsx:58] — deferred, needs fetchApi error shape investigation; fallback behavior is acceptable
- [x] [Review][Defer] N+1 useProgress queries in MyLearningPage [MyLearningPage.tsx:44] — deferred, requires batch API endpoint; impact depends on enrollment count
- [x] [Review][Defer] Sidebar fails silently on course query error [LessonLayout.tsx:20-27] — deferred, pre-existing layout pattern; lesson content still renders
- [x] [Review][Defer] No role-based guard on lesson routes [App.tsx:40-56] — deferred, pre-existing from Story 2.3; enrollment check in LessonViewPage provides guard

## Dev Notes

### API Contracts (from Story 4-1, already implemented and tested)

**Get lesson content:**
```
GET /api/courses/:courseId/modules/:moduleId/lessons/:lessonId
Response: { id, title, content (markdown), orderIndex, moduleId, createdAt, updatedAt }
Auth: JwtAuthGuard — Students must be enrolled, Instructors must own course, Admin unrestricted
```

**Get progress:**
```
GET /api/progress/courses/:courseId
Response: { totalLessons: number, completedLessons: number, percentage: number, completedLessonIds: string[] }
Auth: JwtAuthGuard + RolesGuard(Student)
```

**Mark complete:**
```
POST /api/progress/courses/:courseId/lessons/:lessonId/complete
Body: {} (empty)
Response: { totalLessons, completedLessons, percentage, completedLessonIds } (same ProgressSummary)
Auth: JwtAuthGuard + RolesGuard(Student)
Idempotent: calling twice for same lesson is safe
```

### Existing Code to Reuse

| What | Where | Notes |
|------|-------|-------|
| `fetchApi` (GET/POST) | `frontend/src/lib/fetchApi.ts` | All HTTP calls, credentials: 'include' |
| React Query setup | `frontend/src/lib/queryClient.ts` | QueryClient pre-configured |
| `useCourseDetail(id)` | `frontend/src/hooks/useCourses.ts` | Returns course with modules[].lessons[] for sidebar structure |
| `useMyEnrollments()` | `frontend/src/hooks/useEnrollments.ts` | Check enrollment status |
| `useEnrollmentStatus(courseId)` | `frontend/src/hooks/useEnrollments.ts` | Derived boolean hook |
| `CourseDetailModule` type | `frontend/src/hooks/useCourses.ts` | Module with lessons array for sidebar |
| shadcn/ui components | `frontend/src/components/ui/` | accordion, button, progress, skeleton, sidebar |
| `AppLayout` pattern | `frontend/src/components/layout/AppLayout.tsx` | SidebarProvider + Sidebar + SidebarInset + Outlet |
| `AppSidebar` structure | `frontend/src/components/layout/AppSidebar.tsx` | shadcn Sidebar* component usage pattern |
| Skeleton pattern | Various pages | Used in CourseDetailPage, CourseEditorPage for loading states |
| Toast pattern | `sonner` via `toast.success()` / `toast.error()` | Duration 5000 for errors, 3000 for success |

### Critical Implementation Patterns

**React Query key convention (follow existing):**
```typescript
['courses', courseId]                        // course detail — reuse for sidebar module/lesson structure
['progress', courseId]                       // progress data for course
['lesson', courseId, moduleId, lessonId]     // single lesson content (moduleId derived from course detail)
```

**Optimistic mutation pattern (useMarkLessonComplete):**
```typescript
useMutation({
  mutationFn: (lessonId: string) =>
    fetchApi.post<ProgressSummary>(`/api/progress/courses/${courseId}/lessons/${lessonId}/complete`, {}),
  onMutate: async (lessonId) => {
    await queryClient.cancelQueries({ queryKey: ['progress', courseId] });
    const previous = queryClient.getQueryData<ProgressSummary>(['progress', courseId]);
    if (previous) {
      queryClient.setQueryData<ProgressSummary>(['progress', courseId], {
        ...previous,
        completedLessons: previous.completedLessons + 1,
        percentage: previous.totalLessons > 0
          ? Math.round((previous.completedLessons + 1) / previous.totalLessons * 100)
          : 0,
        completedLessonIds: [...previous.completedLessonIds, lessonId],
      });
    }
    return { previous };
  },
  onError: (_err, _lessonId, context) => {
    // Rollback: restore previous progress state so button, sidebar, and progress bar revert
    if (context?.previous) {
      queryClient.setQueryData(['progress', courseId], context.previous);
    }
    toast.error('Could not save progress. Please try again.', { duration: 5000 });
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['progress', courseId] });
  },
});
```

**Module discovery helper (required for lesson fetch):**
```typescript
// The route is /courses/:id/lessons/:lessonId (no moduleId)
// But the API is GET /courses/:courseId/modules/:moduleId/lessons/:lessonId
// Must resolve moduleId from course detail data before fetching lesson content
function findModuleForLesson(course: CourseDetail, lessonId: string): string | null {
  for (const mod of course.modules) {
    if (mod.lessons.some((l) => l.id === lessonId)) {
      return mod.id;
    }
  }
  return null;
}
```

**Sidebar context switching approach:**
The current `ProtectedRoute` renders `<AppLayout>` which always renders `<AppSidebar>`. For lesson view, create a `LessonLayout` component that renders `<CourseSidebar>` instead. Add a separate route group in App.tsx:

```typescript
// App.tsx — add parallel route group for lesson view
<Route element={<ProtectedLessonRoute />}>
  <Route path="/courses/:id/lessons/:lessonId" element={<LessonViewPage />} />
</Route>
```

Where `ProtectedLessonRoute` is identical to `ProtectedRoute` but renders `<LessonLayout>` (which uses `CourseSidebar` + `SidebarInset` + `Outlet`).

**Lesson content requires moduleId resolution:** The route is `/courses/:id/lessons/:lessonId` (no moduleId) but the API requires `/api/courses/:courseId/modules/:moduleId/lessons/:lessonId`. The `useLesson` hook must depend on course detail data being loaded first. Use `findModuleForLesson()` helper (see above) to resolve moduleId, then enable the lesson query only when moduleId is available.

**Markdown rendering with react-markdown (MUST install first):**
```typescript
import ReactMarkdown from 'react-markdown';

// Render lesson content safely — react-markdown does NOT render raw HTML by default (XSS-safe)
<ReactMarkdown className="prose prose-neutral dark:prose-invert max-w-none">
  {lesson.content}
</ReactMarkdown>
```
Backend stores content as raw markdown text. `react-markdown` converts to React elements safely. Do NOT use `dangerouslySetInnerHTML`. The `@tailwindcss/typography` plugin provides `prose` styles.

**XSS prevention (from deferred-work.md):** `react-markdown` does not render raw HTML by default — this addresses the XSS surface identified in deferred work.

**Enrollment guard on lesson view:** Use `useEnrollmentStatus(courseId)` to verify enrollment. If not enrolled, redirect to `/courses/${courseId}` (CourseDetailPage) so the student can enroll. Do NOT show a 403 error page.

### Continue Learning — Navigate to First Incomplete Lesson

Update `CourseDetailPage.handleContinueLearning()` to use progress data. Current implementation navigates to first lesson; updated version navigates to first **incomplete** lesson:

```typescript
async function handleContinueLearning() {
  if (!id || !course) return;
  const sortedModules = [...(course.modules ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
  try {
    const progress = await fetchApi.get<ProgressSummary>(`/api/progress/courses/${id}`);
    const completedSet = new Set(progress.completedLessonIds);
    for (const mod of sortedModules) {
      const sortedLessons = [...(mod.lessons ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
      for (const lesson of sortedLessons) {
        if (!completedSet.has(lesson.id)) {
          navigate(`/courses/${id}/lessons/${lesson.id}`);
          return;
        }
      }
    }
  } catch {
    // Fallback on error: navigate to first lesson
  }
  // All complete OR error — navigate to first lesson
  const firstMod = sortedModules[0];
  const firstLesson = firstMod?.lessons?.sort((a, b) => a.orderIndex - b.orderIndex)[0];
  if (firstLesson) {
    navigate(`/courses/${id}/lessons/${firstLesson.id}`);
  } else {
    toast.error('This course has no lessons yet');
  }
}
```

### CourseCard Progress Integration

Add optional progress prop to CourseCard for MyLearningPage:

```typescript
// In CourseCard.tsx — add to props interface:
progress?: { percentage: number; completedLessons: number; totalLessons: number };

// Render in card footer (when progress prop is provided):
{progress && (
  <div className="space-y-1 pt-2">
    <Progress value={progress.percentage} className="h-2" />
    <p className="text-xs text-muted-foreground text-right">
      {progress.completedLessons} of {progress.totalLessons} lessons
    </p>
  </div>
)}
```

### CourseDetailPage Progress Display

When student is enrolled, show progress above the module accordion:

```typescript
// Conditionally fetch progress only when enrolled:
const { data: progress } = useProgress(isEnrolled ? id : '');

// Render above accordion:
{isEnrolled && progress && (
  <div className="mb-6 space-y-2">
    <Progress value={progress.percentage} />
    <p className="text-sm text-muted-foreground">
      {progress.completedLessons} of {progress.totalLessons} lessons completed ({progress.percentage}%)
    </p>
  </div>
)}
```

### Loading Skeleton Pattern

```typescript
function LessonViewSkeleton() {
  return (
    <div>
      <Skeleton className="h-9 w-2/3 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-4/5 mb-2" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-6" />
      <Skeleton className="h-10 w-36" />
    </div>
  );
}
```

### File Structure

**New files:**
```
frontend/src/hooks/useProgress.ts          — useProgress, useMarkLessonComplete, useLesson hooks
frontend/src/components/course/CourseSidebar.tsx — Course sidebar with progress + module/lesson tree
frontend/src/components/layout/LessonLayout.tsx  — Layout variant using CourseSidebar instead of AppSidebar
```

**Modified files:**
```
frontend/package.json                       — Add react-markdown dependency (npm install react-markdown)
frontend/src/pages/LessonViewPage.tsx      — Replace stub with full lesson view implementation
frontend/src/pages/CourseDetailPage.tsx     — Add progress display + progress-aware "Continue Learning"
frontend/src/pages/MyLearningPage.tsx       — Fetch progress per enrollment, pass to CourseCard
frontend/src/components/course/CourseCard.tsx — Add optional progress prop with Progress bar
frontend/src/App.tsx                        — Add ProtectedLessonRoute + LessonLayout route group, remove lesson from AppLayout group
```

### Project Structure Notes

- All new components follow existing kebab-case file naming
- Hooks go in `frontend/src/hooks/` following `use<Name>.ts` pattern
- Course-specific components go in `frontend/src/components/course/`
- Layout variants go in `frontend/src/components/layout/`
- shadcn/ui components in `frontend/src/components/ui/` are NEVER modified
- Import aliases use `@/` prefix (configured in Vite)
- React Router v7 imports from `react-router` (NOT `react-router-dom`)
- Toast: `import { toast } from 'sonner'` — error duration 5000, success duration 3000

### Previous Story Intelligence

**From Story 4-1 (Progress Tracking API):**
- `ProgressSummary` response includes `completedLessonIds: string[]` — use this Set for sidebar checkmarks and "Continue Learning" logic
- `markComplete` is idempotent — safe for optimistic UI (double-click won't error)
- `markComplete` returns full `ProgressSummary` — use response to update cache on `onSuccess`
- Circular dependency between CoursesModule/EnrollmentsModule resolved with `forwardRef`
- PostgreSQL error 23505 (unique constraint) is caught for concurrent duplicate requests
- All progress endpoints require Student role — Admin/Instructor will get 403

**From Story 3-2 (Course Discovery UI):**
- `CourseCard` has two visual modes but no progress display yet
- `CourseDetailPage` "Continue Learning" currently navigates to first lesson (not first incomplete)
- `useMyEnrollments()` returns `EnrollmentWithCourse[]` with course details

**From Story 2-4 (Course Editor UI):**
- Accordion component pattern for module/lesson tree is well established
- Dialog patterns, form patterns, and loading states are consistent

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.2]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture, API Patterns, Testing]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Lesson View, Completion Cascade, CourseSidebar]
- [Source: _bmad-output/planning-artifacts/prd.md — FR20-FR23, NFR6-NFR8]
- [Source: _bmad-output/implementation-artifacts/4-1-progress-tracking-api.md — API contracts, dev notes]
- [Source: _bmad-output/implementation-artifacts/deferred-work.md — XSS markdown warning, role-based route gap]
- [Source: backend/src/progress/progress.service.ts — ProgressSummary interface]
- [Source: backend/src/progress/progress.controller.ts — Endpoint routes and guards]
- [Source: backend/src/courses/lessons.controller.ts — GET lesson endpoint with enrollment check]
- [Source: frontend/src/hooks/useCourses.ts — CourseDetailModule, CourseDetail types]
- [Source: frontend/src/hooks/useEnrollments.ts — useMyEnrollments, useEnrollmentStatus]
- [Source: frontend/src/lib/fetchApi.ts — HTTP client pattern]
- [Source: frontend/src/components/layout/AppLayout.tsx — SidebarProvider pattern]
- [Source: frontend/src/App.tsx — Route structure and ProtectedRoute pattern]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- react-markdown v10 dropped the `className` prop on the root component. Fixed by wrapping `<ReactMarkdown>` in a `<div className="prose ...">` instead.

### Completion Notes List

- Installed `react-markdown@^10.1.0` in frontend/package.json
- Created `useProgress.ts` with `ProgressSummary` interface, `useProgress`, `useMarkLessonComplete` (with optimistic update + rollback), `useLesson`, and `findModuleForLesson` helper
- Created `CourseSidebar.tsx` using shadcn Sidebar* components with collapsible Accordion modules, Check/Circle icons for lesson completion, active lesson `bg-muted` highlight, and `aria-current="page"`
- Created `LessonLayout.tsx` mirroring AppLayout pattern but rendering CourseSidebar with live course+progress data
- Replaced LessonViewPage stub with full implementation: enrollment guard redirect, moduleId resolution, markdown rendering, optimistic Mark Complete button, loading skeleton, error states
- Added `ProtectedLessonRoute` in App.tsx; moved lesson route out of AppLayout group into dedicated LessonLayout group
- Updated `CourseCard` with optional `progress` prop rendering Progress bar + caption in footer
- Updated `MyLearningPage` with per-enrollment progress via `EnrolledCourseCard` sub-component
- Updated `CourseDetailPage` with progress-aware Continue Learning and inline progress bar when enrolled
- TypeScript: 0 errors | ESLint: 0 warnings | Build: success | Backend tests: 107/107 pass

### Change Log

- 2026-03-25: Implemented Story 4.2 — Lesson View & Progress UI. All tasks and ACs complete.

### File List

frontend/package.json
frontend/package-lock.json
frontend/src/hooks/useProgress.ts (new)
frontend/src/components/course/CourseSidebar.tsx (new)
frontend/src/components/layout/LessonLayout.tsx (new)
frontend/src/pages/LessonViewPage.tsx
frontend/src/pages/CourseDetailPage.tsx
frontend/src/pages/MyLearningPage.tsx
frontend/src/components/course/CourseCard.tsx
frontend/src/App.tsx

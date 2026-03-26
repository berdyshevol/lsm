# Story 6.2: UX Polish & Breadcrumbs

Status: done

## Story

As an interviewer,
I want breadcrumbs for orientation, a read-only course preview sidebar, and graceful cold start handling,
so that the application feels considered and complete during evaluation.

## Acceptance Criteria

1. **Breadcrumbs on nested pages** — A dynamic `Breadcrumbs` component renders on pages with depth > 1, showing a trail built from route params (e.g., `Courses > NestJS Basics > Module 1 > Lesson 3`). Each segment except the current page is a clickable link navigating up the hierarchy.

2. **Read-only CourseSidebar on course detail** — When an unenrolled student views `/courses/:id`, the module/lesson accordion tree renders as a read-only `CourseSidebar` preview: structure visible, no checkmarks, lessons non-clickable. This lets the student see what they're committing to before enrollment.

3. **Cold start message on login** — When the backend takes >3 seconds to respond on first visit, an honest info message appears: "Server is waking up (free tier hosting) — this takes ~30 seconds on first visit." Implemented as an inline status message on the login page.

4. **Cold start message dismissal** — When the backend responds successfully, the cold start message disappears and the login page functions normally.

## Tasks / Subtasks

- [x] Task 1: Create `Breadcrumbs` layout component (AC: #1)
  - [x] 1.1 Create `frontend/src/components/layout/Breadcrumbs.tsx` using shadcn `Breadcrumb*` primitives from `@/components/ui/breadcrumb`
  - [x] 1.2 Build route-to-breadcrumb mapping for all nested routes (see Dev Notes for complete mapping table)
  - [x] 1.3 For `/courses/:id` and `/courses/:id/lessons/:lessonId`, resolve entity names from React Query cache via `queryClient.getQueryData` — do NOT make new API calls
  - [x] 1.4 For `/courses/:id/lessons/:lessonId`, derive module name by finding the module containing the lesson in the cached `CourseDetail`
  - [x] 1.5 Use `<Link>` from `react-router` inside `<BreadcrumbLink asChild>` for SPA navigation
  - [x] 1.6 Hide breadcrumbs on top-level pages (depth <= 1) — return `null`
  - [x] 1.7 Hide breadcrumbs on mobile (`hidden lg:block` wrapper) per UX spec responsive strategy

- [x] Task 2: Integrate Breadcrumbs into layouts (AC: #1)
  - [x] 2.1 Add `<Breadcrumbs />` to `AppLayout.tsx` above `<Outlet />` inside the `max-w-5xl` container, with `mb-4` spacing
  - [x] 2.2 Add `<Breadcrumbs />` to `LessonLayout.tsx` above `<Outlet />` inside the `max-w-3xl` container, with `mb-4` spacing

- [x] Task 3: Add read-only mode to `CourseSidebar` (AC: #2)
  - [x] 3.1 Add `mode?: 'interactive' | 'readonly'` prop to `CourseSidebar` (default: `'interactive'`)
  - [x] 3.2 Make `lessonId` and `progress` optional: `lessonId?: string; progress?: ProgressSummary`. In interactive mode, `lessonId` is expected (drives active state); in readonly mode, it's unused. Guard `isActive` computation: `const isActive = lessonId ? lesson.id === lessonId : false`
  - [x] 3.3 In readonly mode: render lessons as plain `<span>` instead of `<Link>`, no `cursor-pointer`, no hover effect
  - [x] 3.4 In readonly mode: hide completion icons (Check/Circle) entirely — show structure only
  - [x] 3.5 In readonly mode: hide progress bar and progress text in `SidebarHeader`
  - [x] 3.6 Keep accordion expand/collapse working in readonly mode — interviewers can still browse the structure

- [x] Task 4: Integrate read-only CourseSidebar on CourseDetailPage (AC: #2)
  - [x] 4.1 Create `CourseDetailLayout` in `frontend/src/components/layout/CourseDetailLayout.tsx` — mirrors `LessonLayout` but passes `mode="readonly"` to `CourseSidebar` and omits `lessonId`/`progress` props
  - [x] 4.2 In `App.tsx`, move `/courses/:id` route from `ProtectedRoute` to a new `ProtectedCourseDetailRoute` that wraps with `CourseDetailLayout` (pattern: copy `ProtectedLessonRoute` but use `CourseDetailLayout`)
  - [x] 4.3 Remove the inline accordion tree from `CourseDetailPage.tsx` (lines 124-146) — the readonly sidebar now provides this view
  - [x] 4.4 `CourseDetailLayout` fetches course data via `useCourseDetail(courseId)` and renders `<CourseSidebar mode="readonly" courseId={courseId} course={course} />` in the sidebar slot

- [x] Task 5: Cold start handling on LoginPage (AC: #3, #4)
  - [x] 5.1 Add cold start detection in `LoginPage.tsx`: start a 3s timer on mount; if `useAuth().isLoading` is still `true` after 3s, set `showColdStart` to `true`. CRITICAL: clean up the timer in effect cleanup (`return () => clearTimeout(timer)`) to prevent memory leaks. When `isLoading` becomes `false`, set `showColdStart` to `false`.
  - [x] 5.2 Display inline info message below the Card: "Server is waking up (free tier hosting) — this takes ~30 seconds on first visit"
  - [x] 5.3 Style with `text-sm text-muted-foreground` and an `Info` icon from lucide-react, centered, with `mt-4`
  - [x] 5.4 Dismiss the message once the backend responds (AuthProvider `isLoading` becomes `false`)
  - [x] 5.5 Also handle cold start during login submission: if the login POST takes >3s, show `toast.info("Server is waking up...")` via sonner (auto-dismiss when login completes)

- [x] Task 6: Verify all changes (all ACs)
  - [x] 6.1 Verify breadcrumbs display correctly on: `/courses/:id`, `/courses/:id/lessons/:lessonId`, `/my-courses/:id/edit`, `/admin/users`, `/admin/courses`
  - [x] 6.2 Verify breadcrumbs are hidden on: `/my-learning`, `/my-courses`, `/courses` (top-level pages)
  - [x] 6.3 Verify read-only sidebar renders on course detail for unenrolled student (structure only, no interaction)
  - [x] 6.4 Verify cold start message appears and dismisses correctly
  - [x] 6.5 Run `npm run lint && npx tsc --noEmit` in `frontend/` — zero errors
  - [x] 6.6 Run `npm run build` in `frontend/` — successful production build

## Dev Notes

### Breadcrumb Route Mapping

| Route | Breadcrumb Trail | Notes |
|---|---|---|
| `/login`, `/register` | (none) | Public pages — Breadcrumbs not rendered (outside AppLayout) |
| `/my-learning` | (none) | Top level — return `null` |
| `/my-courses` | (none) | Top level — return `null` |
| `/courses` | (none) | Top level — return `null` |
| `/courses/:id` | `Courses` > `{course.title}` | Link: `/courses` |
| `/courses/:id/lessons/:lessonId` | `Courses` > `{course.title}` > `{module.title}` > `{lesson.title}` | Links: `/courses`, `/courses/:id` |
| `/my-courses/:id/edit` | `My Courses` > `Edit: {course.title}` | Link: `/my-courses` |
| `/admin/users` | `Admin` > `Users` | "Admin" is label only (no link) |
| `/admin/courses` | `Admin` > `Courses` | "Admin" is label only (no link) |

### Resolving Entity Names in Breadcrumbs

The `Breadcrumbs` component must resolve course/module/lesson titles WITHOUT making additional API calls. Use React Query's `useQueryClient()` + `queryClient.getQueryData()`:

```typescript
// For /courses/:id — get course title:
const course = queryClient.getQueryData<CourseDetail>(['courses', courseId]);
// course?.title → "NestJS Basics"

// For /courses/:id/lessons/:lessonId — get module + lesson titles:
const course = queryClient.getQueryData<CourseDetail>(['courses', courseId]);
// Find lesson in course.modules:
const module = course?.modules.find(m => m.lessons.some(l => l.id === lessonId));
const lesson = module?.lessons.find(l => l.id === lessonId);
// module?.title → "Module 1", lesson?.title → "Lesson 3"
```

If cache is empty (direct URL navigation), show the route param ID as fallback text. The page component's own `useCourseDetail(id)` query will populate the cache. Since Breadcrumbs uses `useQueryClient()` which triggers re-renders when cache updates, the breadcrumb will automatically update with entity names once data loads. Always guard: `if (!courseId) return null` before cache lookups. `getQueryData()` returns `undefined` when cache key doesn't exist.

### Existing shadcn Breadcrumb Primitives

The shadcn breadcrumb component is already installed at `frontend/src/components/ui/breadcrumb.tsx`. Use these exports:
- `Breadcrumb` — `<nav aria-label="breadcrumb">` wrapper
- `BreadcrumbList` — `<ol>` with flex styling
- `BreadcrumbItem` — `<li>` wrapper
- `BreadcrumbLink` — clickable link (supports `asChild` for React Router `<Link>`)
- `BreadcrumbPage` — current page (non-clickable, `aria-current="page"`)
- `BreadcrumbSeparator` — chevron separator (auto-renders `ChevronRightIcon`)

### CourseSidebar Read-Only Mode

Current `CourseSidebar` component at `frontend/src/components/course/CourseSidebar.tsx`:
- Props: `{ courseId: string; lessonId: string; course: CourseDetail; progress: ProgressSummary | undefined }`
- Renders module/lesson tree with clickable links and completion icons

For readonly mode:
- Add `mode?: 'interactive' | 'readonly'` prop (default `'interactive'` for backward compatibility)
- Make `lessonId` optional: `lessonId?: string`. Guard active state: `const isActive = lessonId ? lesson.id === lessonId : false`
- Make `progress` optional: `progress?: ProgressSummary | undefined` (already `| undefined` in current type, just make the prop itself optional)
- In readonly: replace `<Link>` with `<span>`, remove hover/cursor styles, hide Check/Circle icons, hide progress bar
- Keep accordion behavior (expand/collapse modules) — this shows interviewers the component is still functional
- Updated interface: `interface CourseSidebarProps { courseId: string; course: CourseDetail; mode?: 'interactive' | 'readonly'; lessonId?: string; progress?: ProgressSummary; }`

### Cold Start Detection Pattern

The `useAuth` hook's initial `GET /api/auth/me` call in `AuthProvider` fires on mount. On Render free tier, first cold start takes 30-60s. Detection approach:

```typescript
// In LoginPage.tsx:
const { isLoading } = useAuth();
const [showColdStart, setShowColdStart] = useState(false);

useEffect(() => {
  if (!isLoading) {
    setShowColdStart(false);
    return;                    // no timer needed once loaded
  }
  const timer = setTimeout(() => setShowColdStart(true), 3000);
  return () => clearTimeout(timer);  // CRITICAL: prevent memory leak on unmount/re-render
}, [isLoading]);
```

Timer starts on LoginPage mount. If `isLoading` is still `true` after 3s, the message appears. The `/api/auth/me` call fires in AuthProvider before LoginPage mounts, so this detects slow backend responses. Display only when `showColdStart && isLoading`. Message disappears automatically when `isLoading` becomes `false`.

### Architecture Compliance

- **Component location:** `Breadcrumbs.tsx` goes in `frontend/src/components/layout/` (layout component)
- **shadcn usage:** Compose shadcn primitives — never raw HTML for interactive elements
- **No API calls in components:** Breadcrumbs reads from React Query cache only; pages fetch data
- **Styling:** Tailwind utility classes only, use `cn()` from `@/lib/utils` for conditional classes
- **Icons:** `lucide-react` only (ChevronRight is already in shadcn breadcrumb, use `Info` for cold start)
- **Toast:** Use `sonner` via `toast.info()` if implementing cold start as toast instead of inline
- **React Router:** Import from `'react-router'` (NOT `'react-router-dom'`) — this project uses v7

### File Structure

```
frontend/src/
  components/
    layout/
      Breadcrumbs.tsx          ← NEW (Task 1)
      CourseDetailLayout.tsx   ← NEW (Task 4 — readonly sidebar layout)
      AppLayout.tsx            ← MODIFY (Task 2 — add Breadcrumbs)
      LessonLayout.tsx         ← MODIFY (Task 2 — add Breadcrumbs)
    course/
      CourseSidebar.tsx        ← MODIFY (Task 3 — add readonly mode)
    ui/
      breadcrumb.tsx           ← EXISTS (shadcn primitive — DO NOT MODIFY)
  pages/
    CourseDetailPage.tsx       ← MODIFY (Task 4 — remove inline accordion)
    LoginPage.tsx              ← MODIFY (Task 5 — cold start handling)
  App.tsx                      ← MODIFY (Task 4 — add ProtectedCourseDetailRoute)
```

### Existing Code Patterns to Follow

- **Component exports:** Named exports (`export function Breadcrumbs`), PascalCase files
- **Props pattern:** Interface defined above component, destructured in params
- **Hooks pattern:** `useLocation()`, `useParams()` from `'react-router'`; `useQueryClient()` from `@tanstack/react-query`
- **Conditional rendering:** Early return `null` for hidden states
- **Data types:** Import `CourseDetail` from `@/hooks/useCourses`, `ProgressSummary` from `@/hooks/useProgress`
- **Spacing conventions:** `mb-4` between breadcrumbs and content, `p-6` page padding, `space-y-6` sections

### Anti-Patterns to Avoid

- DO NOT make API calls inside the Breadcrumbs component — use React Query cache only
- DO NOT modify any files in `components/ui/` — shadcn primitives are untouched
- DO NOT use `react-router-dom` — this project uses `react-router` v7 (same package, different import)
- DO NOT add breadcrumbs to LoginPage/RegisterPage — these are public, unauthenticated routes
- DO NOT break existing CourseSidebar interactive behavior — readonly is additive via new prop
- DO NOT add custom CSS files — Tailwind utility classes only
- DO NOT add new npm dependencies — all needed packages are already installed

### Previous Story (6-1) Learnings

- TypeORM 0.3.28 is in use (not 0.4.x as architecture states)
- Entity alias pattern: `CourseModule` entity collides with NestJS `@Module`, use `CourseModuleEntity` alias
- Frontend hooks and data types are well-established in `src/hooks/`
- 115 existing tests — do not break them
- Pattern: pages fetch data, pass as props to components

### Project Structure Notes

- All paths use `@/` alias → `frontend/src/`
- shadcn config: `components.json` with `radix-nova` style
- Theme: dark/light mode via `ThemeProvider` and `.dark` class
- `cn()` helper at `@/lib/utils` for merging Tailwind classes

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-6, Story 6.2]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend-Dependencies — shadcn breadcrumb listed]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure — Breadcrumbs.tsx in layout/]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Breadcrumbs — component anatomy and route mapping]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#CourseSidebar — readonly mode spec]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation-Patterns — breadcrumb behavior]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive-Strategy — breadcrumbs hidden on mobile]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Loading-Empty-State-Patterns — cold start UX]
- [Source: frontend/src/components/ui/breadcrumb.tsx — shadcn primitive already installed]
- [Source: frontend/src/components/course/CourseSidebar.tsx — existing interactive sidebar]
- [Source: frontend/src/components/layout/AppLayout.tsx — layout to add breadcrumbs]
- [Source: frontend/src/components/layout/LessonLayout.tsx — layout to add breadcrumbs]
- [Source: frontend/src/pages/CourseDetailPage.tsx — page to add readonly sidebar]
- [Source: frontend/src/pages/LoginPage.tsx — page to add cold start handling]
- [Source: frontend/src/App.tsx — routing structure]
- [Source: frontend/src/hooks/useCourses.ts — CourseDetail type and query keys]
- [Source: frontend/src/hooks/useAuth.tsx — AuthProvider isLoading state for cold start detection]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None — clean implementation with zero lint, TypeScript, and build errors.

### Completion Notes List

- Created `Breadcrumbs.tsx` layout component using shadcn `Breadcrumb*` primitives. Uses `useLocation()` + `useParams()` for route detection and `queryClient.getQueryData()` for entity name resolution from React Query cache. Handles all routes per mapping table. Hidden on mobile via `hidden lg:block`, returns `null` for top-level pages.
- Integrated `<Breadcrumbs />` into `AppLayout.tsx` and `LessonLayout.tsx` above `<Outlet />` with `mb-4` spacing inside their respective `max-w-*` containers.
- Added `mode?: 'interactive' | 'readonly'` prop to `CourseSidebar`. In readonly mode: lessons render as `<span>` (no `<Link>`), completion icons hidden, progress bar hidden. Accordion expand/collapse preserved. Made `lessonId` and `progress` optional props with appropriate guards.
- Created `CourseDetailLayout.tsx` — mirrors `LessonLayout` but passes `mode="readonly"` to `CourseSidebar`, omits `lessonId`/`progress`. Includes `<Breadcrumbs />`.
- Added `ProtectedCourseDetailRoute` to `App.tsx` and moved `/courses/:id` route from `ProtectedRoute` to the new route. Removed inline accordion tree (lines 124-146) from `CourseDetailPage.tsx` as sidebar now provides this view.
- Added cold start detection to `LoginPage.tsx`: 3s timeout on mount triggers inline info message with `Info` icon (styled `text-sm text-muted-foreground mt-4`). Message dismissed when `isLoading` becomes `false`. Also added 3s toast during login submission, auto-dismissed when login completes.
- Backend: 115 tests pass. Frontend: 0 lint errors, 0 TypeScript errors, successful production build.

### File List

frontend/src/components/layout/Breadcrumbs.tsx (NEW)
frontend/src/components/layout/CourseDetailLayout.tsx (NEW)
frontend/src/components/layout/AppLayout.tsx (MODIFIED)
frontend/src/components/layout/LessonLayout.tsx (MODIFIED)
frontend/src/components/course/CourseSidebar.tsx (MODIFIED)
frontend/src/pages/CourseDetailPage.tsx (MODIFIED)
frontend/src/pages/LoginPage.tsx (MODIFIED)
frontend/src/App.tsx (MODIFIED)

### Review Findings

- [x] [Review][Patch] Empty breadcrumb segment for module title [Breadcrumbs.tsx:38] — fixed: fallback changed from `''` to `'...'`
- [x] [Review][Patch] Redundant max-w-md on LoginPage Card [LoginPage.tsx:76] — fixed: removed duplicate `w-full max-w-md` from Card
- [x] [Review][Defer] Loading-state duplication in App.tsx — deferred, pre-existing
- [x] [Review][Defer] No loading/error state for layout sidebars — deferred, pre-existing
- [x] [Review][Defer] progress.percentage displayed without rounding — deferred, pre-existing
- [x] [Review][Defer] handleEnroll has no success/error feedback — deferred, pre-existing
- [x] [Review][Defer] Role-based route authorization absent — deferred, pre-existing

## Change Log

- 2026-03-25: Implemented story 6-2 UX Polish & Breadcrumbs. Added dynamic Breadcrumbs component with route-to-name resolution from React Query cache. Integrated into AppLayout and LessonLayout. Added readonly mode to CourseSidebar and CourseDetailLayout for course detail preview. Added cold start detection and messaging on LoginPage. All 115 backend tests pass, 0 frontend lint/TypeScript errors, production build successful.

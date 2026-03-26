# Story 2.4: Course Editor — Module & Lesson Management UI

Status: done

## Story

As an **instructor**,
I want to manage modules and lessons within a course through an editor page,
So that I can structure and update course content.

## Acceptance Criteria

1. Navigating to `/my-courses/:id/edit` as an authenticated instructor loads the course editor page showing: editable course title and description fields, a list of modules (each expandable to show lessons via accordion), an "Add Module" button, and within each module an "Add Lesson" button.
2. Editing the course title or description and clicking "Save" updates the course via `PATCH /api/courses/:id` with toast feedback "Course updated!".
3. Clicking "Add Module" opens a Dialog with a module title field. Submitting creates a module via `POST /api/courses/:courseId/modules` with toast "Module added!" — the module appears inline in the list.
4. Clicking "Add Lesson" within a module opens a Dialog with lesson title and markdown content (Textarea) fields. Submitting creates a lesson via `POST /api/courses/:courseId/modules/:moduleId/lessons` with toast "Lesson added!" — the lesson appears under the module.
5. Clicking edit on a module or lesson opens a Dialog with pre-filled fields. Saving updates via PATCH endpoint with toast feedback "Module updated!" / "Lesson updated!".
6. Clicking delete on a course, module, or lesson shows an AlertDialog confirmation ("Delete [item type]?" with item name, Cancel + Delete buttons). On confirm, the item is deleted via DELETE endpoint with toast feedback "[Item] deleted". Deleting the course redirects to `/my-courses`.
7. Any API error during CRUD operations shows a toast error with actionable message, form data is preserved, and no UI state is corrupted.
8. While course data loads, Skeleton placeholders are shown instead of blank content.

## Tasks / Subtasks

- [x] Task 1: Install shadcn `alert-dialog` component (AC: #6)
  - [x] Run `npx shadcn@latest add alert-dialog` in the `frontend/` directory
  - [x] Verify `frontend/src/components/ui/alert-dialog.tsx` is created

- [x] Task 2: Extend `useCourses.ts` with course, module, and lesson hooks (AC: #1-#7)
  - [x] Add `CourseModule` and `Lesson` TypeScript interfaces
  - [x] No separate `useCourse(courseId)` hook — reuse `useInstructorCourses()` and filter by `courseId` client-side (leverages cached query)
  - [x] `useUpdateCourse()` — mutation calling `PATCH /api/courses/:id` with `{ title?, description? }`. On success: invalidates `['courses', 'my']`. On error: toast.
  - [x] `useDeleteCourse()` — mutation calling `DELETE /api/courses/:id`. On success: invalidates `['courses', 'my']`. On error: toast.
  - [x] `useCourseModules(courseId)` — `GET /api/courses/:courseId/modules`. Returns `CourseModule[]` with nested `lessons`. Query key: `['courses', courseId, 'modules']`
  - [x] `useCreateModule(courseId)` — mutation calling `POST /api/courses/:courseId/modules`. On success: invalidates `['courses', courseId, 'modules']`. On error: toast.
  - [x] `useUpdateModule(courseId)` — mutation calling `PATCH /api/courses/:courseId/modules/:moduleId`. On success: invalidates `['courses', courseId, 'modules']`. On error: toast.
  - [x] `useDeleteModule(courseId)` — mutation calling `DELETE /api/courses/:courseId/modules/:moduleId`. On success: invalidates `['courses', courseId, 'modules']`. On error: toast.
  - [x] `useCreateLesson(courseId)` — mutation fn receives `{ moduleId, title, content, orderIndex }`. Calls `POST /api/courses/:courseId/modules/:moduleId/lessons`. On success: invalidates `['courses', courseId, 'modules']`. On error: toast.
  - [x] `useUpdateLesson(courseId)` — mutation fn receives `{ moduleId, lessonId, title?, content? }`. Calls `PATCH /api/courses/:courseId/modules/:moduleId/lessons/:lessonId`. On success: invalidates `['courses', courseId, 'modules']`. On error: toast.
  - [x] `useDeleteLesson(courseId)` — mutation fn receives `{ moduleId, lessonId }`. Calls `DELETE /api/courses/:courseId/modules/:moduleId/lessons/:lessonId`. On success: invalidates `['courses', courseId, 'modules']`. On error: toast.

- [x] Task 3: Create `ConfirmDeleteDialog` reusable component (AC: #6)
  - [x] Create `frontend/src/components/common/ConfirmDeleteDialog.tsx`
  - [x] Props: `open: boolean`, `onOpenChange: (open: boolean) => void`, `itemType: string` (e.g., "course"), `itemName: string`, `onConfirm: () => void`, `isPending: boolean`
  - [x] Uses shadcn `AlertDialog` with: title "Delete {itemType}?", description "This will permanently delete **{itemName}**. This action cannot be undone.", Cancel button (outline), Delete button (destructive, shows spinner when `isPending`)
  - [x] Reusable for course, module, and lesson deletion

- [x] Task 4: Create `ModuleFormDialog` component (AC: #3, #5)
  - [x] Create `frontend/src/components/course/ModuleFormDialog.tsx`
  - [x] Props: `open: boolean`, `onOpenChange: (open: boolean) => void`, `mode: 'create' | 'edit'`, `defaultValues?: { title: string }`, `onSubmit: (data: { title: string }) => void`, `isPending: boolean`
  - [x] Form with zod validation: `title` (required, max 255)
  - [x] Dialog title: "Add Module" (create) / "Edit Module" (edit)
  - [x] Submit button: "Add Module" / "Save" with spinner when pending
  - [x] On close: `form.reset()` to clear stale data
  - [x] Follows the established react-hook-form + zod + Label/Input pattern from LoginPage

- [x] Task 5: Create `LessonFormDialog` component (AC: #4, #5)
  - [x] Create `frontend/src/components/course/LessonFormDialog.tsx`
  - [x] Props: `open: boolean`, `onOpenChange: (open: boolean) => void`, `mode: 'create' | 'edit'`, `defaultValues?: { title: string; content: string }`, `onSubmit: (data: { title: string; content: string }) => void`, `isPending: boolean`
  - [x] Form with zod validation: `title` (required, max 255), `content` (required, max 50000)
  - [x] Dialog title: "Add Lesson" (create) / "Edit Lesson" (edit)
  - [x] `content` uses `Textarea` component (markdown content)
  - [x] Submit button: "Add Lesson" / "Save" with spinner when pending
  - [x] On close: `form.reset()` to clear stale data

- [x] Task 6: Implement `CourseEditorPage` (AC: #1-#8)
  - [x] Replace stub in `frontend/src/pages/CourseEditorPage.tsx`
  - [x] Extract `courseId` from URL params: `const { id: courseId } = useParams()` (route is `/my-courses/:id/edit`, so param name is `id` — rename to `courseId` for clarity)
  - [x] Fetch course data: use `useInstructorCourses()` from useCourses and find by `courseId` — reuses existing cached query
  - [x] Fetch modules+lessons: use `useCourseModules(courseId)`
  - [x] **Course details section (top):**
    - Editable title (Input) and description (Textarea) pre-filled from course data
    - "Save" button (primary) and "Delete Course" button (destructive, outline)
    - Local form state managed by react-hook-form + zod
    - On save: call `useUpdateCourse()` mutation → toast "Course updated!"
    - On delete: open ConfirmDeleteDialog → on confirm: call `useDeleteCourse()` → toast "Course deleted" → navigate to `/my-courses`
  - [x] **Module/Lesson section (below):**
    - "Add Module" button (outline, with Plus icon)
    - Modules rendered via shadcn `Accordion` (type="multiple") — each module is an AccordionItem
    - Each AccordionTrigger shows module title + edit/delete icon buttons (Pencil, Trash2)
    - Each AccordionContent shows:
      - List of lessons (title + edit/delete icon buttons per lesson)
      - "Add Lesson" button at the bottom of the lesson list
    - Empty state within accordion content if module has no lessons: "No lessons yet"
  - [x] **Loading state:** Skeleton placeholders for course fields and module list
  - [x] **Error state:** Error message with retry option if course or modules fail to load
  - [x] **Not found state:** If courseId doesn't match any instructor course, show "Course not found" with link back to /my-courses

- [x] Task 7: Wire up module CRUD in CourseEditorPage (AC: #3, #5, #6, #7)
  - [x] "Add Module" button → opens ModuleFormDialog in create mode
  - [x] On create submit: call `useCreateModule(courseId)` with `{ title, orderIndex: modules.length }` → toast "Module added!" → close dialog
  - [x] Module edit button → opens ModuleFormDialog in edit mode with current values
  - [x] On edit submit: call `useUpdateModule(courseId)` with `{ moduleId, title }` → toast "Module updated!" → close dialog
  - [x] Module delete button → opens ConfirmDeleteDialog with itemType="module", itemName={module.title}
  - [x] On delete confirm: call `useDeleteModule(courseId)` with moduleId → toast "Module deleted"

- [x] Task 8: Wire up lesson CRUD in CourseEditorPage (AC: #4, #5, #6, #7)
  - [x] "Add Lesson" button per module → opens LessonFormDialog in create mode
  - [x] On create submit: call `useCreateLesson(courseId, moduleId)` with `{ title, content, orderIndex: lessons.length }` → toast "Lesson added!" → close dialog
  - [x] Lesson edit button → opens LessonFormDialog in edit mode with current values
  - [x] On edit submit: call `useUpdateLesson(courseId, moduleId)` with `{ lessonId, title, content }` → toast "Lesson updated!" → close dialog
  - [x] Lesson delete button → opens ConfirmDeleteDialog with itemType="lesson", itemName={lesson.title}
  - [x] On delete confirm: call `useDeleteLesson(courseId, moduleId)` with lessonId → toast "Lesson deleted"

- [x] Task 9: Verify (AC: all)
  - [x] Run `npm run build` in frontend — must compile cleanly
  - [x] Run `npm run lint` — must pass
  - [x] Verify: navigate to `/my-courses/:id/edit` → page loads with course title, description, modules, lessons
  - [x] Verify: edit course title/description → save → toast "Course updated!"
  - [x] Verify: add module → toast "Module added!" → appears in list
  - [x] Verify: add lesson → toast "Lesson added!" → appears under module
  - [x] Verify: edit module/lesson → pre-filled form → save → toast
  - [x] Verify: delete course/module/lesson → AlertDialog → confirm → toast → item removed
  - [x] Verify: skeleton loading states display during data fetch
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
- `App.tsx` — React Router v7, `/my-courses/:id/edit` route already exists pointing to `CourseEditorPage`
- Navigation: `useNavigate` from `react-router`, `useParams` for route params
- Instructor's default landing page is `/my-courses`

**Layout (Story 1.4):**
- `AppLayout` wraps page in `SidebarProvider` + `AppSidebar` + `<main>` with `p-6` and `max-w-5xl`
- Pages render inside `<Outlet />` — no need to add layout wrappers

**Existing hooks (Story 2.3):**
- `useCourses.ts` already exports: `useInstructorCourses()`, `useCreateCourse()`, and `Course` interface
- `useInstructorCourses()` query key: `['courses', 'my']` — reuse this for course data on editor page (filter by courseId client-side)
- `useCreateCourse()` — onError toast already at hook level (lesson from Story 2.3 review: avoids double toast)

**Existing components (Story 2.3):**
- `CourseCard` at `src/components/course/CourseCard.tsx`
- `CreateCourseDialog` at `src/components/course/CreateCourseDialog.tsx`
- `EmptyState` at `src/components/common/EmptyState.tsx`

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
- **Loading state for mutations:** Use `mutation.isPending` (NOT `formState.isSubmitting`)
- Submit button: `<Button disabled={isPending}>{isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Label</Button>`
- Toast: `toast.success('Message')` / `toast.error('Message', { duration: 5000 })`

**Architecture doc vs reality — shadcn Form component:**
- The shadcn `Form` component is NOT installed. Follow the established `LoginPage.tsx` pattern (direct react-hook-form + Label + Input), NOT the architecture doc's suggestion.

**shadcn UI components installed:**
- Available: `accordion`, `badge`, `breadcrumb`, `button`, `card`, `dialog`, `dropdown-menu`, `input`, `label`, `progress`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `table`, `textarea`, `tooltip`
- **NOT installed:** `alert-dialog` — MUST be installed for this story's delete confirmation flow

### Backend API Contracts (Stories 2.1, 2.2)

**Endpoints this story calls:**

| Method | Route | Body | Response | Status |
|--------|-------|------|----------|--------|
| PATCH | `/api/courses/:id` | `{ title?, description? }` | `Course` object | 200 |
| DELETE | `/api/courses/:id` | — | `{ message: "Course deleted" }` | 200 |
| GET | `/api/courses/:courseId/modules` | — | `CourseModule[]` (with nested lessons) | 200 |
| POST | `/api/courses/:courseId/modules` | `{ title, orderIndex }` | `CourseModule` object | 201 |
| PATCH | `/api/courses/:courseId/modules/:moduleId` | `{ title?, orderIndex? }` | `CourseModule` object | 200 |
| DELETE | `/api/courses/:courseId/modules/:moduleId` | — | `{ message: "Module deleted" }` | 200 |
| POST | `/api/courses/:courseId/modules/:moduleId/lessons` | `{ title, content, orderIndex }` | `Lesson` object | 201 |
| PATCH | `/api/courses/:courseId/modules/:moduleId/lessons/:lessonId` | `{ title?, content?, orderIndex? }` | `Lesson` object | 200 |
| DELETE | `/api/courses/:courseId/modules/:moduleId/lessons/:lessonId` | — | `{ message: "Lesson deleted" }` | 200 |

**Entity response shapes:**

```typescript
interface Course {
  id: string;          // UUID
  title: string;
  description: string;
  instructorId: string; // UUID
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}

interface CourseModule {
  id: string;          // UUID
  title: string;
  orderIndex: number;  // integer, 0-based
  courseId: string;     // UUID
  lessons: Lesson[];   // nested, ordered by orderIndex ASC
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}

interface Lesson {
  id: string;          // UUID
  title: string;
  content: string;     // markdown text
  orderIndex: number;  // integer, 0-based
  moduleId: string;    // UUID
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}
```

**Error responses (handled by fetchApi + QueryClient):**
- 400: Validation error — `{ statusCode: 400, message: ['title must be...'], error: 'Bad Request' }`
- 401: No auth — redirected to login by auth context
- 403: Not owner / not instructor — shouldn't happen since page is role-scoped
- 404: Course/module/lesson not found — `{ statusCode: 404, message: 'Not found', error: 'Not Found' }`

**DTO validation constraints (must match frontend zod schemas):**
- Course: title max 255, description max 5000
- Module: title max 255, orderIndex integer >= 0
- Lesson: title max 255, content max 50000, orderIndex integer >= 0

### React Query Hook Patterns

**New hooks to add to `useCourses.ts`:**

```typescript
// New interfaces
export interface CourseModule {
  id: string;
  title: string;
  orderIndex: number;
  courseId: string;
  lessons: Lesson[];
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  orderIndex: number;
  moduleId: string;
  createdAt: string;
  updatedAt: string;
}

// Course update/delete
export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; title?: string; description?: string }) =>
      fetchApi.patch<Course>(`/api/courses/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'my'] });
    },
    onError: () => {
      toast.error('Could not update course. Please try again.', { duration: 5000 });
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => fetchApi.delete(`/api/courses/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', 'my'] });
    },
    onError: () => {
      toast.error('Could not delete course. Please try again.', { duration: 5000 });
    },
  });
}

// Module CRUD
export function useCourseModules(courseId: string) {
  return useQuery<CourseModule[]>({
    queryKey: ['courses', courseId, 'modules'],
    queryFn: () => fetchApi.get<CourseModule[]>(`/api/courses/${courseId}/modules`),
    enabled: !!courseId,
  });
}

export function useCreateModule(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; orderIndex: number }) =>
      fetchApi.post<CourseModule>(`/api/courses/${courseId}/modules`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'modules'] });
    },
    onError: () => {
      toast.error('Could not add module. Please try again.', { duration: 5000 });
    },
  });
}

export function useUpdateModule(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, ...data }: { moduleId: string; title?: string; orderIndex?: number }) =>
      fetchApi.patch<CourseModule>(`/api/courses/${courseId}/modules/${moduleId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'modules'] });
    },
    onError: () => {
      toast.error('Could not update module. Please try again.', { duration: 5000 });
    },
  });
}

export function useDeleteModule(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (moduleId: string) =>
      fetchApi.delete(`/api/courses/${courseId}/modules/${moduleId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'modules'] });
    },
    onError: () => {
      toast.error('Could not delete module. Please try again.', { duration: 5000 });
    },
  });
}

// Lesson CRUD — courseId needed for API path, moduleId for specific module
export function useCreateLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, ...data }: { moduleId: string; title: string; content: string; orderIndex: number }) =>
      fetchApi.post<Lesson>(`/api/courses/${courseId}/modules/${moduleId}/lessons`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'modules'] });
    },
    onError: () => {
      toast.error('Could not add lesson. Please try again.', { duration: 5000 });
    },
  });
}

export function useUpdateLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, lessonId, ...data }: { moduleId: string; lessonId: string; title?: string; content?: string }) =>
      fetchApi.patch<Lesson>(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'modules'] });
    },
    onError: () => {
      toast.error('Could not update lesson. Please try again.', { duration: 5000 });
    },
  });
}

export function useDeleteLesson(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, lessonId }: { moduleId: string; lessonId: string }) =>
      fetchApi.delete(`/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'modules'] });
    },
    onError: () => {
      toast.error('Could not delete lesson. Please try again.', { duration: 5000 });
    },
  });
}
```

**Error handling pattern:** All mutations define `onError` at the hook level (not per-call). This overrides the QueryClient default and prevents double toasts. Lesson from Story 2.3 review finding.

**Query key convention:** Hierarchical — `['courses', courseId, 'modules']` for modules. All module/lesson mutations invalidate this key since the GET modules endpoint returns nested lessons.

### Zod Schemas for Forms

```typescript
// Course edit (reuses CreateCourse constraints)
const courseEditSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(5000, 'Description too long'),
});

// Module create/edit
const moduleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
});

// Lesson create/edit
const lessonSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  content: z.string().min(1, 'Content is required').max(50000, 'Content too long'),
});
```

### ConfirmDeleteDialog Pattern

```typescript
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2 } from 'lucide-react';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: string;   // "course", "module", "lesson"
  itemName: string;    // the actual name of the item
  onConfirm: () => void;
  isPending: boolean;
}
```

Title: `Delete {itemType}?`
Description: `This will permanently delete "{itemName}". This action cannot be undone.`
Cancel button: "Cancel" (outline style via AlertDialogCancel)
Confirm button: "Delete" (destructive style) — shows Loader2 spinner when `isPending`, disabled during pending

This component is reusable across course, module, and lesson deletion — and future stories (Epic 5 admin features).

### CourseEditorPage Layout

```
┌─────────────────────────────────────────────┐
│ ← Back to My Courses              (link)    │
├─────────────────────────────────────────────┤
│ Course Details                              │
│ ┌─────────────────────────────────────────┐ │
│ │ Title: [___________________________]    │ │
│ │ Description: [_____________________]    │ │
│ │ [Save]                  [Delete Course] │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Modules                   [+ Add Module]    │
│ ┌─────────────────────────────────────────┐ │
│ │ ▶ Module 1: Getting Started   [✏️][🗑️] │ │
│ │   ├ Lesson 1: Introduction    [✏️][🗑️] │ │
│ │   ├ Lesson 2: Setup           [✏️][🗑️] │ │
│ │   └ [+ Add Lesson]                      │ │
│ ├─────────────────────────────────────────┤ │
│ │ ▶ Module 2: Core Concepts     [✏️][🗑️] │ │
│ │   ├ Lesson 1: Basics          [✏️][🗑️] │ │
│ │   └ [+ Add Lesson]                      │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

**Key layout decisions:**
- "Back to My Courses" link at top — `Link` to `/my-courses` with `ArrowLeft` icon
- Course details in a Card with form fields (not inline editing)
- Modules section uses shadcn `Accordion` with `type="multiple"` (all expandable independently)
- Edit/delete buttons are icon-only ghost buttons (`Pencil`, `Trash2` from lucide-react)
- Module edit/delete buttons inside the AccordionTrigger (use `e.stopPropagation()` to prevent accordion toggle)
- "Add Lesson" button inside each AccordionContent at the bottom of lesson list
- Empty module content: `<p className="text-sm text-muted-foreground py-2">No lessons yet</p>`

### AccordionTrigger with Action Buttons

The AccordionTrigger contains both the module title and edit/delete icon buttons. Clicking edit/delete must NOT toggle the accordion. Use `e.stopPropagation()` on the button click handlers.

```tsx
<AccordionTrigger className="hover:no-underline">
  <div className="flex items-center justify-between w-full pr-2">
    <span>{module.title}</span>
    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
      <Button variant="ghost" size="icon" onClick={() => handleEditModule(module)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => handleDeleteModule(module)}>
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  </div>
</AccordionTrigger>
```

### Dialog Form Pattern (Module/Lesson)

Both ModuleFormDialog and LessonFormDialog follow the same pattern established in CreateCourseDialog:

```tsx
<Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) form.reset(); onOpenChange(isOpen); }}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>{mode === 'create' ? 'Add Module' : 'Edit Module'}</DialogTitle>
      <DialogDescription>{mode === 'create' ? 'Create a new module.' : 'Update module details.'}</DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit(submitHandler)} className="space-y-4">
      {/* fields */}
      <DialogFooter>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          {mode === 'create' ? 'Add Module' : 'Save'}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

**For edit mode:** Use `useEffect` to reset form with defaultValues when dialog opens, since `defaultValues` in useForm only applies on first render. Alternatively, pass `values` prop to useForm (react-hook-form v7.43+ feature) which syncs external values:

```typescript
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  values: mode === 'edit' ? defaultValues : undefined,
});
```

### orderIndex Management

When creating modules/lessons, set `orderIndex` to the current count of existing items:
- New module: `orderIndex = modules.length`
- New lesson: `orderIndex = module.lessons.length`

This appends new items to the end. Drag-to-reorder is out of scope for MVP.

### What NOT To Do

**Dependencies:**
- Do NOT install any npm packages besides the shadcn `alert-dialog` component — everything else is already installed
- Do NOT install `@nestjs/mapped-types` or any backend packages — this is a frontend-only story

**Patterns:**
- Do NOT use the shadcn `Form` component (not installed) — use react-hook-form + zod + Label/Input pattern from LoginPage
- Do NOT create a new layout wrapper — pages render inside `AppLayout` via `<Outlet />`
- Do NOT add authentication checks in the page — `ProtectedRoute` already handles this
- Do NOT add the `Toaster` component — it's already in the layout
- Do NOT use Axios — use `fetchApi` from `src/lib/fetchApi.ts`
- Do NOT use `eager` loading or pre-fetching — React Query handles caching
- Do NOT add per-call `onError` on mutations — define `onError` at hook level (prevents double toast; lesson from 2.3 review)
- Do NOT use `formState.isSubmitting` for mutation loading — use `mutation.isPending`
- Do NOT modify the `useCreateCourse()` hook — it already works correctly

**Scope boundaries:**
- Do NOT implement drag-to-reorder for modules/lessons — out of scope for MVP
- Do NOT implement course publish/unpublish workflow — that's Phase 2
- Do NOT add markdown preview for lesson content editing — out of scope (plain textarea is sufficient)
- Do NOT add course thumbnail upload — Phase 2
- Do NOT modify backend code — all API endpoints exist from Stories 2.1 and 2.2
- Do NOT modify `AppSidebar.tsx` — nav items are already configured
- Do NOT modify `App.tsx` — the route already exists
- Do NOT add enrollment or progress features — those are Epics 3 and 4

### Previous Story Intelligence (from Story 2.3)

**Patterns established by Story 2.3:**
- Dialog components: controlled via `useState` for open/close, `form.reset()` on close
- Mutation error handling: `onError` at hook level, not per-call (prevents double toast with QueryClient default)
- Skeleton loading: 3 Skeleton cards pattern in grid
- EmptyState: icon + title + description + optional action CTA
- CourseCard: Link-wrapped Card with hover shadow

**Review findings from 2.3 that directly impact this story:**
1. **Double toast fix:** Story 2.3 review found that per-call `onError` + global `onError` caused double toasts. Fix: move `onError` to hook level. Apply this pattern to ALL new hooks.
2. **Error state for fetch failures:** Story 2.3 review added an error state with retry button for course list fetch failure. Apply same pattern for course/modules fetch failure in CourseEditorPage.
3. **Spinner spacing:** Story 2.3 review found Loader2 icon needed `mr-2` for spacing before button text. Apply to all submit buttons.
4. **No role guard on routes (deferred):** ProtectedRoute only checks `isAuthenticated`. Any authenticated user can access `/my-courses/:id/edit`. This is a pre-existing gap — do not try to fix it in this story.

### Project Structure Notes

**Files to create:**
```
frontend/src/
  components/
    common/
      ConfirmDeleteDialog.tsx       # Reusable delete confirmation (AlertDialog)
    course/
      ModuleFormDialog.tsx           # Dialog form for create/edit module
      LessonFormDialog.tsx           # Dialog form for create/edit lesson
```

**Files to modify:**
```
frontend/src/
  hooks/useCourses.ts               # Add CourseModule, Lesson interfaces + all new hooks
  pages/CourseEditorPage.tsx         # Replace stub with full implementation
```

**shadcn component to install:**
```
frontend/src/components/ui/alert-dialog.tsx    # Via npx shadcn@latest add alert-dialog
```

### Key Imports for CourseEditorPage

```typescript
import { useParams, useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useState } from 'react';
import { Plus, Pencil, Trash2, ArrowLeft, Loader2, BookOpen, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';

import {
  useInstructorCourses, useUpdateCourse, useDeleteCourse,
  useCourseModules, useCreateModule, useUpdateModule, useDeleteModule,
  useCreateLesson, useUpdateLesson, useDeleteLesson,
  Course, CourseModule, Lesson,
} from '@/hooks/useCourses';
import { ConfirmDeleteDialog } from '@/components/common/ConfirmDeleteDialog';
import { ModuleFormDialog } from '@/components/course/ModuleFormDialog';
import { LessonFormDialog } from '@/components/course/LessonFormDialog';
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 2.4 Acceptance Criteria, lines 439-478]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture: React Router v7, React Query v5, react-hook-form + zod]
- [Source: _bmad-output/planning-artifacts/architecture.md — React Query Patterns: entity-based query keys, mutation invalidation]
- [Source: _bmad-output/planning-artifacts/architecture.md — File Organization Rules: pages/, components/course/, hooks/]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Journey 2: Instructor Course Management flow, lines 722-762]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Delete Confirmation Pattern: AlertDialog, lines 1107-1121]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Button Hierarchy: destructive buttons require AlertDialog, lines 1051-1065]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Navigation: after create module/lesson stay on page, after delete stay on page, lines 1123-1134]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Form Patterns: on submit only validation, lines 1088-1105]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Feedback Patterns: toast on every state-change, lines 1067-1086]
- [Source: _bmad-output/planning-artifacts/prd.md — FR8 (edit courses), FR9 (delete courses), FR11-14 (module/lesson CRUD)]
- [Source: _bmad-output/implementation-artifacts/2-3-instructor-courses-list-create-ui.md — Existing hooks, components, form patterns, review findings]
- [Source: _bmad-output/implementation-artifacts/2-2-module-lesson-crud-api-entities.md — Module/Lesson API contracts, DTOs, entity shapes]
- [Source: _bmad-output/implementation-artifacts/2-1-course-crud-api-entities.md — Course CRUD API, PATCH/DELETE endpoints]
- [Source: _bmad-output/implementation-artifacts/deferred-work.md — No role guard on routes (deferred from 2.3)]
- [Source: frontend/src/hooks/useCourses.ts — Existing hook patterns, Course interface]
- [Source: frontend/src/pages/LoginPage.tsx — Form pattern reference: react-hook-form + zod]
- [Source: frontend/src/lib/fetchApi.ts — API client pattern]
- [Source: frontend/src/lib/queryClient.ts — QueryClient config, mutation error handling]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- TS1484 errors: `CourseModule` and `Lesson` were value imports but are type-only — fixed with `import type` syntax (verbatimModuleSyntax enabled in tsconfig).

### Completion Notes List

- Installed shadcn `alert-dialog` component via `npx shadcn@latest add alert-dialog`.
- Extended `useCourses.ts` with `CourseModule` and `Lesson` interfaces plus 9 new hooks: `useUpdateCourse`, `useDeleteCourse`, `useCourseModules`, `useCreateModule`, `useUpdateModule`, `useDeleteModule`, `useCreateLesson`, `useUpdateLesson`, `useDeleteLesson`. All mutations define `onError` at hook level to prevent double toasts (lesson from Story 2.3 review).
- Created `ConfirmDeleteDialog` reusable component using shadcn `AlertDialog` — handles course, module, and lesson deletions.
- Created `ModuleFormDialog` with react-hook-form + zod, `values` prop for edit mode pre-fill, and `form.reset()` on close.
- Created `LessonFormDialog` with title + markdown content textarea, same patterns as `ModuleFormDialog`.
- Implemented full `CourseEditorPage` replacing the stub: course details form with save/delete, accordion-based module list with nested lessons, all CRUD dialogs wired up, skeleton loading, error state with retry, and "not found" state.
- `npm run build` and `npm run lint` both pass cleanly.

### File List

- frontend/src/components/ui/alert-dialog.tsx (created by shadcn)
- frontend/src/hooks/useCourses.ts (modified — added interfaces + 9 new hooks)
- frontend/src/components/common/ConfirmDeleteDialog.tsx (created)
- frontend/src/components/course/ModuleFormDialog.tsx (created)
- frontend/src/components/course/LessonFormDialog.tsx (created)
- frontend/src/pages/CourseEditorPage.tsx (modified — full implementation replacing stub)

### Review Findings

- [x] [Review][Patch] AlertDialogAction auto-closes before async delete completes — fixed: e.preventDefault() on click [ConfirmDeleteDialog.tsx]
- [x] [Review][Patch] Delete dialog can be dismissed via Escape/overlay during pending mutation — fixed: guard onOpenChange when isPending [ConfirmDeleteDialog.tsx]
- [x] [Review][Patch] Double-submit possible on all mutation buttons — fixed: isPending guards in all handlers [CourseEditorPage.tsx]
- [x] [Review][Patch] Selected module/lesson/delete state not cleared on dialog dismiss — fixed: clear state in onOpenChange [CourseEditorPage.tsx]
- [x] [Review][Patch] Modules and lessons not sorted by orderIndex before rendering — fixed: defensive sort [CourseEditorPage.tsx]
- [x] [Review][Patch] Mutation handlers (onModuleSubmit, onLessonSubmit) missing courseId guard — fixed: early return [CourseEditorPage.tsx]
- [x] [Review][Patch] Whitespace-only strings pass frontend Zod validation — fixed: added .trim() to all Zod schemas
- [x] [Review][Defer] orderIndex collision on concurrent creates — by spec design (modules.length) — deferred, by design
- [x] [Review][Defer] No role-based guard on CourseEditorPage route — deferred, pre-existing (from story 2.3)
- [x] [Review][Defer] Course fetched by filtering entire instructor list — deferred, deliberate spec decision
- [x] [Review][Defer] No unsaved-changes warning on navigation — deferred, not in story scope
- [x] [Review][Defer] No 403/404 error discrimination in error state — deferred, MVP scope
- [x] [Review][Defer] XSS surface for markdown content at render site — deferred, future story concern
- [x] [Review][Defer] Stale course data from shared list query — deferred, by spec design

### Change Log

- 2026-03-25: Implemented Story 2.4 — Course Editor Module & Lesson Management UI. Added alert-dialog shadcn component, extended useCourses.ts with full CRUD hooks for courses/modules/lessons, created ConfirmDeleteDialog/ModuleFormDialog/LessonFormDialog components, implemented CourseEditorPage with accordion-based module/lesson management, skeleton loading, error/not-found states.

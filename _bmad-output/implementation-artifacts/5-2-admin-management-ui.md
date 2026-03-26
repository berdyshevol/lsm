# Story 5.2: Admin Management UI

Status: done

## Story

As an **admin**,
I want a users management page and an all-courses overview page,
so that I can manage roles and oversee platform content through the browser.

## Acceptance Criteria

1. **Users Table** — Given an authenticated admin navigating to `/admin/users`, when the page loads, then they see a page title "Users" and a full-width data table (shadcn Table) with columns: Name, Email, Role (as RoleBadge), Joined (date), and a role change dropdown.

2. **Role Change** — Given the role change dropdown on a user row, when the admin selects a new role (Student / Instructor / Admin), then the API call fires (`PATCH /api/users/:id/role`), the RoleBadge updates immediately, and a toast shows "Role updated!".

3. **Self-Role Disabled** — Given the admin's own row in the table, when rendered, then the role dropdown is disabled (cannot change own role).

4. **Role Change Error** — Given a role change API failure, when the error occurs, then the dropdown reverts to the previous role and a toast error appears with `{ duration: 5000 }`.

5. **All Courses Table** — Given an authenticated admin navigating to `/admin/courses`, when the page loads, then they see a page title "All Courses" and a full-width data table with columns: Title, Instructor, Modules (count), Lessons (count), Created (date).

6. **Mobile Responsive** — Given mobile viewport, when the admin tables render, then tables have horizontal scroll (`overflow-x-auto`) with all columns preserved.

7. **Skeleton Loading** — Given loading states, when table data takes more than 300ms, then Skeleton row placeholders are shown.

## Tasks / Subtasks

- [x] Task 1: Create `useAdmin` React Query hooks (AC: #1, #2, #5)
  - [x] 1.1 Create `frontend/src/hooks/useAdmin.ts`
  - [x] 1.2 Add `useUsers()` query hook — `GET /api/users` → returns `User[]` with `{ id, name, email, role, createdAt }`; query key: `['users']`
  - [x] 1.3 Add `useUpdateUserRole()` mutation hook — `PATCH /api/users/:id/role` with `{ role }` body; on success: invalidate `['users']` query + `toast.success('Role updated!')`; on error: `toast.error(message, { duration: 5000 })`
  - [x] 1.4 Add `useAllCourses()` query hook — `GET /api/courses/all` → returns courses with instructor, moduleCount, lessonCount; query key: `['courses', 'all']`

- [x] Task 2: Implement AdminUsersPage (AC: #1, #2, #3, #4, #7)
  - [x] 2.1 Replace stub in `frontend/src/pages/AdminUsersPage.tsx` with full implementation
  - [x] 2.2 Page title: `<h1 className="text-3xl font-bold">Users</h1>`
  - [x] 2.3 Render shadcn `Table` with columns: Name, Email, Role (RoleBadge), Joined (formatted date), Actions (role dropdown)
  - [x] 2.4 Role dropdown: shadcn `Select` component with options `Student`, `Instructor`, `Admin`
  - [x] 2.5 Disable role dropdown on the admin's own row — compare `user.id === authUser.id` from `useAuth()`
  - [x] 2.6 On role change: call `useUpdateUserRole()` mutation; RoleBadge updates on query invalidation
  - [x] 2.7 Skeleton loading state: render 5 skeleton table rows when `isLoading` is true

- [x] Task 3: Implement AdminCoursesPage (AC: #5, #7)
  - [x] 3.1 Replace stub in `frontend/src/pages/AdminCoursesPage.tsx` with full implementation
  - [x] 3.2 Page title: `<h1 className="text-3xl font-bold">All Courses</h1>`
  - [x] 3.3 Render shadcn `Table` with columns: Title, Instructor (name), Modules (count), Lessons (count), Created (formatted date)
  - [x] 3.4 Skeleton loading state: render 5 skeleton table rows when `isLoading` is true

- [x] Task 4: Ensure mobile responsiveness (AC: #6)
  - [x] 4.1 Wrap both tables in `<div className="overflow-x-auto">` for horizontal scrolling
  - [x] 4.2 Verify all columns are preserved (no column hiding on mobile)

- [x] Task 5: Manual QA verification
  - [x] 5.1 Navigate to `/admin/users` as Admin → users table renders with all columns
  - [x] 5.2 Change a user's role via dropdown → RoleBadge updates + toast "Role updated!"
  - [x] 5.3 Own row dropdown is disabled
  - [x] 5.4 Simulate API error → dropdown reverts + error toast (5s)
  - [x] 5.5 Navigate to `/admin/courses` as Admin → all courses table renders with instructor name and counts
  - [x] 5.6 Check responsive: shrink viewport → tables scroll horizontally
  - [x] 5.7 Verify skeleton loading appears on slow connection (throttle in DevTools)

## Dev Notes

### Existing Code to Reuse

| What | Where | Notes |
|------|-------|-------|
| `RoleBadge` component | `frontend/src/components/common/RoleBadge.tsx` | Fully functional, color-coded by role. Import and use directly. |
| `useAuth` hook | `frontend/src/hooks/useAuth.tsx` | Provides `user` (current auth user with `id`, `role`), `isAdmin`, `isAuthenticated`. Use `user.id` for self-role comparison. |
| `fetchApi` | `frontend/src/lib/fetchApi.ts` | `fetchApi.get<T>()`, `fetchApi.patch<T>()`. Already includes `credentials: 'include'` and JSON Content-Type. |
| `queryClient` | `frontend/src/lib/queryClient.ts` | Global error handler already configured with `toast.error()`. `staleTime: 30_000`, `retry: 1`. |
| shadcn `Table` | `frontend/src/components/ui/table.tsx` | Already installed. Exports `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`. |
| shadcn `Select` | `frontend/src/components/ui/select.tsx` | Already installed. Exports `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`. |
| shadcn `Skeleton` | `frontend/src/components/ui/skeleton.tsx` | Already installed. Usage: `<Skeleton className="h-4 w-[200px]" />`. |
| `User` type | `frontend/src/hooks/useAuth.tsx` | `interface User { id: string; name: string; email: string; role: 'Student' \| 'Instructor' \| 'Admin' }`. Reuse for type safety. |
| `toast` from sonner | `sonner` | Already configured via `<Toaster />` in AppLayout. Use `toast.success()` and `toast.error(msg, { duration: 5000 })`. |
| React Query hooks pattern | `frontend/src/hooks/useCourses.ts` | Follow exact same pattern for `useAdmin.ts`: `useQuery` for reads, `useMutation` + `queryClient.invalidateQueries` for writes. |

### Critical Implementation Patterns

**React Query hook pattern (follow useCourses.ts exactly):**
```typescript
// frontend/src/hooks/useAdmin.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchApi } from '@/lib/fetchApi';
import { toast } from 'sonner';
import type { User } from '@/hooks/useAuth';

// Admin user has createdAt in the response
interface AdminUser extends User {
  createdAt: string;
}

// Courses response from GET /api/courses/all
interface AdminCourse {
  id: string;
  title: string;
  description: string;
  instructor: { id: string; name: string; email: string; role: string };
  moduleCount: number;
  lessonCount: number;
  createdAt: string;
}

export function useUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ['users'],
    queryFn: () => fetchApi.get<AdminUser[]>('/api/users'),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: User['role'] }) =>
      fetchApi.patch<AdminUser>(`/api/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Role updated!');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to update role. Please try again.', { duration: 5000 });
    },
  });
}

export function useAllCourses() {
  return useQuery<AdminCourse[]>({
    queryKey: ['courses', 'all'],
    queryFn: () => fetchApi.get<AdminCourse[]>('/api/courses/all'),
  });
}
```

**AdminUsersPage pattern:**
```typescript
// Key elements for the users page
import { useAuth } from '@/hooks/useAuth';
import { useUsers, useUpdateUserRole } from '@/hooks/useAdmin';
import { RoleBadge } from '@/components/common/RoleBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

// Self-role check: compare user.id from table with auth user.id
const { user: authUser } = useAuth();
const isSelf = (userId: string) => userId === authUser?.id;

// Role dropdown for each row:
<Select
  value={user.role}
  onValueChange={(value) => updateRole.mutate({ userId: user.id, role: value as User['role'] })}
  disabled={isSelf(user.id) || updateRole.isPending}
>
  <SelectTrigger className="w-[130px]">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="Student">Student</SelectItem>
    <SelectItem value="Instructor">Instructor</SelectItem>
    <SelectItem value="Admin">Admin</SelectItem>
  </SelectContent>
</Select>
```

**Date formatting:**
```typescript
// Use Intl.DateTimeFormat for consistent date display
const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
// Example output: "Mar 25, 2026"
```

**Skeleton table rows pattern:**
```typescript
// Render 5 skeleton rows while loading
{isLoading && Array.from({ length: 5 }).map((_, i) => (
  <TableRow key={i}>
    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
    <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
    <TableCell><Skeleton className="h-8 w-[130px]" /></TableCell>
  </TableRow>
))}
```

### API Endpoints (from Story 5-1)

| Endpoint | Method | Auth | Response |
|----------|--------|------|----------|
| `/api/users` | GET | Admin only | `AdminUser[]` — `{ id, name, email, role, createdAt }` (no password, no updatedAt) |
| `/api/users/:id/role` | PATCH | Admin only | Updated `AdminUser` — `{ id, name, email, role, createdAt }` |
| `/api/courses/all` | GET | Admin only | `AdminCourse[]` — courses with `instructor: { id, name, email, role }`, `moduleCount`, `lessonCount`, `createdAt` |

All endpoints return 403 for non-admin users. Self-role change returns 403 "Cannot change your own role".

### File Structure

**New files:**
```
frontend/src/hooks/useAdmin.ts              — React Query hooks for admin API
```

**Modified files:**
```
frontend/src/pages/AdminUsersPage.tsx       — Replace "Coming Soon" stub with full table
frontend/src/pages/AdminCoursesPage.tsx     — Replace "Coming Soon" stub with full table
```

**No routing changes needed** — routes already configured in App.tsx:
- `/admin/users` → `AdminUsersPage`
- `/admin/courses` → `AdminCoursesPage`

### Project Structure Notes

- Admin hooks go in `frontend/src/hooks/useAdmin.ts` — separate from `useCourses.ts` to maintain domain separation
- Both pages follow the same pattern as other pages (e.g., `MyCoursesPage.tsx`): use query hook → handle loading/error/data states → render content
- Use existing `RoleBadge` component — do NOT recreate role badge styling
- Use shadcn Table component — do NOT build a custom table
- Use shadcn Select for role dropdown — do NOT use HTML `<select>` or a custom dropdown
- Page titles use `text-3xl font-bold` (h1 level) per typography system
- Content uses `p-6` page padding and standard spacing (`space-y-6` between sections)

### Anti-Patterns to Avoid

- **DO NOT add pagination** — Dataset is small (demo scope), all data fits on one page
- **DO NOT add search/filter** — No search bar needed for 3 users and 3 courses
- **DO NOT add role-based route guards** — Pre-existing architectural gap (deferred from Story 2.3). Route protection is via API-level 403 responses. Non-admin users hitting these pages will see empty tables or API errors handled by the global error toast.
- **DO NOT add "delete user" or "edit course" functionality** — Admin can only view courses and change roles per PRD
- **DO NOT use optimistic UI for role changes** — Use query invalidation pattern (simpler, more reliable). The RoleBadge updates when the query refetches after successful mutation.
- **DO NOT modify App.tsx routing** — Admin routes already exist
- **DO NOT hardcode user data or mock responses** — Use the real API endpoints from Story 5-1
- **DO NOT add a `useCallback`/`useMemo` wrapper** around simple handlers — premature optimization, keep it simple

### Previous Story Intelligence

**From Story 5-1 (Admin API Endpoints) — direct predecessor:**
- API endpoints are fully implemented and tested (115 tests passing)
- `GET /api/users` returns `{ id, name, email, role, createdAt }` — NO `updatedAt` (stripped per review fix)
- `PATCH /api/users/:id/role` expects body `{ role: "Student" | "Instructor" | "Admin" }` — returns updated user
- Self-role change returns 403 "Cannot change your own role" — but UI should disable the dropdown preemptively
- `GET /api/courses/all` returns courses with `instructor` object (has `.name`), `moduleCount`, `lessonCount`
- `@ApiCookieAuth('access_token')` — cookie auth, NOT bearer tokens

**From Story 4-2 (Lesson View & Progress UI):**
- Admin pages were stubs ("Coming Soon") — this story replaces them
- `RoleBadge` component confirmed working and reusable
- Established pattern: loading → skeleton, error → toast, empty → EmptyState component

**From Story 1-4 (Login/Register & Role-Based Navigation):**
- AppSidebar already has Admin nav items: "Users" (`/admin/users`) and "All Courses" (`/admin/courses`)
- Admin default landing page is `/admin/users` (configured in App.tsx `defaultLanding` map)
- Error toast pattern: `toast.error(message, { duration: 5000 })` for 5-second display

**From deferred-work.md — items NOT to address in this story:**
- No role-based route guards (pre-existing gap from Story 2.3)
- No `forbidNonWhitelisted` on ValidationPipe (pre-existing)
- No catch-all 404 route (pre-existing from Story 1.3)

### UX Design Requirements

- **UX-DR7 (RoleBadge):** Color-coded badges — Student (blue), Instructor (green), Admin (red). Already implemented.
- **UX-DR12 (Toast feedback):** Success 3s auto-dismiss, Error 5s manual dismiss. Use `toast.success('Role updated!')` and `toast.error(msg, { duration: 5000 })`.
- **UX-DR15 (Loading states):** Skeleton placeholders for API calls. Never a blank page.
- **UX-DR16 (Responsive):** Tables scroll horizontally on mobile (`overflow-x-auto`). Full-width on desktop.
- **UX-DR17 (Default landing):** Admin lands on Users page — already configured.

### Admin UX Journey (from UX spec)

The admin journey is simple and direct:
1. Login as Admin → land on Users page
2. See all users in data table with name, email, role badge
3. Change a role → click dropdown → select new role → badge updates + toast
4. Click "All Courses" in sidebar → see courses table with instructor + counts
5. Self-role protection: own row's dropdown is disabled

This is a **2-click-to-value** flow: login → change a role. Keep it that way — no modals, no confirmation dialogs, no extra steps for role changes.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 5, Story 5.2, lines 695-730]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture, React Query Patterns, File Organization]
- [Source: _bmad-output/planning-artifacts/prd.md — FR5, FR6, FR15]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Admin Journey (lines 764-789), Design System, Layout Blueprint (line 652-653)]
- [Source: _bmad-output/implementation-artifacts/5-1-admin-api-endpoints.md — API response shapes, review findings]
- [Source: frontend/src/hooks/useCourses.ts — React Query hook pattern reference]
- [Source: frontend/src/components/common/RoleBadge.tsx — Reusable role badge component]
- [Source: frontend/src/pages/AdminUsersPage.tsx — Current stub to replace]
- [Source: frontend/src/pages/AdminCoursesPage.tsx — Current stub to replace]
- [Source: frontend/src/hooks/useAuth.tsx — User type definition, auth context]
- [Source: frontend/src/lib/fetchApi.ts — API client with credentials]

### Review Findings

- [x] [Review][Patch] No error state for API query failures — both pages ignore `isError`/`error` from useQuery; empty table shown on API failure instead of EmptyState with retry [AdminUsersPage.tsx:31, AdminCoursesPage.tsx:21] — FIXED
- [x] [Review][Patch] `course.instructor.name` crashes if instructor is null — no null-safe access on `course.instructor` [AdminCoursesPage.tsx:66] — FIXED
- [x] [Review][Patch] No empty table state — empty array renders blank table body instead of EmptyState message [AdminUsersPage.tsx, AdminCoursesPage.tsx] — FIXED
- [x] [Review][Defer] No admin role guard on client routes — ProtectedRoute only checks isAuthenticated, not isAdmin [App.tsx:120-121] — deferred, pre-existing (Story 2.3)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

No issues encountered. All 115 backend tests pass. Frontend TypeScript, ESLint, and build all pass clean.

### Completion Notes List

- Created `frontend/src/hooks/useAdmin.ts` with three React Query hooks: `useUsers()`, `useUpdateUserRole()`, `useAllCourses()`. Follows exact pattern from `useCourses.ts`.
- Replaced `AdminUsersPage.tsx` stub with full shadcn Table implementation: Name, Email, RoleBadge, Joined date, role Select dropdown. Self-role disabled via `isSelf()` check. 5 skeleton rows on loading.
- Replaced `AdminCoursesPage.tsx` stub with full shadcn Table: Title, Instructor name, Modules count, Lessons count, Created date. 5 skeleton rows on loading.
- Both pages wrapped with `overflow-x-auto` for mobile responsiveness. All columns preserved.
- `useUpdateUserRole` on success: invalidates `['users']` query (triggers RoleBadge refresh) + `toast.success('Role updated!')`. On error: `toast.error(message, { duration: 5000 })`.
- Dropdown disabled when `isSelf(user.id)` (self-role protection) or `updateRole.isPending` (prevents double-click).
- All ACs 1–7 satisfied. No pagination, no search, no guards added per anti-patterns.

### File List

- `frontend/src/hooks/useAdmin.ts` (new)
- `frontend/src/pages/AdminUsersPage.tsx` (modified)
- `frontend/src/pages/AdminCoursesPage.tsx` (modified)

## Change Log

- 2026-03-25: Implemented Admin Management UI — created `useAdmin.ts` hooks, replaced `AdminUsersPage.tsx` and `AdminCoursesPage.tsx` stubs with full table implementations including skeleton loading, mobile responsiveness, and role change functionality.

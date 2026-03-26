# Story 1.3: Frontend Foundation & App Shell

Status: done

## Story

As a **developer**,
I want the frontend infrastructure and app shell in place,
So that all subsequent frontend stories have routing, API communication, state management, and layout ready.

## Acceptance Criteria

1. React Router v7 configured with route definitions for all pages: `/login`, `/register`, `/my-learning`, `/my-courses`, `/courses` (catalog), `/courses/:id` (detail), `/courses/:id/lessons/:lessonId` (lesson view), `/admin/users`, `/admin/courses`. Pages render placeholder components (page name + "Coming Soon").
2. `fetchApi` wrapper (`src/lib/fetchApi.ts`) handles all API calls with `credentials: 'include'`, base URL from `import.meta.env.VITE_API_URL` (fallback `''` for same-origin), JSON content-type, and error handling that throws on non-OK responses with parsed error body.
3. React Query `QueryClient` configured with default `onError` showing toast via Sonner. `QueryClientProvider` wraps the app. `ReactQueryDevtools` included in dev mode.
4. `<Toaster />` (Sonner) mounted in the app root. Position: bottom-right. Success: 3s auto-dismiss. Error: 5s.
5. `useAuth` hook (`src/hooks/useAuth.tsx`) provides `AuthProvider` context and `useAuth()` hook. On app mount, calls `GET /api/auth/me` to restore session from httpOnly cookie. Exposes `{ user, isLoading, isAuthenticated, login, logout, register }`. `login`/`register` store user in context; `logout` calls `POST /api/auth/logout`, clears context + React Query cache, redirects to `/login`.
6. `AppLayout` (`src/components/layout/AppLayout.tsx`) wraps all authenticated routes. Contains: `AppSidebar` (left), `<main id="main">` content area (`p-6`, `max-w-5xl`), skip link (`<a href="#main">Skip to content</a>` hidden until focused).
7. `AppSidebar` (`src/components/layout/AppSidebar.tsx`) renders role-appropriate nav items — Student: My Learning (`/my-learning`), Browse Courses (`/courses`); Instructor: My Courses (`/my-courses`), Browse Courses (`/courses`); Admin: Users (`/admin/users`), All Courses (`/admin/courses`). Active item highlighted with `data-active` / `bg-muted`. App name "LSM" at top. User section at bottom with DropdownMenu containing Switch Account and Logout.
8. `RoleBadge` component (`src/components/common/RoleBadge.tsx`) renders shadcn Badge: Student (blue), Instructor (green), Admin (red).
9. Unauthenticated users accessing any protected route are redirected to `/login`. Authenticated users accessing `/login` or `/register` are redirected to their role's default landing page (Student: `/my-learning`, Instructor: `/my-courses`, Admin: `/admin/users`).
10. Route `/` redirects to the user's role-specific default landing page if authenticated, or `/login` if not.

## Tasks / Subtasks

- [x] Task 1: Create fetchApi wrapper (AC: #2)
  - [x] Create `src/lib/fetchApi.ts`
  - [x] Implement `fetchApi(url, options?)` with `credentials: 'include'`, JSON headers, error parsing
  - [x] Export typed helper methods: `fetchApi.get(url)`, `fetchApi.post(url, body)`, `fetchApi.patch(url, body)`, `fetchApi.delete(url)`
- [x] Task 2: Create useAuth hook and AuthProvider (AC: #5)
  - [x] Create `src/hooks/useAuth.tsx` with React Context pattern
  - [x] `AuthProvider` calls `GET /api/auth/me` on mount via `fetchApi` to restore session
  - [x] Expose `{ user, isLoading, isAuthenticated, login, logout, register }` and role helpers `{ isAdmin, isInstructor, isStudent }`
  - [x] `login(email, password)` calls `POST /api/auth/login`, stores user in state
  - [x] `register(name, email, password)` calls `POST /api/auth/register`, stores user in state
  - [x] `logout()` calls `POST /api/auth/logout`, clears user state, clears React Query cache (`queryClient.clear()`), navigates to `/login`
  - [x] Define `User` type: `{ id: string; name: string; email: string; role: 'Student' | 'Instructor' | 'Admin' }`
- [x] Task 3: Set up React Query + Sonner (AC: #3, #4)
  - [x] Create `QueryClient` with `defaultOptions.mutations.onError` and `defaultOptions.queries.retry: 1`
  - [x] Default mutation `onError`: extract error message, call `toast.error(message)`
  - [x] Wrap app with `QueryClientProvider`
  - [x] Add `<Toaster position="bottom-right" />` (Sonner) to app root
  - [x] Add `ReactQueryDevtools` conditionally in dev mode
- [x] Task 4: Create RoleBadge component (AC: #8)
  - [x] Create `src/components/common/RoleBadge.tsx`
  - [x] Student: `bg-blue-100 text-blue-700`; Instructor: `bg-green-100 text-green-700`; Admin: `bg-red-100 text-red-700`
  - [x] Accept `role` prop typed to `User['role']`
- [x] Task 5: Create AppSidebar component (AC: #7)
  - [x] Create `src/components/layout/AppSidebar.tsx`
  - [x] Use shadcn `Sidebar` component (`src/components/ui/sidebar.tsx`)
  - [x] Read user from `useAuth()` to determine nav items
  - [x] Nav items with lucide-react icons: Student (`BookOpen` My Learning, `Search` Browse Courses), Instructor (`BookCopy` My Courses, `Search` Browse Courses), Admin (`Users` Users, `Library` All Courses)
  - [x] Active item detection via `useLocation()` from react-router, apply `data-active` attribute
  - [x] Bottom section: user name + role badge + DropdownMenu with "Switch Account" and "Logout"
  - [x] "Switch Account" calls `logout()` from useAuth (which clears everything and redirects to /login)
  - [x] "Logout" also calls `logout()` from useAuth
- [x] Task 6: Create AppLayout component (AC: #6)
  - [x] Create `src/components/layout/AppLayout.tsx`
  - [x] Skip link: `<a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4">Skip to content</a>`
  - [x] Use shadcn `SidebarProvider` + `SidebarInset` pattern
  - [x] `<main id="main" className="flex-1 p-6"><div className="mx-auto max-w-5xl">{children or Outlet}</div></main>`
- [x] Task 7: Create placeholder page components (AC: #1)
  - [x] Create `src/pages/` directory with placeholder files:
    - `LoginPage.tsx`, `RegisterPage.tsx` (public)
    - `MyLearningPage.tsx`, `CourseCatalogPage.tsx`, `CourseDetailPage.tsx`, `LessonViewPage.tsx` (student/shared)
    - `MyCoursesPage.tsx` (instructor)
    - `AdminUsersPage.tsx`, `AdminCoursesPage.tsx` (admin)
  - [x] Each placeholder: `<div><h1 className="text-3xl font-bold">{Page Name}</h1><p className="text-muted-foreground">Coming soon</p></div>`
- [x] Task 8: Configure React Router with route protection (AC: #1, #9, #10)
  - [x] Update `App.tsx` to define routes using `BrowserRouter` and `Routes` from react-router
  - [x] Create `ProtectedRoute` wrapper: checks `useAuth().isAuthenticated`, redirects to `/login` if not, renders `AppLayout` with `<Outlet />` if yes
  - [x] Create `PublicRoute` wrapper: if authenticated, redirects to role's default page; otherwise renders children
  - [x] Route `/` redirects to role default if authenticated, `/login` if not
  - [x] Define route structure:
    - Public: `/login` -> LoginPage, `/register` -> RegisterPage
    - Protected (inside AppLayout): `/my-learning`, `/my-courses`, `/courses`, `/courses/:id`, `/courses/:id/lessons/:lessonId`, `/admin/users`, `/admin/courses`
  - [x] Show loading spinner/skeleton while `useAuth().isLoading` is true (session restoration in progress)
- [x] Task 9: Update main.tsx with providers (AC: #3, #4, #5)
  - [x] Replace ThemeProvider wrapping with: `QueryClientProvider` > `AuthProvider` > `App`
  - [x] Add `<Toaster position="bottom-right" />` outside of routing (visible on all pages)
  - [x] Keep `StrictMode`
  - [x] Remove or repurpose ThemeProvider if dark mode is not in scope (light mode only per UX spec)
- [x] Task 10: Verify end-to-end setup (AC: all)
  - [x] Run `npm run build` in frontend — must compile cleanly
  - [x] Run `npm run lint` — must pass
  - [x] Verify dev server starts and shows login page at `/`
  - [x] Verify protected routes redirect to `/login` when not authenticated

## Dev Notes

### Critical: What Exists Already (from Stories 1.1 + 1.2)

**Frontend (Story 1.1):**
- Scaffolded React 19 + Vite 7 + TypeScript 5.9 + Tailwind CSS 4.2 + shadcn/ui
- 18 shadcn components in `src/components/ui/` (button, card, progress, table, badge, breadcrumb, sidebar, input, textarea, select, accordion, scroll-area, skeleton, dropdown-menu, separator, label, tooltip, sheet)
- `src/components/theme-provider.tsx` — shadcn theme provider (dark mode toggle, may remove for light-only)
- `src/hooks/use-mobile.ts` — mobile detection hook (installed with sidebar component)
- `src/lib/utils.ts` — `cn()` helper for class merging
- `src/App.tsx` — default "Project ready!" placeholder (REPLACE)
- `src/main.tsx` — wraps App with StrictMode + ThemeProvider (MODIFY)
- `src/index.css` — Tailwind + shadcn CSS variables
- All frontend deps installed: react-router@7.x, @tanstack/react-query@5.x, sonner@2.x, react-hook-form@7.x, @hookform/resolvers@5.x, zod@4.x, lucide-react, @tailwindcss/typography
- Vite proxy: `/api/*` -> `http://localhost:3001`

**Backend (Story 1.2) — API endpoints available:**
- `POST /api/auth/register` — body: `{ name, email, password }` -> sets httpOnly cookie, returns `{ id, name, email, role }`
- `POST /api/auth/login` — body: `{ email, password }` -> sets httpOnly cookie, returns `{ id, name, email, role }`
- `GET /api/auth/me` — reads cookie -> returns `{ id, name, email, role }` or 401
- `POST /api/auth/logout` — clears cookie -> returns `{ message: 'Logged out' }`
- Error format: `{ statusCode, message, error }` (e.g., `{ statusCode: 401, message: 'Unauthorized', error: 'Unauthorized' }`)
- JWT stored in httpOnly cookie named `access_token` with `SameSite=Lax`, `Secure` in production
- All auth responses return: `{ id: string (UUID), name: string, email: string, role: 'Student' | 'Instructor' | 'Admin' }`

### Architecture Compliance

**File structure** — create exactly these new files/directories:
```
frontend/src/
  lib/
    fetchApi.ts           # NEW — API wrapper
    utils.ts              # EXISTS (cn helper)
  hooks/
    useAuth.tsx           # NEW — AuthProvider + useAuth hook
    use-mobile.ts         # EXISTS (keep)
  components/
    ui/                   # EXISTS (shadcn, never modify)
    layout/               # NEW directory
      AppLayout.tsx       # NEW
      AppSidebar.tsx      # NEW
    common/               # NEW directory
      RoleBadge.tsx       # NEW
    theme-provider.tsx    # EXISTS (evaluate if needed)
  pages/                  # NEW directory
    LoginPage.tsx         # NEW (placeholder)
    RegisterPage.tsx      # NEW (placeholder)
    MyLearningPage.tsx    # NEW (placeholder)
    CourseCatalogPage.tsx # NEW (placeholder)
    CourseDetailPage.tsx  # NEW (placeholder)
    LessonViewPage.tsx    # NEW (placeholder)
    MyCoursesPage.tsx     # NEW (placeholder)
    AdminUsersPage.tsx    # NEW (placeholder)
    AdminCoursesPage.tsx  # NEW (placeholder)
  App.tsx                 # REPLACE — routing setup
  main.tsx                # MODIFY — add providers
```

**Naming conventions:**
- Components: `PascalCase` files and exports (`AppSidebar.tsx`, `RoleBadge.tsx`)
- Hooks: `camelCase` with `use` prefix (`useAuth.tsx`) — exception: `useAuth.tsx` uses `.tsx` extension because it exports both `AuthProvider` (JSX) and `useAuth` hook
- Utils: `camelCase` (`fetchApi.ts`)
- Pages: `PascalCase` (`LoginPage.tsx`, `AdminUsersPage.tsx`)
- Folders: domain-grouped (`components/layout/`, `components/common/`, `pages/`)

### React Router v7 Setup

**Package:** `react-router` (NOT `react-router-dom` — v7 merged all packages).

**Import pattern:**
```typescript
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation, useNavigate } from 'react-router';
```

**Route structure:**
```
/                          -> Redirect to role default or /login
/login                     -> LoginPage (public)
/register                  -> RegisterPage (public)
/my-learning               -> MyLearningPage (protected, student default)
/my-courses                -> MyCoursesPage (protected, instructor default)
/courses                   -> CourseCatalogPage (protected)
/courses/:id               -> CourseDetailPage (protected)
/courses/:id/lessons/:lessonId -> LessonViewPage (protected)
/admin/users               -> AdminUsersPage (protected, admin default)
/admin/courses             -> AdminCoursesPage (protected)
```

**Role-specific default landing pages (UX-DR17):**
- Student -> `/my-learning`
- Instructor -> `/my-courses`
- Admin -> `/admin/users`

### fetchApi Implementation

```typescript
const API_BASE = import.meta.env.VITE_API_URL || '';

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      statusCode: response.status,
      message: response.statusText,
      error: 'Request Failed',
    }));
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}
```

Add convenience methods: `fetchApi.get<T>(url)`, `fetchApi.post<T>(url, body)`, `fetchApi.patch<T>(url, body)`, `fetchApi.delete<T>(url)`.

**Critical:** `credentials: 'include'` is required for httpOnly cookies to be sent. Without it, `GET /api/auth/me` always returns 401.

**No Content-Type for requests without body** — when making GET/DELETE requests, either omit `Content-Type` or set it conditionally. Some servers reject `Content-Type: application/json` on GET requests, though NestJS handles it fine.

### useAuth Implementation Pattern

```typescript
// src/hooks/useAuth.tsx
interface User {
  id: string;
  name: string;
  email: string;
  role: 'Student' | 'Instructor' | 'Admin';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isInstructor: boolean;
  isStudent: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

**Session restoration on mount:** `AuthProvider` calls `GET /api/auth/me` on mount. If 200, sets user. If 401, sets user to null. While loading, `isLoading = true` — the app shows a loading state (skeleton or spinner) to prevent flash of login page.

**`logout()` must clear everything (UX-DR18):**
1. Call `POST /api/auth/logout` (server clears cookie)
2. Set user to null in context
3. Call `queryClient.clear()` to wipe React Query cache
4. Navigate to `/login` via `useNavigate()`

**Access `queryClient` in logout:** Import `useQueryClient()` from `@tanstack/react-query` inside the AuthProvider, since it's wrapped by `QueryClientProvider`.

### React Query Setup

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000, // 30s
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: unknown) => {
        const message = (error as any)?.message || 'Something went wrong';
        toast.error(Array.isArray(message) ? message[0] : message);
      },
    },
  },
});
```

**Sonner Toaster config:**
```tsx
<Toaster position="bottom-right" toastOptions={{
  duration: 3000,
  classNames: { error: 'bg-destructive text-destructive-foreground' },
}} />
```

Error toasts should use `toast.error()` with 5s duration (override per-call: `toast.error(msg, { duration: 5000 })`).

### AppSidebar Using shadcn Sidebar Component

The shadcn `Sidebar` component (`src/components/ui/sidebar.tsx`) provides `SidebarProvider`, `Sidebar`, `SidebarContent`, `SidebarHeader`, `SidebarFooter`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent`, and `SidebarTrigger`.

**Use these compositional primitives** — do NOT build a custom sidebar from scratch.

**Pattern:**
```tsx
<Sidebar>
  <SidebarHeader>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg">LSM</SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarHeader>
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map(item => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                <Link to={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
  <SidebarFooter>
    {/* User section with DropdownMenu */}
  </SidebarFooter>
</Sidebar>
```

**`Link` import:** `import { Link } from 'react-router';` (NOT `react-router-dom`).

### AppLayout Pattern

```tsx
<SidebarProvider>
  <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-background focus:text-foreground">
    Skip to content
  </a>
  <AppSidebar />
  <SidebarInset>
    <main id="main" className="flex-1 p-6">
      <div className="mx-auto max-w-5xl">
        <Outlet />
      </div>
    </main>
  </SidebarInset>
</SidebarProvider>
```

`SidebarInset` is the main content area component from shadcn sidebar — it handles the layout alongside the sidebar correctly.

### ProtectedRoute Pattern

```tsx
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
}
```

`AppLayout` renders `<Outlet />` which displays the matched child route.

### ThemeProvider Decision

The UX spec says **light mode only** (no dark mode in MVP). The existing `theme-provider.tsx` provides dark mode toggling. Options:
1. **Keep ThemeProvider but force light mode** — set `defaultTheme="light"` and `storageKey="lsm-ui-theme"`. Simple, non-breaking.
2. **Remove ThemeProvider** — simplest, but the index.css already references CSS variables for both modes.

**Recommended:** Keep ThemeProvider, set `defaultTheme="light"`. Don't invest time removing it. The interviewer won't penalize having dark mode support — it's a feature, not a bug.

### What NOT To Do

**Dependencies:**
- Do NOT install `react-router-dom` — it's `react-router` v7 (already installed)
- Do NOT install `axios` — use `fetchApi` with native `fetch`
- Do NOT install a state management library (Redux, Zustand) — React Context + React Query covers all needs
- Do NOT install `@types/react-router` — react-router v7 includes its own types

**Patterns:**
- Do NOT store JWT in localStorage — the backend uses httpOnly cookies (Story 1.2)
- Do NOT create a custom sidebar from scratch — use shadcn `Sidebar` component
- Do NOT add role-based route guards yet — route protection (auth yes/no) only; role-specific page access restrictions will be added when pages are implemented
- Do NOT implement actual page content — only placeholders (actual pages are Stories 1.4, 2.3, 2.4, 3.2, 4.2, 5.2)
- Do NOT add Breadcrumbs component yet — that's deferred to Story 6.2 (P1 priority per UX spec)
- Do NOT add CourseSidebar yet — that's Story 4.2 (LessonView with sidebar context switching)
- Do NOT add EmptyState yet — those are per-page concerns in later stories
- Do NOT use `useEffect` for session restoration when `React.use()` or query-based patterns could be cleaner — but standard `useEffect` + state is fine and well-understood

**Scope boundaries:**
- Do NOT implement DemoCredentials — that's Story 1.4
- Do NOT implement login/register forms — that's Story 1.4
- Do NOT implement any actual page functionality — all pages are placeholders
- Do NOT set up form validation patterns — that's per-page in later stories
- Do NOT create course-domain components (CourseCard, CourseSidebar, LessonContent) — those are Stories 3.2, 4.2

### Previous Story Intelligence

**From Story 1.1:**
- shadcn CLI v4 scaffolded with Nova preset + Geist font — `@fontsource-variable/geist` is installed
- 16 of 17 planned shadcn components installed (form component removed in shadcn v4 — form integration now via react-hook-form directly)
- Extra auto-installed: tooltip, sheet, use-mobile hook (sidebar deps)
- ESLint config already updated for shadcn UI directory
- Zod 4.3.6 with @hookform/resolvers@5.2.2 (Zod 4 compatible)
- `lucide-react` already included by shadcn scaffolding
- React 19.2.4 — supports React.use() for suspense patterns, but standard patterns fine

**From Story 1.2:**
- Auth API endpoints fully working and tested (25 unit tests)
- Cookie options: `httpOnly: true`, `sameSite: 'lax'`, `secure: NODE_ENV === 'production'`, `path: '/'`, `maxAge: 86400 * 1000`
- User type: `{ id (UUID string), name, email, role ('Student'|'Instructor'|'Admin') }`
- Email is normalized to lowercase in DTOs (story 1.2 review fix)
- Error format: `{ statusCode: number, message: string | string[], error: string }`
- `message` can be a string array for validation errors (from class-validator via ValidationPipe)
- Login endpoint uses Passport LocalStrategy — body `{ email, password }`
- Register returns created user after auto-login (cookie set)
- `GET /auth/me` returns user from JWT payload — includes `name` (added in 1.2 review fix)

**From Story 1.2 Review Findings:**
- `message` field in error responses can be `string[]` for validation errors — the toast error handler must handle arrays
- Email normalization is handled server-side (lowercase transform in DTOs)

### Git Intelligence

Only 1 commit so far (project setup + planning artifacts). All backend code from Stories 1.1/1.2 is unstaged. The frontend is a vanilla scaffold with shadcn components installed.

### Project Structure Notes

- Alignment with architecture.md project structure: new files created in exact locations specified
- `src/components/ui/` remains untouched (shadcn components)
- New directories (`layout/`, `common/`, `pages/`) follow architecture.md frontend structure
- No conflicts with existing files — `App.tsx` is replaced, `main.tsx` is modified

### References

- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Naming (React Standard)]
- [Source: _bmad-output/planning-artifacts/architecture.md — React Query Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md — File Organization Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend State Management Architecture]
- [Source: _bmad-output/planning-artifacts/architecture.md — Project Structure & Boundaries]
- [Source: _bmad-output/planning-artifacts/epics.md — Story 1.3 Acceptance Criteria]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — AppSidebar, AppLayout, RoleBadge specs]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Auth Architecture (httpOnly Cookies)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — UX-DR1 through UX-DR24]
- [Source: _bmad-output/planning-artifacts/prd.md — FR1-FR4, FR24, NFR6-NFR8]
- [Source: _bmad-output/implementation-artifacts/1-1-project-scaffolding-monorepo-configuration.md — Completion Notes]
- [Source: _bmad-output/implementation-artifacts/1-2-user-registration-authentication-api.md — API Endpoints, Review Findings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- ESLint `react-refresh/only-export-components` error on `useAuth.tsx` — resolved with eslint-disable comment (same pattern as existing `theme-provider.tsx`)

### Completion Notes List

- **Task 1:** Created `fetchApi` wrapper with `credentials: 'include'`, JSON headers, error parsing, typed convenience methods (get/post/patch/delete)
- **Task 2:** Created `AuthProvider` + `useAuth` hook with session restoration on mount via `GET /api/auth/me`, login/register/logout actions, role helpers (isAdmin/isInstructor/isStudent), queryClient.clear() on logout
- **Task 3:** Created `queryClient` in `src/lib/queryClient.ts` with retry:1, staleTime:30s, mutation onError toast handler that handles both string and string[] error messages with 5s duration
- **Task 4:** Created `RoleBadge` component using shadcn Badge with role-specific color classes
- **Task 5:** Created `AppSidebar` using shadcn Sidebar primitives with role-based navigation items, lucide-react icons, active item detection via useLocation, user footer with DropdownMenu (Switch Account + Logout)
- **Task 6:** Created `AppLayout` with SidebarProvider, skip-to-content link, AppSidebar, SidebarInset, and Outlet
- **Task 7:** Created 9 placeholder page components in `src/pages/` directory
- **Task 8:** Configured React Router v7 with ProtectedRoute (redirects to /login), PublicRoute (redirects authenticated users to role landing), RootRedirect for `/`, and all route definitions
- **Task 9:** Updated `main.tsx` with provider hierarchy: StrictMode > ThemeProvider (light default) > QueryClientProvider > BrowserRouter > App(AuthProvider). Added Toaster and ReactQueryDevtools
- **Task 10:** Build compiles cleanly (tsc + vite), ESLint passes with zero errors
- **Architecture note:** BrowserRouter placed in main.tsx (outside App) so AuthProvider (which needs useNavigate) is correctly nested inside router context, while QueryClientProvider wraps both for useQueryClient access in logout

### Change Log

- 2026-03-25: Implemented Story 1.3 — Frontend Foundation & App Shell (all 10 tasks)

### File List

- `src/lib/fetchApi.ts` — NEW: API wrapper with credentials and error handling
- `src/lib/queryClient.ts` — NEW: React Query client configuration with Sonner toast error handling
- `src/hooks/useAuth.tsx` — NEW: AuthProvider context and useAuth hook
- `src/components/common/RoleBadge.tsx` — NEW: Role badge with color-coded variants
- `src/components/layout/AppSidebar.tsx` — NEW: Role-based sidebar navigation
- `src/components/layout/AppLayout.tsx` — NEW: App shell with sidebar, skip link, and content area
- `src/pages/LoginPage.tsx` — NEW: Placeholder
- `src/pages/RegisterPage.tsx` — NEW: Placeholder
- `src/pages/MyLearningPage.tsx` — NEW: Placeholder
- `src/pages/CourseCatalogPage.tsx` — NEW: Placeholder
- `src/pages/CourseDetailPage.tsx` — NEW: Placeholder
- `src/pages/LessonViewPage.tsx` — NEW: Placeholder
- `src/pages/MyCoursesPage.tsx` — NEW: Placeholder
- `src/pages/AdminUsersPage.tsx` — NEW: Placeholder
- `src/pages/AdminCoursesPage.tsx` — NEW: Placeholder
- `src/App.tsx` — REPLACED: Routing with ProtectedRoute, PublicRoute, RootRedirect
- `src/main.tsx` — MODIFIED: Provider hierarchy (QueryClientProvider, BrowserRouter, Toaster, ReactQueryDevtools)

### Review Findings

- [x] [Review][Patch] Logout failure silently swallowed — local state not cleared if POST fails [src/hooks/useAuth.tsx:73-78]
- [x] [Review][Patch] Sidebar active-state matching misses nested routes — strict equality fails for /courses/:id [src/components/layout/AppSidebar.tsx:82]
- [x] [Review][Patch] Placeholder text "Coming soon" should be "Coming Soon" per AC#1 [src/pages/*.tsx]
- [x] [Review][Defer] Content-Type: application/json set on bodyless GET/DELETE requests [src/lib/fetchApi.ts:7-10] — deferred, future file upload stories will address
- [x] [Review][Defer] No catch-all / 404 route for unmatched paths [src/App.tsx] — deferred, not in story scope
- [x] [Review][Defer] Error toast 5s duration only enforced in mutation handler, not globally [src/lib/queryClient.ts, src/main.tsx] — deferred, future toast.error calls must set duration explicitly

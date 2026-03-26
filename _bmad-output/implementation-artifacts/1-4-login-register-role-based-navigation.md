# Story 1.4: Login, Register & Role-Based Navigation

Status: done

## Story

As a **user**,
I want a polished login/register experience with one-click demo accounts and role-aware redirects,
So that I can access the application and immediately see features appropriate to my role.

## Acceptance Criteria

1. Login page at `/login` shows a login form (email + password) using shadcn Input + react-hook-form + zod validation, and a "Demo Accounts" section below with three one-click buttons: Student (`student@lms.com`), Instructor (`instructor@lms.com`), Admin (`admin@lms.com`) — each showing role icon + email + role label.
2. Clicking a demo credential button shows a loading spinner on that button (others disabled), sends a login request via `useAuth().login()`, and redirects to the role's default landing page (Student -> `/my-learning`, Instructor -> `/my-courses`, Admin -> `/admin/users`).
3. Register page at `/register` shows a registration form (name, email, password) with zod validation. On valid submission, calls `useAuth().register()`, user is logged in automatically, and redirected to `/my-learning` (Student by default).
4. Form validation errors appear as inline messages below invalid fields. Form data is preserved on validation or API errors.
5. Login form submit button shows spinner + "Signing in..." during API call. Register form submit button shows spinner + "Creating account..." during API call.
6. "Switch Account" in sidebar dropdown calls `useAuth().logout()` (which clears auth context, React Query cache, and redirects to `/login`). This flow already works from Story 1.3.
7. Login and register pages link to each other: "Don't have an account? Register" on login, "Already have an account? Sign in" on register.

## Tasks / Subtasks

- [x] Task 1: Create DemoCredentials component (AC: #1, #2)
  - [x] Create `src/components/common/DemoCredentials.tsx`
  - [x] Render 3 buttons vertically: Student, Instructor, Admin
  - [x] Each button shows: lucide-react role icon + email + role label
  - [x] Icons: Student (`GraduationCap`), Instructor (`BookOpen`), Admin (`Shield`)
  - [x] On click: set loading state on clicked button, disable others, call `useAuth().login(email, 'password123')`
  - [x] On success: `login()` sets user state -> component re-renders -> `PublicRoute` detects `isAuthenticated` -> redirects to role default page
  - [x] On error: show toast error, re-enable all buttons
  - [x] Add `aria-label="Login as Student"` etc. to each button
  - [x] Section header: "Demo Accounts" with `text-sm font-medium text-muted-foreground`
  - [x] Visual separator (shadcn `Separator`) between login form and demo section

- [x] Task 2: Implement LoginPage (AC: #1, #2, #4, #5, #7)
  - [x] Replace placeholder in `src/pages/LoginPage.tsx`
  - [x] Layout: centered card (`max-w-md mx-auto mt-16`), using shadcn `Card` + `CardHeader` + `CardContent`
  - [x] Card header: "Sign in" title + "Enter your credentials to access the platform" description
  - [x] Form using react-hook-form + zod schema: `{ email: z.email(), password: z.string().min(1, "Password is required") }`
  - [x] Email field: shadcn `Input` with `type="email"`, `placeholder="email@example.com"`
  - [x] Password field: shadcn `Input` with `type="password"`
  - [x] Submit button: full-width, `disabled={isSubmitting}`, shows spinner + "Signing in..." when `isSubmitting` is true
  - [x] On submit: call `useAuth().login(email, password)`
  - [x] On API error: show toast error (already handled by useAuth), keep form data
  - [x] Inline validation errors below each field using `formState.errors`
  - [x] Below form: render `<DemoCredentials />`
  - [x] Footer link: "Don't have an account?" + `<Link to="/register">Register</Link>`

- [x] Task 3: Implement RegisterPage (AC: #3, #4, #5, #7)
  - [x] Replace placeholder in `src/pages/RegisterPage.tsx`
  - [x] Layout: same centered card pattern as LoginPage
  - [x] Card header: "Create an account" title + "Enter your details to get started" description
  - [x] Form using react-hook-form + zod schema: `{ name: z.string().min(1, "Name is required"), email: z.email(), password: z.string().min(6, "Password must be at least 6 characters") }`
  - [x] Name field: shadcn `Input` with `placeholder="Your name"`
  - [x] Email field: shadcn `Input` with `type="email"`, `placeholder="email@example.com"`
  - [x] Password field: shadcn `Input` with `type="password"`, `placeholder="At least 6 characters"`
  - [x] Submit button: full-width, `disabled={isSubmitting}`, shows spinner + "Creating account..." when `isSubmitting` is true
  - [x] On submit: call `useAuth().register(name, email, password)`
  - [x] On API error: keep form data, error toast handled by useAuth/React Query mutation handler
  - [x] Footer link: "Already have an account?" + `<Link to="/login">Sign in</Link>`

- [x] Task 4: Verify end-to-end (AC: all)
  - [x] Run `npm run build` in frontend — must compile cleanly
  - [x] Run `npm run lint` — must pass
  - [x] Verify login page renders with form + demo credentials
  - [x] Verify register page renders with form
  - [x] Verify form validation shows inline errors
  - [x] Verify demo credential buttons trigger login flow

## Dev Notes

### Critical: What Exists Already (from Stories 1.1, 1.2, 1.3)

**Infrastructure (Story 1.3) — USE, DO NOT RECREATE:**
- `useAuth` hook at `src/hooks/useAuth.tsx` — provides `{ user, isLoading, isAuthenticated, login, register, logout, isAdmin, isInstructor, isStudent }`
- `login(email, password)` calls `POST /api/auth/login`, stores user in context (does NOT navigate — `PublicRoute` handles redirect on re-render)
- `register(name, email, password)` calls `POST /api/auth/register`, stores user in context (redirect via `PublicRoute`)
- `logout()` calls `POST /api/auth/logout`, clears context + React Query cache, navigates to `/login`
- `fetchApi` at `src/lib/fetchApi.ts` — handles `credentials: 'include'`, JSON, error parsing
- `queryClient` at `src/lib/queryClient.ts` — mutation `onError` shows toast via Sonner (handles `string[]` validation errors)
- React Router v7 configured in `App.tsx` — `PublicRoute` wrapper redirects authenticated users to role landing page
- `ProtectedRoute` wrapper redirects unauthenticated to `/login`
- `RoleBadge` at `src/components/common/RoleBadge.tsx` — available for reuse if needed
- Sonner `<Toaster />` mounted in `main.tsx`

**Backend API (Story 1.2):**
- `POST /api/auth/login` — body: `{ email, password }` -> sets httpOnly cookie, returns `{ id, name, email, role }`
- `POST /api/auth/register` — body: `{ name, email, password }` -> sets httpOnly cookie, returns `{ id, name, email, role }`
- Error format: `{ statusCode: number, message: string | string[], error: string }`
- `message` can be `string[]` for validation errors (class-validator via ValidationPipe)
- Password minimum length: 6 characters (from backend DTO validation)
- Email normalization: handled server-side (lowercase transform in DTOs)

**Available shadcn components:**
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` — for form containers
- `Input`, `Label` — for form fields
- `Button` — for submit buttons (supports `disabled` prop)
- `Separator` — for visual separation between login form and demo credentials
- `Badge` — if needed for role labels in demo credentials

**NOT available (shadcn v4):**
- `Form` component — removed in shadcn v4. Use react-hook-form directly with `Input` + `Label` + manual error display

### Form Pattern (react-hook-form + zod v4)

**Zod v4 import:**
```typescript
import { z } from 'zod';
```

**react-hook-form + zod integration (v4 compatible):**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
  resolver: zodResolver(loginSchema),
  mode: 'onSubmit', // UX-DR14: validate on submit only, no blur validation
});
```

**CRITICAL — Zod 4 breaking change:** `z.string().email()` is now `z.email()`. The `@hookform/resolvers@5.2.2` is compatible with Zod 4.

**Form layout:** Wrap all fields in `<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">` for consistent inter-field spacing.

**Inline error display pattern (no shadcn Form component):**
```tsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" autoComplete="email" aria-describedby={errors.email ? "email-error" : undefined} {...register('email')} />
  {errors.email && (
    <p id="email-error" className="text-sm text-destructive">{errors.email.message}</p>
  )}
</div>
```

**autoComplete attributes:** Login: email=`"email"`, password=`"current-password"`. Register: name=`"name"`, email=`"email"`, password=`"new-password"`.

### DemoCredentials Component Design

**Seed account credentials (from FR26):**
- Student: `student@lms.com` / `password123`
- Instructor: `instructor@lms.com` / `password123`
- Admin: `admin@lms.com` / `password123`

**Button design pattern:**
```tsx
<Button
  variant="outline"
  className="w-full justify-start gap-3"
  disabled={loadingRole !== null}
  onClick={() => handleDemoLogin('student@lms.com', 'Student')}
  aria-label="Login as Student"
>
  {loadingRole === 'Student' ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
  <span className="flex-1 text-left">student@lms.com</span>
  <span className="text-muted-foreground text-xs">Student</span>
</Button>
```

**Loading state:** Track `loadingRole: string | null`. When a button is clicked, set `loadingRole` to that role. On success (redirect happens), keep loading. On error, reset to null.

**Import `Loader2` from lucide-react** for the spinner icon (standard pattern for loading states with lucide).

### Login/Register Page Layout

**Centered card layout (UX spec: Login/Register = centered card, max-w-md):**
```tsx
<div className="flex min-h-screen items-center justify-center p-4">
  <Card className="w-full max-w-md">
    <CardHeader className="text-center">
      <CardTitle className="text-2xl">Sign in</CardTitle>
      <CardDescription>Enter your credentials to access the platform</CardDescription>
    </CardHeader>
    <CardContent>
      {/* Form */}
      {/* DemoCredentials */}
    </CardContent>
    <CardFooter className="justify-center">
      {/* Link to register */}
    </CardFooter>
  </Card>
</div>
```

**Public pages bypass AppLayout** — `LoginPage` and `RegisterPage` are rendered by `PublicRoute` (Story 1.3), which does NOT wrap in `AppLayout`. They render as standalone centered cards.

### Post-Auth Redirect Mechanism

**How redirect works after login/register (critical to understand):**
1. `useAuth().login()` / `register()` call the API and call `setUser(data)` — they do **NOT** call `navigate()` themselves
2. Setting user triggers a React re-render of the component tree
3. `PublicRoute` (which wraps login/register pages) checks `isAuthenticated` on every render
4. When `isAuthenticated` becomes `true`, `PublicRoute` renders `<Navigate to={roleDefaultPage} replace />`
5. This is a re-render-driven redirect chain, NOT an imperative navigation call

**Do NOT add `navigate()` calls after `login()`/`register()`** — `PublicRoute` handles it automatically.

**Import:** `import { Link } from 'react-router';` (NOT `react-router-dom`). No need for `useNavigate` in login/register pages.

**Known gap (deferred):** After unauthenticated redirect to `/login`, the intended destination is not preserved. Redirect-to-intended-page is deferred to a future story.

### Error Handling

**API errors during login/register:**
- The `useAuth` hook's `login()` and `register()` methods throw on API error
- The `queryClient` default mutation `onError` shows a toast via Sonner (handles both `string` and `string[]` messages)
- **However:** `useAuth().login()` and `register()` are NOT React Query mutations — they are plain async functions using `fetchApi` directly
- **Therefore:** Wrap login/register calls in try/catch in the form's `onSubmit` handler
- On catch: display the error via `toast.error()` from Sonner
- Error message extraction: `(error as any)?.message || 'Something went wrong'`; handle `string[]` case with `Array.isArray(message) ? message[0] : message`

```typescript
import { toast } from 'sonner';

const onSubmit = async (data: LoginFormData) => {
  try {
    await login(data.email, data.password);
  } catch (error: unknown) {
    const message = (error as any)?.message || 'Invalid credentials';
    toast.error(Array.isArray(message) ? message[0] : message, { duration: 5000 });
  }
};
```

### What NOT To Do

**Dependencies:**
- Do NOT install any new packages — everything needed is already installed
- Do NOT install `@types/react-router` — react-router v7 includes its own types
- Do NOT use `axios` — use `fetchApi` or call `useAuth()` methods directly

**Patterns:**
- Do NOT implement a custom auth flow — use `useAuth().login()` and `useAuth().register()` (Story 1.3)
- Do NOT use shadcn `Form` component — it doesn't exist in shadcn v4; use react-hook-form directly
- Do NOT bypass `PublicRoute` or `ProtectedRoute` — these handle auth redirects (Story 1.3)
- Do NOT build a custom loading spinner — use `Loader2` from lucide-react with `animate-spin`
- Do NOT add role-based route protection on login/register — these are public routes via `PublicRoute` wrapper
- Do NOT add `navigate()` calls after login/register — `PublicRoute` handles redirect via re-render detection
- Do NOT implement redirect-to-intended-page — deferred to future story

**Scope boundaries:**
- Do NOT implement cold start UX — that's Story 6.x
- Do NOT implement forgot password — not in MVP scope
- Do NOT add password strength indicator — not in scope
- Do NOT modify `useAuth.tsx` — it already provides everything needed
- Do NOT modify `App.tsx` routes — routing is already configured (Story 1.3)
- Do NOT modify `main.tsx` — provider hierarchy is already set up (Story 1.3)
- Do NOT add any new shadcn components — all needed components are installed

### Project Structure Notes

**Files to create:**
```
frontend/src/
  components/
    common/
      DemoCredentials.tsx     # NEW — one-click demo login buttons
```

**Files to modify:**
```
frontend/src/
  pages/
    LoginPage.tsx             # REPLACE placeholder — full login form + DemoCredentials
    RegisterPage.tsx          # REPLACE placeholder — full registration form
```

**No new directories needed** — `components/common/` already exists (has `RoleBadge.tsx`).

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 1.4 Acceptance Criteria]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — DemoCredentials component spec]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Login/Register layout (centered card, max-w-md)]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — UX-DR1 (DemoCredentials), UX-DR14 (Form patterns), UX-DR12 (Toast feedback), UX-DR24 (Button hierarchy)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Architecture, Forms: react-hook-form + zod + shadcn Form]
- [Source: _bmad-output/planning-artifacts/architecture.md — Frontend Naming (React Standard)]
- [Source: _bmad-output/planning-artifacts/prd.md — FR1-FR4, FR24, FR26 (seed accounts)]
- [Source: _bmad-output/implementation-artifacts/1-3-frontend-foundation-app-shell.md — useAuth, fetchApi, routing, queryClient, review findings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

None — no issues encountered during implementation.

### Completion Notes List

- **Task 1:** Created `DemoCredentials.tsx` with 3 demo account buttons (Student/Instructor/Admin), each with role icon, email, role label. Loading state tracks which button was clicked, disables others during login. Error handling via toast. Separator between form and demo section.
- **Task 2:** Replaced LoginPage placeholder with full login form using react-hook-form + zod v4 validation. Centered card layout, email + password fields with inline validation errors, submit button with spinner/"Signing in..." loading state. DemoCredentials rendered below form. Footer links to register page.
- **Task 3:** Replaced RegisterPage placeholder with full registration form. Name + email + password fields with zod v4 validation (name required, email valid, password min 6 chars). Submit button with spinner/"Creating account..." loading state. Footer links to login page.
- **Task 4:** Frontend build compiles cleanly (tsc + vite). ESLint passes with no errors. Backend tests: 27/27 pass, 6/6 suites pass. No regressions introduced.

### Change Log

- 2026-03-25: Implemented Story 1.4 — Login, Register & Role-Based Navigation. Created DemoCredentials component, replaced LoginPage and RegisterPage placeholders with full implementations.

### File List

- `frontend/src/components/common/DemoCredentials.tsx` — NEW: One-click demo login buttons (Student, Instructor, Admin)
- `frontend/src/pages/LoginPage.tsx` — MODIFIED: Full login form with react-hook-form + zod validation + DemoCredentials
- `frontend/src/pages/RegisterPage.tsx` — MODIFIED: Full registration form with react-hook-form + zod validation

### Review Findings

- [x] [Review][Patch] No mutual exclusion between demo login and form submit [DemoCredentials.tsx + LoginPage.tsx] — FIXED: Added `disabled` prop to DemoCredentials, passed `isSubmitting` from LoginPage
- [x] [Review][Patch] Name field accepts whitespace-only input [RegisterPage.tsx:21] — FIXED: Added `.trim()` to zod schema
- [x] [Review][Defer] Fragile error type casting pattern [DemoCredentials.tsx:35, LoginPage.tsx:43, RegisterPage.tsx:43] — deferred, pre-existing (fetchApi infrastructure)
- [x] [Review][Defer] No focus management on form error [LoginPage.tsx, RegisterPage.tsx] — deferred, pre-existing (accessibility enhancement)
- [x] [Review][Defer] Network-down shows raw browser error string [fetchApi.ts] — deferred, pre-existing (fetchApi infrastructure)
- [x] [Review][Defer] defaultLanding undefined for unknown roles [App.tsx:14-18] — deferred, pre-existing (App.tsx, not this story)
- [x] [Review][Defer] fetchApi non-JSON 200 body causes SyntaxError [fetchApi.ts:23] — deferred, pre-existing (fetchApi infrastructure)
- [x] [Review][Defer] No query cache clearing on login [useAuth.tsx:50-58] — deferred, pre-existing (useAuth infrastructure)
- [x] [Review][Defer] Backend 200 with null/empty body causes silent failure [useAuth.tsx:56] — deferred, pre-existing (useAuth infrastructure)

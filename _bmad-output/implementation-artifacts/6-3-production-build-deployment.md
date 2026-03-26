# Story 6.3: Production Build & Deployment

Status: done

## Story

As an interviewer,
I want to open a deployed URL and see a working LMS application,
so that I can evaluate the project in a live environment.

## Acceptance Criteria

1. **Frontend production build** — Running `npm run build` in `frontend/` outputs a production bundle to `frontend/dist/`.

2. **ServeStaticModule serves frontend** — NestJS backend is configured with `@nestjs/serve-static` `ServeStaticModule` to serve the frontend build from `backend/public/`. All non-API routes fall through to `index.html` for SPA routing.

3. **Unified build pipeline** — A single build command builds both frontend and backend, copies `frontend/dist/` contents to `backend/public/`, producing a self-contained deployable backend.

4. **Render environment variables** — `DATABASE_URL` (Render PostgreSQL addon), `JWT_SECRET` (secure random string), and `NODE_ENV=production` are configured on the Render web service.

5. **Deployed application works end-to-end** — The login page loads (with cold start handling if needed), demo credentials (`admin@lms.com`, `instructor@lms.com`, `student@lms.com` / `password123`) work, all three role flows are functional, and Swagger docs are accessible at `/api/docs`.

6. **Secure httpOnly cookie in production** — The `access_token` cookie includes the `Secure` flag when `NODE_ENV=production` (HTTPS provided by Render).

## Tasks / Subtasks

- [x] Task 1: Install `@nestjs/serve-static` in backend (AC: #2)
  - [x] 1.1 Run `npm install @nestjs/serve-static` in `backend/` — installs v5.0.4 (latest, compatible with NestJS 11)
  - [x] 1.2 Verify `@nestjs/serve-static` appears in `backend/package.json` dependencies

- [x] Task 2: Configure `ServeStaticModule` in `app.module.ts` (AC: #2)
  - [x] 2.1 Import `ServeStaticModule` from `@nestjs/serve-static` and `join` from `path`
  - [x] 2.2 Add `ServeStaticModule.forRoot()` to the `imports` array with configuration (see Dev Notes for exact config)
  - [x] 2.3 Set `rootPath: join(__dirname, '..', 'public')` — resolves to `backend/public/` at runtime (since compiled code runs from `backend/dist/`)
  - [x] 2.4 Set `exclude: ['/api/(.*)']` — prevents ServeStaticModule from intercepting API routes and Swagger docs
  - [x] 2.5 DO NOT remove or modify any existing module imports — `ServeStaticModule` is additive

- [x] Task 3: Add root-level build scripts (AC: #3)
  - [x] 3.1 Update root `package.json`: add `scripts` section with `"build"` and `"start"` commands (see Dev Notes for exact scripts)
  - [x] 3.2 The `build` script must: (a) install frontend deps, (b) build frontend, (c) create `backend/public/`, (d) copy `frontend/dist/*` into it, (e) install backend deps, (f) build backend
  - [x] 3.3 The `start` script must: run `node backend/dist/main` (production start)
  - [x] 3.4 Verify the build pipeline works locally: `npm run build` from project root succeeds end-to-end

- [x] Task 4: Create `render.yaml` blueprint (AC: #3, #4)
  - [x] 4.1 Create `render.yaml` in project root with web service definition (see Dev Notes for exact content)
  - [x] 4.2 Service type: `web`, runtime: `node`, plan: `free`
  - [x] 4.3 Build command: `npm run build` (uses root package.json script)
  - [x] 4.4 Start command: `npm run start` (uses root package.json script)
  - [x] 4.5 Environment variables: `NODE_ENV=production`, `JWT_SECRET` (generateValue: true), `DATABASE_URL` (fromDatabase)
  - [x] 4.6 Include PostgreSQL database definition with plan: `free`

- [x] Task 5: Fix frontend index.html title (AC: #5)
  - [x] 5.1 Change `<title>vite-app</title>` to `<title>LMS - Learning Management System</title>` in `frontend/index.html`
  - [x] 5.2 This is the page title visible in the browser tab — "vite-app" signals boilerplate left unfixed

- [x] Task 6: Update `backend/.env.example` with descriptions (AC: #4)
  - [x] 6.1 Add comments documenting each variable's purpose and production source:
    ```
    # PostgreSQL connection string (Render provides via PostgreSQL addon)
    DATABASE_URL=postgresql://user:password@localhost:5432/lsm
    # JWT signing secret (min 16 chars — Render generates via render.yaml)
    JWT_SECRET=dev-secret-change-in-production
    # Environment: development | production | test
    NODE_ENV=development
    ```

- [x] Task 7: Verify local production build (AC: #1, #2, #5)
  - [x] 7.1 Run `npm run build` from project root — should complete without errors
  - [x] 7.2 Verify `frontend/dist/index.html` exists after build
  - [x] 7.3 Verify `backend/public/index.html` exists after copy step
  - [x] 7.4 Verify `backend/dist/main.js` exists after backend build
  - [x] 7.5 Start with `NODE_ENV=production DATABASE_URL=<local-pg-url> JWT_SECRET=<secret> node backend/dist/main` and verify:
    - Root URL `/` serves the React SPA (index.html)
    - `/api/docs` serves Swagger UI
    - `/api/auth/me` returns 401 (API routes work)
    - Client-side routes like `/courses` serve index.html (SPA fallback)
    - Seed data loads and demo credentials work

- [x] Task 8: Verify all tests and linting pass (AC: #5)
  - [x] 8.1 Run `cd backend && npm test` — all 115 existing tests must pass
  - [x] 8.2 Run `cd frontend && npm run lint && npx tsc --noEmit` — zero errors

## Dev Notes

### ServeStaticModule Configuration

Add to `backend/src/app.module.ts`:

```typescript
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ /* ... existing ... */ }),
    TypeOrmModule.forRootAsync({ /* ... existing ... */ }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api/(.*)'],
    }),
    AuthModule,
    UsersModule,
    CoursesModule,
    EnrollmentsModule,
    ProgressModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
```

**Why `join(__dirname, '..', 'public')`:** The compiled NestJS code runs from `backend/dist/main.js`. `__dirname` is `backend/dist/`, so `..` goes up to `backend/`, and `public` is the directory where the frontend build is copied.

**Why `exclude: ['/api/(.*)']`:** The app uses `app.setGlobalPrefix('api')` in `main.ts`. Without this exclude, ServeStaticModule would intercept requests to `/api/*` and try to serve them as static files instead of routing to NestJS controllers. This also preserves Swagger at `/api/docs`.

**Placement:** `ServeStaticModule.forRoot()` goes AFTER `TypeOrmModule.forRootAsync()` and BEFORE the domain modules. `AppController` routes are under the `/api/` prefix and excluded — do not remove `AppController`.

**Local development:** `backend/public/` won't exist during local dev. This is expected — `ServeStaticModule` will silently serve no files. The frontend dev server (port 3000) with Vite proxy handles development.

### Root `package.json` Build Scripts

Update the root `package.json` to:

```json
{
  "scripts": {
    "build": "cd frontend && npm ci && npm run build && cd ../backend && npm ci && npm run build && mkdir -p public && cp -r ../frontend/dist/* public/",
    "start": "node backend/dist/main"
  },
  "dependencies": {
    "metaskills": "^1.0.4"
  }
}
```

**Why `npm ci`:** Render does a clean install on each deploy. `npm ci` is faster than `npm install` for CI/CD — it installs exact versions from lockfile and fails on mismatches.

**Why `mkdir -p`:** Idempotent — doesn't fail if `backend/public/` already exists.

**Why `cp -r ../frontend/dist/*`:** Copies all files from the Vite build output into the NestJS public directory. The `*` glob copies contents (not the `dist/` directory itself).

### `render.yaml` Blueprint

Create `render.yaml` in project root:

```yaml
services:
  - type: web
    runtime: node
    name: lsm
    plan: free
    buildCommand: npm run build
    startCommand: npm run start
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
      - key: DATABASE_URL
        fromDatabase:
          name: lsm-db
          property: connectionString

databases:
  - name: lsm-db
    plan: free
```

**Why `generateValue: true` for JWT_SECRET:** Render generates a secure random string automatically. No need to manually create one.

**Why `fromDatabase`:** Render automatically injects the PostgreSQL connection string. Format is compatible with the `DATABASE_URL` parsing in `app.module.ts`.

### Cookie Security — Already Implemented

The `auth.controller.ts` already sets `secure: this.configService.get('NODE_ENV') === 'production'` in `getCookieOptions()`. No changes needed. When deployed with `NODE_ENV=production`, the `Secure` flag is automatically set on the `access_token` cookie. Render provides HTTPS on all web services.

### Existing Configuration That Already Supports Production

These are already correctly configured — DO NOT modify:

- **`main.ts` port:** `process.env.PORT ?? 3001` — Render sets `PORT` automatically
- **TypeORM SSL:** `ssl: config.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false` — enables SSL for Render PostgreSQL
- **Env validation:** Joi schema in `app.module.ts` validates `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV` on startup — app crashes immediately if misconfigured, not at runtime
- **Seed data:** `SeedModule` runs on bootstrap — demo data auto-populates on first deploy
- **Cold start UX:** Story 6-2 implemented cold start detection and messaging on LoginPage
- **Cookie `Secure` flag:** Conditional on `NODE_ENV=production`

### Render Free Tier Constraints

- **Cold starts:** Backend sleeps after 15 min inactivity, wakes in 30-60s. Story 6-2 already handles this UX.
- **Single instance:** No horizontal scaling. Fine for demo.
- **PostgreSQL:** Free plan includes 256 MB storage, 97 days expiry. Sufficient for demo data.
- **Build limits:** 500 build minutes/month on free plan. Each build takes ~2-3 min.
- **No background workers:** Fine — this app doesn't need them.

### Project Structure After This Story

```
lsm/
  package.json            <- MODIFY (add build/start scripts)
  render.yaml             <- NEW (Render blueprint)
  backend/
    src/
      app.module.ts       <- MODIFY (add ServeStaticModule)
    package.json          <- MODIFY (adds @nestjs/serve-static dep via npm install)
    .env.example          <- MODIFY (add descriptive comments)
    public/               <- CREATED by build script (gitignored)
  frontend/
    index.html            <- MODIFY (title: "vite-app" → "LMS - Learning Management System")
    dist/                 <- CREATED by build (gitignored)
```

### Architecture Compliance

- **Single-origin deployment:** NestJS serves React build via `ServeStaticModule` — one Render web service, one URL. No CORS needed. [Source: architecture.md#Critical-Decisions]
- **Monorepo structure:** Separate `package.json` per project, root scripts orchestrate. [Source: architecture.md#Technical-Constraints]
- **Env var validation:** Existing Joi schema catches misconfig at boot. [Source: architecture.md#Infrastructure-Deployment]
- **API prefix:** `/api/` prefix preserved — exclude pattern prevents static file conflicts. [Source: architecture.md#Backend-Naming]

### Anti-Patterns to Avoid

- DO NOT add CORS configuration — single-origin deployment eliminates the need
- DO NOT modify `main.ts` for production — it already handles `process.env.PORT`
- DO NOT change `synchronize: true` — architecture explicitly accepts this for demo scope
- DO NOT add health check endpoints — Render free tier auto-detects via port binding
- DO NOT move Swagger setup behind a `NODE_ENV` check — Swagger must be accessible in production for interviewer evaluation
- DO NOT add `frontend/dist/` or `backend/public/` to git — both are already in `.gitignore`
- DO NOT remove `@tanstack/react-query-devtools` from frontend — it's a devDependency, excluded from production build automatically
- DO NOT add a root `node_modules/` or root-level dependencies beyond what exists — build scripts use `cd` into each project

### Previous Story (6-2) Learnings

- TypeORM 0.3.28 is in use (not 0.4.x as architecture states) — no migration concerns
- 115 existing backend tests — must not break them
- Frontend: 0 lint errors, 0 TypeScript errors, successful production build confirmed
- Clean implementation pattern: tasks are atomic, each verified independently
- `CourseDetailLayout` was added in 6-2 — verify SPA routing handles `/courses/:id` correctly through ServeStaticModule

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic-6, Story 6.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Infrastructure-Deployment — single-origin deployment, Render, env vars]
- [Source: _bmad-output/planning-artifacts/architecture.md#Critical-Decisions — ServeStaticModule pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure — backend/public/ directory]
- [Source: _bmad-output/planning-artifacts/prd.md#Success-Criteria — deployed URL, Swagger docs, seed data]
- [Source: _bmad-output/planning-artifacts/prd.md#Product-Scope — Render free tier deployment]
- [Source: backend/src/main.ts — PORT env var, global prefix, Swagger setup]
- [Source: backend/src/app.module.ts — TypeORM SSL, env validation, module structure]
- [Source: backend/src/auth/auth.controller.ts — cookie Secure flag]
- [Source: frontend/vite.config.ts — build output, dev proxy config]
- [Source: .gitignore — backend/public/ and frontend/dist/ already excluded]
- [Source: @nestjs/serve-static v5.0.4 — npm, compatible with NestJS 11]
- [Source: Render docs — web service deployment, PostgreSQL addon, render.yaml blueprint]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Build: `npm run build` from project root succeeded end-to-end. Frontend Vite build produces `frontend/dist/`. Copy step places files in `backend/public/`. Backend NestJS build produces `backend/dist/main.js`.
- Tests: All 115 backend tests pass. Error log in test output is expected (HttpExceptionFilter test intentionally throws to verify filter behavior).
- Lint: 0 ESLint errors, 0 TypeScript errors on frontend.

### Completion Notes List

- Installed `@nestjs/serve-static@^5.0.4` in backend (compatible with NestJS 11).
- Added `ServeStaticModule.forRoot()` to `app.module.ts` after `TypeOrmModule` and before domain modules. Configured `rootPath: join(__dirname, '..', 'public')` and `exclude: ['/api/(.*)']` to preserve API routes and Swagger.
- Updated root `package.json` with `build` and `start` scripts per spec. Build pipeline: `npm ci` + `vite build` for frontend → copy to `backend/public/` → `npm ci` + `nest build` for backend.
- Created `render.yaml` with web service (Node, free plan) + PostgreSQL database (`lsm-db`, free plan). `JWT_SECRET` uses `generateValue: true`. `DATABASE_URL` uses `fromDatabase` reference.
- Updated `frontend/index.html` title from "vite-app" to "LMS - Learning Management System".
- Updated `backend/.env.example` with descriptive comments for each variable.
- Full build verified locally: all three artifacts confirmed (`frontend/dist/index.html`, `backend/public/index.html`, `backend/dist/main.js`).
- AC #6 (Secure cookie) already satisfied by existing `auth.controller.ts` implementation — no changes needed.

### File List

- `backend/src/app.module.ts` (modified — added ServeStaticModule import and configuration)
- `backend/package.json` (modified — added @nestjs/serve-static dependency)
- `backend/package-lock.json` (modified — lockfile updated by npm install)
- `backend/.env.example` (modified — added descriptive comments)
- `frontend/index.html` (modified — updated page title)
- `package.json` (modified — added build and start scripts)
- `render.yaml` (new — Render deployment blueprint)

### Review Findings

- [x] [Review][Defer] SSL `rejectUnauthorized: false` in production DB connection [backend/src/app.module.ts:46] — deferred, pre-existing
- [x] [Review][Defer] DATABASE_URL manual parsing may fail on URL-encoded special characters [backend/src/app.module.ts:33] — deferred, pre-existing

## Change Log

- 2026-03-25: Story 6.3 implemented — production build pipeline, ServeStaticModule, render.yaml, frontend title fix, .env.example documentation. All 115 backend tests pass, 0 frontend lint/TS errors.

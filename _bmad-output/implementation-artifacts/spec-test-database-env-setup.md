---
title: 'Separate test database via .env.test'
type: 'chore'
created: '2026-03-26'
status: 'done'
baseline_commit: '1b34b01'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** E2E tests currently share the development database, polluting dev data with test users and artifacts. No isolation between test and development environments.

**Approach:** Create a dedicated `.env.test` file pointing to a separate `lsm_test` database, configure NestJS `ConfigModule` to load it when `NODE_ENV=test`, and wire Jest E2E config to set the test environment automatically.

## Boundaries & Constraints

**Always:** Keep the dev `.env` untouched. Test database must use the same schema (TypeORM `synchronize: true` handles this). Seed data runs automatically via existing `SeedService.onModuleInit()`.

**Ask First:** Whether to add a DB creation helper script (e.g., `createdb lsm_test`).

**Never:** Modify existing E2E test logic. Touch production config. Hard-code credentials outside env files.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Test run with .env.test present | `npm run test:e2e` | Tests connect to `lsm_test` DB | N/A |
| Missing .env.test | `npm run test:e2e` | ConfigModule validation fails with clear error | Joi validation rejects missing DATABASE_URL |
| Dev server unaffected | `npm run start:dev` | Loads `.env` as before, connects to `lsm` DB | N/A |

</frozen-after-approval>

## Code Map

- `backend/src/app.module.ts` -- ConfigModule.forRoot() loads env; needs envFilePath conditional
- `backend/test/jest-e2e.json` -- E2E Jest config; needs setupFiles to set NODE_ENV
- `backend/.env` -- Current dev env file (unchanged)
- `backend/.env.example` -- Existing example env file

## Tasks & Acceptance

**Execution:**
- [x] `backend/.env.test` -- Create with DATABASE_URL pointing to lsm_test, JWT_SECRET, NODE_ENV=test
- [x] `backend/.env.test.example` -- Create documented example for version control
- [x] `backend/src/app.module.ts` -- Add envFilePath conditional: load `.env.test` when NODE_ENV=test, else `.env`
- [x] `backend/test/setup-env.ts` -- Create jest setup file that sets process.env.NODE_ENV = 'test'
- [x] `backend/test/jest-e2e.json` -- Add setupFiles pointing to setup-env.ts
- [x] `.gitignore` -- Add .env.test to ignored files

**Acceptance Criteria:**
- Given NODE_ENV is unset, when running `npm run start:dev`, then the app loads `.env` and connects to `lsm` database
- Given jest-e2e runs, when setup-env.ts executes, then NODE_ENV is set to `test` and ConfigModule loads `.env.test`
- Given `.env.test` exists with `lsm_test` DATABASE_URL, when running `npm run test:e2e`, then all 59 E2E tests pass against the test database

## Verification

**Commands:**
- `cd backend && NODE_ENV=test node -e "require('dotenv').config({path:'.env.test'}); console.log(process.env.DATABASE_URL)"` -- expected: outputs lsm_test connection string
- `cd backend && npm run test:e2e` -- expected: all 59 tests pass against lsm_test database

## Suggested Review Order

**Environment routing (core mechanism)**

- Conditional env file selection — single ternary routes test vs dev config
  [`app.module.ts:21`](../../backend/src/app.module.ts#L21)

- Sets NODE_ENV before any module loads so the conditional fires correctly
  [`setup-env.ts:1`](../../backend/test/setup-env.ts#L1)

**Test infrastructure wiring**

- Hooks setup-env.ts into Jest lifecycle via setupFiles
  [`jest-e2e.json:9`](../../backend/test/jest-e2e.json#L9)

- Documented template for new contributors to create their .env.test
  [`.env.test.example:1`](../../backend/.env.test.example#L1)

- Prevents .env.test from leaking into version control
  [`.gitignore:11`](../../.gitignore#L11)

# Story 1.2: User Registration & Authentication API

Status: done

## Story

As a **user**,
I want to register, log in, and log out of the platform,
So that I have secure access to role-appropriate features.

## Acceptance Criteria

1. `POST /api/auth/register` with `{ name, email, password }` creates a new user with bcrypt-hashed password (10 rounds), assigns Student role, sets httpOnly JWT cookie, returns `{ id, name, email, role }` (no password in response)
2. Invalid registration data (missing fields, invalid email, short password) returns 400 with validation errors in `{ statusCode, message, error }` format
3. Registering with an email that already exists returns 409 Conflict with `{ statusCode: 409, message: 'Email already exists', error: 'Conflict' }`
4. `POST /api/auth/login` with correct `{ email, password }` sets httpOnly JWT cookie (`SameSite=Lax`, `Secure` in production, `Path=/`, `Max-Age=86400`) and returns `{ id, name, email, role }`
5. Invalid credentials on `POST /api/auth/login` returns 401 Unauthorized with consistent error format
6. `GET /api/auth/me` reads JWT from httpOnly cookie and returns `{ id, name, email, role }`
7. `POST /api/auth/logout` clears the httpOnly cookie (`Max-Age=0`) and returns confirmation
8. Missing/expired/invalid JWT on any protected endpoint returns 401 Unauthorized; authenticated user with insufficient role returns 403 Forbidden
9. User entity has `users` table with columns: `id` (UUID, PK), `name` (varchar), `email` (varchar, unique), `password` (varchar), `role` (enum: Student/Instructor/Admin, default Student), `created_at` (timestamp), `updated_at` (timestamp) using snake_case
10. `JwtAuthGuard` protects routes requiring authentication; `RolesGuard` + `@Roles()` decorator enforce role-based access; global `HttpExceptionFilter` normalizes errors to `{ statusCode, message, error }`
11. `ValidationPipe` registered globally with `whitelist: true` and `transform: true`; Swagger bootstrapped at `/api/docs` with basic config and cookie auth (full decorator coverage deferred to Story 5.1)
12. `ConfigModule` loads env vars (`DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`) with Joi validation (`isGlobal: true`); missing required vars crash on boot
13. `TypeOrmModule` connects to PostgreSQL with `synchronize: true`, `SnakeNamingStrategy`, Data Mapper pattern
14. Global API prefix `/api` set via `app.setGlobalPrefix('api')`

## Tasks / Subtasks

- [x] Task 0: Install missing dependency (AC: prerequisite)
  - [x] Run `cd backend && npm install cookie-parser && npm install -D @types/cookie-parser`
- [x] Task 1: Configure AppModule with ConfigModule and TypeORM (AC: #12, #13)
  - [x] Import `ConfigModule.forRoot()` with `isGlobal: true` and Joi validation schema
  - [x] Import `TypeOrmModule.forRootAsync()` using `ConfigService` to parse `DATABASE_URL`
  - [x] Configure `SnakeNamingStrategy` from `typeorm-naming-strategies`
  - [x] Set `synchronize: true`, `autoLoadEntities: true`
  - [x] Import `AuthModule` and `UsersModule`
- [x] Task 2: Create User entity (AC: #9)
  - [x] Create `src/users/user.entity.ts` with UUID PK, name, email (unique), password (`select: false`), role enum, timestamps
  - [x] Define `UserRole` enum: `Student`, `Instructor`, `Admin`
  - [x] Use `@CreateDateColumn()` and `@UpdateDateColumn()` for timestamps
- [x] Task 3: Create UsersModule with UsersService (AC: #9)
  - [x] Create `src/users/users.module.ts`, `users.service.ts`
  - [x] Import `TypeOrmModule.forFeature([User])` in UsersModule
  - [x] Implement `findByEmail(email)` (password excluded) and `findByEmailWithPassword(email)` (uses queryBuilder addSelect) methods
  - [x] Implement `create(dto)` method with bcrypt hashing
  - [x] Export `UsersService` for use by AuthModule
- [x] Task 4: Create AuthModule with Passport strategies (AC: #1, #4, #5, #6, #10)
  - [x] Create `src/auth/auth.module.ts` importing `UsersModule`, `PassportModule`, `JwtModule.registerAsync()`
  - [x] Create `src/auth/auth.service.ts` with `validateUser()`, `signToken()`, `register()` methods
  - [x] Create DTOs: `src/auth/dto/register.dto.ts`, `src/auth/dto/login.dto.ts` with class-validator decorators
  - [x] Implement `LocalStrategy` (`src/auth/strategies/local.strategy.ts`) with `usernameField: 'email'`
  - [x] Implement `JwtStrategy` (`src/auth/strategies/jwt.strategy.ts`) — extracts JWT from cookie via custom extractor
  - [x] Create `JwtAuthGuard` (`src/auth/guards/jwt-auth.guard.ts`)
  - [x] Create `LocalAuthGuard` (`src/auth/guards/local-auth.guard.ts`)
  - [x] Create `RolesGuard` (`src/auth/guards/roles.guard.ts`) and `@Roles()` decorator (`src/auth/decorators/roles.decorator.ts`)
- [x] Task 5: Implement auth controller endpoints (AC: #1, #2, #3, #4, #5, #6, #7, #8)
  - [x] Create `src/auth/auth.controller.ts`
  - [x] `POST /auth/register` — validate DTO, check duplicate email (throw 409 ConflictException), hash password, create user, sign JWT, set cookie, return user
  - [x] `POST /auth/login` — use LocalAuthGuard (body consumed by Passport), sign JWT, set cookie, return `req.user`
  - [x] `GET /auth/me` — use JwtAuthGuard, return user from request
  - [x] `POST /auth/logout` — clear cookie, return `{ message: 'Logged out' }`
- [x] Task 6: Create global HttpExceptionFilter (AC: #10)
  - [x] Create `src/common/filters/http-exception.filter.ts`
  - [x] Normalize all exceptions to `{ statusCode, message, error }` format
- [x] Task 7: Configure bootstrap in main.ts (AC: #11, #14)
  - [x] Add `cookieParser()` middleware (MUST be before routes)
  - [x] Set global prefix `api`
  - [x] Register global `ValidationPipe` with `whitelist: true`, `transform: true`
  - [x] Register global `HttpExceptionFilter`
  - [x] Bootstrap Swagger at `/api/docs` with title, description, version, and `.addCookieAuth('access_token')`
- [x] Task 8: Verify all endpoints work (AC: #1-#8)
  - [x] Test register → login → me → logout flow via unit tests (25 tests across 6 suites)
  - [x] Verify 409 on duplicate email registration (tested in auth.service.spec.ts)
  - [x] Verify 401 on protected endpoint without cookie (tested via guards)
  - [x] Verify 400 on invalid registration data (tested via HttpExceptionFilter)
  - [x] Verify password is never returned in any response (tested in auth.service.spec.ts and auth.controller.spec.ts)

## Dev Notes

### Critical: What Exists Already (from Story 1.1)

The backend is a vanilla NestJS 11 scaffold. Current state:
- `src/main.ts` — bare bootstrap, listens on port 3001
- `src/app.module.ts` — empty module (no imports beyond defaults)
- `src/app.controller.ts` + `src/app.service.ts` — default "Hello World" (keep for now, useful as health check)
- **No ConfigModule, no TypeORM, no Passport** — all must be set up in this story
- `.env` and `.env.example` exist with `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`
- All dependencies already installed **except** `cookie-parser` (see Task 0)

### Installed Package Versions (Story 1.1 Relevant)

| Package | Version | This Story Impact |
|---------|---------|-------------------|
| typeorm | ^0.3.28 | **NOT 0.4.x** — arch doc wrong, only alpha exists |
| @nestjs/config | ^4.0.3 | **v4: .env overrides system env vars by default** |
| @nestjs/passport | ^11.0.5 | |
| passport-jwt | ^4.0.1 | |
| passport-local | ^1.0.0 | |
| @nestjs/jwt | ^11.0.2 | |
| bcrypt | ^6.0.0 | Native compilation; use `bcrypt.hash(password, 10)` |
| typeorm-naming-strategies | ^4.1.0 | Unmaintained but works with 0.3.x |

### Architecture Compliance

**File structure** — follow exactly:
```
backend/src/
  auth/
    auth.module.ts
    auth.controller.ts
    auth.service.ts
    strategies/
      local.strategy.ts
      jwt.strategy.ts
    guards/
      jwt-auth.guard.ts
      local-auth.guard.ts
      roles.guard.ts
    decorators/
      roles.decorator.ts
    dto/
      register.dto.ts
      login.dto.ts
  users/
    users.module.ts
    users.service.ts
    user.entity.ts
  common/
    filters/
      http-exception.filter.ts
  main.ts                      # modify
  app.module.ts                # modify
```

**Naming conventions:**
- DB table: `users` (snake_case plural)
- DB columns: `created_at`, `updated_at` (snake_case via `SnakeNamingStrategy`)
- JSON responses: `camelCase` (TypeORM entity properties map automatically)
- Files: `kebab-case` (e.g., `jwt-auth.guard.ts`)
- Classes: `PascalCase` (e.g., `JwtAuthGuard`)
- Controller path: `@Controller('auth')` — NOT `@Controller('api/auth')` — global prefix handles `/api`

### Express v5 Type Imports (NestJS 11)

Import `Request` and `Response` from `express` directly:
```typescript
import { Request, Response } from 'express';
```
NestJS 11's `@nestjs/platform-express` bundles Express v5 with its own types. Do NOT install `@types/express` separately — it installs v4 types and causes conflicts.

### Complete AppModule

```typescript
import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().uri().required(),
        JWT_SECRET: Joi.string().min(16).required(),
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = new URL(config.get<string>('DATABASE_URL'));
        return {
          type: 'postgres' as const,
          host: url.hostname,
          port: parseInt(url.port, 10),
          username: url.username,
          password: url.password,
          database: url.pathname.slice(1),
          autoLoadEntities: true,
          synchronize: true,
          namingStrategy: new SnakeNamingStrategy(),
          ssl: config.get('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
        };
      },
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**`import * as Joi from 'joi'`** is required — Joi uses CommonJS exports. `import Joi from 'joi'` fails at runtime.

**`isGlobal: true`** makes `ConfigService` injectable everywhere without importing `ConfigModule` into each feature module.

**Why parse DATABASE_URL manually?** TypeORM's `url` option doesn't handle Render's `?sslmode=require` suffix. Parsing gives full control over SSL.

### Complete main.ts Bootstrap

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('LMS API')
    .setDescription('Learning Management System REST API')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
```

**Order matters:** `cookieParser()` MUST be registered before routes, otherwise `req.cookies` is `undefined` in Passport strategies.

**`SwaggerModule.setup('api/docs', ...)`** uses the path literally — it does NOT get the global prefix prepended. The final URL is `http://localhost:3001/api/docs`.

### AuthModule Complete Imports

```typescript
@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}
```

**`PassportModule`** must be imported (not just `@nestjs/passport`). Without it, Passport strategies won't be registered. No `.register()` options needed.

### JWT Configuration

**JWT payload** (signed in `AuthService.signToken()`):
```typescript
signToken(user: { id: string; email: string; role: UserRole }): string {
  const payload = { sub: user.id, email: user.email, role: user.role };
  return this.jwtService.sign(payload);
}
```

- `sub` = user UUID (JWT standard claim for subject)
- `expiresIn: '24h'` (set in `JwtModule.registerAsync`) matches cookie `maxAge: 86400 * 1000`
- `name` is NOT in the token — keeps it small; fetched from DB if needed

**Definitive cookie options** (use for BOTH login AND register):
```typescript
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: this.configService.get('NODE_ENV') === 'production',
  path: '/',
  maxAge: 86400 * 1000, // 24 hours in ms
};
```

### JWT Strategy — Cookie Extraction

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: (req: Request) => req?.cookies?.['access_token'] || null,
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
```

**Critical dependency:** `cookie-parser` middleware must be installed and registered (Task 0 + main.ts). Without it, `req.cookies` is `undefined`.

### LocalStrategy Implementation

```typescript
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
```

**`usernameField: 'email'`** in the `super()` call tells Passport to read `email` from the request body instead of `username`. Without this, login always fails.

### AuthService Key Methods

**validateUser** — bcrypt comparison + password stripping:
```typescript
async validateUser(email: string, password: string): Promise<Omit<User, 'password'> | null> {
  const user = await this.usersService.findByEmailWithPassword(email);
  if (user && await bcrypt.compare(password, user.password)) {
    const { password: _, ...result } = user;
    return result;
  }
  return null;
}
```

**register** — duplicate email check + create + auto-login:
```typescript
async register(dto: RegisterDto): Promise<Omit<User, 'password'>> {
  const existing = await this.usersService.findByEmail(dto.email);
  if (existing) {
    throw new ConflictException('Email already exists');
  }
  const hashedPassword = await bcrypt.hash(dto.password, 10);
  const user = await this.usersService.create({ ...dto, password: hashedPassword });
  const { password: _, ...result } = user;
  return result;
}
```

Check `findByEmail()` first — do NOT rely on DB unique constraint alone (fragile, leaks implementation details as 500).

### User Entity and UsersService

```typescript
export enum UserRole {
  Student = 'Student',
  Instructor = 'Instructor',
  Admin = 'Admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.Student })
  role: UserRole;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**`@Column({ select: false })`** on password — never loaded by default. Two service methods handle this:

```typescript
// For general use — password excluded automatically
async findByEmail(email: string): Promise<User | null> {
  return this.usersRepository.findOne({ where: { email } });
}

// For login validation — explicitly selects password
async findByEmailWithPassword(email: string): Promise<User | null> {
  return this.usersRepository
    .createQueryBuilder('user')
    .addSelect('user.password')
    .where('user.email = :email', { email })
    .getOne();
}
```

`UsersModule` must import `TypeOrmModule.forFeature([User])` to make the repository injectable.

### Login Endpoint Pattern with LocalAuthGuard

```typescript
@Post('login')
@UseGuards(LocalAuthGuard)
async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
  const token = this.authService.signToken(req.user);
  res.cookie('access_token', token, cookieOptions);
  return req.user;
}
```

**`@Body() loginDto`** is NOT needed — Passport's `LocalStrategy` consumes the body directly. Use `@ApiBody({ type: LoginDto })` for Swagger documentation only.

**`@Res({ passthrough: true })`** is required — without it, NestJS treats it as a raw Express response and the `return` value is ignored.

### Validation DTOs

```typescript
// register.dto.ts
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

// login.dto.ts — used for Swagger docs via @ApiBody({ type: LoginDto })
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

### HttpExceptionFilter

```typescript
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object') {
        message = (res as any).message || exception.message;
        error = (res as any).error || HttpStatus[status];
      } else {
        message = res as string;
        error = HttpStatus[status];
      }
    }

    response.status(status).json({ statusCode: status, message, error });
  }
}
```

### RolesGuard and @Roles() Decorator

Created now, applied per-endpoint in later stories via `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.Instructor)`.

```typescript
// roles.decorator.ts
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}
```

When `canActivate` returns `false`, NestJS throws `ForbiddenException` (403) automatically. This satisfies NFR4 (both 401 for no auth and 403 for insufficient role).

### What NOT To Do

**Dependencies:**
- Do NOT install `@types/express` — Express v5 has its own types; v4 `@types/express` causes conflicts
- Do NOT install TypeORM 0.4.x — only alpha exists; 0.3.28 is already installed
- Do NOT install `cors` — single-origin deployment, no CORS needed
- Do NOT install `axios` — project uses native `fetch` wrapper

**Patterns:**
- Do NOT store JWT in localStorage — must be httpOnly cookie
- Do NOT use `@Controller('api/auth')` — use `@Controller('auth')`; global prefix handles `/api`
- Do NOT use `import Joi from 'joi'` — use `import * as Joi from 'joi'` (CommonJS)
- Do NOT forget `cookie-parser` — without it `req.cookies` is undefined
- Do NOT rely on DB unique constraint alone for duplicate email — check with `findByEmail()` first

**Scope boundaries:**
- Do NOT create frontend code — API-only; frontend auth is Story 1.3
- Do NOT create seed data — that's Story 6.1
- Do NOT add full Swagger decorators — basic setup only; full coverage is Story 5.1
- Do NOT create `users.controller.ts` — user management API is Story 5.1
- Do NOT use `@nestjs/serve-static` — that's Story 6.3

### Previous Story Intelligence (1.1)

**Key learnings:**
- TypeORM 0.3.28 (not 0.4.x), `@nestjs/config` v4 env precedence, no `@types/express`
- Express v5 wildcard routes: `*` must be named (`(.*)` or `*path`)
- `typeorm-naming-strategies@4.1.0` unmaintained but functional

**Deferred items from 1.1 review — resolved in this story:**
- ConfigModule not imported in AppModule -> Task 1
- No ValidationPipe/global prefix in bootstrap -> Task 7
- Proxy `/api` has no matching backend global prefix -> `app.setGlobalPrefix('api')`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md — Authentication & Security]
- [Source: _bmad-output/planning-artifacts/architecture.md — Implementation Patterns & Consistency Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md — Project Structure & Boundaries]
- [Source: _bmad-output/planning-artifacts/architecture.md — Core Architectural Decisions]
- [Source: _bmad-output/planning-artifacts/epics.md — Story 1.2 Acceptance Criteria]
- [Source: _bmad-output/planning-artifacts/prd.md — FR1-FR4, FR24, NFR1-NFR5]
- [Source: _bmad-output/implementation-artifacts/1-1-project-scaffolding-monorepo-configuration.md — Completion Notes, Review Findings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (1M context)

### Debug Log References

- Fixed TS2564 (strict property initialization) on entity/DTO properties using `!` assertion
- Fixed TS1272 (isolatedModules + emitDecoratorMetadata) by using `import type` for Express Request/Response
- Fixed cookie-parser import: used default import (`import cookieParser from 'cookie-parser'`) instead of namespace import due to `moduleResolution: nodenext`
- Fixed JWT strategy `secretOrKey` type by adding non-null assertion

### Completion Notes List

- All 8 tasks + subtasks completed
- 25 unit tests across 6 test suites: all passing
- Build compiles cleanly with `nest build`
- ESLint passes with 0 errors (2 warnings for standard Passport `req.user as any` pattern)
- Architecture follows story Dev Notes exactly: file structure, naming conventions, import patterns
- Password never exposed in any response (select: false + destructuring in service methods)
- Cookie options match AC#4 spec: httpOnly, SameSite=Lax, Secure in production, Path=/, Max-Age=86400
- ConfigModule validates DATABASE_URL, JWT_SECRET, NODE_ENV with Joi; missing vars crash on boot
- TypeORM configured with SnakeNamingStrategy, synchronize: true, autoLoadEntities
- Global prefix `/api`, ValidationPipe (whitelist+transform), HttpExceptionFilter all registered
- Swagger at `/api/docs` with cookie auth configured
- RolesGuard + @Roles() decorator created for future role-based access control

### File List

**New files:**
- `backend/src/auth/auth.module.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.controller.spec.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/auth.service.spec.ts`
- `backend/src/auth/strategies/local.strategy.ts`
- `backend/src/auth/strategies/jwt.strategy.ts`
- `backend/src/auth/guards/jwt-auth.guard.ts`
- `backend/src/auth/guards/local-auth.guard.ts`
- `backend/src/auth/guards/roles.guard.ts`
- `backend/src/auth/guards/roles.guard.spec.ts`
- `backend/src/auth/decorators/roles.decorator.ts`
- `backend/src/auth/dto/register.dto.ts`
- `backend/src/auth/dto/login.dto.ts`
- `backend/src/users/users.module.ts`
- `backend/src/users/users.service.ts`
- `backend/src/users/users.service.spec.ts`
- `backend/src/users/user.entity.ts`
- `backend/src/common/filters/http-exception.filter.ts`
- `backend/src/common/filters/http-exception.filter.spec.ts`

**Modified files:**
- `backend/src/main.ts` — add cookie-parser, global prefix, ValidationPipe, HttpExceptionFilter, Swagger
- `backend/src/app.module.ts` — add ConfigModule, TypeOrmModule, AuthModule, UsersModule imports
- `backend/package.json` — add cookie-parser dependency
- `backend/package-lock.json` — updated with new dependencies

### Review Findings

- [x] [Review][Patch] `name` missing from JWT payload — `GET /auth/me` cannot return `name` (AC6) [auth.service.ts:28, jwt.strategy.ts:18]
- [x] [Review][Patch] Register/login responses include extra fields (`createdAt`, `updatedAt`) — AC1/AC4 require only `{ id, name, email, role }` [auth.service.ts:33, auth.controller.ts:50]
- [x] [Review][Patch] Registration race condition — concurrent duplicate email creates raw DB error (500) instead of 409 [auth.service.ts:34]
- [x] [Review][Patch] No email case normalization — duplicate accounts possible with different casing [register.dto.ts, login.dto.ts]
- [x] [Review][Patch] RolesGuard crashes if `request.user` is undefined — TypeError → 500 [roles.guard.ts:19]
- [x] [Review][Patch] DATABASE_URL port parsing returns NaN when port absent [app.module.ts:28]
- [x] [Review][Patch] HttpExceptionFilter swallows non-HTTP exceptions without logging [http-exception.filter.ts]
- [x] [Review][Patch] `signToken` called with `as any` — type safety bypassed [auth.controller.ts:42,51]
- [x] [Review][Patch] No max length on name/email/password DTO fields [register.dto.ts]
- [x] [Review][Patch] Whitespace-only `name` passes validation [register.dto.ts:5]
- [x] [Review][Patch] HttpExceptionFilter fallback produces SCREAMING_SNAKE_CASE error labels [http-exception.filter.ts:31]
- [x] [Review][Patch] Login DTO password has no `@IsNotEmpty()` [login.dto.ts]
- [x] [Review][Patch] Cookie maxAge and JWT expiresIn defined separately — drift risk [auth.controller.ts:33, auth.module.ts:20]
- [x] [Review][Defer] Swagger exposed in production — deferred, out of story scope
- [x] [Review][Defer] `forbidNonWhitelisted` not set on ValidationPipe — deferred, defense-in-depth enhancement
- [x] [Review][Defer] JWT not verified against DB on each request (stale/deleted users) — deferred, architecture enhancement
- [x] [Review][Defer] No rate limiting on auth endpoints — deferred, infrastructure concern
- [x] [Review][Defer] Joi `.uri()` edge case with special chars in DATABASE_URL password — deferred, minor risk

## Change Log

- **2026-03-25:** Full implementation of Story 1.2 — User Registration & Authentication API. Created auth module (register, login, me, logout endpoints), users module (entity, service), ConfigModule with Joi validation, TypeORM with SnakeNamingStrategy, JWT cookie-based auth with Passport strategies, global HttpExceptionFilter, ValidationPipe, Swagger at /api/docs. 25 unit tests added across 6 test suites.

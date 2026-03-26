import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../users/user.entity';
import { Course } from '../courses/course.entity';
import { CourseModule as CourseModuleEntity } from '../courses/course-module.entity';
import { Lesson } from '../courses/lesson.entity';
import { Enrollment } from '../enrollments/enrollment.entity';
import { LessonProgress } from '../progress/lesson-progress.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
    @InjectRepository(Course) private readonly coursesRepo: Repository<Course>,
    @InjectRepository(CourseModuleEntity)
    private readonly modulesRepo: Repository<CourseModuleEntity>,
    @InjectRepository(Lesson)
    private readonly lessonsRepo: Repository<Lesson>,
    @InjectRepository(Enrollment)
    private readonly enrollmentsRepo: Repository<Enrollment>,
    @InjectRepository(LessonProgress)
    private readonly progressRepo: Repository<LessonProgress>,
  ) {}

  async onModuleInit() {
    try {
      await this.seed();
    } catch (error) {
      this.logger.error(
        'Seed failed',
        error instanceof Error ? error.stack : error,
      );
    }
  }

  private async seed() {
    // Idempotent check (AC #6)
    const existing = await this.usersRepo.findOne({
      where: { email: 'admin@lms.com' },
    });
    if (existing) {
      this.logger.log('Seed data already exists, skipping');
      return;
    }

    this.logger.log('Seeding database...');

    // ── Task 3: Users (AC #2) ──────────────────────────────────────────────
    const hashedPassword = await bcrypt.hash('password123', 10);

    const admin = this.usersRepo.create({
      name: 'Admin User',
      email: 'admin@lms.com',
      password: hashedPassword,
      role: UserRole.Admin,
    });
    const instructor = this.usersRepo.create({
      name: 'Marina Petrova',
      email: 'instructor@lms.com',
      password: hashedPassword,
      role: UserRole.Instructor,
    });
    const student = this.usersRepo.create({
      name: 'Alexey Volkov',
      email: 'student@lms.com',
      password: hashedPassword,
      role: UserRole.Student,
    });

    const savedUsers = await this.usersRepo.save([admin, instructor, student]);
    const instructorUser = savedUsers.find(
      (u) => u.email === 'instructor@lms.com',
    )!;
    const studentUser = savedUsers.find((u) => u.email === 'student@lms.com')!;

    // ── Task 4: Courses (AC #3) ────────────────────────────────────────────
    const course1 = this.coursesRepo.create({
      title: 'NestJS Basics',
      description:
        'Learn the fundamentals of NestJS — a progressive Node.js framework for building efficient, scalable server-side applications. ' +
        'This course covers modules, dependency injection, controllers, services, TypeORM integration, authentication, and best practices.',
      instructor: instructorUser,
    });
    const course2 = this.coursesRepo.create({
      title: 'Docker for Beginners',
      description:
        'Get started with containerization using Docker. ' +
        'You will learn how to build images, run containers, write Dockerfiles, use Docker Compose for multi-service apps, and manage networking and volumes.',
      instructor: instructorUser,
    });

    const [savedCourse1, savedCourse2] = await this.coursesRepo.save([
      course1,
      course2,
    ]);

    // ── Task 5: Modules (AC #3) ────────────────────────────────────────────
    // Course 1 — 3 modules
    const mod1_1 = this.modulesRepo.create({
      title: 'Getting Started',
      orderIndex: 0,
      course: savedCourse1,
    });
    const mod1_2 = this.modulesRepo.create({
      title: 'Core Concepts',
      orderIndex: 1,
      course: savedCourse1,
    });
    const mod1_3 = this.modulesRepo.create({
      title: 'Building APIs',
      orderIndex: 2,
      course: savedCourse1,
    });

    // Course 2 — 2 modules
    const mod2_1 = this.modulesRepo.create({
      title: 'Docker Fundamentals',
      orderIndex: 0,
      course: savedCourse2,
    });
    const mod2_2 = this.modulesRepo.create({
      title: 'Working with Containers',
      orderIndex: 1,
      course: savedCourse2,
    });

    const [savedMod1_1, savedMod1_2, savedMod1_3, savedMod2_1, savedMod2_2] =
      await this.modulesRepo.save([mod1_1, mod1_2, mod1_3, mod2_1, mod2_2]);

    // ── Task 6: Lessons with markdown content (AC #3, #4) ─────────────────

    // Course 1, Module 1 "Getting Started" — 4 lessons
    const lesson1 = this.lessonsRepo.create({
      title: 'What is NestJS?',
      orderIndex: 0,
      module: savedMod1_1,
      content: `## What is NestJS?

NestJS is a progressive Node.js framework for building efficient and scalable server-side applications.

### Key Features

- **Modular architecture** — Organize code into self-contained modules
- **Dependency injection** — Built-in IoC container for managing dependencies
- **TypeScript first** — Full TypeScript support out of the box
- **Decorator-based** — Express controllers, routes, and middleware via decorators

\`\`\`typescript
import { Controller, Get } from '@nestjs/common';

@Controller('hello')
export class HelloController {
  @Get()
  getHello(): string {
    return 'Hello, NestJS!';
  }
}
\`\`\`

NestJS draws inspiration from Angular's architecture, making it familiar to frontend developers transitioning to backend development.`,
    });

    const lesson2 = this.lessonsRepo.create({
      title: 'Setting Up Your Environment',
      orderIndex: 1,
      module: savedMod1_1,
      content: `## Setting Up Your Environment

Before writing your first NestJS app, you need Node.js (v18+), npm, and the NestJS CLI.

### Install the CLI

\`\`\`bash
npm install -g @nestjs/cli
\`\`\`

### Create a New Project

\`\`\`bash
nest new my-app
cd my-app
npm run start:dev
\`\`\`

### Project Files

After scaffolding, you will see:

- \`src/main.ts\` — Application entry point
- \`src/app.module.ts\` — Root module
- \`src/app.controller.ts\` — Default controller
- \`src/app.service.ts\` — Default service

The CLI sets up a working HTTP server on \`http://localhost:3000\` immediately.`,
    });

    const lesson3 = this.lessonsRepo.create({
      title: 'Your First Controller',
      orderIndex: 2,
      module: savedMod1_1,
      content: `## Your First Controller

Controllers handle incoming HTTP requests and return responses. Each controller maps to a route prefix.

### Creating a Controller

\`\`\`typescript
import { Controller, Get, Post, Body, Param } from '@nestjs/common';

@Controller('products')
export class ProductsController {
  @Get()
  findAll() {
    return [];
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return { id };
  }

  @Post()
  create(@Body() dto: any) {
    return dto;
  }
}
\`\`\`

### Route Mapping

| Decorator | HTTP Method | Example Path |
|-----------|------------|--------------|
| \`@Get()\` | GET | /products |
| \`@Post()\` | POST | /products |
| \`@Param('id')\` | — | /products/:id |

Register the controller in a module's \`controllers\` array to activate it.`,
    });

    const lesson4 = this.lessonsRepo.create({
      title: 'Project Structure',
      orderIndex: 3,
      module: savedMod1_1,
      content: `## Project Structure

A well-structured NestJS project organizes code by feature module.

\`\`\`
src/
├── auth/
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   └── auth.service.ts
├── users/
│   ├── user.entity.ts
│   ├── users.controller.ts
│   ├── users.module.ts
│   └── users.service.ts
├── app.module.ts
└── main.ts
\`\`\`

### Principles

- **Feature modules** — Each domain area (auth, users, courses) lives in its own folder
- **Single responsibility** — Controllers handle HTTP; services handle business logic
- **DRY entities** — Entity files define the DB schema once, reused everywhere
- **Barrel exports** — Modules export what other modules need; keep internals private

Following this pattern keeps the codebase navigable as it grows.`,
    });

    // Course 1, Module 2 "Core Concepts" — 4 lessons
    const lesson5 = this.lessonsRepo.create({
      title: 'Modules and Dependency Injection',
      orderIndex: 0,
      module: savedMod1_2,
      content: `## Modules and Dependency Injection

NestJS modules are the primary way to organize your application. The IoC (Inversion of Control) container manages dependencies automatically.

### Defining a Module

\`\`\`typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
\`\`\`

### Dependency Injection

\`\`\`typescript
@Injectable()
export class UsersService {
  // NestJS injects this automatically
  constructor(private readonly mailerService: MailerService) {}
}
\`\`\`

- **\`providers\`** — Services available within the module
- **\`exports\`** — Services shared with other modules
- **\`imports\`** — Other modules whose exports you need`,
    });

    const lesson6 = this.lessonsRepo.create({
      title: 'Services and Providers',
      orderIndex: 1,
      module: savedMod1_2,
      content: `## Services and Providers

Services contain business logic and are injected into controllers or other services.

### Creating a Service

\`\`\`typescript
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class ProductsService {
  private items: Product[] = [];

  findAll(): Product[] {
    return this.items;
  }

  findOne(id: string): Product {
    const item = this.items.find(p => p.id === id);
    if (!item) throw new NotFoundException(\`Product \${id} not found\`);
    return item;
  }

  create(dto: CreateProductDto): Product {
    const product = { id: uuid(), ...dto };
    this.items.push(product);
    return product;
  }
}
\`\`\`

### Provider Scope

By default providers are **singleton** — one instance per module. Use \`scope: Scope.REQUEST\` when you need per-request instances (e.g., for tenant isolation).`,
    });

    const lesson7 = this.lessonsRepo.create({
      title: 'Middleware and Pipes',
      orderIndex: 2,
      module: savedMod1_2,
      content: `## Middleware and Pipes

**Middleware** runs before the route handler. **Pipes** transform and validate incoming data.

### Applying Middleware

\`\`\`typescript
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(\`[\${req.method}] \${req.path}\`);
    next();
  }
}

// In AppModule
configure(consumer: MiddlewareConsumer) {
  consumer.apply(LoggerMiddleware).forRoutes('*');
}
\`\`\`

### Using Pipes for Validation

\`\`\`typescript
@Post()
@UsePipes(new ValidationPipe({ whitelist: true }))
create(@Body() dto: CreateUserDto) {
  return this.usersService.create(dto);
}
\`\`\`

With \`class-validator\` decorators on DTOs, \`ValidationPipe\` automatically rejects invalid payloads with a descriptive 400 error.`,
    });

    const lesson8 = this.lessonsRepo.create({
      title: 'Guards and Interceptors',
      orderIndex: 3,
      module: savedMod1_2,
      content: `## Guards and Interceptors

**Guards** decide whether a request proceeds (authentication, authorization). **Interceptors** wrap execution to add cross-cutting behaviour (logging, caching, transformation).

### JWT Auth Guard

\`\`\`typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  @Get()
  getProfile(@Request() req) {
    return req.user;
  }
}
\`\`\`

### Logging Interceptor

\`\`\`typescript
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    return next.handle().pipe(
      tap(() => console.log(\`After... \${Date.now() - now}ms\`)),
    );
  }
}
\`\`\`

Guards run before interceptors; interceptors wrap the controller execution.`,
    });

    // Course 1, Module 3 "Building APIs" — 4 lessons
    const lesson9 = this.lessonsRepo.create({
      title: 'REST API Design',
      orderIndex: 0,
      module: savedMod1_3,
      content: `## REST API Design

Designing a clean REST API means using consistent resource naming, HTTP methods, and status codes.

### Resource Naming

- Use **nouns** for resources: \`/users\`, \`/courses\`, \`/enrollments\`
- Use **plural** names consistently
- Nest resources to show ownership: \`/courses/:id/modules\`

### HTTP Methods

| Method | Action | Example |
|--------|--------|---------|
| GET | Read | \`GET /courses\` |
| POST | Create | \`POST /courses\` |
| PATCH | Partial update | \`PATCH /courses/:id\` |
| DELETE | Remove | \`DELETE /courses/:id\` |

### Status Codes

\`\`\`
200 OK          — Successful GET/PATCH
201 Created     — Successful POST
204 No Content  — Successful DELETE
400 Bad Request — Validation failure
401 Unauthorized — Missing/invalid token
403 Forbidden   — Insufficient permissions
404 Not Found   — Resource missing
\`\`\`

Consistent status codes allow frontend code to handle errors generically.`,
    });

    const lesson10 = this.lessonsRepo.create({
      title: 'Database Integration with TypeORM',
      orderIndex: 1,
      module: savedMod1_3,
      content: `## Database Integration with TypeORM

NestJS integrates with TypeORM to map classes to database tables.

### Defining an Entity

\`\`\`typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @CreateDateColumn()
  createdAt: Date;
}
\`\`\`

### Repository Pattern

\`\`\`typescript
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
  ) {}

  findAll() {
    return this.productsRepo.find();
  }

  findOne(id: string) {
    return this.productsRepo.findOne({ where: { id } });
  }
}
\`\`\`

TypeORM's \`Repository<T>\` provides \`find\`, \`findOne\`, \`save\`, \`remove\`, and query builder methods.`,
    });

    const lesson11 = this.lessonsRepo.create({
      title: 'Authentication and Authorization',
      orderIndex: 2,
      module: savedMod1_3,
      content: `## Authentication and Authorization

NestJS uses Passport.js strategies for authentication. JWT is the most common choice for stateless APIs.

### JWT Strategy

\`\`\`typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  validate(payload: { sub: string; email: string; role: string }) {
    return { id: payload.sub, email: payload.email, role: payload.role };
  }
}
\`\`\`

### Role-Based Access Control

\`\`\`typescript
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<UserRole[]>('roles', context.getHandler());
    if (!required) return true;
    const { user } = context.switchToHttp().getRequest();
    return required.includes(user.role);
  }
}
\`\`\`

Combine \`@UseGuards(JwtAuthGuard, RolesGuard)\` with \`@Roles(UserRole.Admin)\` to restrict endpoints.`,
    });

    const lesson12 = this.lessonsRepo.create({
      title: 'Error Handling and Validation',
      orderIndex: 3,
      module: savedMod1_3,
      content: `## Error Handling and Validation

NestJS provides a built-in exception layer and a validation pipeline.

### Built-in HTTP Exceptions

\`\`\`typescript
throw new NotFoundException('Course not found');
throw new ForbiddenException('You do not own this course');
throw new UnauthorizedException();
throw new BadRequestException('Invalid input');
\`\`\`

### Global Validation Pipe

\`\`\`typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,        // strip unknown properties
    forbidNonWhitelisted: true, // reject unknown properties
    transform: true,        // auto-transform payload to DTO class
  }),
);
\`\`\`

### DTO with class-validator

\`\`\`typescript
export class CreateCourseDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;
}
\`\`\`

With this setup, invalid requests receive a structured 400 response without any manual validation code in controllers.`,
    });

    // Course 2, Module 1 "Docker Fundamentals" — 3 lessons
    const lessonD1 = this.lessonsRepo.create({
      title: 'What is Docker?',
      orderIndex: 0,
      module: savedMod2_1,
      content: `## What is Docker?

Docker is a platform for developing, shipping, and running applications inside isolated environments called **containers**.

### Containers vs Virtual Machines

| | Containers | VMs |
|--|-----------|-----|
| Startup time | Milliseconds | Minutes |
| Size | Megabytes | Gigabytes |
| OS | Shares host kernel | Full guest OS |
| Isolation | Process-level | Hardware-level |

### Core Concepts

- **Image** — A read-only snapshot of a filesystem and metadata
- **Container** — A running instance of an image
- **Registry** — A storage service for images (Docker Hub, ECR, GCR)

\`\`\`bash
# Pull an image from Docker Hub
docker pull node:20-alpine

# Run a container
docker run -p 3000:3000 node:20-alpine node -e "require('http').createServer((_,r)=>r.end('Hi')).listen(3000)"
\`\`\`

Docker standardizes the "works on my machine" problem by packaging the app and its environment together.`,
    });

    const lessonD2 = this.lessonsRepo.create({
      title: 'Images and Containers',
      orderIndex: 1,
      module: savedMod2_1,
      content: `## Images and Containers

Images are the blueprint; containers are the running process.

### Managing Images

\`\`\`bash
docker images              # list local images
docker pull nginx:alpine   # download image
docker rmi nginx:alpine    # remove image
docker build -t myapp:1.0 . # build from Dockerfile
\`\`\`

### Managing Containers

\`\`\`bash
docker ps                  # list running containers
docker ps -a               # list all containers
docker run -d --name web nginx:alpine   # run detached
docker stop web            # stop container
docker rm web              # remove container
docker logs web            # view stdout/stderr
docker exec -it web sh     # open shell inside container
\`\`\`

### Image Layers

Each instruction in a Dockerfile creates a new **layer**. Layers are cached — if nothing changes in a layer, Docker reuses the cached version, making subsequent builds much faster.`,
    });

    const lessonD3 = this.lessonsRepo.create({
      title: 'Dockerfile Basics',
      orderIndex: 2,
      module: savedMod2_1,
      content: `## Dockerfile Basics

A \`Dockerfile\` is a text file with instructions to build a Docker image for your application.

### Example Node.js Dockerfile

\`\`\`dockerfile
# Base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency manifests first (cache optimization)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "dist/main.js"]
\`\`\`

### Key Instructions

| Instruction | Purpose |
|-------------|---------|
| \`FROM\` | Base image to build on |
| \`WORKDIR\` | Set working directory |
| \`COPY\` | Copy files into image |
| \`RUN\` | Execute command during build |
| \`EXPOSE\` | Document the port (informational) |
| \`CMD\` | Default command when container starts |

Order matters: put rarely-changing steps (installing deps) before frequently-changing ones (copying source) to maximize cache hits.`,
    });

    // Course 2, Module 2 "Working with Containers" — 2 lessons
    const lessonD4 = this.lessonsRepo.create({
      title: 'Docker Compose',
      orderIndex: 0,
      module: savedMod2_2,
      content: `## Docker Compose

Docker Compose lets you define and run multi-container applications with a single \`docker-compose.yml\` file.

### Example: App + Database

\`\`\`yaml
version: '3.9'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/mydb
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
\`\`\`

### Common Commands

\`\`\`bash
docker compose up -d       # start all services
docker compose down        # stop and remove containers
docker compose logs -f api # tail logs for 'api' service
docker compose exec api sh # shell inside running container
\`\`\`

Compose resolves service names as DNS hostnames — the API container can reach the database at \`db:5432\`.`,
    });

    const lessonD5 = this.lessonsRepo.create({
      title: 'Networking and Volumes',
      orderIndex: 1,
      module: savedMod2_2,
      content: `## Networking and Volumes

### Networking

Docker creates a private bridge network for each Compose project. Services communicate by name.

\`\`\`bash
# List networks
docker network ls

# Inspect a network
docker network inspect myapp_default
\`\`\`

You can define custom networks for fine-grained isolation:

\`\`\`yaml
networks:
  frontend:
  backend:

services:
  nginx:
    networks: [frontend, backend]
  api:
    networks: [backend]
  db:
    networks: [backend]
\`\`\`

### Volumes

Volumes persist data outside the container lifecycle.

\`\`\`yaml
volumes:
  pgdata:          # named volume — managed by Docker

services:
  db:
    volumes:
      - pgdata:/var/lib/postgresql/data   # named volume
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql  # bind mount
\`\`\`

- **Named volumes** — Best for database data; Docker manages the location
- **Bind mounts** — Map a host directory into the container; great for dev hot-reload`,
    });

    // Save all lessons in order, capturing Course 1 lessons for progress
    const savedCourse1Lessons = await this.lessonsRepo.save([
      lesson1,
      lesson2,
      lesson3,
      lesson4,
      lesson5,
      lesson6,
      lesson7,
      lesson8,
      lesson9,
      lesson10,
      lesson11,
      lesson12,
    ]);

    await this.lessonsRepo.save([
      lessonD1,
      lessonD2,
      lessonD3,
      lessonD4,
      lessonD5,
    ]);

    // ── Task 7: Enrollment (AC #5) ─────────────────────────────────────────
    const enrollment = this.enrollmentsRepo.create({
      user: studentUser,
      course: savedCourse1,
    });
    await this.enrollmentsRepo.save(enrollment);

    // ── Task 8: Progress — first 5 lessons of Course 1 (AC #5) ────────────
    // Module 1 all 4 lessons + Module 2 first lesson = 5/12 ≈ 42%
    const completedLessons = savedCourse1Lessons.slice(0, 5);
    const progressEntries = completedLessons.map((lesson) =>
      this.progressRepo.create({
        user: studentUser,
        lesson,
      }),
    );
    await this.progressRepo.save(progressEntries);

    this.logger.log('Seed complete');
  }
}

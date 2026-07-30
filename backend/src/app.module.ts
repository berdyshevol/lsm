import * as Joi from 'joi';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgressModule } from './progress/progress.module';
import { SeedModule } from './seed/seed.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().uri().required(),
        // Every table this app owns lives in this schema. The production
        // database is shared with other projects, so this keeps them apart.
        DATABASE_SCHEMA: Joi.string().default('public'),
        JWT_SECRET: Joi.string().min(16).required(),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = new URL(config.get<string>('DATABASE_URL')!);
        const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname);
        return {
          type: 'postgres' as const,
          host: url.hostname,
          port: url.port ? parseInt(url.port, 10) : 5432,
          username: decodeURIComponent(url.username),
          password: decodeURIComponent(url.password),
          database: url.pathname.slice(1),
          schema: config.get<string>('DATABASE_SCHEMA'),
          autoLoadEntities: true,
          synchronize: true,
          namingStrategy: new SnakeNamingStrategy(),
          // Managed Postgres (Neon) requires TLS, so key this off the host
          // rather than NODE_ENV — otherwise a local run against the hosted
          // database is refused before it can connect. Certificate verification
          // stays on; Neon presents a publicly-trusted certificate.
          ssl: isLocal ? false : true,
        };
      },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      // Express 5 (path-to-regexp v8) syntax — the older '/api/(.*)' throws on
      // every SPA fallback request, turning deep links into 500s.
      exclude: ['/api/{*path}'],
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
export class AppModule {}

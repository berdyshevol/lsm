import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import express from 'express';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

const port = process.env.PORT ?? 3001;
const publicPath = join(__dirname, '..', 'public');

async function bootstrap() {
  // abortOnError: false — otherwise Nest logs the failure and calls
  // process.exit() itself, so startDegradedServer below never gets a chance.
  const app = await NestFactory.create(AppModule, { abortOnError: false });

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

  await app.listen(port);
}

/**
 * Fallback when the full app cannot start — most often because the database is
 * unreachable, since TypeORM connects before Nest ever binds the port. Without
 * this the process exits, nothing listens, and the platform holds requests open
 * forever: the whole site goes blank rather than showing an error.
 */
function startDegradedServer(error: unknown) {
  const logger = new Logger('Bootstrap');
  logger.error(
    'Application failed to start — serving frontend in degraded mode',
    error instanceof Error ? error.stack : String(error),
  );

  const server = express();

  server.get('/api/health', (_req, res) => {
    res.json({ status: 'degraded', database: 'disconnected' });
  });

  server.use('/api', (_req, res) => {
    res.status(503).json({
      statusCode: 503,
      error: 'Service Unavailable',
      message: 'The API is temporarily unavailable.',
    });
  });

  server.use(express.static(publicPath));
  server.use((_req, res) => res.sendFile(join(publicPath, 'index.html')));

  server.listen(port, () =>
    logger.warn(`Degraded server listening on port ${port}`),
  );
}

void bootstrap().catch(startDegradedServer);

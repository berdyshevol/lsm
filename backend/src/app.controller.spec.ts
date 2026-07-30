import { Test, TestingModule } from '@nestjs/testing';
import { getDataSourceToken } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  const dataSource = { isInitialized: true };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        { provide: getDataSourceToken(), useValue: dataSource },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('health', () => {
    it('reports ok when the database is connected', () => {
      dataSource.isInitialized = true;
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        database: 'connected',
      });
    });

    it('reports a disconnected database', () => {
      dataSource.isInitialized = false;
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        database: 'disconnected',
      });
    });
  });
});

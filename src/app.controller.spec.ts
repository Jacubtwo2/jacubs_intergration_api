import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService, ApiStatusResponse } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('status', () => {
    it('should describe the running API', () => {
      const payload: ApiStatusResponse = appController.getStatus();

      expect(payload).toEqual(
        expect.objectContaining({
          status: 'ok',
          service: 'Jacubs Integration API',
          version: expect.any(String),
          docs: expect.objectContaining({
            url: expect.stringContaining('/docs'),
          }),
        }),
      );

      expect(payload.timestamp).toEqual(expect.any(String));
      expect(payload.uptime.seconds).toEqual(expect.any(Number));
      expect(payload.uptime.humanReadable).toEqual(expect.any(String));
    });
  });
});

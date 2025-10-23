import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import type { ApiStatusResponse } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getStatus(): ApiStatusResponse {
    return this.appService.getStatus();
  }
}

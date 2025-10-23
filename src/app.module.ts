import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DATABASE_CONNECTION } from './database/database.constants';
import { databaseConnectionFactory } from './database/database.factory';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: DATABASE_CONNECTION,
      useFactory: databaseConnectionFactory,
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class AppModule {}

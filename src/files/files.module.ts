import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FilesService } from './files.service';

@Module({
  imports: [
    MulterModule.register({
      dest: 'uploads',
    }),
  ],
  providers: [FilesService],
  exports: [FilesService, MulterModule],
})
export class FilesModule {}

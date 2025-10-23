import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join, resolve } from 'path';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadsRoot = resolve(process.cwd(), 'uploads');

  async ensureUserDirectory(userId: string): Promise<string> {
    const dir = join(this.uploadsRoot, userId);
    await fs.mkdir(dir, { recursive: true });
    return dir;
  }

  buildProfileImageUrl(userId: string, filename: string): string {
    return `/uploads/${userId}/${filename}`;
  }

  async removeFileByUrl(url?: string | null): Promise<void> {
    if (!url) {
      return;
    }

    const normalized = url.startsWith('/') ? url.substring(1) : url;
    const filePath = resolve(process.cwd(), normalized);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(`Failed to remove file at ${filePath}: ${(error as Error).message}`);
      }
    }
  }
}

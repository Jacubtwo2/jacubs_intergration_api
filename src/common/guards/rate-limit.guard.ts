import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import type { Request, Response } from 'express';

interface AttemptTracker {
  readonly expiresAt: number;
  count: number;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly attempts = new Map<string, AttemptTracker>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const email = (request.body?.email as string | undefined)?.toLowerCase?.() ?? 'anonymous';
    const key = `${request.ip ?? 'unknown'}:${email}`;
    const now = Date.now();

    const tracker = this.attempts.get(key);

    const response = context.switchToHttp().getResponse<Response>();

    if (!tracker || tracker.expiresAt < now) {
      this.attempts.set(key, { count: 1, expiresAt: now + WINDOW_MS });
      response.once('finish', () => {
        if (response.statusCode >= 200 && response.statusCode < 400) {
          this.attempts.delete(key);
        }
      });
      return true;
    }

    if (tracker.count >= MAX_ATTEMPTS) {
      throw new HttpException(
        'Too many login attempts detected. Please try again in a few minutes.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    tracker.count += 1;

    response.once('finish', () => {
      if (response.statusCode >= 200 && response.statusCode < 400) {
        this.attempts.delete(key);
      }
    });

    return true;
  }
}

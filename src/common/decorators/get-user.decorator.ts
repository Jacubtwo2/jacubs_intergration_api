import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { SafeUser } from '../../users/users.service';

export const GetUser = createParamDecorator(
  (data: keyof SafeUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user?: SafeUser }>();
    const user = request.user;

    if (!user) {
      return undefined;
    }

    return data ? (user as SafeUser)[data] : user;
  },
);

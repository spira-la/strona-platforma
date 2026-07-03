import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Request {
  user: User;
}

/**
 * Extracts the authenticated Supabase user from the request.
 * Must be used on routes protected by SupabaseAuthGuard.
 *
 * @example
 * async getProfile(@CurrentUser() user: User) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);

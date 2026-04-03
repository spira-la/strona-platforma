import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq } from 'drizzle-orm';
import type { Request } from 'express';
import type { User } from '@supabase/supabase-js';
import { ROLES_KEY, UserRole } from '../decorators/roles.decorator.js';
import { DatabaseService } from '../../core/database.service.js';
import { profiles } from '../../db/schema/index.js';

/**
 * Checks that the authenticated user (set by SupabaseAuthGuard) has one of
 * the required roles declared via @Roles().
 *
 * Must be used AFTER SupabaseAuthGuard so request.user is populated.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly database: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No @Roles() decorator — allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = (request as Request & { user?: User }).user;

    if (!user) {
      throw new UnauthorizedException(
        'Authentication required before role check',
      );
    }

    // Look up the user's role from the profiles table
    const [profile] = await this.database.db
      .select({ role: profiles.role })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);

    if (!profile) {
      throw new ForbiddenException('User profile not found');
    }

    const userRole = profile.role as UserRole;

    if (!requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import type { Request } from 'express';
import type { User } from '@supabase/supabase-js';
import { ROLES_KEY, UserRole } from '../decorators/roles.decorator.js';
import { ProfileEntity } from '../../db/entities/profile.entity.js';

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
    @InjectDataSource() private readonly dataSource: DataSource,
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
    const profile = await this.dataSource
      .getRepository(ProfileEntity)
      .findOne({ where: { id: user.id }, select: { role: true } });

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

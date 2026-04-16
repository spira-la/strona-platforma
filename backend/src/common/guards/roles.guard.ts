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
import { AdminEmailEntity } from '../../db/entities/admin-email.entity.js';
import { CoachEntity } from '../../db/entities/coach.entity.js';
import { UserRole as UserRoleEnum } from '../../db/entities/enums.js';

/**
 * Checks that the authenticated user (set by SupabaseAuthGuard) has at least
 * one of the roles declared via @Roles().
 *
 * Roles are derived from DB (multi-role supported):
 *   - 'admin'  → email in admin_emails OR profiles.role = 'admin'
 *   - 'coach'  → row exists in coaches for this user_id
 *   - 'user'   → always true for authenticated users
 *
 * A single user can hold multiple roles simultaneously (e.g. admin + coach).
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

    const userRoles = await this.resolveUserRoles(user);
    const hasRequiredRole = requiredRoles.some((r) => userRoles.has(r));

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }

  private async resolveUserRoles(user: User): Promise<Set<UserRole>> {
    const roles = new Set<UserRole>(['user']);

    const [isAllowlistedAdmin, profile, hasCoachProfile] = await Promise.all([
      this.isAllowlistedAdmin(user.email),
      this.ensureProfile(user),
      this.dataSource
        .getRepository(CoachEntity)
        .exists({ where: { userId: user.id } }),
    ]);

    if (isAllowlistedAdmin || profile.role === UserRoleEnum.ADMIN) {
      roles.add('admin');
    }
    if (hasCoachProfile) {
      roles.add('coach');
    }

    return roles;
  }

  private async isAllowlistedAdmin(
    email: string | undefined,
  ): Promise<boolean> {
    const normalized = (email ?? '').toLowerCase();
    if (normalized.length === 0) return false;
    return this.dataSource
      .getRepository(AdminEmailEntity)
      .createQueryBuilder('ae')
      .where('lower(ae.email) = :email', { email: normalized })
      .getExists();
  }

  // Self-heals the `profiles` row on first authenticated access. Supabase
  // triggers handle this in hosted envs; this covers local Postgres and
  // any user that pre-dates the trigger. Never overwrites an existing role.
  private async ensureProfile(user: User): Promise<ProfileEntity> {
    const profileRepo = this.dataSource.getRepository(ProfileEntity);
    const existing = await profileRepo.findOne({
      where: { id: user.id },
      select: { role: true, email: true },
    });

    if (existing) return existing;

    const isAllowlistedAdmin = await this.isAllowlistedAdmin(user.email);
    const initialRole = isAllowlistedAdmin
      ? UserRoleEnum.ADMIN
      : UserRoleEnum.USER;
    await profileRepo.insert({
      id: user.id,
      email: user.email ?? `${user.id}@unknown.local`,
      fullName:
        (user.user_metadata as { full_name?: string } | undefined)?.full_name ??
        null,
      role: initialRole,
    });
    return { role: initialRole, email: user.email ?? '' } as ProfileEntity;
  }
}

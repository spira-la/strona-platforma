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
import { UserRole as UserRoleEnum } from '../../db/entities/enums.js';

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

    const isAllowlistedAdmin = await this.isAllowlistedAdmin(user.email);
    const profile = await this.ensureProfile(user, isAllowlistedAdmin);

    const userRole = (profile.role ?? UserRoleEnum.USER) as UserRole;
    const grantsAdmin = requiredRoles.includes('admin') && isAllowlistedAdmin;

    if (!grantsAdmin && !requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
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
  // any user that pre-dates the trigger.
  private async ensureProfile(
    user: User,
    isAllowlistedAdmin: boolean,
  ): Promise<ProfileEntity> {
    const profileRepo = this.dataSource.getRepository(ProfileEntity);
    const existing = await profileRepo.findOne({
      where: { id: user.id },
      select: { role: true, email: true },
    });

    if (!existing) {
      const initialRole = isAllowlistedAdmin
        ? UserRoleEnum.ADMIN
        : UserRoleEnum.USER;
      await profileRepo.insert({
        id: user.id,
        email: user.email ?? `${user.id}@unknown.local`,
        fullName:
          (user.user_metadata as { full_name?: string } | undefined)
            ?.full_name ?? null,
        role: initialRole,
      });
      return { role: initialRole, email: user.email ?? '' } as ProfileEntity;
    }

    if (isAllowlistedAdmin && existing.role !== UserRoleEnum.ADMIN) {
      await profileRepo.update({ id: user.id }, { role: UserRoleEnum.ADMIN });
      existing.role = UserRoleEnum.ADMIN;
    }
    return existing;
  }
}

import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

export type UserRole = 'user' | 'coach' | 'admin';

/**
 * Declares which roles are allowed to access a route.
 * Must be combined with RolesGuard.
 *
 * @example
 * @Roles('admin')
 * @UseGuards(RolesGuard)
 * @Delete(':id')
 * remove() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

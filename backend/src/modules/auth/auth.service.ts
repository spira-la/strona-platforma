import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { User } from '@supabase/supabase-js';
import { ProfileEntity } from '../../db/entities/profile.entity.js';
import { AdminEmailEntity } from '../../db/entities/admin-email.entity.js';
import { CoachEntity } from '../../db/entities/coach.entity.js';
import { UserRole } from '../../db/entities/enums.js';

export interface EffectiveUser {
  userId: string;
  email: string | null;
  fullName: string | null;
  profileRole: UserRole | null;
  isAdmin: boolean;
  isCoach: boolean;
  isClient: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profiles: Repository<ProfileEntity>,
    @InjectRepository(AdminEmailEntity)
    private readonly adminEmails: Repository<AdminEmailEntity>,
    @InjectRepository(CoachEntity)
    private readonly coaches: Repository<CoachEntity>,
  ) {}

  async resolveEffectiveUser(user: User): Promise<EffectiveUser> {
    const email = user.email ?? null;

    const [profile, isAllowlistedAdmin, hasCoachProfile] = await Promise.all([
      this.profiles.findOne({
        where: { id: user.id },
        select: { role: true, email: true, fullName: true },
      }),
      this.isAllowlistedAdmin(email),
      this.coaches.exists({ where: { userId: user.id } }),
    ]);

    const profileRole = profile?.role ?? null;
    const isAdmin = isAllowlistedAdmin || profileRole === UserRole.ADMIN;

    return {
      userId: user.id,
      email: profile?.email ?? email,
      fullName: profile?.fullName ?? null,
      profileRole,
      isAdmin,
      isCoach: hasCoachProfile,
      isClient: true,
    };
  }

  private async isAllowlistedAdmin(email: string | null): Promise<boolean> {
    const normalized = (email ?? '').toLowerCase();
    if (normalized.length === 0) return false;
    return this.adminEmails
      .createQueryBuilder('ae')
      .where('lower(ae.email) = :email', { email: normalized })
      .getExists();
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../../core/cache.service.js';
import { CoachEntity } from '../../db/entities/coach.entity.js';
import { ProfileEntity } from '../../db/entities/profile.entity.js';
import { UserRole } from '../../db/entities/enums.js';

const CACHE_KEY_ALL = 'coaches:all';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface CoachWithProfile {
  id: string;
  userId: string | null;
  fullName: string | null;
  email: string;
  phone: string | null;
  bio: string | null;
  expertise: string[] | null;
  languages: string[] | null;
  location: string | null;
  website: string | null;
  timezone: string | null;
  acceptingClients: boolean | null;
  yearsExperience: number | null;
  certifications: string[] | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface CreateCoachData {
  fullName: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
  expertise?: string[] | null;
  languages?: string[] | null;
  location?: string | null;
  timezone?: string | null;
  acceptingClients?: boolean;
  yearsExperience?: number | null;
  certifications?: string[] | null;
}

export interface UpdateCoachData {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  expertise?: string[] | null;
  languages?: string[] | null;
  location?: string | null;
  website?: string | null;
  timezone?: string | null;
  acceptingClients?: boolean | null;
  yearsExperience?: number | null;
  certifications?: string[] | null;
}

@Injectable()
export class CoachesService {
  constructor(
    @InjectRepository(CoachEntity)
    private readonly coachRepo: Repository<CoachEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepo: Repository<ProfileEntity>,
    private readonly cache: CacheService,
  ) {}

  // ---------------------------------------------------------------------------
  // Internal helper: merge coach + profile into a flat response shape
  // ---------------------------------------------------------------------------
  private async buildCoachWithProfile(
    coach: CoachEntity,
  ): Promise<CoachWithProfile> {
    const profile = coach.userId
      ? await this.profileRepo.findOne({ where: { id: coach.userId } })
      : null;

    return {
      id: coach.id,
      userId: coach.userId,
      fullName: profile?.fullName ?? null,
      email: profile?.email ?? '',
      phone: profile?.phone ?? null,
      bio: coach.bio,
      expertise: coach.expertise,
      languages: coach.languages,
      location: coach.location,
      website: coach.website,
      timezone: coach.timezone,
      acceptingClients: coach.acceptingClients,
      yearsExperience: coach.yearsExperience,
      certifications: coach.certifications,
      isActive: coach.isActive,
      createdAt: coach.createdAt,
      updatedAt: coach.updatedAt,
    };
  }

  // ---------------------------------------------------------------------------
  // findAll — left-join coaches with profiles via a raw query for efficiency
  // ---------------------------------------------------------------------------
  async findAll(): Promise<CoachWithProfile[]> {
    const cached = this.cache.get<CoachWithProfile[]>(CACHE_KEY_ALL);
    if (cached) return cached;

    const coaches = await this.coachRepo
      .createQueryBuilder('coach')
      .orderBy('coach.createdAt', 'DESC')
      .getMany();

    const userIds = coaches
      .map((c) => c.userId)
      .filter((id): id is string => !!id);

    const profiles =
      userIds.length > 0
        ? await this.profileRepo
            .createQueryBuilder('profile')
            .where('profile.id IN (:...ids)', { ids: userIds })
            .getMany()
        : [];

    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    const result: CoachWithProfile[] = coaches.map((coach) => {
      const profile = coach.userId ? profileMap.get(coach.userId) : undefined;
      return {
        id: coach.id,
        userId: coach.userId,
        fullName: profile?.fullName ?? null,
        email: profile?.email ?? '',
        phone: profile?.phone ?? null,
        bio: coach.bio,
        expertise: coach.expertise,
        languages: coach.languages,
        location: coach.location,
        website: coach.website,
        timezone: coach.timezone,
        acceptingClients: coach.acceptingClients,
        yearsExperience: coach.yearsExperience,
        certifications: coach.certifications,
        isActive: coach.isActive,
        createdAt: coach.createdAt,
        updatedAt: coach.updatedAt,
      };
    });

    this.cache.set(CACHE_KEY_ALL, result, CACHE_TTL);
    return result;
  }

  // ---------------------------------------------------------------------------
  // findById
  // ---------------------------------------------------------------------------
  async findById(id: string): Promise<CoachWithProfile> {
    const coach = await this.coachRepo.findOne({ where: { id } });
    if (!coach) {
      throw new NotFoundException(`Coach with id "${id}" not found`);
    }
    return this.buildCoachWithProfile(coach);
  }

  // ---------------------------------------------------------------------------
  // create — create a coach (and profile if needed) by email
  // ---------------------------------------------------------------------------
  async create(data: CreateCoachData): Promise<CoachWithProfile> {
    // Check if a profile with this email already exists
    let profile = await this.profileRepo.findOne({
      where: { email: data.email },
    });

    if (profile) {
      // Profile exists — check for duplicate coach
      const existing = await this.coachRepo.findOne({
        where: { userId: profile.id },
      });
      if (existing) {
        throw new ConflictException(
          `A coach record already exists for "${data.email}"`,
        );
      }
    } else {
      // Create a new profile for this coach
      profile = this.profileRepo.create({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone ?? null,
        timezone: data.timezone ?? 'Europe/Warsaw',
        role: UserRole.COACH,
      });
      profile = await this.profileRepo.save(profile);
    }

    // Update profile fields if provided
    const profileUpdate: Partial<ProfileEntity> = {};
    if (data.fullName) profileUpdate.fullName = data.fullName;
    if (data.phone !== undefined) profileUpdate.phone = data.phone ?? null;
    if (profile.role !== UserRole.COACH && profile.role !== UserRole.ADMIN) {
      profileUpdate.role = UserRole.COACH;
    }
    if (Object.keys(profileUpdate).length > 0) {
      await this.profileRepo.update({ id: profile.id }, profileUpdate);
    }

    // Create the coach entity
    const entity = this.coachRepo.create({
      userId: profile.id,
      bio: data.bio ?? null,
      expertise: data.expertise ?? null,
      languages: data.languages ?? null,
      location: data.location ?? null,
      timezone: data.timezone ?? profile.timezone ?? 'Europe/Warsaw',
      acceptingClients: data.acceptingClients ?? true,
      yearsExperience: data.yearsExperience ?? null,
      certifications: data.certifications ?? null,
      isActive: true,
    });

    const created = await this.coachRepo.save(entity);

    this.cache.delete(CACHE_KEY_ALL);
    return this.buildCoachWithProfile(created);
  }

  // ---------------------------------------------------------------------------
  // update
  // ---------------------------------------------------------------------------
  async update(id: string, data: UpdateCoachData): Promise<CoachWithProfile> {
    const coach = await this.coachRepo.findOne({ where: { id } });
    if (!coach) {
      throw new NotFoundException(`Coach with id "${id}" not found`);
    }

    // Update profile fields if provided
    if (
      coach.userId &&
      (data.fullName !== undefined ||
        data.email !== undefined ||
        data.phone !== undefined)
    ) {
      const profileUpdate: Partial<ProfileEntity> = {};
      if (data.fullName !== undefined) profileUpdate.fullName = data.fullName;
      if (data.email !== undefined) profileUpdate.email = data.email!;
      if (data.phone !== undefined) profileUpdate.phone = data.phone ?? null;
      await this.profileRepo.update({ id: coach.userId }, profileUpdate);
    }

    // Update coach fields
    const payload: Partial<CoachEntity> = {};

    if (data.bio !== undefined) payload.bio = data.bio ?? null;
    if (data.expertise !== undefined)
      payload.expertise = data.expertise ?? null;
    if (data.languages !== undefined)
      payload.languages = data.languages ?? null;
    if (data.location !== undefined) payload.location = data.location ?? null;
    if (data.website !== undefined) payload.website = data.website ?? null;
    if (data.timezone !== undefined) payload.timezone = data.timezone ?? null;
    if (data.acceptingClients !== undefined)
      payload.acceptingClients = data.acceptingClients ?? null;
    if (data.yearsExperience !== undefined)
      payload.yearsExperience = data.yearsExperience ?? null;
    if (data.certifications !== undefined)
      payload.certifications = data.certifications ?? null;

    if (Object.keys(payload).length > 0) {
      await this.coachRepo.update({ id }, payload);
    }

    this.cache.delete(CACHE_KEY_ALL);

    const updated = await this.coachRepo.findOne({ where: { id } });
    return this.buildCoachWithProfile(updated!);
  }

  // ---------------------------------------------------------------------------
  // archive / restore
  // ---------------------------------------------------------------------------
  async archive(id: string): Promise<CoachWithProfile> {
    const coach = await this.coachRepo.findOne({ where: { id } });
    if (!coach) {
      throw new NotFoundException(`Coach with id "${id}" not found`);
    }
    await this.coachRepo.update({ id }, { isActive: false });
    this.cache.delete(CACHE_KEY_ALL);
    const updated = await this.coachRepo.findOne({ where: { id } });
    return this.buildCoachWithProfile(updated!);
  }

  async restore(id: string): Promise<CoachWithProfile> {
    const coach = await this.coachRepo.findOne({ where: { id } });
    if (!coach) {
      throw new NotFoundException(`Coach with id "${id}" not found`);
    }
    await this.coachRepo.update({ id }, { isActive: true });
    this.cache.delete(CACHE_KEY_ALL);
    const updated = await this.coachRepo.findOne({ where: { id } });
    return this.buildCoachWithProfile(updated!);
  }
}

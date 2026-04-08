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
  userId: string;
  bio?: string | null;
  expertise?: string[] | null;
  languages?: string[] | null;
  timezone?: string | null;
}

export interface UpdateCoachData {
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
  // create — link an existing user profile as a coach
  // ---------------------------------------------------------------------------
  async create(data: CreateCoachData): Promise<CoachWithProfile> {
    // Verify the user profile exists
    const profile = await this.profileRepo.findOne({
      where: { id: data.userId },
    });
    if (!profile) {
      throw new NotFoundException(
        `User profile with id "${data.userId}" not found`,
      );
    }

    // Prevent duplicates — one user can only be a coach once
    const existing = await this.coachRepo.findOne({
      where: { userId: data.userId },
    });
    if (existing) {
      throw new ConflictException(
        `A coach record already exists for user "${data.userId}"`,
      );
    }

    const entity = this.coachRepo.create({
      userId: data.userId,
      bio: data.bio ?? null,
      expertise: data.expertise ?? null,
      languages: data.languages ?? null,
      timezone: data.timezone ?? profile.timezone ?? 'Europe/Warsaw',
      isActive: true,
    });

    const created = await this.coachRepo.save(entity);

    // Promote the profile role to COACH if it is currently USER
    if (profile.role !== UserRole.COACH && profile.role !== UserRole.ADMIN) {
      await this.profileRepo.update({ id: data.userId }, { role: UserRole.COACH });
    }

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

    const payload: Partial<CoachEntity> = {};

    if (data.bio !== undefined) payload.bio = data.bio ?? null;
    if (data.expertise !== undefined) payload.expertise = data.expertise ?? null;
    if (data.languages !== undefined) payload.languages = data.languages ?? null;
    if (data.location !== undefined) payload.location = data.location ?? null;
    if (data.website !== undefined) payload.website = data.website ?? null;
    if (data.timezone !== undefined) payload.timezone = data.timezone ?? null;
    if (data.acceptingClients !== undefined)
      payload.acceptingClients = data.acceptingClients ?? null;
    if (data.yearsExperience !== undefined)
      payload.yearsExperience = data.yearsExperience ?? null;
    if (data.certifications !== undefined)
      payload.certifications = data.certifications ?? null;

    await this.coachRepo.update({ id }, payload);

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

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../../core/cache.service.js';
import { CoachingServiceEntity } from '../../db/entities/coaching-service.entity.js';

const CACHE_KEY_ALL = 'services:all';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export type CoachingService = CoachingServiceEntity;

export interface CreateServiceData {
  name: string;
  description?: string | null;
  durationMinutes: number;
  sessionCount?: number | null;
  priceCents: number;
  currency?: string | null;
  coachId?: string | null;
  isActive?: boolean;
  sortOrder?: number | null;
}

export type UpdateServiceData = Partial<CreateServiceData>;

@Injectable()
export class CoachingServicesService {
  constructor(
    @InjectRepository(CoachingServiceEntity)
    private readonly repo: Repository<CoachingServiceEntity>,
    private readonly cache: CacheService,
  ) {}

  async findAll(): Promise<CoachingService[]> {
    const cached = this.cache.get<CoachingService[]>(CACHE_KEY_ALL);
    if (cached) return cached;

    const result = await this.repo.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });

    this.cache.set(CACHE_KEY_ALL, result, CACHE_TTL);
    return result;
  }

  async findById(id: string): Promise<CoachingService> {
    const service = await this.repo.findOne({ where: { id } });

    if (!service) {
      throw new NotFoundException(`Coaching service with id "${id}" not found`);
    }

    return service;
  }

  async create(data: CreateServiceData): Promise<CoachingService> {
    const entity = this.repo.create({
      name: data.name,
      description: data.description ?? null,
      durationMinutes: data.durationMinutes,
      sessionCount: data.sessionCount ?? 1,
      priceCents: data.priceCents,
      currency: data.currency ?? 'PLN',
      coachId: data.coachId ?? null,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
    });

    const created = await this.repo.save(entity);

    this.cache.delete(CACHE_KEY_ALL);
    return created;
  }

  async update(id: string, data: UpdateServiceData): Promise<CoachingService> {
    await this.findById(id);

    const updatePayload: Partial<CoachingServiceEntity> = {};

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.description !== undefined)
      updatePayload.description = data.description ?? null;
    if (data.durationMinutes !== undefined)
      updatePayload.durationMinutes = data.durationMinutes;
    if (data.sessionCount !== undefined)
      updatePayload.sessionCount = data.sessionCount ?? null;
    if (data.priceCents !== undefined)
      updatePayload.priceCents = data.priceCents;
    if (data.currency !== undefined)
      updatePayload.currency = data.currency ?? null;
    if (data.coachId !== undefined)
      updatePayload.coachId = data.coachId ?? null;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
    if (data.sortOrder !== undefined)
      updatePayload.sortOrder = data.sortOrder ?? null;

    await this.repo.update({ id }, updatePayload);

    this.cache.delete(CACHE_KEY_ALL);
    return this.findById(id);
  }

  async archive(id: string): Promise<CoachingService> {
    await this.findById(id);
    await this.repo.update({ id }, { isActive: false });
    this.cache.delete(CACHE_KEY_ALL);
    return this.findById(id);
  }

  async restore(id: string): Promise<CoachingService> {
    await this.findById(id);
    await this.repo.update({ id }, { isActive: true });
    this.cache.delete(CACHE_KEY_ALL);
    return this.findById(id);
  }
}

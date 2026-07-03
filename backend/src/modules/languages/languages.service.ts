import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../../core/cache.service.js';
import { LanguageEntity } from '../../db/entities/language.entity.js';

const CACHE_KEY_ALL = 'languages:all';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export type Language = LanguageEntity;

export interface CreateLanguageData {
  code: string;
  name: string;
  nativeName?: string | null;
  flag?: string | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
}

export type UpdateLanguageData = Partial<CreateLanguageData>;

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(LanguageEntity)
    private readonly repo: Repository<LanguageEntity>,
    private readonly cache: CacheService,
  ) {}

  async findAll(): Promise<Language[]> {
    const cached = this.cache.get<Language[]>(CACHE_KEY_ALL);
    if (cached) return cached;

    const result = await this.repo.find({
      order: { sortOrder: 'ASC' },
    });

    this.cache.set(CACHE_KEY_ALL, result, CACHE_TTL);
    return result;
  }

  async findById(id: string): Promise<Language> {
    const language = await this.repo.findOne({ where: { id } });

    if (!language) {
      throw new NotFoundException(`Language with id "${id}" not found`);
    }

    return language;
  }

  async create(data: CreateLanguageData): Promise<Language> {
    const entity = this.repo.create({
      code: data.code,
      name: data.name,
      nativeName: data.nativeName ?? null,
      flag: data.flag ?? null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    });

    const created = await this.repo.save(entity);

    this.cache.delete(CACHE_KEY_ALL);
    return created;
  }

  async update(id: string, data: UpdateLanguageData): Promise<Language> {
    await this.findById(id);

    const updatePayload: Partial<LanguageEntity> = {};

    if (data.code !== undefined) updatePayload.code = data.code;
    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.nativeName !== undefined)
      updatePayload.nativeName = data.nativeName ?? null;
    if (data.flag !== undefined) updatePayload.flag = data.flag ?? null;
    if (data.sortOrder !== undefined)
      updatePayload.sortOrder = data.sortOrder ?? null;
    if (data.isActive !== undefined)
      updatePayload.isActive = data.isActive ?? null;

    await this.repo.update({ id }, updatePayload);

    this.cache.delete(CACHE_KEY_ALL);
    return this.findById(id);
  }

  async archive(id: string): Promise<Language> {
    await this.findById(id);
    await this.repo.update({ id }, { isActive: false });
    this.cache.delete(CACHE_KEY_ALL);
    return this.findById(id);
  }

  async restore(id: string): Promise<Language> {
    await this.findById(id);
    await this.repo.update({ id }, { isActive: true });
    this.cache.delete(CACHE_KEY_ALL);
    return this.findById(id);
  }
}

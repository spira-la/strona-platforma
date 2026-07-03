import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../../core/cache.service.js';
import { CategoryEntity } from '../../db/entities/product.entity.js';

const CACHE_KEY_ALL = 'categories:all';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export type Category = CategoryEntity;

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
}

export type UpdateCategoryData = Partial<CreateCategoryData>;

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly repo: Repository<CategoryEntity>,
    private readonly cache: CacheService,
  ) {}

  async findAll(): Promise<Category[]> {
    const cached = this.cache.get<Category[]>(CACHE_KEY_ALL);
    if (cached) return cached;

    const result = await this.repo.find({
      order: { sortOrder: 'ASC', createdAt: 'DESC' },
    });

    this.cache.set(CACHE_KEY_ALL, result, CACHE_TTL);
    return result;
  }

  async findById(id: string): Promise<Category> {
    const category = await this.repo.findOne({ where: { id } });

    if (!category) {
      throw new NotFoundException(`Category with id "${id}" not found`);
    }

    return category;
  }

  async create(data: CreateCategoryData): Promise<Category> {
    const entity = this.repo.create({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      parentId: data.parentId ?? null,
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
    });

    const created = await this.repo.save(entity);

    this.cache.delete(CACHE_KEY_ALL);
    return created;
  }

  async update(id: string, data: UpdateCategoryData): Promise<Category> {
    await this.findById(id);

    const updatePayload: Partial<CategoryEntity> = {};

    if (data.name !== undefined) updatePayload.name = data.name;
    if (data.slug !== undefined) updatePayload.slug = data.slug;
    if (data.description !== undefined)
      updatePayload.description = data.description ?? null;
    if (data.parentId !== undefined)
      updatePayload.parentId = data.parentId ?? null;
    if (data.sortOrder !== undefined)
      updatePayload.sortOrder = data.sortOrder ?? null;
    if (data.isActive !== undefined)
      updatePayload.isActive = data.isActive ?? null;

    await this.repo.update({ id }, updatePayload);

    this.cache.delete(CACHE_KEY_ALL);
    return this.findById(id);
  }

  async archive(id: string): Promise<Category> {
    await this.findById(id);
    await this.repo.update({ id }, { isActive: false });
    this.cache.delete(CACHE_KEY_ALL);
    return this.findById(id);
  }

  async restore(id: string): Promise<Category> {
    await this.findById(id);
    await this.repo.update({ id }, { isActive: true });
    this.cache.delete(CACHE_KEY_ALL);
    return this.findById(id);
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../../core/cache.service.js';
import { StorageService } from '../../core/storage.service.js';
import { CmsContentEntity } from '../../db/entities/cms-content.entity.js';

const CACHE_KEY = 'cms:content:main_page';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const DOC_ID = 'main_page';

type CMSContent = Record<string, Record<string, Record<string, unknown>>>;

interface CMSDocument {
  id: string;
  content: CMSContent;
  version: number;
  updatedBy: string | null;
  updatedAt: Date | null;
  createdAt: Date | null;
}

@Injectable()
export class CmsService {
  constructor(
    @InjectRepository(CmsContentEntity)
    private readonly repo: Repository<CmsContentEntity>,
    private readonly cache: CacheService,
    private readonly storage: StorageService,
  ) {}

  async getContent(): Promise<CMSDocument> {
    // Check cache first
    const cached = this.cache.get<CMSDocument>(CACHE_KEY);
    if (cached) return cached;

    // Query DB
    const doc = await this.repo.findOne({ where: { id: DOC_ID } });

    if (!doc) {
      // Return empty document if none exists yet
      const empty: CMSDocument = {
        id: DOC_ID,
        content: {},
        version: 0,
        updatedBy: null,
        updatedAt: null,
        createdAt: null,
      };
      return empty;
    }

    const result: CMSDocument = {
      id: doc.id,
      content: doc.content as CMSContent,
      version: doc.version ?? 1,
      updatedBy: doc.updatedBy,
      updatedAt: doc.updatedAt,
      createdAt: doc.createdAt,
    };

    // Store in cache
    this.cache.set(CACHE_KEY, result, CACHE_TTL);
    return result;
  }

  async updateField(
    section: string,
    language: string,
    fieldPath: string,
    value: string,
    userId?: string,
  ): Promise<{ version: number; updatedAt: Date }> {
    const doc = await this.getContent();
    const content = { ...doc.content };

    // Ensure section and language exist
    if (!content[section]) content[section] = {};
    if (!content[section][language]) content[section][language] = {};

    // Set nested value using dot-notation fieldPath
    const parts = fieldPath.split('.');
    let cursor: Record<string, unknown> = content[section][language];
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      if (typeof cursor[key] !== 'object' || cursor[key] === null) {
        cursor[key] = {};
      }
      cursor = cursor[key] as Record<string, unknown>;
    }
    cursor[parts.at(-1)] = value;

    const newVersion = (doc.version || 0) + 1;
    const now = new Date();

    if (doc.version === 0) {
      // Document doesn't exist yet — insert
      const entity = this.repo.create({
        id: DOC_ID,
        content,
        version: newVersion,
        updatedBy: userId ?? null,
        updatedAt: now,
      });
      await this.repo.save(entity);
    } else {
      // Update existing
      await this.repo.update(
        { id: DOC_ID },
        {
          content,
          version: newVersion,
          updatedBy: userId ?? null,
          updatedAt: now,
        },
      );
    }

    // Invalidate cache
    this.cache.delete(CACHE_KEY);

    return { version: newVersion, updatedAt: now };
  }

  /**
   * Clears a field value by setting it to an empty string.
   * The frontend treats "" as "no content" and shows its fallback.
   */
  async deleteField(
    section: string,
    language: string,
    fieldPath: string,
    userId?: string,
  ): Promise<{ version: number; updatedAt: Date }> {
    return this.updateField(section, language, fieldPath, '', userId);
  }

  async updateSection(
    section: string,
    language: string,
    sectionContent: Record<string, unknown>,
    userId?: string,
  ): Promise<{ version: number; updatedAt: Date }> {
    const doc = await this.getContent();
    const content = { ...doc.content };

    if (!content[section]) content[section] = {};
    content[section][language] = sectionContent;

    const newVersion = (doc.version || 0) + 1;
    const now = new Date();

    if (doc.version === 0) {
      const entity = this.repo.create({
        id: DOC_ID,
        content,
        version: newVersion,
        updatedBy: userId ?? null,
        updatedAt: now,
      });
      await this.repo.save(entity);
    } else {
      await this.repo.update(
        { id: DOC_ID },
        {
          content,
          version: newVersion,
          updatedBy: userId ?? null,
          updatedAt: now,
        },
      );
    }

    this.cache.delete(CACHE_KEY);
    return { version: newVersion, updatedAt: now };
  }

  async initialize(
    content?: CMSContent,
    force = false,
  ): Promise<{ version: number; created: boolean }> {
    const doc = await this.getContent();

    if (doc.version > 0 && !force) {
      return { version: doc.version, created: false };
    }

    const initialContent = content ?? {};
    const now = new Date();

    if (doc.version === 0) {
      const entity = this.repo.create({
        id: DOC_ID,
        content: initialContent,
        version: 1,
        updatedAt: now,
      });
      await this.repo.save(entity);
    } else {
      await this.repo.update(
        { id: DOC_ID },
        {
          content: initialContent,
          version: (doc.version || 0) + 1,
          updatedAt: now,
        },
      );
    }

    this.cache.delete(CACHE_KEY);
    return { version: doc.version + 1, created: true };
  }

  /** Returns the StorageService so the controller can access it without
   *  a separate injection (keeps the DI graph simple). */
  getStorage(): StorageService {
    return this.storage;
  }
}

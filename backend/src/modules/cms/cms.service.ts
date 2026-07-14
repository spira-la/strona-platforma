import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CacheService } from '../../core/cache.service.js';
import { StorageService } from '../../core/storage.service.js';
import { OpenRouterService } from '../../core/openrouter.service.js';
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
  private readonly logger = new Logger(CmsService.name);

  // Translation queue — same FIFO + mutex pattern as blog translations
  private readonly translateQueue: Array<{
    section: string;
    fieldPath: string;
    value: string;
    targetLang: string;
  }> = [];
  private isTranslating = false;

  // Progress tracking for retranslateAll runs
  private translationTotal = 0;
  private translationCompleted = 0;
  private translationLastStartedAt: Date | null = null;

  constructor(
    @InjectRepository(CmsContentEntity)
    private readonly repo: Repository<CmsContentEntity>,
    private readonly cache: CacheService,
    private readonly storage: StorageService,
    private readonly openRouter: OpenRouterService,
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
    cursor[parts.at(-1)!] = value;

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

    // Auto-propagate PL edits to EN + ES in background
    if (language === 'pl' && value.trim().length > 0) {
      this.propagateToOtherLanguages(section, fieldPath, value);
    }

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

  /**
   * Reads a single field value (e.g. a hero image URL) without pulling in
   * the whole content document. Media fields (heroBg, etc.) are always
   * stored under 'pl' regardless of locale, matching the frontend's
   * MEDIA_FIELD_PATTERNS convention — so language is only consulted for
   * non-media fields. Returns undefined if the field was never set.
   */
  async getFieldValue(
    section: string,
    fieldPath: string,
    language = 'pl',
  ): Promise<string | undefined> {
    const doc = await this.getContent();
    const sectionData = doc.content[section];
    if (!sectionData) return undefined;

    const lang = this.isStyleField(fieldPath) ? 'pl' : language;
    const langData = sectionData[lang] ?? sectionData['pl'];
    if (!langData) return undefined;

    const value = fieldPath
      .split('.')
      .reduce<unknown>(
        (acc, key) =>
          acc && typeof acc === 'object'
            ? (acc as Record<string, unknown>)[key]
            : undefined,
        langData,
      );

    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  // ---------------------------------------------------------------------------
  // CMS auto-translation (PL → EN, ES) — background FIFO queue
  // ---------------------------------------------------------------------------

  // Style suffixes that should be COPIED (not translated) to other languages
  private static readonly STYLE_SUFFIXES = [
    // Text styling
    'Bold',
    'Italic',
    'Align',
    'Size',
    'Color',
    'MaxWidth',
    'MaxHeight',
    'Multiline',
    // Overlays
    'OverlayTop',
    'OverlayBottom',
    'OverlayAngle',
    // Backgrounds
    'Pos',
    'Fit',
  ];

  // Media fields (images, logos, avatars) stored at root fieldPath
  private static readonly MEDIA_FIELD_PATTERNS: RegExp[] = [
    /bg$/i,
    /bg\./i,
    /image$/i,
    /image\./i,
    /logo$/i,
    /photo$/i,
    /icon$/i,
    /avatar$/i,
    /cover$/i,
    /Src$/,
  ];

  private isStyleField(fieldPath: string): boolean {
    if (CmsService.STYLE_SUFFIXES.some((s) => fieldPath.endsWith(s))) {
      return true;
    }
    return CmsService.MEDIA_FIELD_PATTERNS.some((re) => re.test(fieldPath));
  }

  /**
   * Seeds PL values for static EditableText defaults that have never been
   * saved to the CMS. Skips any field that already has a PL value so it
   * is safe to call repeatedly without overwriting admin edits.
   */
  async bulkSeed(
    entries: Array<{ section: string; fieldPath: string; value: string }>,
  ): Promise<{ seeded: number }> {
    if (entries.length === 0) return { seeded: 0 };

    const doc = await this.getContent();
    const content = { ...doc.content };
    let seeded = 0;

    for (const { section, fieldPath, value } of entries) {
      if (!value.trim()) continue;

      // Skip if PL already has a value for this field
      const plData = content[section]?.['pl'];
      if (plData) {
        const existing = this.flattenFields(plData);
        if (existing[fieldPath]) continue;
      }

      if (!content[section]) content[section] = {};
      if (!content[section]['pl']) content[section]['pl'] = {};

      const parts = fieldPath.split('.');
      let cursor: Record<string, unknown> = content[section]['pl'];
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (typeof cursor[key] !== 'object' || cursor[key] === null) {
          cursor[key] = {};
        }
        cursor = cursor[key] as Record<string, unknown>;
      }
      cursor[parts.at(-1)!] = value;
      seeded++;
    }

    if (seeded === 0) return { seeded: 0 };

    const newVersion = (doc.version || 0) + 1;
    const now = new Date();

    if (doc.version === 0) {
      const entity = this.repo.create({
        id: DOC_ID,
        content,
        version: newVersion,
        updatedAt: now,
      });
      await this.repo.save(entity);
    } else {
      await this.repo.update(
        { id: DOC_ID },
        { content, version: newVersion, updatedAt: now },
      );
    }

    this.cache.delete(CACHE_KEY);
    this.logger.log(`CMS bulk-seeded ${seeded} PL fields`);

    return { seeded };
  }

  /**
   * Re-enqueues ALL translatable text fields from the Polish CMS content
   * to EN and ES. Useful to run after switching the translation provider
   * or fixing bad auto-translations. Non-blocking — returns the count of
   * fields enqueued.
   */
  async retranslateAll(): Promise<{ enqueued: number }> {
    const doc = await this.getContent();
    const content = doc.content;

    // Clear any pending jobs and reset progress counters
    this.translateQueue.length = 0;
    this.translationCompleted = 0;
    this.translationTotal = 0;
    this.translationLastStartedAt = new Date();

    const jobs: Array<{
      section: string;
      fieldPath: string;
      value: string;
      targetLang: string;
    }> = [];

    for (const [section, langMap] of Object.entries(content)) {
      const plContent = langMap['pl'];
      if (!plContent) continue;

      const flatFields = this.flattenFields(plContent);

      for (const [fieldPath, value] of Object.entries(flatFields)) {
        if (typeof value !== 'string' || !value.trim()) continue;
        if (this.isStyleField(fieldPath)) continue;

        for (const lang of ['en', 'es']) {
          jobs.push({ section, fieldPath, value, targetLang: lang });
        }
      }
    }

    this.translationTotal = jobs.length;
    for (const job of jobs) {
      this.translateQueue.push(job);
    }

    this.logger.log(`retranslateAll: enqueued ${jobs.length} translation jobs`);

    // Start processing if not already running
    void this.processTranslateQueue();

    return { enqueued: jobs.length };
  }

  /** Returns current translation queue status for frontend polling. */
  getTranslationStatus(): {
    isProcessing: boolean;
    queueSize: number;
    completed: number;
    total: number;
    startedAt: string | null;
  } {
    return {
      isProcessing: this.isTranslating,
      queueSize: this.translateQueue.length,
      completed: this.translationCompleted,
      total: this.translationTotal,
      startedAt: this.translationLastStartedAt?.toISOString() ?? null,
    };
  }

  /** Flattens a nested object into dot-notation paths. */
  private flattenFields(
    obj: Record<string, unknown>,
    prefix = '',
  ): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, val] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof val === 'string') {
        result[path] = val;
      } else if (val !== null && typeof val === 'object') {
        Object.assign(
          result,
          this.flattenFields(val as Record<string, unknown>, path),
        );
      }
    }
    return result;
  }

  /**
   * Propagates a PL edit to EN + ES:
   * - Style fields → copied directly (same value)
   * - Text fields → enqueued for translation via Ollama
   */
  private propagateToOtherLanguages(
    section: string,
    fieldPath: string,
    value: string,
  ): void {
    const targets = ['en', 'es'];

    if (this.isStyleField(fieldPath)) {
      // Style fields: copy directly to both languages (no translation needed)
      for (const lang of targets) {
        void this.copyFieldToLanguage(section, fieldPath, value, lang);
      }
    } else {
      // Text fields: enqueue for translation
      for (const lang of targets) {
        this.enqueueTranslation(section, fieldPath, value, lang);
      }
    }
  }

  /** Copies a field value directly to another language (no translation). */
  private async copyFieldToLanguage(
    section: string,
    fieldPath: string,
    value: string,
    targetLang: string,
  ): Promise<void> {
    try {
      const doc = await this.getContent();
      const content = { ...doc.content };

      if (!content[section]) content[section] = {};
      if (!content[section][targetLang]) content[section][targetLang] = {};

      const parts = fieldPath.split('.');
      let cursor: Record<string, unknown> = content[section][targetLang];
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (typeof cursor[key] !== 'object' || cursor[key] === null) {
          cursor[key] = {};
        }
        cursor = cursor[key] as Record<string, unknown>;
      }
      cursor[parts.at(-1)!] = value;

      await this.repo.update(
        { id: DOC_ID },
        { content, version: (doc.version || 0) + 1, updatedAt: new Date() },
      );
      this.cache.delete(CACHE_KEY);

      this.logger.debug(`CMS copied: ${section}.${fieldPath} → ${targetLang}`);
    } catch (error) {
      this.logger.error(
        `CMS copy failed: ${section}.${fieldPath} → ${targetLang}: ${String(error)}`,
      );
    }
  }

  private enqueueTranslation(
    section: string,
    fieldPath: string,
    value: string,
    targetLang: string,
  ): void {
    // Deduplicate
    const isDuplicate = this.translateQueue.some(
      (j) =>
        j.section === section &&
        j.fieldPath === fieldPath &&
        j.targetLang === targetLang,
    );
    if (isDuplicate) return;

    this.translateQueue.push({ section, fieldPath, value, targetLang });
    this.logger.log(
      `CMS translate enqueued: ${section}.${fieldPath} → ${targetLang} (queue: ${this.translateQueue.length})`,
    );

    void this.processTranslateQueue();
  }

  private async processTranslateQueue(): Promise<void> {
    if (this.isTranslating) return;
    this.isTranslating = true;

    while (this.translateQueue.length > 0) {
      const job = this.translateQueue.shift()!;
      await this.executeTranslateJob(job);
    }

    this.isTranslating = false;
  }

  private async executeTranslateJob(job: {
    section: string;
    fieldPath: string;
    value: string;
    targetLang: string;
  }): Promise<void> {
    try {
      const translated = await this.openRouter.translate(
        job.value,
        'pl',
        job.targetLang,
      );

      // Save translated value directly to the CMS content (no version bump
      // trigger — this is a background fill, not a user edit)
      const doc = await this.getContent();
      const content = { ...doc.content };

      if (!content[job.section]) content[job.section] = {};
      if (!content[job.section][job.targetLang])
        content[job.section][job.targetLang] = {};

      const parts = job.fieldPath.split('.');
      let cursor: Record<string, unknown> =
        content[job.section][job.targetLang];
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (typeof cursor[key] !== 'object' || cursor[key] === null) {
          cursor[key] = {};
        }
        cursor = cursor[key] as Record<string, unknown>;
      }
      cursor[parts.at(-1)!] = translated;

      const newVersion = (doc.version || 0) + 1;
      await this.repo.update(
        { id: DOC_ID },
        {
          content,
          version: newVersion,
          updatedAt: new Date(),
        },
      );

      this.cache.delete(CACHE_KEY);
      this.translationCompleted++;

      this.logger.log(
        `CMS translated [${this.translationCompleted}/${this.translationTotal}]: ${job.section}.${job.fieldPath} → ${job.targetLang}`,
      );
    } catch (error) {
      this.translationCompleted++;
      this.logger.error(
        `CMS translate failed: ${job.section}.${job.fieldPath} → ${job.targetLang}: ${String(error)}`,
      );
    }
  }
}

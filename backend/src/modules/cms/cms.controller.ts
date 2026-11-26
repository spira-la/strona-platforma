import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Query,
  Header,
  HttpCode,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import sharp from 'sharp';
import { CloudflareCacheService } from '../../core/cloudflare-cache.service.js';
import { CmsService } from './cms.service.js';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { User } from '@supabase/supabase-js';
import { CLEANABLE_SECTIONS } from './cms-reset.util.js';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

interface UpdateFieldDto {
  section: string;
  language: string;
  fieldPath: string;
  value: string;
}

interface UpdateSectionDto {
  section: string;
  language: string;
  content: Record<string, unknown>;
}

interface InitializeDto {
  content?: Record<string, Record<string, Record<string, unknown>>>;
  force?: boolean;
}

interface BulkSeedDto {
  entries: Array<{ section: string; fieldPath: string; value: string }>;
}

interface ResetSectionsDto {
  sections: string[];
  keepMedia?: boolean;
}

interface RestoreBackupDto {
  id: string;
}

interface ImageUploadBody {
  section: string;
  fieldPath: string;
  language: string;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Controller('cms')
export class CmsController {
  constructor(
    private readonly cms: CmsService,
    private readonly cloudflareCache: CloudflareCacheService,
    private readonly config: ConfigService,
  ) {}

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private async purgeCmsContent(): Promise<void> {
    const siteUrl = this.config.get<string>('SITE_URL') ?? '';
    if (!siteUrl) return;
    await this.cloudflareCache.purgeUrls([`${siteUrl}/api/cms/content`]);
  }

  private async purgeImageUrls(
    section: string,
    fieldPath: string,
  ): Promise<void> {
    const storage = this.cms.getStorage();
    const urls = [
      storage.getPublicUrl(`cms/${section}/${fieldPath}.webp`),
      storage.getPublicUrl(`cms/${section}/${fieldPath}-thumb.webp`),
    ];
    await this.cloudflareCache.purgeUrls(urls);
  }

  // -------------------------------------------------------------------------
  // Endpoints
  // -------------------------------------------------------------------------

  /**
   * GET /api/cms/version
   * Public — returns only the current content version. Uncached so a
   * client can cheaply detect whether its locally-cached /content is
   * stale without downloading the full JSONB document.
   */
  @Get('version')
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  async getVersion() {
    const doc = await this.cms.getContent();
    return { success: true, version: doc.version, updatedAt: doc.updatedAt };
  }

  /**
   * GET /api/cms/content
   * Public — returns all CMS content. Cached heavily; invalidation is
   * driven by (a) Cloudflare purge on every write and (b) clients
   * doing a version check against /cms/version before using the cache.
   */
  @Get('content')
  @Header(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=86400',
  )
  async getContent() {
    const doc = await this.cms.getContent();
    return {
      success: true,
      content: doc.content,
      version: doc.version,
      updatedAt: doc.updatedAt,
      updatedBy: doc.updatedBy,
    };
  }

  /**
   * PUT /api/cms/field
   * Admin — update a single field by dot-notation path.
   */
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('field')
  async updateField(@Body() body: UpdateFieldDto) {
    const { section, language, fieldPath, value } = body;
    const result = await this.cms.updateField(
      section,
      language,
      fieldPath,
      value,
    );

    await this.purgeCmsContent();

    return {
      success: true,
      message: 'Field updated successfully',
      version: result.version,
      updatedAt: result.updatedAt,
    };
  }

  /**
   * PUT /api/cms/section
   * Admin — replace an entire section for a language.
   */
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Put('section')
  async updateSection(@Body() body: UpdateSectionDto) {
    const { section, language, content } = body;
    const result = await this.cms.updateSection(section, language, content);

    await this.purgeCmsContent();

    return {
      success: true,
      message: 'Section updated successfully',
      version: result.version,
      updatedAt: result.updatedAt,
    };
  }

  /**
   * GET /api/cms/translation-status
   * Admin — returns current translation queue progress for frontend polling.
   */
  @Get('translation-status')
  @Header('Cache-Control', 'no-store')
  getTranslationStatus() {
    return { success: true, ...this.cms.getTranslationStatus() };
  }

  /**
   * POST /api/cms/retranslate-all
   * Admin — re-enqueue all Polish CMS text fields for translation to EN + ES.
   * Useful after switching translation provider or fixing bad auto-translations.
   * Returns 202 Accepted with the count of jobs enqueued; translation runs in background.
   */
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('retranslate-all')
  @HttpCode(HttpStatus.ACCEPTED)
  async retranslateAll() {
    const result = await this.cms.retranslateAll();
    await this.purgeCmsContent();
    return {
      success: true,
      message: `Re-translation started. ${result.enqueued} fields enqueued for EN + ES.`,
      enqueued: result.enqueued,
    };
  }

  /**
   * POST /api/cms/bulk-seed
   * Admin — save static PL fallback values for EditableText fields that
   * have never been edited. Skips fields that already have a PL value.
   * Returns 200 with the count of newly seeded fields.
   */
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('bulk-seed')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async bulkSeed(@Body() body: BulkSeedDto) {
    const entries = Array.isArray(body.entries) ? body.entries : [];
    const { seeded } = await this.cms.bulkSeed(entries);
    if (seeded > 0) {
      await this.purgeCmsContent();
    }
    return {
      success: true,
      seeded,
      message: `Seeded ${seeded} PL fields.`,
    };
  }

  /**
   * POST /api/cms/reset-sections
   * Admin — remove TEXT overrides from the selected sections (all languages)
   * so static EditableText defaults show again. Backs up first.
   */
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('reset-sections')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async resetSections(
    @Body() body: ResetSectionsDto,
    @CurrentUser() user: User,
  ) {
    const sections = Array.isArray(body.sections)
      ? body.sections.filter(
          (s): s is string => typeof s === 'string' && s.trim().length > 0,
        )
      : [];
    if (sections.length === 0) {
      throw new BadRequestException('sections must be a non-empty array');
    }
    const notAllowed = sections.filter((s) => !CLEANABLE_SECTIONS.includes(s));
    if (notAllowed.length > 0) {
      throw new BadRequestException(
        `These sections cannot be cleaned: ${notAllowed.join(', ')}`,
      );
    }
    const result = await this.cms.resetSections(
      sections,
      body.keepMedia !== false,
      user.id,
    );
    await this.purgeCmsContent();
    return {
      success: true,
      message: `Removed ${result.removed} text fields, kept ${result.kept} media/link fields.`,
      ...result,
    };
  }

  /** GET /api/cms/backups — Admin — latest 20 backups (no content). */
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('backups')
  @Header('Cache-Control', 'no-store')
  async listBackups() {
    const data = await this.cms.listBackups(20);
    return { success: true, data };
  }

  /** POST /api/cms/restore-backup — Admin — restore a backup by id. */
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('restore-backup')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  async restoreBackup(
    @Body() body: RestoreBackupDto,
    @CurrentUser() user: User,
  ) {
    const id = await new ParseUUIDPipe().transform(body?.id, {
      type: 'body',
    });
    const result = await this.cms.restoreBackup(id, user.id);
    await this.purgeCmsContent();
    return { success: true, message: 'Backup restored', ...result };
  }

  /**
   * POST /api/cms/initialize
   * Admin — create or reset the CMS document.
   */
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('initialize')
  @HttpCode(200)
  async initialize(@Body() body: InitializeDto) {
    const result = await this.cms.initialize(body.content, body.force);

    if (result.created) {
      await this.purgeCmsContent();
    }

    return {
      success: true,
      message: result.created
        ? 'CMS content initialized'
        : 'CMS content already exists (use force: true to overwrite)',
      version: result.version,
      created: result.created,
    };
  }

  /**
   * POST /api/cms/image
   * Admin — upload an image for a CMS field.
   *
   * Expects multipart/form-data with:
   *   - file: the image file
   *   - section: CMS section key
   *   - fieldPath: dot-notation field path within the section
   *   - language: language code (pl, en, es)
   *
   * Processing:
   *   - Main:      WebP, quality 80, max-width 1920px (aspect ratio preserved)
   *   - Thumbnail: WebP, quality 75, max-width 400px
   *
   * Storage keys:
   *   - cms/{section}/{fieldPath}.webp
   *   - cms/{section}/{fieldPath}-thumb.webp
   */
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ImageUploadBody,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const { section, fieldPath, language } = body;

    if (!section || !fieldPath || !language) {
      throw new BadRequestException(
        'section, fieldPath and language are required',
      );
    }

    const storage = this.cms.getStorage();

    // Process main image — max 1920px wide, WebP quality 80
    const mainBuffer = await sharp(file.buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // Process thumbnail — max 400px wide, WebP quality 75
    const thumbBuffer = await sharp(file.buffer)
      .resize({ width: 400, withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer();

    const mainKey = `cms/${section}/${fieldPath}.webp`;
    const thumbKey = `cms/${section}/${fieldPath}-thumb.webp`;

    // Upload both to R2 in parallel. The keys are deterministic so R2
    // overwrites existing objects — no orphans from replacement.
    const [baseUrl, baseThumbUrl] = await Promise.all([
      storage.upload(mainKey, mainBuffer, 'image/webp'),
      storage.upload(thumbKey, thumbBuffer, 'image/webp'),
    ]);

    // Cache-bust: keys are deterministic, so the public URL is stable
    // across replacements and the browser/CDN would serve a stale copy.
    // Append a version param derived from upload time.
    const cacheBust = Date.now().toString();
    const url = `${baseUrl}?v=${cacheBust}`;
    const thumbnailUrl = `${baseThumbUrl}?v=${cacheBust}`;

    // Persist the versioned public URL in CMS JSONB
    const result = await this.cms.updateField(
      section,
      language,
      fieldPath,
      url,
    );

    // Purge BOTH the CMS JSON response (old field value) and the R2
    // image URLs themselves — Cloudflare caches the binary at the R2
    // public URL too, so an overwritten object would still serve the
    // stale copy without an explicit purge.
    await Promise.all([
      this.purgeCmsContent(),
      this.purgeImageUrls(section, fieldPath),
    ]);

    return {
      success: true,
      url,
      thumbnailUrl,
      version: result.version,
    };
  }

  /**
   * DELETE /api/cms/image
   * Admin — delete an image from R2 and clear its CMS field.
   *
   * Body: { section, fieldPath, language }
   */
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Delete('image')
  async deleteImage(
    @Query('section') section: string,
    @Query('fieldPath') fieldPath: string,
    @Query('language') language: string,
  ) {
    if (!section || !fieldPath || !language) {
      throw new BadRequestException(
        'section, fieldPath and language are required',
      );
    }

    const storage = this.cms.getStorage();

    const mainKey = `cms/${section}/${fieldPath}.webp`;
    const thumbKey = `cms/${section}/${fieldPath}-thumb.webp`;

    // Delete R2 objects FIRST, then clear the DB. If R2 fails the DB
    // still reflects the (still-present) image URL and nothing is
    // half-deleted. R2 delete is idempotent — missing files do not
    // throw — so the main image + thumbnail are removed in parallel.
    await Promise.all([storage.delete(mainKey), storage.delete(thumbKey)]);
    await this.cms.deleteField(section, language, fieldPath);

    // Purge both the CMS JSON response and the R2 image URLs — without
    // the second purge Cloudflare keeps serving the deleted binary.
    await Promise.all([
      this.purgeCmsContent(),
      this.purgeImageUrls(section, fieldPath),
    ]);

    return {
      success: true,
      message: 'Image deleted',
    };
  }
}

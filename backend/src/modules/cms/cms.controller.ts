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
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import sharp from 'sharp';
import { CloudflareCacheService } from '../../core/cloudflare-cache.service.js';
import { CmsService } from './cms.service.js';

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

  private purgeCmsContent(): void {
    const siteUrl = this.config.get<string>('SITE_URL') ?? '';
    if (siteUrl) {
      void this.cloudflareCache.purgeUrls([`${siteUrl}/api/cms/content`]);
    }
  }

  // -------------------------------------------------------------------------
  // Endpoints
  // -------------------------------------------------------------------------

  /**
   * GET /api/cms/content
   * Public — returns all CMS content.
   *
   * Cache-Control: tell Cloudflare to cache for 1 hour (s-maxage) and serve
   * stale while revalidating for up to 24 h.  Browser gets max-age=0 so it
   * always revalidates, but Cloudflare handles the heavy lifting.
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
  @Put('field')
  async updateField(@Body() body: UpdateFieldDto) {
    const { section, language, fieldPath, value } = body;
    const result = await this.cms.updateField(
      section,
      language,
      fieldPath,
      value,
    );

    this.purgeCmsContent();

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
  @Put('section')
  async updateSection(@Body() body: UpdateSectionDto) {
    const { section, language, content } = body;
    const result = await this.cms.updateSection(section, language, content);

    this.purgeCmsContent();

    return {
      success: true,
      message: 'Section updated successfully',
      version: result.version,
      updatedAt: result.updatedAt,
    };
  }

  /**
   * POST /api/cms/initialize
   * Admin — create or reset the CMS document.
   */
  @Post('initialize')
  @HttpCode(200)
  async initialize(@Body() body: InitializeDto) {
    const result = await this.cms.initialize(body.content, body.force);

    if (result.created) {
      this.purgeCmsContent();
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

    this.purgeCmsContent();

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

    this.purgeCmsContent();

    return {
      success: true,
      message: 'Image deleted',
    };
  }
}

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@supabase/supabase-js';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { StorageService } from '../../core/storage.service.js';
import { BlogsService } from './blogs.service.js';
import { BlogTranslationsService } from './blog-translations.service.js';
import type {
  CreateBlogPostData,
  UpdateBlogPostData,
} from './blogs.service.js';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

interface TranslatePostBody {
  targetLang: string;
  sourceLang?: string;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

/**
 * Blog endpoints — public reads + coach-scoped writes.
 *
 * IMPORTANT: Static sub-paths (/my, /upload/*) are declared BEFORE the
 * dynamic /:slug route to prevent NestJS from matching them as slug values.
 */
@Controller('blogs')
export class BlogsController {
  constructor(
    private readonly blogs: BlogsService,
    private readonly storage: StorageService,
    private readonly translations: BlogTranslationsService,
  ) {}

  // ---------------------------------------------------------------------------
  // Coach: image uploads (declared before /:slug to avoid route conflicts)
  // ---------------------------------------------------------------------------

  /**
   * POST /api/blogs/upload/image
   * Coach — upload an inline editor image (TipTap block image).
   * Processing: max 1200px wide, WebP quality 80.
   * R2 key: blogs/editor/{uuid}.webp
   */
  @Post('upload/image')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('coach')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadEditorImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const processed = await sharp(file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const key = `blogs/editor/${uuidv4()}.webp`;
    const url = await this.storage.upload(key, processed, 'image/webp');

    return { success: true, url };
  }

  /**
   * POST /api/blogs/upload/cover
   * Coach — upload a blog post cover image.
   * Processing: max 1920px wide, WebP quality 80.
   * R2 key: blogs/covers/{uuid}.webp
   */
  @Post('upload/cover')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('coach')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadCoverImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const processed = await sharp(file.buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const key = `blogs/covers/${uuidv4()}.webp`;
    const url = await this.storage.upload(key, processed, 'image/webp');

    return { success: true, url };
  }

  // ---------------------------------------------------------------------------
  // Coach: my posts (declared before /:slug)
  // ---------------------------------------------------------------------------

  /**
   * GET /api/blogs/my
   * Coach — returns all posts (including drafts) authored by the current coach.
   * authorId maps to the coach's profile id resolved from the JWT user id.
   */
  @Get('my')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('coach')
  async getMyPosts(@CurrentUser() user: User) {
    // For the blog system, coachId = user.id (Supabase auth id used as authorId).
    // If the project later introduces a separate coaches table lookup, update here.
    const data = await this.blogs.findByCoach(user.id);
    return { success: true, data };
  }

  /**
   * GET /api/blogs/my/:id
   * Coach — returns a single post owned by the current coach (by UUID, not slug).
   */
  @Get('my/:id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('coach')
  async getMyPost(@CurrentUser() user: User, @Param('id') id: string) {
    const data = await this.blogs.findOneByCoach(id, user.id);
    return { success: true, data };
  }

  /**
   * POST /api/blogs
   * Coach — create a new blog post.
   */
  @Post()
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('coach')
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: User, @Body() body: CreateBlogPostData) {
    const data = await this.blogs.create(user.id, body);
    return { success: true, data };
  }

  /**
   * PUT /api/blogs/:id
   * Coach — partially update a post owned by the current coach.
   */
  @Put(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('coach')
  async update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() body: UpdateBlogPostData,
  ) {
    const data = await this.blogs.update(id, user.id, body);
    return { success: true, data };
  }

  /**
   * DELETE /api/blogs/:id
   * Coach — hard-delete a post owned by the current coach.
   */
  @Delete(':id')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('coach')
  @HttpCode(HttpStatus.OK)
  async remove(@CurrentUser() user: User, @Param('id') id: string) {
    await this.blogs.remove(id, user.id);
    return { success: true, data: null };
  }

  // ---------------------------------------------------------------------------
  // Translation endpoints (declared before /:slug to avoid route conflicts)
  // ---------------------------------------------------------------------------

  /**
   * POST /api/blogs/:id/translate
   * Coach — fires background translation for a blog post.
   * Returns 202 immediately; translation runs asynchronously via Ollama.
   * Body: { targetLang: string, sourceLang?: string }
   */
  @Post(':id/translate')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('coach')
  @HttpCode(HttpStatus.ACCEPTED)
  triggerTranslation(@Param('id') id: string, @Body() body: TranslatePostBody) {
    if (!body.targetLang) {
      throw new BadRequestException('targetLang is required');
    }

    // Fire-and-forget — do not await
    void this.translations.translatePost(
      id,
      body.targetLang,
      body.sourceLang ?? 'pl',
    );

    return { success: true, message: 'Translation started' };
  }

  /**
   * GET /api/blogs/:id/translations
   * Coach — returns all stored translations for a post.
   */
  @Get(':id/translations')
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('coach')
  async getTranslations(@Param('id') id: string) {
    const data = await this.translations.getTranslations(id);
    return { success: true, data };
  }

  /**
   * GET /api/blogs/:id/translations/:lang
   * Public — returns a specific language translation for reading.
   */
  @Get(':id/translations/:lang')
  async getTranslation(@Param('id') id: string, @Param('lang') lang: string) {
    const data = await this.translations.getTranslation(id, lang);
    return { success: true, data };
  }

  // ---------------------------------------------------------------------------
  // Public endpoints (declared last to avoid shadowing static paths above)
  // ---------------------------------------------------------------------------

  /**
   * GET /api/blogs
   * Public — returns all published posts ordered by publishedAt DESC.
   */
  @Get()
  async findAll(@Query('lang') lang?: string) {
    const data = await this.blogs.findAllPublished(lang);
    return { success: true, data };
  }

  /**
   * GET /api/blogs/:slug
   * Public — returns a single published post and increments viewCount.
   * Optional ?lang=en|es to get translated content (falls back to PL).
   */
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string, @Query('lang') lang?: string) {
    const data = await this.blogs.findBySlug(slug, lang);
    return { success: true, data };
  }
}

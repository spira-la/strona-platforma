import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
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
import type { CreateBlogPostData, UpdateBlogPostData } from './blogs.service.js';

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
  // Public endpoints (declared last to avoid shadowing static paths above)
  // ---------------------------------------------------------------------------

  /**
   * GET /api/blogs
   * Public — returns all published posts ordered by publishedAt DESC.
   */
  @Get()
  async findAll() {
    const data = await this.blogs.findAllPublished();
    return { success: true, data };
  }

  /**
   * GET /api/blogs/:slug
   * Public — returns a single published post and increments viewCount.
   */
  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    const data = await this.blogs.findBySlug(slug);
    return { success: true, data };
  }
}

import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { StorageService } from '../../core/storage.service.js';
import { EventsService } from './events.service.js';
import {
  CreateEventDto,
  CreateEventRegistrationDto,
  UpdateEventDto,
} from './dto/event.dto.js';

// ---------------------------------------------------------------------------
// Public — /api/events
// ---------------------------------------------------------------------------

@Controller('events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  /**
   * GET /api/events
   * Public — published upcoming events, soonest first, with spots left.
   */
  @Get()
  async findUpcoming() {
    const data = await this.events.findUpcoming();
    return { success: true, data };
  }

  /**
   * POST /api/events/:id/registrations
   * Public — sign up through the e-mail form. Errors carry stable codes in
   * `message` (EVENT_FULL, ALREADY_REGISTERED, REGISTRATION_CLOSED, …).
   */
  @Post(':id/registrations')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: CreateEventRegistrationDto,
  ) {
    const { registration } = await this.events.register(id, dto);
    return { success: true, data: { id: registration.id } };
  }
}

// ---------------------------------------------------------------------------
// Admin — /api/admin/events
// ---------------------------------------------------------------------------

@Controller('admin/events')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles('admin')
export class AdminEventsController {
  constructor(
    private readonly events: EventsService,
    private readonly storage: StorageService,
  ) {}

  /** GET /api/admin/events — all events (drafts too) with sign-up counts. */
  @Get()
  async findAll() {
    const data = await this.events.findAllForAdmin();
    return { success: true, data };
  }

  /**
   * POST /api/admin/events/upload-image
   * Event picture: max 1600px wide, WebP q80 → R2 `events/{uuid}.webp`.
   * Declared before the `:id` routes.
   */
  @Post('upload-image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    const processed = await sharp(file.buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    const url = await this.storage.upload(
      `events/${uuidv4()}.webp`,
      processed,
      'image/webp',
    );
    return { success: true, url };
  }

  /** DELETE /api/admin/events/registrations/:id — remove one sign-up. */
  @Delete('registrations/:registrationId')
  @HttpCode(HttpStatus.OK)
  async removeRegistration(
    @Param('registrationId', new ParseUUIDPipe()) registrationId: string,
  ) {
    await this.events.removeRegistration(registrationId);
    return { success: true, data: null };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateEventDto) {
    const data = await this.events.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEventDto,
  ) {
    const data = await this.events.update(id, dto);
    return { success: true, data };
  }

  /** DELETE /api/admin/events/:id — also removes its sign-ups (cascade). */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.events.remove(id);
    return { success: true, data: null };
  }

  /** GET /api/admin/events/:id/registrations — sign-ups, oldest first. */
  @Get(':id/registrations')
  async findRegistrations(@Param('id', new ParseUUIDPipe()) id: string) {
    const data = await this.events.findRegistrations(id);
    return { success: true, data };
  }
}

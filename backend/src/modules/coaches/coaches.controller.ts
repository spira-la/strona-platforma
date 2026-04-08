import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CoachesService } from './coaches.service.js';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

interface CreateCoachDto {
  fullName: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
  expertise?: string[] | null;
  languages?: string[] | null;
  location?: string | null;
  timezone?: string | null;
  acceptingClients?: boolean;
  yearsExperience?: number | null;
  certifications?: string[] | null;
}

interface UpdateCoachDto {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  bio?: string | null;
  expertise?: string[] | null;
  languages?: string[] | null;
  location?: string | null;
  website?: string | null;
  timezone?: string | null;
  acceptingClients?: boolean | null;
  yearsExperience?: number | null;
  certifications?: string[] | null;
}

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Controller('coaches')
export class CoachesController {
  constructor(private readonly coaches: CoachesService) {}

  /**
   * GET /api/coaches
   * Admin — list all coaches with their profile data (fullName, email joined from profiles).
   */
  @Get()
  async findAll() {
    const data = await this.coaches.findAll();
    return { success: true, data };
  }

  /**
   * GET /api/coaches/:id
   * Admin — get a single coach with profile data.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.coaches.findById(id);
    return { success: true, data };
  }

  /**
   * POST /api/coaches
   * Admin — create a coach record from an existing user.
   * Promotes the user's profile role to COACH if needed.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateCoachDto) {
    const data = await this.coaches.create(body);
    return { success: true, data };
  }

  /**
   * PUT /api/coaches/:id
   * Admin — update coach-specific fields (bio, expertise, etc.).
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateCoachDto) {
    const data = await this.coaches.update(id, body);
    return { success: true, data };
  }

  /**
   * PATCH /api/coaches/:id/archive
   * Admin — soft-delete a coach (isActive=false).
   */
  @Patch(':id/archive')
  async archive(@Param('id') id: string) {
    const data = await this.coaches.archive(id);
    return { success: true, data };
  }

  /**
   * PATCH /api/coaches/:id/restore
   * Admin — restore an archived coach (isActive=true).
   */
  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    const data = await this.coaches.restore(id);
    return { success: true, data };
  }
}

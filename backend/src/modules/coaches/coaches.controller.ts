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
  UseGuards,
} from '@nestjs/common';
import { CoachesService } from './coaches.service.js';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

interface CreateCoachDto {
  fullName: string;
  email: string;
  phone?: string | null;
  bio?: string | null;
  title?: string | null;
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
  title?: string | null;
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
   * GET /api/coaches — public, used by booking flow to resolve default coachId
   */
  @Get()
  async findAll() {
    const data = await this.coaches.findAll();
    return { success: true, data };
  }

  /**
   * GET /api/coaches/:id — public
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.coaches.findById(id);
    return { success: true, data };
  }

  /**
   * POST /api/coaches — admin only
   */
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateCoachDto) {
    const data = await this.coaches.create(body);
    return { success: true, data };
  }

  /**
   * PUT /api/coaches/:id — admin only
   */
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateCoachDto) {
    const data = await this.coaches.update(id, body);
    return { success: true, data };
  }

  /**
   * PATCH /api/coaches/:id/archive — admin only
   */
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/archive')
  async archive(@Param('id') id: string) {
    const data = await this.coaches.archive(id);
    return { success: true, data };
  }

  /**
   * PATCH /api/coaches/:id/restore — admin only
   */
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    const data = await this.coaches.restore(id);
    return { success: true, data };
  }
}

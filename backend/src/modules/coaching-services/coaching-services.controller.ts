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
import { CoachingServicesService } from './coaching-services.service.js';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

interface CreateServiceDto {
  name: string;
  description?: string | null;
  durationMinutes: number;
  sessionCount?: number | null;
  priceCents: number;
  currency?: string | null;
  coachId?: string | null;
  isActive?: boolean;
  sortOrder?: number | null;
}

type UpdateServiceDto = Partial<CreateServiceDto>;

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Controller('services')
export class CoachingServicesController {
  constructor(private readonly services: CoachingServicesService) {}

  /**
   * GET /api/services
   * Public — list all coaching services ordered by sortOrder ASC, createdAt DESC.
   */
  @Get()
  async findAll() {
    const data = await this.services.findAll();
    return { success: true, data };
  }

  /**
   * GET /api/services/:id
   * Public — get a single coaching service by id.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.services.findById(id);
    return { success: true, data };
  }

  /**
   * POST /api/services
   * Admin — create a new coaching service.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateServiceDto) {
    const data = await this.services.create(body);
    return { success: true, data };
  }

  /**
   * PUT /api/services/:id
   * Admin — update an existing coaching service.
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateServiceDto) {
    const data = await this.services.update(id, body);
    return { success: true, data };
  }

  /**
   * PATCH /api/services/:id/archive
   * Admin — soft-delete (set isActive=false) a coaching service.
   */
  @Patch(':id/archive')
  async archive(@Param('id') id: string) {
    const data = await this.services.archive(id);
    return { success: true, data };
  }

  /**
   * PATCH /api/services/:id/restore
   * Admin — restore (set isActive=true) a coaching service.
   */
  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    const data = await this.services.restore(id);
    return { success: true, data };
  }
}

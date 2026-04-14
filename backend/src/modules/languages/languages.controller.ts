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
import { LanguagesService } from './languages.service.js';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

interface CreateLanguageDto {
  code: string;
  name: string;
  nativeName?: string | null;
  flag?: string | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
}

type UpdateLanguageDto = Partial<CreateLanguageDto>;

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Controller('languages')
export class LanguagesController {
  constructor(private readonly languages: LanguagesService) {}

  /**
   * GET /api/languages
   * Public — list all languages ordered by sortOrder ASC.
   */
  @Get()
  async findAll() {
    const data = await this.languages.findAll();
    return { success: true, data };
  }

  /**
   * GET /api/languages/:id
   * Public — get a single language by id.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.languages.findById(id);
    return { success: true, data };
  }

  /**
   * POST /api/languages
   * Admin — create a new language.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateLanguageDto) {
    const data = await this.languages.create(body);
    return { success: true, data };
  }

  /**
   * PUT /api/languages/:id
   * Admin — update an existing language.
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateLanguageDto) {
    const data = await this.languages.update(id, body);
    return { success: true, data };
  }

  /**
   * PATCH /api/languages/:id/archive
   * Admin — soft-delete (set isActive=false) a language.
   */
  @Patch(':id/archive')
  async archive(@Param('id') id: string) {
    const data = await this.languages.archive(id);
    return { success: true, data };
  }

  /**
   * PATCH /api/languages/:id/restore
   * Admin — restore (set isActive=true) a language.
   */
  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    const data = await this.languages.restore(id);
    return { success: true, data };
  }
}

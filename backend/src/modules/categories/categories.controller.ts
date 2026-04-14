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
import { CategoriesService } from './categories.service.js';

// ---------------------------------------------------------------------------
// DTOs
// ---------------------------------------------------------------------------

interface CreateCategoryDto {
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  sortOrder?: number | null;
  isActive?: boolean | null;
}

type UpdateCategoryDto = Partial<CreateCategoryDto>;

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  /**
   * GET /api/categories
   * Public — list all categories ordered by sortOrder ASC, createdAt DESC.
   */
  @Get()
  async findAll() {
    const data = await this.categories.findAll();
    return { success: true, data };
  }

  /**
   * GET /api/categories/:id
   * Public — get a single category by id.
   */
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.categories.findById(id);
    return { success: true, data };
  }

  /**
   * POST /api/categories
   * Admin — create a new category.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: CreateCategoryDto) {
    const data = await this.categories.create(body);
    return { success: true, data };
  }

  /**
   * PUT /api/categories/:id
   * Admin — update an existing category.
   */
  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateCategoryDto) {
    const data = await this.categories.update(id, body);
    return { success: true, data };
  }

  /**
   * PATCH /api/categories/:id/archive
   * Admin — soft-delete (set isActive=false) a category.
   */
  @Patch(':id/archive')
  async archive(@Param('id') id: string) {
    const data = await this.categories.archive(id);
    return { success: true, data };
  }

  /**
   * PATCH /api/categories/:id/restore
   * Admin — restore (set isActive=true) a category.
   */
  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    const data = await this.categories.restore(id);
    return { success: true, data };
  }
}

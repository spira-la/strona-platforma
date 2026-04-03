import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Query,
  HttpCode,
} from '@nestjs/common';
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

// ---------------------------------------------------------------------------
// Controller
// ---------------------------------------------------------------------------

@Controller('cms')
export class CmsController {
  constructor(private readonly cms: CmsService) {}

  /**
   * GET /api/cms/content
   * Public — returns all CMS content.
   * Optional query params: section, language (not implemented yet, returns all).
   */
  @Get('content')
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
    return {
      success: true,
      message: result.created ? 'CMS content initialized' : 'CMS content already exists (use force: true to overwrite)',
      version: result.version,
      created: result.created,
    };
  }
}

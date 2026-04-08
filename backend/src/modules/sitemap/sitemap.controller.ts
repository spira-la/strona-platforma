import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SitemapService } from './sitemap.service.js';

/**
 * Serves /sitemap.xml at the root path, outside the global /api prefix.
 * The global prefix exclusion is configured in main.ts via setGlobalPrefix exclude option.
 */
@ApiExcludeController()
@Controller()
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService) {}

  /**
   * GET /sitemap.xml
   * Returns a valid XML sitemap with static pages and published blog posts.
   * Cached at the CDN level for 1 hour (s-maxage=3600).
   */
  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  @Header('Cache-Control', 'public, s-maxage=3600')
  async getSitemap(): Promise<string> {
    return this.sitemapService.generate();
  }
}

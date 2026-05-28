import { Controller, Get, Header, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PrerenderService } from './prerender.service.js';

/**
 * PrerenderController
 *
 * Serves complete semantic HTML for public pages to SEO crawlers
 * (Googlebot, bingbot, AhrefsBot, etc.).
 *
 * Nginx routes requests from known crawlers to these endpoints
 * instead of the React SPA. Real users always receive the SPA.
 *
 * Routes are excluded from the global "api" prefix in main.ts,
 * so they are accessible at /prerender/* (not /api/prerender/*).
 */
@Controller('prerender')
export class PrerenderController {
  constructor(private readonly prerenderService: PrerenderService) {}

  @Get('home')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=600, s-maxage=3600')
  home(@Res() res: Response): void {
    res.send(this.prerenderService.renderHome());
  }

  @Get('o-mnie')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=600, s-maxage=3600')
  about(@Res() res: Response): void {
    res.send(this.prerenderService.renderAbout());
  }

  @Get('uslugi')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=600, s-maxage=3600')
  services(@Res() res: Response): void {
    res.send(this.prerenderService.renderServices());
  }

  @Get('jak-pracuje')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=600, s-maxage=3600')
  howIWork(@Res() res: Response): void {
    res.send(this.prerenderService.renderHowIWork());
  }

  @Get('kontakt')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=600, s-maxage=3600')
  contact(@Res() res: Response): void {
    res.send(this.prerenderService.renderContact());
  }

  @Get('blog')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=600, s-maxage=3600')
  blog(@Res() res: Response): void {
    res.send(this.prerenderService.renderBlog());
  }
}

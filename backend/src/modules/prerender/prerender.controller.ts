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
  async home(@Res() res: Response): Promise<void> {
    res.send(await this.prerenderService.renderHome());
  }

  @Get('o-mnie')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=600, s-maxage=3600')
  async about(@Res() res: Response): Promise<void> {
    res.send(await this.prerenderService.renderAbout());
  }

  @Get('uslugi')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=600, s-maxage=3600')
  async services(@Res() res: Response): Promise<void> {
    res.send(await this.prerenderService.renderServices());
  }

  @Get('jak-pracuje')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=600, s-maxage=3600')
  async howIWork(@Res() res: Response): Promise<void> {
    res.send(await this.prerenderService.renderHowIWork());
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
  async blog(@Res() res: Response): Promise<void> {
    res.send(await this.prerenderService.renderBlog());
  }

  @Get('mama-nastolatka')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=600, s-maxage=3600')
  async mamaNastolatka(@Res() res: Response): Promise<void> {
    res.send(await this.prerenderService.renderMamaNastolatka());
  }

  @Get('matka-zona-kochanka')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=600, s-maxage=3600')
  async kochanka(@Res() res: Response): Promise<void> {
    res.send(await this.prerenderService.renderKochanka());
  }

  @Get('tworzenie-stron')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=600, s-maxage=3600')
  async webDesignOffer(@Res() res: Response): Promise<void> {
    res.send(await this.prerenderService.renderWebDesignOffer());
  }
}

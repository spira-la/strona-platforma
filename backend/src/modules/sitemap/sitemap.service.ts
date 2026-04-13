import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BlogPostEntity } from '../../db/entities/blog.entity.js';

interface SitemapUrl {
  loc: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
}

@Injectable()
export class SitemapService {
  private readonly logger = new Logger(SitemapService.name);
  private readonly siteUrl: string;

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(BlogPostEntity)
    private readonly blogRepo: Repository<BlogPostEntity>,
  ) {
    this.siteUrl =
      this.config.get<string>('SITE_URL') ?? 'https://spira-la.com';
  }

  private static readonly STATIC_PAGES: SitemapUrl[] = [
    { loc: '/', changefreq: 'daily', priority: '1.0' },
    { loc: '/o-mnie', changefreq: 'monthly', priority: '0.8' },
    { loc: '/jak-pracuje', changefreq: 'monthly', priority: '0.8' },
    { loc: '/uslugi', changefreq: 'weekly', priority: '0.9' },
    { loc: '/blog', changefreq: 'daily', priority: '0.8' },
    { loc: '/kontakt', changefreq: 'monthly', priority: '0.7' },
  ];

  private escapeXml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&apos;');
  }

  private buildUrlElement(entry: SitemapUrl, base: string): string {
    const loc = this.escapeXml(`${base}${entry.loc}`);
    const lastmodLine = entry.lastmod
      ? `\n    <lastmod>${entry.lastmod}</lastmod>`
      : '';

    return (
      `  <url>\n` +
      `    <loc>${loc}</loc>${lastmodLine}\n` +
      `    <changefreq>${entry.changefreq}</changefreq>\n` +
      `    <priority>${entry.priority}</priority>\n` +
      `  </url>`
    );
  }

  async generate(): Promise<string> {
    const base = this.siteUrl.replace(/\/$/, '');

    // Fetch published blog posts
    let blogPosts: BlogPostEntity[] = [];
    try {
      blogPosts = await this.blogRepo.find({
        select: ['slug', 'updatedAt'],
        where: { isPublished: true },
        order: { publishedAt: 'DESC' },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to fetch blog posts for sitemap: ${String(error)}`,
      );
    }

    const staticEntries = SitemapService.STATIC_PAGES.map((page) =>
      this.buildUrlElement(page, base),
    );

    const dynamicEntries = blogPosts.map((post) => {
      const lastmod = post.updatedAt
        ? post.updatedAt.toISOString().split('T')[0]
        : undefined;

      return this.buildUrlElement(
        {
          loc: `/blog/${post.slug}`,
          changefreq: 'weekly',
          priority: '0.6',
          lastmod,
        },
        base,
      );
    });

    const allEntries = [...staticEntries, ...dynamicEntries].join('\n');

    return (
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      `${allEntries}\n` +
      `</urlset>`
    );
  }
}

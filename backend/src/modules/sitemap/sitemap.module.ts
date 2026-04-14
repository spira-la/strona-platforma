import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogPostEntity } from '../../db/entities/blog.entity.js';
import { SitemapService } from './sitemap.service.js';
import { SitemapController } from './sitemap.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([BlogPostEntity])],
  controllers: [SitemapController],
  providers: [SitemapService],
})
export class SitemapModule {}

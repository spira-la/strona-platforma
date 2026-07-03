import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  BlogPostEntity,
  BlogCommentEntity,
} from '../../db/entities/blog.entity.js';
import { BlogPostTranslationEntity } from '../../db/entities/blog-translation.entity.js';
import { CategoryEntity } from '../../db/entities/product.entity.js';
import { ProfileEntity } from '../../db/entities/profile.entity.js';
import { CoachEntity } from '../../db/entities/coach.entity.js';
import { BlogsService } from './blogs.service.js';
import { BlogTranslationsService } from './blog-translations.service.js';
import { BlogsController } from './blogs.controller.js';

@Module({
  imports: [
    // CoreModule is @Global() — StorageService and OpenRouterService are automatically available
    TypeOrmModule.forFeature([
      BlogPostEntity,
      BlogCommentEntity,
      BlogPostTranslationEntity,
      CategoryEntity,
      ProfileEntity,
      CoachEntity,
    ]),
  ],
  controllers: [BlogsController],
  providers: [BlogsService, BlogTranslationsService],
  exports: [BlogsService, BlogTranslationsService],
})
export class BlogsModule {}

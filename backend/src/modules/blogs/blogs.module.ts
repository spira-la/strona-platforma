import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlogPostEntity, BlogCommentEntity } from '../../db/entities/blog.entity.js';
import { BlogsService } from './blogs.service.js';
import { BlogsController } from './blogs.controller.js';

@Module({
  imports: [
    // CoreModule is @Global() — StorageService is automatically available
    TypeOrmModule.forFeature([BlogPostEntity, BlogCommentEntity]),
  ],
  controllers: [BlogsController],
  providers: [BlogsService],
  exports: [BlogsService],
})
export class BlogsModule {}

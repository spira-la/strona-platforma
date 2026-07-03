import { Module } from '@nestjs/common';
import { YouTubeController } from './youtube.controller.js';
import { YouTubeService } from './youtube.service.js';

@Module({
  controllers: [YouTubeController],
  providers: [YouTubeService],
  exports: [YouTubeService],
})
export class YouTubeModule {}

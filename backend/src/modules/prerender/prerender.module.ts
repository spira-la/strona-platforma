import { Module } from '@nestjs/common';
import { PrerenderController } from './prerender.controller.js';
import { PrerenderService } from './prerender.service.js';

@Module({
  controllers: [PrerenderController],
  providers: [PrerenderService],
})
export class PrerenderModule {}

import { Module } from '@nestjs/common';
import { CmsModule } from '../cms/cms.module.js';
import { PrerenderController } from './prerender.controller.js';
import { PrerenderService } from './prerender.service.js';

@Module({
  imports: [CmsModule],
  controllers: [PrerenderController],
  providers: [PrerenderService],
})
export class PrerenderModule {}

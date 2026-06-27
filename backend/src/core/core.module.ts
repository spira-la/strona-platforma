import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service.js';
import { CloudflareCacheService } from './cloudflare-cache.service.js';
import { StorageService } from './storage.service.js';
import { OpenRouterService } from './openrouter.service.js';
import { IcsService } from './ics.service.js';

@Global()
@Module({
  providers: [
    CacheService,
    StorageService,
    CloudflareCacheService,
    OpenRouterService,
    IcsService,
  ],
  exports: [
    CacheService,
    StorageService,
    CloudflareCacheService,
    OpenRouterService,
    IcsService,
  ],
})
export class CoreModule {}

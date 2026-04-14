import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service.js';
import { CloudflareCacheService } from './cloudflare-cache.service.js';
import { StorageService } from './storage.service.js';

@Global()
@Module({
  providers: [CacheService, StorageService, CloudflareCacheService],
  exports: [CacheService, StorageService, CloudflareCacheService],
})
export class CoreModule {}

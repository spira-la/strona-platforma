import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service.js';
import { StorageService } from './storage.service.js';

@Global()
@Module({
  providers: [CacheService, StorageService],
  exports: [CacheService, StorageService],
})
export class CoreModule {}

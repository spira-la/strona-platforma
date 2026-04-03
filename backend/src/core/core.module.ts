import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service.js';
import { CacheService } from './cache.service.js';
import { StorageService } from './storage.service.js';

@Global()
@Module({
  providers: [DatabaseService, CacheService, StorageService],
  exports: [DatabaseService, CacheService, StorageService],
})
export class CoreModule {}

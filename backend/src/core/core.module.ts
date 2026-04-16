import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service.js';
import { CloudflareCacheService } from './cloudflare-cache.service.js';
import { StorageService } from './storage.service.js';
import { OllamaService } from './ollama.service.js';

@Global()
@Module({
  providers: [
    CacheService,
    StorageService,
    CloudflareCacheService,
    OllamaService,
  ],
  exports: [
    CacheService,
    StorageService,
    CloudflareCacheService,
    OllamaService,
  ],
})
export class CoreModule {}

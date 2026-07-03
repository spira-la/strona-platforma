import { SetMetadata } from '@nestjs/common';

export const CACHE_TTL_KEY = 'cacheTtl';

/**
 * Sets the Cache-Control max-age for a route response.
 * Used by CacheControlInterceptor to set Cloudflare CDN headers.
 *
 * @param seconds - TTL in seconds
 *
 * @example
 * @CacheTTL(60)   // Cache for 60 seconds
 * @Get('public-data')
 * getData() { ... }
 */
export const CacheTTL = (seconds: number) =>
  SetMetadata(CACHE_TTL_KEY, seconds);

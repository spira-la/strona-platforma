import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_TTL_KEY } from '../decorators/cache-ttl.decorator.js';

/**
 * Sets Cache-Control response headers based on the @CacheTTL(seconds) decorator.
 *
 * Without @CacheTTL: sets "no-store" so Cloudflare does not cache authenticated
 * or dynamic responses.
 *
 * With @CacheTTL(n): sets "public, max-age=n, s-maxage=n" so Cloudflare CDN
 * caches the response for n seconds.
 */
@Injectable()
export class CacheControlInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      tap(() => {
        const ttl = this.reflector.getAllAndOverride<number | undefined>(
          CACHE_TTL_KEY,
          [context.getHandler(), context.getClass()],
        );

        const response = context.switchToHttp().getResponse<Response>();

        if (ttl !== undefined && ttl > 0) {
          response.setHeader(
            'Cache-Control',
            `public, max-age=${ttl}, s-maxage=${ttl}`,
          );
        } else {
          response.setHeader('Cache-Control', 'no-store');
        }
      }),
    );
  }
}

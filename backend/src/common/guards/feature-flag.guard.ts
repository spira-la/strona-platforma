import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { FEATURE_FLAG_KEY } from '../decorators/feature-flag.decorator.js';
import { CacheService } from '../../core/cache.service.js';
import { FeatureFlagEntity } from '../../db/entities/feature-flag.entity.js';

const FLAG_CACHE_TTL_MS = 60 * 1000; // 1 minute
const CACHE_PREFIX = 'feature_flag:';

/**
 * Returns 404 when a feature flag is disabled so dormant features appear
 * non-existent to clients (not just forbidden).
 */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly cache: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const flagKey = this.reflector.getAllAndOverride<string>(FEATURE_FLAG_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @FeatureFlag() decorator — allow access
    if (!flagKey) {
      return true;
    }

    const enabled = await this.isEnabled(flagKey);

    if (!enabled) {
      throw new NotFoundException(`Route not found`);
    }

    return true;
  }

  private async isEnabled(flagKey: string): Promise<boolean> {
    const cacheKey = `${CACHE_PREFIX}${flagKey}`;
    const cached = this.cache.get<boolean>(cacheKey);

    if (cached !== undefined) {
      return cached;
    }

    const flag = await this.dataSource
      .getRepository(FeatureFlagEntity)
      .findOne({ where: { key: flagKey }, select: { enabled: true } });

    // If the flag row doesn't exist in the DB, treat as disabled
    const enabled = flag?.enabled ?? false;

    this.cache.set(cacheKey, enabled, FLAG_CACHE_TTL_MS);

    return enabled;
  }
}

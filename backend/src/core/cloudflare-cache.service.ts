import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudflareCacheService {
  private readonly logger = new Logger(CloudflareCacheService.name);
  private readonly zoneId: string;
  private readonly apiToken: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.zoneId = this.config.get<string>('CLOUDFLARE_ZONE_ID') ?? '';
    this.apiToken = this.config.get<string>('CLOUDFLARE_API_TOKEN') ?? '';
    this.enabled = !!(this.zoneId && this.apiToken);

    if (!this.enabled) {
      this.logger.warn(
        'Cloudflare cache purge disabled — CLOUDFLARE_ZONE_ID or CLOUDFLARE_API_TOKEN not set',
      );
    }
  }

  /**
   * Purge specific URLs from Cloudflare cache.
   */
  async purgeUrls(urls: string[]): Promise<void> {
    if (!this.enabled || urls.length === 0) return;

    try {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/purge_cache`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ files: urls }),
        },
      );

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`Cloudflare purge failed: ${res.status} ${body}`);
      } else {
        this.logger.log(`Cloudflare cache purged: ${urls.join(', ')}`);
      }
    } catch (err) {
      this.logger.error('Cloudflare purge error', err);
    }
  }

  /**
   * Purge all cached content (nuclear option — use sparingly).
   */
  async purgeAll(): Promise<void> {
    if (!this.enabled) return;

    try {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/purge_cache`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ purge_everything: true }),
        },
      );

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`Cloudflare purge_all failed: ${res.status} ${body}`);
      } else {
        this.logger.log('Cloudflare cache fully purged');
      }
    } catch (err) {
      this.logger.error('Cloudflare purge_all error', err);
    }
  }
}

import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class CacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private hits = 0;
  private misses = 0;

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.misses++;
      return undefined;
    }

    this.hits++;
    return entry.value;
  }

  set<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  deleteByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Remove all expired entries. Call this periodically if the cache
   * is expected to grow large (e.g. via a scheduled task).
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
        removed++;
      }
    }

    return removed;
  }

  getStats(): CacheStats {
    return {
      size: this.store.size,
      hits: this.hits,
      misses: this.misses,
    };
  }
}

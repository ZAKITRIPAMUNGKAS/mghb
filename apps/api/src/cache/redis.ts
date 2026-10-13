import { Redis } from 'ioredis';

class CacheService {
  private redis: Redis | null = null;
  private memoryCache = new Map<string, { value: any; expiry: number }>();
  private isConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      this.redis = new Redis(redisUrl, {
        connectTimeout: 1500,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
        enableOfflineQueue: false
      });
      this.redis.on('error', () => {
        this.isConnected = false;
      });

      this.redis.connect().then(() => {
        this.isConnected = true;
        console.log('[Cache] Connected to Redis.');
      }).catch(() => {
        this.isConnected = false;
      });
    } catch {
      this.isConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isConnected && this.redis) {
      try {
        const val = await this.redis.get(key);
        return val ? JSON.parse(val) : null;
      } catch {
        // Fallback to memory
      }
    }

    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value as T;
  }

  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    const serialized = JSON.stringify(value);
    if (this.isConnected && this.redis) {
      try {
        await this.redis.setex(key, ttlSeconds, serialized);
        return;
      } catch {
        // Fallback to memory
      }
    }

    this.memoryCache.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  }
}

export const cache = new CacheService();

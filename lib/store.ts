import { Redis } from "@upstash/redis";

/**
 * Tiny key/value contract the game needs. Dev uses process memory, prod uses
 * Upstash Redis (free tier, works from Vercel serverless over HTTP).
 */
export interface Store {
  get<T>(key: string): Promise<T | null>;
  mget<T>(keys: string[]): Promise<(T | null)[]>;
  set(key: string, value: unknown, ttlSec: number): Promise<void>;
  /** set only if absent; true when written */
  setNX(key: string, value: unknown, ttlSec: number): Promise<boolean>;
  del(...keys: string[]): Promise<void>;
}

class MemoryStore implements Store {
  private data = new Map<string, { v: string; exp: number }>();

  private read<T>(key: string): T | null {
    const hit = this.data.get(key);
    if (!hit) return null;
    if (hit.exp < Date.now()) {
      this.data.delete(key);
      return null;
    }
    return JSON.parse(hit.v) as T;
  }

  async get<T>(key: string) {
    return this.read<T>(key);
  }

  async mget<T>(keys: string[]) {
    return keys.map((k) => this.read<T>(k));
  }

  async set(key: string, value: unknown, ttlSec: number) {
    this.data.set(key, { v: JSON.stringify(value), exp: Date.now() + ttlSec * 1000 });
  }

  async setNX(key: string, value: unknown, ttlSec: number) {
    if (this.read(key) !== null) return false;
    await this.set(key, value, ttlSec);
    return true;
  }

  async del(...keys: string[]) {
    keys.forEach((k) => this.data.delete(k));
  }
}

class RedisStore implements Store {
  constructor(private redis: Redis) {}

  async get<T>(key: string) {
    return this.redis.get<T>(key);
  }

  async mget<T>(keys: string[]) {
    return this.redis.mget<(T | null)[]>(...keys);
  }

  async set(key: string, value: unknown, ttlSec: number) {
    await this.redis.set(key, value, { ex: ttlSec });
  }

  async setNX(key: string, value: unknown, ttlSec: number) {
    return (await this.redis.set(key, value, { ex: ttlSec, nx: true })) === "OK";
  }

  async del(...keys: string[]) {
    if (keys.length) await this.redis.del(...keys);
  }
}

function create(): Store {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) return new RedisStore(new Redis({ url, token }));
  return new MemoryStore();
}

// survive dev HMR / per-route module duplication
const g = globalThis as unknown as { __invicemStore?: Store };
export const store: Store = (g.__invicemStore ??= create());

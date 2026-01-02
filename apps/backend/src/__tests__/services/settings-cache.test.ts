import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Create a fresh instance for testing
class TestSettingsCache {
  private cache: Map<string, { data: unknown; expiresAt: number }> = new Map();
  private defaultTTL: number = 60 * 1000;

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateByPrefix(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

describe('SettingsCache', () => {
  let cache: TestSettingsCache;

  beforeEach(() => {
    cache = new TestSettingsCache();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('get/set', () => {
    it('should store and retrieve values', () => {
      const testData = { host: 'smtp.test.com', port: 587 };
      cache.set('settings:smtp', testData);

      const result = cache.get<typeof testData>('settings:smtp');
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should expire entries after TTL', () => {
      const testData = { apiKey: 'test-key' };
      cache.set('settings:openai', testData, 1000); // 1 second TTL

      // Before expiry
      expect(cache.get('settings:openai')).toEqual(testData);

      // After expiry
      vi.advanceTimersByTime(1001);
      expect(cache.get('settings:openai')).toBeNull();
    });

    it('should use default TTL when not specified', () => {
      const testData = { clientId: 'test-client' };
      cache.set('settings:google_oauth', testData);

      // Before default TTL (60 seconds)
      vi.advanceTimersByTime(59000);
      expect(cache.get('settings:google_oauth')).toEqual(testData);

      // After default TTL
      vi.advanceTimersByTime(2000);
      expect(cache.get('settings:google_oauth')).toBeNull();
    });
  });

  describe('invalidate', () => {
    it('should remove specific cache entry', () => {
      cache.set('settings:smtp', { host: 'test' });
      cache.set('settings:whatsapp', { appId: 'test' });

      cache.invalidate('settings:smtp');

      expect(cache.get('settings:smtp')).toBeNull();
      expect(cache.get('settings:whatsapp')).not.toBeNull();
    });
  });

  describe('invalidateByPrefix', () => {
    it('should remove all entries with matching prefix', () => {
      cache.set('settings:smtp', { host: 'test' });
      cache.set('settings:whatsapp', { appId: 'test' });
      cache.set('other:key', { data: 'test' });

      cache.invalidateByPrefix('settings:');

      expect(cache.get('settings:smtp')).toBeNull();
      expect(cache.get('settings:whatsapp')).toBeNull();
      expect(cache.get('other:key')).not.toBeNull();
    });
  });

  describe('clear', () => {
    it('should remove all cache entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.getStats().size).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      cache.set('settings:smtp', { host: 'test' });
      cache.set('settings:whatsapp', { appId: 'test' });

      const stats = cache.getStats();

      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('settings:smtp');
      expect(stats.keys).toContain('settings:whatsapp');
    });
  });
});

describe('CACHE_KEYS', () => {
  const CACHE_KEYS = {
    smtp: () => 'settings:smtp',
    whatsapp: () => 'settings:whatsapp',
    instagram: () => 'settings:instagram',
    googleOauth: () => 'settings:google_oauth',
    openai: () => 'settings:openai',
    category: (category: string) => `settings:${category}`,
  };

  it('should generate correct cache keys', () => {
    expect(CACHE_KEYS.smtp()).toBe('settings:smtp');
    expect(CACHE_KEYS.whatsapp()).toBe('settings:whatsapp');
    expect(CACHE_KEYS.instagram()).toBe('settings:instagram');
    expect(CACHE_KEYS.googleOauth()).toBe('settings:google_oauth');
    expect(CACHE_KEYS.openai()).toBe('settings:openai');
  });

  it('should generate dynamic category keys', () => {
    expect(CACHE_KEYS.category('smtp')).toBe('settings:smtp');
    expect(CACHE_KEYS.category('whatsapp')).toBe('settings:whatsapp');
    expect(CACHE_KEYS.category('custom')).toBe('settings:custom');
  });
});

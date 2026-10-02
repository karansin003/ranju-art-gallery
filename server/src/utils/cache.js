/**
 * Lightweight in-memory TTL cache for public read-only database queries.
 * Eliminates repetitive remote Supabase round-trips for static/slow-changing data.
 */
class MemoryCache {
  constructor(defaultTtlMs = 60000) {
    this.store = new Map();
    this.defaultTtl = defaultTtlMs;
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key, data, ttlMs = this.defaultTtl) {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  del(key) {
    this.store.delete(key);
  }

  delPrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear() {
    this.store.clear();
  }
}

module.exports = new MemoryCache();

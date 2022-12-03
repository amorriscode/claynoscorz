import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL ?? null

export default class Cache {
  isRedisCache
  cache

  constructor() {
    this.isRedisCache = !!REDIS_URL
    this.cache = REDIS_URL ? new Redis(REDIS_URL) : new Map()
  }

  async get(key: string) {
    return this.isRedisCache ? await this.cache.get(key) : this.cache.get(key)
  }

  async set(key: string, data: string | number) {
    return this.isRedisCache
      ? await this.cache.set(key, data)
      : this.cache.set(key, data)
  }
}

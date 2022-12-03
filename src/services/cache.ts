import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL ?? null

export default class Cache {
  cache

  constructor() {
    this.cache = REDIS_URL ? new Redis(REDIS_URL) : new Map()
  }

  async get(key: string) {
    return await this.cache.get(key)
  }

  async set(key: string, data: string | number) {
    return await this.cache.set(key, data)
  }

  async delete(key: string) {
    return this.cache instanceof Redis
      ? await this.cache.del(key)
      : this.cache.delete(key)
  }
}

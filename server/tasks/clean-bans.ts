import { isBanExpired } from '../middleware/rate-limit'

export default defineTask({
  meta: {
    name: 'cleanBans',
    description: 'Clean expired bans',
  },
  async run() {
    const rateLimitStorage = useStorage('rate-limit')

    const keys = await rateLimitStorage.getKeys()
    for (const key of keys) {
      const rateLimit = (await rateLimitStorage.getItem(key)) as any
      if (rateLimit && isBanExpired(rateLimit))
        await rateLimitStorage.removeItem(key)
    }
    return { result: keys }
  },
})

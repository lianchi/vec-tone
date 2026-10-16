interface RateLimit {
  count: number
  time: number
}

export function isBanExpired(req: RateLimit) {
  const config = useRuntimeConfig().public.rateLimit
  return (Date.now() - req.time) / 1000 > config.ban
}

function getRemainingTime(req: RateLimit) {
  const config = useRuntimeConfig().public.rateLimit
  const remainingSeconds = Math.max(1, Math.floor(config.ban - (Date.now() - req.time) / 1000))
  if (remainingSeconds < 60)
    return `${remainingSeconds}秒`
  return `${Math.floor(remainingSeconds / 60)}分钟`
}

export default defineEventHandler(async (event) => {
  // 仅对 API 接口限流，不拦截静态资源或页面导航
  if (!event.path.startsWith('/api/'))
    return

  const rateLimitStorage = useStorage('rate-limit')
  const requestIP = getRequestIP(event, { xForwardedFor: true }) || 'unknown-ip'
  const config = useRuntimeConfig().public.rateLimit
  const now = Date.now()

  const itemKey = `ip:${requestIP}`
  const existing = (await rateLimitStorage.getItem(itemKey)) as RateLimit | null

  if (!existing) {
    await rateLimitStorage.setItem(itemKey, {
      count: 1,
      time: now,
    })
    return
  }

  // 1. 如果时间窗口已过期（超过 duration 秒），重置计数与时间戳
  if ((now - existing.time) / 1000 >= config.duration) {
    await rateLimitStorage.setItem(itemKey, {
      count: 1,
      time: now,
    })
    return
  }

  // 2. 累加请求数
  existing.count++

  // 3. 在允许的阈值内，更新存储并放行
  if (existing.count <= config.max) {
    await rateLimitStorage.setItem(itemKey, existing)
    return
  }

  // 4. 超限：如果封禁已过期，重置为新周期
  if (isBanExpired(existing)) {
    await rateLimitStorage.setItem(itemKey, {
      count: 1,
      time: now,
    })
    return
  }

  // 5. 仍处于封禁中，更新并拦截
  await rateLimitStorage.setItem(itemKey, existing)

  if (config.retryAfterHeader) {
    const remainingSeconds = Math.max(1, Math.floor(config.ban - (now - existing.time) / 1000))
    event.node.res.setHeader('Retry-After', remainingSeconds)
  }

  throw createError({
    statusCode: 429,
    message: `请求太频繁，请 ${getRemainingTime(existing)} 后再试`,
  })
})

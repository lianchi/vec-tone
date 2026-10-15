interface RateLimit {
  count: number
  time: number
}

function isRateLimited(req: RateLimit) {
  const config = useRuntimeConfig().public.rateLimit
  if (req.count <= config.max)
    return false

  return (Date.now() - req.time) / 1000 < config.duration
}

export function isBanExpired(req: RateLimit) {
  const config = useRuntimeConfig().public.rateLimit
  return (Date.now() - req.time) / 1000 > config.ban
}

function getRemainingTime(req: RateLimit) {
  const config = useRuntimeConfig().public.rateLimit
  const remainingSeconds = Math.floor(config.ban - (Date.now() - req.time) / 1000)
  if (remainingSeconds < 60)
    return `${remainingSeconds}秒`
  return `${Math.floor(remainingSeconds / 60)}分钟`
}

export default defineEventHandler(async (event) => {
  // Only rate-limit API routes, do not limit static assets or page navigation
  if (!event.path.startsWith('/api/'))
    return

  const rateLimitStorage = useStorage('rate-limit')
  const requestIP = getRequestIP(event, { xForwardedFor: true }) || 'unKnownIP'
  const config = useRuntimeConfig().public.rateLimit

  if (!(await rateLimitStorage.hasItem(`ip:${requestIP}`))) {
    return await rateLimitStorage.setItem(`ip:${requestIP}`, {
      count: 1,
      time: Date.now(),
    })
  }

  const req = (await rateLimitStorage.getItem(`ip:${requestIP}`)) as RateLimit
  req.count++

  if (!isRateLimited(req)) {
    return await rateLimitStorage.setItem(`ip:${requestIP}`, {
      count: req.count,
      time: req.time,
    })
  }

  if (isBanExpired(req)) {
    return await rateLimitStorage.setItem(`ip:${requestIP}`, {
      count: 1,
      time: Date.now(),
    })
  }

  rateLimitStorage.setItem(`ip:${requestIP}`, {
    count: req.count,
    time: req.time,
  })

  if (config.retryAfterHeader) {
    const remainingSeconds = Math.max(1, Math.floor(config.ban - (Date.now() - req.time) / 1000))
    event.node.res.setHeader('Retry-After', remainingSeconds)
  }

  throw createError({
    statusCode: 429,
    message: `请求太频繁，请 ${getRemainingTime(req)} 后再试`,
  })
})


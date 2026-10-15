export default defineNuxtConfig({
  modules: [
    '@vueuse/nuxt',
    '@unocss/nuxt',
    '@nuxtjs/color-mode',
    'nuxt-gtag',
  ],

  gtag: {
    enabled: process.env.NODE_ENV === 'production',
    id: 'G-W98LL03BZC',
  },

  runtimeConfig: {
    public: {
      title: 'vec-tone | 文本与诗词向量化音乐生成器',
      author: 'vec-tone',
      description: '基于语义向量与传统乐理的文本/古诗词音乐生成器，将文字化为优美旋律与乐谱',
      image: '/favicon.svg',
      siteUrl: 'https://vec-tone.vercel.app',
      allowedOrigin: ['localhost:3000'],
      rateLimit: {
        max: 20, // maximum requests per duration time
        duration: 60, // duration time in seconds, 1 minute
        ban: 60 * 1, // ban time in seconds, 1 minute
        retryAfterHeader: false,
      },
    },
  },

  ssr: false,

  experimental: {
    payloadExtraction: false,
    renderJsonPayloads: true,
    typedPages: true,
  },

  nitro: {
    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      '*/15 * * * *': ['clean-bans'], // clean the rate limit storage every 15 minutes
    },
    storage: {
      'rate-limit': {
        driver: 'memory',
      },
    },
    routeRules: {
      '/*': {
        cors: true,
      },
    },
  },

  spaLoadingTemplate: false,

  vite: {
    server: {
      cors: true,
    },
    build: {
      chunkSizeWarningLimit: 1200,
    },
  },

  imports: {
    dirs: [],
  },

  compatibilityDate: '2024-11-15',
})

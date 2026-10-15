import { defineNuxtModule } from 'nuxt/kit'
import { version } from '../package.json'

export default defineNuxtModule({
  async setup(_, nuxt) {
    nuxt.options.runtimeConfig.public.version = version
    nuxt.options.runtimeConfig.public.buildTime = +new Date()
  },
})

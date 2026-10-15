<template>
  <NuxtPage />
</template>

<script setup lang="ts">
import '@unocss/reset/tailwind.css'
import './assets/styles.css'

const config = useRuntimeConfig()
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover' },
    { name: 'format-detection', content: 'telephone=no' },
    { name: 'mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'apple-touch-icon', href: '/favicon.svg' },
  ],
})

useSeoMeta({
  title: config.public.title,
  ogTitle: config.public.title,
  description: config.public.description,
  ogDescription: config.public.description,
  author: config.public.author,
  ogImage: config.public.image,
  ogUrl: config.public.siteUrl,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: config.public.title,
  twitterDescription: config.public.description,
})
</script>


<template>
  <div class="flex justify-center px4 pb12 pt6 lg:px10 min-h-screen bg-base color-base font-sans transition-colors">
    <div class="relative w-full max-w-2xl flex flex-col gap-5">
      <!-- 顶部 Header -->
      <header class="flex flex-col items-center gap-2 pt-2 text-center">
        <div class="flex items-center gap-2.5">
          <img class="h-8" src="/favicon.svg">
          <h1 class="text-2xl font-bold tracking-tight">
            vec-tone
          </h1>
        </div>
        <p class="text-sm color-fade max-w-xs sm:max-w-md">
          将自然语言与诗词向量化为动听乐谱 · 语意成律，音画共鸣
        </p>
      </header>

      <!-- 主生成器组件 -->
      <main class="w-full">
        <Generator />
      </main>

      <div class="my-2 mx-auto h-1px w-16 border-t border-base" />

      <!-- 底部 Footer -->
      <footer class="flex items-center justify-between text-sm color-fade px-1">
        <div class="flex items-center gap-2">
          <span>&copy; {{ new Date().getFullYear() }} vec-tone</span>
          <span>·</span>
          <span>Vector to Music</span>
        </div>
        <div class="flex items-center gap-3">
          <button
            class="p-1.5 rounded hover:bg-secondary transition op70 hover:op100"
            :title="isDark ? '切换至亮色模式' : '切换至暗色模式'"
            @click="toggleDark()"
          >
            <div :class="isDark ? 'i-carbon:moon' : 'i-carbon:sun'" class="text-base" />
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isDark, toggleDark } from '~/logic/state'
</script>

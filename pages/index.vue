<template>
  <div class="min-h-screen flex justify-center bg-base px-4 pb-28 pt-4 color-base font-sans lg:px-8 lg:pb-12 sm:pt-6">
    <div class="relative max-w-5xl w-full flex flex-col gap-5">
      <!-- 顶部 Header: 简约横排，不挤占首屏空间 -->
      <header class="flex items-center justify-between">
        <div class="flex items-center gap-5">
          <img class="h-8" src="/logo.svg" alt="vec-tone">
          <span class="hidden text-sm color-fade sm:inline">
            将自然语言与诗词向量化为动听乐谱 — 语意成律，音画共鸣
          </span>
        </div>
        <div class="flex items-center gap-1">
          <button
            class="cursor-pointer rounded-lg p-1.5 op50 hover:bg-active hover:op100"
            :title="isDark ? '切换至亮色模式' : '切换至暗色模式'"
            @click="toggleDark()"
          >
            <div :class="isDark ? 'i-carbon:moon' : 'i-carbon:sun'" class="text-base" />
          </button>
          <a
            href="https://github.com/lianchi/vec-tone"
            target="_blank"
            rel="noopener noreferrer"
            class="flex cursor-pointer items-center justify-center rounded-lg p-1.5 color-base op50 hover:bg-active hover:op100"
            title="GitHub 仓库"
          >
            <div class="i-carbon:logo-github text-base" />
          </a>
        </div>
      </header>

      <!-- 主生成器组件 -->
      <main class="w-full">
        <Generator />
      </main>

      <!-- 底部 Footer -->
      <footer class="flex items-center justify-center border-t border-base pt-4 text-sm color-fade">
        <span>lianchi &copy; {{ new Date().getFullYear() }}</span>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isDark, toggleDark } from '~/logic/state'
</script>

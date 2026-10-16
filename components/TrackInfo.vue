<template>
  <div class="flex flex-col gap-2">
    <!-- 顶部歌曲元信息 -->
    <div class="flex flex-wrap items-center gap-2">
      <h2 class="flex items-center gap-2 text-lg font-bold font-serif sm:text-xl">
        <span>{{ composition.title }}</span>
      </h2>
      <span v-if="composition.author" class="text-xs color-fade font-serif sm:text-sm">
        • {{ composition.author }}
      </span>
      <!-- 播放中实时跳动波形微动效 -->
      <span v-if="musicPlayer.state.isPlaying" class="h-3.5 flex items-end gap-0.5 text-primary" title="正在播放">
        <span class="h-1.5 w-0.8 animate-pulse rounded-full bg-primary sm:h-2" />
        <span class="h-3 w-0.8 animate-pulse rounded-full bg-primary sm:h-3.5" style="animation-delay: 150ms;" />
        <span class="h-2 w-0.8 animate-pulse rounded-full bg-primary sm:h-2.5" style="animation-delay: 300ms;" />
      </span>
      <!-- 音乐流派与速度 -->
      <div class="ml-auto flex items-center gap-1.5">
        <span class="border border-primary/20 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary font-medium sm:px-2.5">
          {{ composition.categoryName }}
        </span>
        <span class="rounded-full bg-secondary px-2 py-0.5 text-xs color-fade font-mono sm:px-2.5">
          {{ composition.bpm }} BPM
        </span>
      </div>
    </div>

    <!-- 意境与调式说明 -->
    <p class="flex flex-wrap items-center gap-1 text-xs color-fade">
      <span>{{ composition.vibeDescription }}</span>
      <span>•</span>
      <span>{{ composition.scale }}</span>
    </p>

    <!-- AI 意境诠释 -->
    <details v-if="composition.romanticVectorConcept" class="group cursor-pointer text-xs color-fade">
      <summary class="flex select-none list-none items-center gap-1.5 py-0.5 hover:text-primary">
        <span class="font-medium">AI 意境与乐理诠释</span>
        <div class="i-ph:caret-down text-xs group-open:rotate-180" />
      </summary>
      <p class="mt-2 border border-base rounded-xl bg-base p-2.5 text-xs color-base op85 sm:p-3">
        {{ composition.romanticVectorConcept }}
      </p>
    </details>
  </div>
</template>

<script setup lang="ts">
import type { CompositionResult } from '~/logic/composer'
import { musicPlayer } from '~/logic/player'

defineProps<{
  composition: CompositionResult
}>()
</script>

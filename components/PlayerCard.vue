<template>
  <div class="border border-base rounded-2xl p-5 bg-ink shadow-sm flex flex-col gap-4 transition-colors">
    <!-- 顶部歌曲元信息 -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-base pb-3.5">
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center gap-2 flex-wrap">
          <h2 class="font-bold text-xl font-serif">
            {{ composition.title }}
          </h2>
          <span v-if="composition.author" class="text-sm color-fade font-serif">
            · {{ composition.author }}
          </span>
          <!-- 音乐流派标记 -->
          <span class="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
            {{ composition.categoryName }}
          </span>
        </div>
        <p class="text-xs color-fade flex items-center gap-2 flex-wrap">
          <span>{{ composition.vibeDescription }}</span>
          <span class="op40">·</span>
          <span class="op85">{{ composition.scale }}</span>
        </p>
      </div>

      <div class="flex items-center gap-2">
        <span class="px-3 py-1 rounded-full bg-secondary text-xs color-fade tracking-wide">
          {{ composition.bpm }} BPM
        </span>
      </div>
    </div>

    <!-- 语意成律 · 浪漫向量化艺术解读透镜 -->
    <div v-if="composition.romanticVectorConcept" class="p-3.5 rounded-xl bg-primary/5 border border-primary/15 flex flex-col gap-1.5 transition-colors">
      <div class="flex items-center gap-1.5 text-xs text-primary font-semibold">
        <div class="i-ph:sparkle-bold text-sm" />
        <span>语意成律 · 浪漫向量艺术映射</span>
      </div>
      <p class="text-xs color-base leading-relaxed op85 font-serif">
        {{ composition.romanticVectorConcept }}
      </p>
    </div>

    <!-- 播放控制与可拖拽进度条：严格保持单行不换行 -->
    <div class="p-3.5 rounded-xl bg-secondary/50 flex items-center gap-3 w-full flex-nowrap">
      <!-- 播放/暂停大按键 -->
      <button
        class="w-12 h-12 rounded-full bg-primary text-white flex-center shadow-md hover:scale-105 active:scale-95 transition flex-shrink-0 cursor-pointer"
        :title="musicPlayer.state.isPlaying ? '暂停' : '播放'"
        @click="togglePlay"
      >
        <div :class="musicPlayer.state.isPlaying ? 'i-ph:pause-fill' : 'i-ph:play-fill'" class="text-2xl" />
      </button>

      <!-- 当前时间 -->
      <span class="text-sm tabular-nums color-fade flex-shrink-0 whitespace-nowrap select-none min-w-11 text-right">
        {{ formatTime(musicPlayer.state.currentTime) }}
      </span>

      <!-- 可拖拉进度条 (与音频时间轴、乐谱唱词实时对齐，绝不换行) -->
      <div class="flex-1 min-w-24 flex items-center">
        <input
          type="range"
          min="0"
          :max="composition.durationTotal || 10"
          step="0.1"
          :value="musicPlayer.state.currentTime"
          class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
          @input="onSeekInput"
        >
      </div>

      <!-- 总时长 -->
      <span class="text-sm tabular-nums color-fade flex-shrink-0 whitespace-nowrap select-none min-w-11">
        {{ formatTime(composition.durationTotal) }}
      </span>

      <!-- 下载 MIDI 文件按钮 -->
      <button
        class="text-button text-sm py-1.5 px-3 rounded-lg flex-shrink-0 whitespace-nowrap flex items-center gap-1 cursor-pointer"
        title="下载标准多轨 MIDI 文件，可在宿主编曲软件二次创作"
        @click="downloadMidi"
      >
        <div class="i-ph:download-simple text-primary text-base" />
        <span class="hidden sm:inline">下载 MIDI</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CompositionResult } from '~/logic/composer'
import { musicPlayer } from '~/logic/player'

const props = defineProps<{
  composition: CompositionResult
}>()

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

async function togglePlay() {
  await musicPlayer.togglePlay(props.composition)
}

function onSeekInput(e: Event) {
  const val = Number((e.target as HTMLInputElement).value)
  musicPlayer.seek(val)
}

function downloadMidi() {
  if (!props.composition.midiBase64)
    return

  const byteCharacters = atob(props.composition.midiBase64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  const blob = new Blob([byteArray], { type: 'audio/midi' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = props.composition.midiFileName
  a.click()
  URL.revokeObjectURL(url)
}
</script>

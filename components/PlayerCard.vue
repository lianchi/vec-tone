<template>
  <!-- 移动端吸底紧凑播放器模式 -->
  <div v-if="compact" class="mx-auto max-w-xl w-full flex flex-col gap-1.5">
    <div class="flex items-center justify-between text-xs">
      <div class="flex items-center gap-1.5 overflow-hidden pr-2">
        <span class="truncate text-sm font-bold font-serif">{{ composition.title }}</span>
        <span v-if="composition.author" class="truncate text-xs color-fade">• {{ composition.author }}</span>
        <span class="whitespace-nowrap rounded bg-primary/10 px-1.5 py-0.2 text-[10px] text-primary">{{ composition.categoryName }}</span>
      </div>
      <div class="flex flex-shrink-0 items-center gap-2">
        <span class="text-[11px] color-fade font-mono">{{ composition.bpm }} BPM</span>
        <button
          class="flex text-button cursor-pointer items-center gap-1 rounded px-2 py-0.5 text-[11px] hover:border-primary"
          :title="isExporting ? '正在导出音频...' : '下载音频 (WAV)'"
          :disabled="isExporting"
          @click="downloadAudio"
        >
          <div :class="isExporting ? 'i-ph:spinner-gap animate-spin' : 'i-ph:download-simple'" class="text-xs text-primary" />
          <span>{{ isExporting ? '导出中' : '下载音频' }}</span>
        </button>
      </div>
    </div>
    <div class="w-full flex items-center gap-2.5">
      <button
        class="h-9 w-9 flex-center flex-shrink-0 cursor-pointer rounded-full bg-primary text-white shadow hover:opacity-90"
        :title="musicPlayer.state.isPlaying ? '暂停' : '播放'"
        @click="togglePlay"
      >
        <div :class="musicPlayer.state.isPlaying ? 'i-ph:pause-fill' : 'i-ph:play-fill'" class="text-lg" />
      </button>
      <span class="min-w-8 flex-shrink-0 text-right text-xs color-fade font-mono tabular-nums">
        {{ formatTime(musicPlayer.state.currentTime) }}
      </span>
      <div class="min-w-16 flex flex-1 items-center">
        <input
          type="range"
          min="0"
          :max="composition.durationTotal || 10"
          step="0.1"
          :value="musicPlayer.state.currentTime"
          class="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-primary dark:bg-gray-700 focus:outline-none"
          @input="onSeekInput"
        >
      </div>
      <span class="min-w-8 flex-shrink-0 text-xs color-fade font-mono tabular-nums">
        {{ formatTime(composition.durationTotal) }}
      </span>
    </div>
  </div>

  <!-- PC 桌面完整卡片 (放在左侧输入卡片下方) -->
  <div v-else class="flex flex-col gap-3.5 border border-base rounded-2xl bg-ink p-4 sm:p-5">
    <!-- 歌曲元信息与 AI 意境诠释（复用 TrackInfo，保持多端一致） -->
    <TrackInfo :composition="composition" />

    <!-- 播放控制与可拖拽进度条 -->
    <div class="w-full flex items-center gap-2.5 rounded-xl bg-base p-3 sm:gap-3">
      <button
        class="h-11 w-11 flex-center flex-shrink-0 cursor-pointer rounded-full bg-primary text-white shadow hover:opacity-90"
        :title="musicPlayer.state.isPlaying ? '暂停 (空格键)' : '播放 (空格键)'"
        @click="togglePlay"
      >
        <div :class="musicPlayer.state.isPlaying ? 'i-ph:pause-fill' : 'i-ph:play-fill'" class="text-xl" />
      </button>

      <!-- 当前时间 -->
      <span class="min-w-9 flex-shrink-0 select-none whitespace-nowrap text-right text-xs color-fade font-mono tabular-nums">
        {{ formatTime(musicPlayer.state.currentTime) }}
      </span>

      <!-- 可拖拉进度条 -->
      <div class="min-w-16 flex flex-1 items-center">
        <input
          type="range"
          min="0"
          :max="composition.durationTotal || 10"
          step="0.1"
          :value="musicPlayer.state.currentTime"
          class="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-primary dark:bg-gray-700 focus:outline-none"
          @input="onSeekInput"
        >
      </div>

      <!-- 总时长 -->
      <span class="min-w-9 flex-shrink-0 select-none whitespace-nowrap text-xs color-fade font-mono tabular-nums">
        {{ formatTime(composition.durationTotal) }}
      </span>
    </div>

    <!-- 下载音频文件按钮 -->
    <button
      class="flex text-button flex-shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm hover:border-primary hover:bg-primary/10"
      :disabled="isExporting"
      @click="downloadAudio"
    >
      <div :class="isExporting ? 'i-ph:spinner-gap animate-spin' : 'i-ph:download-simple'" />
      <span class="hidden sm:inline">{{ isExporting ? '正在导出...' : '下载音频' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { CompositionResult } from '~/logic/composer'
import { musicPlayer } from '~/logic/player'

const props = withDefaults(defineProps<{
  composition: CompositionResult
  compact?: boolean
}>(), {
  compact: false,
})

const isExporting = ref(false)

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

/**
 * 纯前端毫秒级离线渲染并下载高保真 WAV 音频 (全设备支持，音质与网页播放 100% 一致)
 */
async function downloadAudio() {
  if (isExporting.value || !props.composition)
    return

  isExporting.value = true
  try {
    const blob = await musicPlayer.renderAudioBlob(props.composition)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${props.composition.title.replace(/\s+/g, '_')}_${props.composition.categoryName || 'vec-tone'}.wav`
    a.click()
    URL.revokeObjectURL(url)
  }
  catch (err) {
    console.error('Download audio error:', err)
  }
  finally {
    isExporting.value = false
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (props.compact)
    return

  if (e.code === 'Space') {
    const target = e.target as HTMLElement
    if (target && ['INPUT', 'TEXTAREA'].includes(target.tagName)) {
      return
    }
    e.preventDefault()
    togglePlay()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

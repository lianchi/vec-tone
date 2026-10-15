<template>
  <div class="w-full flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5 text-sm color-fade font-medium">
        <div class="i-ph:music-notes-simple-bold text-primary" />
        <span>五线乐谱与歌词对齐 (同步演奏高亮)</span>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="text-button text-sm py-1.5 px-3 flex items-center gap-1.5 cursor-pointer rounded-lg"
          title="下载五线谱矢量图片"
          @click="downloadSvg"
        >
          <div class="i-ph:image" />
          <span>下载谱图</span>
        </button>
      </div>
    </div>

    <!-- 乐谱渲染专用容器 (已放大比例与换行支持，播放时乐符与文字同步高亮) -->
    <div
      ref="scoreContainer"
      class="w-full overflow-x-auto rounded-xl border border-base p-5 bg-white dark:bg-[#18181b] min-h-36 text-center shadow-inner transition-colors"
    />
  </div>
</template>

<script setup lang="ts">
import { isDark } from '~/logic/state'

const props = defineProps<{
  abcNotation: string
  title?: string
  currentNoteIndex?: number
}>()

const scoreContainer = ref<HTMLDivElement | null>(null)

function downloadSvg() {
  if (!scoreContainer.value)
    return
  const svg = scoreContainer.value.querySelector('svg')
  if (!svg)
    return

  const svgData = new XMLSerializer().serializeToString(svg)
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(props.title || 'vec-tone_score').replace(/\s+/g, '_')}.svg`
  a.click()
  URL.revokeObjectURL(url)
}

// 核心功能：乐谱中唯一的当前音符与文字精准同步高亮
function updateActiveHighlight(index: number) {
  if (!scoreContainer.value)
    return

  // 1. 彻底清除之前所有的高亮状态，保证绝不遗留多个高亮
  const prevActives = scoreContainer.value.querySelectorAll('.active-score-note, .active-score-lyric')
  prevActives.forEach((el) => {
    el.classList.remove('active-score-note', 'active-score-lyric')
  })

  if (typeof index !== 'number' || index < 0)
    return

  // 2. 严格按歌词文字顺序，获取唯一的当前汉字节点
  const allLyrics = Array.from(scoreContainer.value.querySelectorAll<SVGElement>('.abcjs-lyric'))
  const charLyrics = allLyrics.filter((el) => {
    const txt = (el.textContent || '').trim()
    return txt.length > 0 && txt !== '_'
  })

  const targetLyric = charLyrics[index]
  if (!targetLyric)
    return

  // 仅高亮该单个文字
  targetLyric.classList.add('active-score-lyric')

  // 3. 通过 ABCjs 的测量度 (mm) 和小节内音符序号 (n) 精准定位该歌词专属的单音符
  const classList = Array.from(targetLyric.classList)
  const mmClass = classList.find(c => /^abcjs-mm\d+$/.test(c))
  const nClass = classList.find(c => /^abcjs-n\d+$/.test(c))

  let targetNote: SVGElement | null = null

  if (mmClass && nClass) {
    targetNote = scoreContainer.value.querySelector<SVGElement>(`.abcjs-note.${mmClass}.${nClass}`)
  }

  // 4. 容错回退：如未通过 class 找到，通过水平中心坐标与垂直方位进行高精度对齐
  if (!targetNote) {
    const lyricRect = targetLyric.getBoundingClientRect()
    const lyricCenterX = lyricRect.left + lyricRect.width / 2

    const allNotes = Array.from(scoreContainer.value.querySelectorAll<SVGElement>('.abcjs-note'))
    let minDistance = Infinity

    for (const note of allNotes) {
      const noteRect = note.getBoundingClientRect()
      const noteCenterX = noteRect.left + noteRect.width / 2
      const dist = Math.abs(noteCenterX - lyricCenterX)

      // 音符应在歌词上方且水平距离最近
      if (noteRect.bottom <= lyricRect.bottom + 12 && dist < minDistance) {
        minDistance = dist
        targetNote = note
      }
    }
  }

  if (targetNote) {
    targetNote.classList.add('active-score-note')
  }
}

async function renderScore() {
  if (typeof window === 'undefined' || !scoreContainer.value || !props.abcNotation)
    return

  try {
    const abcjs = await import('abcjs')
    scoreContainer.value.innerHTML = ''

    abcjs.renderAbc(scoreContainer.value, props.abcNotation, {
      responsive: 'resize',
      scale: 1.25, // 放大五线谱与音符尺寸
      staffwidth: 520,
      paddingtop: 12,
      paddingbottom: 12,
      paddingright: 16,
      paddingleft: 16,
      add_classes: true,
      foregroundColor: isDark.value ? '#f3f4f6' : '#1f2937',
    })

    // 重新渲染后恢复当前高亮
    if (typeof props.currentNoteIndex === 'number') {
      updateActiveHighlight(props.currentNoteIndex)
    }
  }
  catch (err) {
    console.error('Failed to render ABC score:', err)
  }
}

watch([() => props.abcNotation, isDark], () => {
  nextTick(() => renderScore())
})

// 监听播放时的时间轴索引变化，驱动乐谱中乐符与文字的同步高亮
watch(() => props.currentNoteIndex, (newIdx) => {
  updateActiveHighlight(typeof newIdx === 'number' ? newIdx : -1)
})

onMounted(() => {
  nextTick(() => renderScore())
})
</script>

<style>
/* 针对 ABCjs 暗色模式与字体居中对齐样式 */
.abcjs-title {
  text-anchor: middle !important;
  font-family: serif, 'Songti SC', 'SimSun', STSong !important;
  font-size: 22px !important;
  font-weight: 700 !important;
}
.abcjs-subtitle {
  text-anchor: middle !important;
  font-family: serif, 'Songti SC', 'SimSun', STSong !important;
  font-size: 15px !important;
  fill: #6b7280 !important;
}
.dark .abcjs-subtitle {
  fill: #9ca3af !important;
}
.dark .abcjs-staff {
  fill: #6b7280 !important;
}
.dark .abcjs-note {
  fill: #f3f4f6 !important;
}
.dark .abcjs-lyric {
  fill: #14b8a6 !important;
  font-family: serif, 'Songti SC', 'SimSun', STSong !important;
  font-size: 15px !important;
}
.abcjs-lyric {
  fill: #0d9488;
  font-family: serif, 'Songti SC', 'SimSun', STSong;
  font-size: 15px !important;
  font-weight: 500;
  transition: all 0.15s ease-out;
}
.abcjs-chord {
  fill: #8b5cf6 !important;
  font-weight: 600 !important;
  font-size: 13px !important;
}

/* 演奏时乐谱中文字动态同步高亮效果 */
.active-score-lyric {
  fill: #f97316 !important;
  font-size: 18px !important;
}
.dark .active-score-lyric {
  fill: #fb923c !important;
}

/* 演奏时乐谱中音符动态同步高亮效果 */
.active-score-note,
.active-score-note * {
  fill: #f97316 !important;
  stroke: #f97316 !important;
}
.dark .active-score-note,
.dark .active-score-note * {
  fill: #fb923c !important;
  stroke: #fb923c !important;
}
</style>

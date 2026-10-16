<template>
  <div class="w-full">
    <!-- 乐谱渲染专用容器 (支持响应式缩放，播放时乐符与文字精准同步高亮) -->
    <div
      ref="scoreContainer"
      class="min-h-36 w-full cursor-default select-none overflow-x-auto rounded-xl bg-ink text-center"
      @click="handleScoreClick"
    />
  </div>
</template>

<script setup lang="ts">
import type { LyricNote } from '~/logic/composer'
import { isDark } from '~/logic/state'

const props = defineProps<{
  abcNotation: string
  title?: string
  currentNoteIndex?: number
  lyricNotes?: LyricNote[]
}>()

const emit = defineEmits<{
  (e: 'seek', time: number, index: number): void
}>()

const scoreContainer = ref<HTMLDivElement | null>(null)

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

// 核心交互：点击乐谱音符或歌词文字，精准定位播放进度（随点随播）
function handleScoreClick(event: MouseEvent) {
  if (!scoreContainer.value || !props.lyricNotes || props.lyricNotes.length === 0)
    return

  const target = event.target as SVGElement | HTMLElement | null
  if (!target)
    return

  // 1. 检查是否点击了歌词文字 (.abcjs-lyric)
  const lyricEl = target.closest<SVGElement>('.abcjs-lyric')

  // 2. 检查是否点击了音符 (.abcjs-note)
  const noteEl = target.closest<SVGElement>('.abcjs-note')

  if (!lyricEl && !noteEl)
    return

  // 获取所有有效汉字歌词节点（排除占位符或下划线）
  const allLyrics = Array.from(scoreContainer.value.querySelectorAll<SVGElement>('.abcjs-lyric'))
  const charLyrics = allLyrics.filter((el) => {
    const txt = (el.textContent || '').trim()
    return txt.length > 0 && txt !== '_'
  })

  if (charLyrics.length === 0)
    return

  let targetIndex = -1

  if (lyricEl) {
    targetIndex = charLyrics.indexOf(lyricEl)
  }
  else if (noteEl) {
    // 优先通过 ABCjs 内部度量 class（mm 绝对小节与 n 小节内音符序号）匹配对应歌词
    const classList = Array.from(noteEl.classList)
    const mmClass = classList.find(c => /^abcjs-mm\d+$/.test(c))
    const nClass = classList.find(c => /^abcjs-n\d+$/.test(c))

    if (mmClass && nClass) {
      const matchedLyric = charLyrics.find(l => l.classList.contains(mmClass) && l.classList.contains(nClass))
      if (matchedLyric) {
        targetIndex = charLyrics.indexOf(matchedLyric)
      }
    }

    // 容错回退：按几何水平中心对齐寻找同列最近的歌词
    if (targetIndex === -1) {
      const noteRect = noteEl.getBoundingClientRect()
      const noteCenterX = noteRect.left + noteRect.width / 2

      let minDistance = Infinity
      let closestIdx = -1

      charLyrics.forEach((lyric, idx) => {
        const lRect = lyric.getBoundingClientRect()
        const lCenterX = lRect.left + lRect.width / 2
        const vertDist = lRect.top - noteRect.bottom

        // 歌词应在音符下方或基本在同一列（垂直距离在合理区间内）
        if (vertDist >= -20 && vertDist <= 100) {
          const dist = Math.abs(lCenterX - noteCenterX)
          if (dist < minDistance) {
            minDistance = dist
            closestIdx = idx
          }
        }
      })

      if (closestIdx !== -1 && minDistance < 50) {
        targetIndex = closestIdx
      }
    }

    // 容错：如果点击的是尾声收韵全音符（位于最后一个歌词之后），定位到最后一个音符
    if (targetIndex === -1 && charLyrics.length > 0) {
      const noteRect = noteEl.getBoundingClientRect()
      const lastLyric = charLyrics[charLyrics.length - 1]
      if (lastLyric) {
        const lastLyricRect = lastLyric.getBoundingClientRect()
        if (noteRect.left >= lastLyricRect.left) {
          targetIndex = props.lyricNotes.length - 1
        }
      }
    }
  }

  if (targetIndex >= 0 && targetIndex < props.lyricNotes.length) {
    const targetLyricNote = props.lyricNotes[targetIndex]
    if (targetLyricNote) {
      // 0ms 本地即时高亮反馈
      updateActiveHighlight(targetIndex)
      emit('seek', targetLyricNote.time, targetIndex)
    }
  }
}

async function renderScore() {
  if (typeof window === 'undefined' || !scoreContainer.value || !props.abcNotation)
    return

  try {
    const abcjs = await import('abcjs')
    scoreContainer.value.innerHTML = ''

    const containerWidth = scoreContainer.value.clientWidth || 520
    const dynamicStaffWidth = Math.max(320, Math.min(680, containerWidth - 40))

    abcjs.renderAbc(scoreContainer.value, props.abcNotation, {
      responsive: 'resize',
      scale: 1.18,
      staffwidth: dynamicStaffWidth,
      paddingtop: 10,
      paddingbottom: 10,
      paddingright: 14,
      paddingleft: 14,
      add_classes: true,
      selectTypes: false,
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
  font-size: 1.4rem !important;
  font-weight: 600 !important;
}
.abcjs-subtitle {
  text-anchor: middle !important;
  font-family: serif, 'Songti SC', 'SimSun', STSong !important;
  font-size: 0.95rem !important;
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
  font-size: 0.95rem !important;
}
.abcjs-lyric {
  fill: #0d9488;
  font-family: serif, 'Songti SC', 'SimSun', STSong;
  font-size: 0.95rem !important;
  font-weight: 500;
}
.abcjs-chord {
  fill: #8b5cf6 !important;
  font-weight: 600 !important;
  font-size: 0.9rem !important;
}

/* 演奏时乐谱中文字动态同步高亮效果 */
.active-score-lyric {
  fill: #f97316 !important;
  font-size: 1.2rem !important;
}
.dark .active-score-lyric {
  fill: #fb923c !important;
}

/* 演奏时乐谱中音符动态同步高亮效果 */
.active-score-note,
.active-score-note * {
  fill: #f97316 !important;
}
.dark .active-score-note,
.dark .active-score-note * {
  fill: #fb923c !important;
}

/* 乐谱交互手势与悬浮微动效：传达音符与歌词皆可点击跳转 */
.abcjs-note,
.abcjs-lyric {
  cursor: pointer;
}

.abcjs-note:hover {
  opacity: 0.82;
}

.abcjs-lyric:hover {
  opacity: 0.85;
}
</style>

<template>
  <div class="w-full">
    <!-- 响应式双列布局：手机端单列纵向流动，PC 桌面端双列协同 (左侧创作控制与播放，右侧乐谱视窗) -->
    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      <!-- 左侧栏：创作控制面板 + PC端播放控制 -->
      <div class="flex flex-col gap-4 lg:col-span-5">
        <!-- 创作与输入卡片 -->
        <div class="flex flex-col gap-6 border border-base rounded-2xl bg-ink p-4 sm:p-5">
          <!-- 1. 经典诗词灵感胶囊 -->
          <div class="flex flex-col gap-2">
            <div class="flex items-center justify-between text-sm text-primary">
              <span class="flex items-center gap-1 font-medium">
                <div class="i-ph:sparkle" />
                <span>诗词灵感</span>
              </span>
            </div>

            <!-- 诗词灵感药丸 -->
            <div class="flex flex-wrap gap-2">
              <button
                v-for="item in POEM_PRESETS"
                :key="item.id"
                class="flex cursor-pointer items-center gap-1.5 border-box rounded-full px-3 py-1"
                :class="currentPresetId === item.id ? 'border-primary text-primary bg-primary/15' : 'op75 hover:op100 bg-secondary'"
                @click="selectPoem(item)"
              >
                <span class="text-sm font-500">{{ item.title }}</span>
                <span class="text-xs op60">• {{ item.author }}</span>
              </button>
            </div>
          </div>

          <!-- 2. 文本创作区 -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1 text-sm text-primary font-medium">
                <div class="i-ph:pencil" />
                <span>创作文本</span>
              </span>
              <div class="flex items-center gap-2 text-xs color-fade">
                <button
                  v-if="customText"
                  class="flex cursor-pointer select-none items-center gap-0.5 hover:text-red-500"
                  title="清空文本"
                  @click="clearText"
                >
                  <div class="i-ph:trash" />
                  <span>清空</span>
                </button>
                <span>{{ customText.length }}/300</span>
              </div>
            </div>

            <textarea
              v-model="customText"
              rows="4"
              maxlength="300"
              placeholder="在此输入你创作的诗词、现代歌词或随想，即刻转化为动听乐谱..."
              class="w-full resize-none border border-base rounded-xl bg-base px-4 py-3 text-0.95rem outline-none focus-within:border-primary"
            />
          </div>

          <!-- 3. 音乐风格选择 -->
          <div class="flex flex-col gap-1.5">
            <span class="flex items-center gap-1 text-sm text-primary font-medium">
              <div class="i-ph:music-note" />
              <span>编曲风格</span>
            </span>
            <div class="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <button
                v-for="cat in categoryList"
                :key="cat.id"
                class="flex cursor-pointer items-center justify-center gap-1 border rounded-xl px-3 py-1.5 text-center text-sm"
                :class="selectedCategory === cat.id ? 'border-primary bg-primary/10 text-primary' : 'border-base hover:bg-secondary color-base op80 hover:op100'"
                @click="onSelectCategory(cat.id)"
              >
                <span>{{ cat.emoji }}</span>
                <span>{{ cat.name }}</span>
              </button>
            </div>
          </div>

          <!-- 4. 主生成按钮 -->
          <button
            class="flex-center cursor-pointer gap-2 rounded-xl bg-primary px-5 py-2 text-0.92rem text-white font-medium hover:opacity-90"
            :class="{ '!cursor-not-allowed op50': loading || !customText.trim() }"
            :disabled="loading || !customText.trim()"
            @click="onGenerateClick"
          >
            <div :class="!loading ? (isTextDirty ? 'i-ph:play-circle-bold' : 'i-ph:arrows-clockwise-bold') : 'i-ph:spinner-gap-bold animate-spin'" />
            <span>
              {{ loading ? 'AI 正在解析意境并谱曲...' : (isTextDirty ? `生成【${currentCategoryConfig.name}】并聆听` : `重新生成【${currentCategoryConfig.name}】`) }}
            </span>
          </button>

          <div v-if="errorInfo.text" class="text-center text-xs text-red-500">
            {{ errorInfo.text }}
          </div>
        </div>

        <!-- PC 桌面端 -->
        <div v-if="composition" class="hidden lg:block">
          <PlayerCard :composition="composition" />
        </div>
      </div>

      <!-- 右侧栏：视听乐谱区 (PC 占 7/12 列) -->
      <div v-if="composition" class="flex flex-col gap-4 lg:col-span-7">
        <!-- 移动端乐曲信息卡片（仅移动端展示标题与意境详情，PC 端在左侧 PlayerCard 中展示） -->
        <div class="border border-base rounded-2xl bg-ink p-4 lg:hidden">
          <TrackInfo :composition="composition" />
        </div>

        <!-- 矢量五线谱视窗 -->
        <div class="border border-base rounded-2xl bg-ink p-4 sm:p-5">
          <ScoreViewer
            :abc-notation="composition.abcNotation"
            :title="composition.title"
            :current-note-index="musicPlayer.state.currentNoteIndex"
            :lyric-notes="composition.lyricNotes"
            @seek="handleScoreSeek"
          />
        </div>
      </div>
    </div>

    <!-- 移动端固定底栏播放器：固定在屏幕底部 -->
    <div
      v-if="composition"
      class="fixed bottom-0 left-0 right-0 z-50 border-t border-base bg-ink bg-op90 px-4 py-3 backdrop-blur lg:hidden"
    >
      <PlayerCard :composition="composition" :compact="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { MusicCategory } from '~/logic/composer'
import type { PoemPreset } from '~/logic/presets'
import { CATEGORY_DEFINITIONS, composeMusic } from '~/logic/composer'
import { musicPlayer } from '~/logic/player'
import { POEM_PRESETS } from '~/logic/presets'
import {
  composition,
  currentVector,
  errorInfo,
  loading,
  selectedCategory,
} from '~/logic/state'
import { vectorizeText } from '~/logic/vectorizer'

const categoryList = Object.values(CATEGORY_DEFINITIONS)

const currentCategoryConfig = computed(() => {
  return CATEGORY_DEFINITIONS[selectedCategory.value] || CATEGORY_DEFINITIONS.classical
})

// 创作文本与预设匹配 (所见即可改)
const customText = ref('')
const customAiConfig = ref<any>(null)
const lastCustomGeneratedText = ref('')

const isTextDirty = computed(() => {
  return customText.value?.trim() !== lastCustomGeneratedText.value
})

const currentPresetId = computed(() => {
  const match = POEM_PRESETS.find(p => p.text.trim() === customText.value?.trim())
  return match?.id || ''
})

/**
 * 点击预设诗词胶囊：填入文本并即刻演奏
 */
function selectPoem(poem: PoemPreset) {
  customText.value = poem.text
  lastCustomGeneratedText.value = poem.text
  const isPlaying = musicPlayer.state.isPlaying
  generatePresetComposition(isPlaying, poem)
}

/**
 * 清空创作文本
 */
function clearText() {
  customText.value = ''
  musicPlayer.stop()
}

/**
 * 类别切换：如果正在播放，基于当前大类与曲风立即重新生成并续播
 */
async function onSelectCategory(cat: MusicCategory) {
  if (selectedCategory.value === cat)
    return

  selectedCategory.value = cat
  const isCurrentlyPlaying = musicPlayer.state.isPlaying

  const presetMatch = POEM_PRESETS.find(p => p.text.trim() === customText.value?.trim())
  if (presetMatch) {
    await generatePresetComposition(isCurrentlyPlaying, presetMatch)
  }
  else {
    await switchCustomCategory(isCurrentlyPlaying)
  }
}

/**
 * 切换音乐流派风格 (本地即时重编曲，保留已有 AI 意境与解读，不重复调用 API)
 */
async function switchCustomCategory(autoPlay = false) {
  const text = customText.value?.trim()
  if (!text)
    return

  errorInfo.text = ''
  musicPlayer.stop()

  try {
    const vector = currentVector.value || vectorizeText(text)
    currentVector.value = vector
    const firstClause = text.split(/([，。？！；\n\r]+)/).filter(Boolean)[0] || '自创诗作'
    const title = composition.value?.title || firstClause.slice(0, 8)

    const comp = composeMusic(text, vector, {
      title,
      author: '',
      category: selectedCategory.value,
      aiConfig: !isTextDirty.value ? customAiConfig.value : undefined,
    })

    if (composition.value?.romanticVectorConcept)
      comp.romanticVectorConcept = composition.value.romanticVectorConcept
    if (composition.value?.vibeDescription)
      comp.vibeDescription = composition.value.vibeDescription

    composition.value = comp
    musicPlayer.loadComposition(comp)

    if (autoPlay) {
      await musicPlayer.play(comp)
    }
  }
  catch (err: any) {
    console.error('switchCustomCategory error:', err)
    errorInfo.text = err?.message || '切换音乐流派失败'
  }
}

/**
 * 点击主生成按键
 */
async function onGenerateClick() {
  await generateCustomComposition(true)
}

/**
 * 生成预设诗词乐曲 (高精度，零延迟)
 */
async function generatePresetComposition(autoPlay = false, preset: PoemPreset) {
  errorInfo.text = ''
  musicPlayer.stop()

  try {
    const vector = vectorizeText(preset.text)
    currentVector.value = vector

    const comp = composeMusic(preset.text, vector, {
      title: preset.title,
      author: preset.author,
      category: selectedCategory.value,
      presetConfig: preset.audioConfig,
    })

    composition.value = comp
    musicPlayer.loadComposition(comp)

    if (autoPlay) {
      await musicPlayer.play(comp)
    }
  }
  catch (err: any) {
    console.error('generatePresetComposition error:', err)
    errorInfo.text = err?.message || '生成乐曲失败'
  }
}

/**
 * 生成自定义乐曲 (由 DeepSeek AI 深度解析意境并定制专属和弦骨架)
 */
async function generateCustomComposition(autoPlay = true) {
  const text = customText.value?.trim()
  if (!text) {
    errorInfo.text = '请输入诗词或文本内容'
    return
  }

  errorInfo.text = ''
  musicPlayer.stop()
  loading.value = true

  try {
    const vector = vectorizeText(text)
    currentVector.value = vector

    const firstClause = text.split(/([，。？！；\n\r]+)/).filter(Boolean)[0] || '自创诗作'
    const defaultTitle = firstClause.slice(0, 8)

    let aiConfig: any
    try {
      const res: any = await $fetch('/api/compose', {
        method: 'POST',
        body: {
          text,
          title: defaultTitle,
          category: selectedCategory.value,
        },
      })
      if (res && res.success && res.data) {
        aiConfig = res.data
      }
    }
    catch (apiErr) {
      console.warn('AI API 请求失败或未配置，由本地多维音乐引擎生成:', apiErr)
    }

    const comp = composeMusic(text, vector, {
      title: aiConfig?.title || defaultTitle,
      author: '',
      category: selectedCategory.value,
      aiConfig,
    })

    customAiConfig.value = aiConfig
    composition.value = comp
    musicPlayer.loadComposition(comp)
    lastCustomGeneratedText.value = text

    if (autoPlay) {
      await musicPlayer.play(comp)
    }
  }
  catch (err: any) {
    console.error('generateCustomComposition error:', err)
    errorInfo.text = err?.message || '生成自定义乐曲失败'
  }
  finally {
    loading.value = false
  }
}

async function handleScoreSeek(time: number) {
  if (!composition.value)
    return

  musicPlayer.seek(time)

  // 若当前未在播放，点击音符后自动启动播放，实现“随点随播”
  if (!musicPlayer.state.isPlaying) {
    await musicPlayer.play(composition.value)
  }
}

onMounted(() => {
  const initialPreset = POEM_PRESETS[0]!
  customText.value = initialPreset.text
  lastCustomGeneratedText.value = initialPreset.text
  generatePresetComposition(false, initialPreset)
})

onUnmounted(() => {
  musicPlayer.stop()
})
</script>

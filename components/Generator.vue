<template>
  <div class="flex flex-col gap-6">
    <!-- 极简输入与创作控制卡片 -->
    <div class="border border-base rounded-2xl p-5 bg-ink shadow-sm flex flex-col gap-4 transition-colors">
      <!-- 1. 灵感与自定义切换：SimpleTabs 组件 -->
      <SimpleTabs
        v-model="activeMode"
        :blocked="true"
        :options="modeOptions"
      />

      <!-- 2. 模式专属内容展现 -->
      <!-- 诗词灵感：经典名篇胶囊 -->
      <div v-if="activeMode === 'preset'" class="flex flex-wrap gap-2">
        <button
          v-for="item in POEM_PRESETS"
          :key="item.id"
          class="rounded-full px-3.5 py-1.5 text-xs transition border-box flex items-center gap-1.5 cursor-pointer"
          :class="selectedPresetId === item.id ? 'border-primary text-primary bg-primary/10 font-bold shadow-xs' : 'op75 hover:op100 bg-secondary'"
          @click="selectPoem(item)"
        >
          <span>{{ item.emoji }}</span>
          <span>{{ item.title }}</span>
          <span class="op60">· {{ item.author }}</span>
        </button>
      </div>

      <!-- 自定义创作：纯粹的诗词文本输入框 -->
      <div v-else class="relative transition-all duration-300">
        <textarea
          v-model="customText"
          rows="3"
          maxlength="150"
          placeholder="在此输入你创作的诗词、歌词或随想，比如：“明月出天山，苍茫云海间。长风几万里，吹度玉门关。”"
          class="w-full border rounded-xl px-4 py-3 border-base focus-within:border-primary bg-secondary/40 outline-none text-base font-serif leading-relaxed resize-none transition"
        />
        <div class="absolute bottom-2.5 right-3 text-xs color-fade">
          {{ customText.length }} / 150
        </div>
      </div>

      <!-- 四大音乐类别切换 (极简优雅，点击即切并自动续播) -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          v-for="cat in categoryList"
          :key="cat.id"
          class="py-2.5 px-3 rounded-xl border text-sm transition flex flex-col items-center justify-center gap-0.5 cursor-pointer text-center"
          :class="selectedCategory === cat.id ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs' : 'border-base bg-secondary/30 hover:bg-secondary/70 color-base op80 hover:op100'"
          @click="onSelectCategory(cat.id)"
        >
          <div class="flex items-center gap-1.5 text-sm">
            <span>{{ cat.emoji }}</span>
            <span>{{ cat.name }}</span>
          </div>
          <span class="text-[11px] op60 font-normal">{{ cat.desc }}</span>
        </button>
      </div>

      <!-- 生成并聆听主按键：仅在用户处于自定义创作时出现 -->
      <button
        v-if="activeMode === 'custom'"
        class="bg-primary text-white py-3 px-6 rounded-xl font-medium text-base transition duration-200 active:scale-98 shadow hover:opacity-95 flex-center gap-2 cursor-pointer mt-1"
        :class="{ '!cursor-not-allowed op50': loading }"
        :disabled="loading"
        @click="onGenerateCustomClick"
      >
        <div :class="!loading ? (isTextDirty ? 'i-ph:play-circle-bold' : 'i-ph:arrows-clockwise-bold') : 'i-ph:spinner-gap-bold animate-spin'" class="text-xl" />
        <span>{{ loading ? `AI (DeepSeek) 正在深度解析意境并定制谱曲...` : (isTextDirty ? `生成【${currentCategoryConfig.name}】并聆听` : `重新生成【${currentCategoryConfig.name}】`) }}</span>
      </button>

      <div v-if="errorInfo.text" class="text-red-500 text-xs text-center">
        {{ errorInfo.text }}
      </div>
    </div>

    <!-- 音乐演奏与图谱区域 (平铺展示，无多余徽章和冗余文字) -->
    <div v-if="composition" class="flex flex-col gap-6">
      <!-- 1. 核心播放控制器卡片 (已拆分为独立组件) -->
      <PlayerCard :composition="composition" />

      <!-- 2. 乐谱渲染区 (直接平铺展示，演奏时乐符与歌词同步跟随高亮) -->
      <div class="border border-base rounded-2xl p-5 bg-ink shadow-sm transition-colors">
        <ScoreViewer
          :abc-notation="composition.abcNotation"
          :title="composition.title"
          :current-note-index="musicPlayer.state.currentNoteIndex"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CompositionResult, MusicCategory } from '~/logic/composer'
import { CATEGORY_DEFINITIONS, composeMusic } from '~/logic/composer'
import { musicPlayer } from '~/logic/player'
import { POEM_PRESETS, type PoemPreset } from '~/logic/presets'
import {
  activeMode,
  composition,
  currentVector,
  errorInfo,
  inputState,
  loading,
  selectedCategory,
} from '~/logic/state'
import { vectorizeText } from '~/logic/vectorizer'

const modeOptions = [
  { value: 'preset' as const, label: '诗词灵感', icon: 'i-ph:sparkle' },
  { value: 'custom' as const, label: '自定义创作', icon: 'i-ph:pencil-simple-line' },
]

const categoryList = [
  { id: 'classical' as MusicCategory, name: '古典钢琴曲', emoji: '🎹', desc: '肖邦式流水夜曲' },
  { id: 'rnb' as MusicCategory, name: '流行 R&B', emoji: '🍷', desc: '都会浪漫灵魂律动' },
  { id: 'jazz' as MusicCategory, name: '爵士风情', emoji: '🎷', desc: '微醺行走贝斯摇摆' },
  { id: 'tiktok' as MusicCategory, name: '抖音网红曲', emoji: '🔥', desc: '4536251动感神曲' },
]

const currentCategoryConfig = computed(() => {
  return CATEGORY_DEFINITIONS[selectedCategory.value] || CATEGORY_DEFINITIONS.classical
})

// 诗词灵感状态
const selectedPresetId = ref('moon')
const presetComposition = ref<CompositionResult | null>(null)

// 自定义创作状态 (纯粹极简，仅保留创作文本)
const customText = ref('明月出天山，苍茫云海间。长风几万里，吹度玉门关。')
const customComposition = ref<CompositionResult | null>(null)
const lastCustomGeneratedText = ref('')
const isTextDirty = computed(() => {
  return customText.value?.trim() !== lastCustomGeneratedText.value
})

/**
 * 监听模式切换：切换后立即针对性更新下方播放器、乐谱和曲目内容
 */
watch(activeMode, (mode) => {
  musicPlayer.stop()
  errorInfo.text = ''

  if (mode === 'preset') {
    if (presetComposition.value) {
      composition.value = presetComposition.value
      musicPlayer.loadComposition(presetComposition.value)
    }
    else {
      const activePreset = POEM_PRESETS.find(p => p.id === selectedPresetId.value) || POEM_PRESETS[0]!
      generatePresetComposition(false, activePreset)
    }
  }
  else {
    if (customComposition.value) {
      composition.value = customComposition.value
      musicPlayer.loadComposition(customComposition.value)
    }
    else {
      // 首次切入自定义模式时，由本地编曲引擎即刻就绪，绝不无谓调用大模型 API
      switchCustomCategory(false)
    }
  }
})

/**
 * 选择经典诗篇 (即选即听)
 */
function selectPoem(poem: PoemPreset) {
  selectedPresetId.value = poem.id
  inputState.selectedPoemId = poem.id
  inputState.text = poem.text
  const isPlaying = musicPlayer.state.isPlaying
  generatePresetComposition(isPlaying, poem)
}

/**
 * 类别切换：如果正在播放，基于当前大类与曲风立即重新生成并续播
 */
async function onSelectCategory(cat: MusicCategory) {
  if (selectedCategory.value === cat)
    return

  selectedCategory.value = cat
  const isCurrentlyPlaying = musicPlayer.state.isPlaying

  if (activeMode.value === 'preset') {
    const activePreset = POEM_PRESETS.find(p => p.id === selectedPresetId.value) || POEM_PRESETS[0]!
    await generatePresetComposition(isCurrentlyPlaying, activePreset)
  }
  else {
    // 自定义模式下切换流派：由本地多维编曲引擎切换配器与律动，不重复发起大模型 API 请求！
    await switchCustomCategory(isCurrentlyPlaying)
  }
}

/**
 * 切换自定义模式下的音乐流派风格 (本地即时重编曲，保留已有意境与解读，不调用大模型)
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
    })

    // 保留大模型生成的先锋艺术解读与意境素描
    if (composition.value?.romanticVectorConcept)
      comp.romanticVectorConcept = composition.value.romanticVectorConcept
    if (composition.value?.vibeDescription)
      comp.vibeDescription = composition.value.vibeDescription

    customComposition.value = comp
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
 * 点击生成自定义乐章并聆听 (显式生成：文本向量化 + 本地编曲 + 联动大模型意境解析)
 */
async function onGenerateCustomClick() {
  await generateCustomComposition(true)
}

/**
 * 生成经典诗词乐曲 (高精度预设，零延迟秒播)
 */
async function generatePresetComposition(autoPlay = false, preset?: PoemPreset) {
  const activePreset = preset || POEM_PRESETS.find(p => p.id === selectedPresetId.value) || POEM_PRESETS[0]!
  errorInfo.text = ''
  musicPlayer.stop()

  try {
    const vector = vectorizeText(activePreset.text)
    currentVector.value = vector

    const comp = composeMusic(activePreset.text, vector, {
      title: activePreset.title,
      author: activePreset.author,
      category: selectedCategory.value,
      presetConfig: activePreset.audioConfig,
    })

    presetComposition.value = comp
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
 * 生成自定义乐曲 (由 DeepSeek AI 深度解析意境并定制专属和弦骨架，返回后再开始演奏)
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

    // 默认标题取前段文字
    const firstClause = text.split(/([，。？！；\n\r]+)/).filter(Boolean)[0] || '自创诗作'
    const defaultTitle = firstClause.slice(0, 8)

    // 1. 发起 DeepSeek AI 深度解析与专属和弦/调式生成
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
      console.warn('AI API 请求失败或未配置，已无缝由本地多维音乐引擎生成:', apiErr)
    }

    // 2. 只有当 AI 响应返回（或优雅降级）后，才开始基于定制和弦构建乐谱与音频！
    const comp = composeMusic(text, vector, {
      title: aiConfig?.title || defaultTitle,
      author: '',
      category: selectedCategory.value,
      aiConfig,
    })

    customComposition.value = comp
    composition.value = comp
    musicPlayer.loadComposition(comp)
    lastCustomGeneratedText.value = text

    // 3. 乐谱与音频就绪后，正式开始播放！
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

onMounted(() => {
  const initialPreset = POEM_PRESETS[0]!
  selectedPresetId.value = initialPreset.id
  inputState.selectedPoemId = initialPreset.id
  inputState.text = initialPreset.text
  generatePresetComposition(false, initialPreset)
})

onUnmounted(() => {
  musicPlayer.stop()
})
</script>

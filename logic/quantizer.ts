import type { MusicCategory } from './theory'
import { getTone } from './vectorizer'

// 意象关键词情感权重表
export const EMPHASIS_WORDS = new Set([
  '天',
  '地',
  '山',
  '海',
  '江',
  '河',
  '月',
  '日',
  '风',
  '云',
  '雪',
  '雨',
  '酒',
  '醉',
  '歌',
  '笑',
  '欢',
  '春',
  '生',
  '人',
  '君',
  '莫',
  '空',
  '愁',
  '泪',
  '悲',
  '哀',
  '怨',
  '思',
  '归',
  '别',
  '离',
  '去',
  '飞',
  '高',
  '长',
  '深',
  '远',
  '白',
  '青',
  '夜',
  '星',
  '梦',
  '心',
  '情',
  '水',
  '花',
  '落',
])

export interface AISyllableBlueprint {
  char: string
  weight?: number // 1: 短音/轻快, 2: 标准, 3: 抒情长音, 4: 句尾归韵/高潮长音
  tendency?: 'rise' | 'step_up' | 'fall' | 'step_down' | 'high_climax' | 'resolve_down' | 'hold'
  accent?: boolean
}

export interface AIClauseBlueprint {
  text: string
  function?: 'qi' | 'cheng' | 'zhuan' | 'he'
  chords?: [string, string]
  mood?: string
  rhythmStyle?: string
  syllables?: AISyllableBlueprint[]
}

export interface AIComposeConfig {
  title?: string
  key?: string
  bpm?: number
  scale?: string
  vibeDescription?: string
  romanticVectorConcept?: string
  chords?: {
    qi: [string, string]
    cheng: [string, string]
    zhuan: [string, string]
    he: [string, string]
  }
  clauses?: AIClauseBlueprint[]
}

/**
 * 文本音乐音节/词元切分器
 * 中文/日韩汉字单字为一个音节；英文单词或数字连续为一个音节；过滤无效空格与纯标点符号
 */
export function tokenizeClause(clause: string): string[] {
  const regex = /[\u4E00-\u9FA5\u3040-\u30FF\uAC00-\uD7AF]|[a-z0-9']+/gi
  return clause.match(regex) || []
}

/**
 * 节拍守恒归一化求解器 (Quantization Solver)
 * 将 AI 或启发式权重序列精准映射为八分音符整数时值，严格保证小节时值守恒（4/4拍 = 8个八分音符）
 */
export function quantizeBarRhythm(
  chars: string[],
  options: {
    category: MusicCategory
    isSecond: boolean
    syllables?: AISyllableBlueprint[]
  },
): { durations: number[], restEighths: number } {
  const count = chars.length
  if (count === 0)
    return { durations: [], restEighths: 8 }

  // 1. 确定本小节音符占用目标时值（八分音符数）
  // Bar 1：通常填满小节（8个八分音符），连贯流动进入 Bar 2
  // Bar 2：通常留出 2 个八分音符作为呼吸、过门休止（6个八分音符 + 2个八分音符休止）
  let targetEighths = options.isSecond ? (count >= 6 ? 7 : 6) : 8
  if (count > targetEighths) {
    targetEighths = 8
  }

  // 2. 提取或推算每个字的权重
  const weights: number[] = []
  const hasAiSyls = options.syllables && options.syllables.length === count

  for (let i = 0; i < count; i++) {
    const char = chars[i] || ''
    const syl = hasAiSyls ? options.syllables![i] : undefined

    if (syl?.weight && syl.weight > 0) {
      weights.push(syl.weight)
    }
    else {
      // 离线/本地启发式权重
      let w = 2.0
      const tone = getTone(char)
      const isLast = i === count - 1

      if (tone === 0)
        w += 0.5 // 平声悠扬，略长
      else
        w -= 0.3 // 仄声顿挫

      if (isLast) {
        w += options.isSecond ? 1.8 : 0.8 // 句尾收韵持留
      }

      if (options.category === 'rnb') {
        if (i === 0)
          w += 1.0
        else if (i === 1)
          w -= 0.6
      }
      else if (options.category === 'tiktok') {
        w = isLast ? 2.2 : 1.8
      }

      weights.push(Math.max(0.8, w))
    }
  }

  // 3. 比例求解并取整
  const totalWeight = weights.reduce((a, b) => a + b, 0) || 1
  const durations = weights.map(w => Math.max(1, Math.round((w / totalWeight) * targetEighths)))

  // 4. 精确配平残差 (保证 sum(durations) === targetEighths)
  let currentSum = durations.reduce((a, b) => a + b, 0)
  let guard = 0

  while (currentSum !== targetEighths && guard++ < 30) {
    if (currentSum > targetEighths) {
      let maxIdx = -1
      let maxVal = 1
      for (let i = 0; i < count; i++) {
        if (durations[i]! > maxVal) {
          maxVal = durations[i]!
          maxIdx = i
        }
      }
      if (maxIdx >= 0) {
        durations[maxIdx]!--
        currentSum--
      }
      else {
        break
      }
    }
    else {
      let bestIdx = count - 1
      let maxW = -1
      for (let i = 0; i < count; i++) {
        if (weights[i]! > maxW) {
          maxW = weights[i]!
          bestIdx = i
        }
      }
      durations[bestIdx]!++
      currentSum++
    }
  }

  const finalUsed = durations.reduce((a, b) => a + b, 0)
  const restEighths = Math.max(0, 8 - finalUsed)

  return { durations, restEighths }
}

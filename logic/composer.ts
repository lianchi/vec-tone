import type { PresetAudioConfig } from './presets'
import type {
  AIComposeConfig,
  AISyllableBlueprint,
} from './quantizer'
import type { MusicCategory } from './theory'
import type { SemanticVector } from './vectorizer'
import { exportMidi } from './midi'
import {
  EMPHASIS_WORDS,
  quantizeBarRhythm,
  tokenizeClause,
} from './quantizer'
import {
  CATEGORY_DEFINITIONS,
  getVoicing,
  hashString,
  resolveMusicalDNA,
  scaleDescriptions,
  SCALES,
} from './theory'
import { getTone } from './vectorizer'

export { exportMidi } from './midi'
export type {
  AIClauseBlueprint,
  AIComposeConfig,
  AISyllableBlueprint,
} from './quantizer'

export {
  EMPHASIS_WORDS,
  quantizeBarRhythm,
  tokenizeClause,
} from './quantizer'
// Re-export for backward compatibility
export type {
  MusicCategory,
  Voicing,
} from './theory'

export {
  CATEGORY_DEFINITIONS,
  getVoicing,
  resolveMusicalDNA,
  scaleDescriptions,
  SCALES,
  VOICINGS,
} from './theory'

export interface MusicEvent {
  time: number // 绝对开始时间（秒）
  pitch: string // e.g. 'A4'
  duration: number // 持续时长（秒）
  velocity: number // 力度 0~1
  track: 'melody' | 'chord' | 'bass' | 'pad' | 'kick' | 'snare' | 'hihat' | 'counter'
  char?: string // 对应的中文字符
  noteIndex?: number // 在歌词音符中的索引
  isOrnament?: boolean // 是否为前倚音/花音
  isMelisma?: boolean // 是否为一字多音转音拖腔
}

export interface LyricNote {
  char: string
  time: number
  pitch: string
  index: number
}

export interface CompositionResult {
  title: string
  author: string
  text: string
  category: MusicCategory
  categoryName: string
  scale: string
  key: string
  bpm: number
  emotionTag: string
  vibeDescription: string
  romanticVectorConcept?: string
  similarPoemTag: string
  durationTotal: number
  events: MusicEvent[]
  lyricNotes: LyricNote[]
  abcNotation: string
  midiBase64: string
  midiFileName: string
}

export function composeMusic(
  text: string,
  vector: SemanticVector,
  options: {
    title?: string
    author?: string
    category?: MusicCategory
    presetConfig?: PresetAudioConfig
    aiConfig?: AIComposeConfig
  } = {},
): CompositionResult {
  const category: MusicCategory = options.category || 'classical'
  const catConfig = CATEGORY_DEFINITIONS[category] || CATEGORY_DEFINITIONS.classical

  let key: string
  let vibe: string
  let progressions: {
    qi: [string, string]
    cheng: [string, string]
    zhuan: [string, string]
    he: [string, string]
  }
  let bpm: number
  let scaleName = ''
  let romanticVectorConcept: string | undefined

  if (options.aiConfig) {
    const ai = options.aiConfig
    const dna = resolveMusicalDNA(vector, category)
    key = (ai.key && (SCALES as any)[ai.key]) ? ai.key : dna.key
    vibe = ai.vibeDescription || dna.vibe
    scaleName = ai.scale || `${key} 调式 • ${catConfig.name}`
    romanticVectorConcept = ai.romanticVectorConcept
    progressions = ai.chords || dna.progressions
    bpm = ai.bpm || dna.bpm
  }
  else if (options.presetConfig) {
    const pc = options.presetConfig
    key = pc.key
    progressions = pc.genreProgressions[category] || pc.genreProgressions.classical
    romanticVectorConcept = pc.romanticVectorConcept

    // 根据 4 大流派赋予专属速度与调式风情
    if (category === 'classical') {
      bpm = pc.bpm || 64
      scaleName = pc.scaleName
      vibe = pc.vibeDescription
    }
    else if (category === 'rnb') {
      bpm = Math.max(76, Math.min(84, Math.round((pc.bpm || 64) * 1.25)))
      scaleName = `${key} 都会浪漫 R&B 调式 (Neo-Soul 都会律动)`
      vibe = `${pc.vibeDescription.split('•')[0]?.trim() || '都会流光'} • 灵魂切分律动`
    }
    else if (category === 'jazz') {
      bpm = Math.max(88, Math.min(98, Math.round((pc.bpm || 64) * 1.44)))
      scaleName = `${key} 微醺摇摆爵士调式 (Swing 漫步风情)`
      vibe = `${pc.vibeDescription.split('•')[0]?.trim() || '微醺酒馆'} • 行走贝斯摇摆`
    }
    else {
      // tiktok
      bpm = Math.max(104, Math.min(116, Math.round((pc.bpm || 64) * 1.68)))
      scaleName = `${key} 抖音网红 4536251 爆款律动`
      vibe = `${pc.vibeDescription.split('•')[0]?.trim() || '动感洗脑'} • 4-on-the-floor 律动`
    }
  }
  else {
    const dna = resolveMusicalDNA(vector, category)
    key = dna.key
    vibe = dna.vibe
    progressions = dna.progressions
    bpm = dna.bpm
    scaleName = `${key} 调式 • ${catConfig.name}`
  }

  const scalePitches = (SCALES as Record<string, typeof SCALES.Am>)[key] || SCALES.Am
  const beatSec = 60 / bpm
  const eighthSec = beatSec / 2
  const sixteenthSec = beatSec / 4
  const barSec = beatSec * 4

  // 分解诗句/歌词/句子（同时兼容全角中文标点与英文半角标点）
  const rawClauses = text.split(/([，。？！；\n\r,.?!;]+)/).filter(Boolean)
  const clauses: string[] = []
  for (let i = 0; i < rawClauses.length; i += 2) {
    const s = rawClauses[i]?.trim()
    if (s && tokenizeClause(s).length > 0)
      clauses.push(s)
  }
  if (!clauses.length && text.trim())
    clauses.push(text.trim())

  const title = options.title || (clauses[0]?.slice(0, 16) || '无题')
  const author = options.author || ''

  const allEvents: MusicEvent[] = []
  const lyricNotes: CompositionResult['lyricNotes'] = []
  let currentTime = 0.25

  // 伴奏生成：根据类别与诗词和弦生成
  function buildBarAccompaniment(barStart: number, chordName: string, _isZhuan = false, isOutro = false) {
    const voicing = getVoicing(chordName)

    // 1. 低音 Bass
    if (category === 'jazz') {
      // 爵士 Walking Bass (每拍迈步 1, 2, 3, 4，半音趋近；Outro 则稳健落在根音)
      if (isOutro) {
        allEvents.push({
          time: barStart,
          pitch: voicing.bass,
          duration: barSec * 0.95,
          velocity: 0.78,
          track: 'bass',
        })
      }
      else {
        const walkNotes = [voicing.bass, 'D2', 'F2', 'Ab2']
        walkNotes.forEach((pitch, idx) => {
          allEvents.push({
            time: barStart + idx * beatSec,
            pitch,
            duration: beatSec * 0.88,
            velocity: 0.74,
            track: 'bass',
          })
        })
      }
    }
    else if (category === 'tiktok') {
      // 抖音网红曲：八分音符律动泵感低音 (Outro 稳健收束)
      if (isOutro) {
        allEvents.push({
          time: barStart,
          pitch: voicing.bass,
          duration: barSec * 0.95,
          velocity: 0.82,
          track: 'bass',
        })
      }
      else {
        for (let i = 0; i < 8; i++) {
          allEvents.push({
            time: barStart + i * eighthSec,
            pitch: voicing.bass,
            duration: eighthSec * 0.84,
            velocity: i % 2 === 0 ? 0.82 : 0.65,
            track: 'bass',
          })
        }
      }
    }
    else {
      // 古典 / R&B：呼吸式扎实低音
      allEvents.push({
        time: barStart,
        pitch: voicing.bass,
        duration: barSec * 0.95,
        velocity: 0.82,
        track: 'bass',
      })
      if (!isOutro) {
        allEvents.push({
          time: barStart + beatSec * 2,
          pitch: voicing.bass,
          duration: beatSec * 1.8,
          velocity: 0.62,
          track: 'bass',
        })
      }
    }

    // 2. 温暖弦乐氛围垫 Pad (Outro 同样保持温暖和声托底，防止声音突然空洞)
    voicing.pad.forEach((p) => {
      allEvents.push({
        time: barStart,
        pitch: p,
        duration: barSec * 0.95,
        velocity: isOutro ? 0.32 : 0.26,
        track: 'pad',
      })
    })

    // 3. 伴奏织体 (Arpeggio / Comping)
    if (isOutro) {
      // 尾声结束和弦：钢琴柔美滚奏/琶音收束，缓缓落定，绝不留多余空白
      voicing.arpeggio.slice(0, 4).forEach((p, idx) => {
        allEvents.push({
          time: barStart + idx * (eighthSec * 0.75),
          pitch: p,
          duration: barSec * 0.85,
          velocity: Math.max(0.24, 0.52 - idx * 0.08),
          track: 'chord',
        })
      })
    }
    else {
      if (category === 'rnb') {
        // R&B 离拍切分和弦 (Stabs on off-beats)
        const stabOffsets = [eighthSec, beatSec + eighthSec, beatSec * 3]
        stabOffsets.forEach((off) => {
          voicing.pad.forEach((p) => {
            allEvents.push({
              time: barStart + off,
              pitch: p,
              duration: eighthSec * 0.9,
              velocity: 0.48,
              track: 'chord',
            })
          })
        })
      }
      else if (category === 'jazz') {
        // Jazz Charleston 切分 (Beat 1 & Beat 2-and)
        [0, beatSec * 1.5].forEach((off) => {
          voicing.pad.forEach((p) => {
            allEvents.push({
              time: barStart + off,
              pitch: p,
              duration: eighthSec * 1.2,
              velocity: 0.5,
              track: 'chord',
            })
          })
        })
      }
      else {
        // 古典 / 抖音：流动分解和弦 (Arpeggio)
        voicing.arpeggio.forEach((p, idx) => {
          const dyn = idx === 0 ? 0.54 : (idx === 4 ? 0.46 : (idx % 2 === 0 ? 0.38 : 0.28))
          allEvents.push({
            time: barStart + idx * eighthSec,
            pitch: p,
            duration: eighthSec * 0.92,
            velocity: dyn,
            track: 'chord',
          })
        })
      }
    }

    // 4. 打击乐鼓组 (Drums Section)
    if (!isOutro && category !== 'classical') {
      if (category === 'tiktok') {
        // 抖音爆款：4-on-the-floor 强劲动感鼓点
        for (let b = 0; b < 4; b++) {
          allEvents.push({ time: barStart + b * beatSec, pitch: 'C1', duration: 0.15, velocity: 0.92, track: 'kick' })
          if (b === 1 || b === 3) {
            allEvents.push({ time: barStart + b * beatSec, pitch: 'C2', duration: 0.12, velocity: 0.86, track: 'snare' })
          }
          allEvents.push({ time: barStart + b * beatSec + eighthSec, pitch: 'G3', duration: 0.05, velocity: 0.68, track: 'hihat' })
        }
      }
      else if (category === 'rnb') {
        // R&B 律动：Kick on 1 & 3-and, Snare on 2 & 4
        allEvents.push({ time: barStart, pitch: 'C1', duration: 0.15, velocity: 0.88, track: 'kick' })
        allEvents.push({ time: barStart + beatSec * 2.5, pitch: 'C1', duration: 0.15, velocity: 0.82, track: 'kick' })
        allEvents.push({ time: barStart + beatSec, pitch: 'C2', duration: 0.12, velocity: 0.82, track: 'snare' })
        allEvents.push({ time: barStart + beatSec * 3, pitch: 'C2', duration: 0.12, velocity: 0.82, track: 'snare' })
        for (let i = 0; i < 8; i++) {
          allEvents.push({ time: barStart + i * eighthSec, pitch: 'G3', duration: 0.05, velocity: i % 2 === 0 ? 0.62 : 0.44, track: 'hihat' })
        }
      }
      else if (category === 'jazz') {
        // Jazz 摇摆轻擦鼓点
        allEvents.push({ time: barStart, pitch: 'C1', duration: 0.1, velocity: 0.62, track: 'kick' })
        allEvents.push({ time: barStart + beatSec, pitch: 'C2', duration: 0.1, velocity: 0.68, track: 'snare' })
        allEvents.push({ time: barStart + beatSec * 3, pitch: 'C2', duration: 0.1, velocity: 0.68, track: 'snare' })
        for (let b = 0; b < 4; b++) {
          allEvents.push({ time: barStart + b * beatSec, pitch: 'G3', duration: 0.05, velocity: 0.58, track: 'hihat' })
          allEvents.push({ time: barStart + b * beatSec + sixteenthSec * 3, pitch: 'G3', duration: 0.05, velocity: 0.46, track: 'hihat' })
        }
      }
    }
  }

  // A. 【前奏 Intro】(1 小节引子)
  const introChord = progressions.qi[0]
  buildBarAccompaniment(currentTime, introChord)
  currentTime += barSec

  // ABC 记谱法头部 (严格遵守 ABC 规范，头部字段间绝不允许出现空行)
  const abcLines: string[] = [
    'X:1',
    `T:${title}`,
    ...(author ? [`T:〔${author}〕`] : []),
    'M:4/4',
    'L:1/8',
    `Q:1/4=${bpm}`,
    `K:${key}`,
  ]

  // B. 【起承转合 乐章主体】
  let lyricCounter = 0
  const tonicIndex = Math.min(scalePitches.length - 1, Math.max(4, Math.floor(scalePitches.length * 0.5)))
  let lastPitchIdx = tonicIndex

  const roles: Array<'qi' | 'cheng' | 'zhuan' | 'he'> = ['qi', 'cheng', 'zhuan', 'he']

  clauses.forEach((clause, cIdx) => {
    const chars = tokenizeClause(clause)
    if (!chars.length)
      return
    const aiClause = options.aiConfig?.clauses?.[cIdx]
    const role = aiClause?.function || roles[cIdx % 4] || 'qi'
    const chords = progressions[role]
    const bar1Chord = aiClause?.chords?.[0] || chords[0] || 'Am9'
    const bar2Chord = aiClause?.chords?.[1] || chords[1] || bar1Chord

    const bar1Start = currentTime
    const bar2Start = currentTime + barSec

    buildBarAccompaniment(bar1Start, bar1Chord, role === 'zhuan')
    buildBarAccompaniment(bar2Start, bar2Chord, role === 'zhuan')

    let clauseAbc = `"${bar1Chord}" `
    let clauseLyrics = ''

    // 诗词意境与角色驱动的音高寄存中心 (彻底区分不同诗词的音区走向)
    // 转句推向高八度高潮，承句在中低音区回荡
    let targetCenter = tonicIndex
    if (role === 'zhuan')
      targetCenter = Math.min(scalePitches.length - 2, tonicIndex + 4) // 高潮迸发！
    else if (role === 'cheng')
      targetCenter = Math.max(2, tonicIndex - 2)
    else if (role === 'he')
      targetCenter = tonicIndex
    else
      targetCenter = tonicIndex + 1

    // 诗句分为两个小节
    const half = Math.ceil(chars.length / 2)
    const bar1Chars = chars.slice(0, half)
    const bar2Chars = chars.slice(half)
    const clauseSyls = aiClause?.syllables

    function processBarChars(
      cList: string[],
      barStartTime: number,
      activeChord: string,
      isSecond: boolean,
      barSyls?: AISyllableBlueprint[],
    ) {
      const voicing = getVoicing(activeChord)
      const count = cList.length
      if (count === 0)
        return

      // 节拍守恒归一化求解器（Quantization Solver）：告别呆板字数查表！
      const { durations, restEighths } = quantizeBarRhythm(cList, {
        category,
        isSecond,
        syllables: barSyls,
      })

      let currentOffsetEighths = 0

      cList.forEach((char, idx) => {
        const isLastInBar = idx === count - 1
        const isVeryLastInClause = isSecond && isLastInBar
        const isEmphasized = EMPHASIS_WORDS.has(char)
        const durEighths = durations[idx] || 2

        let slotTime = barStartTime + currentOffsetEighths * eighthSec
        // 爵士摇摆律动：反拍音符微滞后（Swing feel）
        if (category === 'jazz' && currentOffsetEighths % 2 === 1) {
          slotTime += 0.035 * beatSec
        }

        currentOffsetEighths += durEighths

        const hasMelisma = isLastInBar && durEighths >= 3 && category !== 'tiktok'

        // 音高算法：融合 AI 旋律起伏意图与乐理骨干音吸附
        let pitchIdx = lastPitchIdx
        const charHash = hashString(char + cIdx + title, 107)
        const syl = barSyls?.[idx]
        const hasAiTendency = !!syl?.tendency
        const isAccent = syl?.accent ?? (idx === 0 || isEmphasized)

        if (idx === 0) {
          const candidates: number[] = []
          scalePitches.forEach((p: { midi: string, abc: string }, pIdx: number) => {
            const letter = p.midi.replace(/\d+/, '')
            if (voicing.tones.includes(letter))
              candidates.push(pIdx)
          })
          if (candidates.length && typeof candidates[0] === 'number') {
            candidates.sort((a, b) => Math.abs(a - targetCenter) - Math.abs(b - targetCenter))
            pitchIdx = candidates[0] ?? targetCenter
          }
          else {
            pitchIdx = targetCenter
          }

          if (syl?.tendency === 'high_climax') {
            pitchIdx = Math.min(scalePitches.length - 2, pitchIdx + 3)
          }
        }
        else if (hasAiTendency) {
          // 根据 AI 规划的旋律起伏倾向驱动音高走向
          switch (syl!.tendency) {
            case 'high_climax':
              pitchIdx = Math.min(scalePitches.length - 2, targetCenter + 3 + (charHash > 0.5 ? 1 : 0))
              break
            case 'resolve_down':
              pitchIdx = Math.max(1, lastPitchIdx - (lastPitchIdx > targetCenter ? 2 : 1))
              break
            case 'step_up':
            case 'rise':
              pitchIdx = Math.min(scalePitches.length - 2, lastPitchIdx + (syl!.tendency === 'rise' ? 2 : 1))
              break
            case 'step_down':
            case 'fall':
              pitchIdx = Math.max(1, lastPitchIdx - (syl!.tendency === 'fall' ? 2 : 1))
              break
            case 'hold':
              pitchIdx = lastPitchIdx
              break
            default:
              pitchIdx = lastPitchIdx + (getTone(char) === 0 ? 1 : -1)
          }

          // 如果标记为重音骨干音，微调吸附到和弦内音（避免撞音）
          if (isAccent) {
            const chordCandidates: number[] = []
            scalePitches.forEach((p, pIdx) => {
              const letter = p.midi.replace(/\d+/, '')
              if (voicing.tones.includes(letter) && Math.abs(pIdx - pitchIdx) <= 2) {
                chordCandidates.push(pIdx)
              }
            })
            if (chordCandidates.length > 0) {
              chordCandidates.sort((a, b) => Math.abs(a - pitchIdx) - Math.abs(b - pitchIdx))
              pitchIdx = chordCandidates[0]!
            }
          }
        }
        else {
          const tone = getTone(char)
          const baseStep = tone === 0 ? 1 : -1

          if (isEmphasized) {
            pitchIdx = lastPitchIdx + (tone === 0 ? 2 : -2)
          }
          else if (category === 'tiktok') {
            // 网红曲：经典 Hook 音程跳跃
            const hookDegrees = [0, 2, 4, 2]
            const hookOffset = hookDegrees[idx % hookDegrees.length] ?? 0
            pitchIdx = targetCenter + hookOffset
          }
          else if (category === 'jazz') {
            // 爵士：半音趋近与摇摆小跳
            const jazzStep = (charHash > 0.4 ? 2 : -1) * (tone === 0 ? 1 : -1)
            pitchIdx = lastPitchIdx + jazzStep
          }
          else if (category === 'rnb') {
            // R&B：富有弹性的三度/五度切分跳跃
            pitchIdx = idx % 2 === 0 ? lastPitchIdx + 2 : lastPitchIdx - 1
          }
          else {
            pitchIdx = lastPitchIdx + baseStep
          }

          if (pitchIdx > targetCenter + 4)
            pitchIdx = targetCenter + 2
          if (pitchIdx < targetCenter - 4)
            pitchIdx = targetCenter - 2
        }

        pitchIdx = Math.max(2, Math.min(scalePitches.length - 2, pitchIdx))
        if (isVeryLastInClause && role === 'he') {
          pitchIdx = tonicIndex
        }

        lastPitchIdx = pitchIdx
        const mainP = scalePitches[pitchIdx] || scalePitches[0]!

        // 装饰音：古典夜曲注入前倚音
        if (idx === 0 && category === 'classical' && charHash > 0.35) {
          const graceP = scalePitches[Math.max(0, pitchIdx - 1)]
          if (graceP) {
            allEvents.push({
              time: Math.max(0, slotTime - 0.08),
              pitch: graceP.midi,
              duration: 0.08,
              velocity: 0.45,
              track: 'melody',
              isOrnament: true,
            })
            clauseAbc += `{${graceP.abc}}`
          }
        }

        // 一字多音拖腔
        if (hasMelisma) {
          const subP2 = scalePitches[pitchIdx + (getTone(char) === 0 ? 1 : -1)] || mainP
          const dHalf = Math.floor(durEighths / 2)
          const dRemainder = durEighths - dHalf

          allEvents.push({
            time: slotTime,
            pitch: mainP.midi,
            duration: dHalf * eighthSec * 0.95,
            velocity: 0.85,
            track: 'melody',
            char,
            noteIndex: lyricCounter,
          })
          allEvents.push({
            time: slotTime + dHalf * eighthSec,
            pitch: subP2.midi,
            duration: dRemainder * eighthSec * 0.92,
            velocity: 0.72,
            track: 'melody',
            isMelisma: true,
          })

          lyricNotes.push({ char, time: slotTime, pitch: mainP.midi, index: lyricCounter })
          lyricCounter++

          const s1 = dHalf > 1 ? String(dHalf) : ''
          const s2 = dRemainder > 1 ? String(dRemainder) : ''
          clauseAbc += `(${mainP.abc}${s1} ${subP2.abc}${s2}) `
          clauseLyrics += `${char} _ `
        }
        else {
          allEvents.push({
            time: slotTime,
            pitch: mainP.midi,
            duration: durEighths * eighthSec * 0.92,
            velocity: isEmphasized ? 0.92 : (idx === 0 ? 0.88 : 0.76),
            track: 'melody',
            char,
            noteIndex: lyricCounter,
          })

          lyricNotes.push({ char, time: slotTime, pitch: mainP.midi, index: lyricCounter })
          lyricCounter++

          const dSuffix = durEighths > 1 ? String(durEighths) : ''
          clauseAbc += `${mainP.abc}${dSuffix} `
          clauseLyrics += `${char} `
        }
      })

      // 休止符
      if (restEighths > 0) {
        clauseAbc += `z${restEighths > 1 ? restEighths : ''} `
      }
    }

    processBarChars(bar1Chars, bar1Start, bar1Chord, false, clauseSyls?.slice(0, half))
    clauseAbc += `| "${bar2Chord}" `
    processBarChars(bar2Chars, bar2Start, bar2Chord, true, clauseSyls?.slice(half))
    clauseAbc += '|'

    // 句末加花过门 (Call & Response 琴声呼应)
    const fillPitch1 = scalePitches[targetCenter + 2]?.midi || 'G5'
    const fillPitch2 = scalePitches[targetCenter]?.midi || 'E5'
    allEvents.push({
      time: bar2Start + beatSec * 3,
      pitch: fillPitch1,
      duration: eighthSec * 0.88,
      velocity: 0.52,
      track: 'counter',
    })
    allEvents.push({
      time: bar2Start + beatSec * 3.5,
      pitch: fillPitch2,
      duration: eighthSec * 0.88,
      velocity: 0.46,
      track: 'counter',
    })

    abcLines.push(clauseAbc.trim())
    abcLines.push(`w: ${clauseLyrics.trim()}`)

    currentTime += barSec * 2
  })

  // C. 【尾声 Outro】(1 小节圆满收韵)
  const outroChord = progressions.he[1]
  buildBarAccompaniment(currentTime, outroChord, false, true)

  const tonicPitch = scalePitches[tonicIndex] || scalePitches[0]!
  allEvents.push({
    time: currentTime,
    pitch: tonicPitch.midi,
    duration: barSec * 0.95,
    velocity: 0.72,
    track: 'melody',
  })
  abcLines.push(`"${outroChord}" ${tonicPitch.abc}8 |]`)
  currentTime += barSec + 0.3

  const abcNotation = abcLines.filter(line => line && line.trim().length > 0).join('\n')

  // 严格按时间戳对全部轨道音符事件进行升序排序，确保离线渲染与播放时时序单调递增
  allEvents.sort((a, b) => a.time - b.time)

  // 标准多轨 MIDI 导出
  const midiBase64 = exportMidi(allEvents, bpm)

  return {
    title,
    author,
    text,
    category,
    categoryName: catConfig.name,
    scale: scaleName || scaleDescriptions[key] || `${key} 调式 • ${catConfig.name}`,
    key,
    bpm,
    emotionTag: vector.summaryTag,
    vibeDescription: vibe,
    romanticVectorConcept: romanticVectorConcept || (key === 'Am'
      ? '将文字中幽独缠绵的相思意象，浪漫向量化为 A 小调羽调式的低吟浅唱；平声长字化作悠长延展的音符，句末叹息自然消逝于月影与琴声中。'
      : key === 'Dm'
        ? '将文字中大江奔涌、乾坤浩荡的磅礴气象，浪漫向量化为 D 商调式的慷慨长歌；旋律如飞流直下，大八度跳跃激荡出生命与时空的壮怀。'
        : key === 'Em'
          ? '将文字中空山灵籁、青苔深林的禅意，浪漫向量化为 E 角调式的纯净泛音；音符疏朗留白，如山泉滴落空谷，化作超然物外的灵性回响。'
          : key === 'G'
            ? '将文字中甘霖细雨、万物复苏的清新生机，浪漫向量化为 G 徵调式的轻盈阶梯；跳跃轻盈，如春雨润物般舒展绽放。'
            : key === 'F'
              ? '将文字中云水禅心、超然物外的出尘意象，浪漫向量化为 F 大调飘逸纯净的灵性泛音；音符如行云流水，乘风而起，飘逸悠远。'
              : '将文字中欢欣怡悦、春风拂柳的生机，浪漫向量化为 C 宫调式的明澈阶梯；明朗级进上扬，如春雨润物般舒展绽放。'),
    similarPoemTag: `【${catConfig.name}】意象量身定制`,
    durationTotal: Number(currentTime.toFixed(1)),
    events: allEvents,
    lyricNotes,
    abcNotation,
    midiBase64,
    midiFileName: `${title.replace(/\s+/g, '_')}_${category}_vec-tone.mid`,
  }
}

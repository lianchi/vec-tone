import MidiWriter from 'midi-writer-js'
import type { PresetAudioConfig } from './presets'
import type { SemanticVector } from './vectorizer'
import { getTone } from './vectorizer'

export type MusicCategory = 'classical' | 'rnb' | 'jazz' | 'tiktok'

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
  lyricNotes: Array<{ char: string, time: number, pitch: string, index: number }>
  abcNotation: string
  midiBase64: string
  midiFileName: string
}

export const CATEGORY_DEFINITIONS: Record<MusicCategory, {
  id: MusicCategory
  name: string
  emoji: string
  baseBpm: number
  desc: string
}> = {
  classical: {
    id: 'classical',
    name: '古典钢琴曲',
    emoji: '🎹',
    baseBpm: 66,
    desc: '肖邦式流水夜曲与久石让抒情，宽广流水十度大琶音与歌唱性装饰音',
  },
  rnb: {
    id: 'rnb',
    name: '流行 R&B',
    emoji: '🍷',
    baseBpm: 76,
    desc: '周杰伦/方大同都会流行 R&B，磁性离拍切分与灵魂转音 (Vocal Runs)',
  },
  jazz: {
    id: 'jazz',
    name: '爵士风情',
    emoji: '🎷',
    baseBpm: 86,
    desc: '微醺酒吧摇摆，经典 ii-V-I 扩展和弦与每拍迈步的 Walking Bass',
  },
  tiktok: {
    id: 'tiktok',
    name: '抖音网红曲',
    emoji: '🔥',
    baseBpm: 94,
    desc: '4536251 爆款神弦，4-on-the-floor 动感四击底鼓与极致抓耳 Hook',
  },
}

// 意象关键词情感权重表
const EMPHASIS_WORDS = new Set([
  '天', '地', '山', '海', '江', '河', '月', '日', '风', '云', '雪', '雨',
  '酒', '醉', '歌', '笑', '欢', '春', '生', '人', '君', '莫', '空', '愁',
  '泪', '悲', '哀', '怨', '思', '归', '别', '离', '去', '飞', '高', '长',
  '深', '远', '白', '青', '夜', '星', '梦', '心', '情', '水', '花', '落',
])

interface Voicing {
  bass: string
  pad: string[]
  arpeggio: string[]
  tones: string[]
}

const VOICINGS: Record<string, Voicing> = {
  // A minor 家族
  Am9: { bass: 'A2', pad: ['A3', 'C4', 'E4', 'B4'], arpeggio: ['A2', 'E3', 'B3', 'C4', 'E4', 'B3', 'C4', 'E3'], tones: ['A', 'C', 'E', 'B'] },
  Am11: { bass: 'A2', pad: ['A3', 'D4', 'E4', 'G4'], arpeggio: ['A2', 'E3', 'G3', 'D4', 'E4', 'D4', 'G3', 'E3'], tones: ['A', 'C', 'D', 'E', 'G'] },
  Am7: { bass: 'A2', pad: ['A3', 'C4', 'E4', 'G4'], arpeggio: ['A2', 'E3', 'G3', 'C4', 'E4', 'C4', 'G3', 'E3'], tones: ['A', 'C', 'E', 'G'] },
  Am: { bass: 'A2', pad: ['A3', 'C4', 'E4'], arpeggio: ['A2', 'E3', 'A3', 'C4', 'E4', 'C4', 'A3', 'E3'], tones: ['A', 'C', 'E'] },

  // F 家族
  Fmaj9: { bass: 'F2', pad: ['F3', 'A3', 'C4', 'G4'], arpeggio: ['F2', 'C3', 'G3', 'A3', 'C4', 'A3', 'G3', 'C3'], tones: ['F', 'A', 'C', 'G'] },
  Fmaj7: { bass: 'F2', pad: ['F3', 'A3', 'C4', 'E4'], arpeggio: ['F2', 'C3', 'E3', 'A3', 'C4', 'A3', 'E3', 'C3'], tones: ['F', 'A', 'C', 'E'] },
  F7: { bass: 'F2', pad: ['F3', 'A3', 'C4', 'Eb4'], arpeggio: ['F2', 'C3', 'Eb3', 'A3', 'C4', 'A3', 'Eb3', 'C3'], tones: ['F', 'A', 'C', 'Eb'] },
  F: { bass: 'F2', pad: ['F3', 'A3', 'C4'], arpeggio: ['F2', 'C3', 'F3', 'A3', 'C4', 'A3', 'F3', 'C3'], tones: ['F', 'A', 'C'] },

  // G 家族
  Gmaj9: { bass: 'G2', pad: ['G3', 'B3', 'D4', 'F#4'], arpeggio: ['G2', 'D3', 'F#3', 'B3', 'D4', 'B3', 'F#3', 'D3'], tones: ['G', 'B', 'D', 'F#', 'A'] },
  Gmaj7: { bass: 'G2', pad: ['G3', 'B3', 'D4', 'F#4'], arpeggio: ['G2', 'D3', 'F#3', 'B3', 'D4', 'B3', 'F#3', 'D3'], tones: ['G', 'B', 'D', 'F#'] },
  Gadd9: { bass: 'G2', pad: ['G3', 'B3', 'D4', 'A4'], arpeggio: ['G2', 'D3', 'A3', 'B3', 'D4', 'B3', 'A3', 'D3'], tones: ['G', 'B', 'D', 'A'] },
  G7sus4: { bass: 'G2', pad: ['G3', 'C4', 'D4', 'F4'], arpeggio: ['G2', 'D3', 'F3', 'C4', 'D4', 'C4', 'F3', 'D3'], tones: ['G', 'C', 'D', 'F'] },
  G7: { bass: 'G2', pad: ['G3', 'B3', 'D4', 'F4'], arpeggio: ['G2', 'D3', 'F3', 'B3', 'D4', 'B3', 'F3', 'D3'], tones: ['G', 'B', 'D', 'F'] },
  G7alt: { bass: 'G2', pad: ['G3', 'B3', 'F4', 'Ab4'], arpeggio: ['G2', 'D3', 'F3', 'Ab3', 'B3', 'Ab3', 'F3', 'D3'], tones: ['G', 'B', 'F', 'Ab'] },
  G: { bass: 'G2', pad: ['G3', 'B3', 'D4'], arpeggio: ['G2', 'D3', 'G3', 'B3', 'D4', 'B3', 'G3', 'D3'], tones: ['G', 'B', 'D'] },

  // C 家族
  Cmaj9: { bass: 'C2', pad: ['C3', 'E3', 'G3', 'D4'], arpeggio: ['C2', 'G2', 'D3', 'E3', 'G3', 'E3', 'D3', 'G2'], tones: ['C', 'E', 'G', 'D'] },
  Cmaj7: { bass: 'C2', pad: ['C3', 'E3', 'G3', 'B3'], arpeggio: ['C2', 'G2', 'B2', 'E3', 'G3', 'E3', 'B2', 'G2'], tones: ['C', 'E', 'G', 'B'] },
  Cadd9: { bass: 'C2', pad: ['C3', 'E3', 'G3', 'D4'], arpeggio: ['C2', 'G2', 'D3', 'E3', 'G3', 'E3', 'D3', 'G2'], tones: ['C', 'E', 'G', 'D'] },
  C6: { bass: 'C2', pad: ['C3', 'E3', 'A3', 'C4'], arpeggio: ['C2', 'G2', 'A2', 'E3', 'G3', 'E3', 'A2', 'G2'], tones: ['C', 'E', 'A'] },
  C9: { bass: 'C2', pad: ['C3', 'E3', 'Bb3', 'D4'], arpeggio: ['C2', 'G2', 'Bb2', 'E3', 'D4', 'E3', 'Bb2', 'G2'], tones: ['C', 'E', 'Bb', 'D'] },
  C: { bass: 'C2', pad: ['C3', 'E3', 'G3'], arpeggio: ['C2', 'G2', 'C3', 'E3', 'G3', 'E3', 'C3', 'G2'], tones: ['C', 'E', 'G'] },

  // D minor 家族
  Dm11: { bass: 'D2', pad: ['D3', 'G3', 'A3', 'C4'], arpeggio: ['D2', 'A2', 'C3', 'G3', 'A3', 'G3', 'C3', 'A2'], tones: ['D', 'F', 'G', 'A', 'C'] },
  Dm9: { bass: 'D2', pad: ['D3', 'F3', 'A3', 'E4'], arpeggio: ['D2', 'A2', 'E3', 'F3', 'A3', 'F3', 'E3', 'A2'], tones: ['D', 'F', 'A', 'E'] },
  Dm7: { bass: 'D2', pad: ['D3', 'F3', 'A3', 'C4'], arpeggio: ['D2', 'A2', 'C3', 'F3', 'A3', 'F3', 'C3', 'A2'], tones: ['D', 'F', 'A', 'C'] },
  Dm: { bass: 'D2', pad: ['D3', 'F3', 'A3'], arpeggio: ['D2', 'A2', 'D3', 'F3', 'A3', 'F3', 'D3', 'A2'], tones: ['D', 'F', 'A'] },

  // D major 家族
  D9: { bass: 'D2', pad: ['D3', 'F#3', 'A3', 'C4', 'E4'], arpeggio: ['D2', 'A2', 'C3', 'E3', 'F#3', 'E3', 'C3', 'A2'], tones: ['D', 'F#', 'A', 'C', 'E'] },
  D7: { bass: 'D2', pad: ['D3', 'F#3', 'A3', 'C4'], arpeggio: ['D2', 'A2', 'C3', 'F#3', 'A3', 'F#3', 'C3', 'A2'], tones: ['D', 'F#', 'A', 'C'] },
  D7alt: { bass: 'D2', pad: ['D3', 'F#3', 'C4', 'Eb4'], arpeggio: ['D2', 'A2', 'C3', 'Eb3', 'F#3', 'Eb3', 'C3', 'A2'], tones: ['D', 'F#', 'C', 'Eb'] },
  D: { bass: 'D2', pad: ['D3', 'F#3', 'A3'], arpeggio: ['D2', 'A2', 'D3', 'F#3', 'A3', 'F#3', 'D3', 'A2'], tones: ['D', 'F#', 'A'] },

  // E minor 家族
  Em9: { bass: 'E2', pad: ['E3', 'G3', 'B3', 'F#4'], arpeggio: ['E2', 'B2', 'F#3', 'G3', 'B3', 'G3', 'F#3', 'B2'], tones: ['E', 'G', 'B', 'F#'] },
  Em7: { bass: 'E2', pad: ['E3', 'G3', 'B3', 'D4'], arpeggio: ['E2', 'B2', 'D3', 'G3', 'B3', 'G3', 'D3', 'B2'], tones: ['E', 'G', 'B', 'D'] },
  Em7b5: { bass: 'E2', pad: ['E3', 'G3', 'Bb3', 'D4'], arpeggio: ['E2', 'Bb2', 'D3', 'G3', 'Bb3', 'G3', 'D3', 'Bb2'], tones: ['E', 'G', 'Bb', 'D'] },
  Em: { bass: 'E2', pad: ['E3', 'G3', 'B3'], arpeggio: ['E2', 'B2', 'E3', 'G3', 'B3', 'G3', 'E3', 'B2'], tones: ['E', 'G', 'B'] },
  E7: { bass: 'E2', pad: ['E3', 'G#3', 'B3', 'D4'], arpeggio: ['E2', 'B2', 'D3', 'G#3', 'B3', 'G#3', 'D3', 'B2'], tones: ['E', 'G#', 'B', 'D'] },
  E7alt: { bass: 'E2', pad: ['E3', 'G#3', 'D4', 'F4'], arpeggio: ['E2', 'B2', 'D3', 'F3', 'G#3', 'F3', 'D3', 'B2'], tones: ['E', 'G#', 'D', 'F'] },

  // Bb 家族
  Bbmaj9: { bass: 'Bb2', pad: ['Bb3', 'D4', 'F4', 'C5'], arpeggio: ['Bb2', 'F3', 'C4', 'D4', 'F4', 'D4', 'C4', 'F3'], tones: ['Bb', 'D', 'F', 'C'] },
  Bbmaj7: { bass: 'Bb2', pad: ['Bb3', 'D4', 'F4', 'A4'], arpeggio: ['Bb2', 'F3', 'A3', 'D4', 'F4', 'D4', 'A3', 'F3'], tones: ['Bb', 'D', 'F', 'A'] },
  Bb7: { bass: 'Bb2', pad: ['Bb3', 'D4', 'F4', 'Ab4'], arpeggio: ['Bb2', 'F3', 'Ab3', 'D4', 'F4', 'D4', 'Ab3', 'F3'], tones: ['Bb', 'D', 'F', 'Ab'] },
  Bb: { bass: 'Bb2', pad: ['Bb3', 'D4', 'F4'], arpeggio: ['Bb2', 'F3', 'Bb3', 'D4', 'F4', 'D4', 'Bb3', 'F3'], tones: ['Bb', 'D', 'F'] },

  // G minor 家族
  Gm11: { bass: 'G2', pad: ['G3', 'C4', 'D4', 'F4'], arpeggio: ['G2', 'D3', 'F3', 'C4', 'D4', 'C4', 'F3', 'D3'], tones: ['G', 'Bb', 'C', 'D', 'F'] },
  Gm9: { bass: 'G2', pad: ['G3', 'Bb3', 'D4', 'A4'], arpeggio: ['G2', 'D3', 'A3', 'Bb3', 'D4', 'Bb3', 'A3', 'D3'], tones: ['G', 'Bb', 'D', 'A'] },
  Gm7: { bass: 'G2', pad: ['G3', 'Bb3', 'D4', 'F4'], arpeggio: ['G2', 'D3', 'F3', 'Bb3', 'D4', 'Bb3', 'F3', 'D3'], tones: ['G', 'Bb', 'D', 'F'] },
  Gm: { bass: 'G2', pad: ['G3', 'Bb3', 'D4'], arpeggio: ['G2', 'D3', 'G3', 'Bb3', 'D4', 'Bb3', 'G3', 'D3'], tones: ['G', 'Bb', 'D'] },

  // A 属和弦家族
  A7alt: { bass: 'A2', pad: ['A3', 'C#4', 'G4', 'Bb4'], arpeggio: ['A2', 'E3', 'G3', 'Bb3', 'C#4', 'Bb3', 'G3', 'E3'], tones: ['A', 'C#', 'G', 'Bb'] },
  A7sus4: { bass: 'A2', pad: ['A3', 'D4', 'E4', 'G4'], arpeggio: ['A2', 'E3', 'G3', 'D4', 'E4', 'D4', 'G3', 'E3'], tones: ['A', 'D', 'E', 'G'] },
  A7: { bass: 'A2', pad: ['A3', 'C#4', 'E4', 'G4'], arpeggio: ['A2', 'E3', 'G3', 'C#4', 'E4', 'C#4', 'G3', 'E3'], tones: ['A', 'C#', 'E', 'G'] },

  // B 半减七与变化家族
  Bm7b5: { bass: 'B2', pad: ['B3', 'D4', 'F4', 'A4'], arpeggio: ['B2', 'F3', 'A3', 'D4', 'F4', 'D4', 'A3', 'F3'], tones: ['B', 'D', 'F', 'A'] },
  Bm7: { bass: 'B2', pad: ['B3', 'D4', 'F#4', 'A4'], arpeggio: ['B2', 'F#3', 'A3', 'D4', 'F#4', 'D4', 'A3', 'F#3'], tones: ['B', 'D', 'F#', 'A'] },
  B7alt: { bass: 'B2', pad: ['B3', 'D#4', 'A4', 'C5'], arpeggio: ['B2', 'F#3', 'A3', 'C4', 'D#4', 'C4', 'A3', 'F#3'], tones: ['B', 'D#', 'A', 'C'] },

  // F# 半减七
  'F#m7b5': { bass: 'F#2', pad: ['F#3', 'A3', 'C4', 'E4'], arpeggio: ['F#2', 'C3', 'E3', 'A3', 'C4', 'A3', 'E3', 'C3'], tones: ['F#', 'A', 'C', 'E'] },
}

function getVoicing(name: string): Voicing {
  if (VOICINGS[name])
    return VOICINGS[name]

  const clean = name.replace(/["\s]/g, '')
  if (VOICINGS[clean])
    return VOICINGS[clean]

  const base7 = clean.replace(/11|9|alt|sus4|b5/, '7')
  if (VOICINGS[base7])
    return VOICINGS[base7]

  const simple = clean.replace(/maj\d*|m\d*|\d+|alt|sus4|b5/g, '')
  if (clean.includes('m') && !clean.includes('maj')) {
    if (VOICINGS[`${simple}m`])
      return VOICINGS[`${simple}m`]!
  }
  if (VOICINGS[simple])
    return VOICINGS[simple]!

  return VOICINGS.Am9!
}

// 调式音高池
const SCALES = {
  // A 小调五声 / 自然小调 (凄清深情)
  Am: [
    { midi: 'E3', abc: 'E,' }, { midi: 'G3', abc: 'G,' },
    { midi: 'A3', abc: 'A,' }, { midi: 'B3', abc: 'B,' },
    { midi: 'C4', abc: 'C' }, { midi: 'D4', abc: 'D' },
    { midi: 'E4', abc: 'E' }, { midi: 'G4', abc: 'G' },
    { midi: 'A4', abc: 'A' }, { midi: 'B4', abc: 'B' },
    { midi: 'C5', abc: 'c' }, { midi: 'D5', abc: 'd' },
    { midi: 'E5', abc: 'e' }, { midi: 'G5', abc: 'g' },
    { midi: 'A5', abc: 'a' }, { midi: 'C6', abc: 'c\'' },
  ],
  // D 小调商调式 (豪放慷慨)
  Dm: [
    { midi: 'A3', abc: 'A,' }, { midi: 'C4', abc: 'C' },
    { midi: 'D4', abc: 'D' }, { midi: 'E4', abc: 'E' },
    { midi: 'F4', abc: 'F' }, { midi: 'G4', abc: 'G' },
    { midi: 'A4', abc: 'A' }, { midi: 'C5', abc: 'c' },
    { midi: 'D5', abc: 'd' }, { midi: 'E5', abc: 'e' },
    { midi: 'F5', abc: 'f' }, { midi: 'G5', abc: 'g' },
    { midi: 'A5', abc: 'a' }, { midi: 'C6', abc: 'c\'' },
    { midi: 'D6', abc: 'd\'' },
  ],
  // E 小调角调式 (空灵禅寂)
  Em: [
    { midi: 'B3', abc: 'B,' }, { midi: 'D4', abc: 'D' },
    { midi: 'E4', abc: 'E' }, { midi: 'G4', abc: 'G' },
    { midi: 'A4', abc: 'A' }, { midi: 'B4', abc: 'B' },
    { midi: 'D5', abc: 'd' }, { midi: 'E5', abc: 'e' },
    { midi: 'G5', abc: 'g' }, { midi: 'A5', abc: 'a' },
    { midi: 'B5', abc: 'b' }, { midi: 'D6', abc: 'd\'' },
    { midi: 'E6', abc: 'e\'' },
  ],
  // C 大调宫调式 (明朗怡悦)
  C: [
    { midi: 'G3', abc: 'G,' }, { midi: 'A3', abc: 'A,' },
    { midi: 'C4', abc: 'C' }, { midi: 'D4', abc: 'D' },
    { midi: 'E4', abc: 'E' }, { midi: 'G4', abc: 'G' },
    { midi: 'A4', abc: 'A' }, { midi: 'C5', abc: 'c' },
    { midi: 'D5', abc: 'd' }, { midi: 'E5', abc: 'e' },
    { midi: 'G5', abc: 'g' }, { midi: 'A5', abc: 'a' },
    { midi: 'C6', abc: 'c\'' }, { midi: 'D6', abc: 'd\'' },
  ],
  // G 大调 / 徵调式 (清朗明快，山林晨光)
  G: [
    { midi: 'D3', abc: 'D,' }, { midi: 'E3', abc: 'E,' },
    { midi: 'G3', abc: 'G,' }, { midi: 'A3', abc: 'A,' },
    { midi: 'B3', abc: 'B,' }, { midi: 'D4', abc: 'D' },
    { midi: 'E4', abc: 'E' }, { midi: 'G4', abc: 'G' },
    { midi: 'A4', abc: 'A' }, { midi: 'B4', abc: 'B' },
    { midi: 'D5', abc: 'd' }, { midi: 'E5', abc: 'e' },
    { midi: 'G5', abc: 'g' }, { midi: 'A5', abc: 'a' },
    { midi: 'B5', abc: 'b' }, { midi: 'D6', abc: 'd\'' },
  ],
  // F 大调 / 飘逸出尘
  F: [
    { midi: 'C3', abc: 'C,' }, { midi: 'D3', abc: 'D,' },
    { midi: 'F3', abc: 'F,' }, { midi: 'G3', abc: 'G,' },
    { midi: 'A3', abc: 'A,' }, { midi: 'C4', abc: 'C' },
    { midi: 'D4', abc: 'D' }, { midi: 'F4', abc: 'F' },
    { midi: 'G4', abc: 'G' }, { midi: 'A4', abc: 'A' },
    { midi: 'C5', abc: 'c' }, { midi: 'D5', abc: 'd' },
    { midi: 'F5', abc: 'f' }, { midi: 'G5', abc: 'g' },
    { midi: 'A5', abc: 'a' }, { midi: 'C6', abc: 'c\'' },
  ],
}

/**
 * 字符串确定性哈希
 */
function hashString(str: string, seed = 0): number {
  let h = 0x811c9dc5 ^ seed
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0) / 4294967296
}

/**
 * 根据诗词意象与风格，选择最具代表性与差异化的调号与和弦套路
 */
function resolveMusicalDNA(vector: SemanticVector, category: MusicCategory) {
  const theme = vector.dominantTheme

  // 1. 根据诗词情感意境确定调号 Key
  let key: 'Am' | 'Dm' | 'Em' | 'C' = 'Am'
  let vibe = ''

  if (theme === 'heroic_grand') {
    // 豪放壮阔 (如《将进酒》《登高》)
    key = 'Dm'
    vibe = '苍茫壮阔 · 大江大河豪迈跌宕'
  }
  else if (theme === 'zen_nature') {
    // 空灵禅寂 (如《鹿柴》《山居秋暝》)
    key = 'Em'
    vibe = '松石流泉 · 空山灵籁禅寂超然'
  }
  else if (theme === 'lyrical_tender') {
    // 欢欣明朗 (如《春夜喜雨》《水调歌头》)
    key = 'C'
    vibe = '韶华春意 · 典雅从容欢欣明净'
  }
  else {
    // 凄楚相思 (如《望月怀远》《锦瑟》)
    key = 'Am'
    vibe = '幽独凄清 · 烟雨江南深情相思'
  }

  // 2. 结合 4 大工业风格与意境生成专属的和弦行进 (彻底告别雷同！)
  let progressions: {
    qi: [string, string]
    cheng: [string, string]
    zhuan: [string, string]
    he: [string, string]
  }

  if (category === 'classical') {
    // 古典钢琴曲：肖邦夜曲与久石让流水织体
    if (key === 'Dm') {
      progressions = {
        qi: ['Dm9', 'Bbmaj7'],
        cheng: ['Cadd9', 'Am7'],
        zhuan: ['Gm7', 'A7'],
        he: ['Bbmaj7', 'Dm9'],
      }
    }
    else if (key === 'Em') {
      progressions = {
        qi: ['Em9', 'Cmaj7'],
        cheng: ['Dadd9', 'Bm7'],
        zhuan: ['Am7', 'Dadd9'],
        he: ['Cmaj7', 'Em9'],
      }
    }
    else if (key === 'C') {
      progressions = {
        qi: ['Cmaj7', 'Gadd9'],
        cheng: ['Am7', 'Em7'],
        zhuan: ['Fmaj7', 'G7'],
        he: ['Dm7', 'C'],
      }
    }
    else {
      progressions = {
        qi: ['Am9', 'Fmaj7'],
        cheng: ['Cadd9', 'Em7'],
        zhuan: ['Dm7', 'E7'],
        he: ['Fmaj7', 'Am9'],
      }
    }
  }
  else if (category === 'rnb') {
    // 流行 R&B：Neo-Soul / 周杰伦式 9度/11度切分和弦
    if (key === 'Dm') {
      progressions = {
        qi: ['Dm9', 'Bbmaj7'],
        cheng: ['C9', 'Am7'],
        zhuan: ['Gm7', 'C9'],
        he: ['Bbmaj7', 'Dm9'],
      }
    }
    else if (key === 'Em') {
      progressions = {
        qi: ['Em9', 'Cmaj9'],
        cheng: ['Dadd9', 'Am7'],
        zhuan: ['Am7', 'Dadd9'],
        he: ['Cmaj9', 'Em9'],
      }
    }
    else {
      progressions = {
        qi: ['Fmaj9', 'Em7'],
        cheng: ['Dm9', 'Am9'],
        zhuan: ['Bbmaj7', 'C9'],
        he: ['Dm9', 'Am9'],
      }
    }
  }
  else if (category === 'jazz') {
    // 爵士风情：经典 ii - V - I - VI 转角与替代和弦
    progressions = {
      qi: ['Dm7', 'G7'],
      cheng: ['Cmaj7', 'Am7'],
      zhuan: ['Dm7', 'G7alt'],
      he: ['Cmaj7', 'C6'],
    }
  }
  else {
    // 抖音网红曲：4536251 与卡农流行爆款进行
    progressions = {
      qi: ['Fmaj7', 'G'],
      cheng: ['Em7', 'Am7'],
      zhuan: ['Dm7', 'G7'],
      he: ['C', 'C'],
    }
  }

  // 3. 动态速度调节 (根据 Arousal 唤醒度做弹性偏移)
  const catConfig = CATEGORY_DEFINITIONS[category]
  const speedDelta = Math.round((vector.arousal - 0.4) * 12)
  const bpm = Math.max(54, Math.min(115, catConfig.baseBpm + speedDelta))

  return { key, vibe, progressions, bpm }
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
    scaleName = ai.scale || `${key} 调式 · ${catConfig.name}`
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
      vibe = `${pc.vibeDescription.split('·')[0]?.trim() || '都会流光'} · 灵魂切分律动`
    }
    else if (category === 'jazz') {
      bpm = Math.max(88, Math.min(98, Math.round((pc.bpm || 64) * 1.44)))
      scaleName = `${key} 微醺摇摆爵士调式 (Swing 漫步风情)`
      vibe = `${pc.vibeDescription.split('·')[0]?.trim() || '微醺酒馆'} · 行走贝斯摇摆`
    }
    else {
      // tiktok
      bpm = Math.max(104, Math.min(116, Math.round((pc.bpm || 64) * 1.68)))
      scaleName = `${key} 抖音网红 4536251 爆款律动`
      vibe = `${pc.vibeDescription.split('·')[0]?.trim() || '动感洗脑'} · 4-on-the-floor 律动`
    }
  }
  else {
    const dna = resolveMusicalDNA(vector, category)
    key = dna.key
    vibe = dna.vibe
    progressions = dna.progressions
    bpm = dna.bpm
    scaleName = `${key} 调式 · ${catConfig.name}`
  }

  const scalePitches = (SCALES as Record<string, typeof SCALES.Am>)[key] || SCALES.Am
  const beatSec = 60 / bpm
  const eighthSec = beatSec / 2
  const sixteenthSec = beatSec / 4
  const barSec = beatSec * 4

  // 分解诗句
  const rawClauses = text.split(/([，。？！；\n\r]+)/).filter(Boolean)
  const clauses: string[] = []
  for (let i = 0; i < rawClauses.length; i += 2) {
    const s = rawClauses[i]?.trim()
    if (s)
      clauses.push(s)
  }
  if (!clauses.length && text.trim())
    clauses.push(text.trim())

  const title = options.title || (clauses[0]?.slice(0, 8) || '无题')
  const author = options.author || ''

  const allEvents: MusicEvent[] = []
  const lyricNotes: CompositionResult['lyricNotes'] = []
  let currentTime = 0.25

  // 伴奏生成：根据类别与诗词和弦生成
  function buildBarAccompaniment(barStart: number, chordName: string, isZhuan = false, isOutro = false) {
    const voicing = getVoicing(chordName)

    // 1. 低音 Bass
    if (category === 'jazz') {
      // 爵士 Walking Bass (每拍迈步 1, 2, 3, 4，半音趋近)
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
    else if (category === 'tiktok') {
      // 抖音网红曲：八分音符律动泵感低音 (Pumping bass)
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
    else {
      // 古典 / R&B：呼吸式扎实低音
      allEvents.push({
        time: barStart,
        pitch: voicing.bass,
        duration: isOutro ? barSec * 1.6 : barSec * 0.95,
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

    // 2. 温暖弦乐氛围垫 Pad
    if (!isOutro) {
      voicing.pad.forEach((p) => {
        allEvents.push({
          time: barStart,
          pitch: p,
          duration: barSec * 0.98,
          velocity: 0.26,
          track: 'pad',
        })
      })
    }

    // 3. 伴奏织体 (Arpeggio / Comping)
    if (!isOutro) {
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
    const chars = clause.split('')
    const role = roles[cIdx % 4] || 'qi'
    const chords = progressions[role]
    const bar1Chord = chords[0] || 'Am9'
    const bar2Chord = chords[1] || bar1Chord

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

    function processBarChars(cList: string[], barStartTime: number, activeChord: string, isSecond: boolean) {
      const voicing = getVoicing(activeChord)
      const count = cList.length
      if (count === 0)
        return

      // 根据 4 大音乐流派分配专属的节奏型格（总时值严格为 8 个八分音符，即 4/4 拍一整个小节）
      let durations: number[] = []
      let restEighths = 0

      if (!isSecond) {
        // 第一小节 (Bar 1)
        if (category === 'rnb') {
          // 流行 R&B：经典离拍切分 (前附点 3 + 离拍十六分 1 + 持续 4)
          if (count === 2)
            durations = [3, 5]
          else if (count === 3)
            durations = [3, 1, 4]
          else if (count === 4)
            durations = [3, 1, 2, 2]
          else
            durations = cList.map((_, i) => (i === 0 ? 3 : i === 1 ? 1 : Math.max(1, Math.floor(4 / (count - 2)))))
        }
        else if (category === 'jazz') {
          // 爵士风情：Swing 摇摆长短切分 (3 + 2 + 3)
          if (count === 2)
            durations = [4, 4]
          else if (count === 3)
            durations = [3, 2, 3]
          else if (count === 4)
            durations = [2, 2, 2, 2]
          else
            durations = cList.map(() => Math.max(1, Math.floor(8 / count)))
        }
        else if (category === 'tiktok') {
          // 抖音网红曲：短促抓耳四分音符 Hook，小节末留出 2 拍空间给动感大底鼓 (2 + 2 + 2 + z2)
          if (count === 2) {
            durations = [2, 2]
            restEighths = 4
          }
          else if (count === 3) {
            durations = [2, 2, 2]
            restEighths = 2
          }
          else if (count === 4) {
            durations = [2, 2, 2, 2]
            restEighths = 0
          }
          else {
            durations = cList.map(() => 1)
            restEighths = Math.max(0, 8 - count)
          }
        }
        else {
          // 古典钢琴曲：肖邦夜曲歌唱性长音与流水线条 (2 + 2 + 4)
          if (count === 2)
            durations = [4, 4]
          else if (count === 3)
            durations = [2, 2, 4]
          else if (count === 4)
            durations = [2, 2, 2, 2]
          else
            durations = cList.map(() => Math.max(1, Math.floor(8 / count)))
        }
      }
      else {
        // 第二小节 (Bar 2，句尾收韵并接引过门)
        if (category === 'rnb') {
          if (count === 2) {
            durations = [3, 3]
            restEighths = 2
          }
          else if (count === 3) {
            durations = [3, 1, 2]
            restEighths = 2
          }
          else {
            durations = [2, 2, 2]
            restEighths = 2
          }
        }
        else if (category === 'tiktok') {
          if (count === 2) {
            durations = [2, 2]
            restEighths = 4
          }
          else if (count === 3) {
            durations = [2, 2, 2]
            restEighths = 2
          }
          else {
            durations = [2, 2, 2]
            restEighths = 2
          }
        }
        else if (category === 'jazz') {
          if (count === 2) {
            durations = [2, 4]
            restEighths = 2
          }
          else if (count === 3) {
            durations = [3, 2, 1]
            restEighths = 2
          }
          else {
            durations = [2, 2, 2]
            restEighths = 2
          }
        }
        else {
          // classical
          if (count === 2) {
            durations = [2, 4]
            restEighths = 2
          }
          else if (count === 3) {
            durations = [2, 2, 2]
            restEighths = 2
          }
          else {
            durations = [2, 2, 2]
            restEighths = 2
          }
        }
      }

      // 严格校准总时值为 8 个八分音符 (4/4 拍)
      const usedEighths = durations.reduce((a, b) => a + b, 0)
      if (usedEighths + restEighths < 8) {
        restEighths = 8 - usedEighths
      }
      else if (usedEighths > 8) {
        const factor = 8 / usedEighths
        durations = durations.map(d => Math.max(1, Math.round(d * factor)))
        restEighths = 0
      }

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

        // 音高算法
        let pitchIdx = lastPitchIdx
        const charHash = hashString(char + cIdx + title, 107)

        if (idx === 0) {
          const candidates: number[] = []
          scalePitches.forEach((p: { midi: string; abc: string }, pIdx: number) => {
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

    processBarChars(bar1Chars, bar1Start, bar1Chord, false)
    clauseAbc += `| "${bar2Chord}" `
    processBarChars(bar2Chars, bar2Start, bar2Chord, true)
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
    duration: barSec * 1.5,
    velocity: 0.72,
    track: 'melody',
  })
  abcLines.push(`"${outroChord}" ${tonicPitch.abc}8 |]`)
  currentTime += barSec * 1.6

  const abcNotation = abcLines.filter(line => line && line.trim().length > 0).join('\n')

  // 标准多轨 MIDI 导出
  const melodyTrack = new MidiWriter.Track()
  melodyTrack.setTempo(bpm)
  melodyTrack.setTimeSignature(4, 4)
  melodyTrack.addTrackName('Lead Melody')

  const chordTrack = new MidiWriter.Track()
  chordTrack.setTempo(bpm)
  chordTrack.addTrackName('Accompaniment')

  const bassTrack = new MidiWriter.Track()
  bassTrack.setTempo(bpm)
  bassTrack.addTrackName('Bass')

  const sortedEvents = [...allEvents].sort((a, b) => a.time - b.time)

  function addEventsToTrack(track: any, evts: MusicEvent[]) {
    let lastTime = 0
    evts.forEach((e) => {
      const waitTime = e.time - lastTime
      if (waitTime > 0.04) {
        track.addEvent(new (MidiWriter.NoteEvent as any)({
          pitch: ['C4'],
          duration: '16',
          velocity: 0,
          wait: `T${Math.round(waitTime * 1000)}`,
        }))
      }
      const durBeats = Math.max(1, Math.round(e.duration / eighthSec))
      const mwDuration = durBeats >= 8 ? '1' : durBeats >= 4 ? '2' : durBeats >= 2 ? '4' : '8'
      track.addEvent(new MidiWriter.NoteEvent({
        pitch: [e.pitch],
        duration: mwDuration,
        velocity: Math.round(e.velocity * 127),
      }))
      lastTime = e.time + e.duration
    })
  }

  addEventsToTrack(melodyTrack, sortedEvents.filter(e => e.track === 'melody'))
  addEventsToTrack(chordTrack, sortedEvents.filter(e => e.track === 'chord'))
  addEventsToTrack(bassTrack, sortedEvents.filter(e => e.track === 'bass'))

  const writer = new MidiWriter.Writer([melodyTrack, chordTrack, bassTrack])
  const midiBase64 = writer.base64()

  const scaleDescriptions: Record<string, string> = {
    Am: 'A 小调羽调式 (凄美相思)',
    Dm: 'D 小调商调式 (慷慨壮阔)',
    Em: 'E 小调角调式 (松石禅寂)',
    C: 'C 大调宫调式 (明朗怡悦)',
  }

  return {
    title,
    author,
    text,
    category,
    categoryName: catConfig.name,
    scale: scaleName || scaleDescriptions[key] || `${key} 调式 · ${catConfig.name}`,
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

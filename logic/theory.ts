import type { SemanticVector } from './vectorizer'

export type MusicCategory = 'classical' | 'rnb' | 'jazz' | 'tiktok'

export const CATEGORY_DEFINITIONS: Record<MusicCategory, {
  id: MusicCategory
  name: string
  emoji: string
  baseBpm: number
  desc: string
}> = {
  classical: {
    id: 'classical',
    name: '古典',
    emoji: '🎹',
    baseBpm: 66,
    desc: '肖邦式流水夜曲与久石让抒情，宽广流水十度大琶音与歌唱性装饰音',
  },
  rnb: {
    id: 'rnb',
    name: '流行',
    emoji: '🍷',
    baseBpm: 76,
    desc: '周杰伦/方大同都会流行 R&B，磁性离拍切分与灵魂转音 (Vocal Runs)',
  },
  jazz: {
    id: 'jazz',
    name: '爵士',
    emoji: '🎷',
    baseBpm: 86,
    desc: '微醺酒吧摇摆，经典 ii-V-I 扩展和弦与每拍迈步的 Walking Bass',
  },
  tiktok: {
    id: 'tiktok',
    name: '网红',
    emoji: '🔥',
    baseBpm: 94,
    desc: '4536251 爆款神弦，4-on-the-floor 动感四击底鼓与极致抓耳 Hook',
  },
}

export interface Voicing {
  bass: string
  pad: string[]
  arpeggio: string[]
  tones: string[]
}

export const VOICINGS: Record<string, Voicing> = {
  // A minor 家族
  'Am9': { bass: 'A2', pad: ['A3', 'C4', 'E4', 'B4'], arpeggio: ['A2', 'E3', 'B3', 'C4', 'E4', 'B3', 'C4', 'E3'], tones: ['A', 'C', 'E', 'B'] },
  'Am11': { bass: 'A2', pad: ['A3', 'D4', 'E4', 'G4'], arpeggio: ['A2', 'E3', 'G3', 'D4', 'E4', 'D4', 'G3', 'E3'], tones: ['A', 'C', 'D', 'E', 'G'] },
  'Am7': { bass: 'A2', pad: ['A3', 'C4', 'E4', 'G4'], arpeggio: ['A2', 'E3', 'G3', 'C4', 'E4', 'C4', 'G3', 'E3'], tones: ['A', 'C', 'E', 'G'] },
  'Am': { bass: 'A2', pad: ['A3', 'C4', 'E4'], arpeggio: ['A2', 'E3', 'A3', 'C4', 'E4', 'C4', 'A3', 'E3'], tones: ['A', 'C', 'E'] },

  // F 家族
  'Fmaj9': { bass: 'F2', pad: ['F3', 'A3', 'C4', 'G4'], arpeggio: ['F2', 'C3', 'G3', 'A3', 'C4', 'A3', 'G3', 'C3'], tones: ['F', 'A', 'C', 'G'] },
  'Fmaj7': { bass: 'F2', pad: ['F3', 'A3', 'C4', 'E4'], arpeggio: ['F2', 'C3', 'E3', 'A3', 'C4', 'A3', 'E3', 'C3'], tones: ['F', 'A', 'C', 'E'] },
  'F7': { bass: 'F2', pad: ['F3', 'A3', 'C4', 'Eb4'], arpeggio: ['F2', 'C3', 'Eb3', 'A3', 'C4', 'A3', 'Eb3', 'C3'], tones: ['F', 'A', 'C', 'Eb'] },
  'F': { bass: 'F2', pad: ['F3', 'A3', 'C4'], arpeggio: ['F2', 'C3', 'F3', 'A3', 'C4', 'A3', 'F3', 'C3'], tones: ['F', 'A', 'C'] },

  // G 家族
  'Gmaj9': { bass: 'G2', pad: ['G3', 'B3', 'D4', 'F#4'], arpeggio: ['G2', 'D3', 'F#3', 'B3', 'D4', 'B3', 'F#3', 'D3'], tones: ['G', 'B', 'D', 'F#', 'A'] },
  'Gmaj7': { bass: 'G2', pad: ['G3', 'B3', 'D4', 'F#4'], arpeggio: ['G2', 'D3', 'F#3', 'B3', 'D4', 'B3', 'F#3', 'D3'], tones: ['G', 'B', 'D', 'F#'] },
  'Gadd9': { bass: 'G2', pad: ['G3', 'B3', 'D4', 'A4'], arpeggio: ['G2', 'D3', 'A3', 'B3', 'D4', 'B3', 'A3', 'D3'], tones: ['G', 'B', 'D', 'A'] },
  'G7sus4': { bass: 'G2', pad: ['G3', 'C4', 'D4', 'F4'], arpeggio: ['G2', 'D3', 'F3', 'C4', 'D4', 'C4', 'F3', 'D3'], tones: ['G', 'C', 'D', 'F'] },
  'G7': { bass: 'G2', pad: ['G3', 'B3', 'D4', 'F4'], arpeggio: ['G2', 'D3', 'F3', 'B3', 'D4', 'B3', 'F3', 'D3'], tones: ['G', 'B', 'D', 'F'] },
  'G7alt': { bass: 'G2', pad: ['G3', 'B3', 'F4', 'Ab4'], arpeggio: ['G2', 'D3', 'F3', 'Ab3', 'B3', 'Ab3', 'F3', 'D3'], tones: ['G', 'B', 'F', 'Ab'] },
  'G': { bass: 'G2', pad: ['G3', 'B3', 'D4'], arpeggio: ['G2', 'D3', 'G3', 'B3', 'D4', 'B3', 'G3', 'D3'], tones: ['G', 'B', 'D'] },

  // C 家族
  'Cmaj9': { bass: 'C2', pad: ['C3', 'E3', 'G3', 'D4'], arpeggio: ['C2', 'G2', 'D3', 'E3', 'G3', 'E3', 'D3', 'G2'], tones: ['C', 'E', 'G', 'D'] },
  'Cmaj7': { bass: 'C2', pad: ['C3', 'E3', 'G3', 'B3'], arpeggio: ['C2', 'G2', 'B2', 'E3', 'G3', 'E3', 'B2', 'G2'], tones: ['C', 'E', 'G', 'B'] },
  'Cadd9': { bass: 'C2', pad: ['C3', 'E3', 'G3', 'D4'], arpeggio: ['C2', 'G2', 'D3', 'E3', 'G3', 'E3', 'D3', 'G2'], tones: ['C', 'E', 'G', 'D'] },
  'C6': { bass: 'C2', pad: ['C3', 'E3', 'A3', 'C4'], arpeggio: ['C2', 'G2', 'A2', 'E3', 'G3', 'E3', 'A2', 'G2'], tones: ['C', 'E', 'A'] },
  'C9': { bass: 'C2', pad: ['C3', 'E3', 'Bb3', 'D4'], arpeggio: ['C2', 'G2', 'Bb2', 'E3', 'D4', 'E3', 'Bb2', 'G2'], tones: ['C', 'E', 'Bb', 'D'] },
  'C': { bass: 'C2', pad: ['C3', 'E3', 'G3'], arpeggio: ['C2', 'G2', 'C3', 'E3', 'G3', 'E3', 'C3', 'G2'], tones: ['C', 'E', 'G'] },

  // D minor 家族
  'Dm11': { bass: 'D2', pad: ['D3', 'G3', 'A3', 'C4'], arpeggio: ['D2', 'A2', 'C3', 'G3', 'A3', 'G3', 'C3', 'A2'], tones: ['D', 'F', 'G', 'A', 'C'] },
  'Dm9': { bass: 'D2', pad: ['D3', 'F3', 'A3', 'E4'], arpeggio: ['D2', 'A2', 'E3', 'F3', 'A3', 'F3', 'E3', 'A2'], tones: ['D', 'F', 'A', 'E'] },
  'Dm7': { bass: 'D2', pad: ['D3', 'F3', 'A3', 'C4'], arpeggio: ['D2', 'A2', 'C3', 'F3', 'A3', 'F3', 'C3', 'A2'], tones: ['D', 'F', 'A', 'C'] },
  'Dm': { bass: 'D2', pad: ['D3', 'F3', 'A3'], arpeggio: ['D2', 'A2', 'D3', 'F3', 'A3', 'F3', 'D3', 'A2'], tones: ['D', 'F', 'A'] },

  // D major 家族
  'Dadd9': { bass: 'D2', pad: ['D3', 'F#3', 'A3', 'E4'], arpeggio: ['D2', 'A2', 'E3', 'F#3', 'A3', 'F#3', 'E3', 'A2'], tones: ['D', 'F#', 'A', 'E'] },
  'D7sus4': { bass: 'D2', pad: ['D3', 'G3', 'A3', 'C4'], arpeggio: ['D2', 'A2', 'C3', 'G3', 'A3', 'G3', 'C3', 'A2'], tones: ['D', 'G', 'A', 'C'] },
  'D9': { bass: 'D2', pad: ['D3', 'F#3', 'A3', 'C4', 'E4'], arpeggio: ['D2', 'A2', 'C3', 'E3', 'F#3', 'E3', 'C3', 'A2'], tones: ['D', 'F#', 'A', 'C', 'E'] },
  'D7': { bass: 'D2', pad: ['D3', 'F#3', 'A3', 'C4'], arpeggio: ['D2', 'A2', 'C3', 'F#3', 'A3', 'F#3', 'C3', 'A2'], tones: ['D', 'F#', 'A', 'C'] },
  'D7alt': { bass: 'D2', pad: ['D3', 'F#3', 'C4', 'Eb4'], arpeggio: ['D2', 'A2', 'C3', 'Eb3', 'F#3', 'Eb3', 'C3', 'A2'], tones: ['D', 'F#', 'C', 'Eb'] },
  'D': { bass: 'D2', pad: ['D3', 'F#3', 'A3'], arpeggio: ['D2', 'A2', 'D3', 'F#3', 'A3', 'F#3', 'D3', 'A2'], tones: ['D', 'F#', 'A'] },

  // E minor 家族
  'Em9': { bass: 'E2', pad: ['E3', 'G3', 'B3', 'F#4'], arpeggio: ['E2', 'B2', 'F#3', 'G3', 'B3', 'G3', 'F#3', 'B2'], tones: ['E', 'G', 'B', 'F#'] },
  'Em7': { bass: 'E2', pad: ['E3', 'G3', 'B3', 'D4'], arpeggio: ['E2', 'B2', 'D3', 'G3', 'B3', 'G3', 'D3', 'B2'], tones: ['E', 'G', 'B', 'D'] },
  'Em7b5': { bass: 'E2', pad: ['E3', 'G3', 'Bb3', 'D4'], arpeggio: ['E2', 'Bb2', 'D3', 'G3', 'Bb3', 'G3', 'D3', 'Bb2'], tones: ['E', 'G', 'Bb', 'D'] },
  'Em': { bass: 'E2', pad: ['E3', 'G3', 'B3'], arpeggio: ['E2', 'B2', 'E3', 'G3', 'B3', 'G3', 'E3', 'B2'], tones: ['E', 'G', 'B'] },
  'E7': { bass: 'E2', pad: ['E3', 'G#3', 'B3', 'D4'], arpeggio: ['E2', 'B2', 'D3', 'G#3', 'B3', 'G#3', 'D3', 'B2'], tones: ['E', 'G#', 'B', 'D'] },
  'E7alt': { bass: 'E2', pad: ['E3', 'G#3', 'D4', 'F4'], arpeggio: ['E2', 'B2', 'D3', 'F3', 'G#3', 'F3', 'D3', 'B2'], tones: ['E', 'G#', 'D', 'F'] },

  // Bb 家族
  'Bbmaj9': { bass: 'Bb2', pad: ['Bb3', 'D4', 'F4', 'C5'], arpeggio: ['Bb2', 'F3', 'C4', 'D4', 'F4', 'D4', 'C4', 'F3'], tones: ['Bb', 'D', 'F', 'C'] },
  'Bbmaj7': { bass: 'Bb2', pad: ['Bb3', 'D4', 'F4', 'A4'], arpeggio: ['Bb2', 'F3', 'A3', 'D4', 'F4', 'D4', 'A3', 'F3'], tones: ['Bb', 'D', 'F', 'A'] },
  'Bb7': { bass: 'Bb2', pad: ['Bb3', 'D4', 'F4', 'Ab4'], arpeggio: ['Bb2', 'F3', 'Ab3', 'D4', 'F4', 'D4', 'Ab3', 'F3'], tones: ['Bb', 'D', 'F', 'Ab'] },
  'Bb': { bass: 'Bb2', pad: ['Bb3', 'D4', 'F4'], arpeggio: ['Bb2', 'F3', 'Bb3', 'D4', 'F4', 'D4', 'Bb3', 'F3'], tones: ['Bb', 'D', 'F'] },

  // G minor 家族
  'Gm11': { bass: 'G2', pad: ['G3', 'C4', 'D4', 'F4'], arpeggio: ['G2', 'D3', 'F3', 'C4', 'D4', 'C4', 'F3', 'D3'], tones: ['G', 'Bb', 'C', 'D', 'F'] },
  'Gm9': { bass: 'G2', pad: ['G3', 'Bb3', 'D4', 'A4'], arpeggio: ['G2', 'D3', 'A3', 'Bb3', 'D4', 'Bb3', 'A3', 'D3'], tones: ['G', 'Bb', 'D', 'A'] },
  'Gm7': { bass: 'G2', pad: ['G3', 'Bb3', 'D4', 'F4'], arpeggio: ['G2', 'D3', 'F3', 'Bb3', 'D4', 'Bb3', 'F3', 'D3'], tones: ['G', 'Bb', 'D', 'F'] },
  'Gm': { bass: 'G2', pad: ['G3', 'Bb3', 'D4'], arpeggio: ['G2', 'D3', 'G3', 'Bb3', 'D4', 'Bb3', 'G3', 'D3'], tones: ['G', 'Bb', 'D'] },

  // A 属和弦家族
  'A7alt': { bass: 'A2', pad: ['A3', 'C#4', 'G4', 'Bb4'], arpeggio: ['A2', 'E3', 'G3', 'Bb3', 'C#4', 'Bb3', 'G3', 'E3'], tones: ['A', 'C#', 'G', 'Bb'] },
  'A7sus4': { bass: 'A2', pad: ['A3', 'D4', 'E4', 'G4'], arpeggio: ['A2', 'E3', 'G3', 'D4', 'E4', 'D4', 'G3', 'E3'], tones: ['A', 'D', 'E', 'G'] },
  'A7': { bass: 'A2', pad: ['A3', 'C#4', 'E4', 'G4'], arpeggio: ['A2', 'E3', 'G3', 'C#4', 'E4', 'C#4', 'G3', 'E3'], tones: ['A', 'C#', 'E', 'G'] },

  // B 半减七与变化家族
  'Bm7b5': { bass: 'B2', pad: ['B3', 'D4', 'F4', 'A4'], arpeggio: ['B2', 'F3', 'A3', 'D4', 'F4', 'D4', 'A3', 'F3'], tones: ['B', 'D', 'F', 'A'] },
  'Bm7': { bass: 'B2', pad: ['B3', 'D4', 'F#4', 'A4'], arpeggio: ['B2', 'F#3', 'A3', 'D4', 'F#4', 'D4', 'A3', 'F#3'], tones: ['B', 'D', 'F#', 'A'] },
  'B7alt': { bass: 'B2', pad: ['B3', 'D#4', 'A4', 'C5'], arpeggio: ['B2', 'F#3', 'A3', 'C4', 'D#4', 'C4', 'A3', 'F#3'], tones: ['B', 'D#', 'A', 'C'] },

  // F# 半减七
  'F#m7b5': { bass: 'F#2', pad: ['F#3', 'A3', 'C4', 'E4'], arpeggio: ['F#2', 'C3', 'E3', 'A3', 'C4', 'A3', 'E3', 'C3'], tones: ['F#', 'A', 'C', 'E'] },
}

export function getVoicing(name: string): Voicing {
  if (VOICINGS[name])
    return VOICINGS[name]

  const clean = name.replace(/["\s]/g, '')
  if (VOICINGS[clean])
    return VOICINGS[clean]

  const withoutAdd = clean.replace(/add/g, '')
  if (VOICINGS[withoutAdd])
    return VOICINGS[withoutAdd]

  const base7 = clean.replace(/11|9|alt|sus4|b5/, '7')
  if (VOICINGS[base7])
    return VOICINGS[base7]

  const simple = clean.replace(/maj\d*|m\d*|add\d*|\d+|alt|sus4|b5/g, '')
  if (clean.includes('m') && !clean.includes('maj')) {
    if (VOICINGS[`${simple}m`])
      return VOICINGS[`${simple}m`]!
  }
  if (VOICINGS[simple])
    return VOICINGS[simple]!

  return VOICINGS.Am9!
}

// 调式音高池
export const SCALES = {
  // A 小调五声 / 自然小调 (凄清深情)
  Am: [
    { midi: 'E3', abc: 'E,' },
    { midi: 'G3', abc: 'G,' },
    { midi: 'A3', abc: 'A,' },
    { midi: 'B3', abc: 'B,' },
    { midi: 'C4', abc: 'C' },
    { midi: 'D4', abc: 'D' },
    { midi: 'E4', abc: 'E' },
    { midi: 'G4', abc: 'G' },
    { midi: 'A4', abc: 'A' },
    { midi: 'B4', abc: 'B' },
    { midi: 'C5', abc: 'c' },
    { midi: 'D5', abc: 'd' },
    { midi: 'E5', abc: 'e' },
    { midi: 'G5', abc: 'g' },
    { midi: 'A5', abc: 'a' },
    { midi: 'C6', abc: 'c\'' },
  ],
  // D 小调商调式 (豪放慷慨)
  Dm: [
    { midi: 'A3', abc: 'A,' },
    { midi: 'C4', abc: 'C' },
    { midi: 'D4', abc: 'D' },
    { midi: 'E4', abc: 'E' },
    { midi: 'F4', abc: 'F' },
    { midi: 'G4', abc: 'G' },
    { midi: 'A4', abc: 'A' },
    { midi: 'C5', abc: 'c' },
    { midi: 'D5', abc: 'd' },
    { midi: 'E5', abc: 'e' },
    { midi: 'F5', abc: 'f' },
    { midi: 'G5', abc: 'g' },
    { midi: 'A5', abc: 'a' },
    { midi: 'C6', abc: 'c\'' },
    { midi: 'D6', abc: 'd\'' },
  ],
  // E 小调角调式 (空灵禅寂)
  Em: [
    { midi: 'B3', abc: 'B,' },
    { midi: 'D4', abc: 'D' },
    { midi: 'E4', abc: 'E' },
    { midi: 'G4', abc: 'G' },
    { midi: 'A4', abc: 'A' },
    { midi: 'B4', abc: 'B' },
    { midi: 'D5', abc: 'd' },
    { midi: 'E5', abc: 'e' },
    { midi: 'G5', abc: 'g' },
    { midi: 'A5', abc: 'a' },
    { midi: 'B5', abc: 'b' },
    { midi: 'D6', abc: 'd\'' },
    { midi: 'E6', abc: 'e\'' },
  ],
  // C 大调宫调式 (明朗怡悦)
  C: [
    { midi: 'G3', abc: 'G,' },
    { midi: 'A3', abc: 'A,' },
    { midi: 'C4', abc: 'C' },
    { midi: 'D4', abc: 'D' },
    { midi: 'E4', abc: 'E' },
    { midi: 'G4', abc: 'G' },
    { midi: 'A4', abc: 'A' },
    { midi: 'C5', abc: 'c' },
    { midi: 'D5', abc: 'd' },
    { midi: 'E5', abc: 'e' },
    { midi: 'G5', abc: 'g' },
    { midi: 'A5', abc: 'a' },
    { midi: 'C6', abc: 'c\'' },
    { midi: 'D6', abc: 'd\'' },
  ],
  // G 大调 / 徵调式 (清朗明快，山林晨光)
  G: [
    { midi: 'D3', abc: 'D,' },
    { midi: 'E3', abc: 'E,' },
    { midi: 'G3', abc: 'G,' },
    { midi: 'A3', abc: 'A,' },
    { midi: 'B3', abc: 'B,' },
    { midi: 'D4', abc: 'D' },
    { midi: 'E4', abc: 'E' },
    { midi: 'G4', abc: 'G' },
    { midi: 'A4', abc: 'A' },
    { midi: 'B4', abc: 'B' },
    { midi: 'D5', abc: 'd' },
    { midi: 'E5', abc: 'e' },
    { midi: 'G5', abc: 'g' },
    { midi: 'A5', abc: 'a' },
    { midi: 'B5', abc: 'b' },
    { midi: 'D6', abc: 'd\'' },
  ],
  // F 大调 / 飘逸出尘
  F: [
    { midi: 'C3', abc: 'C,' },
    { midi: 'D3', abc: 'D,' },
    { midi: 'F3', abc: 'F,' },
    { midi: 'G3', abc: 'G,' },
    { midi: 'A3', abc: 'A,' },
    { midi: 'C4', abc: 'C' },
    { midi: 'D4', abc: 'D' },
    { midi: 'F4', abc: 'F' },
    { midi: 'G4', abc: 'G' },
    { midi: 'A4', abc: 'A' },
    { midi: 'C5', abc: 'c' },
    { midi: 'D5', abc: 'd' },
    { midi: 'F5', abc: 'f' },
    { midi: 'G5', abc: 'g' },
    { midi: 'A5', abc: 'a' },
    { midi: 'C6', abc: 'c\'' },
  ],
}

/**
 * 字符串确定性哈希
 */
export function hashString(str: string, seed = 0): number {
  let h = 0x811C9DC5 ^ seed
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0) / 4294967296
}

export const scaleDescriptions: Record<string, string> = {
  Am: 'A 小调羽调式 (凄美相思)',
  Dm: 'D 小调商调式 (慷慨壮阔)',
  Em: 'E 小调角调式 (松石禅寂)',
  C: 'C 大调宫调式 (明朗怡悦)',
  G: 'G 大调徵调式 (清朗明快)',
  F: 'F 大调角调式 (飘逸出尘)',
}

/**
 * 根据诗词意象与风格，选择最具代表性与差异化的调号与和弦套路
 */
export function resolveMusicalDNA(vector: SemanticVector, category: MusicCategory) {
  const theme = vector.dominantTheme

  // 1. 根据诗词情感意境确定调号 Key
  let key: 'Am' | 'Dm' | 'Em' | 'C' | 'G' | 'F' = 'Am'
  let vibe = ''

  if (theme === 'heroic_grand') {
    // 豪放壮阔 (如《将进酒》《登高》)
    key = 'Dm'
    vibe = '苍茫壮阔 • 大江大河豪迈跌宕'
  }
  else if (theme === 'zen_nature') {
    // 空灵禅寂 (如《鹿柴》《山居秋暝》)
    key = vector.arousal < 0.3 ? 'Em' : 'F'
    vibe = key === 'F' ? '出尘空灵 • 云水禅心山林远岫' : '松石流泉 • 空山灵籁禅寂超然'
  }
  else if (theme === 'lyrical_tender') {
    // 欢欣明朗 (如《春夜喜雨》《水调歌头》)
    key = vector.valence > 0.3 ? 'G' : 'C'
    vibe = key === 'G' ? '春风和畅 • 绿野晴岚生机盎然' : '韶华春意 • 典雅从容欢欣明净'
  }
  else {
    // 凄楚相思 (如《望月怀远》《锦瑟》)
    key = 'Am'
    vibe = '幽独凄清 • 烟雨江南深情相思'
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
    else if (key === 'G') {
      progressions = {
        qi: ['Gadd9', 'Em7'],
        cheng: ['Cmaj7', 'Dadd9'],
        zhuan: ['Am7', 'D7'],
        he: ['Cmaj7', 'G'],
      }
    }
    else if (key === 'F') {
      progressions = {
        qi: ['Fmaj7', 'Dm7'],
        cheng: ['Bbmaj7', 'Cadd9'],
        zhuan: ['Gm7', 'C7'],
        he: ['Bbmaj7', 'F'],
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
    else if (key === 'G') {
      progressions = {
        qi: ['Gmaj9', 'Em9'],
        cheng: ['Am7', 'D9'],
        zhuan: ['Cmaj7', 'D7alt'],
        he: ['Gmaj9', 'Gadd9'],
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

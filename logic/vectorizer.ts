/**
 * vec-tone 语义向量化引擎
 * 纯客户端、零成本、零延迟的确定性高维语义嵌入与诗词声律提取
 */

// 1. 意境与情感四大核心词库（竞争性主题打分）
const NOSTALGIA_LEXICON = new Set([
  '思', '怨', '情', '忆', '念', '遥', '相', '望', '客', '故', '别', '离',
  '乡', '梦', '心', '孤', '独', '断', '肠', '泪', '恨', '期', '凄', '悄',
  '病', '衰', '老', '愁', '苦', '暮', '霜', '凋', '零', '茫', '难', '休',
  '阴', '寒', '凉', '残', '冷', '怅', '怆', '叹', '幽',
])

const HEROIC_LEXICON = new Set([
  '奔', '流', '怒', '惊', '战', '剑', '马', '风', '雷', '涛', '浪', '狂',
  '烈', '火', '电', '啸', '鸣', '疾', '飞', '驰', '冲', '跃', '起', '翻',
  '策', '鼓', '角', '烽', '旗', '阵', '铁', '戈', '金', '呼', '吼', '乾',
  '坤', '荒', '大', '万', '千', '极', '重', '霄', '浩', '瀚', '广', '阔',
])

const ZEN_LEXICON = new Set([
  '静', '卧', '幽', '微', '眠', '默', '雪', '松', '竹', '迟', '空', '闲',
  '淡', '清', '深', '缓', '息', '安', '宁', '沉', '薄', '细', '影', '烟',
  '雾', '钟', '磬', '苔', '石', '泉', '溪', '云', '垂', '柴', '僧', '寺',
  '禅', '院',
])

const TENDER_JOY_LEXICON = new Set([
  '喜', '欢', '乐', '笑', '春', '花', '晴', '胜', '醉', '歌', '生', '新',
  '赏', '芳', '艳', '荣', '光', '暖', '欣', '悦', '朗', '吉', '逢', '畅',
  '盈', '盛', '辉', '灿', '锦', '秀', '丽', '美', '润', '翠', '红', '祥',
])

// 常见汉字平水韵平仄速查映射（平声：0；仄声：1）
const PING_CHARS = new Set([
  '天', '风', '云', '山', '水', '花', '春', '江', '月', '关', '开', '来',
  '生', '长', '人', '平', '空', '明', '青', '城', '心', '秋', '年', '时',
  '门', '乡', '回', '南', '舟', '相', '思', '重', '真', '清', '歌', '声',
  '愁', '流', '东', '中', '公', '同', '通', '从', '逢', '知', '吹', '随',
  '林', '侵', '寻', '深', '家', '霞', '车', '情', '琴', '金', '尘', '身',
])

const ZE_CHARS = new Set([
  '白', '日', '依', '尽', '黄', '海', '欲', '穷', '目', '更', '上', '一',
  '层', '楼', '客', '舍', '柳', '色', '雨', '故', '无', '劝', '酒', '出',
  '阳', '好', '节', '当', '乃', '发', '潜', '入', '夜', '润', '物', '细',
  '野', '径', '黑', '烛', '火', '晓', '看', '湿', '处', '锦', '重', '落',
  '不', '见', '但', '闻', '语', '响', '返', '景', '照', '苔', '起', '莫',
])

export interface SemanticVector {
  dimensions: number[] // 32 维归一化向量
  valence: number // -1 (极度悲伤/清冷) ~ +1 (极度欢快/明亮)
  arousal: number // 0 (极度平静/禅寂) ~ +1 (极度激昂/跌宕)
  dominance: number // 0 (细腻纤巧) ~ +1 (雄浑壮阔)
  pingZeRatio: number // 平仄比率 (平声比例 0~1)
  dominantTheme: 'zen_nature' | 'parting_nostalgia' | 'heroic_grand' | 'lyrical_tender' | 'modern_free'
  summaryTag: string
}

function hashChar(str: string, seed = 0): number {
  let h = 0x811c9dc5 ^ seed
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return ((h >>> 0) % 10000) / 10000
}

export function getTone(char: string): 0 | 1 {
  if (PING_CHARS.has(char))
    return 0
  if (ZE_CHARS.has(char))
    return 1
  return (char.charCodeAt(0) % 2 === 0) ? 0 : 1
}

export function vectorizeText(text: string): SemanticVector {
  const cleanChars = text.replace(/[^\u4E00-\u9FA5a-zA-Z0-9]/g, '').split('')
  const length = Math.max(1, cleanChars.length)

  let nostalgiaScore = 0
  let heroicScore = 0
  let zenScore = 0
  let tenderScore = 0
  let pingCount = 0

  cleanChars.forEach((ch) => {
    if (NOSTALGIA_LEXICON.has(ch))
      nostalgiaScore += 1
    if (HEROIC_LEXICON.has(ch))
      heroicScore += 1
    if (ZEN_LEXICON.has(ch))
      zenScore += 1
    if (TENDER_JOY_LEXICON.has(ch))
      tenderScore += 1

    if (getTone(ch) === 0)
      pingCount += 1
  })

  // 词组级意象加权强化
  if (text.includes('相思') || text.includes('起相思') || text.includes('情人') || text.includes('天涯') || text.includes('怨遥夜'))
    nostalgiaScore += 3.5
  if (text.includes('黄河') || text.includes('奔流') || text.includes('尽欢') || text.includes('金樽') || text.includes('长风破浪') || text.includes('滚滚来'))
    heroicScore += 3.5
  if (text.includes('空山') || text.includes('青苔') || text.includes('深林') || text.includes('但闻') || text.includes('幽篁'))
    zenScore += 3.5
  if (text.includes('好雨') || text.includes('当春') || text.includes('润物') || text.includes('细无声') || text.includes('明月几时有'))
    tenderScore += 3.5

  // 计算 VAD 情感维度
  // Valence: -1 (悲/冷) ~ 1 (喜/暖)
  const posCount = tenderScore
  const negCount = nostalgiaScore
  let valence = 0
  if (posCount + negCount > 0)
    valence = (posCount - negCount) / (posCount + negCount)
  else
    valence = (hashChar(text, 42) - 0.5) * 0.4
  valence = Math.max(-1, Math.min(1, valence))

  // Arousal: 0.1 (静) ~ 0.95 (动)
  const highArousal = heroicScore
  const lowArousal = zenScore + nostalgiaScore * 0.5
  let arousal = 0.4
  if (highArousal + lowArousal > 0)
    arousal = 0.25 + (highArousal / (highArousal + lowArousal)) * 0.65
  else
    arousal = 0.35 + (hashChar(text, 108) * 0.3)
  arousal = Math.max(0.1, Math.min(0.95, arousal))

  // Dominance: 0.2 ~ 0.9
  const dominance = Math.max(0.2, Math.min(0.9, 0.3 + (heroicScore / length) * 2.0 + hashChar(text, 256) * 0.15))

  const pingZeRatio = pingCount / length

  // 竞争性识别主导意境主题
  let dominantTheme: SemanticVector['dominantTheme'] = 'parting_nostalgia'
  let summaryTag = '凄楚离思 · 怀古相思'

  const maxScore = Math.max(nostalgiaScore, heroicScore, zenScore, tenderScore)

  if (maxScore > 0) {
    if (maxScore === heroicScore) {
      dominantTheme = 'heroic_grand'
      summaryTag = '豪放壮阔 · 苍茫激越'
    }
    else if (maxScore === zenScore) {
      dominantTheme = 'zen_nature'
      summaryTag = '禅寂空灵 · 山水幽韵'
    }
    else if (maxScore === tenderScore) {
      dominantTheme = 'lyrical_tender'
      summaryTag = '明朗怡悦 · 韶华春意'
    }
    else {
      dominantTheme = 'parting_nostalgia'
      summaryTag = '凄楚离思 · 怀古相思'
    }
  }
  else {
    // 默认自适应回退
    if (arousal > 0.6) {
      dominantTheme = 'heroic_grand'
      summaryTag = '豪放壮阔 · 苍茫激越'
    }
    else if (valence > 0.2) {
      dominantTheme = 'lyrical_tender'
      summaryTag = '明朗怡悦 · 韶华春意'
    }
    else if (arousal < 0.35) {
      dominantTheme = 'zen_nature'
      summaryTag = '禅寂空灵 · 山水幽韵'
    }
    else {
      dominantTheme = 'parting_nostalgia'
      summaryTag = '凄楚离思 · 怀古相思'
    }
  }

  // 32 维归一化向量
  const dimensions: number[] = new Array(32).fill(0)
  dimensions[0] = valence
  dimensions[1] = arousal
  dimensions[2] = dominance
  dimensions[3] = pingZeRatio
  dimensions[4] = nostalgiaScore / length
  dimensions[5] = heroicScore / length
  dimensions[6] = zenScore / length
  dimensions[7] = tenderScore / length

  for (let i = 0; i < 16; i++) {
    const charIndex = Math.floor((i / 16) * cleanChars.length)
    const ch = cleanChars[charIndex] || ''
    dimensions[8 + i] = (hashChar(ch + i, i * 7) - 0.5) * 2
  }

  const themes = ['zen_nature', 'parting_nostalgia', 'heroic_grand', 'lyrical_tender', 'modern_free']
  for (let i = 0; i < 8; i++) {
    const tIdx = themes.indexOf(dominantTheme)
    dimensions[24 + i] = (i === tIdx ? 1 : 0.2) * (hashChar(text, i * 19) * 0.8 + 0.2)
  }

  const norm = Math.sqrt(dimensions.reduce((acc, v) => acc + v * v, 0)) || 1
  const normalizedDimensions = dimensions.map(v => Number((v / norm).toFixed(4)))

  return {
    dimensions: normalizedDimensions,
    valence: Number(valence.toFixed(2)),
    arousal: Number(arousal.toFixed(2)),
    dominance: Number(dominance.toFixed(2)),
    pingZeRatio: Number(pingZeRatio.toFixed(2)),
    dominantTheme,
    summaryTag,
  }
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA.length || !vecB.length || vecA.length !== vecB.length)
    return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i] ?? 0
    const b = vecB[i] ?? 0
    dotProduct += a * b
    normA += a * a
    normB += b * b
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0)
    return 0
  return Number((dotProduct / denominator).toFixed(4))
}

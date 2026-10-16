import type { MusicCategory } from './composer'

export interface GenreProgression {
  qi: [string, string]
  cheng: [string, string]
  zhuan: [string, string]
  he: [string, string]
}

export interface PresetAudioConfig {
  key: string
  scaleName: string
  bpm: number
  vibeDescription: string
  romanticVectorConcept: string
  genreProgressions: Record<MusicCategory, GenreProgression>
}

export interface PoemPreset {
  id: string
  title: string
  author: string
  dynasty: string
  text: string
  audioConfig: PresetAudioConfig
}

export const POEM_PRESETS: PoemPreset[] = [
  {
    id: 'moon',
    title: '望月怀远',
    author: '张九龄',
    dynasty: '唐',
    text: '海上生明月，天涯共此时。情人怨遥夜，竟夕起相思。',
    audioConfig: {
      key: 'Am',
      scaleName: '肖邦式深情浪漫夜曲小调 (Aeolian 夜色相思)',
      bpm: 64,
      vibeDescription: '海阔月明 • 潮汐深情 • 幽独相思',
      romanticVectorConcept: '将“海上生明月”的辽阔空间感向量化为低音十度大跨度流动琶音，右手指尖长音如月光清辉洒落；“天涯共此时”通过双手同音八度共振呼应两地相思；“竟夕起相思”最终隐没于大调和声的释然回甘。',
      genreProgressions: {
        classical: {
          qi: ['Am9', 'Fmaj7'],
          cheng: ['Dm9', 'G7alt'],
          zhuan: ['Em7', 'Am7'],
          he: ['Fmaj9', 'Am'],
        },
        rnb: {
          qi: ['Am9', 'Fmaj9'],
          cheng: ['Dm11', 'G7sus4'],
          zhuan: ['Em9', 'Am11'],
          he: ['Dm9', 'Am9'],
        },
        jazz: {
          qi: ['Am9', 'D9'],
          cheng: ['Dm7', 'G7'],
          zhuan: ['Cmaj7', 'F7'],
          he: ['Bm7b5', 'E7alt'],
        },
        tiktok: {
          qi: ['Fmaj7', 'G'],
          cheng: ['Em7', 'Am7'],
          zhuan: ['Dm7', 'G7'],
          he: ['C', 'C'],
        },
      },
    },
  },
  {
    id: 'wine',
    title: '将进酒',
    author: '李白',
    dynasty: '唐',
    text: '君不见黄河之水天上来，奔流到海不复回。人生得意须尽欢，莫使金樽空对月。',
    audioConfig: {
      key: 'Dm',
      scaleName: '盛唐豪迈多利亚商调 (Dorian 狂放豪饮狂想)',
      bpm: 84,
      vibeDescription: '黄河奔涌 • 狂歌痛饮 • 气贯长虹',
      romanticVectorConcept: '将“黄河之水天上来”的万钧气势向量化为高阶下行冲刷音型与轰鸣低音；“奔流到海不复回”化作不可逆的重拍切分律动；“人生得意须尽欢”在转调小节推向高八度狂澜，如同金樽烈酒泼洒向浩瀚苍穹。',
      genreProgressions: {
        classical: {
          qi: ['Dm9', 'Bbmaj7'],
          cheng: ['Gm9', 'A7alt'],
          zhuan: ['Fmaj7', 'Cadd9'],
          he: ['Bbmaj7', 'Dm'],
        },
        rnb: {
          qi: ['Dm9', 'Bbmaj9'],
          cheng: ['Gm11', 'A7sus4'],
          zhuan: ['Fmaj9', 'C9'],
          he: ['Gm9', 'Dm9'],
        },
        jazz: {
          qi: ['Dm7', 'G7'],
          cheng: ['Gm7', 'C7'],
          zhuan: ['Fmaj7', 'Bb7'],
          he: ['Em7b5', 'A7alt'],
        },
        tiktok: {
          qi: ['Bbmaj7', 'C'],
          cheng: ['Am7', 'Dm7'],
          zhuan: ['Gm7', 'C7'],
          he: ['F', 'Dm'],
        },
      },
    },
  },
  {
    id: 'mountain',
    title: '鹿柴',
    author: '王维',
    dynasty: '唐',
    text: '空山不见人，但闻人语响。返景入深林，复照青苔上。',
    audioConfig: {
      key: 'Em',
      scaleName: '空山幽林极简禅寂角调 (Zen 留白冥想意境)',
      bpm: 58,
      vibeDescription: '空谷幽兰 • 斜照青苔 • 禅定超然',
      romanticVectorConcept: '将“空山不见人”的寂静向量化为稀疏晶莹的高音琴音与大段呼吸留白；“但闻人语响”如水滴落在深涧激起乒乓空间回响；“复照青苔上”以柔和的九和弦色彩，刻画落日余晖穿透树冠抚摸湿润青苔的静谧光影。',
      genreProgressions: {
        classical: {
          qi: ['Em9', 'Cmaj7'],
          cheng: ['Am7', 'B7alt'],
          zhuan: ['Gmaj7', 'Em7'],
          he: ['Cmaj9', 'Em'],
        },
        rnb: {
          qi: ['Em9', 'Cmaj9'],
          cheng: ['Am9', 'D7sus4'],
          zhuan: ['Gmaj9', 'Cmaj7'],
          he: ['Am7', 'Em9'],
        },
        jazz: {
          qi: ['Em9', 'A7'],
          cheng: ['Am7', 'D7'],
          zhuan: ['Gmaj7', 'Cmaj7'],
          he: ['F#m7b5', 'B7alt'],
        },
        tiktok: {
          qi: ['Cmaj7', 'D'],
          cheng: ['Bm7', 'Em7'],
          zhuan: ['Am7', 'D7'],
          he: ['G', 'G'],
        },
      },
    },
  },
  {
    id: 'rain',
    title: '春夜喜雨',
    author: '杜甫',
    dynasty: '唐',
    text: '好雨知时节，当春乃发生。随风潜入夜，润物细无声。',
    audioConfig: {
      key: 'G',
      scaleName: '江南温润五声春雨调 (Pentatonic 灵动甘霖)',
      bpm: 72,
      vibeDescription: '甘霖细雨 • 润泽万物 • 欣欣向荣',
      romanticVectorConcept: '将“好雨知时节”的欣喜向量化为如雨丝般连绵轻盈的十六分琶音；“随风潜入夜”以次弱拍轻音切分模拟春风拂柳；“润物细无声”采用温润纯净的自然大调和声，如细雨渗透泥土，孕育出无限生机。',
      genreProgressions: {
        classical: {
          qi: ['Gadd9', 'Cmaj7'],
          cheng: ['Am7', 'D7'],
          zhuan: ['Bm7', 'Em7'],
          he: ['Cadd9', 'G'],
        },
        rnb: {
          qi: ['Gmaj9', 'Cmaj9'],
          cheng: ['Am9', 'D9'],
          zhuan: ['Bm7', 'Em9'],
          he: ['Cmaj7', 'Gmaj9'],
        },
        jazz: {
          qi: ['Gmaj7', 'E7'],
          cheng: ['Am7', 'D7'],
          zhuan: ['Bm7', 'E7'],
          he: ['Am7', 'D7alt'],
        },
        tiktok: {
          qi: ['Cmaj7', 'D'],
          cheng: ['Bm7', 'Em7'],
          zhuan: ['Am7', 'D'],
          he: ['G', 'G'],
        },
      },
    },
  },
  {
    id: 'denggao',
    title: '登高',
    author: '杜甫',
    dynasty: '唐',
    text: '风急天高猿啸哀，渚清沙白鸟飞回。无边落木萧萧下，不尽长江滚滚来。',
    audioConfig: {
      key: 'Am',
      scaleName: '沉郁顿挫悲秋和声小调 (Harmonic Minor 苍凉孤舟)',
      bpm: 62,
      vibeDescription: '苍凉阔大 • 悲秋孤舟 • 天地悠悠',
      romanticVectorConcept: '将“风急天高”的肃杀向量化为凄厉的半音级进与突强重音；“无边落木萧萧下”化为落叶飘零般的层叠分解下行织体；“不尽长江滚滚来”则由持续轰鸣的双八度低音承载，奏出杜甫沉郁顿挫的千古悲凉。',
      genreProgressions: {
        classical: {
          qi: ['Am9', 'Fmaj7'],
          cheng: ['Dm9', 'G7alt'],
          zhuan: ['Cmaj7', 'E7alt'],
          he: ['Fmaj9', 'Am'],
        },
        rnb: {
          qi: ['Am9', 'Fmaj9'],
          cheng: ['Dm9', 'E7alt'],
          zhuan: ['Cmaj9', 'Fmaj7'],
          he: ['Dm7', 'Am9'],
        },
        jazz: {
          qi: ['Am7', 'F7'],
          cheng: ['Dm7', 'E7alt'],
          zhuan: ['Am7', 'D7'],
          he: ['Bm7b5', 'E7alt'],
        },
        tiktok: {
          qi: ['Fmaj7', 'G'],
          cheng: ['Em7', 'Am7'],
          zhuan: ['Dm7', 'E7'],
          he: ['Am', 'Am'],
        },
      },
    },
  },
  {
    id: 'midautumn',
    title: '水调歌头',
    author: '苏轼',
    dynasty: '宋',
    text: '明月几时有？把酒问青天。不知天上宫阙，今夕是何年。',
    audioConfig: {
      key: 'C',
      scaleName: '琼楼玉宇东坡旷达仙调 (Lydian 仙气乘风)',
      bpm: 70,
      vibeDescription: '超然旷达 • 琼楼玉宇 • 乘风游仙',
      romanticVectorConcept: '将“明月几时有”的一声浩叹向量化为空灵清澈的利底亚升四度色彩音；“不知天上宫阙”宛如乘风御气漫游月宫的梦幻和弦回响；整首曲子在东坡居士独有的旷达释然与人世温情间回荡，超脱出尘。',
      genreProgressions: {
        classical: {
          qi: ['Cmaj9', 'Am9'],
          cheng: ['Fmaj7', 'Gadd9'],
          zhuan: ['Em7', 'Am7'],
          he: ['Fmaj9', 'C'],
        },
        rnb: {
          qi: ['Cmaj9', 'Am9'],
          cheng: ['Fmaj9', 'G7sus4'],
          zhuan: ['Em9', 'A7alt'],
          he: ['Dm9', 'Cmaj9'],
        },
        jazz: {
          qi: ['Cmaj7', 'A7alt'],
          cheng: ['Dm7', 'G7'],
          zhuan: ['Em7', 'A7'],
          he: ['Dm7', 'G7alt'],
        },
        tiktok: {
          qi: ['Fmaj7', 'G'],
          cheng: ['Em7', 'Am7'],
          zhuan: ['Dm7', 'G'],
          he: ['C', 'C'],
        },
      },
    },
  },
]

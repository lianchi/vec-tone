export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { text, title, category = 'classical' } = body || {}

  if (!text || typeof text !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing text in request body',
    })
  }

  const apiKey = process.env.AI_API_KEY || ''
  const modelName = process.env.AI_MODEL_NAME || 'deepseek-flash'
  const rawBaseUrl = (process.env.AI_BASE_URL || 'https://api.deepseek.com').trim().replace(/\/+$/, '')
  const endpoint = rawBaseUrl.endsWith('/chat/completions')
    ? rawBaseUrl
    : `${rawBaseUrl}/chat/completions`

  if (!apiKey) {
    return {
      success: false,
      message: 'AI API Key 未配置，已无缝由本地多维音乐引擎生成',
      fallbackToLocal: true,
    }
  }

  const categoryPrompts: Record<string, string> = {
    classical: '古典钢琴曲风格（肖邦夜曲与久石让，双手宽广琶音，歌唱性长音与装饰花音）',
    rnb: '现代流行 R&B 风格（周杰伦/方大同/Neo-Soul，都会微醺，十六分切分与灵魂转音）',
    jazz: '微醺经典爵士风格（蓝色爵士小馆/Swing/Bossa，七和弦与降五音，摇摆切分与行走贝斯）',
    tiktok: '抖音网红爆款神曲（4536251 或卡农万能进行，动感四击底鼓与极度洗脑副歌）',
  }

  const systemPrompt = `你是一位对标 Suno / Udio 工业级水准的先锋音乐制作人与作曲家。
你的使命是根据输入的诗词/文本的深层意境（或苍凉悲秋、或豪放奔涌、或空山禅寂、或江南春意、或旷达游仙），构思最具个性与戏剧性的调式色彩、和弦骨架与旋律意图，彻底打破机械等长与套路化！

当前创作流派：${categoryPrompts[category] || categoryPrompts.classical}。

【作曲蓝图构思指南】：
1. 调式与和弦：
   - 调式可选：Dm (豪放壮阔/商调), Am (凄楚深情/羽调), Em (空灵禅寂/角调), G (明媚清丽/徵调), C (旷达从容/宫调), F (飘逸超然)。
   - 和声色彩：大胆运用现代流行/爵士高级和声（如 Dm9, Bbmaj7, Cadd9, Am7, Gm7, A7, Em9, Cmaj7, G7alt, Fmaj7 等）。
2. 起承转合乐句设计：
   - 将文本按自然句读切分为 2 到 4 个乐句 (clauses)；
   - 每个乐句对应起 (qi)、承 (cheng)、转 (zhuan)、合 (he) 功能，并为其配置 2 个色彩和弦；
3. 字音节拍与起伏蓝图（打破呆板等长！）：
   - 为每个汉字规划 weight (相对时值权重 1~4：1=轻快/垫字, 2=标准字, 3=抒情长音, 4=句尾归韵/高潮长音)；
   - 设定 tendency (音高起伏倾向：rise / step_up / fall / step_down / high_climax / resolve_down / hold)；
   - 设定 accent (true/false，是否为骨干重音强拍)。

请严格输出合法 JSON（不含 markdown 标记）：
{
  "title": "${title || '诗意曲名'}",
  "key": "调号（Am/Dm/Em/C/G/F）",
  "bpm": 速度数值(56-115),
  "scale": "专属调式色彩名称（如：盛唐豪放多利亚商调、肖邦浪漫小调等）",
  "vibeDescription": "精准契合诗词的意境素描（25字内）",
  "romanticVectorConcept": "浪漫向量化解读：通俗浪漫地向普通人阐述这段文字如何化为音符与和弦（80~120字）",
  "chords": {
    "qi": ["和弦1", "和弦2"],
    "cheng": ["和弦3", "和弦4"],
    "zhuan": ["和弦5", "和弦6"],
    "he": ["和弦7", "和弦8"]
  },
  "clauses": [
    {
      "text": "本句文本",
      "function": "qi",
      "chords": ["和弦A", "和弦B"],
      "mood": "本句情绪描摹",
      "rhythmStyle": "rubato_spread",
      "syllables": [
        { "char": "字", "weight": 2, "tendency": "step_up", "accent": true }
      ]
    }
  ]
}`

  const controller = new AbortController()
  // Vercel Serverless Function 免费版执行硬限为 10 秒，设为 8.8 秒超时以保证平滑降级
  const timeoutId = setTimeout(() => controller.abort(), 8800)

  try {
    const postData = JSON.stringify({
      model: modelName,
      temperature: 0.8,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
      thinking: {
        type: 'disabled',
      },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请为以下诗词/文本构思专属音乐参数：\n\n${text}` },
      ],
    })

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: postData,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      return {
        success: false,
        error: `API HTTP ${response.status}: ${errText}`,
        fallbackToLocal: true,
      }
    }

    const parsed: any = await response.json()
    const choice = parsed?.choices?.[0]
    const msg = choice?.message
    let content = msg?.content || ''
    if (!content && msg?.reasoning_content) {
      content = msg.reasoning_content
    }
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return { success: true, data: JSON.parse(jsonMatch[0]) }
    }
    else {
      return { success: false, error: '未能从响应中解析 JSON', fallbackToLocal: true }
    }
  }
  catch (err: any) {
    clearTimeout(timeoutId)
    if (err?.name === 'AbortError' || controller.signal.aborted) {
      return {
        success: false,
        error: 'AI 生成超时，已切换至本地音乐引擎',
        fallbackToLocal: true,
      }
    }
    return {
      success: false,
      error: err?.message || '网络连接异常',
      fallbackToLocal: true,
    }
  }
})

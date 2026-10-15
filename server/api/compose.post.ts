import https from 'node:https'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { text, title, author, category = 'classical' } = body || {}

  if (!text || typeof text !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing text in request body',
    })
  }

  const apiKey = process.env.AI_API_KEY || ''
  const modelName = process.env.AI_MODEL_NAME || 'deepseek-flash'

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
你的使命是根据输入的诗词/文本的深层意境（或苍凉悲秋、或豪放奔涌、或空山禅寂、或江南春意、或旷达游仙），构思最具个性与戏剧性的调式色彩与和弦骨架，彻底告别平庸雷同！

当前创作流派：${categoryPrompts[category] || categoryPrompts.classical}。

【和弦与调式构思指南（参考 Suno 现代和声学）】：
- 调式选择：豪迈壮烈选 Dm (Dorian/大漠商调)；凄楚相思选 Am (Aeolian/肖邦夜曲)；空灵禅寂选 Em (角调/极简留白)；清朗生机选 G (徵调/春雨初霁)；旷达超然选 C (Lydian/东坡仙境)；飘逸柔情选 F (水墨诗情)。
- 和弦色彩：大胆采用 Maj9, Min9, Min11, 7alt, 7sus4, m7b5, add9 等高级色彩和弦。
- 起承转合曲式戏剧性：
  * 起 (qi)：奠定情绪基石与主题动机；
  * 承 (cheng)：展开情绪，注入离调或扩展色彩和弦；
  * 转 (zhuan)：情绪高潮/爆发，采用副属和弦、半减七或变化和弦（如 Dm9, Bbmaj7, G7alt, E7alt 等推向高潮）；
  * 合 (he)：圆满收韵，归宿于主调色彩和弦。

请根据输入文本量身定制专属音乐参数，严格输出合法 JSON（不含 markdown 标记）：
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
  }
}`

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

    const aiResult = await new Promise<any>((resolve) => {
      const req = https.request('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 30000,
      }, (res) => {
        let raw = ''
        res.on('data', chunk => raw += chunk)
        res.on('end', () => {
          try {
            if (res.statusCode && res.statusCode >= 400) {
              return resolve({ success: false, error: `API HTTP ${res.statusCode}: ${raw}`, fallbackToLocal: true })
            }
            const parsed = JSON.parse(raw)
            const choice = parsed?.choices?.[0]
            const msg = choice?.message
            let content = msg?.content || ''
            if (!content && msg?.reasoning_content) {
              content = msg.reasoning_content
            }
            const jsonMatch = content.match(/\{[\s\S]*\}/)
            if (jsonMatch) {
              resolve({ success: true, data: JSON.parse(jsonMatch[0]) })
            }
            else {
              resolve({ success: false, error: '未能从响应中解析 JSON', fallbackToLocal: true })
            }
          }
          catch (e: any) {
            resolve({ success: false, error: e.message, fallbackToLocal: true })
          }
        })
      })

      req.on('timeout', () => {
        req.destroy()
        resolve({ success: false, error: 'AI 生成超时，已切换至本地引擎', fallbackToLocal: true })
      })

      req.on('error', (err) => {
        resolve({ success: false, error: err.message, fallbackToLocal: true })
      })

      req.write(postData)
      req.end()
    })

    return aiResult
  }
  catch (err: any) {
    return {
      success: false,
      error: err?.message || '网络连接异常',
      fallbackToLocal: true,
    }
  }
})

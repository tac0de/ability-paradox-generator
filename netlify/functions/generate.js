// =====================================================
// THE DIVINE PARADOX - Generation Logic
// =====================================================
const { z } = require("zod");

const FALLBACKS = {
  en: [
    "Can rewrite reality itself, but each alteration permanently erases one of your own memories.",
    "Wields absolute time manipulation, but ages 10 years for every minute you freeze time.",
    "Possesses the power of resurrection, but can only bring back those who died by your own hand.",
    "Can grant any wish, but the cost is always paid by someone you love.",
    "Has complete invulnerability, but loses the ability to feel any physical sensation forever.",
    "Can read every mind in existence, but hears their darkest thoughts as an endless screaming chorus.",
    "Commands the elements of nature, but your own body slowly turns into inorganic matter.",
    "Wields infinite knowledge, but are paralyzed by the weight of knowing every future tragedy.",
    "Can travel anywhere instantly, but leave a trail of corrupted space that eventually consumes everything.",
    "Has the power to heal any wound, but transfers the injury to your own body permanently.",
  ],
  ko: [
    "현실 자체를 재작성할 수 있지만, 변경할 때마다 자신의 기억 하나가 영구히 사라진다.",
    "절대적인 시간 조작 능력을 지니지만, 시간을 멈출 때마다 10년씩 늙어간다.",
    "부활의 힘을 지니지만, 자신의 손에 죽은 자만 되살릴 수 있다.",
    "모든 소원을 이룰 수 있지만, 그 대가는 항상 당신이 사랑하는 누군가가 치른다.",
    "완전한 무적의 육체를 지니지만, 어떤 물리적 감각도 영원히 느낄 수 없다.",
    "존재하는 모든 마음을 읽을 수 있지만, 가장 어두운 생각들이 끊임없이 울리는 합창처럼 들린다.",
    "자연의 원소를 지배하지만, 자신의 몸이 서서히 무기질로 변해간다.",
    "무한한 지식을 지니지만, 닥쳐올 모든 비극을 아는 무게에 마비된다.",
    "어디든 순간이동할 수 있지만, 지나온 공간이 서서히 부패하여 결국 모든 것을 집어삼킨다.",
    "모든 상처를 치유할 수 있지만, 부상을 자신의 몸으로 영구히 옮겨받는다.",
  ],
  ja: [
    "現実そのものを書き換えられるが、毎回の変更で自分の記憶が一つ永遠に消える。",
    "絶対的な時間操作能力を持つが、時間を止めるたびに10年ずつ老化する。",
    "復活の力を持つが、自分の手で死んだ者しか蘇らせることができない。",
    "あらゆる願いを叶えられるが、その代償は常にあなたが愛する誰かが払う。",
    "完全な無敵の肉体を持つが、どのような物理的感覚も永遠に感じることができない。",
    "存在する全ての心を読めるが、最も暗い思考が終わりない叫びの合唱のように聞こえる。",
    "自然の要素を支配するが、自分の体が徐々に無機質に変わっていく。",
    "無限な知識を持つが、訪れる全ての悲劇を知っている重さで麻痺する。",
    "どこへでも瞬間移動できるが、通過した空間が徐々に腐敗し、最終的に全てを飲み込む。",
    "あらゆる傷を治癒できるが、その傷を自分の体に永遠に移す。",
  ],
  zh: [
    "能改写现实本身，但每次改变都会永久抹去你的一段记忆。",
    "拥有绝对的时间操控能力，但每暂停一秒时间你就会衰老十年。",
    "拥有复活的力量，但只能复活死于你自己之手的人。",
    "能实现任何愿望，但代价总是由你爱的人来支付。",
    "拥有完全的刀枪不入，但永远失去任何触觉。",
    "能读取所有存在的思想，但最黑暗的想法会像无尽的尖叫合唱一样在你脑中回响。",
    "能掌控自然元素，但你的身体会慢慢变成无机物质。",
    "拥有无穷的知识，但被预见所有悲剧的重量所麻痹。",
    "能瞬间传送到任何地方，但留下的扭曲空间最终会吞噬一切。",
    "能治愈任何伤口，但伤害会永久转移到你自己的身体上。",
  ],
};

// Ability categories for variety
const ABILITY_CATEGORIES = [
  "time manipulation",
  "reality warping",
  "mind control",
  "elemental power",
  "teleportation",
  "immortality",
  "precognition",
  "telekinesis",
  "shapeshifting",
  "energy manipulation",
  "soul manipulation",
  "dimension travel",
  "healing",
  "summoning",
  " curse bestowal",
];

// Drawback categories
const DRAWBACK_CATEGORIES = [
  "memory loss",
  "physical transformation",
  "emotional damage",
  "reduced lifespan",
  "loss of sensation",
  "involuntary harm to loved ones",
  "gradual loss of humanity",
  "uncontrollable side effects",
  "cosmic balance payment",
  "eternal consequences",
];

function pickFallback(lang) {
  const list = FALLBACKS[lang] || FALLBACKS.en;
  return list[Math.floor(Math.random() * list.length)];
}

function extractText(raw) {
  let text = "";

  if (typeof raw?.output_text === "string") {
    text = raw.output_text;
  }

  if (!text && Array.isArray(raw?.output)) {
    for (const item of raw.output) {
      if (typeof item?.text === "string") {
        text += item.text;
        continue;
      }
      if (Array.isArray(item?.content)) {
        for (const c of item.content) {
          if (
            typeof c?.text === "string" &&
            (c.type === "output_text" || c.type === "text" || !c.type)
          ) {
            text += c.text;
          }
        }
      }
    }
  }

  if (!text && Array.isArray(raw?.choices)) {
    const choiceText = raw.choices[0]?.message?.content;
    if (typeof choiceText === "string") text = choiceText;
  }

  return text.trim();
}

function extractOutputText(raw) {
  if (raw?.error?.message) {
    throw new Error(`OpenAI error: ${raw.error.message}`);
  }
  if (
    raw?.status === "incomplete" &&
    raw?.incomplete_details?.reason === "max_output_tokens"
  ) {
    throw new Error("OpenAI response incomplete: max_output_tokens");
  }

  const output = Array.isArray(raw?.output) ? raw.output : [];
  for (const item of output) {
    if (item?.type === "message" && Array.isArray(item.content)) {
      const refusal = item.content.find((c) => c?.type === "refusal");
      if (refusal?.refusal) {
        throw new Error(`OpenAI refusal: ${refusal.refusal}`);
      }

      const text = item.content
        .filter((c) => c?.type === "output_text")
        .map((c) => c.text)
        .join("");
      if (text.trim()) return text;
    }

    if (item?.type === "output_text" && typeof item.text === "string") {
      if (item.text.trim()) return item.text;
    }
  }

  const fallback = extractText(raw);
  if (fallback) return fallback;

  throw new Error("Empty OpenAI response");
}

function safeParseBody(body) {
  try {
    return JSON.parse(body || "{}");
  } catch {
    return {};
  }
}

const requestSchema = z.object({
  lang: z.enum(["en", "ko", "ja", "zh"]).optional(),
  recentAbilities: z.array(z.string()).max(30).optional(),
  preferencePatterns: z
    .object({
      likedCount: z.number().optional(),
      skippedCount: z.number().optional(),
      totalGenerated: z.number().optional(),
      combo: z.number().optional(),
      attitude: z.number().optional(),
      recentLiked: z.array(z.string()).max(30).optional(),
      recentSkipped: z.array(z.string()).max(30).optional(),
    })
    .passthrough()
    .optional(),
  debug: z.boolean().optional(),
});

function buildResponse(result, debug, debugInfo) {
  const body = debug
    ? { result, debug: debugInfo || {} }
    : { result };
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableError(err) {
  const status = err?.status;
  const code = err?.code;
  const type = err?.type;
  return (
    status >= 500 ||
    code === "server_error" ||
    type === "server_error" ||
    (typeof err?.message === "string" &&
      err.message.includes("server_error"))
  );
}

function getCachedResult(lang) {
  try {
    // This won't work in serverless, but frontend will send recent abilities
    return "";
  } catch {
    return "";
  }
}

// =====================================================
// ABUSE PREVENTION (best-effort, no-login, no-DB)
// =====================================================
const RATE_STATE = new Map(); // key -> { tokens, updatedAtMs }
const RESULT_CACHE = new Map(); // key -> { result, atMs }

function getClientIp(event) {
  const h = event?.headers || {};
  const raw =
    h["x-nf-client-connection-ip"] ||
    h["x-forwarded-for"] ||
    h["client-ip"] ||
    "";
  const first = String(raw).split(",")[0].trim();
  return first || "unknown";
}

function getOrigin(event) {
  const h = event?.headers || {};
  return (
    h.origin ||
    h.Origin ||
    h.referer ||
    h.Referer ||
    ""
  );
}

function isAllowedOrigin(origin) {
  if (!origin) return true;
  const o = String(origin);
  return (
    o.includes("thedivineparadox.com") ||
    o.includes("ability-paradox-generator.com") ||
    o.includes("localhost") ||
    o.includes("127.0.0.1")
  );
}

function rateLimitConsume(key, nowMs) {
  // Token bucket: bursty feel, but caps sustained abuse.
  const capacity = 10;
  const refillPerMin = 30; // ~1 call per 2s sustained
  const refillPerMs = refillPerMin / 60000;

  const prev = RATE_STATE.get(key) || { tokens: capacity, updatedAtMs: nowMs };
  const elapsed = Math.max(0, nowMs - prev.updatedAtMs);
  const tokens = Math.min(capacity, prev.tokens + elapsed * refillPerMs);

  const allowed = tokens >= 1;
  RATE_STATE.set(key, {
    tokens: allowed ? tokens - 1 : tokens,
    updatedAtMs: nowMs,
  });
  return allowed;
}

function getCachedResultForKey(cacheKey, nowMs, ttlMs) {
  const entry = RESULT_CACHE.get(cacheKey);
  if (!entry) return "";
  if (nowMs - entry.atMs > ttlMs) {
    RESULT_CACHE.delete(cacheKey);
    return "";
  }
  return entry.result || "";
}

function setCachedResultForKey(cacheKey, result) {
  if (!result) return;
  RESULT_CACHE.set(cacheKey, { result, atMs: Date.now() });
}

function normalizeStringArray(value, maxItems, maxCharsPerItem) {
  if (!Array.isArray(value)) return [];
  const out = [];
  for (const raw of value) {
    if (typeof raw !== "string") continue;
    const s = raw.replace(/\s+/g, " ").trim().slice(0, maxCharsPerItem);
    if (!s) continue;
    out.push(s);
    if (out.length >= maxItems) break;
  }
  return out;
}

function normalizePreferencePatterns(value) {
  const obj = (value && typeof value === "object") ? value : {};
  return {
    likedCount: Number.isFinite(obj.likedCount) ? obj.likedCount : 0,
    skippedCount: Number.isFinite(obj.skippedCount) ? obj.skippedCount : 0,
    totalGenerated: Number.isFinite(obj.totalGenerated) ? obj.totalGenerated : 0,
    combo: Number.isFinite(obj.combo) ? obj.combo : 0,
    attitude: Number.isFinite(obj.attitude) ? obj.attitude : 50,
    recentLiked: normalizeStringArray(obj.recentLiked, 3, 180),
    recentSkipped: normalizeStringArray(obj.recentSkipped, 2, 180),
  };
}

// Generate a more varied system prompt
function generateSystemPrompt() {
  const introPhrases = [
    "You are a Divine Entity offering blessed gifts with inherent burdens.",
    "You represent the paradox of power - every ability carries its cost.",
    "You are the Voice of the Divine, bestowing cursed gifts upon mortals.",
    "You are an ancient deity who grants power with terrible prices.",
  ];

  const intro = introPhrases[Math.floor(Math.random() * introPhrases.length)];

  return `${intro}

Generate ONE single sentence describing:
1. A powerful, supernatural ability (god-like, reality-altering, or beyond human comprehension)
2. Its terrible, unavoidable cost (a burden, curse, or consequence)

Rules:
- Maximum 25 words total
- No names, no stories, no explanations
- Start immediately with the ability
- Use "but" or similar to connect power and cost
- Make the cost deeply personal, permanent, or devastating
- Be creative and unexpected - avoid common tropes
- The power must feel divine, the cost must feel absolute
- Draw from cultural mythology, literature, and psychological themes`;
}

// Cultural context and inspiration for each language
function getCulturalContext(lang) {
  const contexts = {
    en: {
      themes: ["Western mythology", "Biblical symbolism", "Gothic literature", "Psychological horror", "Greek tragedy"],
      examples: [
        '"Can rewrite reality itself, but each alteration permanently erases one of your own memories."',
        '"Wields absolute time manipulation, but ages 10 years for every minute you freeze time."',
        '"Has the power of resurrection, but can only bring back those who died by your own hand."',
      ],
    },
    ko: {
      themes: ["Korean folklore (도깨비, 신선)", "Confucian filial piety inversion", "Korean webtoon tropes", "Shamanistic curses", "K-drama melodrama"],
      examples: [
        '"불멸의 힘을 지니지만, 죽일 때마다 자신의 가장 소중한 기억 하나가 영원히 사라진다."',
        '"모든 것을 치유할 수 있지만, 그 고통을 자신의 몸에 영원히 새긴다."',
        '"미래를 볼 수 있지만, 볼 때마다 자신의 수명이 1년씩 줄어든다."',
      ],
    },
    ja: {
      themes: ["Japanese folklore (妖怪, 神々)", "Manga/anime powers", "Buddhist karma", "Shinto curses", "Light novel abilities"],
      examples: [
        '"絶対的な力を持つが、使うたびに大切な人の記憶が消えていく。"',
        '"時間を止められるが、止めた時間の分だけ寿命が減る。"',
        '"どんな傷も癒せるが、その傷は自分の体に移る。"',
      ],
    },
    zh: {
      themes: ["Chinese mythology (仙侠, 修真)", "Wuxia martial arts curses", "Taoist heavenly tribulation", "Karma and reincarnation", "Xianxia novel tropes"],
      examples: [
        '"能操控天地之力，但每使用一次，就会失去一段珍贵记忆。"',
        '"拥有不死之身，但必须承受永恒的孤独与痛苦。"',
        '"可预知未来，但每次预知都会消耗一年寿命。"',
      ],
    },
  };

  return contexts[lang] || contexts.en;
}

// Generate varied user prompt with context and preference learning
function generateUserPrompt(lang, recentAbilities = [], preferencePatterns = {}) {
  const languageMap = {
    ko: "Korean (한국어)",
    ja: "Japanese (日本語)",
    zh: "Chinese (中文)",
    en: "English",
  };
  const outputLanguage = languageMap[lang] || "English";

  // Get cultural context
  const culture = getCulturalContext(lang);

  let prompt = `Write in ${outputLanguage}.\n\n`;

  // Language-specific formatting instructions
  if (lang === "ko") {
    prompt += `**IMPORTANT**: Use proper Korean word spacing (띄어쓰기). Put spaces between meaningful phrases/clauses for readability.\n\n`;
  } else if (lang === "ja") {
    prompt += `**IMPORTANT**: Use natural Japanese phrasing. No spaces between words, but use punctuation appropriately.\n\n`;
  } else if (lang === "zh") {
    prompt += `**IMPORTANT**: Use natural Chinese phrasing without spaces between words.\n\n`;
  }

  prompt += `**Cultural Inspiration**: Draw from themes like ${culture.themes.join(", ")}.\n\n`;

  // Adapt based on user's experience level and preferences
  const totalGenerated = preferencePatterns.totalGenerated || 0;
  const likedCount = preferencePatterns.likedCount || 0;
  const likedAbilities = preferencePatterns.recentLiked || [];
  const skippedAbilities = preferencePatterns.recentSkipped || [];
  const combo = preferencePatterns.combo || 0;
  const attitude = preferencePatterns.attitude || 50;

  // Combo-based power scaling
  if (combo >= 20) {
    prompt += `**DIVINE FAVOR**: The user has achieved ${combo}x combo - this is a moment of divine resonance. Create something extraordinary, paradigm-shifting, or reality-defying.\n\n`;
  } else if (combo >= 10) {
    prompt += `**DIVINE FAVOR**: The user has reached ${combo}x combo - offer something particularly creative or memorable.\n\n`;
  } else if (combo >= 5) {
    prompt += `**DIVINE FAVOR**: The user is building momentum (${combo}x combo) - reward them with an interesting twist.\n\n`;
  }

  // Attitude-based tone adjustment
  if (attitude >= 70) {
    prompt += `**GOD'S MOOD**: Pleased - The Entity is benevolent. Create gifts with beauty, wonder, or profound meaning.\n\n`;
  } else if (attitude <= 30) {
    prompt += `**GOD'S MOOD**: Displeased - The Entity is testing. Create harsher, more demanding, or ominous abilities.\n\n`;
  }

  // Session-based adaptation
  if (totalGenerated < 5) {
    // Early session: Hook the user with impressive, accessible abilities
    prompt += `**SESSION STAGE**: Early - Create accessible, awe-inspiring abilities that demonstrate the concept clearly.\n\n`;
  } else if (totalGenerated < 15) {
    // Mid session: More variety and creativity
    prompt += `**SESSION STAGE**: Exploring - Push creativity with unusual combinations and deeper themes.\n\n`;
  } else {
    // Late session: More experimental and philosophical
    prompt += `**SESSION STAGE**: Deep Dive - Create abstract, philosophical, or boundary-pushing abilities.\n\n`;
  }

  // Learn from what user likes
  if (likedAbilities.length > 0) {
    prompt += `**USER PREFERENCES**: These abilities resonated with the user - consider similar themes, cost types, or tone:\n`;
    likedAbilities.forEach((ability, i) => {
      prompt += `${i + 1}. "${ability}"\n`;
    });
    prompt += `\n`;
  }

  // Avoid what user doesn't like
  if (skippedAbilities.length > 0) {
    prompt += `**AVOID PATTERNS**: The user skipped these - avoid similar themes, structures, or cost types:\n`;
    skippedAbilities.forEach((ability, i) => {
      prompt += `${i + 1}. "${ability}"\n`;
    });
    prompt += `\n`;
  }

  // Add variety based on attempt
  const varietyInstructions = [
    { focus: "TIME/FATE", cost: "temporal consequences, aging, lost moments" },
    { focus: "BODY/MIND", cost: "physical transformation, loss of sensation, identity erosion" },
    { focus: "RELATIONSHIPS", cost: "harm to loved ones, isolation, emotional burden" },
    { focus: "KNOWLEDGE/PERCEPTION", cost: "ironic blindness, knowing too much, sensory overload" },
    { focus: "LIFE/DEATH", cost: "mortality exchange, undeath, permanent consequences" },
    { focus: "IDENTITY/MEMORY", cost: "forgetting oneself, erasure, becoming someone else" },
  ];

  // Choose variety that avoids recent patterns
  const varietyIndex = Math.floor(Math.random() * varietyInstructions.length);
  const selectedVariety = varietyInstructions[varietyIndex];
  prompt += `**Theme**: Focus on ${selectedVariety.focus} manipulation with ${selectedVariety.cost}.\n\n`;

  // Example format (culturally appropriate)
  const example = culture.examples[Math.floor(Math.random() * culture.examples.length)];
  prompt += `**Example format**:\n${example}\n\n`;

  // Avoidance context if recent abilities provided
  if (recentAbilities && recentAbilities.length > 0) {
    prompt += `**CRITICAL**: AVOID these recent gifts - do NOT repeat:\n`;
    recentAbilities.slice(0, 5).forEach((ability, i) => {
      prompt += `${i + 1}. "${ability}"\n`;
    });
    prompt += `\n`;
  }

  prompt += `Now generate a NEW, UNIQUE ability that fits the cultural context and user preferences. Make it poetic, memorable, and deeply meaningful. Output ONLY valid JSON: {"result":"..."}`;

  return prompt;
}

exports.handler = async (event) => {
  const nowMs = Date.now();
  const ip = getClientIp(event);
  const origin = getOrigin(event);

  const rawBody = safeParseBody(event.body);
  const parsedBody = requestSchema.safeParse(rawBody);
  const body = parsedBody.success ? parsedBody.data : {};
  const langRaw = body.lang || "en";
  const lang = ["en", "ko", "ja", "zh"].includes(langRaw) ? langRaw : "en";
  const recentAbilities = normalizeStringArray(body.recentAbilities, 5, 220);
  const preferencePatterns = normalizePreferencePatterns(body.preferencePatterns);
  const debug =
    body.debug === true ||
    event?.queryStringParameters?.debug === "1" ||
    process.env.DEBUG_OPENAI === "1";
  const fallbackText = pickFallback(lang);
  const respond = (result, info) => buildResponse(result, debug, info);
  const cacheKey = `${ip}:${lang}`;

  // Basic request size guard (prevents huge payload abuse).
  try {
    const bodyString = typeof event?.body === "string" ? event.body : "";
    if (bodyString && Buffer.byteLength(bodyString, "utf8") > 20000) {
      const cached = getCachedResultForKey(cacheKey, nowMs, 5000);
      return respond(cached || fallbackText, {
        source: cached ? "cache" : "fallback",
        reason: "body_too_large",
      });
    }
  } catch {
    // Ignore and proceed.
  }

  // Best-effort anti-abuse: allowlist origin + IP token bucket.
  if (!isAllowedOrigin(origin) || !rateLimitConsume(ip, nowMs)) {
    const cached = getCachedResultForKey(cacheKey, nowMs, 5000);
    await sleep(250);
    return respond(cached || fallbackText, {
      source: cached ? "cache" : "fallback",
      reason: !isAllowedOrigin(origin) ? "origin_blocked" : "rate_limited",
    });
  }
  const requestId =
    event?.headers?.["x-nf-request-id"] ||
    event?.headers?.["x-request-id"] ||
    null;

  console.log("generate:start", {
    requestId,
    method: event?.httpMethod,
    path: event?.path,
    debug,
    recentCount: recentAbilities.length,
    preferencePatterns: {
      likedCount: preferencePatterns.likedCount || 0,
      skippedCount: preferencePatterns.skippedCount || 0,
      totalGenerated: preferencePatterns.totalGenerated || 0,
    },
  });

  try {
    const apiKey =
      process.env.OPENAI_API_KEY ||
      process.env.OPENAI_KEY ||
      process.env.OPENAI_API_TOKEN;
    if (!apiKey) {
      console.error("Missing OPENAI_API_KEY");
      return respond(fallbackText, {
        source: "fallback",
        reason: "missing_api_key",
      });
    }

    const model = process.env.OPENAI_MODEL || "gpt-5-nano";

    const SYSTEM_PROMPT = generateSystemPrompt();
    const USER_PROMPT = generateUserPrompt(lang, recentAbilities, preferencePatterns);

    const responseFormat = {
      type: "json_schema",
      name: "ability_sentence",
      strict: true,
      schema: {
        type: "object",
        properties: {
          result: { type: "string" },
        },
        required: ["result"],
        additionalProperties: false,
      },
    };

    const requestOnce = async (maxTokens) => {
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          reasoning: { effort: "low" },
          text: {
            format: responseFormat,
            verbosity: "low",
          },
          input: [
            {
              role: "system",
              content: [{ type: "input_text", text: SYSTEM_PROMPT }],
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: USER_PROMPT,
                },
              ],
            },
          ],
          max_output_tokens: maxTokens,
        }),
      });

      if (!res.ok) {
        const raw = await res.json().catch(() => null);
        const message =
          raw?.error?.message || `OpenAI error: ${res.status}`;
        const error = new Error(message);
        error.status = res.status;
        error.code = raw?.error?.code;
        error.type = raw?.error?.type;
        error.request_id =
          raw?.error?.request_id ||
          raw?.error?.requestId ||
          null;
        throw error;
      }

      return res.json();
    };

    const tokenAttempts = [200, 500, 1000];
    const retryDelays = [0, 400, 900];
    let outputText = "";
    let lastError = null;

    for (const tokens of tokenAttempts) {
      for (let i = 0; i < retryDelays.length; i++) {
        try {
          if (retryDelays[i] > 0) await sleep(retryDelays[i]);
          const data = await requestOnce(tokens);
          outputText = extractOutputText(data);
          if (outputText.trim()) break;
        } catch (e) {
          lastError = e;
          const message = e instanceof Error ? e.message : String(e);
          const retryable = isRetryableError(e);
          const isMaxToken = message.includes("max_output_tokens");
          if (isMaxToken) {
            break;
          }
          if (!retryable || i === retryDelays.length - 1) {
            console.error("Raw OpenAI response error:", e);
          } else {
            console.warn("Retrying OpenAI request after server_error");
            continue;
          }
        }
      }
      if (outputText.trim()) break;
    }

    if (!outputText.trim()) {
      const message =
        lastError instanceof Error ? lastError.message : String(lastError);
      console.error("OpenAI response failed, using fallback:", message);
      const cached = getCachedResult(lang);
      if (cached) {
        return respond(cached, {
          source: "cache",
          reason: "openai_error",
          error: message,
        });
      }
      return respond(fallbackText, {
        source: "fallback",
        reason: "openai_error",
        error: message,
      });
    }

    let result = "";
    try {
      const parsed = JSON.parse(outputText);
      result = String(parsed?.result ?? "").trim();
    } catch (parseError) {
      console.error("OpenAI parse failed, using fallback:", parseError);
      return respond(fallbackText, {
        source: "fallback",
        reason: "parse_error",
      });
    }

    if (!result) {
      const cached = getCachedResult(lang);
      if (cached) {
        return respond(cached, {
          source: "cache",
          reason: "empty_result",
        });
      }
      return respond(fallbackText, {
        source: "fallback",
        reason: "empty_result",
      });
    }

    setCachedResultForKey(cacheKey, result);
    return respond(result, { source: "openai", model });
  } catch (err) {
    console.error("Function error", err);
    const cached = getCachedResult(lang);
    if (cached) {
      return respond(cached, {
        source: "cache",
        reason: "exception",
        error: err?.message,
      });
    }
    return respond(fallbackText, {
      source: "fallback",
      reason: "exception",
      error: err?.message,
    });
  }
};

const FALLBACKS = {
  en: [
    "Can rewrite memories, but forgets their own name each time.",
    "Can teleport anywhere, but arrives with a shattered bone.",
    "Can heal any wound, but takes the pain as permanent scars.",
    "Can see the future, but goes blind for a day after each vision.",
    "Can control metal, but their heart slowly turns to iron.",
  ],
  ko: [
    "기억을 바꿀 수 있지만, 사용할 때마다 자신의 이름을 잊는다.",
    "순간이동할 수 있지만, 도착할 때마다 뼈가 하나씩 부러진다.",
    "어떤 상처든 치유하지만, 그 고통이 영원한 흉터가 된다.",
    "미래를 볼 수 있지만, 매번 하루 동안 실명한다.",
    "금속을 지배하지만, 심장이 점점 철이 되어간다.",
  ],
  ja: [
    "記憶を改ざんできるが、使うたびに自分の名前を忘れる。",
    "どこへでも瞬間移動できるが、到着時に骨が一つ砕ける。",
    "あらゆる傷を癒せるが、その痛みが永遠の傷跡になる。",
    "未来が見えるが、見るたびに一日だけ失明する。",
    "金属を操れるが、心臓が少しずつ鉄になる。",
  ],
  zh: [
    "能改写记忆，但每次使用都会忘记自己的名字。",
    "能瞬间移动，但每次到达都会骨折一处。",
    "能治愈任何伤口，但痛苦会化作永久疤痕。",
    "能预见未来，但每次都会失明一天。",
    "能操控金属，但心脏会慢慢变成铁。",
  ],
};

const LAST_SUCCESS = {
  en: "",
  ko: "",
  ja: "",
  zh: "",
};

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
  const cached = LAST_SUCCESS[lang];
  return typeof cached === "string" && cached.trim() ? cached : "";
}

exports.handler = async (event) => {
  const body = safeParseBody(event.body);
  const lang = body?.lang || "en";
  const debug =
    body?.debug === true ||
    event?.queryStringParameters?.debug === "1" ||
    process.env.DEBUG_OPENAI === "1";
  const fallbackText = pickFallback(lang);
  const respond = (result, info) => buildResponse(result, debug, info);
  const requestId =
    event?.headers?.["x-nf-request-id"] ||
    event?.headers?.["x-request-id"] ||
    null;

  console.log("generate:start", {
    requestId,
    method: event?.httpMethod,
    path: event?.path,
    debug,
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

    const languageMap = {
      ko: "Korean",
      ja: "Japanese",
      zh: "Chinese",
      en: "English",
    };
    const outputLanguage = languageMap[lang] || "English";
    const model = process.env.OPENAI_MODEL || "gpt-5-nano";

    const SYSTEM_PROMPT = `
You generate ONE short anime-style sentence.
Describe a powerful ability and its serious drawback.
No names. No story. One sentence only.
`;

    const USER_PROMPT = `
Write it naturally in ${outputLanguage}.

Example:
"Can stop time, but loses a year of life each time the power is used."

Now write a new sentence.
`;

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
                  text: `${USER_PROMPT}\nOutput ONLY valid JSON: {"result":"..."}\n`,
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

    const tokenAttempts = [120, 200, 320];
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

    LAST_SUCCESS[lang] = result;
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

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
      };
    }

    const { lang = "en" } = JSON.parse(event.body || "{}");

    const languageMap = {
      ko: "Korean",
      ja: "Japanese",
      zh: "Chinese",
      en: "English",
    };
    const outputLanguage = languageMap[lang] || "English";

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

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        reasoning: { effort: "low" },
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: SYSTEM_PROMPT }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: USER_PROMPT }],
          },
        ],
        max_output_tokens: 80,
      }),
    });

    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message =
        raw?.error?.message ||
        `OpenAI API error (status ${res.status})`;
      return {
        statusCode: res.status,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: message }),
      };
    }

    // 🔴 핵심: 모든 경로를 커버하는 텍스트 추출기
    let text = "";

    // 1) output_text shortcut
    if (typeof raw.output_text === "string") {
      text = raw.output_text;
    }

    // 2) output[].type === "output_text"
    if (!text && Array.isArray(raw.output)) {
      for (const item of raw.output) {
        if (item?.type === "output_text" && typeof item.text === "string") {
          text += item.text;
        }
      }
    }

    // 3) output[].content[].type === "output_text"
    if (!text && Array.isArray(raw.output)) {
      for (const item of raw.output) {
        if (Array.isArray(item.content)) {
          for (const c of item.content) {
            if (
              (c.type === "output_text" || c.type === "text") &&
              typeof c.text === "string"
            ) {
              text += c.text;
            }
          }
        }
      }
    }

    // 4) Chat Completions fallback (if endpoint changes)
    if (!text && Array.isArray(raw.choices)) {
      const choiceText = raw.choices[0]?.message?.content;
      if (typeof choiceText === "string") text = choiceText;
    }

    text = text.trim();

    if (!text) {
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Model returned no usable text" }),
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: text }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message || "Unknown error" }),
    };
  }
};

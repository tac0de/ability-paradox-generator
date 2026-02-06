exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
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
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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

    const raw = await res.json();

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
            if (c.type === "output_text" && typeof c.text === "string") {
              text += c.text;
            }
          }
        }
      }
    }

    text = text.trim();

    if (!text) {
      throw new Error("Model returned no usable text");
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: text }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

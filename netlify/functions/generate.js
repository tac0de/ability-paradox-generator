const fetch = require("node-fetch");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const lang = body.lang || "en";

    const languageMap = {
      ko: "Korean",
      ja: "Japanese",
      zh: "Chinese",
      en: "English",
    };

    const outputLanguage = languageMap[lang] || "English";

    const prompt = `
Create ONE sentence describing an anime-style character ability with a powerful strength and a critical debuff.

Rules:
- No character names
- No story or worldbuilding
- No explanations
- Exactly one sentence
- Focus only on ability and its cost or limitation
- Tone: anime / dramatic / concise
- Output language MUST be ${outputLanguage}

If no valid sentence can be produced, output a simple example sentence.
`;

    const openaiRes = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        input: prompt,
        max_output_tokens: 120,
      }),
    });

    const rawText = await openaiRes.text();

    if (!openaiRes.ok) {
      throw new Error(`OpenAI error ${openaiRes.status}: ${rawText}`);
    }

    let resultText = "";

    try {
      const data = JSON.parse(rawText);

      if (Array.isArray(data.output)) {
        for (const item of data.output) {
          if (Array.isArray(item.content)) {
            for (const c of item.content) {
              if (c.type === "output_text" && c.text) {
                resultText += c.text;
              }
            }
          }
        }
      }
    } catch (e) {
      throw new Error("Failed to parse OpenAI response: " + rawText);
    }

    resultText = resultText.trim();

    // 🔒 최종 안전망 (절대 빈 값 반환 안 함)
    if (!resultText) {
      resultText =
        "Grants overwhelming power, but each use permanently weakens the user’s body.";
    }

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ result: resultText }),
    };
  } catch (err) {
    // 🔴 디버그용: 에러를 그대로 내려보냄
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        error: err.message,
      }),
    };
  }
};

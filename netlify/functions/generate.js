exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    const { lang } = JSON.parse(event.body);

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
- Only one sentence
- Focus on ability and its cost or limitation
- Tone: anime / dramatic / concise
- Output language: ${outputLanguage}
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        input: prompt,
        max_output_tokens: 60,
      }),
    });

    const data = await response.json();
    const text = data.output_text || data.output?.[0]?.content?.[0]?.text || "";

    return {
      statusCode: 200,
      body: JSON.stringify({ result: text.trim() }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

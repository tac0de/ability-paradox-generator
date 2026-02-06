exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const lang = body.lang || "en";

    const languageMap = {
      ko: "Korean",
      ja: "Japanese",
      zh: "Chinese",
      en: "English",
    };

    const outputLanguage = languageMap[lang] || "English";

    const prompt = `
Write a short anime-style sentence describing a character ability and its serious drawback.

The sentence should mention:
- what the ability does
- what price or limitation it has

Write it naturally in ${outputLanguage}.

Example:
"Can stop time, but loses a year of life each time the power is used."

Now write a new sentence:
`;

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-nano",
        input: prompt,
        max_output_tokens: 40,
      }),
    });

    const raw = await res.text();

    if (!res.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({ error: raw }),
      };
    }

    let text = "";

    const data = JSON.parse(raw);
    if (Array.isArray(data.output)) {
      for (const item of data.output) {
        if (Array.isArray(item.content)) {
          for (const c of item.content) {
            if (c.type === "output_text" && c.text) {
              text += c.text;
            }
          }
        }
      }
    }

    if (!text.trim()) {
      text =
        "Grants immense power, but each use permanently damages the user's body.";
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: text.trim() }),
    };
  } catch (err) {
    return {
      statusCode: 200,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

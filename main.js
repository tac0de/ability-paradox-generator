const btn = document.getElementById("generateBtn");
const resultDiv = document.getElementById("result");
const langSelect = document.getElementById("langSelect");
const title = document.getElementById("title");
const desc = document.getElementById("desc");

const UI_TEXT = {
  en: {
    title: "Ability Paradox Generator",
    desc: "Generate a single sentence describing a powerful anime-style ability and its unavoidable debuff.",
    btn: "Generate",
    loading: "Generating...",
  },
  ko: {
    title: "능력 패러독스 생성기",
    desc: "강력한 애니 능력과 피할 수 없는 디버프를 한 문장으로 생성합니다.",
    btn: "생성하기",
    loading: "생성 중...",
  },
  ja: {
    title: "能力パラドックス生成器",
    desc: "強力なアニメ能力と致命的な制約を一文で生成します。",
    btn: "生成する",
    loading: "生成中...",
  },
  zh: {
    title: "能力悖论生成器",
    desc: "生成一句包含强大能力与致命代价的动漫风格设定。",
    btn: "生成",
    loading: "生成中...",
  },
};

function applyLang(lang) {
  const t = UI_TEXT[lang] || UI_TEXT.en;
  title.textContent = t.title;
  desc.textContent = t.desc;
  btn.textContent = t.btn;
}

langSelect.addEventListener("change", () => {
  applyLang(langSelect.value);
});

applyLang(langSelect.value);

let busy = false;

btn.addEventListener("click", async () => {
  if (busy) return;
  busy = true;
  btn.disabled = true;

  const lang = langSelect.value;
  const loadingText = (UI_TEXT[lang] || UI_TEXT.en).loading;
  resultDiv.textContent = loadingText;

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang }),
    });

    if (!res.ok) throw new Error("Request failed");
    const data = await res.json();
    resultDiv.textContent = data.result || "";
  } catch (e) {
    resultDiv.textContent = "Error. Please try again.";
  } finally {
    busy = false;
    btn.disabled = false;
  }
});

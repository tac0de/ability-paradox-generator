// Elements
const btn = document.getElementById("generateBtn");
const resultDiv = document.getElementById("result");
const resultText = document.getElementById("resultText");
const resultActions = document.getElementById("resultActions");
const copyBtn = document.getElementById("copyBtn");
const shareBtn = document.getElementById("shareBtn");
const favoriteBtn = document.getElementById("favoriteBtn");
const langSelect = document.getElementById("langSelect");
const title = document.getElementById("title");
const desc = document.getElementById("desc");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");
const historyList = document.getElementById("historyList");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");

// Modal elements
const privacyModal = document.getElementById("privacyModal");
const privacyLink = document.getElementById("privacyLink");
const closePrivacy = document.getElementById("closePrivacy");

// Stats elements
const generatedCount = document.getElementById("generatedCount");
const historyCount = document.getElementById("historyCount");
const favoriteCount = document.getElementById("favoriteCount");
const generatedLabel = document.getElementById("generatedLabel");
const historyLabel = document.getElementById("historyLabel");
const favoriteLabel = document.getElementById("favoriteLabel");
const historyTitle = document.getElementById("historyTitle");
const emptyHistoryText = document.getElementById("emptyHistoryText");

// State
let busy = false;
let currentResult = "";
let generatedTotal = parseInt(localStorage.getItem("generatedTotal") || "0");

// History & Favorites
let history = JSON.parse(localStorage.getItem("history") || "[]");
let favorites = new Set(JSON.parse(localStorage.getItem("favorites") || "[]"));

// UI Text Translations
const UI_TEXT = {
  en: {
    title: "⚡ Ability Paradox Generator",
    desc: "Generate a single sentence describing a powerful anime-style ability and its unavoidable debuff.",
    btn: "✨ Generate",
    loading: "✨ Generating...",
    copy: "📋 Copy",
    share: "🔗 Share",
    favorite: "⭐ Favorite",
    favorited: "⭐ Favorited",
    copied: "✓ Copied!",
    copyError: "Copy failed",
    addedToHistory: "✓ Added to history!",
    addedToFavorites: "✓ Added to favorites!",
    removedFromFavorites: "✓ Removed from favorites!",
    historyTitle: "📚 History",
    clearHistory: "🗑️ Clear",
    emptyHistory: "No history yet. Generate something!",
    generated: "Generated",
    inHistory: "In History",
    favorites: "Favorites",
  },
  ko: {
    title: "⚡ 능력 패러독스 생성기",
    desc: "강력한 애니 능력과 피할 수 없는 디버프를 한 문장으로 생성합니다.",
    btn: "✨ 생성하기",
    loading: "✨ 생성 중...",
    copy: "📋 복사",
    share: "🔗 공유",
    favorite: "⭐ 즐겨찾기",
    favorited: "⭐ 즐겨찾기됨",
    copied: "✓ 복사됨!",
    copyError: "복사 실패",
    addedToHistory: "✓ 히스토리에 추가됨!",
    addedToFavorites: "✓ 즐겨찾기에 추가됨!",
    removedFromFavorites: "✓ 즐겨찾기에서 제거됨!",
    historyTitle: "📚 히스토리",
    clearHistory: "🗑️ 지우기",
    emptyHistory: "아직 히스토리가 없습니다. 생성해보세요!",
    generated: "생성됨",
    inHistory: "히스토리",
    favorites: "즐겨찾기",
  },
  ja: {
    title: "⚡ 能力パラドックス生成器",
    desc: "強力なアニメ能力と致命的な制約を一文で生成します。",
    btn: "✨ 生成する",
    loading: "✨ 生成中...",
    copy: "📋 コピー",
    share: "🔗 共有",
    favorite: "⭐ お気に入り",
    favorited: "⭐ お気に入り済み",
    copied: "✓ コピーしました！",
    copyError: "コピー失敗",
    addedToHistory: "✓ 履歴に追加しました！",
    addedToFavorites: "✓ お気に入りに追加しました！",
    removedFromFavorites: "✓ お気に入りから削除しました！",
    historyTitle: "📚 履歴",
    clearHistory: "🗑️ クリア",
    emptyHistory: "まだ履歴がありません。生成してみましょう！",
    generated: "生成数",
    inHistory: "履歴",
    favorites: "お気に入り",
  },
  zh: {
    title: "⚡ 能力悖论生成器",
    desc: "生成一句包含强大能力与致命代价的动漫风格设定。",
    btn: "✨ 生成",
    loading: "✨ 生成中...",
    copy: "📋 复制",
    share: "🔗 分享",
    favorite: "⭐ 收藏",
    favorited: "⭐ 已收藏",
    copied: "✓ 已复制！",
    copyError: "复制失败",
    addedToHistory: "✓ 已添加到历史！",
    addedToFavorites: "✓ 已添加到收藏！",
    removedFromFavorites: "✓ 已从收藏移除！",
    historyTitle: "📚 历史",
    clearHistory: "🗑️ 清空",
    emptyHistory: "暂无历史记录。开始生成吧！",
    generated: "已生成",
    inHistory: "历史",
    favorites: "收藏",
  },
};

// Apply language
function applyLang(lang) {
  const t = UI_TEXT[lang] || UI_TEXT.en;
  title.textContent = t.title;
  desc.textContent = t.desc;
  btn.textContent = t.btn;
  copyBtn.textContent = t.copy;
  shareBtn.textContent = t.share;
  updateFavoriteButton();
  historyTitle.textContent = t.historyTitle;
  clearHistoryBtn.textContent = t.clearHistory;
  emptyHistoryText.textContent = t.emptyHistory;
  generatedLabel.textContent = t.generated;
  historyLabel.textContent = t.inHistory;
  favoriteLabel.textContent = t.favorites;
}

// Detect browser language
function detectLanguage() {
  const browserLang = navigator.language || navigator.languages?.[0] || "en";
  const langCode = browserLang.split("-")[0];
  if (["en", "ko", "ja", "zh"].includes(langCode)) {
    langSelect.value = langCode;
  }
}

// Toast notification
function showToast(message, duration = 2000) {
  toastMessage.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
}

// Update stats display
function updateStats() {
  generatedCount.textContent = generatedTotal;
  historyCount.textContent = history.length;
  favoriteCount.textContent = favorites.size;
}

// Save to localStorage
function saveData() {
  localStorage.setItem("history", JSON.stringify(history));
  localStorage.setItem("favorites", JSON.stringify([...favorites]));
  localStorage.setItem("generatedTotal", generatedTotal.toString());
}

// Update favorite button state
function updateFavoriteButton() {
  const lang = langSelect.value;
  const t = UI_TEXT[lang] || UI_TEXT.en;
  const isFav = favorites.has(currentResult);

  if (isFav) {
    favoriteBtn.textContent = t.favorited;
    favoriteBtn.classList.add("active");
  } else {
    favoriteBtn.textContent = t.favorite;
    favoriteBtn.classList.remove("active");
  }
}

// Render history
function renderHistory() {
  const lang = langSelect.value;
  const t = UI_TEXT[lang] || UI_TEXT.en;

  if (history.length === 0) {
    historyList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <p>${t.emptyHistory}</p>
      </div>
    `;
    return;
  }

  historyList.innerHTML = history
    .map((item, index) => {
      const isFav = favorites.has(item.text);
      const favClass = isFav ? "favorite" : "";
      const favIcon = isFav ? "⭐" : "☆";
      return `
        <div class="history-item ${favClass} fade-in">
          <p class="history-text">${escapeHtml(item.text)}</p>
          <div class="history-actions">
            <button class="history-action-btn" onclick="copyHistoryItem(${index})">📋 ${t.copy.split(" ")[1]}</button>
            <button class="history-action-btn" onclick="toggleFavorite(${index})">${favIcon} ${isFav ? "Unfavorite" : "Favorite"}</button>
            <button class="history-action-btn" onclick="deleteHistoryItem(${index})">🗑️</button>
          </div>
        </div>
      `;
    })
    .join("");
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Add to history
function addToHistory(text) {
  const item = {
    text,
    timestamp: Date.now(),
    lang: langSelect.value,
  };

  // Add to beginning
  history.unshift(item);

  // Limit to 50 items
  if (history.length > 50) {
    const removed = history.pop();
    favorites.delete(removed.text);
  }

  saveData();
  renderHistory();
  updateStats();
}

// Copy history item
window.copyHistoryItem = async function (index) {
  const text = history[index].text;
  try {
    await navigator.clipboard.writeText(text);
    const lang = langSelect.value;
    const t = UI_TEXT[lang] || UI_TEXT.en;
    showToast(t.copied);
  } catch (e) {
    const lang = langSelect.value;
    const t = UI_TEXT[lang] || UI_TEXT.en;
    alert(t.copyError);
  }
};

// Toggle favorite
window.toggleFavorite = function (index) {
  const text = history[index].text;
  const lang = langSelect.value;
  const t = UI_TEXT[lang] || UI_TEXT.en;

  if (favorites.has(text)) {
    favorites.delete(text);
    showToast(t.removedFromFavorites);
  } else {
    favorites.add(text);
    showToast(t.addedToFavorites);
  }

  saveData();
  renderHistory();
  updateStats();

  // Update current favorite button if it's the same result
  if (currentResult === text) {
    updateFavoriteButton();
  }
};

// Delete history item
window.deleteHistoryItem = function (index) {
  const text = history[index].text;
  history.splice(index, 1);
  favorites.delete(text);
  saveData();
  renderHistory();
  updateStats();

  // Update current favorite button if it's the same result
  if (currentResult === text) {
    updateFavoriteButton();
  }
};

// Generate ability
btn.addEventListener("click", async () => {
  if (busy) return;
  busy = true;
  btn.disabled = true;

  const lang = langSelect.value;
  const loadingText = (UI_TEXT[lang] || UI_TEXT.en).loading;
  resultText.textContent = loadingText;
  resultText.classList.add("loading");
  resultActions.hidden = true;

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lang }),
    });

    if (!res.ok) throw new Error("Request failed");
    const data = await res.json();

    currentResult = data.result || "";
    resultText.textContent = currentResult;
    resultText.classList.remove("loading");
    resultActions.hidden = !currentResult;

    // Add to history and update stats
    if (currentResult) {
      addToHistory(currentResult);
      generatedTotal++;
      updateStats();
      saveData();

      // Check if favorited
      updateFavoriteButton();
    }
  } catch (e) {
    resultText.textContent = "Error. Please try again.";
    resultText.classList.remove("loading");
    resultActions.hidden = true;
  } finally {
    busy = false;
    btn.disabled = false;
  }
});

// Copy to clipboard
copyBtn.addEventListener("click", async () => {
  if (!currentResult) return;

  try {
    await navigator.clipboard.writeText(currentResult);
    const lang = langSelect.value;
    const t = UI_TEXT[lang] || UI_TEXT.en;
    showToast(t.copied);
  } catch (e) {
    const lang = langSelect.value;
    const t = UI_TEXT[lang] || UI_TEXT.en;
    alert(t.copyError);
  }
});

// Share
shareBtn.addEventListener("click", async () => {
  if (!currentResult) return;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Ability Paradox",
        text: currentResult,
      });
    } catch (e) {
      // User cancelled or share failed
    }
  } else {
    copyBtn.click();
  }
});

// Toggle favorite for current result
favoriteBtn.addEventListener("click", () => {
  if (!currentResult) return;

  const lang = langSelect.value;
  const t = UI_TEXT[lang] || UI_TEXT.en;

  if (favorites.has(currentResult)) {
    favorites.delete(currentResult);
    showToast(t.removedFromFavorites);
  } else {
    favorites.add(currentResult);
    showToast(t.addedToFavorites);
  }

  saveData();
  updateStats();
  renderHistory();
  updateFavoriteButton();
});

// Clear history
clearHistoryBtn.addEventListener("click", () => {
  if (history.length === 0) return;

  if (!confirm("Are you sure you want to clear all history?")) return;

  history = [];
  favorites.clear();
  saveData();
  renderHistory();
  updateStats();
  updateFavoriteButton();
});

// Language change
langSelect.addEventListener("change", () => {
  applyLang(langSelect.value);
});

// Keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // ESC to close modal or clear result
  if (e.key === "Escape") {
    if (privacyModal.classList.contains("show")) {
      privacyModal.classList.remove("show");
    } else {
      currentResult = "";
      resultText.textContent = "";
      resultActions.hidden = true;
      updateFavoriteButton();
    }
  }

  // Enter to generate (if not typing in an input)
  if (e.key === "Enter" && !e.target.matches("input, textarea")) {
    e.preventDefault();
    btn.click();
  }
});

// Privacy modal
privacyLink.addEventListener("click", (e) => {
  e.preventDefault();
  privacyModal.classList.add("show");
});

closePrivacy.addEventListener("click", () => {
  privacyModal.classList.remove("show");
});

privacyModal.addEventListener("click", (e) => {
  if (e.target === privacyModal) {
    privacyModal.classList.remove("show");
  }
});

// Initialize
detectLanguage();
applyLang(langSelect.value);
renderHistory();
updateStats();

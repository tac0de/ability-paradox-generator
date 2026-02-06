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
const themeToggle = document.getElementById("themeToggle");
const colorToggle = document.getElementById("colorToggle");

// Theme state
let currentTheme = localStorage.getItem("theme") || "dark";
let currentColor = localStorage.getItem("color") || "purple";

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
const loadingContainer = document.getElementById("loadingContainer");
const loadingText = document.getElementById("loadingText");
const loadingSubtext = document.getElementById("loadingSubtext");

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
    title: "⚡ Anime Power Generator",
    desc: "Create unique anime abilities with a twist - every power comes with a cost.",
    btn: "✨ Generate",
    loading: "✨ Generating...",
    copy: "📋 Copy",
    share: "🔗 Share",
    favorite: "⭐ Favorite",
    favorited: "⭐ Favorited",
    unfavorite: "Remove Favorite",
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
    title: "⚡ 애니 능력 생성기",
    desc: "독특한 애니 능력을 만들어보세요. 모든 능력에는 대가가 따릅니다.",
    btn: "✨ 생성하기",
    loading: "✨ 생성 중...",
    copy: "📋 복사",
    share: "🔗 공유",
    favorite: "⭐ 즐겨찾기",
    favorited: "⭐ 즐겨찾기됨",
    unfavorite: "즐겨찾기 제거",
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
    title: "⚡ アニメ能力生成器",
    desc: "ユニークなアニメの能力を作成。すべての能力には代償があります。",
    btn: "✨ 生成する",
    loading: "✨ 生成中...",
    copy: "📋 コピー",
    share: "🔗 共有",
    favorite: "⭐ お気に入り",
    favorited: "⭐ お気に入り済み",
    unfavorite: "お気に入り解除",
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
    title: "⚡ 动漫能力生成器",
    desc: "创造独特的动漫能力——每个能力都有代价。",
    btn: "✨ 生成",
    loading: "✨ 生成中...",
    copy: "📋 复制",
    share: "🔗 分享",
    favorite: "⭐ 收藏",
    favorited: "⭐ 已收藏",
    unfavorite: "取消收藏",
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

// Theme functions
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  currentTheme = theme;
}

function applyColor(color) {
  if (color === "purple") {
    document.documentElement.removeAttribute("data-color");
  } else {
    document.documentElement.setAttribute("data-color", color);
  }
  localStorage.setItem("color", color);
  currentColor = color;
}

function toggleTheme() {
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  applyTheme(newTheme);
  // Add flash effect to button
  themeToggle.classList.add("flash-effect");
  setTimeout(() => themeToggle.classList.remove("flash-effect"), 600);
}

function toggleColor() {
  const colors = ["purple", "blue", "green", "orange", "pink"];
  const currentIndex = colors.indexOf(currentColor);
  const nextIndex = (currentIndex + 1) % colors.length;
  const nextColor = colors[nextIndex];
  applyColor(nextColor);
  // Add flash effect to button
  colorToggle.classList.add("flash-effect");
  setTimeout(() => colorToggle.classList.remove("flash-effect"), 600);
}

// Initialize theme
applyTheme(currentTheme);
applyColor(currentColor);

// Theme toggle listeners
themeToggle.addEventListener("click", toggleTheme);
colorToggle.addEventListener("click", toggleColor);

// Detect browser language
function detectLanguage() {
  // Try multiple sources for browser language
  const browserLang = navigator.language || navigator.userLanguage || navigator.languages?.[0] || navigator.browserLanguage || "en";

  // Extract language code (e.g., "ko-KR" -> "ko")
  const langCode = browserLang.split("-")[0].toLowerCase();

  // Debug log (remove in production if needed)
  console.log("Detected browser language:", browserLang, "->", langCode);

  // Only set if supported
  if (["en", "ko", "ja", "zh"].includes(langCode)) {
    langSelect.value = langCode;
    console.log("Set language to:", langCode);
  } else {
    console.log("Language not supported, using default: en");
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
      const favText = isFav ? t.unfavorite : t.favorite.split(" ")[1];
      return `
        <div class="history-item ${favClass} fade-in">
          <p class="history-text">${escapeHtml(item.text)}</p>
          <div class="history-actions">
            <button class="history-action-btn" onclick="copyHistoryItem(${index})">📋 ${t.copy.split(" ")[1]}</button>
            <button class="history-action-btn" onclick="toggleFavorite(${index})">${favIcon} ${favText}</button>
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

  // Add flash effect to button
  btn.classList.add("flash-effect");
  setTimeout(() => btn.classList.remove("flash-effect"), 600);

  const lang = langSelect.value;
  const loadingLabel = (UI_TEXT[lang] || UI_TEXT.en).loading;

  // Show loading UI
  loadingContainer.hidden = false;
  loadingText.textContent = loadingLabel;
  loadingSubtext.textContent = "Consulting the anime gods...";
  resultText.classList.remove("show");
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

    // Hide loading, show result
    loadingContainer.hidden = true;
    resultText.textContent = currentResult;

    // Show result with animation
    setTimeout(() => {
      resultText.classList.add("show");
    }, 50);

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
    loadingContainer.hidden = true;
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

  const lang = langSelect.value;
  const t = UI_TEXT[lang] || UI_TEXT.en;

  if (navigator.share) {
    try {
      await navigator.share({
        title: "Ability Paradox Generator",
        text: `${currentResult}\n\nGenerated by: ${window.location.href}`,
        url: window.location.href,
      });
    } catch (e) {
      // User cancelled - do nothing
      if (e.name !== 'AbortError') {
        showToast(t.copied);
      }
    }
  } else {
    // Fallback: copy both text and URL
    const shareText = `${currentResult}\n\nGenerated by: ${window.location.href}`;
    try {
      await navigator.clipboard.writeText(shareText);
      showToast(t.copied);
    } catch (e) {
      alert(t.copyError);
    }
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

// Show share button only on devices that support native sharing
if (!navigator.share) {
  shareBtn.style.display = 'none';
}

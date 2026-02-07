// =====================================================
// THE DIVINE PARADOX - Main Logic
// =====================================================

// Elements
const btn = document.getElementById("generateBtn");
const resultContainer = document.getElementById("result");
const resultText = document.getElementById("resultText");
const resultActions = document.getElementById("resultActions");
const copyBtn = document.getElementById("copyBtn");
const langSelect = document.getElementById("langSelect");
const title = document.getElementById("title");
const desc = document.getElementById("desc");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toastMessage");
const godEntity = document.querySelector(".god-entity");
const loadingContainer = document.getElementById("loadingContainer");
const loadingText = document.getElementById("loadingText");

// Modal elements
const privacyModal = document.getElementById("privacyModal");
const privacyLink = document.getElementById("privacyLink");
const closePrivacy = document.getElementById("closePrivacy");
const closeAchievements = document.getElementById("closeAchievements");
const closeTreasury = document.getElementById("closeTreasury");

// Stats elements
const generatedCount = document.getElementById("generatedCount");
const generatedLabel = document.getElementById("generatedLabel");
const comboCount = document.getElementById("comboCount");
const favorLabel = document.getElementById("favorLabel");
const saveBtn = document.getElementById("saveBtn");
const achievementsBtn = document.getElementById("achievementsBtn");
const treasuryBtn = document.getElementById("treasuryBtn");
const supportBtn = document.getElementById("supportBtn");
const privacyTitle = document.getElementById("privacyTitle");
const achievementsTitle = document.getElementById("achievementsTitle");
const treasuryTitle = document.getElementById("treasuryTitle");
const aboutLink = document.getElementById("aboutLink");
const contactLink = document.getElementById("contactLink");
const footerNote = document.getElementById("footerNote");
const exportTreasuryBtn = document.getElementById("exportTreasury");
const clearTreasuryBtn = document.getElementById("clearTreasury");

const DP_CONFIG = window.DP_CONFIG || {};
const STORAGE_KEYS = DP_CONFIG.STORAGE_KEYS || {};
const LIMITS = DP_CONFIG.LIMITS || {};
const RARITY = DP_CONFIG.RARITY || {
  COMMON: { name: "common", color: "#ffffff", weight: 60 },
  RARE: { name: "rare", color: "#4a9eff", weight: 25 },
  EPIC: { name: "epic", color: "#a855f7", weight: 12 },
  LEGENDARY: { name: "legendary", color: "#f59e0b", weight: 3 },
};
const ACHIEVEMENTS_DEF = DP_CONFIG.ACHIEVEMENTS_DEF || {};
const RECENT_ABILITIES_KEY = STORAGE_KEYS.recentAbilities || "divine_recentAbilities";
const LIKED_ABILITIES_KEY = STORAGE_KEYS.likedAbilities || "divine_likedAbilities";
const SKIPPED_ABILITIES_KEY = STORAGE_KEYS.skippedAbilities || "divine_skippedAbilities";
const COMBO_KEY = STORAGE_KEYS.combo || "divine_combo";
const ACHIEVEMENTS_KEY = STORAGE_KEYS.achievements || "divine_achievements";
const TREASURY_KEY = STORAGE_KEYS.treasury || "divine_treasury";
const DAILY_KEY = STORAGE_KEYS.daily || "divine_daily";
const ATTITUDE_KEY = STORAGE_KEYS.attitude || "divine_attitude";
const DAILY_STREAK_KEY = STORAGE_KEYS.dailyStreak || "divine_dailyStreak";
const MAX_RECENT = LIMITS.maxRecent || 20;
const MAX_PREFERENCES = LIMITS.maxPreferences || 50;
const MAX_TREASURY = LIMITS.maxTreasury || 100;
const GENERATE_COOLDOWN_MS = LIMITS.generateCooldownMs || 1200;

// State
let busy = false;
let currentResult = "";
let currentRarity = "";
let currentResultHandled = false;
let generatedTotal =
  (window.DP_STATE && window.DP_STATE.getNumber)
    ? window.DP_STATE.getNumber(STORAGE_KEYS.generatedTotal || "divine_generatedTotal", 0)
    : parseInt(localStorage.getItem(STORAGE_KEYS.generatedTotal || "divine_generatedTotal") || "0");
let hasGenerated = false;
let lastGenerateAtMs = 0;

const sleepMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// =====================================================
// COMBO SYSTEM
// =====================================================
function getCombo() {
  try {
    return parseInt(localStorage.getItem(COMBO_KEY) || "0");
  } catch {
    return 0;
  }
}

function setCombo(count) {
  try {
    localStorage.setItem(COMBO_KEY, count.toString());
  } catch (e) {
    console.warn("Could not save combo:", e);
  }
}

function incrementCombo() {
  const current = getCombo();
  const newCombo = current + 1;
  setCombo(newCombo);
  updateComboDisplay();
  return newCombo;
}

function resetCombo() {
  setCombo(0);
  updateComboDisplay();
}

function updateComboDisplay() {
  const combo = getCombo();
  const comboElement = document.getElementById("comboCount");
  if (comboElement) {
    comboElement.textContent = `${Math.max(combo, 0) + 1}x`;
  }

  // Update god entity visual based on combo
  if (godEntity) {
    godEntity.classList.remove("combo-low", "combo-medium", "combo-high", "combo-divine");
    if (combo >= 20) {
      godEntity.classList.add("combo-divine");
    } else if (combo >= 10) {
      godEntity.classList.add("combo-high");
    } else if (combo >= 5) {
      godEntity.classList.add("combo-medium");
    } else if (combo >= 3) {
      godEntity.classList.add("combo-low");
    }
  }
}

// =====================================================
// RARITY SYSTEM
// =====================================================
function generateRarity(combo = 0) {
  if (window.DP_RARITY && typeof window.DP_RARITY.generateRarity === "function") {
    return window.DP_RARITY.generateRarity(RARITY, combo);
  }
  return RARITY.COMMON;
}

function getRarityColor(rarityName) {
  if (window.DP_RARITY && typeof window.DP_RARITY.getRarityColor === "function") {
    return window.DP_RARITY.getRarityColor(RARITY, rarityName);
  }
  const rarity = Object.values(RARITY).find((r) => r.name === rarityName);
  return rarity ? rarity.color : RARITY.COMMON.color;
}

// =====================================================
// ACHIEVEMENT SYSTEM
// =====================================================
function getAchievements() {
  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function unlockAchievement(achievementId) {
  const achievements = getAchievements();
  if (achievements.includes(achievementId)) return false;

  achievements.push(achievementId);
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    return true;
  } catch (e) {
    console.warn("Could not save achievement:", e);
    return false;
  }
}

function checkAchievements(lang = "en") {
  const unlocked = getAchievements();
  const achievements = [];
  const liked = getLikedAbilities();
  const skipped = getSkippedAbilities();
  const treasury = getTreasury();
  const dailyStreak = getDailyStreak();
  const combo = getCombo();

  // Check each achievement
  for (const [key, def] of Object.entries(ACHIEVEMENTS_DEF)) {
    if (unlocked.includes(def.id)) {
      achievements.push({ ...def, unlocked: true });
      continue;
    }

    let meetsRequirement = false;
    switch (def.requirement.type) {
      case "generated":
        meetsRequirement = generatedTotal >= def.requirement.value;
        break;
      case "combo":
        meetsRequirement = combo >= def.requirement.value;
        break;
      case "treasury":
        meetsRequirement = treasury.length >= def.requirement.value;
        break;
      case "skipped":
        meetsRequirement = skipped.length >= def.requirement.value;
        break;
      case "dailyStreak":
        meetsRequirement = dailyStreak >= def.requirement.value;
        break;
      case "legendary":
        meetsRequirement = currentRarity === "legendary";
        break;
      case "firstSave":
        meetsRequirement = treasury.length >= 1;
        break;
    }

    if (meetsRequirement) {
      if (unlockAchievement(def.id)) {
        // Show achievement toast
        const name = def.name[lang] || def.name.en;
        showToast(`🏆 ${name}`, 3000);
      }
      achievements.push({ ...def, unlocked: true });
    } else {
      achievements.push({ ...def, unlocked: false });
    }
  }

  return achievements;
}

// =====================================================
// TREASURY/COLLECTION SYSTEM
// =====================================================
function getTreasury() {
  try {
    const stored = localStorage.getItem(TREASURY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addToTreasury(ability, rarity) {
  if (!ability || !ability.trim()) return false;

  const treasury = getTreasury();
  // Avoid duplicates
  if (treasury.find(item => item.ability === ability)) return false;

  treasury.unshift({
    ability,
    rarity,
    timestamp: Date.now(),
  });

  // Keep bounded number of items
  const trimmed = treasury.slice(0, MAX_TREASURY);

  try {
    localStorage.setItem(TREASURY_KEY, JSON.stringify(trimmed));
    return true;
  } catch (e) {
    console.warn("Could not save to treasury:", e);
    return false;
  }
}

function removeFromTreasury(ability) {
  const treasury = getTreasury();
  const filtered = treasury.filter(item => item.ability !== ability);
  try {
    localStorage.setItem(TREASURY_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.warn("Could not remove from treasury:", e);
    return false;
  }
}

// =====================================================
// DAILY BLESSING SYSTEM
// =====================================================
function getDailyData() {
  try {
    const stored = localStorage.getItem(DAILY_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function setDailyData(data) {
  try {
    localStorage.setItem(DAILY_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("Could not save daily data:", e);
  }
}

function getDailyStreak() {
  try {
    return parseInt(localStorage.getItem(DAILY_STREAK_KEY) || "0");
  } catch {
    return 0;
  }
}

function setDailyStreak(count) {
  try {
    localStorage.setItem(DAILY_STREAK_KEY, count.toString());
  } catch (e) {
    console.warn("Could not save daily streak:", e);
  }
}

function isDailyAvailable() {
  const daily = getDailyData();
  if (!daily) return true;

  const today = new Date().toDateString();
  return daily.date !== today;
}

function claimDaily() {
  const today = new Date().toDateString();
  const daily = getDailyData();
  let streak = getDailyStreak();

  // Check if streak should continue
  if (daily) {
    const lastDate = new Date(daily.date);
    const currentDate = new Date(today);
    const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      streak++;
    } else if (diffDays > 1) {
      // Streak broken
      streak = 1;
    }
    // If diffDays is 0, it's same day, don't increment
  } else {
    streak = 1;
  }

  setDailyData({
    date: today,
    claimed: true,
    ability: null, // Will be set after generation
  });
  setDailyStreak(streak);

  return streak;
}

function updateDailyDisplay() {
  const dailyAvailable = isDailyAvailable();
  const dailyElement = document.getElementById("dailyIndicator");
  if (dailyElement) {
    dailyElement.classList.toggle("available", dailyAvailable);
  }
}

// =====================================================
// GOD ENTITY ATTITUDE SYSTEM
// =====================================================
function getAttitude() {
  try {
    return parseInt(localStorage.getItem(ATTITUDE_KEY) || "50"); // 0-100 scale
  } catch {
    return 50;
  }
}

function setAttitude(value) {
  const clamped = Math.max(0, Math.min(100, value));
  try {
    localStorage.setItem(ATTITUDE_KEY, clamped.toString());
  } catch (e) {
    console.warn("Could not save attitude:", e);
  }
}

function adjustAttitude(delta) {
  const current = getAttitude();
  const newValue = current + delta;
  setAttitude(newValue);
  updateAttitudeDisplay();
}

function rollChaoticAttitude() {
  // Every generation can swing mood hard to make tone feel volatile.
  const next = Math.floor(Math.random() * 101); // 0..100
  setAttitude(next);
  updateAttitudeDisplay();
  return next;
}

function updateAttitudeDisplay() {
  const attitude = getAttitude();

  // Update god entity visual based on attitude
  if (godEntity) {
    godEntity.classList.remove("attitude-pleased", "attitude-neutral", "attitude-displeased");
    if (attitude >= 70) {
      godEntity.classList.add("attitude-pleased");
    } else if (attitude <= 30) {
      godEntity.classList.add("attitude-displeased");
    } else {
      godEntity.classList.add("attitude-neutral");
    }
  }
}

function getAttitudeLabel(lang = "en") {
  const attitude = getAttitude();
  const labels = {
    en: { pleased: "Pleased", neutral: "Indifferent", displeased: "Displeased" },
    ko: { pleased: "기쁨", neutral: "무관심", displeased: "불쾌" },
    ja: { pleased: "喜び", neutral: "無関心", displeased: "不快" },
    zh: { pleased: "愉悦", neutral: "冷漠", displeased: "不悦" },
  };
  const langLabels = labels[lang] || labels.en;

  if (attitude >= 70) return langLabels.pleased;
  if (attitude <= 30) return langLabels.displeased;
  return langLabels.neutral;
}

function getRecentAbilities() {
  try {
    const stored = localStorage.getItem(RECENT_ABILITIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function getLikedAbilities() {
  try {
    const stored = localStorage.getItem(LIKED_ABILITIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function getSkippedAbilities() {
  try {
    const stored = localStorage.getItem(SKIPPED_ABILITIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentAbility(ability) {
  if (!ability || !ability.trim()) return;

  const recent = getRecentAbilities();
  // Avoid duplicates
  const filtered = recent.filter(a => a !== ability);
  // Add new ability at the start
  filtered.unshift(ability);
  // Keep only MAX_RECENT
  const trimmed = filtered.slice(0, MAX_RECENT);

  try {
    localStorage.setItem(RECENT_ABILITIES_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn("Could not save recent abilities:", e);
  }
}

// Track user preferences - liked abilities (copied)
function addLikedAbility(ability) {
  if (!ability || !ability.trim()) return;

  const liked = getLikedAbilities();
  // Avoid duplicates
  const filtered = liked.filter(a => a !== ability);
  filtered.unshift({ ability, timestamp: Date.now() });
  // Keep only MAX_PREFERENCES
  const trimmed = filtered.slice(0, MAX_PREFERENCES);

  try {
    localStorage.setItem(LIKED_ABILITIES_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn("Could not save liked abilities:", e);
  }
}

// Track user preferences - skipped abilities (ESC pressed)
function addSkippedAbility(ability) {
  if (!ability || !ability.trim()) return;

  const skipped = getSkippedAbilities();
  // Avoid duplicates
  const filtered = skipped.filter(a => a !== ability);
  filtered.unshift({ ability, timestamp: Date.now() });
  // Keep only MAX_PREFERENCES
  const trimmed = filtered.slice(0, MAX_PREFERENCES);

  try {
    localStorage.setItem(SKIPPED_ABILITIES_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.warn("Could not save skipped abilities:", e);
  }
}

// Get preference patterns for the API
function getPreferencePatterns() {
  const liked = getLikedAbilities();
  const skipped = getSkippedAbilities();

  // Extract patterns from liked abilities
  const likedAbilities = liked.map(item => item.ability);
  const skippedAbilities = skipped.map(item => item.ability);

  return {
    likedCount: liked.length,
    skippedCount: skipped.length,
    recentLiked: likedAbilities.slice(0, 5), // Last 5 liked
    recentSkipped: skippedAbilities.slice(0, 3), // Last 3 skipped to avoid
    totalGenerated: generatedTotal,
    combo: getCombo(),
    attitude: getAttitude(),
  };
}

const revealText =
  (window.DP_UI && typeof window.DP_UI.revealText === "function")
    ? window.DP_UI.revealText
    : function fallbackRevealText(text, element) {
        if (!element) return;
        element.textContent = text || "";
      };

// =====================================================
// TEXT TABLES (i18n)
// =====================================================
// Loaded from js/text.js into window.DP_TEXT.
const BUTTON_TEXT =
  (window.DP_TEXT && window.DP_TEXT.BUTTON_TEXT) ? window.DP_TEXT.BUTTON_TEXT : { en: { initial: "Receive", after: ["Receive"] } };
const UI_TEXT =
  (window.DP_TEXT && window.DP_TEXT.UI_TEXT) ? window.DP_TEXT.UI_TEXT : { en: { title: "Receive Your Gift" } };

function getRandomButtonText(lang) {
  if (window.DP_TEXT && typeof window.DP_TEXT.getRandomButtonText === "function") {
    return window.DP_TEXT.getRandomButtonText(lang);
  }
  const texts = BUTTON_TEXT[lang] || BUTTON_TEXT.en;
  const afterTexts = texts.after || [texts.initial];
  return afterTexts[Math.floor(Math.random() * afterTexts.length)];
}

function updateButtonText(lang) {
  const texts = BUTTON_TEXT[lang] || BUTTON_TEXT.en;
  const btnText = btn.querySelector(".btn-text");
  if (btnText) {
    btnText.textContent = hasGenerated ? getRandomButtonText(lang) : texts.initial;
  }
}

function getRarityLabel(rarityName, lang) {
  if (window.DP_TEXT && typeof window.DP_TEXT.getRarityLabel === "function") {
    return window.DP_TEXT.getRarityLabel(rarityName, lang);
  }
  const t = UI_TEXT[lang] || UI_TEXT.en || {};
  return (t.rarityLabels && t.rarityLabels[rarityName]) ? t.rarityLabels[rarityName] : rarityName;
}

function initSupportButton() {
  if (!supportBtn) return;

  const url = (typeof window !== "undefined" && window.__GUMROAD_PRODUCT_URL__) ? String(window.__GUMROAD_PRODUCT_URL__).trim() : "";
  if (!url) {
    supportBtn.hidden = true;
    supportBtn.removeAttribute("href");
    return;
  }

  supportBtn.hidden = false;
  supportBtn.href = url;
  supportBtn.classList.add("gumroad-button");
}

// =====================================================
// LANGUAGE
// =====================================================
function applyLang(lang) {
  const t = UI_TEXT[lang] || UI_TEXT.en;
  title.textContent = t.title;
  desc.textContent = t.desc;
  copyBtn.textContent = t.copy;
  if (saveBtn) {
    saveBtn.textContent = t.save;
  }
  if (resultText) {
    resultText.setAttribute("data-placeholder", t.emptyResult);
  }
  if (langSelect) {
    langSelect.setAttribute("aria-label", t.langLabel);
  }
  if (closePrivacy) {
    closePrivacy.setAttribute("aria-label", t.close);
  }
  if (closeAchievements) {
    closeAchievements.setAttribute("aria-label", t.close);
  }
  if (closeTreasury) {
    closeTreasury.setAttribute("aria-label", t.close);
  }
  if (favorLabel) {
    favorLabel.textContent = t.divineFavor;
  }
  if (achievementsBtn) {
    achievementsBtn.textContent = t.achievements;
  }
  if (treasuryBtn) {
    treasuryBtn.textContent = t.treasury;
  }
  if (supportBtn) {
    supportBtn.textContent = t.support;
  }
  if (privacyLink) {
    privacyLink.textContent = t.privacy;
  }
  if (aboutLink) {
    aboutLink.textContent = t.about;
  }
  if (contactLink) {
    contactLink.textContent = t.contact;
  }
  if (privacyTitle) {
    privacyTitle.textContent = t.privacyTitle;
  }
  if (achievementsTitle) {
    achievementsTitle.textContent = t.achievementsTitle;
  }
  if (treasuryTitle) {
    treasuryTitle.textContent = t.treasuryTitle;
  }
  if (exportTreasuryBtn) {
    exportTreasuryBtn.textContent = t.exportCollection;
  }
  if (clearTreasuryBtn) {
    clearTreasuryBtn.textContent = t.clearAll;
  }
  if (footerNote) {
    footerNote.textContent = t.footerNote;
  }
  generatedLabel.textContent = t.generated;

  const rarityBadge = document.getElementById("rarityBadge");
  if (rarityBadge && currentRarity) {
    rarityBadge.textContent = getRarityLabel(currentRarity, lang);
  }

  if (achievementsModal && achievementsModal.classList.contains("show")) {
    populateAchievements();
  }
  if (treasuryModal && treasuryModal.classList.contains("show")) {
    populateTreasury();
  }

  // Update button text based on state
  updateButtonText(lang);
}

function detectLanguage() {
  const browserLang = navigator.language || navigator.userLanguage || navigator.languages?.[0] || navigator.browserLanguage || "en";
  const langCode = browserLang.split("-")[0].toLowerCase();

  if (["en", "ko", "ja", "zh"].includes(langCode)) {
    langSelect.value = langCode;
  }
}

// =====================================================
// STATS
// =====================================================
function updateStats() {
  generatedCount.textContent = generatedTotal;
}

function saveStats() {
  if (window.DP_STATE && window.DP_STATE.setNumber) {
    window.DP_STATE.setNumber(STORAGE_KEYS.generatedTotal || "divine_generatedTotal", generatedTotal);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.generatedTotal || "divine_generatedTotal", generatedTotal.toString());
}

const showToast = (message, duration = 2000) => {
  if (window.DP_UI && typeof window.DP_UI.showToast === "function") {
    window.DP_UI.showToast(toast, toastMessage, message, duration);
    return;
  }
  toastMessage.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, duration);
};

// =====================================================
// GENERATE ABILITY
// =====================================================
btn.addEventListener("click", async () => {
  if (busy) return;
  busy = true;
  btn.disabled = true;

  const lang = langSelect.value;
  const t = UI_TEXT[lang] || UI_TEXT.en;

  // Activate God entity visual
  if (godEntity) {
    godEntity.classList.add("active");
  }

  // Soft cooldown: keeps the UX "unlimited", but smooths out rapid spam clicks.
  const sinceLast = Date.now() - lastGenerateAtMs;
  if (sinceLast >= 0 && sinceLast < GENERATE_COOLDOWN_MS) {
    await sleepMs(GENERATE_COOLDOWN_MS - sinceLast);
  }
  lastGenerateAtMs = Date.now();

  // Skip is now inferred only when moving on without saving/copying.
  if (currentResult && !currentResultHandled) {
    addSkippedAbility(currentResult);
    resetCombo();
    adjustAttitude(-5);
    currentResult = "";
    currentRarity = "";
  }

  // Show loading UI
  loadingContainer.hidden = false;
  loadingText.textContent = t.loading;
  resultText.classList.remove("show");
  resultText.textContent = "";
  resultContainer.classList.remove("has-result");
  resultContainer.classList.remove("rarity-common", "rarity-rare", "rarity-epic", "rarity-legendary");
  resultActions.hidden = true;

  // Hide rarity badge during loading
  const rarityBadge = document.getElementById("rarityBadge");
  if (rarityBadge) {
    rarityBadge.classList.remove("show");
    rarityBadge.classList.add("hidden");
  }

  // Remove button pulse during loading
  btn.classList.remove("ready");

  // Get recent abilities for variety
  const recentAbilities = getRecentAbilities();

  // Force mood volatility per generation for stronger tone shifts.
  rollChaoticAttitude();

  // Get preference patterns for better generation
  const preferencePatterns = getPreferencePatterns();

  try {
    const data = await (window.DP_API && window.DP_API.generateAbility
      ? window.DP_API.generateAbility({ lang, recentAbilities, preferencePatterns })
      : Promise.reject(new Error("API client not loaded")));

    currentResult = data.result || "";

    // Hide loading, show result
    loadingContainer.hidden = true;

    if (currentResult) {
      currentResultHandled = false;
      resultContainer.classList.add("has-result");

      // Use reveal animation
      revealText(currentResult, resultText);

      // Show the container
      resultText.classList.add("show");

      // Update button text to be addictive
      hasGenerated = true;
      updateButtonText(lang);

      // Add visual pulse to button
      btn.classList.add("ready");

      resultActions.hidden = false;

      // Update localStorage
      addRecentAbility(currentResult);

      // GAME SYSTEMS: Generate rarity based on combo
      const combo = incrementCombo();
      const rarity = generateRarity(combo);
      currentRarity = rarity.name;

      // Apply enhanced rarity visual effects
      resultContainer.classList.remove("rarity-common", "rarity-rare", "rarity-epic", "rarity-legendary");
      resultContainer.classList.add(`rarity-${rarity.name}`);

      // Show and update rarity badge
      const rarityBadge = document.getElementById("rarityBadge");
      if (rarityBadge) {
        rarityBadge.classList.remove("common", "rare", "epic", "legendary");
        rarityBadge.classList.add(rarity.name);
        rarityBadge.textContent = getRarityLabel(rarity.name, lang);
        rarityBadge.classList.remove("hidden");

        // Trigger badge reveal animation
        setTimeout(() => rarityBadge.classList.add("show"), 50);

        // Special effect for legendary
        if (rarity.name === "legendary") {
          // Intense god entity activation
          if (godEntity) {
            godEntity.classList.add("legendary-reveal");
            setTimeout(() => {
              godEntity.classList.remove("legendary-reveal");
            }, 2000);
          }
          showToast(t.legendaryGift, 4000);
        }
      }

      // Update stats
      generatedTotal++;
      updateStats();
      saveStats();

      // GAME SYSTEMS: Check and unlock achievements
      checkAchievements(lang);

      // GAME SYSTEMS: Update displays
      updateComboDisplay();
      updateAttitudeDisplay();
    } else {
      resultText.textContent = t.error;
      resultText.classList.add("show");
    }
  } catch (e) {
    loadingContainer.hidden = true;
    resultText.textContent = t.error;
    resultText.classList.add("show");
    resultActions.hidden = true;
  } finally {
    busy = false;
    btn.disabled = false;

    // Deactivate God entity visual
    if (godEntity) {
      godEntity.classList.remove("active");
    }
  }
});

// =====================================================
// COPY TO CLIPBOARD
// =====================================================
copyBtn.addEventListener("click", async () => {
  if (!currentResult) return;

  // Get the plain text (without spans)
  const textToCopy = currentResult;

  try {
    await navigator.clipboard.writeText(textToCopy);
    const lang = langSelect.value;
    const t = UI_TEXT[lang] || UI_TEXT.en;
    showToast(t.copied);

    // Track that user liked this ability
    addLikedAbility(currentResult);
    currentResultHandled = true;

    // GAME SYSTEMS: Increase attitude (pleases the God)
    adjustAttitude(3);

    // Check achievements (for collector achievements)
    checkAchievements(lang);
  } catch (e) {
    const lang = langSelect.value;
    const t = UI_TEXT[lang] || UI_TEXT.en;
    alert(t.copyError);
  }
});

// =====================================================
// LANGUAGE CHANGE
// =====================================================
langSelect.addEventListener("change", () => {
  applyLang(langSelect.value);
});

// =====================================================
// KEYBOARD SHORTCUTS
// =====================================================
document.addEventListener("keydown", (e) => {
  // ESC to close modal
  if (e.key === "Escape") {
    // Close any open modals first
    if (privacyModal.classList.contains("show")) {
      privacyModal.classList.remove("show");
    } else if (achievementsModal && achievementsModal.classList.contains("show")) {
      achievementsModal.classList.remove("show");
    } else if (treasuryModal && treasuryModal.classList.contains("show")) {
      treasuryModal.classList.remove("show");
    }
  }

  // Enter or Space to generate (if not typing in an input)
  if ((e.key === "Enter" || e.key === " ") && !e.target.matches("input, textarea, select")) {
    // Only trigger if not already busy
    if (!busy) {
      e.preventDefault();
      btn.click();
    }
  }
});

// =====================================================
// PRIVACY MODAL
// =====================================================
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

// =====================================================
// SAVE TO TREASURY
// =====================================================
if (saveBtn) {
  saveBtn.addEventListener("click", () => {
    if (!currentResult) return;

    const saved = addToTreasury(currentResult, currentRarity);
    if (saved) {
      const lang = langSelect.value;
      const t = UI_TEXT[lang] || UI_TEXT.en;
      showToast(t.saveSuccess, 2000);
      currentResultHandled = true;

      // Check achievements (for collector achievements)
      checkAchievements(lang);
    } else {
      const lang = langSelect.value;
      const t = UI_TEXT[lang] || UI_TEXT.en;
      showToast(t.saveDuplicate, 2000);
    }
  });
}

// =====================================================
// ACHIEVEMENTS MODAL
// =====================================================
const achievementsModal = document.getElementById("achievementsModal");

if (achievementsBtn && achievementsModal) {
  achievementsBtn.addEventListener("click", () => {
    populateAchievements();
    achievementsModal.classList.add("show");
  });
}

if (closeAchievements) {
  closeAchievements.addEventListener("click", () => {
    achievementsModal.classList.remove("show");
  });
}

if (achievementsModal) {
  achievementsModal.addEventListener("click", (e) => {
    if (e.target === achievementsModal) {
      achievementsModal.classList.remove("show");
    }
  });
}

function populateAchievements() {
  const lang = langSelect.value;
  const achievementsList = document.getElementById("achievementsList");
  if (!achievementsList) return;

  const achievements = checkAchievements(lang);
  const unlocked = getAchievements();

  achievementsList.innerHTML = achievements.map(ach => {
    const isUnlocked = ach.unlocked;
    const icon = isUnlocked ? "🏆" : "🔒";
    const name = ach.name[lang] || ach.name.en;
    const desc = ach.desc[lang] || ach.desc.en;

    return `
      <div class="achievement-item ${isUnlocked ? 'unlocked' : ''}">
        <div class="achievement-icon">${icon}</div>
        <div class="achievement-info">
          <div class="achievement-name">${name}</div>
          <div class="achievement-desc">${desc}</div>
        </div>
      </div>
    `;
  }).join("");
}

// =====================================================
// TREASURY MODAL
// =====================================================
const treasuryModal = document.getElementById("treasuryModal");

if (treasuryBtn && treasuryModal) {
  treasuryBtn.addEventListener("click", () => {
    populateTreasury();
    treasuryModal.classList.add("show");
  });
}

if (closeTreasury) {
  closeTreasury.addEventListener("click", () => {
    treasuryModal.classList.remove("show");
  });
}

if (treasuryModal) {
  treasuryModal.addEventListener("click", (e) => {
    if (e.target === treasuryModal) {
      treasuryModal.classList.remove("show");
    }
  });
}

function populateTreasury() {
  const lang = langSelect.value;
  const t = UI_TEXT[lang] || UI_TEXT.en;
  const treasuryList = document.getElementById("treasuryList");
  if (!treasuryList) return;

  const treasury = getTreasury();

  if (treasury.length === 0) {
    treasuryList.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 40px;">
        <p>${t.treasuryEmptyTitle}</p>
        <p style="font-size: 13px; margin-top: 8px;">${t.treasuryEmptyDesc}</p>
      </div>
    `;
    return;
  }

  treasuryList.innerHTML = treasury.map((item, index) => {
    const date = new Date(item.timestamp).toLocaleDateString();
    const rarityColor = getRarityColor(item.rarity);

    return `
      <div class="treasury-item rarity-${item.rarity}">
        <div class="treasury-ability">${item.ability}</div>
        <div class="treasury-meta">
          <span class="treasury-rarity" style="color: ${rarityColor}">${getRarityLabel(item.rarity, lang)}</span>
          <span>${date}</span>
          <button class="treasury-delete" onclick="deleteFromTreasury(${index})">×</button>
        </div>
      </div>
    `;
  }).join("");
}

// Global function for delete button
window.deleteFromTreasury = function(index) {
  const lang = langSelect.value;
  const t = UI_TEXT[lang] || UI_TEXT.en;
  const treasury = getTreasury();
  if (index >= 0 && index < treasury.length) {
    const item = treasury[index];
    removeFromTreasury(item.ability);
    populateTreasury();
    showToast(t.removedFromTreasury, 2000);
  }
};

if (exportTreasuryBtn) {
  exportTreasuryBtn.addEventListener("click", () => {
    const lang = langSelect.value;
    const t = UI_TEXT[lang] || UI_TEXT.en;
    const treasury = getTreasury();
    if (treasury.length === 0) {
      showToast(t.treasuryIsEmpty, 2000);
      return;
    }

    const text = treasury.map(item => `[${item.rarity.toUpperCase()}] ${item.ability}`).join("\n\n");

    navigator.clipboard.writeText(text).then(() => {
      showToast(t.exportedCollection, 3000);
    }).catch(() => {
      showToast(t.exportFailed, 2000);
    });
  });
}

if (clearTreasuryBtn) {
  clearTreasuryBtn.addEventListener("click", () => {
    const lang = langSelect.value;
    const t = UI_TEXT[lang] || UI_TEXT.en;
    if (confirm(t.clearConfirm)) {
      localStorage.setItem(TREASURY_KEY, JSON.stringify([]));
      populateTreasury();
      showToast(t.treasuryCleared, 2000);
    }
  });
}

// =====================================================
// INITIALIZE
// =====================================================
detectLanguage();
applyLang(langSelect.value);
updateStats();
initSupportButton();

// Initialize game systems
updateComboDisplay();
updateAttitudeDisplay();

// No auto-focus on load - let user discover naturally

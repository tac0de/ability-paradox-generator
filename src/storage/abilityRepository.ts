export type Rarity = "common" | "rare" | "epic" | "legendary";

export type AbilityRecord = {
  id: string;
  userId: string;
  abilityText: string;
  rarity: Rarity;
  createdAt: string;
};

export type UserProgress = {
  userId: string;
  attitude: number;
  totalGenerated: number;
  comboCount: number;
  dailyStreak: number;
  achievements: string[];
  treasury: Array<{ abilityText: string; rarity: Rarity; savedAt: string }>;
};

export interface AbilityRepository {
  getProgress(userId: string): Promise<UserProgress>;
  appendGenerated(record: AbilityRecord): Promise<void>;
  appendLiked(userId: string, abilityText: string, rarity: Rarity): Promise<void>;
  appendSkipped(userId: string, abilityText: string, rarity: Rarity): Promise<void>;
  saveToTreasury(userId: string, abilityText: string, rarity: Rarity): Promise<void>;
  unlockAchievement(userId: string, achievementCode: string): Promise<void>;
}

// Local adapter fallback for pre-login or offline mode.
export class LocalStorageAbilityRepository implements AbilityRepository {
  private prefix: string;

  constructor(prefix = "divine_") {
    this.prefix = prefix;
  }

  private key(name: string): string {
    return `${this.prefix}${name}`;
  }

  async getProgress(userId: string): Promise<UserProgress> {
    const readNum = (k: string, fallback: number) => {
      const raw = localStorage.getItem(this.key(k));
      const parsed = Number.parseInt(raw || "", 10);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const readJson = <T>(k: string, fallback: T): T => {
      try {
        const raw = localStorage.getItem(this.key(k));
        return raw ? (JSON.parse(raw) as T) : fallback;
      } catch {
        return fallback;
      }
    };

    return {
      userId,
      attitude: readNum("attitude", 50),
      totalGenerated: readNum("generatedTotal", 0),
      comboCount: readNum("combo", 0),
      dailyStreak: readNum("dailyStreak", 0),
      achievements: readJson<string[]>("achievements", []),
      treasury: readJson<Array<{ abilityText: string; rarity: Rarity; savedAt: string }>>(
        "treasury_v2",
        [],
      ),
    };
  }

  async appendGenerated(record: AbilityRecord): Promise<void> {
    const next = (await this.getProgress(record.userId)).totalGenerated + 1;
    localStorage.setItem(this.key("generatedTotal"), String(next));
  }

  async appendLiked(userId: string, abilityText: string, rarity: Rarity): Promise<void> {
    this.pushHistory(this.key("likedAbilities_v2"), { userId, abilityText, rarity, at: Date.now() });
  }

  async appendSkipped(userId: string, abilityText: string, rarity: Rarity): Promise<void> {
    this.pushHistory(this.key("skippedAbilities_v2"), { userId, abilityText, rarity, at: Date.now() });
  }

  async saveToTreasury(userId: string, abilityText: string, rarity: Rarity): Promise<void> {
    const treasury = (await this.getProgress(userId)).treasury;
    if (!treasury.find((t) => t.abilityText === abilityText)) {
      treasury.unshift({ abilityText, rarity, savedAt: new Date().toISOString() });
    }
    localStorage.setItem(this.key("treasury_v2"), JSON.stringify(treasury.slice(0, 100)));
  }

  async unlockAchievement(userId: string, achievementCode: string): Promise<void> {
    const progress = await this.getProgress(userId);
    if (!progress.achievements.includes(achievementCode)) {
      progress.achievements.push(achievementCode);
      localStorage.setItem(this.key("achievements"), JSON.stringify(progress.achievements));
    }
  }

  private pushHistory(key: string, value: unknown) {
    try {
      const raw = localStorage.getItem(key);
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(value);
      localStorage.setItem(key, JSON.stringify(arr.slice(0, 200)));
    } catch {
      // No-op fallback in constrained browsers.
    }
  }
}


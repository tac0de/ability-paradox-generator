import type { Rarity } from "../storage/abilityRepository";

export type LegacyLocalPayload = {
  generatedTotal?: number;
  combo?: number;
  attitude?: number;
  dailyStreak?: number;
  achievements?: string[];
  treasury?: Array<{ ability: string; rarity: Rarity; timestamp?: number }>;
  likedAbilities?: string[];
  skippedAbilities?: string[];
  recentAbilities?: string[];
};

export type MigrationWritePort = {
  upsertProfile(input: {
    userId: string;
    generatedTotal: number;
    combo: number;
    attitude: number;
    dailyStreak: number;
  }): Promise<void>;
  insertAchievement(userId: string, code: string): Promise<void>;
  insertTreasury(userId: string, abilityText: string, rarity: Rarity, savedAtIso: string): Promise<void>;
  insertEvent(userId: string, eventType: "liked" | "skipped", abilityText: string): Promise<void>;
};

// Migrate legacy local-only progression into user-scoped DB state.
export async function migrateLocalPayloadToDb(
  userId: string,
  payload: LegacyLocalPayload,
  writer: MigrationWritePort,
): Promise<void> {
  await writer.upsertProfile({
    userId,
    generatedTotal: payload.generatedTotal ?? 0,
    combo: payload.combo ?? 0,
    attitude: payload.attitude ?? 50,
    dailyStreak: payload.dailyStreak ?? 0,
  });

  for (const code of payload.achievements ?? []) {
    await writer.insertAchievement(userId, code);
  }

  for (const item of payload.treasury ?? []) {
    const savedAtIso = new Date(item.timestamp ?? Date.now()).toISOString();
    await writer.insertTreasury(userId, item.ability, item.rarity, savedAtIso);
  }

  for (const text of payload.likedAbilities ?? []) {
    await writer.insertEvent(userId, "liked", text);
  }
  for (const text of payload.skippedAbilities ?? []) {
    await writer.insertEvent(userId, "skipped", text);
  }
}


import type { AbilityRecord, AbilityRepository, Rarity, UserProgress } from "./abilityRepository";

type DbClient = {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
};

// Example only. Wire this to your real DB client (Postgres/Supabase/etc).
export class DbAbilityRepository implements AbilityRepository {
  constructor(private readonly db: DbClient) {}

  async getProgress(userId: string): Promise<UserProgress> {
    const profile = await this.db.query<{
      attitude: number;
      total_generated: number;
      combo_count: number;
      daily_streak: number;
    }>(
      "select attitude, total_generated, combo_count, daily_streak from user_profile where user_id = $1",
      [userId],
    );

    const achievements = await this.db.query<{ achievement_code: string }>(
      "select achievement_code from user_achievement where user_id = $1",
      [userId],
    );

    const treasury = await this.db.query<{ ability_text: string; rarity: Rarity; saved_at: string }>(
      "select ability_text, rarity, saved_at from user_treasury where user_id = $1 order by saved_at desc limit 100",
      [userId],
    );

    const p = profile.rows[0] || { attitude: 50, total_generated: 0, combo_count: 0, daily_streak: 0 };
    return {
      userId,
      attitude: p.attitude,
      totalGenerated: p.total_generated,
      comboCount: p.combo_count,
      dailyStreak: p.daily_streak,
      achievements: achievements.rows.map((r) => r.achievement_code),
      treasury: treasury.rows.map((r) => ({
        abilityText: r.ability_text,
        rarity: r.rarity,
        savedAt: r.saved_at,
      })),
    };
  }

  async appendGenerated(record: AbilityRecord): Promise<void> {
    await this.db.query(
      "insert into ability_event (id, user_id, event_type, ability_text, rarity) values ($1, $2, 'generated', $3, $4)",
      [record.id, record.userId, record.abilityText, record.rarity],
    );
    await this.db.query(
      "update user_profile set total_generated = total_generated + 1, updated_at = now() where user_id = $1",
      [record.userId],
    );
  }

  async appendLiked(userId: string, abilityText: string, rarity: Rarity): Promise<void> {
    await this.db.query(
      "insert into ability_event (id, user_id, event_type, ability_text, rarity) values (gen_random_uuid()::text, $1, 'liked', $2, $3)",
      [userId, abilityText, rarity],
    );
  }

  async appendSkipped(userId: string, abilityText: string, rarity: Rarity): Promise<void> {
    await this.db.query(
      "insert into ability_event (id, user_id, event_type, ability_text, rarity) values (gen_random_uuid()::text, $1, 'skipped', $2, $3)",
      [userId, abilityText, rarity],
    );
  }

  async saveToTreasury(userId: string, abilityText: string, rarity: Rarity): Promise<void> {
    await this.db.query(
      "insert into user_treasury (id, user_id, ability_text, rarity) values (gen_random_uuid()::text, $1, $2, $3) on conflict (user_id, ability_text) do nothing",
      [userId, abilityText, rarity],
    );
  }

  async unlockAchievement(userId: string, achievementCode: string): Promise<void> {
    await this.db.query(
      "insert into user_achievement (id, user_id, achievement_code) values (gen_random_uuid()::text, $1, $2) on conflict (user_id, achievement_code) do nothing",
      [userId, achievementCode],
    );
  }
}


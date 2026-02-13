# Ability Inheritance Points

## Legacy source
- origin: ability-paradox-generator
- migration intent: codex-engine-ability module

## Preserved core points
- ability generation + fallback chain
- preference loop (liked/skipped/recent)
- progression loop (combo/daily streak/achievements/treasury)
- anti-abuse baseline and cooldown patterns
- multi-language UX/text pipeline

## Expansion path
- localStorage fallback pre-login
- login-aware user scope after auth
- database persistence for profile/events/treasury/achievements
- local-to-db migration for existing users

## Reference implementation
- db schema: `db/schema.sql`
- storage interface/local adapter: `src/storage/abilityRepository.ts`
- db adapter example: `src/storage/dbRepository.example.ts`
- migration helper: `src/migration/localToDbMigration.ts`

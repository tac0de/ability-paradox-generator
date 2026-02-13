# codex-engine migration scaffold

This folder contains migration scaffolding to move `ability-*` local-only logic into an authenticated database-backed architecture.

## Included
- `db/schema.sql`: base relational schema for auth-linked progression
- `src/storage/abilityRepository.ts`: repository interface + local adapter
- `src/storage/dbRepository.example.ts`: server-side DB adapter example
- `src/migration/localToDbMigration.ts`: localStorage export shape + migration function skeleton
- `netlify/functions/_lib/firebaseAuth.ts`: Firebase ID token verification helper (no extra deps)
- `netlify/functions/progress.ts`: authenticated progress endpoint scaffold

## Goal
Preserve gameplay/progression logic while expanding from localStorage-only to:
- login-aware user scope
- server-side persistence
- auditable event history

## Firebase auth runtime env
- `FIREBASE_PROJECT_ID` (or `GCP_PROJECT_ID`)
- Request header: `Authorization: Bearer <firebase_id_token>`

# codex-engine migration scaffold

This folder contains migration scaffolding to move `ability-*` local-only logic into an authenticated database-backed architecture.

## Included
- `db/schema.sql`: base relational schema for auth-linked progression
- `src/storage/abilityRepository.ts`: repository interface + local adapter
- `src/storage/dbRepository.example.ts`: server-side DB adapter example
- `src/migration/localToDbMigration.ts`: localStorage export shape + migration function skeleton

## Goal
Preserve gameplay/progression logic while expanding from localStorage-only to:
- login-aware user scope
- server-side persistence
- auditable event history


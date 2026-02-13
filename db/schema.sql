-- Codex Engine Ability Migration Schema
-- Relational baseline for login + DB expansion

create table if not exists app_user (
  id text primary key,
  email text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_profile (
  user_id text primary key references app_user(id) on delete cascade,
  locale text not null default 'en',
  attitude int not null default 50,
  total_generated int not null default 0,
  combo_count int not null default 0,
  daily_streak int not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists ability_event (
  id text primary key,
  user_id text not null references app_user(id) on delete cascade,
  event_type text not null check (event_type in ('generated', 'liked', 'skipped', 'saved')),
  ability_text text not null,
  rarity text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ability_event_user_created_at
  on ability_event(user_id, created_at desc);

create table if not exists user_treasury (
  id text primary key,
  user_id text not null references app_user(id) on delete cascade,
  ability_text text not null,
  rarity text,
  saved_at timestamptz not null default now()
);

create unique index if not exists uq_user_treasury_unique_ability
  on user_treasury(user_id, ability_text);

create table if not exists user_achievement (
  id text primary key,
  user_id text not null references app_user(id) on delete cascade,
  achievement_code text not null,
  unlocked_at timestamptz not null default now()
);

create unique index if not exists uq_user_achievement_code
  on user_achievement(user_id, achievement_code);


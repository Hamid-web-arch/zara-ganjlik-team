-- Zara React backend schema (Postgres / Neon). Replaces Firestore collections 1:1 where
-- practical; member accounts (staff/crew) now carry their own password_hash instead of
-- relying on Firebase Auth.

create extension if not exists pgcrypto;

create type access_level as enum ('user', 'admin');
create type moment_status as enum ('pending', 'approved');

-- staff and crew stay as two tables (not one with a discriminator) to match the existing
-- admin UI, which manages them as two separate lists.
create table staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  id_code text not null,
  email text not null unique,
  password_hash text not null,
  access_level access_level not null default 'user',
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table crew (
  like staff including defaults
);
alter table crew add primary key (id);
alter table crew add constraint crew_email_key unique (email);

create table refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null,
  member_kind text not null check (member_kind in ('staff', 'crew')),
  token_hash text not null,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);
create index refresh_tokens_member_idx on refresh_tokens (member_id, member_kind);

create table password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null,
  member_kind text not null check (member_kind in ('staff', 'crew')),
  token_hash text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table approved_moments (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  caption text not null,
  status moment_status not null default 'pending',
  liked_by uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table briefings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  url text not null,
  created_at timestamptz not null default now()
);

-- video_id references either an approved_moments.id or a briefings.id; kept as a plain
-- uuid (no FK) since Firestore's comments collection was shared the same way.
create table comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null,
  parent_id uuid references comments (id) on delete cascade,
  text text not null,
  author_id uuid,
  author_kind text check (author_kind in ('staff', 'crew')),
  author_name text,
  author_image text,
  created_at timestamptz not null default now()
);
create index comments_video_idx on comments (video_id);

create table work_schedule (
  id text primary key default 'current',
  week_label text not null default '',
  by_employee jsonb not null default '{}',
  uploaded_at timestamptz not null default now()
);

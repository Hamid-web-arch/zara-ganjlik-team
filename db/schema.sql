-- Zara React backend schema (Postgres / Neon). Replaces Firestore collections; member
-- accounts (staff/crew) now carry their own password_hash instead of Firebase Auth.

create extension if not exists pgcrypto;

create type access_level as enum ('user', 'admin');
create type member_kind as enum ('staff', 'crew');
create type moment_status as enum ('pending', 'approved');

-- One table for both staff and crew (distinguished by `kind`), not two separate tables:
-- Firestore kept them as separate collections, but one table with a global email
-- uniqueness constraint avoids a staff row and a crew row silently sharing an email
-- (which would make one of them unreachable at login), and the admin UI's "Crew" /
-- "Staff" lists are just `where kind = ...` away.
create table members (
  id uuid primary key default gen_random_uuid(),
  kind member_kind not null,
  name text not null,
  role text not null,
  id_code text not null,
  email text not null unique,
  password_hash text not null,
  access_level access_level not null default 'user',
  image text,
  -- Set whenever an admin creates a member or resets their login (they only ever get a
  -- password chosen by someone else at that point) — cleared once the member sets their
  -- own password. Checked at login to force the change before anything else is usable.
  must_reset_password boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index members_kind_idx on members (kind);

create table refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);
create index refresh_tokens_member_idx on refresh_tokens (member_id);

create table password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members (id) on delete cascade,
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
  author_id uuid references members (id) on delete set null,
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

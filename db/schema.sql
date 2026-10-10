-- Zara React backend schema (Postgres / Neon). Replaces Firestore collections; member
-- accounts (staff/crew) now carry their own password_hash instead of Firebase Auth.

create extension if not exists pgcrypto;

create type access_level as enum ('user', 'admin');
-- 'owner' is a third kind alongside 'staff'/'crew': an account with admin access that
-- never shows up on the public homepage, since nothing there ever queries that kind.
create type member_kind as enum ('staff', 'crew', 'owner');
create type moment_status as enum ('pending', 'approved');
-- Store department a staff/crew member works in; drives training targeting below.
create type member_section as enum ('woman', 'men', 'kids');

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
  section member_section,
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

-- One row per uploaded training resource (document/image/video + an optional quiz).
-- `target` and `quiz` stay as jsonb rather than their own tables: both are small, always
-- read/written whole, and never queried by sub-field, so normalizing them would just add
-- joins for data nothing ever looks up independently.
create table trainings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  file_url text not null,
  file_name text not null,
  file_type text not null, -- 'pdf' | 'document' | 'image' | 'video'
  -- {memberIds: uuid[], roles: text[], sections: text[]} — a member sees this training if
  -- they match ANY of these; all empty/absent means "everyone".
  target jsonb not null default '{}',
  -- null = no quiz yet (phase 2). Otherwise {questions: [{question, options: string[],
  -- correctIndex}]}.
  quiz jsonb,
  created_by uuid references members (id) on delete set null,
  created_at timestamptz not null default now()
);

-- One row per (training, member) once they first open it — tracks whether they opened it,
-- how long they spent, and (phase 2) their quiz attempt.
create table training_progress (
  training_id uuid not null references trainings (id) on delete cascade,
  member_id uuid not null references members (id) on delete cascade,
  opened_at timestamptz not null default now(),
  seconds_spent int not null default 0,
  completed boolean not null default false,
  quiz_answers jsonb,
  quiz_score int,
  quiz_seconds_spent int,
  quiz_submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (training_id, member_id)
);
create index training_progress_member_idx on training_progress (member_id);

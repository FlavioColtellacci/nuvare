-- Reminder: create this table in your Supabase project before relying on viewed country persistence.
create table if not exists public.user_countries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  country_name text not null,
  last_viewed timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists user_countries_user_id_last_viewed_idx
  on public.user_countries (user_id, last_viewed desc);

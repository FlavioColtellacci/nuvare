-- Long-term agent memory: bounded facts per user (RLS + caps).
-- Apply in Supabase SQL Editor or via `supabase db push` when linked.

create table if not exists public.user_agent_memory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  key text not null,
  value jsonb not null,
  source text not null,
  updated_at timestamptz not null default now(),
  constraint user_agent_memory_key_len check (char_length(key) between 1 and 200),
  constraint user_agent_memory_source_check check (
    source in ('onboarding', 'chat', 'document')
  ),
  constraint user_agent_memory_user_key_unique unique (user_id, key)
);

create index if not exists user_agent_memory_user_id_updated_at_idx
  on public.user_agent_memory (user_id, updated_at desc);

comment on table public.user_agent_memory is
  'User-scoped key/value facts for the AI agent; max 200 keys per user, 16KB per value (enforced by trigger).';

create or replace function public.enforce_user_agent_memory_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  key_exists boolean;
  row_count int;
begin
  if new.value is null then
    raise exception 'user_agent_memory.value must not be null';
  end if;

  if pg_column_size(new.value) > 16384 then
    raise exception 'user_agent_memory value exceeds maximum size (16KB serialized)';
  end if;

  select exists (
    select 1
    from public.user_agent_memory
    where user_id = new.user_id and key = new.key
  )
  into key_exists;

  if tg_op = 'insert' and not key_exists then
    select count(*)::int
    from public.user_agent_memory
    where user_id = new.user_id
    into row_count;

    if row_count >= 200 then
      raise exception 'user_agent_memory: maximum 200 facts per user; update or delete an existing key first';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists user_agent_memory_limits_insert on public.user_agent_memory;
create trigger user_agent_memory_limits_insert
  before insert on public.user_agent_memory
  for each row
  execute function public.enforce_user_agent_memory_limits();

drop trigger if exists user_agent_memory_limits_update on public.user_agent_memory;
create trigger user_agent_memory_limits_update
  before update on public.user_agent_memory
  for each row
  execute function public.enforce_user_agent_memory_limits();

alter table public.user_agent_memory enable row level security;

create policy "Users can read own agent memory"
  on public.user_agent_memory
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own agent memory"
  on public.user_agent_memory
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own agent memory"
  on public.user_agent_memory
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own agent memory"
  on public.user_agent_memory
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

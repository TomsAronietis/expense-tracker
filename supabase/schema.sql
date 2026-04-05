-- Run in Supabase SQL editor
create table if not exists public.workspaces (
  id text primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id text not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.workspace_snapshots (
  workspace_id text primary key references public.workspaces(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  app_version text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_snapshots enable row level security;

create or replace function public.is_workspace_member(_workspace_id text)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = _workspace_id
      and wm.user_id = auth.uid()
  );
$$;

-- workspace policies
create policy if not exists workspaces_select_member
on public.workspaces
for select
using (public.is_workspace_member(id));

create policy if not exists workspace_members_select_self
on public.workspace_members
for select
using (auth.uid() = user_id);

create policy if not exists workspace_snapshots_select_member
on public.workspace_snapshots
for select
using (public.is_workspace_member(workspace_id));

create policy if not exists workspace_snapshots_upsert_member
on public.workspace_snapshots
for insert
with check (public.is_workspace_member(workspace_id));

create policy if not exists workspace_snapshots_update_member
on public.workspace_snapshots
for update
using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

-- auto-track updated_by from auth user
create or replace function public.set_snapshot_updated_by()
returns trigger
language plpgsql
as $$
begin
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_snapshot_updated_by on public.workspace_snapshots;
create trigger trg_snapshot_updated_by
before insert or update on public.workspace_snapshots
for each row
execute function public.set_snapshot_updated_by();

-- seed workspace and owner membership (replace email as needed)
insert into public.workspaces(id, name)
values ('webgoalz-brothers', 'Webgoalz Brothers')
on conflict (id) do nothing;

-- after creating auth user, run this with their email
-- insert into public.workspace_members(workspace_id, user_id, role)
-- select 'webgoalz-brothers', id, 'owner' from auth.users where email = 'sia.aronietis@example.com'
-- on conflict do nothing;

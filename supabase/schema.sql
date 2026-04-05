-- Create expenses table
create table if not exists public.expenses (
  id bigint generated always as identity primary key,
  title text not null,
  amount numeric(12, 2) not null check (amount > 0),
  spent_on date not null,
  created_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

-- Public demo policy (replace with authenticated policies for production apps)
create policy "allow public read"
  on public.expenses
  for select
  to anon
  using (true);

create policy "allow public insert"
  on public.expenses
  for insert
  to anon
  with check (true);

create policy "allow public delete"
  on public.expenses
  for delete
  to anon
  using (true);

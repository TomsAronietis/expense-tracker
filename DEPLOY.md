# Deploying Webgoalz Expense Tracker (GitHub Pages + Supabase)

## 1) Create Supabase project
1. Create a new Supabase project.
2. In SQL editor, run `supabase/schema.sql`.
3. In Authentication > Providers, keep Email enabled.
4. Create auth user:
   - Email: `sia.aronietis@example.com`
   - Password: `tom*Aronietis!2`

## 2) Add workspace membership
Run in SQL editor:

```sql
insert into public.workspace_members(workspace_id, user_id, role)
select 'webgoalz-brothers', id, 'owner'
from auth.users
where email = 'sia.aronietis@example.com'
on conflict do nothing;
```

## 3) Configure app constants
Open `index.html` and set:
- `SUPABASE_URL` to your project URL
- `SUPABASE_ANON_KEY` to your anon public key

## 4) Deploy to GitHub Pages
1. Push repo to GitHub.
2. Repo Settings > Pages.
3. Source: Deploy from branch.
4. Branch: `main` (or your default) and root `/`.
5. Save and wait for publish.

## 5) Usage notes
- Sign in with username `SIA Aronietis` and password `tom*Aronietis!2`.
- Username is validated in the app; password is validated by Supabase Auth.
- Data persists in `workspace_snapshots` and is restricted by RLS membership.

## Is Supabase free?
Yes, Supabase has a free tier suitable for small/personal projects. It has quotas and sleeping limits, so check current limits in Supabase pricing docs before relying on it for production.

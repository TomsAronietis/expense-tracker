# Shared Expense Tracker (Supabase)

This version keeps an in-memory `data` object as a UI cache, but uses Supabase tables as the source of truth.

## Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Update `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `app.js`.
4. Serve the project statically (for example with `python -m http.server`).

## Data flow

- Initial load is now async DB fetch (`save()` delegates to DB fetch for compatibility).
- Mutations use optimistic UI updates.
- If a save fails, local cache is rolled back.
- On successful mutation, app re-fetches all tables so multiple users converge on latest records.

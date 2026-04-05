# Shared Expense Tracker (GitHub Pages + Supabase)

A simple static expense tracker intended for **GitHub Pages** hosting with shared persistence through **Supabase**.

## Project structure

- `index.html` – app shell and script includes
- `styles.css` – UI styles
- `config.js` – public frontend config (`SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- `app.js` – app initialization, Supabase connectivity, CRUD rendering
- `supabase/schema.sql` – SQL for required backend table + basic policies
- `.github/workflows/ci.yml` – CI lint check on push/PR

## 1) Create or use a GitHub repository

1. Create a new GitHub repository (or use this one).
2. Ensure the app files are at repository root (`index.html`, `app.js`, `styles.css`, `config.js`).
3. Push to the `main` branch.

## 2) Enable GitHub Pages (`main` branch, `/root`)

1. Go to **Repo Settings → Pages**.
2. Under **Build and deployment**, set:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/ (root)`
3. Save. GitHub will publish your site URL.

## 3) Create backend project (Supabase)

1. Create a Supabase project at <https://supabase.com>.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. Confirm `public.expenses` exists.

> Security note: the included row-level policies allow anonymous read/insert/delete for easy sharing. For production use, switch to authenticated access and tighter policies.

## 4) Add frontend public config

Edit `config.js` with your real project values:

```js
window.APP_CONFIG = {
  SUPABASE_URL: 'https://<your-project-ref>.supabase.co',
  SUPABASE_ANON_KEY: '<your-public-anon-key>'
};
```

These values are intentionally public and safe to expose in browser apps.

## 5) App startup behavior

On load, `app.js`:

- Creates a Supabase client
- Fetches expenses from `public.expenses`
- Renders rows and total amount
- Supports insert and delete operations

## 6) CI lint check

This repo includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that runs:

```bash
npm run lint
```

Current lint is a basic syntax check:

```bash
node --check app.js && node --check config.js
```

## 7) Optional custom domain

If you want a custom domain:

1. In **Settings → Pages**, add your custom domain.
2. In your DNS provider, point the domain to GitHub Pages (via CNAME/ALIAS/A records as prompted by GitHub).
3. Wait for DNS propagation and certificate issuance.

---

## Local usage

Because this is a static app, you can run it with any static file server.

Example:

```bash
python -m http.server 8080
```

Then open <http://localhost:8080>.

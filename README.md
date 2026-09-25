# papertrail

papertrail is a small collaborative document editor for the Ajaia AI-Native Full Stack Developer Assessment.

## Live application

- Frontend: https://ajaia-fullstack-assessment-joshua.vercel.app
- API health: https://ajaia-fullstack-assessment-m6om.onrender.com/api/health

Use the frontend URL to open the application. The Render URL is the backend API and health endpoint, not the user-facing site.

## Run locally

Requirements: Node 24 or newer. SQLite is the default local database; MySQL remains available for deployment.

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
npm run dev
```

## Optional MySQL setup

Create an empty database and configure the backend environment from `backend/.env.example`:

```bash
mysql -u root -p -e "CREATE DATABASE papertrail CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

Set `DB_CLIENT=mysql`, `MYSQL_DATABASE=papertrail`, and the MySQL credentials, then run:

```bash
npm run db:migrate --prefix backend
npm run db:seed --prefix backend
npm run dev --prefix backend
```

`db:migrate` creates the MySQL schema and `db:seed` idempotently creates Alice and Bob. For local development, leave `DB_CLIENT=sqlite`; the native SQLite database is created and seeded automatically at `backend/data/editor.db`.

Open `http://localhost:5173`. The seeded accounts are `alice@example.com` and `bob@example.com`.

The API is available at `http://localhost:4000/api/health` after `npm run dev`; it reports the active database adapter.

## Features

- Seeded signed-token authentication
- Owned and shared document lists
- Tiptap rich-text editing: headings, bold, italic, underline, and lists
- Explicit save state with server-confirmed persistence
- Owner-only sharing with duplicate and self-share validation
- `.txt` and `.md` import with a 1 MB limit
- Server-side access checks on every protected document operation

## Commands

`npm run build` builds both applications. `npm test` runs the production builds and Playwright browser test using the default SQLite development database.

## Deployment

The deployment target is Vercel for `frontend/` and Render for `backend/`. The production API uses the existing MySQL adapter; Render does not provide managed MySQL, so provision a hosted MySQL 8 database separately and use its connection values in Render.

1. Create the MySQL database and run `npm run db:migrate --prefix backend` and `npm run db:seed --prefix backend` against it.
2. Create the Render web service from `render.yaml` and add the MySQL credentials, a strong `JWT_SECRET`, and the deployed Vercel URL as `FRONTEND_URL`.
3. Deploy `frontend/` on Vercel with `VITE_API_URL` set to the Render API URL without a trailing `/api`.
4. Verify `https://your-api.example.com/api/health` returns `{ "ok": true, "database": "mysql" }` before opening the Vercel URL.

The current deployment uses Vercel for the frontend, Render for the API, and Railway MySQL for production persistence. The Render pre-deploy migration is optional on free plans; migrations and seeding can be run locally against the Railway public MySQL endpoint instead. Local development continues to use native SQLite unless `DB_CLIENT=mysql` is set.
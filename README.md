# papertrail

papertrail is a small collaborative document editor for the Ajaia AI-Native Full Stack Developer Assessment.

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
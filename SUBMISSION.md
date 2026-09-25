# Submission notes

The core assessment workflow is implemented: Alice can log in, create and edit a document, save it, refresh/reopen it, share it with Bob, and Bob can access and edit it from Shared With Me. `.txt` files are imported as editable paragraphs; `.md` files are accepted as editable source text without Markdown-to-rich-text conversion.

The local and production setup paths are documented in `README.md`. The deployed frontend is available at https://ajaia-fullstack-assessment-joshua.vercel.app and the deployed MySQL-backed API health endpoint is https://ajaia-fullstack-assessment-m6om.onrender.com/api/health.

The automated Playwright suite covers document persistence, required rich-text formatting persistence, sharing and authorization, and `.txt` import. The suite currently contains four end-to-end journeys and passes with `npm test`.

## Included deliverables

- `frontend/`: React, Vite, and Tiptap client application
- `backend/`: Express API, authentication, authorization, imports, and database adapters
- `tests/core.spec.ts`: Playwright end-to-end coverage
- `backend/src/db/schema.sql`: MySQL schema
- `backend/src/db/migrate.ts`: MySQL migration command
- `backend/src/db/seed.ts`: MySQL seed command
- `README.md`: local and deployment setup
- `ARCHITECTURE.md`: system and data-layer decisions
- `AI_WORKFLOW.md`: implementation decisions and validation history
- `render.yaml`: Render backend configuration
- `frontend/vercel.json`: Vercel SPA routing configuration

## Review accounts

The application uses seeded, passwordless assessment accounts:

| User | Email |
| --- | --- |
| Alice | `alice@example.com` |
| Bob | `bob@example.com` |

On the login screen, enter either email and click **Continue**. No production credentials are included in this repository. Database passwords, JWT secrets, and hosting environment variables must remain configured privately in Render/Railway/Vercel.

## Sharing review flow

1. Log in as Alice.
2. Create and save a document.
3. Share it with `bob@example.com`.
4. Log out and log in as Bob.
5. Open the document under **Shared With Me**.
6. Edit and save it, then reload to verify persistence.
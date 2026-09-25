# Submission notes

The core assessment workflow is implemented: Alice can log in, create and edit a document, save it, refresh/reopen it, share it with Bob, and Bob can access and edit it from Shared With Me. `.txt` files are imported as editable paragraphs; `.md` files are accepted as editable source text without Markdown-to-rich-text conversion.

The local and production setup paths are documented in `README.md`. The deployed frontend is available at https://ajaia-fullstack-assessment-joshua.vercel.app and the deployed MySQL-backed API health endpoint is https://ajaia-fullstack-assessment-m6om.onrender.com/api/health.

The automated Playwright suite covers document persistence, required rich-text formatting persistence, sharing and authorization, and `.txt` import. The suite currently contains four end-to-end journeys and passes with `npm test`.
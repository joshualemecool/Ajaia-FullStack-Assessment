# Submission notes

The core assessment workflow is implemented: Alice can log in, create and edit a document, save it, refresh/reopen it, share it with Bob, and Bob can access it from Shared With Me. Text and Markdown files can be imported as editable paragraphs.

The local development path is documented in `README.md`. Production deployment still needs a host-selected MySQL service, environment-provided `JWT_SECRET`, and a browser test job with Playwright installed.
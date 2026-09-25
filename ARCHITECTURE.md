# Architecture

The application is a deliberately small monolith:

```text
React + Vite + Tiptap -> Express REST API -> SQLite (local) / MySQL (deployment)
```

The frontend owns routing and editor interaction. The API owns authentication, validation, authorization, import handling, and persistence. MySQL contains `users`, `documents`, and `document_shares`; InnoDB foreign keys, indexes, and a unique `(document_id, user_id)` constraint enforce the sharing model. Tiptap JSON is stored in the MySQL `JSON` column on `documents.content`.

Sessions are signed JWTs. The client stores the token for this assessment, while the API rehydrates the user from the token on every protected request. Document reads and writes require ownership or an explicit share. The owner check on sharing is stricter than the read/write check so shared users cannot extend access.

SQLite is the default local runtime because it requires no separate service. Set `DB_CLIENT=mysql` to use the MySQL adapter, migrations, and JSON schema for deployment. Both adapters use the same parameterized API queries and relational model.
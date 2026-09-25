# AI workflow

## AI workflow - Phase 1

### Project Bootstrap

The AI agent first inspected the workspace, available tools, Git status, Node.js/npm versions, and database availability before starting implementation.

The workspace was empty and MySQL was not available locally. This was identified before implementing the main features.

### Database Decision - Phase 1

The initial architecture planned to use MySQL. However, the local environment did not provide a MySQL server.

The AI first attempted to use a native SQLite dependency, but Node.js 24 on Windows caused compatibility/build issues.

**Decision:** use Node.js's built-in SQLite support for local development to avoid spending time configuring a native build environment.

The database layer remained isolated so the production database could be added without rewriting the API contract.

**Reason:** unblock development while keeping the relational data model and persistence requirements intact.

### Backend Implementation

The AI implemented the initial backend structure, including:

- seeded Alice and Bob users;
- authentication;
- document creation and persistence;
- ownership and access control;
- document sharing;
- text/Markdown import.

The API was then tested through real HTTP requests rather than relying only on compilation.

### Debugging

Two notable issues were encountered during the first build:

- Express route parameters required explicit string normalization because of the current TypeScript definitions.
- A React `useEffect` callback incorrectly returned a Promise because it was declared directly as asynchronous.

The AI diagnosed and fixed both issues, after which the backend and frontend builds passed successfully.

### Validation

The initial end-to-end API flow was manually exercised:

```text
Alice login
→ Create document
→ Save document
→ Share with Bob
→ Bob login
→ Bob sees the shared document
```

This confirmed that the main persistence and sharing flow worked before continuing with automated browser testing.

### Human / AI Collaboration

The AI was used for implementation, debugging, dependency setup, and validation.

The developer remained responsible for:

- defining the scope;
- choosing the overall architecture;
- evaluating AI suggestions;
- making trade-offs;
- deciding which features to prioritize;
- validating the resulting behavior.

## Phase 2 — Database

The database layer was implemented and validated with the required relational structure:

- `User`
- `Document`
- `DocumentShare`

Alice and Bob were seeded as test users, and the database was connected to the existing authentication and document API.

The AI agent handled most of the initial implementation and validation, while I reviewed the approach and made the final decisions regarding the database strategy and project scope.

### Decision

The original architecture planned to use MySQL, but MySQL was not available in the local development environment. The AI initially attempted to use a native SQLite dependency, which caused compatibility issues with Node.js 24 on Windows.

I agreed to use Node.js's built-in SQLite support for local development rather than spending time configuring a native build environment.

This was considered a temporary development decision, while keeping the database layer isolated enough to revisit the production database strategy during deployment.

### Validation

The AI agent verified the database connection, schema initialization, seed process, and CRUD operations through real API requests.

I reviewed the resulting implementation and the trade-off before continuing to the next phase.

The database and document persistence flow were successfully validated.

## Phase 3 — Authentication

The existing authentication implementation was reviewed before making any changes.

The AI agent inspected the authentication flow and tested:

- Alice login;
- Bob login;
- invalid login attempts;
- protected API requests;
- separate sessions for each user;
- document ownership isolation.

I reviewed the existing implementation and agreed that the current lightweight authentication approach was sufficient for the assessment.

### Decision

No code changes were necessary during this phase.

Rather than introducing additional authentication complexity such as OAuth, registration, or password recovery, I decided to keep the existing seeded-user authentication system because it already satisfied the project's requirements.

### Validation

The AI agent performed real API requests to verify the authentication behavior.

The tests confirmed that Alice and Bob receive separate authenticated sessions, invalid logins return `401`, and users can only access their own documents unless access has explicitly been shared.

I reviewed the test results before considering the authentication phase complete.

## Phase 4 — Documents

The document management flow was reviewed and validated before moving to the next feature.

The AI agent verified the existing implementation through both real API requests and the browser test suite.

The following operations were tested:

- document creation;
- document retrieval;
- document update;
- owned document listing;
- shared document listing;
- shared document retrieval;
- access to shared document content.

The dashboard and document API were also confirmed to compile successfully.

### Decision

No major architectural changes were necessary during this phase.

I reviewed the existing document flow and kept the implementation focused on the core requirements rather than adding unnecessary document-management features.

The distinction between owned and shared documents was kept as part of the main dashboard experience because it directly supports the assessment's sharing requirement.

### Validation

The AI agent performed a complete API journey using fresh documents to avoid conflicts with previous test data.

The flow successfully covered:

```text
Create
→ Retrieve
→ Update
→ Owned list
→ Share
→ Shared list
→ Shared document retrieval
```

The existing browser regression test also passed.

I reviewed the results and confirmed that the document management layer was ready for the next phase.
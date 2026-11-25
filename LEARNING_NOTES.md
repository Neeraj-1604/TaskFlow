# TaskFlow — Learning Notes

> Key concepts, decisions, and lessons learned during each phase.

---

## Progress Tracker

| Day | Topic | Status |
|-----|-------|--------|
| 1 | Foundations (Express, env, health route) | ✅ Completed |
| 2 | PostgreSQL & schema design | ✅ Completed |
| 3 | Register, bcrypt, Zod, error handling | ✅ Completed |
| 4 | Login, JWT, auth middleware | ✅ Completed |
| 5 | Projects CRUD & multi-tenancy | ✅ Completed |
| 6 | RBAC (Projects & Members) | ✅ Completed |
| 7 | Tasks CRUD, filtering, sorting, pagination | ✅ Completed |
| 8 | Comments, transactions, N+1 | ✅ Completed |
| 9 | File attachments (Multer + Cloudinary) | ✅ Completed |
| 10 | Logging, Swagger, rate limiting, Helmet, CORS | ✅ Completed |
| 11 | Testing (Jest + Supertest) | ✅ Completed |
| 12 | Docker | ⬜ Upcoming |
| 13 | CI/CD & deployment | ⬜ Upcoming |
| 14 | React client, review | ⬜ Upcoming |

---

## Day 7: Tasks CRUD, Filtering, Sorting & Pagination

### Key Concepts & Architectural Decisions
1. **Nested REST Routing:**
   - Tasks are scoped under `/api/v1/projects/:projectId/tasks`.
   - Used `express.Router({ mergeParams: true })` so that child routers inherit `:projectId` from parent routes.
2. **Dynamic SQL Query Construction:**
   - Built modular `WHERE` conditions dynamically while strictly utilizing parameterized placeholders (`$1, $2, ...`) to prevent SQL injection.
   - Whitelisted sort columns to avoid SQL injection via `ORDER BY`.
3. **Offset vs. Keyset Pagination:**
   - Implemented standard offset-based pagination (`LIMIT` and `OFFSET`) paired with a separate `COUNT(*)` query for calculating total pages and items.
4. **Data Isolation & Business Rules:**
   - Ensured assignees must belong to the project before being assigned to a task.
   - Enforced deletion permissions: only project `owner`, `admin`, or the task `creator` can delete a task.

---

## Day 8: Comments, Transactions, N+1 Problem & Query Optimization

### Key Concepts & Architectural Decisions
1. **Deep Nested REST Routing (3 Levels):**
   - Scoped route: `/api/v1/projects/:projectId/tasks/:taskId/comments`.
   - Chained `mergeParams: true` through `projects.routes.js` → `tasks.routes.js` → `comments.routes.js` so innermost route handlers have access to `:projectId`, `:taskId`, and `:commentId`.
2. **Eliminating the N+1 Query Problem:**
   - Instead of fetching $N$ comments and looping to query authors one by one ($N+1$ queries), used an `INNER JOIN users u ON c.user_id = u.id` in a single query.
   - Preserves $O(1)$ database network round-trips regardless of thread length.
3. **Common Table Expression (CTE) for Atomic Insertion + Return:**
   - Used `WITH inserted AS (INSERT INTO comments ... RETURNING ...) SELECT ... FROM inserted JOIN users` to return author metadata (`authorName`, `authorEmail`) immediately upon creation in a single query without an extra round-trip.
4. **IDOR & Multi-Tenant Resource Verification:**
   - Enforced strict hierarchy check: verified task belongs to the project (`task.projectId === projectId`) and comment belongs to the task (`comment.taskId === taskId`).
5. **Ownership vs. Moderation Permissions:**
   - **Edit:** Strictly limited to comment author (`comment.userId === userId`).
   - **Delete:** Allowed for comment author OR project `owner` / `admin` (moderation capability).
6. **Foreign Key Indexing & Query Optimization:**
   - PostgreSQL does NOT automatically create indexes on Foreign Key columns.
   - Added explicit B-Tree indexes on `comments(task_id)`, `tasks(project_id)`, and `tasks(assignee_id)` to prevent sequential table scans ($O(N)$) during foreign key joins.

---

## Day 9: File Attachments (Multer + Cloudinary)

### Key Concepts & Architectural Decisions
1. **Two-Phase Upload (local → cloud):**
   - Multer writes the incoming multipart file to `server/uploads/` first (`diskStorage`), then the service uploads that local file to Cloudinary.
   - Why not memory storage? Disk keeps large files out of RAM; the trade-off is needing cleanup, which the Cloudinary helper does in a `finally`-style path on both success and failure.
2. **Validate Before You Trust:**
   - MIME allowlist (`image/jpeg`, `image/png`, `image/webp`, `image/gif`, `application/pdf`, `text/plain`) plus a 5 MB `fileSize` limit.
   - Multer's `MulterError` is translated into a 400 `AppError` so upload failures use the same error envelope as the rest of the API.
3. **Compensating Action on Partial Failure:**
   - If the Cloudinary upload succeeds but the database insert fails, the uploaded asset is deleted again. Without this, failed requests would leak orphaned cloud files and storage cost.
4. **Nested Resource Authorization:**
   - Attachments are mounted at `/projects/:projectId/tasks/:taskId/attachments`.
   - Upload/list are available to any project member (the parent tasks router applies `authorize`).
   - Delete is restricted to the uploader, an owner, or an admin.
5. **Storing Metadata, Not Bytes:**
   - The database stores `file_name`, `file_url`, `file_size`, and `mime_type`. The binary lives in Cloudinary; the API returns a URL.
   - Cloudinary `public_id` is derived from the URL at delete time, so the schema does not need an extra column.

### Common Mistakes
- Forgetting to delete the local temp file when the cloud upload fails (fills the disk silently).
- Trusting the client-provided filename (path traversal / weird characters). The upload middleware sanitizes the stored filename.
- Checking only the MIME type; it is client-controlled. Production systems should also sniff file signatures.
- Forgetting that `multer` errors do not go through `asyncHandler` unless wrapped.

---

## Day 10: Logging, Security Headers, Rate Limiting & Swagger

### Key Concepts & Architectural Decisions
1. **Centralized, Validated Config (`src/config/env.js`):**
   - All `process.env` reads now go through one module that fails fast with a readable message listing missing variables.
   - Why: `undefined` secrets produce confusing runtime errors (e.g. `jwt.sign` with an undefined secret) far from the actual misconfiguration.
   - `.env` is loaded once; required values are validated at startup. Tests inject their own values before modules load.
2. **Winston + Morgan:**
   - Winston handles application logs with levels (`info`, `warn`, `error`) and transports.
   - Morgan handles HTTP access logs and writes into Winston through a custom stream, so request logs and app logs share one format/destination.
   - Development: human-readable colored output. Production: one JSON object per line for log aggregators. Tests: logger silenced.
3. **Helmet (security headers):**
   - Sets `Content-Security-Policy`, `X-Content-Type-Options`, `Strict-Transport-Security`, frame protection, etc.
   - CSP is relaxed slightly for Swagger UI's inline assets; tighten it once the React client has a fixed origin.
4. **CORS:**
   - Origins come from `CORS_ORIGIN` (comma-separated or `*`). `credentials: true` is required so the browser sends the refresh cookie.
   - Note: `*` + credentials is invalid in browsers, so the app reflects the request origin when configured with `*`.
5. **Rate Limiting (`express-rate-limit`):**
   - General API limiter: 300 requests / 15 min / IP.
   - Stricter auth limiter: 20 attempts / 15 min / IP on register and login to slow credential stuffing.
   - Skipped in tests, otherwise the suite would trip the counter.
6. **Swagger/OpenAPI 3.0:**
   - Spec lives in `src/docs/swagger.json`, served interactively at `/api-docs` and raw at `/api-docs.json`.
   - Documents every route, request body, response envelope, pagination shape, and the bearer security scheme.
7. **Consistent 404s and Graceful Shutdown:**
   - Unmatched routes go through `notFound` → centralized error handler, so even 404s use `{ success, statusCode, status, message, errors }`.
   - `server.js` handles `SIGTERM`/`SIGINT`: stop accepting connections, close the PostgreSQL pool, force-exit after 10s.

### Bugs Found and Fixed While Completing This Phase
- `GET /api/v1/auth/me` was registered as `POST`; corrected to `GET`.
- Member removal used `DELECT FROM project_members` and referenced undefined variables (`projectId`/`userId` vs `project_id`/`user_id`) — every removal would have 500'd.
- Attachment deletion imported `findProjectMember` from the members repository, where it does not exist; it lives in the projects repository.
- `ValidationError` assumed a Zod error object. The attachment service passes a plain string, so `zodError.issues.map` crashed with a 500. It now supports both.
- Malformed project UUIDs reached PostgreSQL through `authorize()` before validation, producing a 500. Param validation now runs before authorization on the tasks router.

### Common Mistakes
- Logging secrets or full request bodies (passwords, tokens).
- Using `console.log` in production code: no levels, no structure, no destinations.
- Putting the rate limiter after routes, or applying the strict auth limiter to every endpoint.
- Serving Swagger UI with a CSP that blocks its inline scripts (blank page).
- Trusting `req.ip` behind a proxy without configuring `trust proxy`.

### Interview Questions
1. **Why validate env vars at startup instead of where they are used?**
   Fail fast: the process refuses to boot with a clear list of missing values, instead of failing on the first request that happens to need one. It also keeps configuration in one place and makes tests explicit.
2. **Why use both Morgan and Winston?**
   They solve different problems: Morgan formats HTTP access logs, Winston provides leveled application logging and transports. Piping Morgan into Winston avoids two logging pipelines and gives one consistent output format.
3. **What does Helmet actually do?**
   It sets HTTP response headers that instruct browsers to enable protections: CSP, HSTS, `X-Content-Type-Options: nosniff`, frame options, referrer policy. It is not a substitute for input validation or auth.
4. **Fixed-window vs sliding-window rate limiting?**
   Fixed windows are simple and cheap but allow bursts at window boundaries. Sliding windows/logs are smoother but cost more state. For auth endpoints, a strict fixed window plus account-level lockout is usually enough for a student project.
5. **Why serve the OpenAPI spec as a JSON file instead of generating it from code?**
   A checked-in spec is explicit and reviewable, and can be diffed. Generation keeps code and docs closer but adds tooling and annotations. For this size, a static spec is easier to reason about.

---

## Day 11: Testing with Jest + Supertest

### Key Concepts & Architectural Decisions
1. **Integration Tests, Not Mock Tests:**
   - Supertest drives the real Express app (middleware, validation, auth, error handler) and the repositories talk to a real PostgreSQL database.
   - This catches wiring bugs that unit tests with mocked repositories miss — and it did: three real bugs surfaced during this phase.
2. **Separate Test Database:**
   - Tests always use `${DB_NAME}_test` (overridable with `TEST_DB_NAME`). They never touch development data.
   - `tests/globalSetup.js` connects to the `postgres` maintenance database and creates the test database if it does not exist.
3. **Schema Reset vs. Truncate:**
   - Once per test file: drop and recreate the `public` schema, then run the real `database/migrations/init_schema.sql`. This tests the migration file itself.
   - Between tests: `TRUNCATE ... RESTART IDENTITY CASCADE`, which is much cheaper than re-running the schema.
   - `maxWorkers: 1` / `--runInBand` prevents files from resetting the same schema concurrently.
4. **Test Factories (`tests/helpers.js`):**
   - `createUser()` registers and logs in, returning the id, email, password, and access token.
   - `createProject()`, `addMember()`, and `createTask()` wrap the API so tests read as intent, not HTTP plumbing.
   - Unique emails (`Date.now()` + counter) avoid collisions.
5. **Cookie-Based Refresh Testing:**
   - `request.agent(app)` keeps the refresh cookie between requests, which is required to test `/auth/refresh` and logout. For the "refresh token used as bearer" case, the raw `Set-Cookie` header is parsed instead.
6. **Mocking the External Boundary Only:**
   - Cloudinary is mocked with `jest.mock`, because tests must not upload real files or need cloud credentials. The mock also deletes the Multer temp file, mirroring the real helper.
   - Everything inside the app (DB, middleware, auth) stays real.
7. **What the Suite Covers (81 tests):**
   - Auth: register, duplicate email, weak password, strict schema, login, wrong password, `/me`, refresh, logout, refresh-token misuse.
   - Projects: create/list/get/update/delete, owner vs admin vs member vs non-member.
   - Tasks: defaults, assignee membership, filtering, search, sorting, pagination, cross-project 404s, delete permissions.
   - Comments: author metadata, ordering, own-edit rule, owner moderation, cross-task 404s.
   - Members: invite, duplicates, unknown email, role changes, owner protection, self-leave, admin limits.
   - Attachments: upload, missing file, bad MIME, list, uploader delete, cloud cleanup call, cross-task 404.

### How to Run the Tests
```bash
cd server

# Requires a running PostgreSQL. DB_* values come from server/.env.
# The test database (TEST_DB_NAME, default taskflow_test) is created
# automatically by tests/globalSetup.js.
npm test
```

If your PostgreSQL user cannot create databases, create it manually once:
```sql
CREATE DATABASE taskflow_test;
```

### Common Mistakes
- Running tests against the development database (destructive schema resets).
- Sharing one database across parallel Jest workers without isolation.
- Mocking the database layer so heavily that SQL, constraints, and joins are never exercised.
- Forgetting to close the pool (`afterAll`) — Jest hangs with open handles.
- Asserting only status codes; assert response shape and the important fields.
- Testing implementation details (private functions) instead of observable HTTP behavior.

### Interview Questions
1. **Integration vs unit tests — why choose integration here?**
   Most risk in this project lives at the boundaries: route mounting, middleware order, validation, SQL, and RBAC. Integration tests exercise all of them together. Unit tests would be faster but would miss the exact bugs this phase found.
2. **Why reset the schema instead of using an in-memory database?**
   PostgreSQL-specific behavior (enums, UUIDs, `ILIKE`, `ON DELETE CASCADE`, CTEs) is part of what we are testing. An in-memory substitute would not validate the real SQL.
3. **How do you keep tests independent?**
   Each file starts from a clean schema; each test starts from empty tables; factories create only the data that test needs. No test depends on another test's leftovers.
4. **What should be mocked?**
   External, slow, or non-deterministic boundaries: cloud storage, email, payment providers, clocks. Keep your own code and database real whenever practical.
5. **Why `--runInBand` for this suite?**
   All files share one test database and reset the `public` schema. Running in parallel would let one file drop tables while another is querying them. A per-worker database would allow parallelism, at the cost of more setup complexity.

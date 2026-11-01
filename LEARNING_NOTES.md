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
| 9 | File attachments | 🟡 Next up |
| 10 | Logging, Swagger, rate limiting | ⬜ Upcoming |
| 11 | Testing | ⬜ Upcoming |
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
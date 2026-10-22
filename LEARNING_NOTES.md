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
| 8 | Comments, transactions, N+1 | 🟡 Next up |
| 9 | File attachments | ⬜ Upcoming |
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
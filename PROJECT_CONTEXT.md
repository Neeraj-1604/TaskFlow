# TaskFlow — Project Context

> This file persists across sessions so any AI assistant (or future-me) can pick up exactly where we left off.

---

## Who I Am

- **Name:** Neeraj
- **Background:** 2nd-year Integrated M.Tech IT student
- **Primary Goal:** Deeply LEARN backend engineering — not just get working code. I want to be able to explain every decision in interviews.

## What We Are Building

**TaskFlow** — a Role-Based Task Management REST API using the **PERN stack** (PostgreSQL, Express, Node.js, with a minimal React client on the last day).

### Feature List

| # | Feature |
|---|---------|
| 1 | JWT auth (access + refresh tokens, bcrypt) |
| 2 | Projects and team collaboration |
| 3 | Project-level RBAC (owner / admin / member) via composable middleware |
| 4 | CRUD for projects, tasks, comments |
| 5 | Zod validation |
| 6 | Centralized error handling (custom error classes) |
| 7 | Multer file attachments with cloud storage (Cloudinary) |
| 8 | Winston + Morgan logging |
| 9 | Swagger/OpenAPI docs |
| 10 | Jest + Supertest tests |
| 11 | Docker + Docker Compose |
| 12 | GitHub Actions CI |
| 13 | Live deployment |
| 14 | Minimal React client (Day 14) |

### Architecture

Layered, feature-organized:

```
routes → controllers → services → data-access (repository)
```

Each feature folder (auth, projects, tasks, comments, members, attachments) contains:
`*.routes.js → *.controller.js → *.service.js → *.repository.js → *.validator.js`

## 14-Day Roadmap (4–5 hrs/day, Day 15 buffer)

| Day | Focus |
|-----|-------|
| 1 | Foundations — HTTP, REST, Express setup, env config, health route |
| 2 | PostgreSQL — schema design, ERD, keys, indexes, migrations, DB connection |
| 3 | Register — bcrypt, Zod, error handling |
| 4 | Login — JWT access/refresh, auth middleware, logout |
| 5 | Projects CRUD & multi-tenancy |
| 6 | RBAC |
| 7 | Tasks CRUD — filtering, sorting, pagination |
| 8 | Comments — transactions, N+1, query optimization |
| 9 | File attachments |
| 10 | Logging, Swagger, rate limiting, helmet, CORS |
| 11 | Testing |
| 12 | Docker |
| 13 | CI/CD & deployment |
| 14 | React client, README, review, mock interview |
| 15 | Buffer |

## Teaching Rules (follow strictly for every phase)

1. **Concept first:** explain what it is, why it exists, how it works internally — with analogies and ASCII diagrams. Define jargon on first use.
2. **Plan:** say what we will build and which files will be touched.
3. **Build in small steps**, one file or feature at a time. Never dump a whole phase.
4. **Explain every piece of code** block by block, and why each library/pattern was chosen over alternatives.
5. **Show alternatives and trade-offs** (e.g., Prisma vs raw SQL).
6. **Tell me how to test each step**, including what a failure looks like.
7. **End each phase** with common mistakes, security pitfalls, and 5 interview questions with model answers.
8. **Ask me 3–5 questions** to check my understanding. Do not move on until I answer or say "skip".
9. Give a short **recap** and a one-line "what I should be able to explain after this phase".

## Rules

- Production-quality code: validation, correct HTTP status codes, no secrets in code.
- Update `LEARNING_NOTES.md` at the end of each phase with key concepts and decisions.
- Suggest a Git commit message after every meaningful step.
- Never move to the next phase without my confirmation.

## Current Progress

- **Day 1:** NOT DONE — folder structure exists, all files are empty (0 bytes). No npm init, no dependencies, no code.
- **Day 2:** In progress (concepts phase).

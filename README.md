# SkillTree

Reading a linear list is one of the hardest ways to gauge somebody's skills. Preparing that list is just as difficult. SkillTree lets you organize skills like a video game skill tree: as a connected graph, where skills connect to other skills and progress is visible at a glance.

![SkillTree](https://img.shields.io/badge/status-in--development-e3a94a)

## Features

- **Visual, draggable skill trees**: powered by [React Flow](https://reactflow.dev/)
- **Custom statuses**: define your own labels (e.g. "Want to Learn," "In Progress," "Solid")
- **Skill connections**: link skills together to show prerequisites or related growth
- **Public sharing**: flip a tree to public and share a read-only link; visitors can view (but not edit) your tree without an account

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React, TypeScript, Vite, [React Flow](https://reactflow.dev/) |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| Auth | JWT (httpOnly cookies) + bcrypt |

## Project Structure

```
├── client/          # React + Vite frontend
│   └── src/
│       ├── components/   # React components
│       │   ├── flow/     # React Flow canvas, custom nodes/edges, geometry helpers
│       │   ├── tree/     # Tree/skill/status UI (forms, lists, toggles)
│       │   ├── auth/     # Login/signup gate, protected routes
│       │   └── ui/       # Shared UI primitives (buttons, popups, snackbars)
│       ├── hooks/        # Reusable state/data hooks
│       ├── pages/        # Route-level pages
│       └── lib/          # API client, snackbar store
├── server/          # Express + PostgreSQL backend
│   ├── routes/      # /auth, /users, /trees, /skills, /edges, /statuses
│   ├── middleware/  # requireAuth / optionalAuth
│   ├── utils/       # JWT signing/verification, error helpers
│   └── schema.sql   # Database schema
└── shared/          # Types and constants shared between client and server
```

## Getting Started

### Prerequisites

- Node.js (18+)
- A running PostgreSQL instance

### 1. Set up the database

Create a database and run the schema:

```bash
psql -d your_database -f server/schema.sql
```

### 2. Configure environment variables

**`server/.env`**

```
DATABASE_URL=postgres://user:password@localhost:5432/your_database
JWT_SECRET=some-long-random-secret
PORT=3000
NODE_ENV=development
```

**`client/.env`**

```
VITE_API_BASE=http://localhost:3000
```

### 3. Install dependencies and run

In one terminal:

```bash
cd server
npm install
npm run dev
```

In another terminal:

```bash
cd client
npm install
npm run dev
```

The client runs on `http://localhost:5173` and talks to the API at `http://localhost:3000` (CORS is currently configured for this exact pair of origins, so update `server/index.ts` if you change ports).

## API Reference

Full endpoint documentation, including request/response shapes and ownership rules, lives in [`server/README.md`](server/README.md). A Postman collection (`server/postman_collection.json`) is also available for manual testing.
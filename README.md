# SkillTree

Reading a plain list is one of the hardest ways to gauge somebody's skills. Preparing that list is just as difficult. SkillTree lets you organize skills like a video game skill tree: as a connected graph, where skills connect to other skills and progress is visible at a glance.

![SkillTree](https://img.shields.io/badge/status-live-e3a94a)

## Features

- **Visual, draggable skill trees**: powered by [React Flow](https://reactflow.dev/)
- **Custom statuses**: define your own labels (e.g. "Want to Learn," "In Progress," "Solid")
- **Skill connections**: link skills together to show prerequisites or related growth
- **Public sharing**: share a read-only link to the trees you choose, available to view even without an account

## Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React, TypeScript, Vite, [React Flow](https://reactflow.dev/) |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |

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

## Run It Locally

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

The client runs on `http://localhost:5173` and talks to the API at `http://localhost:3000` (update `server/index.ts` if you change ports).

## Deploy It

The client is deployed on Vercel and the server on Render. If you deploy your own instance:

- Update the `destination` in `client/vercel.json` to point at your own backend URL
- Set `CORS_ORIGIN` in your server's environment to your deployed frontend's origin (default is`http://localhost:5173`)
- Set `NODE_ENV=production`
## API Reference

Full endpoint documentation, including request/response shapes and ownership rules, lives in [`server/README.md`](server/README.md). A Postman collection (`server/postman_collection.json`) is also available for manual testing.
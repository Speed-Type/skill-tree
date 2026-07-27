# Skill Tree API

A backend API for creating and managing personal skill trees.

## Running the server

```bash
npm run dev
```

Server runs on `http://localhost:3000` by default.

## API Endpoints

### Auth

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/auth/login` | Log in, sets an httpOnly auth cookie | `{ email, password }` |
| POST | `/auth/logout` | Clear the auth cookie | — |

### Users

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/users/me` | Get your own user record (auth required) | — |
| GET | `/users/:id` | Get a specific user by id (auth required) | — |
| POST | `/users` | Create a new user | `{ email, password }` |
| PUT | `/users/:id` | Update your own user — must match logged-in user (auth required) | `{ email, password }` |
| DELETE | `/users/:id` | Delete your own user — must match logged-in user, cascades (auth required) | — |

### Skill Trees

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/trees` | Get your own trees (auth required) | — |
| GET | `/trees/:id` | Get a tree with its skills, edges, and relevant statuses — must be public or yours | — |
| POST | `/trees` | Create a new tree, owned by the logged-in user (auth required) | `{ title, description, is_public }` |
| PUT | `/trees/:id` | Update a tree — must be yours (auth required) | `{ title, description, is_public }` |
| DELETE | `/trees/:id` | Delete a tree — must be yours, cascades (auth required) | — |

### Skills

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/skills` | Get skills belonging to your own trees (auth required) | — |
| GET | `/skills/:id` | Get a specific skill — its tree must be public or yours | — |
| POST | `/skills` | Create a skill — `tree_id` must belong to the logged-in user (auth required) | `{ tree_id, label, description, status_id, x_position, y_position }` |
| PUT | `/skills/:id` | Update skill details — its tree must be yours (auth required) | `{ label, description, status_id, x_position, y_position }` |
| PUT | `/skills/:id/status` | Update skill status_id specifically — its tree must be yours (auth required) | `{ status_id }` |
| PUT | `/skills/:id/position` | Update skill position specifically — its tree must be yours (auth required) | `{ x_position, y_position }` |
| DELETE | `/skills/:id` | Delete a skill — its tree must be yours, cascades (auth required) | — |

### Skill Edges

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/edges` | Get edges belonging to your own trees (auth required) | — |
| GET | `/edges/:id` | Get a specific skill edge — its tree must be public or yours | — |
| POST | `/edges` | Create an edge (skill unlocks skill) — both skills must exist, belong to the same tree, and that tree must be yours (auth required) | `{ from_skill_id, to_skill_id }` |
| DELETE | `/edges/:id` | Delete an edge — its tree must be yours (auth required) | — |

### Statuses

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/statuses` | Get all of your own statuses (auth required) | — |
| GET | `/statuses/:id` | Get a specific status — must be yours, or attached to a skill in a public tree | — |
| POST | `/statuses` | Create a status, owned by the logged-in user (auth required) | `{ label, sort_order }` |
| PUT | `/statuses/:id` | Update a status — must be yours (auth required) | `{ label, sort_order }` |
| DELETE | `/statuses/:id` | Delete a status — must be yours (auth required) | — |

## Testing

Import `postman_collection.json` into Postman to test all endpoints. Run `POST /auth/login` first. Postman will carry the resulting cookie into subsequent requests automatically.

## Notes

- All dates are ISO 8601 format
- User deletion cascades to all their trees, which cascades to their skills, which cascades to skill edges
- Authentication is cookie-based (httpOnly JWT). After a successful `POST /auth/login`, the browser automatically attaches the auth cookie to subsequent requests; no manual token handling required on the client. Requests must be made with `credentials: 'include'` (fetch) or `withCredentials: true` (axios) for the cookie to be sent, since the client and server run on different origins in dev
- "Auth required" endpoints return `401` if no valid session is present
- Ownership mismatches (e.g. trying to edit someone else's tree) return `404`, not `403`
- Edges can only connect two skills that belong to the same tree; this is enforced at creation time, not by the database schema
- A skill's `tree_id` and a status's ownership are both validated server-side on creation/update; client-supplied IDs are never trusted to imply ownership
- There is no endpoint to browse or discover other users' public trees. Public trees are only accessible via their direct `/trees/:id` link.
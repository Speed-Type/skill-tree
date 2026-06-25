# Skill Tree API

A backend API for creating and managing personal skill trees.

## Running the server

```bash
npm run dev
```

Server runs on `http://localhost:3000` by default.

## API Endpoints

### Users

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/users` | Get all users | — |
| GET | `/users/:id` | Get a specific user | — |
| POST | `/users` | Create a new user | `{ email, password }` |
| PUT | `/users/:id` | Update a user | `{ email, password }` |
| DELETE | `/users/:id` | Delete a user (cascades) | — |

### Skill Trees

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/trees` | Get all trees (yours, after auth) | — |
| GET | `/trees/:id` | Get a tree with its skills and edges | — |
| POST | `/trees` | Create a new tree | `{ user_id, title, description, is_public }` |
| PUT | `/trees/:id` | Update a tree | `{ title, description, is_public }` |
| DELETE | `/trees/:id` | Delete a tree (cascades) | — |

### Skills

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/skills` | Get all skills (yours, after auth) | — |
| GET | `/skills/:id` | Get a specific skill (doesn't include edges) | — |
| POST | `/skills` | Create a skill | `{ tree_id, label, description, x_position, y_position }` |
| PUT | `/skills/:id` | Update skill details | `{ label, description, status_id, x_position, y_position }` |
| PUT | `/skills/:id/status` | Update skill status_id specifically | `{ status_id }` |
| PUT | `/skills/:id/position` | Update skill position specifically | `{ x_position, y_position }` |
| DELETE | `/skills/:id` | Delete a skill (cascades) | — |

### Skill Edges

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/edges` | Get all skill edges (yours, after auth) | — |
| GET | `/edges/:id` | Get a specific skill edge | — |
| POST | `/edges` | Create an edge (skill unlocks skill) | `{ from_skill_id, to_skill_id }` |
| DELETE | `/edges/:id` | Delete an edge | — |

### Statuses

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/statuses` | Get all statuses (yours, after auth) | — |
| GET | `/statuses/:id` | Get a specific status | — |
| POST | `/statuses` | Create a status | `{ user_id, label, sort_order }` |
| PUT | `/statuses/:id` | Update a status | `{ label, sort_order }` |
| DELETE | `/statuses/:id` | Delete a status | — |

## Testing

Import `postman_collection.json` into Postman to test all endpoints.

## Notes

- All dates are ISO 8601 format
- User deletion cascades to all their trees
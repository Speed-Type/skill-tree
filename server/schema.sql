CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(50) NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE skill_trees (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(80) NOT NULL,
  description VARCHAR(500),
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE statuses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(30) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  tree_id INTEGER REFERENCES skill_trees(id) ON DELETE CASCADE,
  label VARCHAR(60) NOT NULL,
  description VARCHAR(500),
  status_id INTEGER REFERENCES statuses(id) ON DELETE SET NULL,
  x_position FLOAT DEFAULT 0,
  y_position FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE skill_edges (
  id SERIAL PRIMARY KEY,
  from_skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
  to_skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
);

CREATE UNIQUE INDEX unique_skill_edge_undirected
ON skill_edges (
  LEAST(from_skill_id, to_skill_id),
  GREATEST(from_skill_id, to_skill_id)
);
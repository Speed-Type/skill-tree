CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE skill_trees (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE statuses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE skills (
  id SERIAL PRIMARY KEY,
  tree_id INTEGER REFERENCES skill_trees(id) ON DELETE CASCADE,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  status_id INTEGER REFERENCES statuses(id) ON DELETE SET NULL,
  x_position FLOAT DEFAULT 0,
  y_position FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE skill_edges (
  id SERIAL PRIMARY KEY,
  from_skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
  to_skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,

  CONSTRAINT unique_skill_edge
    UNIQUE (from_skill_id, to_skill_id)
);
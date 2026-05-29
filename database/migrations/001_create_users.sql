-- Migration initiale : table users
-- Exécuter avec : psql $DB_URI -f database/migrations/001_create_users.sql

CREATE TYPE user_role AS ENUM ('student', 'moderator', 'admin', 'super_admin');

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  university VARCHAR(255),
  major VARCHAR(255),
  year INTEGER,
  role user_role NOT NULL DEFAULT 'student',
  trust_score INTEGER NOT NULL DEFAULT 0,
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  is_banned BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

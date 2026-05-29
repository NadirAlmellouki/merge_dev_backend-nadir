-- Migration : table study_sessions + PostGIS

CREATE EXTENSION IF NOT EXISTS "postgis";

CREATE TYPE study_session_status AS ENUM ('created', 'active', 'completed', 'cancelled');

CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  topic TEXT,
  location GEOGRAPHY(POINT, 4326),
  location_name VARCHAR(255),
  start_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 120
    CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  max_participants INTEGER NOT NULL DEFAULT 5
    CHECK (max_participants >= 2 AND max_participants <= 20),
  status study_session_status NOT NULL DEFAULT 'created',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_location ON study_sessions USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_study_sessions_creator ON study_sessions (creator_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_start_time ON study_sessions (start_time);
CREATE INDEX IF NOT EXISTS idx_study_sessions_status ON study_sessions (status);

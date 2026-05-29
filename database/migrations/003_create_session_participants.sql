-- Migration : table session_participants

CREATE TYPE IF NOT EXISTS session_participant_status AS ENUM ('joined','checked_in','left','no_show');

CREATE TABLE IF NOT EXISTS session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status session_participant_status DEFAULT 'joined',
  checked_in_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_participants_session ON session_participants (session_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON session_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON session_participants (status);

COMMENT ON TABLE IF EXISTS session_participants IS 'Relation many-to-many entre sessions et participants';

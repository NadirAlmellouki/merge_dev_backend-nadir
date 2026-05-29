-- ============================================================
-- STUDYSYNC — SCHÉMA COMPLET BASE DE DONNÉES
-- PostgreSQL 16 + PostGIS
-- Base : defaultdb (Aiven Cloud)
-- ============================================================
-- INSTRUCTIONS D'EXÉCUTION :
-- 1. Exécuter ce fichier dans l'ordre (du haut vers le bas)
-- 2. Ne pas modifier l'ordre des blocs
-- 3. Connexion : postgres://avnadmin:...@...aivencloud.com:27209/defaultdb?sslmode=require
-- ============================================================


-- ============================================================
-- BLOC 0 — EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- pour gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "postgis";    -- pour GEOGRAPHY, ST_DWithin, etc.


-- ============================================================
-- BLOC 1 — SUPPRESSION DES TABLES (remise à zéro propre)
-- ============================================================
-- À exécuter UNIQUEMENT pour réinitialiser la base
-- Respecter l'ordre inverse des dépendances FK

DROP TABLE IF EXISTS admin_actions         CASCADE;
DROP TABLE IF EXISTS blocks                CASCADE;
DROP TABLE IF EXISTS reports               CASCADE;
DROP TABLE IF EXISTS ratings               CASCADE;
DROP TABLE IF EXISTS messages              CASCADE;
DROP TABLE IF EXISTS session_participants  CASCADE;
DROP TABLE IF EXISTS study_sessions        CASCADE;
DROP TABLE IF EXISTS users                 CASCADE;


-- ============================================================
-- BLOC 2 — CRÉATION DES TABLES
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- TABLE 1 : users
-- ────────────────────────────────────────────────────────────

CREATE TABLE users (
    id                      UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    email                   VARCHAR(255) UNIQUE NOT NULL,
    password_hash           VARCHAR(255) NOT NULL,
    first_name              VARCHAR(100) NOT NULL,
    last_name               VARCHAR(100) NOT NULL,
    university              VARCHAR(255),
    major                   VARCHAR(255),
    year_of_study           VARCHAR(50),
    profile_photo_url       TEXT,
    bio                     TEXT,
    subjects                TEXT[]       DEFAULT '{}',
    study_preferences       JSONB        DEFAULT '{}',
    trust_score             DECIMAL(5,2) DEFAULT 0.00,
    role                    VARCHAR(20)  NOT NULL DEFAULT 'student'
                                CHECK (role IN ('student','moderator','admin','super_admin')),
    is_email_verified       BOOLEAN      DEFAULT FALSE,
    is_suspended            BOOLEAN      DEFAULT FALSE,
    suspended_until         TIMESTAMPTZ,
    suspension_reason       TEXT,
    is_banned               BOOLEAN      DEFAULT FALSE,
    ban_reason              TEXT,
    password_reset_token    VARCHAR(255),
    password_reset_expires  TIMESTAMPTZ,
    created_at              TIMESTAMPTZ  DEFAULT NOW(),
    updated_at              TIMESTAMPTZ  DEFAULT NOW()
);

-- Index utilisateurs
CREATE INDEX idx_users_email        ON users (email);
CREATE INDEX idx_users_role         ON users (role);
CREATE INDEX idx_users_trust_score  ON users (trust_score DESC);
CREATE INDEX idx_users_is_banned    ON users (is_banned);
CREATE INDEX idx_users_is_suspended ON users (is_suspended);

COMMENT ON TABLE  users                  IS 'Tous les utilisateurs de StudySync (students, moderators, admins)';
COMMENT ON COLUMN users.subjects         IS 'Tableau des matières étudiées : ["Calculus","CS101","Biologie"]';
COMMENT ON COLUMN users.study_preferences IS 'JSON : {"preferredTimes":["afternoon"],"groupSize":"small","style":"collaborative"}';
COMMENT ON COLUMN users.trust_score      IS 'Score 0-100 calculé depuis les notes reçues, sessions complétées, ancienneté, vérification';
COMMENT ON COLUMN users.role             IS 'Hiérarchie : student < moderator < admin < super_admin';


-- ────────────────────────────────────────────────────────────
-- TABLE 2 : study_sessions
-- ────────────────────────────────────────────────────────────

CREATE TABLE study_sessions (
    id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject             VARCHAR(255) NOT NULL,
    topic               TEXT,
    location            GEOGRAPHY(POINT, 4326),
    location_name       VARCHAR(255),
    latitude            DECIMAL(10,8),
    longitude           DECIMAL(11,8),
    start_time          TIMESTAMPTZ  NOT NULL,
    duration_minutes    INTEGER      DEFAULT 120
                            CHECK (duration_minutes > 0 AND duration_minutes <= 480),
    max_participants    INTEGER      DEFAULT 5
                            CHECK (max_participants >= 1 AND max_participants <= 50),
    study_type          VARCHAR(50)  DEFAULT 'discussion'
                            CHECK (study_type IN ('silent','discussion','exam_prep','homework','project')),
    group_size          VARCHAR(20)  DEFAULT 'small'
                            CHECK (group_size IN ('one_on_one','small','large')),
    description         TEXT,
    visibility          VARCHAR(20)  DEFAULT 'public'
                            CHECK (visibility IN ('public','private')),
    status              VARCHAR(20)  DEFAULT 'created'
                            CHECK (status IN ('created','active','completed','cancelled','no_show')),
    is_deleted          BOOLEAN      DEFAULT FALSE,
    deleted_by_admin_id UUID         REFERENCES users(id),
    created_at          TIMESTAMPTZ  DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  DEFAULT NOW()
);

-- Index sessions
CREATE INDEX idx_sessions_location     ON study_sessions USING GIST (location);
CREATE INDEX idx_sessions_status       ON study_sessions (status);
CREATE INDEX idx_sessions_subject      ON study_sessions (subject);
CREATE INDEX idx_sessions_creator      ON study_sessions (creator_id);
<<<<<<< HEAD
CREATE INDEX idx_sessions_scheduled    ON study_sessions (scheduled_time);
=======
CREATE INDEX idx_sessions_start_time   ON study_sessions (start_time);
>>>>>>> origin/dev
CREATE INDEX idx_sessions_not_deleted  ON study_sessions (is_deleted) WHERE is_deleted = FALSE;

COMMENT ON TABLE  study_sessions          IS 'Sessions d étude créées par les étudiants';
COMMENT ON COLUMN study_sessions.location IS 'PostGIS GEOGRAPHY POINT : ST_MakePoint(longitude, latitude)';
COMMENT ON COLUMN study_sessions.latitude IS 'Copie décimale pour calculs simples sans PostGIS';


-- ────────────────────────────────────────────────────────────
-- TABLE 3 : session_participants
-- ────────────────────────────────────────────────────────────

CREATE TABLE session_participants (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id   UUID        NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status       VARCHAR(20) DEFAULT 'joined'
                     CHECK (status IN ('joined','checked_in','left','no_show')),
    checked_in_at TIMESTAMPTZ,
    left_at       TIMESTAMPTZ,
    joined_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (session_id, user_id)
);

CREATE INDEX idx_participants_session ON session_participants (session_id);
CREATE INDEX idx_participants_user    ON session_participants (user_id);
CREATE INDEX idx_participants_status  ON session_participants (status);

COMMENT ON TABLE session_participants IS 'Relation many-to-many entre sessions et participants';


-- ────────────────────────────────────────────────────────────
-- TABLE 4 : messages
-- ────────────────────────────────────────────────────────────

CREATE TABLE messages (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID        NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    sender_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content             TEXT        NOT NULL,
    message_type        VARCHAR(20) DEFAULT 'text'
                            CHECK (message_type IN ('text','image','file','location')),
    media_url           TEXT,
    is_deleted          BOOLEAN     DEFAULT FALSE,
    deleted_by_admin_id UUID        REFERENCES users(id),
    deleted_at          TIMESTAMPTZ,
    sent_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_session ON messages (session_id, sent_at DESC);
CREATE INDEX idx_messages_sender  ON messages (sender_id);

COMMENT ON TABLE messages IS 'Messages du chat de session. Soft delete par admin uniquement.';


-- ────────────────────────────────────────────────────────────
-- TABLE 5 : ratings
-- ────────────────────────────────────────────────────────────

CREATE TABLE ratings (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    rater_id            UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rated_id            UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id          UUID        NOT NULL REFERENCES study_sessions(id) ON DELETE CASCADE,
    overall_score       INTEGER     NOT NULL CHECK (overall_score BETWEEN 1 AND 5),
    punctuality_score   INTEGER     CHECK (punctuality_score BETWEEN 1 AND 5),
    engagement_score    INTEGER     CHECK (engagement_score BETWEEN 1 AND 5),
    would_study_again   BOOLEAN,
    comment             TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (rater_id, rated_id, session_id)
);

CREATE INDEX idx_ratings_rated_id  ON ratings (rated_id);
CREATE INDEX idx_ratings_rater_id  ON ratings (rater_id);
CREATE INDEX idx_ratings_session   ON ratings (session_id);

COMMENT ON TABLE ratings IS '1 note par triplet (noteur, noté, session). Déclenche recalcul trust_score.';


-- ────────────────────────────────────────────────────────────
-- TABLE 6 : reports
-- ────────────────────────────────────────────────────────────

CREATE TABLE reports (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reported_user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
    reported_session_id  UUID        REFERENCES study_sessions(id) ON DELETE SET NULL,
    reported_message_id  UUID        REFERENCES messages(id) ON DELETE SET NULL,
    reason               VARCHAR(50) NOT NULL
                             CHECK (reason IN ('harassment','spam','fake_profile','safety','other')),
    description          TEXT,
    status               VARCHAR(20) DEFAULT 'pending'
                             CHECK (status IN ('pending','resolved','dismissed')),
    resolution_action    TEXT,
    resolved_by_id       UUID        REFERENCES users(id),
    resolved_at          TIMESTAMPTZ,
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_report_target
        CHECK (
            reported_user_id    IS NOT NULL OR
            reported_session_id IS NOT NULL OR
            reported_message_id IS NOT NULL
        )
);

CREATE INDEX idx_reports_status     ON reports (status, created_at DESC);
CREATE INDEX idx_reports_reporter   ON reports (reporter_id);
CREATE INDEX idx_reports_reported_u ON reports (reported_user_id);

COMMENT ON TABLE reports IS 'Signalements soumis par les étudiants. Au moins une cible requise.';


-- ────────────────────────────────────────────────────────────
-- TABLE 7 : blocks
-- ────────────────────────────────────────────────────────────

CREATE TABLE blocks (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id  UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (blocker_id, blocked_id),
    CONSTRAINT chk_no_self_block CHECK (blocker_id <> blocked_id)
);

CREATE INDEX idx_blocks_blocker ON blocks (blocker_id);
CREATE INDEX idx_blocks_blocked ON blocks (blocked_id);

COMMENT ON TABLE blocks IS 'Un utilisateur ne peut pas bloquer lui-même. Bidirectionnel à gérer en applicatif.';


-- ────────────────────────────────────────────────────────────
-- TABLE 8 : admin_actions (Audit Log)
-- ────────────────────────────────────────────────────────────

CREATE TABLE admin_actions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id            UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type         VARCHAR(50) NOT NULL
                            CHECK (action_type IN (
                                'suspend','unsuspend','ban','delete_session',
                                'delete_message','resolve_report','dismiss_report',
                                'promote','demote','warn'
                            )),
    target_user_id      UUID        REFERENCES users(id),
    target_session_id   UUID        REFERENCES study_sessions(id),
    target_message_id   UUID        REFERENCES messages(id),
    target_report_id    UUID        REFERENCES reports(id),
    reason              TEXT,
    metadata            JSONB       DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admin_actions_admin  ON admin_actions (admin_id, created_at DESC);
CREATE INDEX idx_admin_actions_target ON admin_actions (target_user_id);
CREATE INDEX idx_admin_actions_type   ON admin_actions (action_type);

COMMENT ON TABLE admin_actions IS 'Journal immuable de toutes les actions de modération. Accessible uniquement aux super_admin.';


-- ============================================================
-- BLOC 3 — TRIGGER : updated_at automatique
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_sessions_updated_at
    BEFORE UPDATE ON study_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================
-- BLOC 4 — VUES UTILES
-- ============================================================

-- Vue : sessions avec nombre de participants
CREATE OR REPLACE VIEW v_sessions_with_counts AS
SELECT
    s.*,
    COUNT(sp.id) FILTER (WHERE sp.status IN ('joined','checked_in')) AS participant_count,
    COUNT(sp.id) FILTER (WHERE sp.status = 'checked_in')             AS checked_in_count
FROM study_sessions s
LEFT JOIN session_participants sp ON sp.session_id = s.id
WHERE s.is_deleted = FALSE
GROUP BY s.id;

-- Vue : statistiques des utilisateurs
CREATE OR REPLACE VIEW v_user_stats AS
SELECT
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.role,
    u.trust_score,
    COUNT(DISTINCT sp.session_id)  AS total_sessions,
    ROUND(AVG(r.overall_score), 2) AS average_rating,
    COUNT(DISTINCT r.id)           AS total_ratings_received
FROM users u
LEFT JOIN session_participants sp ON sp.user_id = u.id AND sp.status IN ('joined','checked_in')
LEFT JOIN ratings r ON r.rated_id = u.id
GROUP BY u.id;


-- ============================================================
-- BLOC 5 — DONNÉES DE TEST
-- ============================================================
-- Ordre d'insertion :
-- 1. users (super_admin, admin, moderator, students)
-- 2. study_sessions
-- 3. session_participants
-- 4. messages
-- 5. ratings
-- 6. reports
-- 7. blocks
-- 8. admin_actions
-- ============================================================
-- MOTS DE PASSE DE TEST (bcrypt hash de "Password123")
-- Hash = $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 5.1 — INSERTION DES UTILISATEURS
-- ────────────────────────────────────────────────────────────

INSERT INTO users (
    id, email, password_hash, first_name, last_name,
    university, major, year_of_study, bio,
    subjects, study_preferences, trust_score,
    role, is_email_verified, created_at
) VALUES

-- SUPER ADMIN
(
    '00000000-0000-0000-0000-000000000001',
    'superadmin@studysync.ma',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Super', 'Admin',
    NULL, NULL, NULL,
    'Compte Super Admin StudySync',
    '{}', '{}', 100.00,
    'super_admin', TRUE,
    NOW() - INTERVAL '180 days'
),

-- ADMIN
(
    '00000000-0000-0000-0000-000000000002',
    'admin@studysync.ma',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Ali', 'Benjelloun',
    NULL, NULL, NULL,
    'Administrateur de la plateforme StudySync',
    '{}', '{}', 95.00,
    'admin', TRUE,
    NOW() - INTERVAL '150 days'
),

-- MODERATOR 1
(
    '00000000-0000-0000-0000-000000000003',
    'mounir.moderator@studysync.ma',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Mounir', 'Alaoui',
    'Université Mohammed V', 'Droit', 'M2',
    'Modérateur bénévole StudySync depuis avril 2026',
    '{"Droit","Économie"}',
    '{"preferredTimes":["evening"],"groupSize":"small","style":"collaborative"}',
    88.00,
    'moderator', TRUE,
    NOW() - INTERVAL '90 days'
),

-- MODERATOR 2
(
    '00000000-0000-0000-0000-000000000004',
    'laila.moderator@studysync.ma',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Laila', 'Benali',
    'Université Hassan II', 'Médecine', 'M1',
    'Modératrice et étudiante en médecine',
    '{"Anatomie","Biologie","Chimie"}',
    '{"preferredTimes":["morning","afternoon"],"groupSize":"small","style":"structured"}',
    91.00,
    'moderator', TRUE,
    NOW() - INTERVAL '75 days'
),

-- STUDENT 1 — Sara Rahman (profil complet, Trusted)
(
    '00000000-0000-0000-0000-000000000005',
    'sara.rahman@univ.ma',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Sara', 'Rahman',
    'Université Mohammed V', 'Informatique', 'L3',
    'Passionnée par les maths et l algorithmique. Toujours partante pour une bonne session ! ☕📚',
    '{"Calculus","CS101","Algèbre Linéaire","Probabilités"}',
    '{"preferredTimes":["afternoon","evening"],"groupSize":"small","style":"collaborative"}',
    72.50,
    'student', TRUE,
    NOW() - INTERVAL '60 days'
),

-- STUDENT 2 — Jean Kofi (profil complet, Building)
(
    '00000000-0000-0000-0000-000000000006',
    'jean.kofi@cadi.ma',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Jean', 'Kofi',
    'Université Cadi Ayyad', 'Mathématiques', 'M1',
    'Étudiant en maths, spécialité algèbre. Cherche partenaires sérieux.',
    '{"Algèbre Linéaire","Analyse","Probabilités","Topologie"}',
    '{"preferredTimes":["morning","afternoon"],"groupSize":"one_on_one","style":"structured"}',
    45.00,
    'student', TRUE,
    NOW() - INTERVAL '45 days'
),

-- STUDENT 3 — Maria Lopez
(
    '00000000-0000-0000-0000-000000000007',
    'maria.lopez@univ.ma',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Maria', 'Lopez',
    'Université Mohammed V', 'Physique', 'L3',
    'Étudiante en physique, j aime la thermodynamique et la mécanique quantique 🔬',
    '{"Physique","Thermodynamique","Mécanique Quantique","Chimie"}',
    '{"preferredTimes":["afternoon"],"groupSize":"small","style":"discussion"}',
    58.75,
    'student', TRUE,
    NOW() - INTERVAL '40 days'
),

-- STUDENT 4 — Ahmed Mansouri
(
    '00000000-0000-0000-0000-000000000008',
    'ahmed.mansouri@univ.ma',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Ahmed', 'Mansouri',
    'ENSA Rabat', 'Génie Informatique', 'L2',
    'Développeur passionné, cherche partenaires pour coder et apprendre 💻',
    '{"CS101","Python","Algorithmique","Réseaux"}',
    '{"preferredTimes":["evening","night"],"groupSize":"small","style":"collaborative"}',
    34.20,
    'student', FALSE,
    NOW() - INTERVAL '30 days'
),

-- STUDENT 5 — Karima Lahlou
(
    '00000000-0000-0000-0000-000000000009',
    'karima.lahlou@univ.ma',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Karima', 'Lahlou',
    'Université Mohammed V', 'Biologie', 'L2',
    'Biologie moléculaire, génétique, pharmacologie 🧬',
    '{"Biologie","Génétique","Chimie Organique","Anatomie"}',
    '{"preferredTimes":["morning","afternoon"],"groupSize":"large","style":"collaborative"}',
    62.00,
    'student', TRUE,
    NOW() - INTERVAL '50 days'
),

-- STUDENT 6 — Omar Boussouf (New User)
(
    '00000000-0000-0000-0000-000000000010',
    'omar.boussouf@univ.ma',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Omar', 'Boussouf',
    'Faculté des Sciences Rabat', 'Chimie', 'L1',
    'Nouveau sur la plateforme, cherche partenaires pour Chimie générale',
    '{"Chimie","Physique","Maths"}',
    '{"preferredTimes":["afternoon"],"groupSize":"small","style":"discussion"}',
    5.00,
    'student', FALSE,
    NOW() - INTERVAL '5 days'
),

-- STUDENT 7 — Fatima Zahra (Highly Trusted)
(
    '00000000-0000-0000-0000-000000000011',
    'fatima.zahra@univ.ma',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Fatima', 'Zahra',
    'Université Hassan II', 'Économie', 'M2',
    'Économiste en devenir, passionnée par la microéconomie et la finance 📊',
    '{"Microéconomie","Macroéconomie","Finance","Statistiques"}',
    '{"preferredTimes":["morning","afternoon"],"groupSize":"small","style":"structured"}',
    85.50,
    'student', TRUE,
    NOW() - INTERVAL '120 days'
),

-- STUDENT 8 — Youssef Krim (SUSPENDU — pour tester la suspension)
(
    '00000000-0000-0000-0000-000000000012',
    'youssef.krim@univ.ma',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Youssef', 'Krim',
    'ISCAE Casablanca', 'Management', 'L3',
    NULL,
    '{"Management","Marketing","Finance"}',
    '{}',
    12.00,
    'student', FALSE,
    NOW() - INTERVAL '20 days'
),

-- STUDENT 9 — Nadia Bennis (BANNIE — pour tester le ban)
(
    '00000000-0000-0000-0000-000000000013',
    'nadia.bennis@spam.ma',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Nadia', 'Bennis',
    NULL, NULL, NULL,
    NULL,
    '{}', '{}', 3.00,
    'student', FALSE,
    NOW() - INTERVAL '15 days'
);

-- Appliquer la suspension à Youssef Krim
UPDATE users SET
    is_suspended     = TRUE,
    suspended_until  = NOW() + INTERVAL '3 days',
    suspension_reason = 'Comportement inapproprié signalé par 2 utilisateurs'
WHERE id = '00000000-0000-0000-0000-000000000012';

-- Appliquer le ban à Nadia Bennis
UPDATE users SET
    is_banned  = TRUE,
    ban_reason = 'Compte de spam — création de sessions commerciales répétées'
WHERE id = '00000000-0000-0000-0000-000000000013';


-- ────────────────────────────────────────────────────────────
-- 5.2 — INSERTION DES SESSIONS D'ÉTUDE
-- ────────────────────────────────────────────────────────────
-- Coordonnées réalistes : Rabat / Casablanca
-- Bibliothèque UM5 Rabat : 33.9716, -6.8498
-- Café Agdal Rabat       : 33.9892, -6.8567
-- ENSA Rabat             : 33.9603, -6.8545
-- Faculté des Sciences   : 33.9740, -6.8652
-- ────────────────────────────────────────────────────────────

INSERT INTO study_sessions (
    id, creator_id, subject, topic,
    location, location_name, latitude, longitude,
<<<<<<< HEAD
    scheduled_time, duration_minutes, max_participants,
=======
    start_time, duration_minutes, max_participants,
>>>>>>> origin/dev
    study_type, group_size, description, visibility, status
) VALUES

-- SESSION 1 — Calculus II (ACTIVE, créée par Sara)
(
    'aaaaaaaa-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000005',
    'Calculus II',
    'Intégrales par parties — Chapitres 7-9',
    ST_SetSRID(ST_MakePoint(-6.8498, 33.9716), 4326)::geography,
    'Bibliothèque centrale UM5 — Table 4, 2e étage',
    33.9716, -6.8498,
    NOW() - INTERVAL '30 minutes',
    120, 5,
    'discussion', 'small',
    'On travaille sur les intégrales par parties. Niveau intermédiaire. Viens avec tes exercices !',
    'public', 'active'
),

-- SESSION 2 — Algèbre Linéaire (CREATED, créée par Jean)
(
    'aaaaaaaa-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000006',
    'Algèbre Linéaire',
    'Espaces vectoriels et applications linéaires',
    ST_SetSRID(ST_MakePoint(-6.8567, 33.9892), 4326)::geography,
    'Café Atlas — Agdal Rabat',
    33.9892, -6.8567,
    NOW() + INTERVAL '2 hours',
    90, 3,
    'discussion', 'one_on_one',
    'Révision pour l examen de la semaine prochaine. Cherche 1-2 partenaires niveau L2-M1.',
    'public', 'created'
),

-- SESSION 3 — Physique (CREATED, créée par Maria)
(
    'aaaaaaaa-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000007',
    'Physique',
    'Thermodynamique — Lois fondamentales',
    ST_SetSRID(ST_MakePoint(-6.8545, 33.9603), 4326)::geography,
    'Salle E204 — ENSA Rabat',
    33.9603, -6.8545,
    NOW() + INTERVAL '3 hours',
    180, 6,
    'exam_prep', 'small',
    'Préparation examen thermodynamique. TD non résolus + annales 2023-2024.',
    'public', 'created'
),

-- SESSION 4 — CS101 (ACTIVE, créée par Ahmed)
(
    'aaaaaaaa-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000008',
    'CS101',
    'Algorithmique — Tri et Récursivité',
    ST_SetSRID(ST_MakePoint(-6.8652, 33.9740), 4326)::geography,
    'Salle informatique — Faculté des Sciences',
    33.9740, -6.8652,
    NOW() - INTERVAL '1 hour',
    120, 4,
    'homework', 'small',
    'TP algorithmique — exercices de tri bubble/merge/quick + complexité.',
    'public', 'active'
),

-- SESSION 5 — Biologie (COMPLETED, créée par Karima)
(
    'aaaaaaaa-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000009',
    'Biologie',
    'Génétique moléculaire — Réplication ADN',
    ST_SetSRID(ST_MakePoint(-6.8498, 33.9716), 4326)::geography,
    'Bibliothèque centrale UM5 — Salle de groupe 3',
    33.9716, -6.8498,
    NOW() - INTERVAL '3 hours',
    120, 5,
    'discussion', 'large',
    'Session sur la réplication et la transcription ADN.',
    'public', 'completed'
),

-- SESSION 6 — Microéconomie (CREATED, créée par Fatima)
(
    'aaaaaaaa-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000011',
    'Microéconomie',
    'Théorie du consommateur et courbes d indifférence',
    ST_SetSRID(ST_MakePoint(-6.8600, 33.9800), 4326)::geography,
    'Bibliothèque Faculté Économie Hassan II',
    33.9800, -6.8600,
    NOW() + INTERVAL '1 day',
    90, 4,
    'project', 'small',
    'Révision approfondie du chapitre 4. Amenez les exercices corrigés du poly.',
    'public', 'created'
),

-- SESSION 7 — Chimie (CREATED, créée par Omar — New User)
(
    'aaaaaaaa-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000010',
    'Chimie Générale',
    'Liaison chimique et structures de Lewis',
    ST_SetSRID(ST_MakePoint(-6.8700, 33.9650), 4326)::geography,
    'Salle de travail — Faculté des Sciences',
    33.9650, -6.8700,
    NOW() + INTERVAL '5 hours',
    60, 3,
    'homework', 'small',
    'Je bloque sur les structures de Lewis et l isomérie. Quelqu un pour expliquer ?',
    'public', 'created'
),

-- SESSION 8 — Calculus CANCELLED
(
    'aaaaaaaa-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000005',
    'Calculus II',
    'Séries de Taylor',
    ST_SetSRID(ST_MakePoint(-6.8498, 33.9716), 4326)::geography,
    'Bibliothèque centrale UM5',
    33.9716, -6.8498,
    NOW() - INTERVAL '1 day',
    120, 4,
    'discussion', 'small',
    'Session annulée car Sara avait un examen surprise.',
    'public', 'cancelled'
),

-- SESSION 9 — Session SPAM (supprimée par admin — pour test)
(
    'aaaaaaaa-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000013',
    'Recrutement Stage',
    'Opportunité stage marketing rémunéré',
    ST_SetSRID(ST_MakePoint(-6.8498, 33.9716), 4326)::geography,
    'Café Central',
    33.9716, -6.8498,
    NOW() + INTERVAL '1 hour',
    60, 20,
    'discussion', 'large',
    'Venez découvrir nos opportunités de stage. Inscription obligatoire.',
    'public', 'created'
);

-- Marquer la session spam comme supprimée par admin
UPDATE study_sessions SET
    is_deleted          = TRUE,
    deleted_by_admin_id = '00000000-0000-0000-0000-000000000002'
WHERE id = 'aaaaaaaa-0000-0000-0000-000000000009';


-- ────────────────────────────────────────────────────────────
-- 5.3 — INSERTION DES PARTICIPANTS
-- ────────────────────────────────────────────────────────────

INSERT INTO session_participants (session_id, user_id, status, checked_in_at, joined_at) VALUES

-- Session 1 (Calculus II — ACTIVE)
('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'checked_in', NOW() - INTERVAL '25 minutes', NOW() - INTERVAL '30 minutes'),
('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000008', 'checked_in', NOW() - INTERVAL '20 minutes', NOW() - INTERVAL '28 minutes'),
('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000009', 'joined',     NULL,                           NOW() - INTERVAL '15 minutes'),

-- Session 2 (Algèbre — CREATED)
('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006', 'joined', NULL, NOW() - INTERVAL '10 minutes'),
('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'joined', NULL, NOW() - INTERVAL '5 minutes'),

-- Session 3 (Physique — CREATED)
('aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000007', 'joined', NULL, NOW() - INTERVAL '2 hours'),
('aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000010', 'joined', NULL, NOW() - INTERVAL '1 hour'),

-- Session 4 (CS101 — ACTIVE)
('aaaaaaaa-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000008', 'checked_in', NOW() - INTERVAL '55 minutes', NOW() - INTERVAL '60 minutes'),
('aaaaaaaa-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000006', 'checked_in', NOW() - INTERVAL '50 minutes', NOW() - INTERVAL '58 minutes'),

-- Session 5 (Biologie — COMPLETED)
('aaaaaaaa-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000009', 'checked_in', NOW() - INTERVAL '3 hours',   NOW() - INTERVAL '3 hours 5 minutes'),
('aaaaaaaa-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'checked_in', NOW() - INTERVAL '2h55min',   NOW() - INTERVAL '3 hours'),
('aaaaaaaa-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000007', 'checked_in', NOW() - INTERVAL '2h50min',   NOW() - INTERVAL '3 hours'),
('aaaaaaaa-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000011', 'no_show',    NULL,                          NOW() - INTERVAL '4 hours'),

-- Session 6 (Microéco — CREATED)
('aaaaaaaa-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000011', 'joined', NULL, NOW() - INTERVAL '30 minutes');


-- ────────────────────────────────────────────────────────────
-- 5.4 — INSERTION DES MESSAGES
-- ────────────────────────────────────────────────────────────

INSERT INTO messages (session_id, sender_id, content, message_type, sent_at) VALUES

-- Messages session 1 (Calculus II — ACTIVE)
('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Hey tout le monde ! Prêts pour les intégrales ? 📚', 'text', NOW() - INTERVAL '28 minutes'),
('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000008', 'Je suis à la table 4, 2e étage !', 'text', NOW() - INTERVAL '26 minutes'),
('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Super, j arrive dans 5 min 🏃', 'text', NOW() - INTERVAL '25 minutes'),
('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000009', 'Je viens aussi ! Quelqu un a le poly du chapitre 8 ?', 'text', NOW() - INTERVAL '20 minutes'),
('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Oui je l ai, je l apporte !', 'text', NOW() - INTERVAL '18 minutes'),
('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000008', 'On commence par l exercice 7.3 ou vous préférez commencer par la théorie ?', 'text', NOW() - INTERVAL '15 minutes'),
('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 'Théorie d abord pour être sûrs des bases 👍', 'text', NOW() - INTERVAL '12 minutes'),
('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000009', 'D accord avec Sara. Je note la formule au tableau.', 'text', NOW() - INTERVAL '10 minutes'),

-- Messages session 4 (CS101 — ACTIVE)
('aaaaaaaa-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000008', 'Salut ! On commence par le tri à bulles ou le merge sort ?', 'text', NOW() - INTERVAL '58 minutes'),
('aaaaaaaa-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000006', 'Merge sort directement, le bubble c est trop simple 😄', 'text', NOW() - INTERVAL '55 minutes'),
('aaaaaaaa-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000008', 'Okay ! Voilà mon implémentation en Python :', 'text', NOW() - INTERVAL '50 minutes'),
('aaaaaaaa-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000006', 'Attention à la condition de base dans ta récursion !', 'text', NOW() - INTERVAL '45 minutes'),
('aaaaaaaa-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000008', 'Ah oui tu as raison, merci ! Corrigé 🙏', 'text', NOW() - INTERVAL '40 minutes'),

-- Messages session 5 (Biologie — COMPLETED)
('aaaaaaaa-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000009', 'Bonjour tout le monde ! On attaque la réplication ADN ?', 'text', NOW() - INTERVAL '3 hours'),
('aaaaaaaa-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000005', 'Oui ! J ai préparé un schéma des enzymes impliquées', 'text', NOW() - INTERVAL '2h50min'),
('aaaaaaaa-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000007', 'Super session, j ai tout compris maintenant ! Merci 🎉', 'text', NOW() - INTERVAL '1 hour');

-- Message supprimé par admin (spam)
INSERT INTO messages (
    session_id, sender_id, content, message_type,
    is_deleted, deleted_by_admin_id, deleted_at, sent_at
) VALUES (
    'aaaaaaaa-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000013',
    'Venez rejoindre notre programme de marketing ! Lien : spam.com',
    'text',
    TRUE,
    '00000000-0000-0000-0000-000000000003',
    NOW() - INTERVAL '5 minutes',
    NOW() - INTERVAL '8 minutes'
);


-- ────────────────────────────────────────────────────────────
-- 5.5 — INSERTION DES NOTES (RATINGS)
-- ────────────────────────────────────────────────────────────
-- Uniquement pour la session COMPLETED (session 5 — Biologie)

INSERT INTO ratings (
    rater_id, rated_id, session_id,
    overall_score, punctuality_score, engagement_score,
    would_study_again, comment
) VALUES

-- Sara note Karima (créatrice session biologie)
(
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000009',
    'aaaaaaaa-0000-0000-0000-000000000005',
    5, 5, 5, TRUE,
    'Karima est une excellente hôte ! Très bien organisée, explications claires 👏'
),

-- Sara note Maria
(
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000007',
    'aaaaaaaa-0000-0000-0000-000000000005',
    4, 4, 5, TRUE,
    'Très impliquée dans la session, bonnes questions et contributions'
),

-- Karima note Sara
(
    '00000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000005',
    'aaaaaaaa-0000-0000-0000-000000000005',
    5, 5, 5, TRUE,
    'Sara est toujours ponctuelle et très motivée. J adore étudier avec elle !'
),

-- Karima note Maria
(
    '00000000-0000-0000-0000-000000000009',
    '00000000-0000-0000-0000-000000000007',
    'aaaaaaaa-0000-0000-0000-000000000005',
    4, 3, 4, TRUE,
    'Bonne partenaire, légèrement en retard mais très participative'
),

-- Maria note Sara
(
    '00000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000005',
    'aaaaaaaa-0000-0000-0000-000000000005',
    5, 5, 4, TRUE,
    'Excellente, Sara maîtrise très bien le sujet et sait expliquer !'
),

-- Maria note Karima
(
    '00000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000009',
    'aaaaaaaa-0000-0000-0000-000000000005',
    5, 5, 5, TRUE,
    'Karima est très sérieuse et organise de super sessions. À refaire !'
);

-- Mettre à jour les trust scores après insertion des ratings
UPDATE users SET trust_score = 72.50 WHERE id = '00000000-0000-0000-0000-000000000005'; -- Sara
UPDATE users SET trust_score = 62.00 WHERE id = '00000000-0000-0000-0000-000000000009'; -- Karima
UPDATE users SET trust_score = 58.75 WHERE id = '00000000-0000-0000-0000-000000000007'; -- Maria


-- ────────────────────────────────────────────────────────────
-- 5.6 — INSERTION DES SIGNALEMENTS (REPORTS)
-- ────────────────────────────────────────────────────────────

INSERT INTO reports (
    id,
    reporter_id, reported_user_id, reported_session_id, reported_message_id,
    reason, description, status, resolution_action, resolved_by_id, resolved_at
) VALUES

-- Report 1 — PENDING (harcèlement, priorité urgente)
(
    'cccccccc-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000012',
    NULL, NULL,
    'harassment',
    'Youssef m a envoyé des messages inappropriés après la session et a continué après que je lui ai demandé d arrêter.',
    'pending',
    NULL, NULL, NULL
),

-- Report 2 — PENDING (spam session)
(
    'cccccccc-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000005',
    NULL,
    'aaaaaaaa-0000-0000-0000-000000000009',
    NULL,
    'spam',
    'Cette session ne sert pas à étudier. C est de la publicité commerciale déguisée en session d étude.',
    'pending',
    NULL, NULL, NULL
),

-- Report 3 — RESOLVED (faux profil)
(
    'cccccccc-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000013',
    NULL, NULL,
    'fake_profile',
    'Ce profil semble faux, l utilisatrice ne répond pas et la photo ne correspond pas à une vraie étudiante.',
    'resolved',
    'Compte banni définitivement après vérification : profil spam confirmé',
    '00000000-0000-0000-0000-000000000002',
    NOW() - INTERVAL '2 days'
),

-- Report 4 — PENDING (message inapproprié)
(
    'cccccccc-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000009',
    NULL, NULL,
    (SELECT id FROM messages WHERE sender_id = '00000000-0000-0000-0000-000000000013' AND is_deleted = TRUE LIMIT 1),
    'spam',
    'Ce message contient un lien de spam externe dans le chat de la session.',
    'pending',
    NULL, NULL, NULL
),

-- Report 5 — DISMISSED (faux rapport)
(
    'cccccccc-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000010',
    '00000000-0000-0000-0000-000000000006',
    NULL, NULL,
    'other',
    'Jean est trop strict dans sa façon d expliquer.',
    'dismissed',
    'Rapport rejeté : aucune violation des CGU constatée. Simple désaccord pédagogique.',
    '00000000-0000-0000-0000-000000000003',
    NOW() - INTERVAL '5 days'
);


-- ────────────────────────────────────────────────────────────
-- 5.7 — INSERTION DES BLOCAGES
-- ────────────────────────────────────────────────────────────

INSERT INTO blocks (blocker_id, blocked_id) VALUES
-- Sara a bloqué Youssef (suite au harcèlement)
('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000012'),
-- Ahmed a bloqué Nadia (spam)
('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000013');


-- ────────────────────────────────────────────────────────────
-- 5.8 — INSERTION DES ACTIONS ADMIN (AUDIT LOG)
-- ────────────────────────────────────────────────────────────

INSERT INTO admin_actions (
    admin_id, action_type,
    target_user_id, target_session_id, target_message_id, target_report_id,
    reason, metadata
) VALUES

-- Ban de Nadia par Admin Ali
(
    '00000000-0000-0000-0000-000000000002',
    'ban',
    '00000000-0000-0000-0000-000000000013',
    NULL, NULL,
    'cccccccc-0000-0000-0000-000000000003',
    'Compte spam confirmé après investigation du rapport #cccc...003',
    '{"previous_warnings": 0, "sessions_deleted": 1}'
),

-- Suppression session spam par Admin Ali
(
    '00000000-0000-0000-0000-000000000002',
    'delete_session',
    NULL,
    'aaaaaaaa-0000-0000-0000-000000000009',
    NULL, NULL,
    'Session commerciale non académique — violation flagrante des CGU',
    '{"session_subject": "Recrutement Stage", "participant_count": 1}'
),

-- Suppression message spam par Moderator Mounir
(
    '00000000-0000-0000-0000-000000000003',
    'delete_message',
    NULL, NULL,
    (SELECT id FROM messages WHERE sender_id = '00000000-0000-0000-0000-000000000013' AND is_deleted = TRUE LIMIT 1),
    'cccccccc-0000-0000-0000-000000000004',
    'Message spam avec lien externe dans le chat',
    '{"session_id": "aaaaaaaa-0000-0000-0000-000000000001"}'
),

-- Résolution rapport faux par Mod Laila (dismissal)
(
    '00000000-0000-0000-0000-000000000004',
    'dismiss_report',
    NULL, NULL, NULL,
    'cccccccc-0000-0000-0000-000000000005',
    'Rapport non fondé — désaccord personnel sans violation des CGU',
    '{}'
),

-- Suspension de Youssef par Mod Mounir
(
    '00000000-0000-0000-0000-000000000003',
    'suspend',
    '00000000-0000-0000-0000-000000000012',
    NULL, NULL,
    'cccccccc-0000-0000-0000-000000000001',
    'Harcèlement confirmé suite au rapport. Suspension 3 jours.',
    '{"duration_hours": 72, "suspended_until": "3 days from now"}'
),

-- Promotion de Mounir par Admin Ali
(
    '00000000-0000-0000-0000-000000000002',
    'promote',
    '00000000-0000-0000-0000-000000000003',
    NULL, NULL, NULL,
    'Utilisateur de confiance avec trust_score élevé et comportement exemplaire',
    '{"new_role": "moderator", "previous_role": "student"}'
),

-- Promotion de Laila par Admin Ali
(
    '00000000-0000-0000-0000-000000000002',
    'promote',
    '00000000-0000-0000-0000-000000000004',
    NULL, NULL, NULL,
    'Étudiante sérieuse, signalements pertinents dans le passé',
    '{"new_role": "moderator", "previous_role": "student"}'
);


-- ============================================================
-- BLOC 6 — REQUÊTES DE VÉRIFICATION
-- ============================================================
-- Décommenter et exécuter pour vérifier les données insérées

-- Compter les enregistrements par table
SELECT 'users'               AS table_name, COUNT(*) FROM users
UNION ALL SELECT 'study_sessions',          COUNT(*) FROM study_sessions
UNION ALL SELECT 'session_participants',    COUNT(*) FROM session_participants
UNION ALL SELECT 'messages',               COUNT(*) FROM messages
UNION ALL SELECT 'ratings',                COUNT(*) FROM ratings
UNION ALL SELECT 'reports',                COUNT(*) FROM reports
UNION ALL SELECT 'blocks',                 COUNT(*) FROM blocks
UNION ALL SELECT 'admin_actions',          COUNT(*) FROM admin_actions
ORDER BY table_name;

-- Voir tous les utilisateurs avec leurs rôles et statuts
SELECT
    id,
    first_name || ' ' || last_name  AS full_name,
    email,
    role,
    trust_score,
    is_email_verified               AS verified,
    is_suspended,
    is_banned
FROM users
ORDER BY
    CASE role
        WHEN 'super_admin' THEN 1
        WHEN 'admin'       THEN 2
        WHEN 'moderator'   THEN 3
        ELSE 4
    END,
    trust_score DESC;

-- Voir les sessions avec le nombre de participants
SELECT
    s.id,
    s.subject,
    s.status,
    s.location_name,
<<<<<<< HEAD
    s.scheduled_time,
=======
    s.start_time,
>>>>>>> origin/dev
    COUNT(sp.id) AS participant_count,
    u.first_name || ' ' || u.last_name AS creator
FROM study_sessions s
LEFT JOIN session_participants sp ON sp.session_id = s.id AND sp.status IN ('joined','checked_in')
LEFT JOIN users u ON u.id = s.creator_id
WHERE s.is_deleted = FALSE
GROUP BY s.id, u.first_name, u.last_name
ORDER BY s.created_at DESC;

-- Voir les signalements en attente
SELECT
    r.id,
    r.reason,
    r.status,
    r.description,
    ru.first_name || ' ' || ru.last_name AS reporter,
    tu.first_name || ' ' || tu.last_name AS reported_user,
    r.created_at
FROM reports r
LEFT JOIN users ru ON ru.id = r.reporter_id
LEFT JOIN users tu ON tu.id = r.reported_user_id
WHERE r.status = 'pending'
ORDER BY r.created_at DESC;

-- Voir l audit log complet
SELECT
    aa.action_type,
    aa.reason,
    aa.created_at,
    a.first_name || ' ' || a.last_name    AS admin_name,
    a.role                                 AS admin_role,
    t.first_name || ' ' || t.last_name    AS target_user
FROM admin_actions aa
LEFT JOIN users a ON a.id = aa.admin_id
LEFT JOIN users t ON t.id = aa.target_user_id
ORDER BY aa.created_at DESC;

-- Test requête PostGIS : trouver les sessions dans un rayon de 2km depuis la bibliothèque
SELECT
    s.subject,
    s.location_name,
    s.status,
    ROUND(
        ST_Distance(
            s.location::geography,
            ST_MakePoint(-6.8498, 33.9716)::geography
        )::numeric
    ) AS distance_meters
FROM study_sessions s
WHERE
    s.is_deleted = FALSE
    AND s.status IN ('created', 'active')
    AND ST_DWithin(
        s.location::geography,
        ST_MakePoint(-6.8498, 33.9716)::geography,
        2000
    )
ORDER BY distance_meters ASC;


-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
-- Résumé de ce qui a été créé :
--
-- TABLES (8) :
--   users (13 utilisateurs : 1 super_admin, 1 admin, 2 moderators, 9 students)
--   study_sessions (9 sessions : 1 active, 1 active, 3 created, 1 completed, 1 cancelled, 1 deleted)
--   session_participants (15 participations)
--   messages (17 messages dont 1 supprimé par admin)
--   ratings (6 notes croisées pour la session complétée)
--   reports (5 signalements : 3 pending, 1 resolved, 1 dismissed)
--   blocks (2 blocages)
--   admin_actions (7 actions dans l audit log)
--
-- COMPTES DE TEST (mot de passe : Password123) :
--   superadmin@studysync.ma  → super_admin
--   admin@studysync.ma       → admin
--   mounir.moderator@...     → moderator
--   laila.moderator@...      → moderator
--   sara.rahman@univ.ma      → student (Trusted, trust=72.5)
--   jean.kofi@cadi.ma        → student (Building, trust=45)
--   maria.lopez@univ.ma      → student (trust=58.75)
--   ahmed.mansouri@univ.ma   → student (trust=34.2)
--   karima.lahlou@univ.ma    → student (trust=62)
--   omar.boussouf@univ.ma    → student (New, trust=5)
--   fatima.zahra@univ.ma     → student (Highly Trusted, trust=85.5)
--   youssef.krim@univ.ma     → student SUSPENDU 3 jours
--   nadia.bennis@spam.ma     → student BANNIE
-- ============================================================

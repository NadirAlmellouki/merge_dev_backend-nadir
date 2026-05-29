"use strict";

/**
 * Migration : fix study_sessions + session_participants
 *
 * Problèmes corrigés :
 *  1. Colonnes camelCase → snake_case dans study_sessions
 *  2. Enum enum_study_sessions_status   — valeurs manquantes
 *  3. Enum enum_study_sessions_study_type — création si absente
 *  4. Enum enum_study_sessions_visibility — création si absente
 *  5. session_participants.status : STRING → ENUM propre + valeur 'accepted'
 *  6. Colonnes camelCase → snake_case dans session_participants
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const qi = queryInterface;

    // ─────────────────────────────────────────────────────────
    // 0. helpers
    // ─────────────────────────────────────────────────────────
    const colExists = async (table, col) => {
      const [rows] = await qi.sequelize.query(`
        SELECT 1 FROM information_schema.columns
        WHERE table_name = '${table}' AND column_name = '${col}'
        LIMIT 1
      `);
      return rows.length > 0;
    };

    const enumValueExists = async (enumName, value) => {
      const [rows] = await qi.sequelize.query(`
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = '${enumName}' AND e.enumlabel = '${value}'
        LIMIT 1
      `);
      return rows.length > 0;
    };

    const enumExists = async (enumName) => {
      const [rows] = await qi.sequelize.query(`
        SELECT 1 FROM pg_type WHERE typname = '${enumName}' LIMIT 1
      `);
      return rows.length > 0;
    };

    // ─────────────────────────────────────────────────────────
    // 1. STUDY_SESSIONS — renommer colonnes camelCase → snake_case
    // ─────────────────────────────────────────────────────────
    const ssRenames = [
      ["scheduledTime",   "scheduled_time"],
      ["creatorId",       "creator_id"],
      ["locationName",    "location_name"],
      ["durationMinutes", "duration_minutes"],
      ["maxParticipants", "max_participants"],
      ["studyType",       "study_type"],
      ["createdAt",       "created_at"],
      ["updatedAt",       "updated_at"],
    ];

    for (const [from, to] of ssRenames) {
      if (await colExists("study_sessions", from) && !(await colExists("study_sessions", to))) {
        await qi.renameColumn("study_sessions", from, to);
        console.log(`study_sessions: ${from} → ${to}`);
      }
    }

    // ─────────────────────────────────────────────────────────
    // 2. ENUMS study_sessions
    // ─────────────────────────────────────────────────────────

    // 2a. status
    if (!(await enumExists("enum_study_sessions_status"))) {
      await qi.sequelize.query(`
        CREATE TYPE enum_study_sessions_status
          AS ENUM ('created','active','completed','cancelled')
      `);
    } else {
      for (const v of ["created", "active", "completed", "cancelled"]) {
        if (!(await enumValueExists("enum_study_sessions_status", v))) {
          await qi.sequelize.query(
            `ALTER TYPE enum_study_sessions_status ADD VALUE '${v}'`
          );
        }
      }
    }

    // Convertir la colonne si elle est encore VARCHAR
    await qi.sequelize.query(`
      ALTER TABLE study_sessions
        ALTER COLUMN status TYPE enum_study_sessions_status
        USING status::enum_study_sessions_status
    `);

    // 2b. study_type
    if (!(await enumExists("enum_study_sessions_study_type"))) {
      await qi.sequelize.query(`
        CREATE TYPE enum_study_sessions_study_type
          AS ENUM (
            'silent_coworking','active_discussion',
            'exam_prep','homework_help','project_work'
          )
      `);
    } else {
      for (const v of [
        "silent_coworking","active_discussion",
        "exam_prep","homework_help","project_work",
      ]) {
        if (!(await enumValueExists("enum_study_sessions_study_type", v))) {
          await qi.sequelize.query(
            `ALTER TYPE enum_study_sessions_study_type ADD VALUE '${v}'`
          );
        }
      }
    }

    await qi.sequelize.query(`
      ALTER TABLE study_sessions
        ALTER COLUMN study_type TYPE enum_study_sessions_study_type
        USING study_type::enum_study_sessions_study_type
    `);

    // 2c. visibility
    if (!(await enumExists("enum_study_sessions_visibility"))) {
      await qi.sequelize.query(`
        CREATE TYPE enum_study_sessions_visibility
          AS ENUM ('public','friends_only','invite_only')
      `);
    } else {
      for (const v of ["public", "friends_only", "invite_only"]) {
        if (!(await enumValueExists("enum_study_sessions_visibility", v))) {
          await qi.sequelize.query(
            `ALTER TYPE enum_study_sessions_visibility ADD VALUE '${v}'`
          );
        }
      }
    }

    await qi.sequelize.query(`
      ALTER TABLE study_sessions
        ALTER COLUMN visibility TYPE enum_study_sessions_visibility
        USING visibility::enum_study_sessions_visibility
    `);

    // ─────────────────────────────────────────────────────────
    // 3. SESSION_PARTICIPANTS — renommer colonnes camelCase → snake_case
    // ─────────────────────────────────────────────────────────
    const spRenames = [
      ["sessionId",    "session_id"],
      ["userId",       "user_id"],
      ["checkedInAt",  "checked_in_at"],
      ["leftAt",       "left_at"],
      ["joinedAt",     "joined_at"],
    ];

    for (const [from, to] of spRenames) {
      if (await colExists("session_participants", from) && !(await colExists("session_participants", to))) {
        await qi.renameColumn("session_participants", from, to);
        console.log(`session_participants: ${from} → ${to}`);
      }
    }

    // ─────────────────────────────────────────────────────────
    // 4. session_participants.status → ENUM propre
    // ─────────────────────────────────────────────────────────
    if (!(await enumExists("enum_session_participants_status"))) {
      await qi.sequelize.query(`
        CREATE TYPE enum_session_participants_status
          AS ENUM ('pending','joined','accepted','checked_in','left','rejected')
      `);
    } else {
      for (const v of ["pending","joined","accepted","checked_in","left","rejected"]) {
        if (!(await enumValueExists("enum_session_participants_status", v))) {
          await qi.sequelize.query(
            `ALTER TYPE enum_session_participants_status ADD VALUE '${v}'`
          );
        }
      }
    }

    // Convertir VARCHAR → ENUM (cast les valeurs existantes)
    await qi.sequelize.query(`
      ALTER TABLE session_participants
        ALTER COLUMN status TYPE enum_session_participants_status
        USING status::enum_session_participants_status
    `);

    // ─────────────────────────────────────────────────────────
    // 5. Ajouter colonnes manquantes si elles n'existent pas
    // ─────────────────────────────────────────────────────────

    // session_participants.message (optionnel, pour requestJoin)
    if (!(await colExists("session_participants", "message"))) {
      await qi.addColumn("session_participants", "message", {
        type: Sequelize.STRING(500),
        allowNull: true,
      });
      console.log("session_participants: +message");
    }

    // study_sessions.created_at / updated_at si absentes
    if (!(await colExists("study_sessions", "created_at"))) {
      await qi.addColumn("study_sessions", "created_at", {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      });
    }
    if (!(await colExists("study_sessions", "updated_at"))) {
      await qi.addColumn("study_sessions", "updated_at", {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      });
    }

    console.log("✅ Migration terminée avec succès");
  },

  // ─────────────────────────────────────────────────────────
  // DOWN — rollback complet
  // ─────────────────────────────────────────────────────────
  async down(queryInterface, Sequelize) {
    const qi = queryInterface;

    // Remettre status en VARCHAR
    await qi.sequelize.query(`
      ALTER TABLE session_participants
        ALTER COLUMN status TYPE VARCHAR(50)
        USING status::TEXT
    `);

    await qi.sequelize.query(`
      ALTER TABLE study_sessions
        ALTER COLUMN status TYPE VARCHAR(50) USING status::TEXT;
      ALTER TABLE study_sessions
        ALTER COLUMN study_type TYPE VARCHAR(50) USING study_type::TEXT;
      ALTER TABLE study_sessions
        ALTER COLUMN visibility TYPE VARCHAR(50) USING visibility::TEXT;
    `);

    // Supprimer les enums
    for (const e of [
      "enum_session_participants_status",
      "enum_study_sessions_status",
      "enum_study_sessions_study_type",
      "enum_study_sessions_visibility",
    ]) {
      await qi.sequelize.query(`DROP TYPE IF EXISTS ${e}`);
    }

    // Supprimer colonne message si ajoutée
    const [rows] = await qi.sequelize.query(`
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'session_participants' AND column_name = 'message' LIMIT 1
    `);
    if (rows.length > 0) {
      await qi.removeColumn("session_participants", "message");
    }

    console.log("↩️  Rollback terminé");
  },
};

'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.sequelize.query(`
    ALTER TYPE enum_session_participants_status ADD VALUE IF NOT EXISTS 'accepted';
  `);
}

export async function down(queryInterface, Sequelize) {
  // PostgreSQL ne permet pas de supprimer une valeur d'enum directement
  // Il faut recréer l'enum complet si tu veux vraiment rollback
  await queryInterface.sequelize.query(`
    ALTER TABLE session_participants 
      ALTER COLUMN status TYPE VARCHAR(50);
    
    DROP TYPE enum_session_participants_status;
    
    CREATE TYPE enum_session_participants_status AS ENUM (
      'pending', 'joined', 'checked_in'
    );
    
    ALTER TABLE session_participants
      ALTER COLUMN status TYPE enum_session_participants_status
      USING status::enum_session_participants_status;
  `);
}
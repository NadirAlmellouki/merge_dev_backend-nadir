'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'session_participants',
      'createdAt',
      {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      }
    );

    await queryInterface.addColumn(
      'session_participants',
      'updatedAt',
      {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('session_participants', 'createdAt');
    await queryInterface.removeColumn('session_participants', 'updatedAt');
  },
};
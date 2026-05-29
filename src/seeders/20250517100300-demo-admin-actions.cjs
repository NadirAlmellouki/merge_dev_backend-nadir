"use strict";

const { adminActions, IDS } = require("./data/member4.cjs");

const ADMIN_ACTION_IDS = Object.values(IDS.adminActions);

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("admin_actions", adminActions, {});
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete(
      "admin_actions",
      { id: { [Op.in]: ADMIN_ACTION_IDS } },
      {},
    );
  },
};

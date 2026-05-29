"use strict";

const { reports, IDS } = require("./data/member4.cjs");

const REPORT_IDS = Object.values(IDS.reports);

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("reports", reports, {});
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete(
      "reports",
      { id: { [Op.in]: REPORT_IDS } },
      {},
    );
  },
};

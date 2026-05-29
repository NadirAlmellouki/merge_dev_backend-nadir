"use strict";

const { messages, IDS } = require("./data/member4.cjs");

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("messages", messages, {});
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;
    await queryInterface.bulkDelete(
      "messages",
      { id: { [Op.in]: [IDS.messages.spam] } },
      {},
    );
  },
};

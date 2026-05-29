"use strict";

const { ratings, trustScoreUpdates, IDS } = require("./data/member4.cjs");

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert("ratings", ratings, {});

    for (const { id, trust_score } of trustScoreUpdates) {
      await queryInterface.sequelize.query(
        "UPDATE users SET trust_score = :trust_score WHERE id = :id",
        { replacements: { id, trust_score } },
      );
    }
  },

  async down(queryInterface, Sequelize) {
    const { Op } = Sequelize;

    await queryInterface.bulkDelete(
      "ratings",
      { session_id: { [Op.eq]: IDS.sessions.biology } },
      {},
    );

    await queryInterface.bulkUpdate(
      "users",
      { trust_score: 0.0 },
      { id: { [Op.in]: trustScoreUpdates.map((u) => u.id) } },
    );
  },
};

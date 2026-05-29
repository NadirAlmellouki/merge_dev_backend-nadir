import { Router } from "express";
import sequelize from "../config/db.config.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await sequelize.authenticate();

    const [counts] = await sequelize.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS users,
        (SELECT COUNT(*)::int FROM study_sessions) AS study_sessions,
        (SELECT COUNT(*)::int FROM messages) AS messages,
        (SELECT COUNT(*)::int FROM ratings) AS ratings,
        (SELECT COUNT(*)::int FROM reports) AS reports,
        (SELECT COUNT(*)::int FROM admin_actions) AS admin_actions
    `);

    res.json({
      success: true,
      message: "API et base de données OK",
      database: counts[0],
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      message: "Base de données inaccessible",
      error: err.message,
    });
  }
});

export default router;

import sequelize from "../config/db.config.js";
import { User } from "../models/associations.js";

export const recalculateTrustScore = async (userId) => {
  const ratings = await sequelize.query(
    `
    SELECT AVG(overall_score) AS avg_rating, COUNT(*) AS count
    FROM ratings WHERE rated_id = :userId
    `,
    { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
  );

  const sessions = await sequelize.query(
    `
    SELECT COUNT(*) AS count FROM session_participants
    WHERE user_id = :userId AND status = 'completed'
    `,
    { replacements: { userId }, type: sequelize.QueryTypes.SELECT }
  );

  const user = await User.findByPk(userId);
  if (!user) return;

  const avgRating = parseFloat(ratings[0]?.avg_rating || 3);
  const sessionCount = parseInt(sessions[0]?.count || 0, 10);
  const accountAgeDays = Math.floor(
    (Date.now() - new Date(user.createdAt).getTime()) / 86400000
  );

  const ratingPart = (avgRating / 5) * 50;
  const sessionPart = Math.min(sessionCount, 50) * 0.6;
  const agePart = Math.min(accountAgeDays / 365, 1) * 10;
  const verifiedPart =
    (user.is_email_verified ? 2 : 0) + (user.is_verified ? 8 : 0);

  const score = Math.min(
    100,
    Math.round(ratingPart + sessionPart + agePart + verifiedPart)
  );

  await user.update({ trust_score: score });
  return score;
};

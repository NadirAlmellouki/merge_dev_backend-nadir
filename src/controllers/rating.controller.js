import { Rating } from "../models/associations.js";
import { recalculateTrustScore } from "../services/trustService.js";
import { SessionParticipant, StudySession } from "../models/associations.js";

export const rateSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const {
      rated_id,
      overall_rating,
      punctuality_rating,
      engagement_rating,
      would_study_again,
      comment,
    } = req.body;

    if (!rated_id || !overall_rating) {
      return res.status(400).json({ error: "rated_id et overall_rating requis" });
    }

    const session = await StudySession.findByPk(sessionId);
    if (!session || session.status !== "active" && session.status !== "completed") {
      await StudySession.update({ status: "completed" }, { where: { id: sessionId } });
    }

    const [rating, created] = await Rating.findOrCreate({
      where: {
        rater_id: req.user.id,
        rated_id,
        session_id: sessionId,
      },
      defaults: {
        overall_score: overall_rating,
        punctuality_score: punctuality_rating,
        engagement_score: engagement_rating,
        would_study_again,
        comment,
      },
    });

    if (!created) {
      await rating.update({
        overall_score: overall_rating,
        punctuality_score: punctuality_rating,
        engagement_score: engagement_rating,
        would_study_again,
        comment,
      });
    }

    await recalculateTrustScore(rated_id);
    res.status(201).json({ success: true, rating });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

export const completeSession = async (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = await StudySession.findByPk(sessionId);
    if (!session) return res.status(404).json({ error: "Session non trouvée" });

    await session.update({ status: "completed" });
    await SessionParticipant.update(
      { status: "completed" },
      { where: { session_id: sessionId, status: "checked_in" } }
    );

    res.json({ success: true, message: "Session terminée" });
  } catch {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

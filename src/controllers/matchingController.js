import { getRecommendedSessions } from "../services/matchingService.js";
import { isWithinGeofence, getHeatmapData } from "../services/geoService.js";

// GET /api/matches/recommend
export const getRecommendations = async (req, res) => {
  try {
    const { latitude, longitude, radius = 5 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        error: "latitude et longitude sont requis"
      });
    }

    const userProfile = {
      ...req.user, // depuis le middleware auth
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude)
    };

    const sessions = await getRecommendedSessions(userProfile, parseFloat(radius));

    res.json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// POST /api/matches/checkin-verify
export const verifyCheckin = async (req, res) => {
  try {
    const { sessionLat, sessionLng, userLat, userLng } = req.body;

    const withinGeofence = await isWithinGeofence(
      sessionLat, sessionLng,
      userLat, userLng
    );

    res.json({
      success: true,
      can_checkin: withinGeofence,
      message: withinGeofence
        ? "Tu es dans la zone, tu peux te check-in !"
        : "Tu es trop loin de la session (rayon 100m requis)"
    });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};

// GET /api/matches/heatmap
export const getHeatmap = async (req, res) => {
  try {
    const data = await getHeatmapData();
    res.json({ success: true, spots: data });
  } catch (error) {
    res.status(500).json({ error: "Erreur serveur" });
  }
};
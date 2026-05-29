import { getSubjectScore } from "../utils/tfidf.js";
import { getLocationScore, calculateDistance } from "../utils/haversine.js";
import { getTimeScore } from "../utils/timeOverlap.js";
import { findSessionsNearby } from "./geoService.js";

// Score Trust (0-100)
const getTrustScore = (user) => {
  const avgRating = (user.avg_rating || 3) / 5 * 100;
  const sessionBonus = Math.min(user.session_count || 0, 50) * 2;
  const ageBonus = Math.min((user.account_age_days || 0) / 365 * 100, 100);
  const verifiedBonus = user.is_verified ? 100 : 0;

  return (
    avgRating * 0.5 +
    sessionBonus * 0.3 +
    ageBonus * 0.1 +
    verifiedBonus * 0.1
  );
};

// Algorithme principal — calcule le score 0-100
export const calculateMatchScore = (session, userProfile) => {
  // 1. Score sujet (40%)
  const subjectScore = getSubjectScore(
    session.subject,
    userProfile.major
  ) * 0.4;

  // 2. Score distance (30%)
  const distance = calculateDistance(
    userProfile.latitude, userProfile.longitude,
    session.latitude,    session.longitude
  );
  const locationScore = getLocationScore(distance) * 0.3;

  // 3. Score horaire (20%)
  const timeScore = getTimeScore(session.start_time) * 0.2;

  // 4. Trust score (10%)
  const trustScore = getTrustScore(userProfile) * 0.1;

  // Bonus
  let bonus = 0;
  if (userProfile.year === session.creator_year) bonus += 5;

  const total = subjectScore + locationScore + timeScore + trustScore + bonus;
  return Math.min(Math.round(total), 100);
};

// Recommandations pour un utilisateur
export const getRecommendedSessions = async (userProfile, radiusKm = 5) => {
  const nearbySessions = await findSessionsNearby(
    userProfile.latitude,
    userProfile.longitude,
    radiusKm
  );

  const scored = nearbySessions.map(session => ({
    ...session,
    match_score: calculateMatchScore(session, userProfile),
    distance_km: parseFloat(session.distance_km).toFixed(2)
  }));

  // Trier par score décroissant
  return scored.sort((a, b) => b.match_score - a.match_score);
};
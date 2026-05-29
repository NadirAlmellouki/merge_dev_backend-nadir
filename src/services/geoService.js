import sequelize from "../config/db.config.js";

// Trouver les sessions dans un rayon donné
export const findSessionsNearby = async (latitude, longitude, radiusKm = 5) => {
  const sessions = await sequelize.query(`
    SELECT *,
      ST_Distance(
        location::geography,
        ST_MakePoint(:lng, :lat)::geography
      ) / 1000 AS distance_km
    FROM study_sessions
    WHERE 
      status = 'created'
      AND ST_DWithin(
        location::geography,
        ST_MakePoint(:lng, :lat)::geography,
        :radius
      )
    ORDER BY distance_km ASC
  `, {
    replacements: {
      lat: latitude,
      lng: longitude,
      radius: radiusKm * 1000
    },
    type: sequelize.QueryTypes.SELECT
  });
  return sessions;
};

// Vérifier si un utilisateur est dans le geofence (100m)
export const isWithinGeofence = async (
  sessionLat, sessionLng, userLat, userLng
) => {
  const result = await sequelize.query(`
    SELECT ST_DWithin(
      ST_MakePoint(:sLng, :sLat)::geography,
      ST_MakePoint(:uLng, :uLat)::geography,
      100
    ) AS within_geofence
  `, {
    replacements: {
      sLat: sessionLat, sLng: sessionLng,
      uLat: userLat,    uLng: userLng
    },
    type: sequelize.QueryTypes.SELECT
  });
  return result[0].within_geofence;
};

// Données heatmap — spots populaires
export const getHeatmapData = async () => {
  const data = await sequelize.query(`
    SELECT 
      location_name,
      ST_X(location::geometry) AS longitude,
      ST_Y(location::geometry) AS latitude,
      COUNT(*) AS session_count
    FROM study_sessions
    WHERE location IS NOT NULL
    GROUP BY location_name, location
    ORDER BY session_count DESC
    LIMIT 50
  `, { type: sequelize.QueryTypes.SELECT });
  return data;
};
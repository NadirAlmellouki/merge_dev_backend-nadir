// Calcul de distance entre deux points GPS
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance en km
};

// Score de proximité (0-100) selon la distance
export const getLocationScore = (distanceKm) => {
  if (distanceKm < 0.05) return 100; // Même bâtiment
  if (distanceKm <= 0.5) return 80;  // Dans 500m
  if (distanceKm <= 1)   return 60;  // Dans 1km
  if (distanceKm <= 2)   return 40;  // Dans 2km
  if (distanceKm <= 5)   return 20;  // Dans 5km
  return 0;                           // Au-delà de 5km
};
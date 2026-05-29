// Score de chevauchement horaire (0-100)
export const getTimeScore = (sessionTime, userRequestTime) => {
  const now = new Date();
  const session = new Date(sessionTime);
  const diffMinutes = (session - now) / (1000 * 60);

  // Session immédiate (dans les 15 min)
  if (Math.abs(diffMinutes) <= 15) return 100;

  // Même heure exacte
  if (Math.abs(diffMinutes) <= 30) return 100;

  // Fenêtre de temps qui se chevauche
  if (Math.abs(diffMinutes) <= 120) return 60;

  // Même jour
  const sameDay = session.toDateString() === now.toDateString();
  if (sameDay) return 30;

  // Autre jour
  return 0;
};
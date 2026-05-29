// Score de similarité entre deux sujets (0-100)
export const getSubjectScore = (subject1, subject2) => {
  if (!subject1 || !subject2) return 10;

  const s1 = subject1.toLowerCase().trim();
  const s2 = subject2.toLowerCase().trim();

  // Correspondance exacte
  if (s1 === s2) return 100;

  // Mots en commun
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  const common = words1.filter(w => words2.includes(w) && w.length > 2);

  if (common.length > 0) {
    const similarity = (common.length * 2) / (words1.length + words2.length);
    if (similarity >= 0.7) return 70; // Même département
    if (similarity >= 0.3) return 40; // Domaine lié
  }

  return 10; // Différent
};
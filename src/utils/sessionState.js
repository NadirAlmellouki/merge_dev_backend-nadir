const transitions = {
  created: ["active", "cancelled"],
  active: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export const canTransition = (from, to) => {
  if (!from || !to) return false;
  return transitions[from]?.includes(to) ?? false;
};

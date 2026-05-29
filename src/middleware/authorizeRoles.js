const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user?.role) {
    return res.status(401).json({ message: "authentication required" });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: "insufficient permissions" });
  }
  next();
};

export default authorizeRoles;

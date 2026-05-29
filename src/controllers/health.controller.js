export const healthCheck = (_req, res) => {
  res.status(200).json({
    success: true,
    message: "StudySync API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
};

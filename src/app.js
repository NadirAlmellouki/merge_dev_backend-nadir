import "dotenv/config";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import matchingRoutes from "./routes/matching.routes.js";
import healthRoutes from "./routes/health.routes.js";
import sessionsRoutes from "./routes/sessions.routes.js";

import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/matches", matchingRoutes);
app.use("/api/sessions", sessionsRoutes);

app.get("/", (_req, res) => {
  res.send("StudySync API is running");
});

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

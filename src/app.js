import "dotenv/config";

import express from "express";
import sequelize from "./config/db.config.js";
import "./models/index.js";

import authRoutes from "./routes/authRoutes.js";
import ratingRoutes from "./routes/ratingRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import * as models from "./models/index.js";

const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());
//app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);



app.use("/api/ratings", ratingRoutes);

app.get("/", (_req, res) => {
  res.send("StudySync API is running");
});

app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);



app.listen(port, async () => {

  try {

    await sequelize.sync({ alter: true });

    console.log("Database synced");

  } catch (e) {

    console.error("DB sync error:", e);

  }

  console.log(`Server running on port ${port}`);

});
export { models };

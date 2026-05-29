import "dotenv/config";
import app from "./app.js";
import sequelize from "./config/db.config.js";
import setupAssociations from "./models/associations.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    setupAssociations();

    await sequelize.authenticate();
    console.log("Database connection verified");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();

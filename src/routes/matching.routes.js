import express from "express";
import {
  getRecommendations,
  verifyCheckin,
  getHeatmap
} from "../controllers/matchingController.js";

const router = express.Router();

router.get("/recommend", getRecommendations);
router.post("/checkin-verify", verifyCheckin);
router.get("/heatmap", getHeatmap);

export default router;
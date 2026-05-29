
import express from "express";
import {
  listSessions,
  createStudySession,
  getSession,
  requestJoin,
  acceptRequest,
  checkIn,
  getPendingRequests,
  cancelSession,
  mySessions,
} from "../controllers/session.controller.js";
import { rateSession, completeSession } from "../controllers/rating.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();
router.use(authenticate);

router.get("/", listSessions);
router.get("/mine", mySessions);
router.post("/", createStudySession);
router.get("/:id", getSession);
router.post("/:id/join", requestJoin);
router.post("/:id/accept", acceptRequest);
router.post("/:id/checkin", checkIn);
router.get("/:id/requests", getPendingRequests);
router.post("/:id/cancel", cancelSession);
router.post("/:id/rate", rateSession);
router.post("/:id/complete", completeSession);

export default router;


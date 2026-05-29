import { Router } from "express";
import reportController from "../controllers/reportController.js";
import authenticateToken from "../middleware/auth.js";
import authorizeRoles from "../middleware/authorizeRoles.js";

const router = Router();

router.post("/", authenticateToken, reportController.createReport);
router.get(
  "/",
  authenticateToken,
  authorizeRoles("moderator", "admin", "super_admin"),
  reportController.listReports,
);
router.patch(
  "/:id/resolve",
  authenticateToken,
  authorizeRoles("moderator", "admin", "super_admin"),
  reportController.resolveReport,
);

export default router;

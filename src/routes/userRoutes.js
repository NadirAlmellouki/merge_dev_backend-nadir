import { Router } from "express";
import userController from "../controllers/userController.js";
import authenticateToken from "../middleware/auth.js";

const router = Router();

router.get("/me", authenticateToken, userController.getMe);
router.put("/me", authenticateToken, userController.updateMe);
router.get("/blocked", authenticateToken, userController.getBlockedUsers);
router.post("/block", authenticateToken, userController.blockUser);
router.delete("/block/:blockedUserId", authenticateToken, userController.unblockUser);
router.get("/:id", userController.getUserById);

export default router;

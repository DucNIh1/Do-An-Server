import express from "express";
import {
  logout,
  signup,
  verifyEmail,
  login,
  loginWithGoogle,
} from "../controllers/auth.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/google-auth", loginWithGoogle);
router.post("/logout", logout);
router.post("/verify-email", verifyEmail);
export default router;

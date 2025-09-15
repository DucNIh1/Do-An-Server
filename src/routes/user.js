import express from "express";
import {
  getUsers,
  getUserById,
  softDeleteUser,
  hardDeleteUser,
  restoreUser,
  updateUserRole,
} from "../controllers/user.js";

const router = express.Router();

router.get("/", getUsers);

router.get("/:id", getUserById);

router.patch("/:id/soft-delete", softDeleteUser);
router.patch("/:id/restore", restoreUser);
router.delete("/:id", hardDeleteUser);
router.patch("/:id/role", updateUserRole);
export default router;

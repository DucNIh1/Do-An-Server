import express from "express";
import {
  getUsers,
  getUserById,
  softDeleteUser,
  hardDeleteUser,
  restoreUser,
} from "../controllers/user.js";

const router = express.Router();

router.get("/", getUsers);

router.get("/:id", getUserById);

router.patch("/:id/soft-delete", softDeleteUser);
router.patch("/:id/restore", restoreUser);
router.delete("/:id", hardDeleteUser);

export default router;

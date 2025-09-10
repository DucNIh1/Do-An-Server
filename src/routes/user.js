import express from "express";
import {
  getUsers,
  getUserById,
  softDeleteUser,
  hardDeleteUser,
} from "../controllers/user.js";

const router = express.Router();

router.get("/", getUsers);

router.get("/:id", getUserById);

router.patch("/:id/soft-delete", softDeleteUser);

router.delete("/:id", hardDeleteUser);

export default router;

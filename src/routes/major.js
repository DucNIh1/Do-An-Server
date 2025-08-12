import express from "express";
import {
  getMajors,
  getMajor,
  createMajor,
  updateMajor,
  deleteMajor,
} from "../controllers/major.js";

const router = express.Router();

router.get("/", getMajors);
router.get("/:id", getMajor);
router.post("/", createMajor);
router.put("/:id", updateMajor);
router.delete("/:id", deleteMajor);

export default router;

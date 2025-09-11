import express from "express";
import {
  getConsultationRequests,
  createConsultationRequest,
  updateConsultationStatus,
  deleteConsultationRequest,
} from "../controllers/consultationRequest.js";

import checkAuth from "../middlewares/checkAuth.js";

const router = express.Router();

router.get("/", checkAuth, getConsultationRequests);

router.post("/", createConsultationRequest);

router.patch("/:id/status", checkAuth, updateConsultationStatus);

router.delete("/:id", checkAuth, deleteConsultationRequest);

export default router;

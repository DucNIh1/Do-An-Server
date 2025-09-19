import express from "express";

import {
  getGeneralStatistics,
  getMonthlyConsultations,
  getMonthlyRegistrations,
  getPostStatistics,
} from "../controllers/analytics.js";

const router = express.Router();

router.get("/registrations/monthly", getMonthlyRegistrations);
router.get("/consultations/monthly", getMonthlyConsultations);
router.get("/posts/monthly", getPostStatistics);
router.get("/general", getGeneralStatistics);
export default router;

import express from "express";
import {
  getUsers,
  getUserById,
  softDeleteUser,
  hardDeleteUser,
  restoreUser,
  updateUserRole,
  rateAdvisorController,
  checkRatedAdvisorController,
  getAllAdvisorsWithRatingsController,
} from "../controllers/user.js";
import checkAuth from "../middlewares/checkAuth.js";
import checkRole from "../middlewares/checkRole.js";
import { Role } from "../../generated/prisma/index.js";
const router = express.Router();

router.get("/", getUsers);
router.post("/:id/rate", checkAuth, rateAdvisorController);
router.get("/:id/check-rating", checkAuth, checkRatedAdvisorController);
router.get("/advisors-with-ratings", getAllAdvisorsWithRatingsController);
router.get("/:id", getUserById);

router.patch(
  "/:id/soft-delete",
  checkAuth,
  checkRole(Role.ADMIN),
  softDeleteUser
);
router.patch("/:id/restore", checkAuth, checkRole(Role.ADMIN), restoreUser);
router.delete("/:id", checkAuth, checkRole(Role.ADMIN), hardDeleteUser);
router.patch("/:id/role", checkAuth, checkRole(Role.ADMIN), updateUserRole);
export default router;

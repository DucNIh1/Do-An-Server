import express from "express";
import {
  deleteNotification,
  getNotifications,
  markAllAsRead,
  markAsRead,
} from "../controllers/notification.js";
import checkAuth from "../middlewares/checkAuth.js";

const router = express.Router();

router.get("/", checkAuth, getNotifications);

router.patch("/marksAllAsRead", checkAuth, markAllAsRead);

router.delete("/:id", checkAuth, deleteNotification);
router.patch("/:id/markAsRead", checkAuth, markAsRead);

export default router;

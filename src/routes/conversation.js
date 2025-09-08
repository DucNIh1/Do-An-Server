import express from "express";
import {
  addUsersToConversation,
  createConversation,
  getConversations,
  leaveConversation,
} from "../controllers/conversation.js";
import checkAuth from "../middlewares/checkAuth.js";

const router = express.Router();

router.post("/", checkAuth, createConversation);
router.post("/:id/members", checkAuth, addUsersToConversation);
router.get("/", checkAuth, getConversations);
router.delete("/:id", checkAuth, leaveConversation);

export default router;
createConversation;

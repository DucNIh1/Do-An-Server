import express from "express";
import {
  addUsersToConversation,
  createConversation,
  deleteConversation,
  getConversationMembers,
  getConversations,
  leaveConversation,
  removeMemberFromConversation,
  renameConversation,
} from "../controllers/conversation.js";
import checkAuth from "../middlewares/checkAuth.js";

const router = express.Router();

router.post("/", checkAuth, createConversation);
router.post("/:id/members", checkAuth, addUsersToConversation);
router.get("/", checkAuth, getConversations);
router.delete("/:id", checkAuth, deleteConversation);
router.post("/:id/leave", checkAuth, leaveConversation);
router.patch("/:id/rename", checkAuth, renameConversation);
router.delete("/:id/members/:userId", checkAuth, removeMemberFromConversation);

router.get("/:id/members", checkAuth, getConversationMembers);

export default router;
createConversation;

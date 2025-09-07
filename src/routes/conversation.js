import express from "express";
import {
  addUsersToConversation,
  createConversation,
} from "../controllers/conversation.js";
import checkAuth from "../middlewares/checkAuth.js";

const router = express.Router();

router.post("/", checkAuth, createConversation);
router.post("/:id/members", checkAuth, addUsersToConversation);
export default router;
createConversation;

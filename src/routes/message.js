import express from "express";
import { getMessages, sendMessage } from "../controllers/message.js";
import checkAuth from "../middlewares/checkAuth.js";

const router = express.Router();

router.post("/", checkAuth, sendMessage);
router.get("/", checkAuth, getMessages);

export default router;

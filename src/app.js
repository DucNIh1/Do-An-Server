import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import http from "http";
import AppRouter from "./routes/index.js";
import handleError from "./controllers/err.js";
import "./jobs/major.js";
import "./jobs/user.js";
import "./jobs/post.js";
import { Server } from "socket.io";
import { initializeSocket, getUserSocketMap } from "./socket/socket.js";
import { setIO } from "./socket/socketInstance.js";
import "./workers/notificationWorker.js";
import "./workers/deleteImageWorker.js";
import "./workers/emailWorker.js";

dotenv.config();
const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(
  cors({
    origin: [process.env.CLIENT_URL, process.env.ADMIN_URL],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3800;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [process.env.CLIENT_URL, process.env.ADMIN_URL],
    credentials: true,
  },
});
setIO(io);
app.use((req, res, next) => {
  req.io = io;
  req.userSocketMap = getUserSocketMap();
  next();
});

initializeSocket(io);

app.get("/", (req, res) => {
  res.send("Hello world");
});

AppRouter(app);

app.use(handleError);

server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

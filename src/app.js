import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import AppRouter from "./routes/index.js";
import handleError from "./controllers/err.js";
import "./jobs/major.js";
import "./jobs/user.js";
import "./jobs/post.js";

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3800;

app.get("/", (req, res) => {
  res.send("Hello world");
});

AppRouter(app);

app.use(handleError);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

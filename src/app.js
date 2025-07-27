import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import AppRouter from "./routes/index.js";
import handleError from "./controllers/err.js";

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3000;

AppRouter(app);

// app.use("*", (req, res, next) => {
//   res.status(404).json({ message: "Đường dẫn không hợp lệ!" });
// });

app.use(handleError);

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});

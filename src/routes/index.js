import authRouter from "./auth.js";
import postsRouter from "./post.js";
import uploadRouter from "./upload.js";

const AppRouter = (app) => {
  app.use("/api/auth", authRouter);
  app.use("/api/posts", postsRouter);
  app.use("/api/upload", uploadRouter);
};

export default AppRouter;

import authRouter from "./auth.js";
import postsRouter from "./post.js";
import uploadRouter from "./upload.js";
import majorRouter from "./major.js";

const AppRouter = (app) => {
  app.use("/api/auth", authRouter);
  app.use("/api/posts", postsRouter);
  app.use("/api/images", uploadRouter);
  app.use("/api/majors", majorRouter);
};

export default AppRouter;

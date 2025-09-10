import authRouter from "./auth.js";
import postsRouter from "./post.js";
import uploadRouter from "./upload.js";
import majorRouter from "./major.js";
import messageRouter from "./message.js";
import conversationRouter from "./conversation.js";
import userRouter from "./user.js";

const AppRouter = (app) => {
  app.use("/api/auth", authRouter);
  app.use("/api/posts", postsRouter);
  app.use("/api/images", uploadRouter);
  app.use("/api/majors", majorRouter);
  app.use("/api/messages", messageRouter);
  app.use("/api/conversations", conversationRouter);
  app.use("/api/users", userRouter);
};

export default AppRouter;

import authRouter from "./auth.js";
import postsRouter from "./post.js";
import uploadRouter from "./upload.js";
import majorRouter from "./major.js";
import messageRouter from "./message.js";
import conversationRouter from "./conversation.js";
import userRouter from "./user.js";
import notificationRouter from "./notification.js";
import consultationRequestRouter from "./consultationRequest.js";
import analyticsRouter from "./analytics.js";

const AppRouter = (app) => {
  app.use("/api/auth", authRouter);
  app.use("/api/posts", postsRouter);
  app.use("/api/images", uploadRouter);
  app.use("/api/majors", majorRouter);
  app.use("/api/messages", messageRouter);
  app.use("/api/conversations", conversationRouter);
  app.use("/api/users", userRouter);
  app.use("/api/notifications", notificationRouter);
  app.use("/api/consultation-requests", consultationRequestRouter);
  app.use("/api/analytics", analyticsRouter);
};

export default AppRouter;

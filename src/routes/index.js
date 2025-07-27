import authRouter from "./auth.js";
const AppRouter = (app) => {
  app.use("/api/auth", authRouter);
};

export default AppRouter;

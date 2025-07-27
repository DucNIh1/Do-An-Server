import catchAsync from "../utils/CatchAsync.js";
import AppError from "../utils/AppError.js";

const checkRole = (...roles) =>
  catchAsync(async (req, res, next) => {
    const user = req.user;
    if (!roles.includes(user.role)) {
      return next(new AppError("You do not have permission", 403));
    }

    next();
  });

export default checkRole;
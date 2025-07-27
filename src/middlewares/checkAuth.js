import AppError from "../utils/AppError.js";
import jwt from "jsonwebtoken";

const checkAuth = (req, res, next) => {
  const authorizationHeader = req.headers.authorization;
  const token = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.split(" ")[1]
    : req.cookies.accessToken;

  if (!token) {
    return next(new AppError("JWT token is missing. Please log in.", 401));
  }

  jwt.verify(token, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "JsonWebTokenError") {
        return next(new AppError("Unauthorized", 401));
      }
      return next(new AppError(err.message, 401));
    }

    req.user = decoded;

    return next();
  });
};

export default checkAuth;
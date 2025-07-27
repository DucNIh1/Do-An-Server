const devErrors = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stackStrace: err.stack,
    err,
  });
};

const prodErrors = (err, res) => {
  if (err.isOperational) {
    res
      .status(err.statusCode)
      .json({ status: err.status, message: err.message });
  } else {
    res.status(500).json({
      status: "error",
      message: "Lỗi server! Hãy thử lại lần nữa",
    });
  }
};

const handleError = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "production") {
    prodErrors(err, res);
  } else {
    devErrors(err, res);
  }
};
export default handleError;

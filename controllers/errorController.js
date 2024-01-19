const { AppError } = require("../utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;

  return new AppError(404, message);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.keyValue.name;
  const message = `Duplicate field value: ${value}. Please use another value !`;

  return new AppError(404, message);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data: ${errors.join(". ")}`;
  return new AppError(404, message);
};

const handleJWTError = () => {
  const message = "Ivalid token.Please log in again";
  return new AppError(401, message);
};

const handleJWTExpiredError = () => {
  const message = "Your access token has expired. Please request a new one.";
  return new AppError(401, message);
};

const sendErrForDev = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  } else {
    res.status(err.statusCode).render("error", {
      title: "Something went wrong",
      message: err.message,
    });
    console.log(err);
  }
};

const sendErrforProd = (err, req, res) => {
  if (req.originalUrl.startsWith("/api")) {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      res.status(500).json({
        status: "Error",
        message: "Something went wrong",
      });
      console.log(err);
    }
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).render("error", {
        title: "Something went wrong",
        message: err.message,
      });
      console.log(err);
    } else {
      res.status(err.statusCode).render("error", {
        title: "Something went wrong",
        message: "Please try again later",
      });
    }
  }
};

const errorController = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  err.message = err.message;
  if (process.env.NODE_ENV === "development") {
    sendErrForDev(err, req, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };

    if (err.name === "CastError") error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === "ValidationError") error = handleValidationErrorDB(error);
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();
    sendErrforProd(error, req, res);
  }
};

module.exports = { errorController };

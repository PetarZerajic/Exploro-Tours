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

const sendErrForDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrforProd = (err, res) => {
  //Poruka za klijenta
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    //Programska ili druga nepoznata greska:ne zelimo da detalji procure klijentu
    // Za nas same zelimo da detaljniju poruku o gresci
    //Predstavlja NE operativnu gresku
  } else {
    // 1)Logovati gresku
    // 2)Poslati genericku gresku
    console.error(err);
    res.status(500).json({
      status: "Error",
      message: "Something went wrong",
    });
  }
};

const errorController = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; //default vrednost koja ce biti poslata klijentu
  err.status = err.status || "error"; //default vrednost koja ce biti poslata klijentu
  err.message = err.message; //default vrednost koja ce biti poslata klijentu
  if (process.env.NODE_ENV === "development") {
    sendErrForDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err }; //Koristimo kopiju da ne bi nadjacali argumente funkcije (err)

    if (err.name === "CastError") error = handleCastErrorDB(error);
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    if (err.name === "ValidationError") error = handleValidationErrorDB(error);
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleJWTExpiredError();
    sendErrforProd(error, res);
  }
};

module.exports = { errorController };

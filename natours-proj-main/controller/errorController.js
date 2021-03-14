const AppError = require('./../utils/appError');

const sendErrorDev = (res, err) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (res, err) => {
  //Operational error ,trusted error : send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  //Programming error or unknown error : Dont leak error details to client
  else {
    // Log error
    console.error('ERROR!!', err);

    //Send a generic response to client
    res.status(500).json({
      status: 'error',
      message: 'Someting went wrong!',
    });
  }
};
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}`;
  return new AppError(message, 400);
};
const handleDuplicateFieldDB = (err) => {
  const message = `Duplicate Field value : ${err.keyValue.name}. Please find another value`;
  return new AppError(message, 401);
};
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const handleInvalidtokenError = (err) => {
  return new AppError('Invalid token! Please log in again.', 401);
};
const handleExpiredToken = (err) => {
  return new AppError('Token has expired! Log in agin ', 401);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(res, err);
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.create(err);
    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    if (error.code === 11000) {
      error = handleDuplicateFieldDB(error);
    }
    if (error.name === 'ValidationError') {
      error = handleValidationError(error);
    }
    if (error.name === 'JsonWebTokenError') {
      error = handleInvalidtokenError(error);
    }
    if (error.name === 'TokenExpiredError') {
      error = handleExpiredToken(error);
    }
    sendErrorProd(res, error);
  }
};

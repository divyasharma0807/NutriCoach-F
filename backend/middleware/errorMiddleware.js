// Handler for 404 Route Not Found
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Centralized error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error(err);
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Mask database details and exceptions
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Resource not found with the provided identifier';
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join(', ');
  } else if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  } else if (statusCode === 500) {
    message = 'An unexpected server error occurred. Please try again later.';
  }

  res.status(statusCode);
  res.json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

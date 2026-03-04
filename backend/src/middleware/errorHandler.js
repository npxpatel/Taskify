const { ZodError }  = require('zod');
const { AppError }  = require('../utils/AppError');
const { isProduction } = require('../config/env');

function errorHandler(err, _req, res, _next) {
  // Zod validation error
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors:  err.flatten().fieldErrors,
    });
  }

  // Known operational errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Unknown error — hide details in production
  console.error('[Unhandled Error]', err);
  return res.status(500).json({
    success: false,
    message: isProduction ? 'Internal server error' : err.message,
  });
}

module.exports = { errorHandler };

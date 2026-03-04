class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.name          = 'AppError';
    this.statusCode    = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message)                    { return new AppError(message, 400); }
  static unauthorized(message = 'Not authenticated') { return new AppError(message, 401); }
  static forbidden(message = 'Forbidden')       { return new AppError(message, 403); }
  static notFound(message)                      { return new AppError(message, 404); }
  static conflict(message)                      { return new AppError(message, 409); }
  static internal(message = 'Internal server error') { return new AppError(message, 500, false); }
}

module.exports = { AppError };

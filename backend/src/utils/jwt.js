const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { AppError } = require('./AppError');

function signToken(userId) {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw AppError.unauthorized('Invalid or expired token');
  }
}

module.exports = { signToken, verifyToken };

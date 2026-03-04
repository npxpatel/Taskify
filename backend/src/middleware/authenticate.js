const { verifyToken } = require('../utils/jwt');
const { AppError }    = require('../utils/AppError');

function authenticate(req, _res, next) {
  try {
    // Prefer cookie, fall back to Authorization: Bearer <token>
    const auth = req.headers.authorization;
    const token = req.cookies?.token || (auth?.startsWith("Bearer ") && auth.slice(7));

    if (!token) throw AppError.unauthorized('Authentication required');

    const payload = verifyToken(token);
    req.userId = payload.userId;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate };

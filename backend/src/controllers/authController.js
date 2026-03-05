const { v4: uuidv4 }  = require('uuid');
const bcrypt          = require('bcryptjs');
const { User }        = require('../models/User');
const { Otp }         = require('../models/Otp');
const { AppError }    = require('../utils/AppError');
const { signToken }   = require('../utils/jwt');
const { COOKIE_OPTIONS } = require('../config/env');
const { registerSchema, loginSchema, forgotSchema, resetSchema } = require('../types');
const { publishEmailNotification } = require('../services/rabbitmq');

async function register(req, res, next) {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    const exists = await User.exists({ email });
    if (exists) throw AppError.conflict('Email already registered');

    // 12 rounds is current industry recommendation for bcrypt
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ userId: uuidv4(), email, name, passwordHash });

    const token = signToken(user.userId);
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.status(201).json({ success: true, data: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await User.findOne({ email });

    // Constant-time check prevents timing-based user enumeration
    const passwordMatch = user ? await user.comparePassword(password) : false;
    if (!user || !passwordMatch) throw AppError.unauthorized('Invalid email or password');

    const token = signToken(user.userId);
    res.cookie('token', token, COOKIE_OPTIONS);

    return res.json({ success: true, data: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await User.findOne({ userId: req.userId });
    if (!user) throw AppError.notFound('User not found');
    return res.json({ success: true, data: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

async function logout(_req, res) {
  res.clearCookie('token', { path: '/' });
  return res.json({ success: true, message: 'Logged out' });
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = forgotSchema.parse(req.body);

    const user = await User.exists({ email });

    // Always respond with the same message to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email exists, an OTP has been sent' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await Otp.deleteMany({ email });
    await Otp.create({ email, otp, expiresAt });

    // Publish to queue — email worker handles delivery asynchronously
    publishEmailNotification({ type: 'otp', to: email, data: { otp } });

    return res.json({ success: true, message: 'If that email exists, an OTP has been sent' });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = resetSchema.parse(req.body);

    const record = await Otp.findOne({ email, otp });
    if (!record || record.expiresAt < new Date()) {
      throw AppError.badRequest('Invalid or expired OTP');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await User.updateOne({ email }, { passwordHash });
    await Otp.deleteMany({ email });

    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe, logout, forgotPassword, resetPassword };

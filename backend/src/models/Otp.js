const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    email:     { type: String, required: true, lowercase: true, trim: true, index: true },
    otp:       { type: String, required: true },
    // MongoDB TTL index — document is deleted when expiresAt is reached
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { 
    timestamps: { createdAt: 'createdAt', updatedAt: false }, 
    versionKey: false 
  }
);

const Otp = mongoose.model('Otp', otpSchema);
module.exports = { Otp };

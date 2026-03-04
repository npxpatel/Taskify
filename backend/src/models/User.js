const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    userId:       { type: String, required: true, unique: true, index: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name:         { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    picture:      { type: String, default: null },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
    versionKey: false,
    toJSON: {
      transform(_doc, ret) {
        delete ret._id;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

userSchema.methods.toPublicJSON = function () {
  return {
    userId:    this.userId,
    email:     this.email,
    name:      this.name,
    picture:   this.picture,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);
module.exports = { User };

const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    jobId:         { type: String, required: true, unique: true, index: true },
    userId:        { type: String, required: true, index: true },
    company:       { type: String, required: true, trim: true },
    role:          { type: String, required: true, trim: true },
    date:          { type: String, required: true },
    applied:       { type: String, enum: ['yes', 'no'], default: 'no' },
    openingType:   { type: String, enum: ['public', 'referral', 'internal'], default: 'public' },
    referral:      { type: String, enum: ['available', 'not_available'], default: 'not_available' },
    shortlisted:   { type: String, enum: ['yes', 'no', 'waiting'], default: 'waiting' },
    interviews:    { type: String, enum: ['yes', 'no', 'waiting'], default: 'waiting' },
    selected:      { type: String, enum: ['yes', 'no', 'waiting'], default: 'waiting' },
    companyLogo:   { type: String, default: null },
    companyDomain: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { transform(_doc, ret) { delete ret._id; return ret; } },
  }
);

jobSchema.index({ userId: 1, createdAt: -1 });

const Job = mongoose.model('Job', jobSchema);
module.exports = { Job };

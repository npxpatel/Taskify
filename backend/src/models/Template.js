const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema(
  {
    templateId:   { type: String, required: true, unique: true, index: true },
    userId:       { type: String, required: true, index: true },
    category:     { type: String, enum: ['cover_letter', 'resume', 'cold_email', 'follow_up', 'other'], required: true },
    templateType: { type: String, enum: ['technical', 'behavioral', 'general'], required: true },
    title:        { type: String, required: true, trim: true },
    content:      { type: String, required: true },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { transform(_doc, ret) { 
      delete ret._id; return ret; 
    } },
  }
);

templateSchema.index({ userId: 1, updatedAt: -1 });

const Template = mongoose.model('Template', templateSchema);
module.exports = { Template };

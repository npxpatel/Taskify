const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    taskId:      { type: String, required: true, unique: true, index: true },
    userId:      { type: String, required: true, index: true },
    title:       { type: String, required: true, trim: true },
    description: { type: String, default: null },
    priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    tags:        { type: [String], default: [] },
    date:        { type: String, required: true },
    completed:   { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { transform(_doc, ret) { 
      delete ret._id; 
      return ret; 
    } },
  }
);

taskSchema.index({ userId: 1, createdAt: -1 });

const Task = mongoose.model('Task', taskSchema);
module.exports = { Task };

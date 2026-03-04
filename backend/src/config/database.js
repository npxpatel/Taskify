const mongoose = require('mongoose');
const { env } = require('./env');

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS:         10000,
  socketTimeoutMS:          45000,
  maxPoolSize:              50,
  minPoolSize:              10,
};

async function connectDB() {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGO_URI, MONGO_OPTIONS);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
}

async function disconnectDB() {
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
}

module.exports = { connectDB, disconnectDB };

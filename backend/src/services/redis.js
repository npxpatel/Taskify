const { createClient } = require('redis');
const { env } = require('../config/env');

let client = null;

async function connectRedis() {
  try {
    client = createClient({ url: env.REDIS_URL });
    client.on('error', (err) => console.error('Redis error:', err));
    await client.connect();
    console.log('Redis connected');
  } catch (error) {
    console.warn('Redis unavailable — caching disabled:', error.message);
    client = null;
  }
}

async function disconnectRedis() {
  if (client) {
    await client.quit();
    client = null;
    console.log('Redis disconnected');
  }
}

async function setCache(key, value, ttlSeconds = 300) {
  if (!client) return;
  try {
    await client.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.warn('setCache failed:', err.message);
  }
}

async function getCache(key) {
  if (!client) return null;
  try {
    const raw = await client.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('getCache failed:', err.message);
    return null;
  }
}

async function deleteCache(key) {
  if (!client) return;
  try {
    await client.del(key);
  } catch (err) {
    console.warn('deleteCache failed:', err.message);
  }
}

const CacheKeys = {
  userJobs:      (userId) => `jobs:${userId}`,
  userTasks:     (userId) => `tasks:${userId}`,
  userTemplates: (userId) => `templates:${userId}`,
  user:          (userId) => `user:${userId}`,
};

module.exports = { connectRedis, disconnectRedis, setCache, getCache, deleteCache, CacheKeys };

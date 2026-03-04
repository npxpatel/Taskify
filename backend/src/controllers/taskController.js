const { v4: uuidv4 } = require('uuid');
const { Task }       = require('../models/Task');
const { AppError }   = require('../utils/AppError');
const { setCache, getCache, deleteCache, CacheKeys } = require('../services/redis');
const { createTaskSchema, updateTaskSchema } = require('../types');

async function getTasks(req, res, next) {
  try {
    const cacheKey = CacheKeys.userTasks(req.userId);
    const cached = await getCache(cacheKey);
    if (cached) {
      // Apply completed filter on cached data to avoid redundant cache keys
      const completedFilter = req.query.completed;
      if (completedFilter !== undefined) {
        const want = completedFilter === 'true';
        return res.json({ success: true, data: cached.filter((t) => t.completed === want) });
      }
      return res.json({ success: true, data: cached });
    }

    const filter = { userId: req.userId };
    if (req.query.completed !== undefined) {
      filter.completed = req.query.completed === 'true';
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 }).lean();

    // Cache without the completed filter so one cache entry covers all variants
    const allTasks = filter.completed !== undefined
      ? await Task.find({ userId: req.userId }).sort({ createdAt: -1 }).lean()
      : tasks;

    await setCache(cacheKey, allTasks, 300); // Cache for 5 minutes
    return res.json({ success: true, data: tasks });
  } catch (err) {
    next(err);
  }
}

async function createTask(req, res, next) {
  try {
    const body = createTaskSchema.parse(req.body);
    const task = await Task.create({ taskId: uuidv4(), userId: req.userId, ...body });

    await deleteCache(CacheKeys.userTasks(req.userId));
    return res.status(201).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

async function updateTask(req, res, next) {
  try {
    const { taskId } = req.params;
    const body = updateTaskSchema.parse(req.body);

    const task = await Task.findOneAndUpdate(
      { taskId, userId: req.userId },
      body,
      { new: true, runValidators: true }
    );

    if (!task) throw AppError.notFound('Task not found');

    await deleteCache(CacheKeys.userTasks(req.userId));
    return res.json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
}

async function deleteTask(req, res, next) {
  try {
    const { taskId } = req.params;
    const task = await Task.findOneAndDelete({ taskId, userId: req.userId });

    if (!task) throw AppError.notFound('Task not found');

    await deleteCache(CacheKeys.userTasks(req.userId));
    return res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getTasks, createTask, updateTask, deleteTask };

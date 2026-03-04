const { v4: uuidv4 } = require('uuid');
const { Job }        = require('../models/Job');
const { AppError }   = require('../utils/AppError');
const { setCache, getCache, deleteCache, CacheKeys } = require('../services/redis');
const { createJobSchema, updateJobSchema, logoSchema } = require('../types');

async function getJobs(req, res, next) {
  try {
    const cacheKey = CacheKeys.userJobs(req.userId);
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ success: true, data: cached });

    const jobs = await Job.find({ userId: req.userId }).sort({ createdAt: -1 }).lean();

    await setCache(cacheKey, jobs, 300); // Cache for 5 minutes
    return res.json({ success: true, data: jobs });
  } catch (err) {
    next(err);
  }
}

async function createJob(req, res, next) {
  try {
    const body = createJobSchema.parse(req.body);
    const job  = await Job.create({ jobId: uuidv4(), userId: req.userId, ...body });

    await deleteCache(CacheKeys.userJobs(req.userId));
    return res.status(201).json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
}

async function updateJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const body = updateJobSchema.parse(req.body);

    const job = await Job.findOneAndUpdate(
      { jobId, userId: req.userId },
      body,
      { new: true, runValidators: true }
    );

    if (!job) throw AppError.notFound('Job not found');

    await deleteCache(CacheKeys.userJobs(req.userId));
    return res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
}

async function updateJobLogo(req, res, next) {
  try {
    const { jobId } = req.params;
    const { companyLogo, companyDomain } = logoSchema.parse(req.body);

    const job = await Job.findOneAndUpdate(
      { jobId, userId: req.userId },
      { companyLogo, companyDomain },
      { new: true }
    );

    if (!job) throw AppError.notFound('Job not found');

    await deleteCache(CacheKeys.userJobs(req.userId));
    return res.json({ success: true, data: job });
  } catch (err) {
    next(err);
  }
}

async function deleteJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const job = await Job.findOneAndDelete({ jobId, userId: req.userId });

    if (!job) throw AppError.notFound('Job not found');

    await deleteCache(CacheKeys.userJobs(req.userId));
    return res.json({ success: true, message: 'Job deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getJobs, createJob, updateJob, updateJobLogo, deleteJob };

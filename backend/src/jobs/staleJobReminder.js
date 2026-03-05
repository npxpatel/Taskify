/**
 * Stale Job Reminder — Cron Job
 *
 * Runs daily at 9:00 AM. Finds jobs where applied=yes but no update
 * in 14+ days, groups them by user, and publishes one reminder message
 * per user to the job_reminders queue.
 *
 * The actual email is sent by reminderWorker.js consuming that queue.
 */

const cron = require('node-cron');
const { Job }  = require('../models/Job');
const { User } = require('../models/User');
const { publishJobReminder } = require('../services/rabbitmq');

const STALE_DAYS = 14;

async function checkStaleJobs() {
  console.log('[staleJobReminder] Running stale job check...');

  const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);

  // Find all applied jobs not updated in 14+ days, excluding already resolved ones
  const staleJobs = await Job.find({
    applied:    'yes',
    selected:   'waiting',  // skip jobs that are already resolved (selected yes/no)
    updatedAt:  { $lt: cutoff },
  }).lean();

  if (staleJobs.length === 0) {
    return;
  }

  // Group stale jobs by userId
  const byUser = staleJobs.reduce((acc, job) => {
    if (!acc[job.userId]) acc[job.userId] = [];
    acc[job.userId].push(job);
    return acc;
  }, {});

  const userIds = Object.keys(byUser);
  const users   = await User.find({ userId: { $in: userIds } }).lean();
  const userMap = Object.fromEntries(users.map((u) => [u.userId, u]));


  for (const [userId, jobs] of Object.entries(byUser)) {
    const user = userMap[userId];
    if (!user) continue;

    const staleJobSummary = jobs.map((j) => ({
      company:         j.company,
      role:            j.role,
      daysSinceUpdate: Math.floor((Date.now() - new Date(j.updatedAt)) / (1000 * 60 * 60 * 24)),
    }));

    publishJobReminder({
      to:        user.email,
      name:      user.name,
      staleJobs: staleJobSummary,
    });

  }
}

function startStaleJobReminder() {
  // Runs every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    try {
      await checkStaleJobs();
    } catch (err) {
      console.error('[staleJobReminder] Error during stale job check:', err);
    }
  });

  console.log('[staleJobReminder] Scheduled — runs daily at 9:00 AM');
}

module.exports = { startStaleJobReminder, checkStaleJobs };

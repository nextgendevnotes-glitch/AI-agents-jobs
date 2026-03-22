import cron from 'node-cron';
import { jobFinderQueue } from '../queues/redisQueue';

export const startScheduler = () => {
  // Run job finder every 1 hour
  cron.schedule('0 * * * *', async () => {
    console.log('Cron Job Triggered: Enqueuing job finder task');
    await jobFinderQueue.add('fetch-jobs', { timestamp: Date.now() });
  });

  console.log('Scheduler started. Cron jobs configured.');
};

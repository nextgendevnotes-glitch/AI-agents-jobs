import { Queue, QueueOptions, Worker, Job } from 'bullmq';
import { ENV } from '../config/env';

const connection = {
  url: ENV.REDIS_URL,
};

const defaultQueueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

export const jobFinderQueue = new Queue('job_finder_queue', defaultQueueOptions);
export const jobMatchQueue = new Queue('job_match_queue', defaultQueueOptions);
export const applicationQueue = new Queue('application_queue', defaultQueueOptions);
export const profileAnalyzerQueue = new Queue('profile_analyzer_queue', defaultQueueOptions);
export const autoApplyQueue = new Queue('auto_apply_queue', defaultQueueOptions);

console.log('Redis Queues initialized');

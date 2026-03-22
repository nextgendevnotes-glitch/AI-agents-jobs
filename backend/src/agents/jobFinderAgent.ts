import { Worker, Job } from 'bullmq';
import { ENV } from '../config/env';
import { JobScraper } from '../services/jobScraper';
import { supabase } from '../db/supabaseClient';
import { jobMatchQueue } from '../queues/redisQueue';

export const jobFinderWorker = new Worker(
  'job_finder_queue',
  async (job: Job) => {
    console.log('Running Job Finder Agent...');
    try {
      const scrapedJobs = await JobScraper.fetchJobs();
      let importedIds: number[] = [];

      for (const jobData of scrapedJobs) {
        const { data: inserted, error } = await supabase
          .from('jobs')
          .upsert(jobData, { onConflict: 'title,company', ignoreDuplicates: true })
          .select();

        if (error) {
          console.error('Failed to insert job', error);
          continue;
        }

        if (inserted && inserted.length > 0) {
          importedIds.push(inserted[0].id);
        }
      }

      console.log(`Imported ${importedIds.length} new jobs. Submitting them to matching queue...`);

      // Retrieve all active users
      const { data: profiles, error: profileErr } = await supabase
        .from('user_profiles')
        .select('*');

      if (profileErr) throw profileErr;

      // Push combinations of User+Job to Job Matcher Queue
      if (profiles && profiles.length > 0) {
        for (const job_id of importedIds) {
          for (const profile of profiles) {
            await jobMatchQueue.add('match-job', {
              user_id: profile.user_id,
              job_id,
              profile,
            });
          }
        }
      }
      
      return importedIds;
    } catch (error) {
      console.error('Job Finder Agent Failed:', error);
      throw error;
    }
  },
  {
    connection: { url: ENV.REDIS_URL },
  }
);

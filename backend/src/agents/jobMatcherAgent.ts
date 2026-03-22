import { Worker, Job } from 'bullmq';
import { ENV } from '../config/env';
import { supabase } from '../db/supabaseClient';
import { AIService } from '../services/aiService';
import { applicationQueue } from '../queues/redisQueue';

export const jobMatcherWorker = new Worker(
  'job_match_queue',
  async (job: Job) => {
    const { user_id, job_id, profile } = job.data;
    console.log(`Running Job Matcher for user: ${user_id}, job: ${job_id}`);

    try {
      // Check if already matched
      const { data: existingMatch, error: checkErr } = await supabase
        .from('job_matches')
        .select('id, score, status')
        .eq('user_id', user_id)
        .eq('job_id', job_id)
        .single();
        
      if (existingMatch) {
         console.log(`Job Match already exists. Skipping API calculation.`);
         return existingMatch;
      }

      const { data: jobData, error: jobErr } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', job_id)
        .single();

      if (jobErr) throw jobErr;

      const aiMatch = await AIService.matchJob(profile, jobData);
      const score = aiMatch.score || 0;
      const status = score >= 70 ? 'matched' : 'rejected';

      const { data: matchData, error: matchErr } = await supabase
        .from('job_matches')
        .insert({
          user_id,
          job_id,
          score,
          status,
        })
        .select()
        .single();

      if (matchErr) throw matchErr;
      
      console.log(`Job matched with score: ${score}`);

      if (status === 'matched') {
        // Enqueue to Application Agent
        await applicationQueue.add('generate-application', {
          job_match_id: matchData.id,
          user_id,
          job_id,
          profile,
          jobData,
        });
      }

      return matchData;
    } catch (error) {
      console.error('Job Matcher Agent Failed:', error);
      throw error;
    }
  },
  {
    connection: { url: ENV.REDIS_URL },
    concurrency: 5,
  }
);

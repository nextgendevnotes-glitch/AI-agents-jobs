import { Worker, Job } from 'bullmq';
import { ENV } from '../config/env';
import { supabase } from '../db/supabaseClient';
import { AIService } from '../services/aiService';
import { jobMatchQueue } from '../queues/redisQueue';

export const profileWorker = new Worker(
  'profile_analyzer_queue',
  async (job: Job) => {
    const { userId, resumeText } = job.data;
    console.log(`Analyzing profile for user ${userId}`);

    try {
      // 1. Analyze with AI
      const profileData = await AIService.parseResume(resumeText);

      // 2. Save to DB
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          skills: profileData.skills || [],
          experience_years: profileData.experience_years || 0,
          preferred_roles: profileData.preferred_roles || [],
          locations: profileData.locations || [],
          country: profileData.country || null,
          city: profileData.city || null,
          resume_name: profileData.resume_name || null,
          resume_email: profileData.resume_email || null,
          resume_phone: profileData.resume_phone || null,
          address: profileData.address || null,
          education: profileData.education || [],
          companies: profileData.companies || [],
          auto_apply_enabled: false,
        })
        .select();

      if (error) throw error;
      console.log(`Profile saved for user ${userId}`);

      // 3. Clear Historical Job Matches for this User to allow Fresh AI Re-Scores
      await supabase.from('job_matches').delete().eq('user_id', userId);

      // 4. Trigger Matching on EVERY existing Job in the Database
      const { data: allJobs, error: jobsErr } = await supabase.from('jobs').select('id');
      if (!jobsErr && allJobs) {
        console.log(`Pushing ${allJobs.length} jobs to matching queue for user ${userId}...`);
        for (const j of allJobs) {
          await jobMatchQueue.add('match-job', {
            user_id: userId,
            job_id: j.id,
            profile: data[0],
          });
        }
      }

      return data;
    } catch (error) {
      console.error('Profile Analysis failed:', error);
      throw error;
    }
  },
  {
    connection: { url: ENV.REDIS_URL },
    concurrency: 5,
  }
);

profileWorker.on('failed', (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});

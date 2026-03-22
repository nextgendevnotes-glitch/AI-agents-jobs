import { Worker, Job } from 'bullmq';
import { ENV } from '../config/env';
import { supabase } from '../db/supabaseClient';
import { AIService } from '../services/aiService';
import { autoApplyQueue } from '../queues/redisQueue';

export const applicationWorker = new Worker(
  'application_queue',
  async (job: Job) => {
    const { job_match_id, user_id, job_id, profile, jobData } = job.data;
    console.log(`Generating Application for User: ${user_id}, Job: ${job_id}`);

    try {
      const { data: existingApp, error: appCheckErr } = await supabase
        .from('applications')
        .select('*')
        .eq('user_id', user_id)
        .eq('job_id', job_id)
        .single();
      
      if (!appCheckErr && existingApp) {
        console.log(`Application already exists for User ${user_id} and Job ${job_id}`);
        return existingApp;
      }

      const emailContent = await AIService.generateApplication(profile, jobData);
      const emailBody = emailContent.body || '';
      const emailSubject = emailContent.subject || '';

      const { data: appData, error: appErr } = await supabase
        .from('applications')
        .insert({
          user_id,
          job_id,
          status: 'pending',
          email_subject: emailSubject,
          email_body: emailBody,
        })
        .select()
        .single();

      if (appErr) throw appErr;
      
      console.log(`Application generated and saved as pending`);

      await autoApplyQueue.add('auto-apply', {
        application_id: appData.id,
        user_id,
        job_id,
        jobData,
        emailBody,
        emailSubject,
        profile,
      });

      return appData;
    } catch (error) {
      console.error('Application Agent Failed:', error);
      throw error;
    }
  },
  {
    connection: { url: ENV.REDIS_URL },
    concurrency: 5,
  }
);

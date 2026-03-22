import { Worker, Job } from 'bullmq';
import { ENV } from '../config/env';
import { supabase } from '../db/supabaseClient';
import { EmailService } from '../services/emailService';
import { FraudDetectionService } from '../services/fraudDetectionService';

export const autoApplyWorker = new Worker(
  'auto_apply_queue',
  async (job: Job) => {
    const { application_id, user_id, jobData, emailBody, emailSubject, profile } = job.data;
    console.log(`Running Auto Apply Agent for App: ${application_id}`);

    try {
      const { data: userProfile, error: profileErr } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user_id)
        .single();
      
      if (profileErr) throw profileErr;

      if (!userProfile.auto_apply_enabled) {
        console.log(`Auto-apply disabled for User: ${user_id}`);
        return null;
      }

      // ─── Check daily limit ───────────────────────────────────────────
      const startOfDay = new Date();
      startOfDay.setUTCHours(0,0,0,0);

      const { data: todayApps, error: todayAppsErr } = await supabase
        .from('applications')
        .select('id')
        .eq('user_id', user_id)
        .eq('status', 'sent')
        .gte('applied_at', startOfDay.toISOString());

      if (todayAppsErr) throw todayAppsErr;

      if (todayApps && todayApps.length >= 20) {
        console.log(`User ${user_id} has reached the daily limit of 20 applications.`);
        await supabase.from('applications').update({ status: 'failed', email_body: 'Failed: Daily limit reached.' }).eq('id', application_id);
        return null;
      }

      // ─── 🔍 Fraud Detection (runs BEFORE sending) ────────────────────
      console.log(`[FraudDetection] Checking job "${jobData.title}" at "${jobData.company}"...`);
      const fraudResult = await FraudDetectionService.checkJob(jobData);

      if (fraudResult.isFraud) {
        console.warn(`[FraudDetection] ❌ BLOCKED fraudulent job. Score: ${fraudResult.fraudScore}. Reasons: ${fraudResult.reasons.join('; ')}`);
        await supabase
          .from('applications')
          .update({
            status: 'blocked_fraud',
            email_body: `FRAUD DETECTED (Score: ${fraudResult.fraudScore}/100)\n\nReasons:\n${fraudResult.reasons.map(r => `• ${r}`).join('\n')}\n\nAI Verdict: ${fraudResult.aiVerdict}\n\nEmail Domain Valid: ${fraudResult.emailDomainValid ? 'Yes' : 'No — domain does not exist'}`,
          })
          .eq('id', application_id);
        return null; // Skip sending entirely
      }

      console.log(`[FraudDetection] ✅ Job passed fraud check. Score: ${fraudResult.fraudScore}/100`);

      await supabase
        .from('applications')
        .update({ status: 'sending' })
        .eq('id', application_id);

      // Send email FROM the user's own Gmail account using their App Password
      await EmailService.sendApplicationEmail(
        jobData.apply_email,
        emailSubject,
        emailBody,
        userProfile.resume_name || userProfile.name || 'Candidate',
        userProfile.resume_email,
        userProfile.smtp_app_password, // user's own Gmail App Password
      );

      const { data: appData, error: appUpdateErr } = await supabase
        .from('applications')
        .update({ status: 'sent', applied_at: new Date().toISOString() })
        .eq('id', application_id)
        .select()
        .single();

      if (appUpdateErr) throw appUpdateErr;

      console.log(`Auto Apply Agent Sent Application ${application_id}`);
      return appData;
    } catch (error) {
      console.error('Auto Apply Agent Failed:', error);
      
      await supabase
        .from('applications')
        .update({ status: 'failed' })
        .eq('id', application_id);

      throw error;
    }
  },
  {
    connection: { url: ENV.REDIS_URL },
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

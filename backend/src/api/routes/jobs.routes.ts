import { Router } from 'express';
import { supabase } from '../../db/supabaseClient';
import { jobFinderQueue } from '../../queues/redisQueue';

export const jobsRouter = Router();

// Get matched jobs for user
jobsRouter.get('/matches/:userId', async (req, res) => {
  const { userId } = req.params;
  
  const { data, error } = await supabase
    .from('job_matches')
    .select('*, jobs(*)')
    .eq('user_id', userId)
    .order('score', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Admin-level trigger to force find jobs
jobsRouter.post('/trigger-finder', async (req, res) => {
  try {
    await jobFinderQueue.add('manual-fetch-jobs', { timestamp: Date.now() });
    res.json({ message: 'Job Finder manually triggered.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

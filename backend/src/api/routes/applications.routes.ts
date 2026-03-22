import { Router } from 'express';
import { supabase } from '../../db/supabaseClient';

export const applicationsRouter = Router();

applicationsRouter.get('/:userId', async (req, res) => {
  const { userId } = req.params;
  
  const { data, error } = await supabase
    .from('applications')
    .select('*, jobs(*)')
    .eq('user_id', userId)
    .order('applied_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

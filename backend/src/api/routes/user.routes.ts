import { Router } from 'express';
import multer from 'multer';
import { supabase } from '../../db/supabaseClient';
import { profileAnalyzerQueue } from '../../queues/redisQueue';
import { ResumeParser } from '../../services/resumeParser';

export const userRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

userRouter.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    if (!req.file) return res.status(400).json({ error: 'No resume provided' });

    // Ensure mock user exists in the `users` table to avoid foreign key violations later
    await supabase.from('users').upsert({ id: userId, name: 'Anonymous Profile', email: `mock_${userId.slice(0,8)}@example.com` }, { onConflict: 'id' });

    const resumeText = await ResumeParser.extractText(req.file.buffer, req.file.mimetype);

    // Queue for Profile Agent
    await profileAnalyzerQueue.add('analyze-profile', { userId, resumeText });

    res.json({ message: 'Resume uploaded and queued for analysis.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

userRouter.get('/:userId/profile', async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase.from('user_profiles').select('*').eq('user_id', userId).single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(200).json(null);
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

userRouter.put('/:userId/profile', async (req, res) => {
  const { userId } = req.params;
  const { 
    country, city, experience_years, skills, preferred_roles,
    resume_name, resume_email, resume_phone, address, education, companies, additional_info
  } = req.body;
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update({ 
      country, city, experience_years, skills, preferred_roles,
      resume_name, resume_email, resume_phone, address, education, companies, additional_info
    })
    .eq('user_id', userId)
    .select();
    
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

userRouter.put('/:userId/preferences', async (req, res) => {
  const { userId } = req.params;
  const { auto_apply_enabled } = req.body;
  const { data, error } = await supabase.from('user_profiles').update({ auto_apply_enabled }).eq('user_id', userId).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

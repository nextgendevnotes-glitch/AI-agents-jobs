import { createClient } from '@supabase/supabase-js';
import { ENV } from '../config/env';

if (!ENV.SUPABASE_URL || !ENV.SUPABASE_KEY) {
  console.warn('Supabase URL or Key is missing from environment variables');
}

export const supabase = createClient(ENV.SUPABASE_URL || 'https://dummy.supabase.co', ENV.SUPABASE_KEY || 'dummy_key');

-- Run this inside your Supabase SQL Editor to support the NEW extended fields & Additional Data!
-- This ensures the backend analyzer queue won't crash when attempting to save the new extracted data.

ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS resume_name TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS resume_email TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS resume_phone TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS companies JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS additional_info TEXT;

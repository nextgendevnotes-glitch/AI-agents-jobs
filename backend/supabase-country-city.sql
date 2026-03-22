-- Run this script in your Supabase SQL Editor to support the new Country and City extraction

-- 1. Add fields to user_profiles table if they don't already exist
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS city TEXT;

-- (Optional) If you want to check your table schema running this confirms it exists
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_profiles';

-- ============================================================
-- Migration: Add missing columns to the jobs table
-- Run this in Supabase SQL Editor
-- ============================================================

-- Job URL (direct link to the posting)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_url TEXT DEFAULT NULL;

-- Salary info (e.g. "₹4-6 LPA", "50,000/month")
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary TEXT DEFAULT NULL;

-- Job type (Full-time, Part-time, Remote, Contract, etc.)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type TEXT DEFAULT NULL;

-- Fraud detection columns
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS fraud_score INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;

-- Verify all columns now exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'jobs'
ORDER BY ordinal_position;

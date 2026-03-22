-- Add fraud tracking columns to the jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS fraud_score INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false;

-- Add blocked_fraud as an allowed status in applications
-- (No enum change needed if status is stored as TEXT)

-- View flagged jobs
SELECT id, title, company, apply_email, fraud_score, is_flagged
FROM jobs 
WHERE is_flagged = true
ORDER BY fraud_score DESC;

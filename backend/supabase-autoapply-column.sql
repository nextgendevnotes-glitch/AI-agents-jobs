-- Add auto_apply_enabled column if it doesn't already exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS auto_apply_enabled BOOLEAN DEFAULT false;

-- Verify
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'auto_apply_enabled';

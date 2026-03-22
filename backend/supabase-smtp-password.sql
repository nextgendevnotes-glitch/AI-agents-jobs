-- Add smtp_app_password column to user_profiles so each user can store their own Gmail App Password
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS smtp_app_password TEXT DEFAULT NULL;

-- Also ensure auto_apply_enabled exists
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS auto_apply_enabled BOOLEAN DEFAULT false;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name IN ('smtp_app_password', 'auto_apply_enabled');

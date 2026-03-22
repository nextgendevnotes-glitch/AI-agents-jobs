-- Supabase SQL to handle Auth triggers securely

-- 1. Create a trigger to automatically add a new user to the public.users table
-- This allows you to securely use auth.users and still join against the public.users table.
-- WARNING: Since the original `users` table expects a `name` which might not come natively, 
-- we will try to extract it from auth metadata, or default it.
-- Make sure the users table has the same id as auth.users for relation.
ALTER TABLE users ADD COLUMN IF NOT EXISTS id uuid PRIMARY KEY DEFAULT uuid_generate_v4();

-- To link the custom `users` table with Supabase Auth:
-- Ensure `id` in `users` can be inserted from auth.users(id). 
-- This assumes the id column is already of type UUID.
-- If you want foreign key constraint:
-- ALTER TABLE users ADD CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE;

-- Function to handle new user insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email
  );
  
  -- Also create the user profile
  INSERT INTO public.user_profiles (user_id)
  VALUES (new.id);
  
  RETURN NEW;
END;
$$;

-- Trigger to call the function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Row Level Security (RLS) on public tables to secure data
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Create policies for user secure access
CREATE POLICY "Users can view own record" ON public.users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own record" ON public.users 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own profile" ON public.user_profiles 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view jobs" ON public.jobs 
  FOR SELECT USING (true); -- Public jobs view

CREATE POLICY "Users can view own job matches" ON public.job_matches 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own applications" ON public.applications 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications" ON public.applications 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

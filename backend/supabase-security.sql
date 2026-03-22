-- Full Security Lockdown: Supabase Row-Level Security (RLS) Policies

-- 1. Enable RLS on all sensitive tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing potentially unsafe or overly permissive policies
DROP POLICY IF EXISTS "Public users can view profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- 3. Strict Policies for User Profiles (Only the logged in user can see/edit their own profile)
CREATE POLICY "Users can fully manage their own profile" 
ON public.user_profiles 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 4. Strict Policies for Users table defaults
CREATE POLICY "Users can fully manage their own core data" 
ON public.users 
FOR ALL 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- 5. Strict Policies for Job Matches
CREATE POLICY "Users can see only their job matches" 
ON public.job_matches 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- 6. Strict Policies for Applications
CREATE POLICY "Users can manage their own job applications" 
ON public.applications 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

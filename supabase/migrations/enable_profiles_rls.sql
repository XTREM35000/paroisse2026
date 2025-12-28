-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON public.profiles;

-- Allow users to insert their own profile
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to select their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Allow public read of public profile information (optional, for user directories)
CREATE POLICY "profiles_select_public" ON public.profiles
FOR SELECT USING (true);

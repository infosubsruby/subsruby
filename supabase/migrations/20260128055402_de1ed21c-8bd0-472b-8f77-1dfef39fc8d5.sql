-- Fix profiles table RLS policies (drop restrictive and recreate as permissive)
DROP POLICY IF EXISTS "Users read own profile" ON profiles;
DROP POLICY IF EXISTS "Admins view all profiles" ON profiles;

-- Create PERMISSIVE policies (default behavior - any matching policy grants access)
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
ON profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Fix feedbacks table RLS policies
DROP POLICY IF EXISTS "Users can view own feedback" ON feedbacks;
DROP POLICY IF EXISTS "Admins can view all feedback" ON feedbacks;

-- Create PERMISSIVE policies for feedbacks
CREATE POLICY "Users can view own feedback"
ON feedbacks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
ON feedbacks FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
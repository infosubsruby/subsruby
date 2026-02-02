-- Fix subscriptions table: recreate policy as PERMISSIVE
DROP POLICY IF EXISTS "Users manage own subscriptions" ON subscriptions;

CREATE POLICY "Users can manage own subscriptions"
ON subscriptions FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix user_roles table: recreate policies as PERMISSIVE
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can read own roles" ON user_roles;

CREATE POLICY "Users can read own roles"
ON user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));
-- Allow any authenticated user to read any profile
-- (needed so post feeds can show author name + avatar)
CREATE POLICY "profiles_select_authenticated"
  ON "public"."profiles"
  FOR SELECT
  TO authenticated
  USING (true);

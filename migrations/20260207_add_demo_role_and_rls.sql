-- =============================================
-- 1. Add 'demo' role to employees check constraint
-- =============================================
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_role_check;
ALTER TABLE public.employees ADD CONSTRAINT employees_role_check CHECK (role IN ('admin', 'employee', 'demo'));

-- =============================================
-- 2. Helper function: check if current user is demo
-- =============================================
CREATE OR REPLACE FUNCTION public.is_demo()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees 
    WHERE auth_user_id = auth.uid() 
    AND role = 'demo'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- 3. Replace FOR ALL policies with separate SELECT / mutation policies
--    Demo users can only SELECT, not INSERT/UPDATE/DELETE
-- =============================================

-- QUALITIES
DROP POLICY IF EXISTS "Authenticated users can access qualities" ON public.qualities;
CREATE POLICY "Authenticated users can read qualities"
  ON public.qualities FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Non-demo users can modify qualities"
  ON public.qualities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND NOT public.is_demo());
CREATE POLICY "Non-demo users can update qualities"
  ON public.qualities FOR UPDATE
  USING (auth.uid() IS NOT NULL AND NOT public.is_demo());
CREATE POLICY "Non-demo users can delete qualities"
  ON public.qualities FOR DELETE
  USING (auth.uid() IS NOT NULL AND NOT public.is_demo());

-- ARTICLES
DROP POLICY IF EXISTS "Authenticated users can access articles" ON public.articles;
CREATE POLICY "Authenticated users can read articles"
  ON public.articles FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Non-demo users can modify articles"
  ON public.articles FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND NOT public.is_demo());
CREATE POLICY "Non-demo users can update articles"
  ON public.articles FOR UPDATE
  USING (auth.uid() IS NOT NULL AND NOT public.is_demo());
CREATE POLICY "Non-demo users can delete articles"
  ON public.articles FOR DELETE
  USING (auth.uid() IS NOT NULL AND NOT public.is_demo());

-- DELIVERIES
DROP POLICY IF EXISTS "Authenticated users can access deliveries" ON public.deliveries;
CREATE POLICY "Authenticated users can read deliveries"
  ON public.deliveries FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Non-demo users can modify deliveries"
  ON public.deliveries FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND NOT public.is_demo());
CREATE POLICY "Non-demo users can update deliveries"
  ON public.deliveries FOR UPDATE
  USING (auth.uid() IS NOT NULL AND NOT public.is_demo());
CREATE POLICY "Non-demo users can delete deliveries"
  ON public.deliveries FOR DELETE
  USING (auth.uid() IS NOT NULL AND NOT public.is_demo());

-- SALES
DROP POLICY IF EXISTS "Authenticated users can access sales" ON public.sales;
CREATE POLICY "Authenticated users can read sales"
  ON public.sales FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Non-demo users can modify sales"
  ON public.sales FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND NOT public.is_demo());
CREATE POLICY "Non-demo users can update sales"
  ON public.sales FOR UPDATE
  USING (auth.uid() IS NOT NULL AND NOT public.is_demo());
CREATE POLICY "Non-demo users can delete sales"
  ON public.sales FOR DELETE
  USING (auth.uid() IS NOT NULL AND NOT public.is_demo());

-- SALE LINES
DROP POLICY IF EXISTS "Authenticated users can access sale_lines" ON public.sale_lines;
CREATE POLICY "Authenticated users can read sale_lines"
  ON public.sale_lines FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Non-demo users can modify sale_lines"
  ON public.sale_lines FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND NOT public.is_demo());
CREATE POLICY "Non-demo users can update sale_lines"
  ON public.sale_lines FOR UPDATE
  USING (auth.uid() IS NOT NULL AND NOT public.is_demo());
CREATE POLICY "Non-demo users can delete sale_lines"
  ON public.sale_lines FOR DELETE
  USING (auth.uid() IS NOT NULL AND NOT public.is_demo());

-- APP SETTINGS
DROP POLICY IF EXISTS "Authenticated users can access app_settings" ON public.app_settings;
CREATE POLICY "Authenticated users can read app_settings"
  ON public.app_settings FOR SELECT
  USING (auth.uid() IS NOT NULL);
CREATE POLICY "Non-demo users can modify app_settings"
  ON public.app_settings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND NOT public.is_demo());
CREATE POLICY "Non-demo users can update app_settings"
  ON public.app_settings FOR UPDATE
  USING (auth.uid() IS NOT NULL AND NOT public.is_demo());
CREATE POLICY "Non-demo users can delete app_settings"
  ON public.app_settings FOR DELETE
  USING (auth.uid() IS NOT NULL AND NOT public.is_demo());

-- =============================================
-- 4. Allow demo user to see employees & permissions (read-only)
-- =============================================
CREATE POLICY "Demo users can view all employees"
  ON public.employees FOR SELECT
  USING (public.is_demo());

CREATE POLICY "Demo users can view all permissions"
  ON public.employee_permissions FOR SELECT
  USING (public.is_demo());


-- =============================================
-- Employees table (linked to Supabase Auth)
-- =============================================
CREATE TABLE IF NOT EXISTS public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE NOT NULL,
  full_name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'employee')),
  is_former boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- Employee permissions table (tab-level access)
-- =============================================
CREATE TABLE IF NOT EXISTS public.employee_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tab_id text NOT NULL CHECK (tab_id IN ('dashboard', 'qualities', 'articles', 'deliveries', 'sales', 'inventory', 'reports', 'settings')),
  can_access boolean NOT NULL DEFAULT false,
  UNIQUE (employee_id, tab_id)
);

-- =============================================
-- Helper function: get current user's role
-- =============================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.employees WHERE auth_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- Helper function: check if current user is admin
-- =============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees 
    WHERE auth_user_id = auth.uid() 
    AND role = 'admin' 
    AND is_former = false
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- Enable RLS on new tables
-- =============================================
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS policies for employees table
-- =============================================

-- Admins can see all employees
CREATE POLICY "Admins can view all employees"
  ON public.employees FOR SELECT
  USING (public.is_admin());

-- Non-admin employees can see their own record
CREATE POLICY "Employees can view own record"
  ON public.employees FOR SELECT
  USING (auth_user_id = auth.uid());

-- Only admins can insert employees
CREATE POLICY "Admins can insert employees"
  ON public.employees FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can update employees
CREATE POLICY "Admins can update employees"
  ON public.employees FOR UPDATE
  USING (public.is_admin());

-- Only admins can delete employees
CREATE POLICY "Admins can delete employees"
  ON public.employees FOR DELETE
  USING (public.is_admin());

-- =============================================
-- RLS policies for employee_permissions table
-- =============================================

-- Admins can manage all permissions
CREATE POLICY "Admins can view all permissions"
  ON public.employee_permissions FOR SELECT
  USING (public.is_admin());

-- Employees can see their own permissions
CREATE POLICY "Employees can view own permissions"
  ON public.employee_permissions FOR SELECT
  USING (employee_id IN (
    SELECT id FROM public.employees WHERE auth_user_id = auth.uid()
  ));

-- Only admins can insert permissions
CREATE POLICY "Admins can insert permissions"
  ON public.employee_permissions FOR INSERT
  WITH CHECK (public.is_admin());

-- Only admins can update permissions
CREATE POLICY "Admins can update permissions"
  ON public.employee_permissions FOR UPDATE
  USING (public.is_admin());

-- Only admins can delete permissions
CREATE POLICY "Admins can delete permissions"
  ON public.employee_permissions FOR DELETE
  USING (public.is_admin());

-- =============================================
-- Updated RLS for existing tables (auth required)
-- =============================================

-- Drop old open policies
DROP POLICY IF EXISTS "Allow all access to qualities" ON public.qualities;
DROP POLICY IF EXISTS "Allow all access to articles" ON public.articles;
DROP POLICY IF EXISTS "Allow all access to deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Allow all access to sales" ON public.sales;
DROP POLICY IF EXISTS "Allow all access to sale_lines" ON public.sale_lines;
DROP POLICY IF EXISTS "Allow all access to app_settings" ON public.app_settings;

-- New policies requiring authentication
CREATE POLICY "Authenticated users can access qualities"
  ON public.qualities FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access articles"
  ON public.articles FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access deliveries"
  ON public.deliveries FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access sales"
  ON public.sales FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access sale_lines"
  ON public.sale_lines FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can access app_settings"
  ON public.app_settings FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================
-- Auto-update updated_at trigger for employees
-- =============================================
CREATE OR REPLACE FUNCTION public.update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_employees_updated_at();

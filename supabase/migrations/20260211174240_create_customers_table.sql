-- =============================================
-- Create customers table
-- =============================================
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  barcode text UNIQUE,
  phone text,
  email text,
  address text,
  notes text,
  gdpr_consent boolean NOT NULL DEFAULT false,
  company_name text,
  company_address text,
  tax_number text,
  bulstat text,
  mol_name text,
  recipient_name text,
  recipient_egn text,
  vat_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================
-- Add 'customers' to employee_permissions tab_id constraint
-- =============================================

-- Drop existing constraint
ALTER TABLE public.employee_permissions 
  DROP CONSTRAINT IF EXISTS employee_permissions_tab_id_check;

-- Add new constraint with 'customers' included
ALTER TABLE public.employee_permissions
  ADD CONSTRAINT employee_permissions_tab_id_check 
  CHECK (tab_id IN ('dashboard', 'qualities', 'articles', 'deliveries', 'sales', 'customers', 'inventory', 'reports', 'statistics', 'settings'));

-- =============================================
-- Enable RLS on customers table
-- =============================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS policies for customers table
-- =============================================

-- Admins can do everything
CREATE POLICY "Admins can view all customers"
  ON public.customers FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert customers"
  ON public.customers FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update customers"
  ON public.customers FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete customers"
  ON public.customers FOR DELETE
  USING (public.is_admin());

-- Employees with 'customers' permission can view, insert, and update
CREATE POLICY "Employees with customers permission can view"
  ON public.customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.employee_permissions ep
      JOIN public.employees e ON e.id = ep.employee_id
      WHERE e.auth_user_id = auth.uid()
      AND e.is_former = false
      AND ep.tab_id = 'customers'
      AND ep.can_access = true
    )
  );

CREATE POLICY "Employees with customers permission can insert"
  ON public.customers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.employee_permissions ep
      JOIN public.employees e ON e.id = ep.employee_id
      WHERE e.auth_user_id = auth.uid()
      AND e.is_former = false
      AND ep.tab_id = 'customers'
      AND ep.can_access = true
    )
  );

CREATE POLICY "Employees with customers permission can update"
  ON public.customers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.employee_permissions ep
      JOIN public.employees e ON e.id = ep.employee_id
      WHERE e.auth_user_id = auth.uid()
      AND e.is_former = false
      AND ep.tab_id = 'customers'
      AND ep.can_access = true
    )
  );

-- Demo role can only view
CREATE POLICY "Demo role can view customers"
  ON public.customers FOR SELECT
  USING (public.is_demo());

-- =============================================
-- Create index for faster lookups
-- =============================================
CREATE INDEX IF NOT EXISTS idx_customers_barcode ON public.customers(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON public.customers(created_at);

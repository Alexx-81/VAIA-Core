-- =============================================
-- Add 'loyalty' to employee_permissions tab_id constraint
-- =============================================

-- Drop existing constraint
ALTER TABLE public.employee_permissions 
  DROP CONSTRAINT IF EXISTS employee_permissions_tab_id_check;

-- Add new constraint with 'loyalty' included
ALTER TABLE public.employee_permissions
  ADD CONSTRAINT employee_permissions_tab_id_check 
  CHECK (tab_id IN ('dashboard', 'qualities', 'articles', 'deliveries', 'sales', 'customers', 'loyalty', 'inventory', 'reports', 'statistics', 'settings'));

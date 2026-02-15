-- =============================================
-- Restrict DELETE operations to admin users only
-- =============================================

-- QUALITIES
DROP POLICY IF EXISTS "Non-demo users can delete qualities" ON public.qualities;
CREATE POLICY "Only admins can delete qualities"
  ON public.qualities FOR DELETE
  USING (public.is_admin());

-- ARTICLES
DROP POLICY IF EXISTS "Non-demo users can delete articles" ON public.articles;
CREATE POLICY "Only admins can delete articles"
  ON public.articles FOR DELETE
  USING (public.is_admin());

-- DELIVERIES
DROP POLICY IF EXISTS "Non-demo users can delete deliveries" ON public.deliveries;
CREATE POLICY "Only admins can delete deliveries"
  ON public.deliveries FOR DELETE
  USING (public.is_admin());

-- SALES
DROP POLICY IF EXISTS "Non-demo users can delete sales" ON public.sales;
CREATE POLICY "Only admins can delete sales"
  ON public.sales FOR DELETE
  USING (public.is_admin());

-- SALE LINES
DROP POLICY IF EXISTS "Non-demo users can delete sale_lines" ON public.sale_lines;
CREATE POLICY "Only admins can delete sale_lines"
  ON public.sale_lines FOR DELETE
  USING (public.is_admin());

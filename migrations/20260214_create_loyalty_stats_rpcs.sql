-- ============================================
-- Loyalty Statistics RPC Functions
-- Created: 2026-02-14
-- Purpose: Analytics functions for loyalty program reporting
-- ============================================

-- ============================================
-- 1. Разпределение на клиенти по нива
-- ============================================
CREATE OR REPLACE FUNCTION get_loyalty_tier_distribution()
RETURNS TABLE (
  tier_id INTEGER,
  tier_name TEXT,
  tier_color TEXT,
  customer_count BIGINT,
  avg_turnover_12m_eur NUMERIC,
  total_turnover_12m_eur NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH tier_stats AS (
    SELECT
      cls.current_tier_id,
      COUNT(DISTINCT cls.customer_id) AS customer_count,
      AVG(cls.turnover_12m_eur) AS avg_turnover,
      SUM(cls.turnover_12m_eur) AS total_turnover
    FROM customer_loyalty_status cls
    GROUP BY cls.current_tier_id
  )
  SELECT
    ts.current_tier_id AS tier_id,
    COALESCE(lt.name, 'Без ниво') AS tier_name,
    COALESCE(lt.color, '#999999') AS tier_color,
    ts.customer_count,
    ROUND(ts.avg_turnover, 2) AS avg_turnover_12m_eur,
    ROUND(ts.total_turnover, 2) AS total_turnover_12m_eur
  FROM tier_stats ts
  LEFT JOIN loyalty_tiers lt ON lt.id = ts.current_tier_id
  ORDER BY COALESCE(lt.sort_order, 999), ts.current_tier_id NULLS FIRST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_loyalty_tier_distribution IS 'Връща разпределението на клиенти по лоялност нива с оборот';

-- ============================================
-- 2. Ваучери по месец
-- ============================================
CREATE OR REPLACE FUNCTION get_loyalty_vouchers_by_month(
  date_from DATE,
  date_to DATE
)
RETURNS TABLE (
  month TEXT,
  issued_count BIGINT,
  issued_amount_eur NUMERIC,
  redeemed_count BIGINT,
  redeemed_amount_eur NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH months AS (
    SELECT generate_series(
      DATE_TRUNC('month', date_from),
      DATE_TRUNC('month', date_to),
      '1 month'::INTERVAL
    )::DATE AS month_date
  ),
  issued_stats AS (
    SELECT
      DATE_TRUNC('month', cv.issued_at)::DATE AS month_date,
      COUNT(*) AS issued_count,
      SUM(cv.amount_eur) AS issued_amount
    FROM customer_vouchers cv
    WHERE cv.issued_at >= date_from AND cv.issued_at <= date_to
    GROUP BY DATE_TRUNC('month', cv.issued_at)::DATE
  ),
  redeemed_stats AS (
    SELECT
      DATE_TRUNC('month', cv.redeemed_at)::DATE AS month_date,
      COUNT(*) AS redeemed_count,
      SUM(cv.amount_eur) AS redeemed_amount
    FROM customer_vouchers cv
    WHERE cv.status = 'redeemed' 
      AND cv.redeemed_at IS NOT NULL
      AND cv.redeemed_at >= date_from 
      AND cv.redeemed_at <= date_to
    GROUP BY DATE_TRUNC('month', cv.redeemed_at)::DATE
  )
  SELECT
    TO_CHAR(m.month_date, 'YYYY-MM') AS month,
    COALESCE(i.issued_count, 0) AS issued_count,
    ROUND(COALESCE(i.issued_amount, 0), 2) AS issued_amount_eur,
    COALESCE(r.redeemed_count, 0) AS redeemed_count,
    ROUND(COALESCE(r.redeemed_amount, 0), 2) AS redeemed_amount_eur
  FROM months m
  LEFT JOIN issued_stats i ON i.month_date = m.month_date
  LEFT JOIN redeemed_stats r ON r.month_date = m.month_date
  ORDER BY m.month_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_loyalty_vouchers_by_month IS 'Връща статистика за издадени и изплатени ваучери по месец';

-- ============================================
-- 3. ROI метрики на лоялност програмата
-- ============================================
CREATE OR REPLACE FUNCTION get_loyalty_roi_stats(
  date_from DATE,
  date_to DATE
)
RETURNS TABLE (
  total_tier_discounts_eur NUMERIC,
  total_voucher_discounts_eur NUMERIC,
  total_discounts_eur NUMERIC,
  customers_with_loyalty INTEGER,
  total_customers INTEGER,
  loyalty_participation_rate NUMERIC,
  avg_discount_per_sale_eur NUMERIC,
  sales_with_loyalty_count BIGINT,
  total_sales_count BIGINT
) AS $$
DECLARE
  v_total_tier_discounts NUMERIC;
  v_total_voucher_discounts NUMERIC;
  v_customers_with_loyalty INTEGER;
  v_total_customers INTEGER;
  v_sales_with_loyalty_count BIGINT;
  v_total_sales_count BIGINT;
BEGIN
  -- Общо tier отстъпки
  SELECT COALESCE(SUM(s.tier_discount_amount_eur), 0)
  INTO v_total_tier_discounts
  FROM sales s
  WHERE s.status = 'finalized'
    AND s.date_time >= date_from 
    AND s.date_time <= date_to + INTERVAL '1 day'
    AND s.loyalty_mode = 'tier';

  -- Общо voucher отстъпки
  SELECT COALESCE(SUM(s.voucher_amount_applied_eur), 0)
  INTO v_total_voucher_discounts
  FROM sales s
  WHERE s.status = 'finalized'
    AND s.date_time >= date_from 
    AND s.date_time <= date_to + INTERVAL '1 day'
    AND s.loyalty_mode = 'voucher';

  -- Брой клиенти с loyalty активност (имат ниво или ваучери)
  SELECT COUNT(DISTINCT cls.customer_id)
  INTO v_customers_with_loyalty
  FROM customer_loyalty_status cls
  WHERE cls.current_tier_id IS NOT NULL OR cls.turnover_12m_eur > 0;

  -- Общо клиенти
  SELECT COUNT(*) INTO v_total_customers FROM customers;

  -- Брой продажби с loyalty
  SELECT COUNT(*)
  INTO v_sales_with_loyalty_count
  FROM sales s
  WHERE s.status = 'finalized'
    AND s.date_time >= date_from 
    AND s.date_time <= date_to + INTERVAL '1 day'
    AND s.loyalty_mode IN ('tier', 'voucher');

  -- Общо продажби
  SELECT COUNT(*)
  INTO v_total_sales_count
  FROM sales s
  WHERE s.status = 'finalized'
    AND s.date_time >= date_from 
    AND s.date_time <= date_to + INTERVAL '1 day';

  RETURN QUERY
  SELECT
    ROUND(v_total_tier_discounts, 2) AS total_tier_discounts_eur,
    ROUND(v_total_voucher_discounts, 2) AS total_voucher_discounts_eur,
    ROUND(v_total_tier_discounts + v_total_voucher_discounts, 2) AS total_discounts_eur,
    v_customers_with_loyalty AS customers_with_loyalty,
    v_total_customers AS total_customers,
    CASE 
      WHEN v_total_customers > 0 THEN ROUND((v_customers_with_loyalty::NUMERIC / v_total_customers) * 100, 2)
      ELSE 0
    END AS loyalty_participation_rate,
    CASE
      WHEN v_sales_with_loyalty_count > 0 THEN ROUND((v_total_tier_discounts + v_total_voucher_discounts) / v_sales_with_loyalty_count, 2)
      ELSE 0
    END AS avg_discount_per_sale_eur,
    v_sales_with_loyalty_count AS sales_with_loyalty_count,
    v_total_sales_count AS total_sales_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_loyalty_roi_stats IS 'Връща ROI метрики на лоялност програмата за даден период';

-- ============================================
-- 4. Топ клиенти по лоялност активност
-- ============================================
CREATE OR REPLACE FUNCTION get_loyalty_top_customers(
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  customer_id UUID,
  customer_name TEXT,
  current_tier_id INTEGER,
  current_tier_name TEXT,
  turnover_12m_eur NUMERIC,
  tier_discount_total_eur NUMERIC,
  voucher_discount_total_eur NUMERIC,
  total_vouchers_issued INTEGER,
  total_vouchers_redeemed INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH customer_discounts AS (
    SELECT
      s.customer_id,
      SUM(CASE WHEN s.loyalty_mode = 'tier' THEN s.tier_discount_amount_eur ELSE 0 END) AS tier_discount_total,
      SUM(CASE WHEN s.loyalty_mode = 'voucher' THEN s.voucher_amount_applied_eur ELSE 0 END) AS voucher_discount_total
    FROM sales s
    WHERE s.status = 'finalized' AND s.customer_id IS NOT NULL
    GROUP BY s.customer_id
  ),
  customer_vouchers_stats AS (
    SELECT
      cv.customer_id,
      COUNT(*) AS vouchers_issued,
      SUM(CASE WHEN cv.status = 'redeemed' THEN 1 ELSE 0 END) AS vouchers_redeemed
    FROM customer_vouchers cv
    GROUP BY cv.customer_id
  )
  SELECT
    c.id AS customer_id,
    c.name AS customer_name,
    cls.current_tier_id,
    COALESCE(lt.name, 'Без ниво') AS current_tier_name,
    ROUND(COALESCE(cls.turnover_12m_eur, 0), 2) AS turnover_12m_eur,
    ROUND(COALESCE(cd.tier_discount_total, 0), 2) AS tier_discount_total_eur,
    ROUND(COALESCE(cd.voucher_discount_total, 0), 2) AS voucher_discount_total_eur,
    COALESCE(cvs.vouchers_issued, 0)::INTEGER AS total_vouchers_issued,
    COALESCE(cvs.vouchers_redeemed, 0)::INTEGER AS total_vouchers_redeemed
  FROM customers c
  LEFT JOIN customer_loyalty_status cls ON cls.customer_id = c.id
  LEFT JOIN loyalty_tiers lt ON lt.id = cls.current_tier_id
  LEFT JOIN customer_discounts cd ON cd.customer_id = c.id
  LEFT JOIN customer_vouchers_stats cvs ON cvs.customer_id = c.id
  WHERE cls.turnover_12m_eur > 0 OR cd.tier_discount_total > 0 OR cd.voucher_discount_total > 0
  ORDER BY cls.turnover_12m_eur DESC NULLS LAST
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_loyalty_top_customers IS 'Връща топ клиенти по лоялност активност (оборот, отстъпки, ваучери)';

-- ============================================
-- Permissions
-- ============================================
-- All authenticated users can call these functions
GRANT EXECUTE ON FUNCTION get_loyalty_tier_distribution() TO authenticated;
GRANT EXECUTE ON FUNCTION get_loyalty_vouchers_by_month(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_loyalty_roi_stats(DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_loyalty_top_customers(INTEGER) TO authenticated;

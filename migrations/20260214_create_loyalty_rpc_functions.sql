-- =============================================
-- Loyalty Program: RPC Functions
-- =============================================

-- 1. Ensure customer has a loyalty status record
CREATE OR REPLACE FUNCTION public.ensure_customer_loyalty_status(p_customer_id UUID)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_status_id UUID;
  v_start_tier_id INTEGER;
BEGIN
  -- Get the START tier id
  SELECT id INTO v_start_tier_id FROM loyalty_tiers WHERE sort_order = 0 LIMIT 1;
  IF v_start_tier_id IS NULL THEN
    RAISE EXCEPTION 'No START tier found (sort_order=0)';
  END IF;

  -- Insert or return existing
  INSERT INTO customer_loyalty_status (customer_id, current_tier_id)
  VALUES (p_customer_id, v_start_tier_id)
  ON CONFLICT (customer_id) DO NOTHING
  RETURNING id INTO v_status_id;

  -- If already existed, fetch it
  IF v_status_id IS NULL THEN
    SELECT id INTO v_status_id FROM customer_loyalty_status WHERE customer_id = p_customer_id;
  END IF;

  RETURN v_status_id;
END;
$$;

-- 2. Get full loyalty info for a customer
CREATE OR REPLACE FUNCTION public.get_customer_loyalty_info(p_customer_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_result JSONB;
  v_status RECORD;
  v_tier RECORD;
  v_vouchers JSONB;
  v_turnover NUMERIC(10,2);
BEGIN
  -- Ensure loyalty status exists
  PERFORM ensure_customer_loyalty_status(p_customer_id);

  -- Get status
  SELECT cls.*, lt.name as tier_name, lt.discount_percent, lt.sort_order, lt.min_turnover_12m_eur
  INTO v_status
  FROM customer_loyalty_status cls
  JOIN loyalty_tiers lt ON lt.id = cls.current_tier_id
  WHERE cls.customer_id = p_customer_id;

  -- Get active vouchers (issued and not expired)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', cv.id,
    'amount_eur', cv.amount_eur,
    'min_purchase_eur', cv.min_purchase_eur,
    'status', cv.status::text,
    'issued_at', cv.issued_at,
    'expires_at', cv.expires_at,
    'rule_id', cv.rule_id
  ) ORDER BY cv.expires_at), '[]'::jsonb)
  INTO v_vouchers
  FROM customer_vouchers cv
  WHERE cv.customer_id = p_customer_id
    AND cv.status = 'issued'
    AND cv.expires_at >= NOW();

  -- Build result
  v_result := jsonb_build_object(
    'customer_id', p_customer_id,
    'tier_id', v_status.current_tier_id,
    'tier_name', v_status.tier_name,
    'tier_sort_order', v_status.sort_order,
    'discount_percent', v_status.discount_percent,
    'min_turnover_12m_eur', v_status.min_turnover_12m_eur,
    'turnover_12m_eur', v_status.turnover_12m_eur,
    'tier_reached_at', v_status.tier_reached_at,
    'tier_locked_until', v_status.tier_locked_until,
    'last_recalc_at', v_status.last_recalc_at,
    'active_vouchers', v_vouchers
  );

  RETURN v_result;
END;
$$;

-- 3. Process loyalty after sale finalization (atomic)
CREATE OR REPLACE FUNCTION public.process_loyalty_after_sale(p_sale_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_sale RECORD;
  v_customer_id UUID;
  v_total_paid NUMERIC(10,2);
  v_turnover_12m NUMERIC(10,2);
  v_current_status RECORD;
  v_best_tier RECORD;
  v_tier_changed BOOLEAN := false;
  v_new_tier_name TEXT;
  v_issued_vouchers JSONB := '[]'::jsonb;
  v_rule RECORD;
  v_cycle_key TEXT;
  v_voucher_id UUID;
BEGIN
  -- 1. Get sale info
  SELECT s.customer_id, s.total_paid_eur, s.loyalty_mode
  INTO v_sale
  FROM sales s
  WHERE s.id = p_sale_id AND s.status = 'finalized';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Sale not found or not finalized');
  END IF;

  v_customer_id := v_sale.customer_id;
  v_total_paid := v_sale.total_paid_eur;

  IF v_customer_id IS NULL THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'No customer linked');
  END IF;

  IF v_total_paid IS NULL OR v_total_paid <= 0 THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'No amount to record');
  END IF;

  -- 2. Ensure loyalty status exists
  PERFORM ensure_customer_loyalty_status(v_customer_id);

  -- 3. Record in ledger
  INSERT INTO loyalty_ledger (customer_id, sale_id, entry_type, amount_eur, posted_at)
  VALUES (v_customer_id, p_sale_id, 'sale', v_total_paid, NOW());

  -- 4. Calculate 12-month turnover
  SELECT COALESCE(SUM(amount_eur), 0) INTO v_turnover_12m
  FROM loyalty_ledger
  WHERE customer_id = v_customer_id
    AND posted_at >= NOW() - INTERVAL '12 months';

  -- 5. Update turnover in status
  UPDATE customer_loyalty_status
  SET turnover_12m_eur = v_turnover_12m, last_recalc_at = NOW()
  WHERE customer_id = v_customer_id;

  -- 6. Get current status
  SELECT cls.*, lt.sort_order as current_sort_order
  INTO v_current_status
  FROM customer_loyalty_status cls
  JOIN loyalty_tiers lt ON lt.id = cls.current_tier_id
  WHERE cls.customer_id = v_customer_id;

  -- 7. Find best matching tier
  SELECT * INTO v_best_tier
  FROM loyalty_tiers
  WHERE is_active = true AND min_turnover_12m_eur <= v_turnover_12m
  ORDER BY sort_order DESC
  LIMIT 1;

  -- 8. Tier upgrade: always immediate
  IF v_best_tier.sort_order > v_current_status.current_sort_order THEN
    UPDATE customer_loyalty_status
    SET current_tier_id = v_best_tier.id,
        tier_reached_at = NOW(),
        tier_locked_until = NOW() + INTERVAL '12 months'
    WHERE customer_id = v_customer_id;
    v_tier_changed := true;
    v_new_tier_name := v_best_tier.name;
  -- Tier downgrade: only if lock expired
  ELSIF v_best_tier.sort_order < v_current_status.current_sort_order 
        AND v_current_status.tier_locked_until <= NOW() THEN
    UPDATE customer_loyalty_status
    SET current_tier_id = v_best_tier.id,
        tier_reached_at = NOW(),
        tier_locked_until = NOW() + INTERVAL '12 months'
    WHERE customer_id = v_customer_id;
    v_tier_changed := true;
    v_new_tier_name := v_best_tier.name;
  END IF;

  -- 9. Issue vouchers for reached thresholds
  v_cycle_key := COALESCE(v_current_status.tier_reached_at::date::text, NOW()::date::text);

  FOR v_rule IN
    SELECT * FROM voucher_rules WHERE is_active = true AND trigger_turnover_12m_eur <= v_turnover_12m
    ORDER BY trigger_turnover_12m_eur
  LOOP
    -- Check if already issued for this cycle
    IF NOT EXISTS (
      SELECT 1 FROM customer_vouchers
      WHERE customer_id = v_customer_id AND rule_id = v_rule.id AND cycle_key = v_cycle_key
    ) THEN
      INSERT INTO customer_vouchers (
        customer_id, rule_id, amount_eur, min_purchase_eur, 
        status, issued_at, expires_at, created_from_sale_id, cycle_key
      ) VALUES (
        v_customer_id, v_rule.id, v_rule.voucher_amount_eur, v_rule.min_purchase_eur,
        'issued', NOW(), NOW() + (v_rule.valid_days || ' days')::interval, p_sale_id, v_cycle_key
      )
      RETURNING id INTO v_voucher_id;

      v_issued_vouchers := v_issued_vouchers || jsonb_build_object(
        'voucher_id', v_voucher_id,
        'amount_eur', v_rule.voucher_amount_eur,
        'rule_trigger', v_rule.trigger_turnover_12m_eur
      );
    END IF;
  END LOOP;

  -- 10. Return summary
  RETURN jsonb_build_object(
    'customer_id', v_customer_id,
    'sale_id', p_sale_id,
    'amount_recorded', v_total_paid,
    'turnover_12m', v_turnover_12m,
    'tier_changed', v_tier_changed,
    'new_tier', COALESCE(v_new_tier_name, v_best_tier.name),
    'issued_vouchers', v_issued_vouchers
  );
END;
$$;

-- 4. Redeem a voucher
CREATE OR REPLACE FUNCTION public.redeem_voucher(p_voucher_id UUID, p_sale_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE customer_vouchers
  SET status = 'redeemed',
      redeemed_at = NOW(),
      redeemed_sale_id = p_sale_id
  WHERE id = p_voucher_id
    AND status = 'issued'
    AND expires_at >= NOW();

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$;

-- 5. Expire overdue vouchers
CREATE OR REPLACE FUNCTION public.expire_vouchers()
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE customer_vouchers
  SET status = 'expired'
  WHERE status = 'issued' AND expires_at < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

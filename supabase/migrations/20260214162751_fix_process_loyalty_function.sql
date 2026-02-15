-- =============================================
-- Fix: Correct process_loyalty_after_sale function (total_paid_eur instead of total_eur)
-- =============================================

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
  -- 1. Get sale info (FIXED: използваме total_paid_eur вместо total_eur)
  SELECT s.customer_id, s.total_paid_eur
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

  -- 3. Record in ledger (skip if already exists to make idempotent)
  IF NOT EXISTS (SELECT 1 FROM loyalty_ledger WHERE sale_id = p_sale_id) THEN
    INSERT INTO loyalty_ledger (customer_id, sale_id, entry_type, amount_eur, posted_at)
    VALUES (v_customer_id, p_sale_id, 'sale', v_total_paid, NOW());
  END IF;

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

-- =============================================
-- Function to reprocess all sales retroactively
-- =============================================

CREATE OR REPLACE FUNCTION public.reprocess_all_sales_for_loyalty()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_sale RECORD;
  v_processed INTEGER := 0;
  v_errors INTEGER := 0;
  v_result JSONB;
BEGIN
  -- Loop through all finalized sales with a customer
  FOR v_sale IN
    SELECT s.id, s.customer_id, s.total_paid_eur, s.sale_number
    FROM sales s
    WHERE s.status = 'finalized'
      AND s.customer_id IS NOT NULL
      AND s.total_paid_eur > 0
    ORDER BY s.date_time ASC
  LOOP
    BEGIN
      -- Check if already processed
      IF NOT EXISTS (
        SELECT 1 FROM loyalty_ledger WHERE sale_id = v_sale.id
      ) THEN
        -- Process this sale
        SELECT process_loyalty_after_sale(v_sale.id) INTO v_result;
        v_processed := v_processed + 1;
        
        RAISE NOTICE 'Processed sale %: %', v_sale.sale_number, v_result;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors + 1;
      RAISE NOTICE 'Error processing sale %: %', v_sale.sale_number, SQLERRM;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'completed',
    'processed', v_processed,
    'errors', v_errors
  );
END;
$$;

COMMENT ON FUNCTION public.process_loyalty_after_sale IS 'Обработва продажба за лоялност система - записва в ledger, актуализира turnover, повишава tier, издава ваучери';
COMMENT ON FUNCTION public.reprocess_all_sales_for_loyalty IS 'Ретроактивно обработва всички необработени продажби';

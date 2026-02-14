-- =============================================
-- Fix: Issue missing vouchers for eligible customers
-- =============================================

-- 1. Ensure voucher_rules exist (idempotent)
INSERT INTO public.voucher_rules (trigger_turnover_12m_eur, voucher_amount_eur, valid_days, min_purchase_eur, is_active)
VALUES
  (150.00,  5.00, 30, 20.00, true),
  (300.00, 10.00, 30, 35.00, true)
ON CONFLICT DO NOTHING;

-- 2. Function to issue missing vouchers retroactively
CREATE OR REPLACE FUNCTION public.issue_missing_vouchers_retroactively()
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_customer RECORD;
  v_rule RECORD;
  v_cycle_key TEXT;
  v_issued_count INTEGER := 0;
  v_voucher_id UUID;
BEGIN
  -- Loop through all customers with loyalty status
  FOR v_customer IN
    SELECT cls.customer_id, cls.turnover_12m_eur, cls.tier_reached_at
    FROM customer_loyalty_status cls
    WHERE cls.turnover_12m_eur > 0
  LOOP
    v_cycle_key := COALESCE(v_customer.tier_reached_at::date::text, NOW()::date::text);

    -- For each active voucher rule
    FOR v_rule IN
      SELECT * FROM voucher_rules
      WHERE is_active = true AND trigger_turnover_12m_eur <= v_customer.turnover_12m_eur
      ORDER BY trigger_turnover_12m_eur
    LOOP
      -- Check if voucher already issued for this cycle
      IF NOT EXISTS (
        SELECT 1 FROM customer_vouchers
        WHERE customer_id = v_customer.customer_id
          AND rule_id = v_rule.id
          AND cycle_key = v_cycle_key
      ) THEN
        -- Issue voucher
        INSERT INTO customer_vouchers (
          customer_id, rule_id, amount_eur, min_purchase_eur,
          status, issued_at, expires_at, cycle_key, created_from_sale_id
        ) VALUES (
          v_customer.customer_id,
          v_rule.id,
          v_rule.voucher_amount_eur,
          v_rule.min_purchase_eur,
          'issued',
          NOW(),
          NOW() + (v_rule.valid_days || ' days')::interval,
          v_cycle_key,
          NULL  -- NULL because it's retroactive
        )
        RETURNING id INTO v_voucher_id;

        v_issued_count := v_issued_count + 1;

        RAISE NOTICE 'Issued voucher % (€%) to customer % (turnover: €%)',
          v_voucher_id, v_rule.voucher_amount_eur, v_customer.customer_id, v_customer.turnover_12m_eur;
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'completed',
    'vouchers_issued', v_issued_count
  );
END;
$$;

-- 3. Execute the retroactive issuance
SELECT public.issue_missing_vouchers_retroactively();

COMMENT ON FUNCTION public.issue_missing_vouchers_retroactively IS 'Издава липсващи ваучери за клиенти които вече са достигнали прага';

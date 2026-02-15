-- Fix: Update finalize_sale функцията да изплаща ваучери и да обработва лоялност
-- Date: 2026-02-15
-- Description: Добавяне на извикване към redeem_voucher и process_loyalty_after_sale при финализация

CREATE OR REPLACE FUNCTION finalize_sale(p_sale_id UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_voucher_id UUID;
  v_customer_id UUID;
  v_voucher_redeemed BOOLEAN;
  v_loyalty_result JSONB;
BEGIN
  -- 1. Update sale_lines snapshots (original functionality)
  UPDATE sale_lines sl
  SET 
    kg_per_piece_snapshot = a.grams_per_piece::NUMERIC / 1000,
    unit_cost_per_kg_real_snapshot = rd.unit_cost_per_kg,
    unit_cost_per_kg_acc_snapshot = COALESCE(ad.unit_cost_per_kg, rd.unit_cost_per_kg)
  FROM articles a
  JOIN deliveries rd ON rd.id = sl.real_delivery_id
  LEFT JOIN deliveries ad ON ad.id = sl.accounting_delivery_id
  WHERE sl.sale_id = p_sale_id
    AND sl.article_id = a.id;
  
  -- 2. Get voucher_id and customer_id from sale
  SELECT voucher_id, customer_id 
  INTO v_voucher_id, v_customer_id
  FROM sales
  WHERE id = p_sale_id;

  -- 3. Redeem voucher if voucher_id exists
  IF v_voucher_id IS NOT NULL THEN
    SELECT redeem_voucher(v_voucher_id, p_sale_id) INTO v_voucher_redeemed;
    
    -- Log if voucher redemption failed
    IF NOT v_voucher_redeemed THEN
      RAISE WARNING 'Failed to redeem voucher % for sale %', v_voucher_id, p_sale_id;
    END IF;
  END IF;

  -- 4. Update sale status to finalized
  UPDATE sales
  SET status = 'finalized', finalized_at = NOW()
  WHERE id = p_sale_id;

  -- 5. Process loyalty if customer exists and has barcode
  IF v_customer_id IS NOT NULL THEN
    -- Check if customer has barcode (only barcode customers are in loyalty program)
    IF EXISTS (SELECT 1 FROM customers WHERE id = v_customer_id AND barcode IS NOT NULL) THEN
      SELECT process_loyalty_after_sale(p_sale_id) INTO v_loyalty_result;
      
      -- Log if loyalty processing failed
      IF v_loyalty_result->>'success' = 'false' THEN
        RAISE WARNING 'Failed to process loyalty for sale %: %', p_sale_id, v_loyalty_result->>'reason';
      END IF;
    END IF;
  END IF;

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION finalize_sale IS 'Финализира продажба: snapshot на sale_lines, изплаща ваучер ако има, обработва лоялност';

-- Reprocess existing finalized sale that has voucher but not redeemed
DO $$
DECLARE
  v_sale_record RECORD;
  v_redeemed BOOLEAN;
BEGIN
  FOR v_sale_record IN 
    SELECT s.id, s.voucher_id
    FROM sales s
    JOIN customer_vouchers cv ON cv.id = s.voucher_id
    WHERE s.status = 'finalized'
      AND s.voucher_id IS NOT NULL
      AND cv.status = 'issued' -- Voucher was not redeemed
      AND cv.redeemed_at IS NULL
  LOOP
    -- Redeem the voucher
    SELECT redeem_voucher(v_sale_record.voucher_id, v_sale_record.id) INTO v_redeemed;
    
    IF v_redeemed THEN
      RAISE NOTICE 'Redeemed voucher % for sale %', v_sale_record.voucher_id, v_sale_record.id;
    ELSE
      RAISE WARNING 'Failed to redeem voucher % for sale %', v_sale_record.voucher_id, v_sale_record.id;
    END IF;
  END LOOP;
END $$;

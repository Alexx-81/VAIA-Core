-- =============================================
-- Автоматично управление на програмата за лоялност
-- Клиенти участват в програмата само ако имат баркод
-- =============================================

-- Функция за автоматично управление на loyalty status при промени в customers
CREATE OR REPLACE FUNCTION public.auto_manage_customer_loyalty()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_start_tier_id INTEGER;
BEGIN
  -- Намираме START tier (sort_order = 0)
  SELECT id INTO v_start_tier_id FROM loyalty_tiers WHERE sort_order = 0 LIMIT 1;
  
  IF v_start_tier_id IS NULL THEN
    RAISE WARNING 'No START tier found (sort_order=0), cannot manage loyalty status';
    RETURN NEW;
  END IF;

  -- При INSERT
  IF (TG_OP = 'INSERT') THEN
    -- Ако новият клиент има баркод → създай loyalty status
    IF NEW.barcode IS NOT NULL AND TRIM(NEW.barcode) != '' THEN
      INSERT INTO customer_loyalty_status (customer_id, current_tier_id)
      VALUES (NEW.id, v_start_tier_id)
      ON CONFLICT (customer_id) DO NOTHING;
    END IF;
    RETURN NEW;
  END IF;

  -- При UPDATE
  IF (TG_OP = 'UPDATE') THEN
    -- Случай 1: Преди нямаше баркод, сега има → създай loyalty status
    IF (OLD.barcode IS NULL OR TRIM(OLD.barcode) = '') AND 
       (NEW.barcode IS NOT NULL AND TRIM(NEW.barcode) != '') THEN
      INSERT INTO customer_loyalty_status (customer_id, current_tier_id)
      VALUES (NEW.id, v_start_tier_id)
      ON CONFLICT (customer_id) DO NOTHING;
    END IF;

    -- Случай 2: Преди имаше баркод, сега няма → изтрий loyalty status
    IF (OLD.barcode IS NOT NULL AND TRIM(OLD.barcode) != '') AND 
       (NEW.barcode IS NULL OR TRIM(NEW.barcode) = '') THEN
      DELETE FROM customer_loyalty_status WHERE customer_id = NEW.id;
    END IF;
    
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

-- Тригер за автоматично управление на loyalty status
DROP TRIGGER IF EXISTS auto_manage_customer_loyalty_trigger ON public.customers;
CREATE TRIGGER auto_manage_customer_loyalty_trigger
  AFTER INSERT OR UPDATE OF barcode ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_manage_customer_loyalty();

-- =============================================
-- Преглед на съществуващи клиенти
-- Създаване на loyalty status само за тези с баркод
-- Изтриване на loyalty status за тези без баркод
-- =============================================

-- Изтриваме loyalty статуси за клиенти без баркод
DELETE FROM customer_loyalty_status cls
WHERE cls.customer_id IN (
  SELECT c.id FROM customers c
  WHERE c.barcode IS NULL OR TRIM(c.barcode) = ''
);

-- Създаваме loyalty статуси за клиенти с баркод, които нямат такъв
DO $$
DECLARE
  v_start_tier_id INTEGER;
  v_customer RECORD;
BEGIN
  -- Намираме START tier
  SELECT id INTO v_start_tier_id FROM loyalty_tiers WHERE sort_order = 0 LIMIT 1;
  
  IF v_start_tier_id IS NOT NULL THEN
    -- Създаваме loyalty status за всички клиенти с баркод, които нямат такъв
    FOR v_customer IN 
      SELECT c.id 
      FROM customers c
      LEFT JOIN customer_loyalty_status cls ON cls.customer_id = c.id
      WHERE c.barcode IS NOT NULL 
        AND TRIM(c.barcode) != ''
        AND cls.id IS NULL
    LOOP
      INSERT INTO customer_loyalty_status (customer_id, current_tier_id)
      VALUES (v_customer.id, v_start_tier_id)
      ON CONFLICT (customer_id) DO NOTHING;
    END LOOP;
  END IF;
END $$;

-- =============================================
-- Обновяваме функцията ensure_customer_loyalty_status
-- За да проверява дали клиентът има баркод
-- =============================================

CREATE OR REPLACE FUNCTION public.ensure_customer_loyalty_status(p_customer_id UUID)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_status_id UUID;
  v_start_tier_id INTEGER;
  v_customer_barcode TEXT;
BEGIN
  -- Проверяваме дали клиентът има баркод
  SELECT barcode INTO v_customer_barcode FROM customers WHERE id = p_customer_id;
  
  IF v_customer_barcode IS NULL OR TRIM(v_customer_barcode) = '' THEN
    -- Клиентът няма баркод → не участва в програмата за лоялност
    RETURN NULL;
  END IF;

  -- Клиентът има баркод → продължаваме
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

-- =============================================
-- Обновяваме get_customer_loyalty_info
-- За да връща NULL ако клиентът няма баркод
-- =============================================

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
  v_customer_barcode TEXT;
BEGIN
  -- Проверяваме дали клиентът има баркод
  SELECT barcode INTO v_customer_barcode FROM customers WHERE id = p_customer_id;
  
  IF v_customer_barcode IS NULL OR TRIM(v_customer_barcode) = '' THEN
    -- Клиентът няма баркод → не участва в програмата за лоялност
    RETURN NULL;
  END IF;

  -- Ensure loyalty status exists
  PERFORM ensure_customer_loyalty_status(p_customer_id);

  -- Get status
  SELECT cls.*, lt.name as tier_name, lt.discount_percent, lt.sort_order, lt.min_turnover_12m_eur
  INTO v_status
  FROM customer_loyalty_status cls
  JOIN loyalty_tiers lt ON lt.id = cls.current_tier_id
  WHERE cls.customer_id = p_customer_id;

  -- Ако няма статус (не би трябвало да се случва), връща NULL
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

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

-- =============================================
-- Обновяваме process_loyalty_after_sale
-- За да обработва само клиенти с баркод
-- =============================================

CREATE OR REPLACE FUNCTION public.process_loyalty_after_sale(p_sale_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_customer_id UUID;
  v_customer_barcode TEXT;
  v_total_eur NUMERIC(10,2);
  v_final_total_eur NUMERIC(10,2);
  v_loyalty_discount_eur NUMERIC(10,2);
  v_result JSONB;
BEGIN
  -- Вземаме customer_id от продажбата
  SELECT customer_id, total_eur, final_total_eur, loyalty_discount_eur
  INTO v_customer_id, v_total_eur, v_final_total_eur, v_loyalty_discount_eur
  FROM sales
  WHERE id = p_sale_id AND status = 'finalized';

  -- Ако няма клиент, няма какво да правим
  IF v_customer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'no_customer');
  END IF;

  -- Проверяваме дали клиентът има баркод
  SELECT barcode INTO v_customer_barcode FROM customers WHERE id = v_customer_id;
  
  IF v_customer_barcode IS NULL OR TRIM(v_customer_barcode) = '' THEN
    -- Клиентът няма баркод → не участва в програмата за лоялност
    RETURN jsonb_build_object('success', false, 'reason', 'no_barcode');
  END IF;

  -- Ensure customer has loyalty status
  PERFORM ensure_customer_loyalty_status(v_customer_id);

  -- Записваме в loyalty ledger
  INSERT INTO loyalty_ledger (customer_id, sale_id, amount_eur, operation_type)
  VALUES (v_customer_id, p_sale_id, v_final_total_eur, 'sale');

  -- Преизчисляваме оборот и ниво
  PERFORM recalculate_customer_loyalty(v_customer_id);

  -- Проверяваме за voucher rules
  PERFORM check_and_issue_vouchers(v_customer_id, v_total_eur);

  v_result := jsonb_build_object(
    'success', true,
    'customer_id', v_customer_id,
    'sale_id', p_sale_id,
    'amount_added_eur', v_final_total_eur
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.auto_manage_customer_loyalty IS 'Автоматично управление на loyalty status: клиенти участват в програмата само ако имат баркод';

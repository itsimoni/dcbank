/*
  # Create Balance History Triggers
  
  1. Function
    - `record_balance_snapshot()` - Captures all 6 currency balances for a user
    - Queries USD, EUR, CAD, BTC, ETH, USDT balances
    - Inserts snapshot into balance_history
    
  2. Triggers
    - On usd_balances UPDATE
    - On euro_balances UPDATE
    - On cad_balances UPDATE
    - On newcrypto_balances UPDATE (BTC, ETH, USDT)
    
  3. Behavior
    - Only triggers when balance actually changes
    - Captures complete snapshot of all currencies
    - Records timestamp automatically
*/

-- Function to record balance snapshot
CREATE OR REPLACE FUNCTION record_balance_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  v_usd numeric(30, 8) := 0;
  v_eur numeric(30, 8) := 0;
  v_cad numeric(30, 8) := 0;
  v_btc numeric(18, 8) := 0;
  v_eth numeric(18, 8) := 0;
  v_usdt numeric(20, 6) := 0;
  v_user_id uuid;
BEGIN
  -- Get user_id from the updated row
  v_user_id := NEW.user_id;
  
  -- Get USD balance
  SELECT COALESCE(balance, 0) INTO v_usd
  FROM public.usd_balances
  WHERE user_id = v_user_id;
  
  -- Get EUR balance
  SELECT COALESCE(balance, 0) INTO v_eur
  FROM public.euro_balances
  WHERE user_id = v_user_id;
  
  -- Get CAD balance
  SELECT COALESCE(balance, 0) INTO v_cad
  FROM public.cad_balances
  WHERE user_id = v_user_id;
  
  -- Get crypto balances
  SELECT 
    COALESCE(btc_balance, 0),
    COALESCE(eth_balance, 0),
    COALESCE(usdt_balance, 0)
  INTO v_btc, v_eth, v_usdt
  FROM public.newcrypto_balances
  WHERE user_id = v_user_id;
  
  -- Insert balance snapshot
  INSERT INTO public.balance_history (
    user_id,
    usd_balance,
    eur_balance,
    cad_balance,
    btc_balance,
    eth_balance,
    usdt_balance,
    total_value_usd,
    created_at
  ) VALUES (
    v_user_id,
    v_usd,
    v_eur,
    v_cad,
    v_btc,
    v_eth,
    v_usdt,
    v_usd, -- Simple total for now, frontend can calculate with real rates
    now()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for USD balance updates
DROP TRIGGER IF EXISTS trg_record_usd_balance_history ON public.usd_balances;
CREATE TRIGGER trg_record_usd_balance_history
  AFTER UPDATE OF balance ON public.usd_balances
  FOR EACH ROW
  WHEN (OLD.balance IS DISTINCT FROM NEW.balance)
  EXECUTE FUNCTION record_balance_snapshot();

-- Trigger for EUR balance updates
DROP TRIGGER IF EXISTS trg_record_eur_balance_history ON public.euro_balances;
CREATE TRIGGER trg_record_eur_balance_history
  AFTER UPDATE OF balance ON public.euro_balances
  FOR EACH ROW
  WHEN (OLD.balance IS DISTINCT FROM NEW.balance)
  EXECUTE FUNCTION record_balance_snapshot();

-- Trigger for CAD balance updates
DROP TRIGGER IF EXISTS trg_record_cad_balance_history ON public.cad_balances;
CREATE TRIGGER trg_record_cad_balance_history
  AFTER UPDATE OF balance ON public.cad_balances
  FOR EACH ROW
  WHEN (OLD.balance IS DISTINCT FROM NEW.balance)
  EXECUTE FUNCTION record_balance_snapshot();

-- Trigger for crypto balance updates
DROP TRIGGER IF EXISTS trg_record_crypto_balance_history ON public.newcrypto_balances;
CREATE TRIGGER trg_record_crypto_balance_history
  AFTER UPDATE ON public.newcrypto_balances
  FOR EACH ROW
  WHEN (
    OLD.btc_balance IS DISTINCT FROM NEW.btc_balance OR
    OLD.eth_balance IS DISTINCT FROM NEW.eth_balance OR
    OLD.usdt_balance IS DISTINCT FROM NEW.usdt_balance
  )
  EXECUTE FUNCTION record_balance_snapshot();
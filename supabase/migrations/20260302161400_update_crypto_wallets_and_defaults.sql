/*
  # Update Crypto Wallet Tables and Add Default Wallets

  1. Changes to fund_requests table
    - Update crypto_currency constraint to include new currencies (USDT-ERC, USDT-TRC, USDC, SOL)

  2. Changes to payment_wallets table
    - Update crypto_type constraint to include new types (usdterc, usdttrc, usdc)

  3. New Function
    - create_default_payment_wallets(): Creates default wallets for users

  4. New Trigger
    - Automatically creates default wallets when a new user is created

  5. Default Wallets
    - BTC: bc1qn7qsslxz2ngn3x2uyrmyy3sdgv0eq6pcutazmt
    - ETH: 0xcd1d69695884c60d2784c17c8d435a1341a7fbac
    - USDT ERC20: 0xcd1d69695884c60d2784c17c8d435a1341a7fbac
    - USDT TRC20: TUKJShLza5hCjeWcNLae3zLe4eWTPFELqT
    - USDC: 0xcd1d69695884c60d2784c17c8d435a1341a7fbac
    - SOL: 7i3WnWp1ovKFsKzrpMRqtnjB2aSUiNKEGkAmVG1qDXZY
*/

-- Update fund_requests crypto_currency constraint
ALTER TABLE public.fund_requests DROP CONSTRAINT IF EXISTS fund_requests_crypto_currency_check;

ALTER TABLE public.fund_requests ADD CONSTRAINT fund_requests_crypto_currency_check CHECK (
  (
    crypto_currency = ANY (ARRAY[
      'BTC'::text, 
      'ETH'::text, 
      'USDT'::text,
      'USDT-ERC'::text,
      'USDT-TRC'::text,
      'USDC'::text,
      'SOL'::text
    ])
  )
  OR (crypto_currency IS NULL)
);

-- Update payment_wallets crypto_type constraint
ALTER TABLE public.payment_wallets DROP CONSTRAINT IF EXISTS payment_wallets_crypto_type_check;

ALTER TABLE public.payment_wallets ADD CONSTRAINT payment_wallets_crypto_type_check CHECK (
  crypto_type = ANY (ARRAY[
    'btc'::text,
    'eth'::text,
    'usdterc'::text,
    'usdttrc'::text,
    'usdc'::text,
    'sol'::text
  ])
);

-- Create function to add default payment wallets for a user
CREATE OR REPLACE FUNCTION public.create_default_payment_wallets()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert default BTC wallet
  INSERT INTO public.payment_wallets (user_id, crypto_type, wallet_address, is_active)
  VALUES (NEW.id, 'btc', 'bc1qn7qsslxz2ngn3x2uyrmyy3sdgv0eq6pcutazmt', true)
  ON CONFLICT (user_id, crypto_type) DO NOTHING;

  -- Insert default ETH wallet
  INSERT INTO public.payment_wallets (user_id, crypto_type, wallet_address, is_active)
  VALUES (NEW.id, 'eth', '0xcd1d69695884c60d2784c17c8d435a1341a7fbac', true)
  ON CONFLICT (user_id, crypto_type) DO NOTHING;

  -- Insert default USDT ERC20 wallet
  INSERT INTO public.payment_wallets (user_id, crypto_type, wallet_address, is_active)
  VALUES (NEW.id, 'usdterc', '0xcd1d69695884c60d2784c17c8d435a1341a7fbac', true)
  ON CONFLICT (user_id, crypto_type) DO NOTHING;

  -- Insert default USDT TRC20 wallet
  INSERT INTO public.payment_wallets (user_id, crypto_type, wallet_address, is_active)
  VALUES (NEW.id, 'usdttrc', 'TUKJShLza5hCjeWcNLae3zLe4eWTPFELqT', true)
  ON CONFLICT (user_id, crypto_type) DO NOTHING;

  -- Insert default USDC wallet
  INSERT INTO public.payment_wallets (user_id, crypto_type, wallet_address, is_active)
  VALUES (NEW.id, 'usdc', '0xcd1d69695884c60d2784c17c8d435a1341a7fbac', true)
  ON CONFLICT (user_id, crypto_type) DO NOTHING;

  -- Insert default SOL wallet
  INSERT INTO public.payment_wallets (user_id, crypto_type, wallet_address, is_active)
  VALUES (NEW.id, 'sol', '7i3WnWp1ovKFsKzrpMRqtnjB2aSUiNKEGkAmVG1qDXZY', true)
  ON CONFLICT (user_id, crypto_type) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create wallets for new users
DROP TRIGGER IF EXISTS on_user_created_create_wallets ON public.users;

CREATE TRIGGER on_user_created_create_wallets
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_payment_wallets();

-- Create default wallets for all existing users who don't have them
INSERT INTO public.payment_wallets (user_id, crypto_type, wallet_address, is_active)
SELECT u.id, 'btc', 'bc1qn7qsslxz2ngn3x2uyrmyy3sdgv0eq6pcutazmt', true
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.payment_wallets pw WHERE pw.user_id = u.id AND pw.crypto_type = 'btc')
ON CONFLICT (user_id, crypto_type) DO NOTHING;

INSERT INTO public.payment_wallets (user_id, crypto_type, wallet_address, is_active)
SELECT u.id, 'eth', '0xcd1d69695884c60d2784c17c8d435a1341a7fbac', true
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.payment_wallets pw WHERE pw.user_id = u.id AND pw.crypto_type = 'eth')
ON CONFLICT (user_id, crypto_type) DO NOTHING;

INSERT INTO public.payment_wallets (user_id, crypto_type, wallet_address, is_active)
SELECT u.id, 'usdterc', '0xcd1d69695884c60d2784c17c8d435a1341a7fbac', true
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.payment_wallets pw WHERE pw.user_id = u.id AND pw.crypto_type = 'usdterc')
ON CONFLICT (user_id, crypto_type) DO NOTHING;

INSERT INTO public.payment_wallets (user_id, crypto_type, wallet_address, is_active)
SELECT u.id, 'usdttrc', 'TUKJShLza5hCjeWcNLae3zLe4eWTPFELqT', true
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.payment_wallets pw WHERE pw.user_id = u.id AND pw.crypto_type = 'usdttrc')
ON CONFLICT (user_id, crypto_type) DO NOTHING;

INSERT INTO public.payment_wallets (user_id, crypto_type, wallet_address, is_active)
SELECT u.id, 'usdc', '0xcd1d69695884c60d2784c17c8d435a1341a7fbac', true
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.payment_wallets pw WHERE pw.user_id = u.id AND pw.crypto_type = 'usdc')
ON CONFLICT (user_id, crypto_type) DO NOTHING;

INSERT INTO public.payment_wallets (user_id, crypto_type, wallet_address, is_active)
SELECT u.id, 'sol', '7i3WnWp1ovKFsKzrpMRqtnjB2aSUiNKEGkAmVG1qDXZY', true
FROM public.users u
WHERE NOT EXISTS (SELECT 1 FROM public.payment_wallets pw WHERE pw.user_id = u.id AND pw.crypto_type = 'sol')
ON CONFLICT (user_id, crypto_type) DO NOTHING;

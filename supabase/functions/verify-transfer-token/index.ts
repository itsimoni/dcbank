import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VerifyTokenRequest {
  token: string;
}

interface TransferData {
  fromCurrency: string;
  toCurrency: string;
  fromAmount: number;
  toAmount: number;
  fee: number;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    beneficiaryName: string;
  };
  cryptoDetails?: {
    walletAddress: string;
    network: string;
  };
}

const getBalanceTable = (currency: string): string => {
  const currencyUpper = currency.toUpperCase();
  switch (currencyUpper) {
    case "USD":
      return "usd_balances";
    case "EUR":
    case "EURO":
      return "euro_balances";
    case "CAD":
      return "cad_balances";
    default:
      return "";
  }
};

const getCryptoBalanceColumn = (crypto: string): string => {
  const cryptoUpper = crypto.toUpperCase();
  switch (cryptoUpper) {
    case "BTC":
      return "btc_balance";
    case "ETH":
      return "eth_balance";
    case "USDT":
      return "usdt_balance";
    default:
      return "";
  }
};

const isCrypto = (currency: string): boolean => {
  const cryptos = ["BTC", "ETH", "USDT", "USDC", "XRP", "LTC", "BNB", "SOL", "DOGE", "ADA"];
  return cryptos.includes(currency.toUpperCase());
};

const generateReferenceNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TRF-${timestamp}-${random}`;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { token }: VerifyTokenRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Verification token is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: verification, error: fetchError } = await supabase
      .from("transfer_verifications")
      .select("*")
      .eq("verification_token", token)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching verification:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch verification record" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!verification) {
      return new Response(
        JSON.stringify({
          error: "Invalid verification token",
          code: "INVALID_TOKEN",
          message: "The verification link is invalid or has already been used. Please initiate a new transfer request.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (verification.status === "verified") {
      return new Response(
        JSON.stringify({
          error: "Transfer already verified",
          code: "ALREADY_VERIFIED",
          message: "This transfer has already been verified and processed.",
          transferType: verification.transfer_type,
          verifiedAt: verification.verified_at,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (verification.status === "cancelled") {
      return new Response(
        JSON.stringify({
          error: "Transfer was cancelled",
          code: "CANCELLED",
          message: "This transfer request was cancelled.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const now = new Date();
    const expiresAt = new Date(verification.expires_at);
    if (now > expiresAt) {
      await supabase
        .from("transfer_verifications")
        .update({ status: "expired" })
        .eq("id", verification.id);

      return new Response(
        JSON.stringify({
          error: "Verification link expired",
          code: "EXPIRED",
          message: "This verification link has expired. Please initiate a new transfer request. Verification links are valid for 30 minutes.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const transferData: TransferData = verification.transfer_data;
    const userId = verification.user_id;
    const transferType = verification.transfer_type;

    const referenceNumber = generateReferenceNumber();
    const totalDebit = transferData.fromAmount + transferData.fee;

    const fromCurrency = transferData.fromCurrency.toUpperCase();
    const toCurrency = transferData.toCurrency.toUpperCase();
    const fromIsCrypto = isCrypto(fromCurrency);
    const toIsCrypto = isCrypto(toCurrency);

    if (fromIsCrypto) {
      const fromColumn = getCryptoBalanceColumn(fromCurrency);
      if (fromColumn) {
        const { data: cryptoBalance } = await supabase
          .from("newcrypto_balances")
          .select(fromColumn)
          .eq("user_id", userId)
          .maybeSingle();

        const currentBalance = cryptoBalance?.[fromColumn] || 0;
        if (currentBalance < totalDebit) {
          return new Response(
            JSON.stringify({
              error: "Insufficient balance",
              code: "INSUFFICIENT_BALANCE",
              message: `Insufficient ${fromCurrency} balance. Available: ${currentBalance}, Required: ${totalDebit}`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        await supabase
          .from("newcrypto_balances")
          .upsert({
            user_id: userId,
            [fromColumn]: currentBalance - totalDebit,
          }, { onConflict: "user_id" });
      }
    } else {
      const fromTable = getBalanceTable(fromCurrency);
      if (fromTable) {
        const { data: fiatBalance } = await supabase
          .from(fromTable)
          .select("balance")
          .eq("user_id", userId)
          .maybeSingle();

        const currentBalance = fiatBalance?.balance || 0;
        if (currentBalance < totalDebit) {
          return new Response(
            JSON.stringify({
              error: "Insufficient balance",
              code: "INSUFFICIENT_BALANCE",
              message: `Insufficient ${fromCurrency} balance. Available: ${currentBalance}, Required: ${totalDebit}`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        await supabase
          .from(fromTable)
          .upsert({
            user_id: userId,
            balance: currentBalance - totalDebit,
          }, { onConflict: "user_id" });
      }
    }

    if (transferType === "internal" || transferType === "crypto_internal") {
      if (toIsCrypto) {
        const toColumn = getCryptoBalanceColumn(toCurrency);
        if (toColumn) {
          const { data: cryptoBalance } = await supabase
            .from("newcrypto_balances")
            .select(toColumn)
            .eq("user_id", userId)
            .maybeSingle();

          const currentToBalance = cryptoBalance?.[toColumn] || 0;

          await supabase
            .from("newcrypto_balances")
            .upsert({
              user_id: userId,
              [toColumn]: currentToBalance + transferData.toAmount,
            }, { onConflict: "user_id" });
        }
      } else {
        const toTable = getBalanceTable(toCurrency);
        if (toTable) {
          const { data: fiatBalance } = await supabase
            .from(toTable)
            .select("balance")
            .eq("user_id", userId)
            .maybeSingle();

          const currentToBalance = fiatBalance?.balance || 0;

          await supabase
            .from(toTable)
            .upsert({
              user_id: userId,
              balance: currentToBalance + transferData.toAmount,
            }, { onConflict: "user_id" });
        }
      }
    }

    const { data: transferRecord, error: transferError } = await supabase
      .from("transfers")
      .insert({
        user_id: userId,
        from_currency: fromCurrency,
        to_currency: toCurrency,
        from_amount: transferData.fromAmount,
        to_amount: transferData.toAmount,
        exchange_rate: transferData.toAmount / transferData.fromAmount,
        status: "completed",
        transfer_type: transferType,
        description: `${transferType === "internal" ? "Currency Exchange" : transferType === "bank_transfer" ? "Bank Wire Transfer" : transferType === "crypto_internal" ? "Crypto Exchange" : "Crypto Withdrawal"}: ${transferData.fromAmount} ${fromCurrency} to ${transferData.toAmount} ${toCurrency}`,
        reference_number: referenceNumber,
        fee_amount: transferData.fee,
        fee_currency: fromCurrency,
        processed_at: now.toISOString(),
      })
      .select()
      .single();

    if (transferError) {
      console.error("Error creating transfer record:", transferError);
    }

    if (transferRecord && transferType === "bank_transfer" && transferData.bankDetails) {
      await supabase
        .from("bank_transfers")
        .insert({
          transfer_id: transferRecord.id,
          bank_name: transferData.bankDetails.bankName,
          account_holder_name: transferData.bankDetails.beneficiaryName,
          account_number: transferData.bankDetails.accountNumber,
        });
    }

    if (transferRecord && transferType === "crypto_external" && transferData.cryptoDetails) {
      await supabase
        .from("crypto_transfers")
        .insert({
          transfer_id: transferRecord.id,
          wallet_address: transferData.cryptoDetails.walletAddress,
          network: transferData.cryptoDetails.network,
        });
    }

    await supabase
      .from("transactions")
      .insert({
        user_id: userId,
        type: transferType,
        amount: transferData.fromAmount,
        currency: fromCurrency,
        description: `Transfer verified: ${transferData.fromAmount} ${fromCurrency} to ${transferData.toAmount} ${toCurrency}`,
        status: "completed",
      });

    const { error: updateError } = await supabase
      .from("transfer_verifications")
      .update({
        status: "verified",
        verified_at: now.toISOString(),
      })
      .eq("id", verification.id);

    if (updateError) {
      console.error("Error updating verification:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to verify transfer" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Transfer verified and executed successfully",
        verification: {
          id: verification.id,
          transferType: verification.transfer_type,
          transferData: verification.transfer_data,
          userId: verification.user_id,
          verifiedAt: now.toISOString(),
          referenceNumber: referenceNumber,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error verifying transfer token:", error);
    return new Response(
      JSON.stringify({ error: "Failed to verify transfer", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const IPN_SECRET_KEY = "10709ffb-9b3a-431f-80b3-febbf2fe351c";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface IPNPayload {
  payment_id: number;
  payment_status: string;
  pay_address: string;
  price_amount: number;
  price_currency: string;
  pay_amount: number;
  pay_currency: string;
  actually_paid: number;
  outcome_amount: number;
  outcome_currency: string;
  order_id: string;
  order_description: string;
}

async function createHmacSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function sortObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sorted: Record<string, unknown> = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    if (obj[key] !== null && obj[key] !== undefined) {
      sorted[key] = obj[key];
    }
  }
  return sorted;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const receivedSignature = req.headers.get("x-nowpayments-sig");
    const bodyText = await req.text();

    let payload: IPNPayload;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (receivedSignature) {
      const sortedPayload = sortObject(payload as unknown as Record<string, unknown>);
      const dataToSign = JSON.stringify(sortedPayload);
      const expectedSignature = await createHmacSignature(dataToSign, IPN_SECRET_KEY);

      if (receivedSignature.toLowerCase() !== expectedSignature.toLowerCase()) {
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const paymentId = String(payload.payment_id);

    const { data: existingDeposit, error: fetchError } = await supabase
      .from("nowpayments_deposits")
      .select("*")
      .eq("payment_id", paymentId)
      .maybeSingle();

    if (fetchError || !existingDeposit) {
      return new Response(
        JSON.stringify({ error: "Payment not found", payment_id: paymentId }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("nowpayments_deposits")
      .update({
        payment_status: payload.payment_status,
        actually_paid: payload.actually_paid || 0,
        outcome_amount: payload.outcome_amount || 0,
        outcome_currency: payload.outcome_currency || null,
        updated_at: new Date().toISOString(),
      })
      .eq("payment_id", paymentId);

    if (payload.payment_status === "finished" || payload.payment_status === "confirmed") {
      const userId = existingDeposit.user_id;
      const currency = (payload.pay_currency || existingDeposit.pay_currency).toUpperCase();
      const amount = payload.actually_paid || payload.pay_amount || existingDeposit.pay_amount;

      const currencyToColumn: Record<string, string> = {
        BTC: "btc_balance",
        ETH: "eth_balance",
        USDT: "usdt_balance",
      };

      const balanceColumn = currencyToColumn[currency];

      if (balanceColumn) {
        const { data: existingBalance } = await supabase
          .from("newcrypto_balances")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingBalance) {
          const currentBalance = parseFloat(existingBalance[balanceColumn] || 0);
          const newBalance = currentBalance + parseFloat(String(amount));

          await supabase
            .from("newcrypto_balances")
            .update({
              [balanceColumn]: newBalance,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId);
        } else {
          await supabase
            .from("newcrypto_balances")
            .insert({
              user_id: userId,
              [balanceColumn]: amount,
            });
        }
      }

      await supabase
        .from("crypto_transactions")
        .insert({
          user_id: userId,
          transaction_type: "deposit",
          crypto_type: currency,
          amount: amount,
          status: "completed",
          description: `Crypto deposit - Order: ${payload.order_id}`,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentId,
        status: payload.payment_status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

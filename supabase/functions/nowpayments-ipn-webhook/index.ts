import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const IPN_SECRET_KEY = "10709ffb-9b3a-431f-80b3-febbf2fe351c";

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
  network?: string;
  payin_extra_id?: string;
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
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const receivedSignature = req.headers.get("x-nowpayments-sig");
    const bodyText = await req.text();

    console.log("IPN received:", bodyText);
    console.log("Signature header:", receivedSignature);

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
        console.error("Signature mismatch:", { received: receivedSignature, expected: expectedSignature });
        return new Response(
          JSON.stringify({ error: "Invalid signature" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Signature verified successfully");
    } else {
      console.log("No signature provided, proceeding without verification");
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

    if (fetchError) {
      console.error("Error fetching deposit:", fetchError);
      return new Response(
        JSON.stringify({ error: "Database error", details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!existingDeposit) {
      console.log("Payment not found in database:", paymentId);
      return new Response(
        JSON.stringify({ error: "Payment not found", payment_id: paymentId }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: updateError } = await supabase
      .from("nowpayments_deposits")
      .update({
        payment_status: payload.payment_status,
        actually_paid: payload.actually_paid || 0,
        outcome_amount: payload.outcome_amount || 0,
        outcome_currency: payload.outcome_currency || null,
        updated_at: new Date().toISOString(),
      })
      .eq("payment_id", paymentId);

    if (updateError) {
      console.error("Error updating deposit:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update deposit", details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Payment ${paymentId} status updated to: ${payload.payment_status}`);

    if (payload.payment_status === "finished" || payload.payment_status === "confirmed") {
      const userId = existingDeposit.user_id;
      const currency = (payload.pay_currency || existingDeposit.pay_currency).toUpperCase();
      const amount = payload.actually_paid || payload.pay_amount || existingDeposit.pay_amount;

      console.log(`Processing confirmed payment for user ${userId}: ${amount} ${currency}`);

      const { data: existingWallet, error: walletFetchError } = await supabase
        .from("crypto_wallets")
        .select("*")
        .eq("user_id", userId)
        .eq("currency", currency)
        .maybeSingle();

      if (walletFetchError) {
        console.error("Error fetching wallet:", walletFetchError);
      } else if (existingWallet) {
        const newBalance = parseFloat(existingWallet.balance || 0) + parseFloat(String(amount));

        const { error: walletUpdateError } = await supabase
          .from("crypto_wallets")
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingWallet.id);

        if (walletUpdateError) {
          console.error("Error updating wallet balance:", walletUpdateError);
        } else {
          console.log(`Updated ${currency} wallet for user ${userId}: new balance = ${newBalance}`);
        }
      } else {
        const { error: createWalletError } = await supabase
          .from("crypto_wallets")
          .insert({
            user_id: userId,
            currency: currency,
            balance: amount,
            wallet_address: payload.pay_address || null,
          });

        if (createWalletError) {
          console.error("Error creating wallet:", createWalletError);
        } else {
          console.log(`Created new ${currency} wallet for user ${userId} with balance ${amount}`);
        }
      }

      const { error: txError } = await supabase
        .from("crypto_transactions")
        .insert({
          user_id: userId,
          currency: currency,
          amount: amount,
          transaction_type: "deposit",
          status: "completed",
          payment_id: paymentId,
          notes: `IPN confirmed deposit - Order: ${payload.order_id}`,
        });

      if (txError) {
        console.error("Error creating transaction record:", txError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "IPN processed successfully",
        payment_id: paymentId,
        status: payload.payment_status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("IPN webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

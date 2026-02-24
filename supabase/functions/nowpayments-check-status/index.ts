import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const NOWPAYMENTS_API_KEY = "XKRHKB1-28S4WH7-MWN2B4S-FNCG26G";
const NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (userError || !userData) {
      return new Response(
        JSON.stringify({ error: "User not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url = new URL(req.url);
    const paymentId = url.searchParams.get("payment_id");
    const depositId = url.searchParams.get("deposit_id");

    if (!paymentId && !depositId) {
      return new Response(
        JSON.stringify({ error: "Missing payment_id or deposit_id parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let nowPaymentsId = paymentId;

    if (depositId && !paymentId) {
      const { data: deposit, error: depositError } = await supabase
        .from("nowpayments_deposits")
        .select("payment_id")
        .eq("id", depositId)
        .eq("user_id", userData.id)
        .maybeSingle();

      if (depositError || !deposit) {
        return new Response(
          JSON.stringify({ error: "Deposit not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      nowPaymentsId = deposit.payment_id;
    }

    const nowPaymentsResponse = await fetch(`${NOWPAYMENTS_API_URL}/payment/${nowPaymentsId}`, {
      method: "GET",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
      },
    });

    if (!nowPaymentsResponse.ok) {
      const errorText = await nowPaymentsResponse.text();
      console.error("NOWPayments API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get payment status from NOWPayments", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentStatus = await nowPaymentsResponse.json();

    const { error: updateError } = await supabase
      .from("nowpayments_deposits")
      .update({
        payment_status: paymentStatus.payment_status,
        actually_paid: paymentStatus.actually_paid || 0,
        outcome_amount: paymentStatus.outcome_amount || 0,
        outcome_currency: paymentStatus.outcome_currency || null,
        updated_at: new Date().toISOString(),
      })
      .eq("payment_id", nowPaymentsId);

    if (updateError) {
      console.error("Database update error:", updateError);
    }

    const isDeposited = ["confirming", "confirmed", "sending", "partially_paid", "finished"].includes(paymentStatus.payment_status);
    const isFullyPaid = paymentStatus.payment_status === "finished";
    const isExpired = paymentStatus.payment_status === "expired";
    const isFailed = paymentStatus.payment_status === "failed";

    return new Response(
      JSON.stringify({
        success: true,
        payment_id: paymentStatus.payment_id,
        payment_status: paymentStatus.payment_status,
        pay_address: paymentStatus.pay_address,
        pay_amount: paymentStatus.pay_amount,
        pay_currency: paymentStatus.pay_currency,
        price_amount: paymentStatus.price_amount,
        price_currency: paymentStatus.price_currency,
        actually_paid: paymentStatus.actually_paid || 0,
        outcome_amount: paymentStatus.outcome_amount || 0,
        outcome_currency: paymentStatus.outcome_currency,
        is_deposited: isDeposited,
        is_fully_paid: isFullyPaid,
        is_expired: isExpired,
        is_failed: isFailed,
        created_at: paymentStatus.created_at,
        updated_at: paymentStatus.updated_at,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error checking payment status:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

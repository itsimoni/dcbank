import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const NOWPAYMENTS_API_KEY = "XKRHKB1-28S4WH7-MWN2B4S-FNCG26G";
const NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1";

interface CreatePaymentRequest {
  price_amount: number;
  price_currency: string;
  pay_currency: string;
  payment_category: string;
  payer_name: string;
  payer_email: string;
  order_description?: string;
}

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
        JSON.stringify({ error: "Invalid token", details: authError?.message }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: allUsers, error: listError } = await supabase
      .from("users")
      .select("id, email, auth_user_id")
      .limit(5);

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, client_id, email, full_name")
      .or(`auth_user_id.eq.${user.id},id.eq.${user.id},email.eq.${user.email}`)
      .maybeSingle();

    if (!userData) {
      return new Response(
        JSON.stringify({
          error: "User not found",
          auth_user: { id: user.id, email: user.email },
          sample_users: allUsers,
          list_error: listError?.message,
          user_query_error: userError?.message
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: CreatePaymentRequest = await req.json();
    const { price_amount, price_currency, pay_currency, payment_category, payer_name, payer_email, order_description } = body;

    if (!price_amount || !price_currency || !pay_currency || !payment_category) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const nowPaymentsPayload = {
      price_amount: price_amount,
      price_currency: price_currency.toLowerCase(),
      pay_currency: pay_currency.toLowerCase(),
      order_id: orderId,
      order_description: order_description || `Payment for ${payment_category}`,
      is_fee_paid_by_user: false,
    };

    const nowPaymentsResponse = await fetch(`${NOWPAYMENTS_API_URL}/payment`, {
      method: "POST",
      headers: {
        "x-api-key": NOWPAYMENTS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nowPaymentsPayload),
    });

    if (!nowPaymentsResponse.ok) {
      const errorText = await nowPaymentsResponse.text();
      console.error("NOWPayments API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Failed to create payment with NOWPayments", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const paymentData = await nowPaymentsResponse.json();

    const { data: deposit, error: insertError } = await supabase
      .from("nowpayments_deposits")
      .insert({
        user_id: userData.id,
        payment_id: String(paymentData.payment_id),
        payment_status: paymentData.payment_status || "waiting",
        pay_address: paymentData.pay_address,
        pay_currency: paymentData.pay_currency,
        pay_amount: paymentData.pay_amount,
        price_amount: price_amount,
        price_currency: price_currency.toUpperCase(),
        payment_category: payment_category,
        order_id: orderId,
        order_description: order_description || `Payment for ${payment_category}`,
        payer_name: payer_name,
        payer_email: payer_email,
        network: paymentData.network || null,
        payin_extra_id: paymentData.payin_extra_id || null,
        expires_at: paymentData.expiration_estimate_date ? new Date(paymentData.expiration_estimate_date).toISOString() : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to save payment record", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: {
          id: deposit.id,
          payment_id: paymentData.payment_id,
          pay_address: paymentData.pay_address,
          pay_amount: paymentData.pay_amount,
          pay_currency: paymentData.pay_currency,
          price_amount: price_amount,
          price_currency: price_currency,
          payment_status: paymentData.payment_status,
          network: paymentData.network,
          payin_extra_id: paymentData.payin_extra_id,
          expiration_estimate_date: paymentData.expiration_estimate_date,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error creating payment:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

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
        message: "Transfer verified successfully",
        verification: {
          id: verification.id,
          transferType: verification.transfer_type,
          transferData: verification.transfer_data,
          userId: verification.user_id,
          verifiedAt: now.toISOString(),
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

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VerifyRequest {
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

    const { token }: VerifyRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing verification token" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { data: verification, error: fetchError } = await supabase
      .from("email_verifications")
      .select("*")
      .eq("token", token)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching verification:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to verify token" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!verification) {
      return new Response(
        JSON.stringify({ error: "Invalid verification token", code: "INVALID_TOKEN" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (verification.verified_at) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Email already verified",
          userId: verification.user_id,
          email: verification.email,
          alreadyVerified: true
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const now = new Date();
    const expiresAt = new Date(verification.expires_at);

    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: "Verification token has expired", code: "TOKEN_EXPIRED" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: updateVerificationError } = await supabase
      .from("email_verifications")
      .update({ verified_at: now.toISOString() })
      .eq("token", token);

    if (updateVerificationError) {
      console.error("Error updating verification:", updateVerificationError);
      return new Response(
        JSON.stringify({ error: "Failed to update verification status" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { error: updateUserError } = await supabase
      .from("users")
      .update({ email_verified: true })
      .eq("id", verification.user_id);

    if (updateUserError) {
      console.error("Error updating user:", updateUserError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email verified successfully",
        userId: verification.user_id,
        email: verification.email
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error verifying email:", error);
    return new Response(
      JSON.stringify({ error: "Failed to verify email", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

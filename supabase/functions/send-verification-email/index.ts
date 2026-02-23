import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "npm:emailjs@4.0.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VerificationRequest {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  baseUrl: string;
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

    const { userId, email, firstName, lastName, baseUrl }: VerificationRequest = await req.json();

    if (!userId || !email || !firstName || !baseUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = crypto.randomUUID() + "-" + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const { error: deleteError } = await supabase
      .from("email_verifications")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting old verifications:", deleteError);
    }

    const { error: insertError } = await supabase
      .from("email_verifications")
      .insert({
        user_id: userId,
        email: email,
        token: token,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Error inserting verification:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create verification token" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const verificationLink = `${baseUrl}/verify-email?token=${token}`;

    const client = new SMTPClient({
      user: "support@transactionfinder.pro",
      password: "xW38zt9|K",
      host: "smtp.hostinger.com",
      port: 465,
      ssl: true,
    });

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Malta Global Crypto Bank</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #b91c1c; padding: 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">
                MALTA GLOBAL CRYPTO BANK
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 12px; letter-spacing: 2px;">
                LICENSED & REGULATED BY MFSA
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                Welcome, ${firstName} ${lastName}!
              </h2>

              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                Thank you for registering with Malta Global Crypto Bank. To complete your account setup and proceed with the Know Your Customer (KYC) verification process, please verify your email address by clicking the button below.
              </p>

              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${verificationLink}"
                       style="display: inline-block; background-color: #b91c1c; color: #ffffff; text-decoration: none; padding: 16px 40px; font-size: 16px; font-weight: 600; border-radius: 0; letter-spacing: 0.5px;">
                      VERIFY EMAIL ADDRESS
                    </a>
                  </td>
                </tr>
              </table>

              <p style="color: #666666; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0;">
                If the button above doesn't work, copy and paste the following link into your browser:
              </p>
              <p style="color: #b91c1c; font-size: 13px; word-break: break-all; margin: 10px 0 0 0; padding: 15px; background-color: #f8f8f8; border-left: 3px solid #b91c1c;">
                ${verificationLink}
              </p>

              <div style="margin-top: 35px; padding-top: 25px; border-top: 1px solid #e5e5e5;">
                <p style="color: #888888; font-size: 13px; line-height: 1.5; margin: 0;">
                  <strong>Important:</strong> This verification link will expire in 24 hours. If you did not create an account with Malta Global Crypto Bank, please disregard this email.
                </p>
              </div>
            </td>
          </tr>

          <!-- Security Notice -->
          <tr>
            <td style="padding: 25px 40px; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 50px; vertical-align: top;">
                    <div style="width: 40px; height: 40px; background-color: #b91c1c; border-radius: 50%; text-align: center; line-height: 40px; color: white; font-size: 18px;">
                      &#128274;
                    </div>
                  </td>
                  <td style="padding-left: 15px;">
                    <p style="color: #1a1a1a; font-size: 14px; font-weight: 600; margin: 0 0 5px 0;">
                      Security Notice
                    </p>
                    <p style="color: #666666; font-size: 13px; line-height: 1.5; margin: 0;">
                      Malta Global Crypto Bank will never ask for your password, PIN, or security codes via email. Always verify the sender's address before clicking any links.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 30px 40px;">
              <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0 0 15px 0; text-align: center;">
                Malta Global Crypto Bank
              </p>
              <p style="color: #999999; font-size: 11px; line-height: 1.6; margin: 0; text-align: center;">
                Authorised and regulated by the Malta Financial Services Authority (MFSA)<br>
                Licence Reference: MFSA/CL/2024/0892<br>
                Member of the Depositor Compensation Scheme
              </p>
              <p style="color: #666666; font-size: 10px; line-height: 1.5; margin: 20px 0 0 0; text-align: center;">
                171 Old Bakery Street, Valletta VLT 1455, Malta<br>
                This email was sent to ${email}. If you have questions, contact support@maltaglobalcryptobank.com
              </p>
              <p style="color: #555555; font-size: 9px; margin: 15px 0 0 0; text-align: center;">
                &copy; ${new Date().getFullYear()} Malta Global Crypto Bank. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const textContent = `
Welcome to Malta Global Crypto Bank, ${firstName} ${lastName}!

Thank you for registering with Malta Global Crypto Bank. To complete your account setup and proceed with the Know Your Customer (KYC) verification process, please verify your email address by clicking the link below:

${verificationLink}

IMPORTANT: This verification link will expire in 24 hours. If you did not create an account with Malta Global Crypto Bank, please disregard this email.

SECURITY NOTICE: Malta Global Crypto Bank will never ask for your password, PIN, or security codes via email. Always verify the sender's address before clicking any links.

---
Malta Global Crypto Bank
Authorised and regulated by the Malta Financial Services Authority (MFSA)
Licence Reference: MFSA/CL/2024/0892
Member of the Depositor Compensation Scheme

171 Old Bakery Street, Valletta VLT 1455, Malta

© ${new Date().getFullYear()} Malta Global Crypto Bank. All rights reserved.
    `;

    await client.sendAsync({
      from: "Malta Global Crypto Bank <support@transactionfinder.pro>",
      to: email,
      subject: "Verify Your Email Address - Malta Global Crypto Bank",
      text: textContent,
      attachment: [
        {
          data: emailHtml,
          alternative: true,
        },
      ],
    });

    return new Response(
      JSON.stringify({ success: true, message: "Verification email sent" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send verification email", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

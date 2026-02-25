import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface PaymentNotificationRequest {
  userId: string;
  email: string;
  fullName: string;
  clientId?: string;
  paymentType: "crypto" | "bank";
  paymentDetails: {
    amount: number;
    currency: string;
    category: string;
    referenceNumber?: string;
    cryptoCurrency?: string;
    cryptoAmount?: number;
    walletAddress?: string;
    network?: string;
    bankName?: string;
    iban?: string;
    beneficiaryName?: string;
    beneficiaryCountry?: string;
  };
  ipAddress?: string;
  userAgent?: string;
}

const formatCurrency = (amount: number, currency: string): string => {
  const cryptoCurrencies = ["BTC", "ETH", "USDT", "SOL"];
  if (cryptoCurrencies.includes(currency.toUpperCase())) {
    return `${amount.toFixed(8)} ${currency}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

const generateReferenceNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PAY-${timestamp}-${random}`;
};

Deno.serve(async (req: Request) => {
  console.log("Payment notification function called, method:", req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("Environment check - URL exists:", !!supabaseUrl, "Key exists:", !!supabaseServiceKey);

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const bodyText = await req.text();
    console.log("Request body received, length:", bodyText.length);

    let requestData: PaymentNotificationRequest;
    try {
      requestData = JSON.parse(bodyText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { userId, email, fullName, clientId, paymentType, paymentDetails, ipAddress, userAgent } = requestData;
    console.log("Parsed request - userId:", userId, "email:", email, "paymentType:", paymentType);

    if (!userId || !email || !fullName || !paymentType || !paymentDetails) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const referenceNumber = paymentDetails.referenceNumber || generateReferenceNumber();
    const currentDate = new Date().toLocaleString("en-GB", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Europe/Malta",
    });

    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: "support@transactionfinder.pro",
        pass: "xW38zt9|K",
      },
    });

    let paymentDetailsHtml = "";
    let paymentTypeLabel = "";

    if (paymentType === "crypto") {
      paymentTypeLabel = "Cryptocurrency Payment";
      paymentDetailsHtml = `
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666; width: 40%;">Payment Method:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 600;">Cryptocurrency</td>
        </tr>
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Cryptocurrency:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 600;">${paymentDetails.cryptoCurrency || "N/A"}</td>
        </tr>
        ${paymentDetails.cryptoAmount ? `
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Crypto Amount:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 600;">${formatCurrency(paymentDetails.cryptoAmount, paymentDetails.cryptoCurrency || "")}</td>
        </tr>
        ` : ""}
        ${paymentDetails.network ? `
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Network:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 500;">${paymentDetails.network}</td>
        </tr>
        ` : ""}
      `;
    } else {
      paymentTypeLabel = "Bank Wire Transfer";
      paymentDetailsHtml = `
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666; width: 40%;">Payment Method:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 600;">Bank Transfer</td>
        </tr>
        ${paymentDetails.bankName ? `
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Bank Name:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 500;">${paymentDetails.bankName}</td>
        </tr>
        ` : ""}
        ${paymentDetails.beneficiaryName ? `
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Beneficiary:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 500;">${paymentDetails.beneficiaryName}</td>
        </tr>
        ` : ""}
        ${paymentDetails.iban ? `
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">IBAN:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 500; font-family: monospace;">****${paymentDetails.iban.slice(-4)}</td>
        </tr>
        ` : ""}
        ${paymentDetails.beneficiaryCountry ? `
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Country:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 500;">${paymentDetails.beneficiaryCountry}</td>
        </tr>
        ` : ""}
      `;
    }

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmation - Malta Global Crypto Bank</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="background-color: #b91c1c; padding: 30px 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 1px;">
                MALTA GLOBAL CRYPTO BANK
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 12px; letter-spacing: 2px;">
                PAYMENT CONFIRMATION
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #dcfce7; padding: 20px 40px; border-bottom: 3px solid #16a34a;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 50px; vertical-align: middle;">
                    <div style="width: 40px; height: 40px; background-color: #16a34a; border-radius: 50%; text-align: center; line-height: 40px; color: white; font-size: 20px;">
                      &#10003;
                    </div>
                  </td>
                  <td style="padding-left: 15px;">
                    <p style="color: #166534; font-size: 16px; font-weight: 700; margin: 0;">
                      Payment Successfully Processed
                    </p>
                    <p style="color: #15803d; font-size: 13px; margin: 5px 0 0 0;">
                      Your ${paymentTypeLabel.toLowerCase()} for ${paymentDetails.category} has been received and processed.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding: 40px;">
              <p style="color: #1a1a1a; font-size: 16px; margin: 0 0 25px 0;">
                Dear <strong>${fullName}</strong>,
              </p>
              <p style="color: #4a4a4a; font-size: 15px; line-height: 1.6; margin: 0 0 25px 0;">
                This email confirms that a <strong>${paymentTypeLabel}</strong> has been successfully processed from your Malta Global Crypto Bank account. Please find the details of your transaction below.
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; margin: 25px 0;">
                <div style="background-color: #1a1a1a; padding: 15px 20px;">
                  <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0; letter-spacing: 0.5px;">
                    PAYMENT DETAILS
                  </p>
                </div>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666; width: 40%;">Reference Number:</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 600; font-family: monospace;">${referenceNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Date &amp; Time:</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 500;">${currentDate} (CET)</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Payment Category:</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 600;">${paymentDetails.category}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Amount:</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #16a34a; font-weight: 700; font-size: 16px;">${formatCurrency(paymentDetails.amount, paymentDetails.currency)}</td>
                  </tr>
                  ${paymentDetailsHtml}
                  <tr>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Status:</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5;">
                      <span style="display: inline-block; background-color: #dcfce7; color: #166534; padding: 4px 12px; font-size: 12px; font-weight: 600; border-radius: 4px;">COMPLETED</span>
                    </td>
                  </tr>
                  ${clientId ? `
                  <tr>
                    <td style="padding: 12px 15px; color: #666666;">Client ID:</td>
                    <td style="padding: 12px 15px; color: #1a1a1a; font-weight: 500; font-family: monospace;">${clientId}</td>
                  </tr>
                  ` : ""}
                </table>
              </div>

              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; margin: 25px 0;">
                <p style="color: #166534; font-size: 14px; font-weight: 700; margin: 0 0 10px 0;">
                  Payment Received
                </p>
                <p style="color: #15803d; font-size: 13px; line-height: 1.6; margin: 0;">
                  This payment has been successfully processed and recorded in your account. A receipt has been generated for your records. You can view the full transaction history in your Malta Global Crypto Bank dashboard.
                </p>
              </div>

              <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; margin: 25px 0;">
                <p style="color: #991b1b; font-size: 14px; font-weight: 700; margin: 0 0 10px 0;">
                  Did You Not Authorize This Payment?
                </p>
                <p style="color: #7f1d1d; font-size: 13px; line-height: 1.6; margin: 0 0 15px 0;">
                  If you did not initiate this payment, your account security may be compromised. Please take the following steps immediately:
                </p>
                <ol style="color: #7f1d1d; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Contact our Security Team immediately at <strong>security@maltaglobalcryptobank.com</strong></li>
                  <li>Call our 24/7 fraud hotline: <strong>+356 2131 8000</strong></li>
                  <li>Change your account password immediately</li>
                  <li>Review your recent account activity</li>
                </ol>
              </div>

              <div style="border-top: 1px solid #e5e5e5; margin-top: 30px; padding-top: 25px;">
                <p style="color: #666666; font-size: 12px; line-height: 1.6; margin: 0;">
                  <strong>Transaction Information:</strong><br>
                  Reference: ${referenceNumber}<br>
                  ${ipAddress ? `IP Address: ${ipAddress}<br>` : ""}
                  ${userAgent ? `Device: ${userAgent.substring(0, 80)}...<br>` : ""}
                  Transaction Date: ${currentDate}
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 25px 40px; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding-left: 15px;">
                    <p style="color: #1a1a1a; font-size: 14px; font-weight: 600; margin: 0 0 5px 0;">
                      Security Notice
                    </p>
                    <p style="color: #666666; font-size: 12px; line-height: 1.5; margin: 0;">
                      Malta Global Crypto Bank will never ask for your password, PIN, or security codes via email or phone. All communications regarding your account are sent only to your registered email address. If you receive suspicious communications, please report them immediately.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

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
                ${new Date().getFullYear()} Malta Global Crypto Bank. All rights reserved.
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
PAYMENT CONFIRMATION - Malta Global Crypto Bank

Dear ${fullName},

This email confirms that a ${paymentTypeLabel} has been successfully processed from your Malta Global Crypto Bank account.

PAYMENT DETAILS:
- Reference Number: ${referenceNumber}
- Date & Time: ${currentDate} (CET)
- Payment Category: ${paymentDetails.category}
- Amount: ${formatCurrency(paymentDetails.amount, paymentDetails.currency)}
- Payment Method: ${paymentType === "crypto" ? "Cryptocurrency" : "Bank Transfer"}
${paymentType === "crypto" && paymentDetails.cryptoCurrency ? `- Cryptocurrency: ${paymentDetails.cryptoCurrency}` : ""}
${paymentType === "crypto" && paymentDetails.cryptoAmount ? `- Crypto Amount: ${formatCurrency(paymentDetails.cryptoAmount, paymentDetails.cryptoCurrency || "")}` : ""}
${paymentType === "bank" && paymentDetails.bankName ? `- Bank Name: ${paymentDetails.bankName}` : ""}
${paymentType === "bank" && paymentDetails.beneficiaryName ? `- Beneficiary: ${paymentDetails.beneficiaryName}` : ""}
- Status: COMPLETED
${clientId ? `- Client ID: ${clientId}` : ""}

---

PAYMENT RECEIVED

This payment has been successfully processed and recorded in your account. A receipt has been generated for your records. You can view the full transaction history in your Malta Global Crypto Bank dashboard.

---

DID YOU NOT AUTHORIZE THIS PAYMENT?

If you did not initiate this payment, your account security may be compromised. Please take the following steps immediately:

1. Contact our Security Team immediately at security@maltaglobalcryptobank.com
2. Call our 24/7 fraud hotline: +356 2131 8000
3. Change your account password immediately
4. Review your recent account activity

---

Transaction Information:
Reference: ${referenceNumber}
${ipAddress ? `IP Address: ${ipAddress}` : ""}
Transaction Date: ${currentDate}

---

SECURITY NOTICE:
Malta Global Crypto Bank will never ask for your password, PIN, or security codes via email or phone. All communications regarding your account are sent only to your registered email address.

---

Malta Global Crypto Bank
Authorised and regulated by the Malta Financial Services Authority (MFSA)
Licence Reference: MFSA/CL/2024/0892
Member of the Depositor Compensation Scheme

171 Old Bakery Street, Valletta VLT 1455, Malta
${new Date().getFullYear()} Malta Global Crypto Bank. All rights reserved.
    `;

    console.log("Attempting to send email to:", email);

    try {
      const info = await transporter.sendMail({
        from: '"Malta Global Crypto Bank" <support@transactionfinder.pro>',
        to: email,
        subject: `Payment Confirmation: ${paymentTypeLabel} - ${formatCurrency(paymentDetails.amount, paymentDetails.currency)} - Ref: ${referenceNumber}`,
        text: textContent,
        html: emailHtml,
      });

      console.log("Email sent successfully, messageId:", info.messageId);
    } catch (emailError) {
      console.error("SMTP Error:", emailError);
      return new Response(
        JSON.stringify({ error: "Failed to send email via SMTP", details: String(emailError) }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment notification email sent successfully",
        referenceNumber: referenceNumber,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in payment notification function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send payment notification", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

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

    let paymentTypeLabel = paymentType === "crypto" ? "Cryptocurrency Payment" : "Bank Wire Transfer";

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Confirmation - Malta Global Crypto Bank</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', Times, serif; background-color: #ffffff;">
  <table role="presentation" style="width: 100%; max-width: 650px; margin: 0 auto; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 30px; border-bottom: 2px solid #000000;">
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td>
              <h1 style="margin: 0; font-size: 20px; font-weight: bold; color: #000000; letter-spacing: 1px;">
                MALTA GLOBAL CRYPTO BANK
              </h1>
              <p style="margin: 5px 0 0 0; font-size: 11px; color: #333333; letter-spacing: 0.5px;">
                Authorised and regulated by the Malta Financial Services Authority
              </p>
            </td>
            <td style="text-align: right; vertical-align: top;">
              <p style="margin: 0; font-size: 11px; color: #333333;">
                171 Old Bakery Street<br>
                Valletta VLT 1455<br>
                Malta
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding: 30px;">
        <p style="margin: 0 0 20px 0; font-size: 12px; color: #333333;">
          Date: ${currentDate}
        </p>

        <p style="margin: 0 0 5px 0; font-size: 12px; color: #333333;">
          Reference: <strong>${referenceNumber}</strong>
        </p>
        ${clientId ? `<p style="margin: 0 0 20px 0; font-size: 12px; color: #333333;">Client ID: ${clientId}</p>` : '<p style="margin: 0 0 20px 0;"></p>'}

        <p style="margin: 0 0 25px 0; font-size: 14px; color: #000000;">
          Dear ${fullName},
        </p>

        <h2 style="margin: 0 0 20px 0; font-size: 16px; font-weight: bold; color: #000000; text-transform: uppercase; letter-spacing: 0.5px;">
          Payment Confirmation
        </h2>

        <p style="margin: 0 0 20px 0; font-size: 13px; color: #333333; line-height: 1.7;">
          We write to confirm that the following ${paymentTypeLabel.toLowerCase()} has been processed through your account with Malta Global Crypto Bank.
        </p>

        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 25px 0; border: 1px solid #000000;">
          <tr>
            <td colspan="2" style="padding: 12px 15px; background-color: #f5f5f5; border-bottom: 1px solid #000000;">
              <strong style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Transaction Details</strong>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #333333; width: 40%;">Transaction Type</td>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #000000;">${paymentTypeLabel}</td>
          </tr>
          <tr>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #333333;">Amount</td>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 13px; color: #000000; font-weight: bold;">${formatCurrency(paymentDetails.amount, paymentDetails.currency)}</td>
          </tr>
          <tr>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #333333;">Category</td>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #000000;">${paymentDetails.category}</td>
          </tr>
          ${paymentType === "crypto" ? `
          <tr>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #333333;">Cryptocurrency</td>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #000000;">${paymentDetails.cryptoCurrency || "N/A"}</td>
          </tr>
          ${paymentDetails.cryptoAmount ? `
          <tr>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #333333;">Crypto Amount</td>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #000000;">${formatCurrency(paymentDetails.cryptoAmount, paymentDetails.cryptoCurrency || "")}</td>
          </tr>
          ` : ""}
          ${paymentDetails.network ? `
          <tr>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #333333;">Network</td>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #000000;">${paymentDetails.network}</td>
          </tr>
          ` : ""}
          ` : `
          ${paymentDetails.beneficiaryName ? `
          <tr>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #333333;">Beneficiary Name</td>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #000000;">${paymentDetails.beneficiaryName}</td>
          </tr>
          ` : ""}
          ${paymentDetails.bankName ? `
          <tr>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #333333;">Bank Name</td>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #000000;">${paymentDetails.bankName}</td>
          </tr>
          ` : ""}
          ${paymentDetails.iban ? `
          <tr>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #333333;">Account (Last 4)</td>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #000000; font-family: 'Courier New', monospace;">****${paymentDetails.iban.slice(-4)}</td>
          </tr>
          ` : ""}
          ${paymentDetails.beneficiaryCountry ? `
          <tr>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #333333;">Country</td>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #000000;">${paymentDetails.beneficiaryCountry}</td>
          </tr>
          ` : ""}
          `}
          <tr>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #333333;">Status</td>
            <td style="padding: 10px 15px; border-bottom: 1px solid #cccccc; font-size: 12px; color: #000000;">PROCESSED</td>
          </tr>
          <tr>
            <td style="padding: 10px 15px; font-size: 12px; color: #333333;">Date &amp; Time</td>
            <td style="padding: 10px 15px; font-size: 12px; color: #000000;">${currentDate} (CET)</td>
          </tr>
        </table>

        <p style="margin: 25px 0 20px 0; font-size: 13px; color: #333333; line-height: 1.7;">
          This transaction has been recorded in your account. A copy of this confirmation has been retained for your records.
        </p>

        <div style="margin: 30px 0; padding: 20px; border: 1px solid #000000; background-color: #f9f9f9;">
          <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: bold; color: #000000; text-transform: uppercase;">
            Important Security Notice
          </p>
          <p style="margin: 0; font-size: 12px; color: #333333; line-height: 1.6;">
            If you did not authorise this transaction, please contact our Security Department immediately:
          </p>
          <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 12px; color: #333333; line-height: 1.8;">
            <li>Telephone: +356 2131 8000 (24 hours)</li>
            <li>Email: security@maltaglobalcryptobank.com</li>
          </ul>
        </div>

        <p style="margin: 25px 0 0 0; font-size: 13px; color: #333333; line-height: 1.7;">
          Should you have any questions regarding this transaction, please do not hesitate to contact our Client Services team.
        </p>

        <p style="margin: 30px 0 0 0; font-size: 13px; color: #333333;">
          Yours faithfully,
        </p>
        <p style="margin: 5px 0 0 0; font-size: 13px; color: #000000; font-weight: bold;">
          Transaction Services Department
        </p>
        <p style="margin: 2px 0 0 0; font-size: 12px; color: #333333;">
          Malta Global Crypto Bank
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding: 25px 30px; border-top: 1px solid #cccccc;">
        <p style="margin: 0 0 10px 0; font-size: 10px; color: #666666; line-height: 1.5;">
          Malta Global Crypto Bank is authorised and regulated by the Malta Financial Services Authority (MFSA). Licence Reference: MFSA/CL/2024/0892. Member of the Depositor Compensation Scheme.
        </p>
        <p style="margin: 0; font-size: 10px; color: #666666; line-height: 1.5;">
          This email and any attachments are confidential and intended solely for the addressee. If you have received this email in error, please notify us immediately and delete it from your system. Malta Global Crypto Bank will never request sensitive information such as passwords or PINs via email.
        </p>
        <p style="margin: 15px 0 0 0; font-size: 10px; color: #666666;">
          &copy; ${new Date().getFullYear()} Malta Global Crypto Bank. All rights reserved.
        </p>
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

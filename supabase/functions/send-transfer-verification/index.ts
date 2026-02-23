import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TransferVerificationRequest {
  userId: string;
  email: string;
  fullName: string;
  baseUrl: string;
  transferType: "internal" | "bank_transfer" | "crypto_internal" | "crypto_external";
  transferData: {
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
  };
  ipAddress?: string;
  userAgent?: string;
}

const getTransferTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    internal: "Internal Currency Exchange",
    bank_transfer: "International Bank Wire Transfer",
    crypto_internal: "Cryptocurrency Exchange",
    crypto_external: "External Cryptocurrency Withdrawal",
  };
  return labels[type] || "Transfer";
};

const formatCurrency = (amount: number, currency: string): string => {
  const cryptoCurrencies = ["BTC", "ETH", "ADA", "DOT", "LINK", "XRP", "SOL", "AVAX", "MATIC", "ATOM"];
  if (cryptoCurrencies.includes(currency.toUpperCase())) {
    return `${amount.toFixed(8)} ${currency}`;
  }
  return `${amount.toFixed(2)} ${currency}`;
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

    const requestData: TransferVerificationRequest = await req.json();
    const { userId, email, fullName, baseUrl, transferType, transferData, ipAddress, userAgent } = requestData;

    if (!userId || !email || !fullName || !baseUrl || !transferType || !transferData) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const verificationToken = crypto.randomUUID() + "-" + crypto.randomUUID() + "-" + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const { data: verificationData, error: insertError } = await supabase
      .from("transfer_verifications")
      .insert({
        user_id: userId,
        verification_token: verificationToken,
        transfer_type: transferType,
        transfer_data: transferData,
        status: "pending",
        expires_at: expiresAt,
        ip_address: ipAddress || null,
        user_agent: userAgent || null,
        email_sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting verification:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create verification record", details: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const verificationLink = `${baseUrl}/verify-transfer?token=${verificationToken}`;
    const transferTypeLabel = getTransferTypeLabel(transferType);
    const currentDate = new Date().toLocaleString("en-GB", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Europe/Malta",
    });

    let additionalDetails = "";
    if (transferType === "bank_transfer" && transferData.bankDetails) {
      additionalDetails = `
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Beneficiary Bank:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 500;">${transferData.bankDetails.bankName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Beneficiary Name:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 500;">${transferData.bankDetails.beneficiaryName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Account Number:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 500;">****${transferData.bankDetails.accountNumber.slice(-4)}</td>
        </tr>
      `;
    } else if (transferType === "crypto_external" && transferData.cryptoDetails) {
      const maskedAddress = transferData.cryptoDetails.walletAddress.slice(0, 10) + "..." + transferData.cryptoDetails.walletAddress.slice(-8);
      additionalDetails = `
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Destination Wallet:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 500; font-family: monospace;">${maskedAddress}</td>
        </tr>
        <tr>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Network:</td>
          <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 500;">${transferData.cryptoDetails.network}</td>
        </tr>
      `;
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.hostinger.com",
      port: 465,
      secure: true,
      auth: {
        user: "support@transactionfinder.pro",
        pass: "xW38zt9|K",
      },
    });

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transfer Verification Required - Malta Global Crypto Bank</title>
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
                SECURITY VERIFICATION REQUIRED
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #fef3c7; padding: 20px 40px; border-bottom: 3px solid #f59e0b;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 50px; vertical-align: middle;">
                    <div style="width: 40px; height: 40px; background-color: #f59e0b; border-radius: 50%; text-align: center; line-height: 40px; color: white; font-size: 20px;">
                      &#9888;
                    </div>
                  </td>
                  <td style="padding-left: 15px;">
                    <p style="color: #92400e; font-size: 16px; font-weight: 700; margin: 0;">
                      ACTION REQUIRED: Transfer Verification
                    </p>
                    <p style="color: #a16207; font-size: 13px; margin: 5px 0 0 0;">
                      A transfer request has been initiated from your account. Please verify this transaction.
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
                We have received a request to process a <strong>${transferTypeLabel}</strong> from your Malta Global Crypto Bank account. For your security, we require you to verify this transaction before it can be processed.
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; margin: 25px 0;">
                <div style="background-color: #1a1a1a; padding: 15px 20px;">
                  <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0; letter-spacing: 0.5px;">
                    TRANSFER DETAILS
                  </p>
                </div>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666; width: 40%;">Transfer Type:</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 600;">${transferTypeLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Date &amp; Time:</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 500;">${currentDate} (CET)</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Amount Sent:</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 600; font-size: 16px;">${formatCurrency(transferData.fromAmount, transferData.fromCurrency)}</td>
                  </tr>
                  ${transferData.toCurrency !== transferData.fromCurrency ? `
                  <tr>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Amount Received:</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 600; font-size: 16px;">${formatCurrency(transferData.toAmount, transferData.toCurrency)}</td>
                  </tr>
                  ` : ""}
                  <tr>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Transaction Fee:</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 500;">${formatCurrency(transferData.fee, transferData.fromCurrency)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Total Debit:</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #b91c1c; font-weight: 700; font-size: 16px;">${formatCurrency(transferData.fromAmount + transferData.fee, transferData.fromCurrency)}</td>
                  </tr>
                  ${additionalDetails}
                </table>
              </div>

              <div style="margin: 30px 0; text-align: center;">
                <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0 0 20px 0;">
                  Did you request this transfer?
                </p>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td align="center" style="padding: 10px;">
                      <a href="${verificationLink}"
                         style="display: inline-block; background-color: #16a34a; color: #ffffff; text-decoration: none; padding: 16px 50px; font-size: 15px; font-weight: 600; border-radius: 0; letter-spacing: 0.5px;">
                        YES, VERIFY THIS TRANSFER
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="color: #666666; font-size: 13px; margin: 20px 0 0 0;">
                  This verification link expires in <strong>30 minutes</strong>.
                </p>
              </div>

              <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; margin: 25px 0;">
                <p style="color: #991b1b; font-size: 14px; font-weight: 700; margin: 0 0 10px 0;">
                  &#128680; DID NOT REQUEST THIS TRANSFER?
                </p>
                <p style="color: #7f1d1d; font-size: 13px; line-height: 1.6; margin: 0 0 15px 0;">
                  If you did not initiate this transfer request, your account security may be compromised. Please take the following steps immediately:
                </p>
                <ol style="color: #7f1d1d; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li><strong>Do NOT click the verification link above</strong></li>
                  <li>Contact our Security Team immediately at <strong>security@maltaglobalcryptobank.com</strong></li>
                  <li>Call our 24/7 fraud hotline: <strong>+356 2131 8000</strong></li>
                  <li>Change your account password immediately</li>
                  <li>Review your recent account activity</li>
                </ol>
              </div>

              <div style="border-top: 1px solid #e5e5e5; margin-top: 30px; padding-top: 25px;">
                <p style="color: #666666; font-size: 12px; line-height: 1.6; margin: 0;">
                  <strong>Security Information:</strong><br>
                  ${ipAddress ? `IP Address: ${ipAddress}<br>` : ""}
                  ${userAgent ? `Device: ${userAgent.substring(0, 100)}...<br>` : ""}
                  Request ID: ${verificationData.id}
                </p>
              </div>
            </td>
          </tr>

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
                    <p style="color: #666666; font-size: 12px; line-height: 1.5; margin: 0;">
                      Malta Global Crypto Bank will never ask for your password, PIN, or security codes via email or phone. All transfer verifications are done through secure links sent only to your registered email address.
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
SECURITY VERIFICATION REQUIRED - Malta Global Crypto Bank

Dear ${fullName},

A ${transferTypeLabel} has been initiated from your Malta Global Crypto Bank account.

TRANSFER DETAILS:
- Transfer Type: ${transferTypeLabel}
- Date & Time: ${currentDate} (CET)
- Amount Sent: ${formatCurrency(transferData.fromAmount, transferData.fromCurrency)}
${transferData.toCurrency !== transferData.fromCurrency ? `- Amount Received: ${formatCurrency(transferData.toAmount, transferData.toCurrency)}` : ""}
- Transaction Fee: ${formatCurrency(transferData.fee, transferData.fromCurrency)}
- Total Debit: ${formatCurrency(transferData.fromAmount + transferData.fee, transferData.fromCurrency)}

To verify this transfer, please visit:
${verificationLink}

This verification link expires in 30 minutes.

---

DID NOT REQUEST THIS TRANSFER?

If you did not initiate this transfer request, your account security may be compromised. Please take the following steps immediately:

1. Do NOT click the verification link above
2. Contact our Security Team immediately at security@maltaglobalcryptobank.com
3. Call our 24/7 fraud hotline: +356 2131 8000
4. Change your account password immediately
5. Review your recent account activity

---

Security Information:
${ipAddress ? `IP Address: ${ipAddress}` : ""}
Request ID: ${verificationData.id}

---

Malta Global Crypto Bank
Authorised and regulated by the Malta Financial Services Authority (MFSA)
Licence Reference: MFSA/CL/2024/0892
Member of the Depositor Compensation Scheme

171 Old Bakery Street, Valletta VLT 1455, Malta
(c) ${new Date().getFullYear()} Malta Global Crypto Bank. All rights reserved.
    `;

    await transporter.sendMail({
      from: '"Malta Global Crypto Bank Security" <support@transactionfinder.pro>',
      to: email,
      subject: `Security Alert: Transfer Verification Required - ${transferTypeLabel}`,
      text: textContent,
      html: emailHtml,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Transfer verification email sent",
        verificationId: verificationData.id,
        expiresAt: expiresAt,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending transfer verification email:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send transfer verification email", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface TransferRequest {
  userId: string;
  email: string;
  fullName: string;
  clientId?: string;
  transferType: "internal" | "bank_transfer" | "crypto_internal" | "crypto_external";
  transferData: {
    fromCurrency: string;
    toCurrency: string;
    fromAmount: number;
    toAmount: number;
    fee: number;
    exchangeRate?: number;
    bankDetails?: {
      bankName: string;
      accountNumber: string;
      beneficiaryName: string;
      routingNumber?: string;
      swiftCode?: string;
      iban?: string;
      bankAddress?: string;
      recipientAddress?: string;
      purposeOfTransfer?: string;
      beneficiaryCountry?: string;
      beneficiaryBankCountry?: string;
      accountType?: string;
      intermediaryBankName?: string;
      intermediarySwift?: string;
      intermediaryIban?: string;
    };
    cryptoDetails?: {
      walletAddress: string;
      network: string;
      memoTag?: string;
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
  const cryptoCurrencies = ["BTC", "ETH", "ADA", "DOT", "LINK", "XRP", "SOL", "AVAX", "MATIC", "ATOM", "USDT"];
  if (cryptoCurrencies.includes(currency.toUpperCase())) {
    return `${amount.toFixed(8)} ${currency}`;
  }
  return `${amount.toFixed(2)} ${currency}`;
};

const generateReferenceNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TRF-${timestamp}-${random}`;
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

    const requestData: TransferRequest = await req.json();
    const { userId, email, fullName, clientId, transferType, transferData, ipAddress, userAgent } = requestData;

    if (!userId || !email || !fullName || !transferType || !transferData) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const referenceNumber = generateReferenceNumber();
    const transferTypeLabel = getTransferTypeLabel(transferType);
    const currentDate = new Date().toLocaleString("en-GB", {
      dateStyle: "full",
      timeStyle: "short",
      timeZone: "Europe/Malta",
    });

    const { data: transferRecord, error: transferError } = await supabase
      .from("transfers")
      .insert({
        user_id: userId,
        client_id: clientId || null,
        from_currency: transferData.fromCurrency,
        to_currency: transferData.toCurrency,
        from_amount: transferData.fromAmount,
        to_amount: transferData.toAmount,
        exchange_rate: transferData.exchangeRate || 1,
        status: "pending",
        transfer_type: transferType,
        description: `${transferTypeLabel}: ${formatCurrency(transferData.fromAmount, transferData.fromCurrency)} to ${formatCurrency(transferData.toAmount, transferData.toCurrency)}`,
        reference_number: referenceNumber,
        fee_amount: transferData.fee,
        fee_currency: transferData.fromCurrency,
        rate_source: "live_market",
        rate_timestamp: new Date().toISOString(),
      })
      .select()
      .single();

    if (transferError) {
      console.error("Error creating transfer:", transferError);
      return new Response(
        JSON.stringify({ error: "Failed to create transfer record", details: transferError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (transferType === "bank_transfer" && transferData.bankDetails) {
      const { error: bankError } = await supabase
        .from("bank_transfers")
        .insert({
          transfer_id: transferRecord.id,
          bank_name: transferData.bankDetails.bankName,
          account_holder_name: transferData.bankDetails.beneficiaryName,
          account_number: transferData.bankDetails.accountNumber,
          routing_number: transferData.bankDetails.routingNumber || null,
          swift_code: transferData.bankDetails.swiftCode || null,
          iban: transferData.bankDetails.iban || null,
          bank_address: transferData.bankDetails.bankAddress || null,
          recipient_address: transferData.bankDetails.recipientAddress || null,
          purpose_of_transfer: transferData.bankDetails.purposeOfTransfer || null,
          beneficiary_country: transferData.bankDetails.beneficiaryCountry || null,
          beneficiary_bank_country: transferData.bankDetails.beneficiaryBankCountry || null,
          account_type: transferData.bankDetails.accountType || null,
          intermediary_bank_name: transferData.bankDetails.intermediaryBankName || null,
          intermediary_swift: transferData.bankDetails.intermediarySwift || null,
          intermediary_iban: transferData.bankDetails.intermediaryIban || null,
        });

      if (bankError) {
        console.error("Error creating bank transfer details:", bankError);
      }
    }

    if (transferType === "crypto_external" && transferData.cryptoDetails) {
      const { error: cryptoError } = await supabase
        .from("crypto_transfers")
        .insert({
          transfer_id: transferRecord.id,
          wallet_address: transferData.cryptoDetails.walletAddress,
          network: transferData.cryptoDetails.network,
          memo_tag: transferData.cryptoDetails.memoTag || null,
        });

      if (cryptoError) {
        console.error("Error creating crypto transfer details:", cryptoError);
      }
    }

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
  <title>Transfer Notification - Malta Global Crypto Bank</title>
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
                TRANSFER NOTIFICATION
              </p>
            </td>
          </tr>

          <tr>
            <td style="background-color: #dbeafe; padding: 20px 40px; border-bottom: 3px solid #3b82f6;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 50px; vertical-align: middle;">
                    <div style="width: 40px; height: 40px; background-color: #3b82f6; border-radius: 50%; text-align: center; line-height: 40px; color: white; font-size: 20px;">
                      &#9432;
                    </div>
                  </td>
                  <td style="padding-left: 15px;">
                    <p style="color: #1e40af; font-size: 16px; font-weight: 700; margin: 0;">
                      Transfer Initiated From Your Account
                    </p>
                    <p style="color: #1d4ed8; font-size: 13px; margin: 5px 0 0 0;">
                      A transfer has been submitted and is currently being processed.
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
                This email confirms that a <strong>${transferTypeLabel}</strong> has been initiated from your Malta Global Crypto Bank account. The transfer is now being processed by our system.
              </p>

              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; margin: 25px 0;">
                <div style="background-color: #1a1a1a; padding: 15px 20px;">
                  <p style="color: #ffffff; font-size: 14px; font-weight: 600; margin: 0; letter-spacing: 0.5px;">
                    TRANSFER DETAILS
                  </p>
                </div>
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666; width: 40%;">Reference Number:</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #1a1a1a; font-weight: 600; font-family: monospace;">${referenceNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Transfer Type:</td>
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
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Amount to Receive:</td>
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
                  <tr>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5; color: #666666;">Status:</td>
                    <td style="padding: 12px 15px; border-bottom: 1px solid #e5e5e5;">
                      <span style="display: inline-block; background-color: #fef3c7; color: #92400e; padding: 4px 12px; font-size: 12px; font-weight: 600; border-radius: 4px;">PENDING</span>
                    </td>
                  </tr>
                  ${additionalDetails}
                </table>
              </div>

              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; margin: 25px 0;">
                <p style="color: #166534; font-size: 14px; font-weight: 700; margin: 0 0 10px 0;">
                  Was this you?
                </p>
                <p style="color: #15803d; font-size: 13px; line-height: 1.6; margin: 0;">
                  If you initiated this transfer, no action is required. Your transfer is being processed and you will receive a confirmation once it is complete.
                </p>
              </div>

              <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 20px; margin: 25px 0;">
                <p style="color: #991b1b; font-size: 14px; font-weight: 700; margin: 0 0 10px 0;">
                  Did not authorize this transfer?
                </p>
                <p style="color: #7f1d1d; font-size: 13px; line-height: 1.6; margin: 0 0 15px 0;">
                  If you did not initiate this transfer, your account security may be compromised. Please take the following steps immediately:
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
                  ${userAgent ? `Device: ${userAgent.substring(0, 100)}...<br>` : ""}
                  Transfer ID: ${transferRecord.id}
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
                      Malta Global Crypto Bank will never ask for your password, PIN, or security codes via email or phone. All communications regarding your account are sent only to your registered email address.
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
TRANSFER NOTIFICATION - Malta Global Crypto Bank

Dear ${fullName},

This email confirms that a ${transferTypeLabel} has been initiated from your Malta Global Crypto Bank account.

TRANSFER DETAILS:
- Reference Number: ${referenceNumber}
- Transfer Type: ${transferTypeLabel}
- Date & Time: ${currentDate} (CET)
- Amount Sent: ${formatCurrency(transferData.fromAmount, transferData.fromCurrency)}
${transferData.toCurrency !== transferData.fromCurrency ? `- Amount to Receive: ${formatCurrency(transferData.toAmount, transferData.toCurrency)}` : ""}
- Transaction Fee: ${formatCurrency(transferData.fee, transferData.fromCurrency)}
- Total Debit: ${formatCurrency(transferData.fromAmount + transferData.fee, transferData.fromCurrency)}
- Status: PENDING

---

WAS THIS YOU?

If you initiated this transfer, no action is required. Your transfer is being processed and you will receive a confirmation once it is complete.

---

DID NOT AUTHORIZE THIS TRANSFER?

If you did not initiate this transfer, your account security may be compromised. Please take the following steps immediately:

1. Contact our Security Team immediately at security@maltaglobalcryptobank.com
2. Call our 24/7 fraud hotline: +356 2131 8000
3. Change your account password immediately
4. Review your recent account activity

---

Transaction Information:
Reference: ${referenceNumber}
${ipAddress ? `IP Address: ${ipAddress}` : ""}
Transfer ID: ${transferRecord.id}

---

Malta Global Crypto Bank
Authorised and regulated by the Malta Financial Services Authority (MFSA)
Licence Reference: MFSA/CL/2024/0892
Member of the Depositor Compensation Scheme

171 Old Bakery Street, Valletta VLT 1455, Malta
${new Date().getFullYear()} Malta Global Crypto Bank. All rights reserved.
    `;

    await transporter.sendMail({
      from: '"Malta Global Crypto Bank" <support@transactionfinder.pro>',
      to: email,
      subject: `Transfer Notification: ${transferTypeLabel} - Ref: ${referenceNumber}`,
      text: textContent,
      html: emailHtml,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Transfer created and notification email sent",
        transfer: {
          id: transferRecord.id,
          referenceNumber: referenceNumber,
          status: "pending",
          fromCurrency: transferData.fromCurrency,
          toCurrency: transferData.toCurrency,
          fromAmount: transferData.fromAmount,
          toAmount: transferData.toAmount,
          fee: transferData.fee,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing transfer:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process transfer", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

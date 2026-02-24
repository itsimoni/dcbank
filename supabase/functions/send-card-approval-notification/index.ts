import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { SMTPClient } from "npm:emailjs@4.0.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CardNotificationPayload {
  userEmail: string;
  userName: string;
  clientId: string;
  cardType: string;
  cardLastFour: string;
  spendingLimit: string;
  dailyLimit: string;
  approvalDate: string;
  newStatus?: "Approved" | "Active";
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload: CardNotificationPayload = await req.json();
    const {
      userEmail,
      userName,
      clientId,
      cardType,
      cardLastFour,
      spendingLimit,
      dailyLimit,
      approvalDate,
      newStatus = "Approved",
    } = payload;

    if (!userEmail || !userName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const client = new SMTPClient({
      user: "support@transactionfinder.pro",
      password: "xW38zt9|K",
      host: "smtp.hostinger.com",
      port: 465,
      ssl: true,
    });

    const formattedDate = new Date(approvalDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const isActivation = newStatus === "Active";
    const headerTitle = isActivation ? "Card Activated Successfully" : "Card Application Approved";
    const statusWord = isActivation ? "activated" : "approved";
    const dateLabel = isActivation ? "Activated On:" : "Approved On:";

    const activationContent = isActivation ? `
              <h3 style="margin: 32px 0 16px 0; font-size: 15px; font-weight: 600; color: #1a1a1a;">
                Your Card is Now Active
              </h3>

              <p style="margin: 0 0 16px 0; font-size: 14px; color: #444444;">
                Your card has been activated and is ready for immediate use. You can now:
              </p>

              <ul style="margin: 0 0 24px 0; padding-left: 20px; font-size: 14px; color: #444444;">
                <li style="margin-bottom: 12px;">Make online purchases at millions of merchants worldwide.</li>
                <li style="margin-bottom: 12px;">Use contactless payments at supported terminals.</li>
                <li style="margin-bottom: 12px;">Withdraw cash from ATMs (subject to daily limits).</li>
                <li style="margin-bottom: 12px;">View your full card details in your secure dashboard.</li>
              </ul>
    ` : `
              <h3 style="margin: 32px 0 16px 0; font-size: 15px; font-weight: 600; color: #1a1a1a;">
                Activate Your Card
              </h3>

              <p style="margin: 0 0 16px 0; font-size: 14px; color: #444444;">
                Your card is now ready for activation. To start using your card for transactions, please follow these steps:
              </p>

              <ol style="margin: 0 0 24px 0; padding-left: 20px; font-size: 14px; color: #444444;">
                <li style="margin-bottom: 12px;">Log in to your account dashboard.</li>
                <li style="margin-bottom: 12px;">Navigate to the <strong>Cards</strong> section.</li>
                <li style="margin-bottom: 12px;">Locate your approved card and click the <strong>"Activate Card"</strong> button.</li>
                <li style="margin-bottom: 12px;">Once activated, your card will be ready for immediate use.</li>
              </ol>
    `;

    const securityNotice = isActivation
      ? `<strong style="color: #1a1a1a;">Security Reminder:</strong> Your card details are now visible in your secure dashboard. Never share your card number, CVV, or PIN with anyone. If you notice any suspicious activity, contact our support team immediately.`
      : `<strong style="color: #1a1a1a;">Security Notice:</strong> Your card details, including the full card number, CVV, and PIN, will only be visible after activation and through our secure dashboard. Never share these details with anyone.`;

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0;">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 3px solid ${isActivation ? '#16a34a' : '#1a1a1a'};">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.5px;">
                ${headerTitle}
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 24px 0; font-size: 16px; color: #333333;">
                Dear ${userName},
              </p>

              <p style="margin: 0 0 24px 0; font-size: 15px; color: #444444;">
                ${isActivation
                  ? `Great news! Your ${cardType} Card has been <strong style="color: #16a34a;">activated</strong> and is now ready for use.`
                  : `We are pleased to inform you that your ${cardType} Card application has been reviewed and <strong style="color: #1a1a1a;">approved</strong> by our compliance team.`
                }
              </p>

              <!-- Card Details Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #fafafa; border-left: 4px solid ${isActivation ? '#16a34a' : '#1a1a1a'};">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px;">
                      Card Details
                    </h3>
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666666; width: 40%;">Reference ID:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${clientId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">Card Type:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${cardType}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">Card Number:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">**** **** **** ${cardLastFour}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">Spending Limit:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">$${Number(spendingLimit).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">Daily Limit:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">$${Number(dailyLimit).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">${dateLabel}</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">Status:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: ${isActivation ? '#16a34a' : '#2563eb'}; font-weight: 600;">${newStatus}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              ${activationContent}

              <!-- Notice Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #f8f8f8; border: 1px solid #e0e0e0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; font-size: 13px; color: #666666;">
                      ${securityNotice}
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; font-size: 14px; color: #444444;">
                Thank you for choosing our services. We appreciate your trust in us.
              </p>

              <p style="margin: 24px 0 0 0; font-size: 14px; color: #1a1a1a;">
                Regards,<br>
                <strong>Card Services Department</strong><br>
                Malta Global Crypto Bank
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #1a1a1a;">
              <p style="margin: 0 0 8px 0; font-size: 12px; color: #999999;">
                This is an automated message. Please do not reply directly to this email.
              </p>
              <p style="margin: 0; font-size: 11px; color: #777777;">
                Malta Global Crypto Bank is authorized and regulated by the Malta Financial Services Authority. Registration No. C 12345. Registered Office: Level 3, Quantum House, 75 Abate Rigord Street, Ta' Xbiex XBX 1120, Malta.
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

    const activationTextContent = isActivation ? `
YOUR CARD IS NOW ACTIVE
-----------------------
Your card has been activated and is ready for immediate use. You can now:

- Make online purchases at millions of merchants worldwide.
- Use contactless payments at supported terminals.
- Withdraw cash from ATMs (subject to daily limits).
- View your full card details in your secure dashboard.

SECURITY REMINDER: Your card details are now visible in your secure dashboard. Never share your card number, CVV, or PIN with anyone. If you notice any suspicious activity, contact our support team immediately.
    ` : `
ACTIVATE YOUR CARD
------------------
Your card is now ready for activation. To start using your card for transactions, please follow these steps:

1. Log in to your account dashboard.
2. Navigate to the Cards section.
3. Locate your approved card and click the "Activate Card" button.
4. Once activated, your card will be ready for immediate use.

SECURITY NOTICE: Your card details, including the full card number, CVV, and PIN, will only be visible after activation and through our secure dashboard. Never share these details with anyone.
    `;

    const textContent = `
${headerTitle}

Dear ${userName},

${isActivation
  ? `Great news! Your ${cardType} Card has been ACTIVATED and is now ready for use.`
  : `We are pleased to inform you that your ${cardType} Card application has been reviewed and APPROVED by our compliance team.`
}

CARD DETAILS
------------
Reference ID: ${clientId}
Card Type: ${cardType}
Card Number: **** **** **** ${cardLastFour}
Spending Limit: $${Number(spendingLimit).toLocaleString()}
Daily Limit: $${Number(dailyLimit).toLocaleString()}
${dateLabel} ${formattedDate}
Status: ${newStatus}

${activationTextContent}

Thank you for choosing our services. We appreciate your trust in us.

Regards,
Card Services Department
Malta Global Crypto Bank

---
This is an automated message. Please do not reply directly to this email.
Malta Global Crypto Bank is authorized and regulated by the Malta Financial Services Authority.
    `;

    const emailSubject = isActivation
      ? `Your Card is Now Active - Reference: ${clientId}`
      : `Your Card Has Been Approved - Reference: ${clientId}`;

    await client.sendAsync({
      from: "Malta Global Crypto Bank <support@transactionfinder.pro>",
      to: userEmail,
      subject: emailSubject,
      text: textContent,
      attachment: [
        { data: emailHtml, alternative: true },
      ],
    });

    return new Response(
      JSON.stringify({ success: true, message: `Card ${statusWord} notification email sent successfully` }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending card notification:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification email", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { SMTPClient } from "npm:emailjs@4.0.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CardRequestPayload {
  userEmail: string;
  userName: string;
  clientId: string;
  cardType: string;
  spendingLimit: string;
  dailyLimit: string;
  internationalEnabled: boolean;
  requestDate: string;
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

    const payload: CardRequestPayload = await req.json();
    const {
      userEmail,
      userName,
      clientId,
      cardType,
      spendingLimit,
      dailyLimit,
      internationalEnabled,
      requestDate,
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

    const formattedDate = new Date(requestDate).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Card Request Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; line-height: 1.6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0;">

          <!-- Header -->
          <tr>
            <td style="padding: 32px 40px; border-bottom: 3px solid #1a1a1a;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 600; color: #1a1a1a; letter-spacing: -0.5px;">
                Card Request Received
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
                We have received your request for a new ${cardType} Card. Your application has been submitted successfully and is now under review by our banking team.
              </p>

              <!-- Request Details Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #fafafa; border-left: 4px solid #1a1a1a;">
                <tr>
                  <td style="padding: 24px;">
                    <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 600; color: #1a1a1a; text-transform: uppercase; letter-spacing: 0.5px;">
                      Request Details
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
                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">Spending Limit:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">$${Number(spendingLimit).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">Daily Limit:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">$${Number(dailyLimit).toLocaleString()}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">International Usage:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${internationalEnabled ? "Enabled" : "Disabled"}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; font-size: 14px; color: #666666;">Submitted:</td>
                        <td style="padding: 8px 0; font-size: 14px; color: #1a1a1a; font-weight: 500;">${formattedDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <h3 style="margin: 32px 0 16px 0; font-size: 15px; font-weight: 600; color: #1a1a1a;">
                What Happens Next
              </h3>

              <ol style="margin: 0 0 24px 0; padding-left: 20px; font-size: 14px; color: #444444;">
                <li style="margin-bottom: 12px;">Our compliance team will review your application within 1-3 business days.</li>
                <li style="margin-bottom: 12px;">Upon approval, your card will be activated and you will receive a confirmation notification.</li>
                <li style="margin-bottom: 12px;">You can monitor the status of your request in the Cards section of your account dashboard.</li>
              </ol>

              <!-- Notice Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 24px 0; background-color: #f8f8f8; border: 1px solid #e0e0e0;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; font-size: 13px; color: #666666;">
                      <strong style="color: #1a1a1a;">Important:</strong> If you did not initiate this card request, please contact our support team immediately at support@transactionfinder.pro or through your account's secure messaging system.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 0 0; font-size: 14px; color: #444444;">
                Thank you for choosing our services.
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

    const textContent = `
Card Request Confirmation

Dear ${userName},

We have received your request for a new ${cardType} Card. Your application has been submitted successfully and is now under review by our banking team.

REQUEST DETAILS
---------------
Reference ID: ${clientId}
Card Type: ${cardType}
Spending Limit: $${Number(spendingLimit).toLocaleString()}
Daily Limit: $${Number(dailyLimit).toLocaleString()}
International Usage: ${internationalEnabled ? "Enabled" : "Disabled"}
Submitted: ${formattedDate}

WHAT HAPPENS NEXT
-----------------
1. Our compliance team will review your application within 1-3 business days.
2. Upon approval, your card will be activated and you will receive a confirmation notification.
3. You can monitor the status of your request in the Cards section of your account dashboard.

IMPORTANT: If you did not initiate this card request, please contact our support team immediately at support@transactionfinder.pro or through your account's secure messaging system.

Thank you for choosing our services.

Regards,
Card Services Department
Malta Global Crypto Bank

---
This is an automated message. Please do not reply directly to this email.
Malta Global Crypto Bank is authorized and regulated by the Malta Financial Services Authority.
    `;

    await client.sendAsync({
      from: "Malta Global Crypto Bank <support@transactionfinder.pro>",
      to: userEmail,
      subject: "Card Request Received - Reference: " + clientId,
      text: textContent,
      attachment: [
        { data: emailHtml, alternative: true },
      ],
    });

    return new Response(
      JSON.stringify({ success: true, message: "Notification email sent successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending card request notification:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification email", details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

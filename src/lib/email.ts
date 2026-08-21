import "server-only";

type DisclosureEmailInput = {
  to: string;
  sellerName: string;
  dealTitle: string;
  propertyAddress: string;
  requestUrl: string;
};

type EmailResult =
  | { ok: true; provider: "resend" }
  | { ok: false; reason: "not_configured" | "request_failed"; message: string };

export function getAppBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}

export async function sendDisclosureEmail(
  input: DisclosureEmailInput,
): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return {
      ok: false,
      reason: "not_configured",
      message:
        "RESEND_API_KEY is not configured, so the request link was generated but not emailed.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? "Loqol Demo <onboarding@resend.dev>",
      to: [input.to],
      subject: `Complete your Loqol disclosure for ${input.propertyAddress}`,
      html: `
        <p>Hi ${input.sellerName},</p>
        <p>Your disclosure request for <strong>${input.dealTitle}</strong> is ready.</p>
        <p><a href="${input.requestUrl}">Open your TDS dashboard</a></p>
        <p>This secure link expires automatically. If anything looks unfamiliar, contact your Loqol agent before continuing.</p>
      `,
      text: [
        `Hi ${input.sellerName},`,
        "",
        `Your disclosure request for ${input.dealTitle} is ready:`,
        input.requestUrl,
        "",
        "This secure link expires automatically. If anything looks unfamiliar, contact your Loqol agent before continuing.",
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    return {
      ok: false,
      reason: "request_failed",
      message: await response.text(),
    };
  }

  return { ok: true, provider: "resend" };
}

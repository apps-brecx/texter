/**
 * Email is optional on purpose. Small teams often don't have SMTP wired up on
 * day one, so when RESEND_API_KEY is missing we return `delivered: false` and
 * the caller shows the raw link in the UI for the admin to copy.
 */
type Mail = { to: string; subject: string; heading: string; body: string; cta?: { label: string; url: string } };

export async function sendMail(mail: Mail): Promise<{ delivered: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { delivered: false, reason: "no-provider" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM ?? "Texter <no-reply@texter.app>",
        to: [mail.to],
        subject: mail.subject,
        html: render(mail),
      }),
    });
    if (!res.ok) return { delivered: false, reason: `resend-${res.status}` };
    return { delivered: true };
  } catch {
    return { delivered: false, reason: "network" };
  }
}

function render({ heading, body, cta }: Mail) {
  return `<!doctype html><html><body style="margin:0;background:#FBFAF7;font-family:ui-sans-serif,system-ui,sans-serif;color:#14140F">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:48px 16px">
    <table width="100%" style="max-width:520px;background:#fff;border:1px solid #E7E2D8;border-radius:14px">
      <tr><td style="padding:32px">
        <div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#0E5E52;font-weight:600">Texter</div>
        <h1 style="font-size:24px;line-height:1.2;margin:16px 0 8px">${escape(heading)}</h1>
        <p style="font-size:15px;line-height:1.6;color:#6F6B62;margin:0 0 24px">${escape(body)}</p>
        ${cta ? `<a href="${cta.url}" style="display:inline-block;background:#0E5E52;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-size:14px;font-weight:600">${escape(cta.label)}</a>
        <p style="font-size:12px;color:#9A958B;margin:24px 0 0;word-break:break-all">${cta.url}</p>` : ""}
      </td></tr>
    </table>
  </td></tr></table></body></html>`;
}

function escape(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

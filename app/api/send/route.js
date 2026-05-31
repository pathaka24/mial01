// Real email sending via Resend.
// Requires RESEND_API_KEY (and optionally RESEND_FROM) in .env.local — see .env.local in the project root.
// The API key is read server-side only and never exposed to the browser.

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // always reflect current env / request

const BATCH_ENDPOINT = "https://api.resend.com/emails/batch";
const MAX_RECIPIENTS = 1000;

// Replace {{firstName}} / {{lastName}} / {{email}} / {{city}} / {{company}} per recipient
const merge = (str, r) =>
  String(str || "").replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => {
    const map = {
      firstName: r.firstName, lastName: r.lastName, email: r.email,
      city: r.city, company: r.company,
    };
    return map[k] != null ? String(map[k]) : "";
  });

// GET /api/send → report whether real sending is configured (used by the UI)
export async function GET() {
  return Response.json({
    configured: !!process.env.RESEND_API_KEY,
    from: process.env.RESEND_FROM || null,
  });
}

// POST /api/send → send a (personalized) email to each recipient via Resend
export async function POST(request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "not_configured", message: "Set RESEND_API_KEY in .env.local and restart the dev server." },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "bad_request", message: "Invalid JSON body." }, { status: 400 });
  }

  const { from, fromName, replyTo, subject, html, recipients } = body || {};
  const fromAddr = from || process.env.RESEND_FROM;
  if (!fromAddr) {
    return Response.json({ error: "missing_from", message: "Provide a from address or set RESEND_FROM." }, { status: 400 });
  }
  if (!subject || !html) {
    return Response.json({ error: "missing_content", message: "subject and html are required." }, { status: 400 });
  }

  const list = Array.isArray(recipients) ? recipients.filter(r => r && r.email) : [];
  if (!list.length) {
    return Response.json({ error: "no_recipients", message: "No valid recipients supplied." }, { status: 400 });
  }
  if (list.length > MAX_RECIPIENTS) {
    return Response.json(
      { error: "too_many", message: `Max ${MAX_RECIPIENTS} recipients per request — send in chunks.` },
      { status: 400 }
    );
  }

  const fromHeader = fromName ? `${fromName} <${fromAddr}>` : fromAddr;
  let sent = 0;
  const failures = [];

  // Resend's batch endpoint accepts up to 100 messages per call
  for (let i = 0; i < list.length; i += 100) {
    const chunk = list.slice(i, i + 100);
    const payload = chunk.map(r => ({
      from: fromHeader,
      to: [r.email],
      subject: merge(subject, r),
      html: merge(html, r),
      ...(replyTo ? { reply_to: replyTo } : {}),
    }));
    try {
      const res = await fetch(BATCH_ENDPOINT, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        sent += chunk.length;
      } else {
        let detail = `HTTP ${res.status}`;
        try { const j = await res.json(); detail = j?.message || detail; } catch {}
        chunk.forEach(r => failures.push({ email: r.email, error: detail }));
      }
    } catch {
      chunk.forEach(r => failures.push({ email: r.email, error: "network error" }));
    }
  }

  return Response.json({ ok: true, sent, failed: failures.length, failures: failures.slice(0, 50) });
}

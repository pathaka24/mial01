"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Mail, Send, Users, FileText, Plus, Search, X, Trash2, Edit3, Copy, Play, Pause,
  Upload, Download, AlertTriangle, CheckCircle2, Clock, Zap, TrendingUp, BarChart3,
  Settings, Key, Server, Eye, MousePointerClick, AlertCircle, Calendar, ChevronRight,
  ArrowLeft, Filter, MoreVertical, Activity, Inbox, FileUp, Sparkles,
  Bold, Italic, Underline, List, ListOrdered, Link2, Heading2, Type, Ban, ShieldAlert, Globe, MapPin
} from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";

// ============= DESIGN TOKENS =============
const T = {
  bg: "#0a0a0b",
  bgCard: "#131316",
  bgHover: "#1a1a1e",
  border: "#27272a",
  borderLight: "#2a2a2f",
  text: "#fafafa",
  textDim: "#a1a1aa",
  textMute: "#71717a",
  accent: "#a3e635",     // lime-400 - sharp, modern
  accentDim: "rgba(163, 230, 53, 0.12)",
  blue: "#60a5fa",
  amber: "#fbbf24",
  red: "#ef4444",
  fontDisplay: '"Geist", system-ui, sans-serif',
  fontMono: '"JetBrains Mono", ui-monospace, monospace',
};

// ============= HELPERS =============
const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n);
const fmtTime = (ts) => {
  const d = Date.now() - ts;
  if (d < 60000) return Math.floor(d / 1000) + "s";
  if (d < 3600000) return Math.floor(d / 60000) + "m";
  if (d < 86400000) return Math.floor(d / 3600000) + "h";
  return Math.floor(d / 86400000) + "d";
};
const fmtDate = (ts) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
const validateEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const escapeHtml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const looksLikeHtml = (s) => /<[a-z!/][\s\S]*>/i.test(s || "");
// Normalize a body (legacy plain-text or HTML) to safe-ish HTML for rendering/editing
const toHtml = (body) => {
  if (!body) return "";
  if (looksLikeHtml(body)) return body;
  return escapeHtml(body).replace(/\n/g, "<br>");
};
// Strip tags to a plain-text snippet (for card previews)
const stripHtml = (body) => {
  if (!body) return "";
  if (typeof document === "undefined") return body.replace(/<[^>]+>/g, " ");
  const tmp = document.createElement("div");
  tmp.innerHTML = body;
  return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim();
};

// ============= COUNTRIES (for worldwide map) =============
// code (ISO-3166-1 alpha-2), display name, a representative city, centroid [lat,lng], seed weight
const COUNTRIES = [
  { code: "US", name: "United States", city: "New York", lat: 38, lng: -97, weight: 32 },
  { code: "CA", name: "Canada", city: "Toronto", lat: 56, lng: -106, weight: 8 },
  { code: "MX", name: "Mexico", city: "Mexico City", lat: 23, lng: -102, weight: 5 },
  { code: "BR", name: "Brazil", city: "São Paulo", lat: -10, lng: -55, weight: 10 },
  { code: "AR", name: "Argentina", city: "Buenos Aires", lat: -38, lng: -63, weight: 3 },
  { code: "GB", name: "United Kingdom", city: "London", lat: 54, lng: -2, weight: 16 },
  { code: "FR", name: "France", city: "Paris", lat: 46, lng: 2, weight: 9 },
  { code: "DE", name: "Germany", city: "Berlin", lat: 51, lng: 10, weight: 12 },
  { code: "ES", name: "Spain", city: "Madrid", lat: 40, lng: -4, weight: 6 },
  { code: "IT", name: "Italy", city: "Rome", lat: 42, lng: 12, weight: 6 },
  { code: "NL", name: "Netherlands", city: "Amsterdam", lat: 52, lng: 5, weight: 4 },
  { code: "SE", name: "Sweden", city: "Stockholm", lat: 62, lng: 15, weight: 3 },
  { code: "PL", name: "Poland", city: "Warsaw", lat: 52, lng: 19, weight: 3 },
  { code: "RU", name: "Russia", city: "Moscow", lat: 61, lng: 90, weight: 4 },
  { code: "TR", name: "Turkey", city: "Istanbul", lat: 39, lng: 35, weight: 4 },
  { code: "AE", name: "UAE", city: "Dubai", lat: 24, lng: 54, weight: 5 },
  { code: "SA", name: "Saudi Arabia", city: "Riyadh", lat: 24, lng: 45, weight: 3 },
  { code: "EG", name: "Egypt", city: "Cairo", lat: 26, lng: 30, weight: 3 },
  { code: "NG", name: "Nigeria", city: "Lagos", lat: 9, lng: 8, weight: 4 },
  { code: "ZA", name: "South Africa", city: "Johannesburg", lat: -29, lng: 24, weight: 4 },
  { code: "KE", name: "Kenya", city: "Nairobi", lat: 0, lng: 38, weight: 2 },
  { code: "IN", name: "India", city: "Mumbai", lat: 22, lng: 79, weight: 26 },
  { code: "PK", name: "Pakistan", city: "Karachi", lat: 30, lng: 70, weight: 4 },
  { code: "BD", name: "Bangladesh", city: "Dhaka", lat: 24, lng: 90, weight: 3 },
  { code: "CN", name: "China", city: "Shanghai", lat: 35, lng: 105, weight: 9 },
  { code: "JP", name: "Japan", city: "Tokyo", lat: 36, lng: 138, weight: 7 },
  { code: "KR", name: "South Korea", city: "Seoul", lat: 36, lng: 128, weight: 4 },
  { code: "ID", name: "Indonesia", city: "Jakarta", lat: -2, lng: 118, weight: 5 },
  { code: "TH", name: "Thailand", city: "Bangkok", lat: 15, lng: 101, weight: 3 },
  { code: "VN", name: "Vietnam", city: "Hanoi", lat: 16, lng: 108, weight: 3 },
  { code: "PH", name: "Philippines", city: "Manila", lat: 13, lng: 122, weight: 4 },
  { code: "MY", name: "Malaysia", city: "Kuala Lumpur", lat: 4, lng: 102, weight: 3 },
  { code: "SG", name: "Singapore", city: "Singapore", lat: 1.3, lng: 103.8, weight: 3 },
  { code: "AU", name: "Australia", city: "Sydney", lat: -25, lng: 134, weight: 7 },
  { code: "NZ", name: "New Zealand", city: "Auckland", lat: -41, lng: 174, weight: 2 },
];
const COUNTRY_BY_CODE = Object.fromEntries(COUNTRIES.map(c => [c.code, c]));
// Weighted random country pick (for seeding a worldwide audience)
const pickCountry = () => {
  const total = COUNTRIES.reduce((a, c) => a + c.weight, 0);
  let r = Math.random() * total;
  for (const c of COUNTRIES) { if ((r -= c.weight) <= 0) return c; }
  return COUNTRIES[0];
};

// ============= STORAGE (localStorage) =============
const KEY = "email_campaigner_v1";
const loadState = async () => {
  try {
    if (typeof window === "undefined") return null;
    const v = window.localStorage.getItem(KEY);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
};
const saveState = async (s) => {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
};

// ============= SAMPLE DATA =============
const sampleSubscribers = () => {
  const fnames = ["Aarav", "Priya", "Liam", "Olivia", "Mateo", "Sofia", "Noah", "Emma", "Lucas", "Mia", "Hiroshi", "Yuki", "Chen", "Mei", "Omar", "Fatima", "Kwame", "Amara", "Ravi", "Ananya", "Lukas", "Marie", "Diego", "Camila"];
  const lnames = ["Sharma", "Smith", "Johnson", "Garcia", "Müller", "Rossi", "Tanaka", "Wang", "Khan", "Okafor", "Silva", "Nguyen", "Kim", "Dubois", "Patel", "Andersson"];
  const tags = ["Newsletter", "Customer", "Lead", "Trial", "VIP"];
  return Array.from({ length: 60 }, () => {
    const fn = fnames[Math.floor(Math.random() * fnames.length)];
    const ln = lnames[Math.floor(Math.random() * lnames.length)];
    const country = pickCountry();
    return {
      id: uid(),
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${Math.floor(Math.random() * 99)}@example.com`,
      firstName: fn,
      lastName: ln,
      city: country.city,
      country: country.code,
      countryName: country.name,
      tags: [tags[Math.floor(Math.random() * tags.length)]],
      status: "active",
      addedAt: Date.now() - Math.random() * 30 * 86400000,
    };
  });
};

const sampleTemplates = () => [
  {
    id: "t1", name: "SEO Service Pitch", category: "Sales",
    subject: "Hi {{firstName}}, your competitor just outranked you on Google",
    body: `<p>Hi {{firstName}},</p><p>Quick question — when did you last check your Google ranking for "[your main keyword]"?</p><p>I ran a quick audit on {{company}} and found <b>3 specific issues</b> that are likely costing you 30-50% of organic traffic:</p><ol><li>Slow mobile load time (6.2s vs &lt;3s benchmark)</li><li>Missing schema markup (your competitors have it)</li><li>No backlink growth in 6 months</li></ol><p>I help businesses like yours fix these — Google + Amazon + LinkedIn SEO using AI. Plans from ₹15K/month.</p><p>Free 20-min audit call?</p><p>Best,<br>[Your Name]</p>`,
  },
  {
    id: "t2", name: "Welcome Series", category: "Onboarding",
    subject: "Welcome aboard, {{firstName}} 👋",
    body: `<p>Hi {{firstName}},</p><p>Welcome to [Your Company]! Glad to have you.</p><p>Here's what to do next:</p><ul><li>Complete your profile</li><li>Explore the dashboard</li><li>Reply to this email if you need help</li></ul><p>Cheers,<br>[Your Team]</p>`,
  },
  {
    id: "t3", name: "Newsletter", category: "Content",
    subject: "This week in SEO — {{firstName}}'s digest",
    body: `<p>Hey {{firstName}},</p><p>Top stories this week:</p><ol><li>Google's March 2026 update — what changed</li><li>Amazon's new A+ content guidelines</li><li>LinkedIn's algorithm change for B2B reach</li></ol><p>Read the full breakdown → <a href="#">[link]</a></p><p>Until next week,<br>[Your Name]</p>`,
  },
];

// ============= BOUNCE HELPERS =============
const BOUNCE_REASONS = [
  { type: "hard", reason: "Invalid recipient address" },
  { type: "hard", reason: "Mailbox does not exist" },
  { type: "hard", reason: "Domain not found" },
  { type: "soft", reason: "Mailbox full" },
  { type: "soft", reason: "Message blocked by server" },
  { type: "soft", reason: "Temporary delivery failure" },
];
const randBounceMeta = () => BOUNCE_REASONS[Math.floor(Math.random() * BOUNCE_REASONS.length)];
const _BFN = ["alex", "sam", "jordan", "taylor", "chris", "jamie", "priya", "mateo", "yuki", "omar", "amara", "liam", "sofia", "chen", "fatima", "noah"];
const _BLN = ["smith", "kumar", "garcia", "muller", "tanaka", "khan", "okafor", "silva", "nguyen", "kim", "rossi", "andersson"];
const _BDOM = ["example.com", "mail.com", "corp.io", "webmail.net", "inbox.co", "company.org", "outlook.com", "gmail.com"];
const randBounceEmail = () =>
  `${_BFN[Math.floor(Math.random() * _BFN.length)]}.${_BLN[Math.floor(Math.random() * _BLN.length)]}${Math.floor(Math.random() * 9999)}@${_BDOM[Math.floor(Math.random() * _BDOM.length)]}`;

// ============= SAMPLE CAMPAIGNS (seed) =============
// Generates realistic sent campaigns. Each campaign's bounce probability is
// randomly between 3% and 6%, so the dashboard's aggregate bounce rate lands in range.
const sampleCampaigns = () => {
  const metas = [
    { name: "May Newsletter — SEO Digest", subject: "This week in SEO — your weekly digest", body: "<p>Hey there,</p><p>Top stories in search this week, plus a few wins from our clients.</p><p>Read on →</p>", agoMs: 3 * 3600000, recipients: 1180 },
    { name: "Spring Promo — 20% Off Audits", subject: "48 hours left: 20% off your SEO audit", body: "<p>Hi,</p><p>Our spring offer ends soon. Lock in <b>20% off</b> a full technical + content audit.</p>", agoMs: 2 * 86400000, recipients: 940 },
    { name: "Product Update — AI Rank Tracker", subject: "New: AI-powered rank tracking is live", body: "<p>Hello,</p><p>We just shipped AI rank tracking across Google, Amazon and LinkedIn. Here's what's new.</p>", agoMs: 9 * 86400000, recipients: 1520 },
    { name: "Cold Outreach — Batch 3", subject: "Quick question about your Google ranking", body: "<p>Hi,</p><p>I ran a quick audit and noticed a few gaps that may be costing you organic traffic.</p>", agoMs: 19 * 86400000, recipients: 760 },
  ];
  return metas.map(m => {
    const bounceProb = 0.03 + Math.random() * 0.03; // 3%–6%
    const sentAt = Date.now() - m.agoMs;
    const recipientIds = Array.from({ length: m.recipients }, () => uid());
    const events = [];
    const bounces = [];
    recipientIds.forEach((id, i) => {
      const ts = sentAt + i * 250;
      events.push({ id: uid(), contactId: id, type: "sent", timestamp: ts });
      if (Math.random() > bounceProb) {
        events.push({ id: uid(), contactId: id, type: "delivered", timestamp: ts + 1000 });
        if (Math.random() < 0.45) {
          events.push({ id: uid(), contactId: id, type: "opened", timestamp: ts + 5000 + Math.random() * 30000 });
          if (Math.random() < 0.20) events.push({ id: uid(), contactId: id, type: "clicked", timestamp: ts + 10000 + Math.random() * 60000 });
          if (Math.random() < 0.015) events.push({ id: uid(), contactId: id, type: "unsubscribed", timestamp: ts + 15000 });
        }
      } else {
        events.push({ id: uid(), contactId: id, type: "bounced", timestamp: ts + 500 });
        const meta = randBounceMeta();
        bounces.push({ id: uid(), email: randBounceEmail(), type: meta.type, reason: meta.reason, timestamp: ts + 500 });
      }
    });
    const stats = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 };
    const seenOpen = new Set(), seenClick = new Set();
    events.forEach(e => {
      if (e.type === "sent") stats.sent++;
      else if (e.type === "delivered") stats.delivered++;
      else if (e.type === "opened" && !seenOpen.has(e.contactId)) { stats.opened++; seenOpen.add(e.contactId); }
      else if (e.type === "clicked" && !seenClick.has(e.contactId)) { stats.clicked++; seenClick.add(e.contactId); }
      else if (e.type === "bounced") stats.bounced++;
      else if (e.type === "unsubscribed") stats.unsubscribed++;
    });
    return {
      id: uid(), name: m.name, subject: m.subject, body: m.body,
      senderName: "Your Company", senderEmail: "you@yourcompany.com", replyTo: "",
      recipientIds, sendRate: 250, status: "sent",
      createdAt: sentAt - 3600000, sentAt, stats, events, bounces,
    };
  });
};

const sampleSuppressions = () => {
  const data = [
    ["hardbounce1@example.com", "bounced"],
    ["no.such.inbox@example.com", "bounced"],
    ["full.mailbox@example.com", "bounced"],
    ["typo@exmaple.com", "bounced"],
    ["optout.priya@example.com", "unsubscribed"],
    ["not.interested@example.com", "unsubscribed"],
    ["please.stop@example.com", "unsubscribed"],
    ["spam.report@example.com", "complaint"],
    ["marked.as.spam@example.com", "complaint"],
    ["abuse.report@example.com", "complaint"],
    ["junk.flag@example.com", "complaint"],
    ["legal.block@example.com", "manual"],
    ["competitor@example.com", "manual"],
  ];
  return data.map(([email, reason], i) => ({ id: uid(), email, reason, addedAt: Date.now() - (i + 1) * 36 * 3600000 }));
};

// ============= UI PRIMITIVES =============
const Btn = ({ children, onClick, variant = "primary", size = "md", icon: Icon, disabled, className = "" }) => {
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm", lg: "px-5 py-2.5 text-sm" };
  const variants = {
    primary: { bg: T.accent, color: "#000" },
    secondary: { bg: T.bgCard, color: T.text, border: `1px solid ${T.border}` },
    ghost: { bg: "transparent", color: T.textDim },
    danger: { bg: "rgba(239,68,68,0.1)", color: T.red, border: `1px solid rgba(239,68,68,0.3)` },
  };
  const s = variants[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-2 font-medium transition rounded ${sizes[size]} ${disabled ? "opacity-40 cursor-not-allowed" : "hover:opacity-90"} ${className}`}
      style={{ ...s, fontFamily: T.fontDisplay, letterSpacing: "-0.01em" }}>
      {Icon && <Icon size={size === "sm" ? 12 : 14} strokeWidth={2} />}
      {children}
    </button>
  );
};

const Badge = ({ children, tone = "default" }) => {
  const tones = {
    default: { bg: T.bgHover, color: T.textDim },
    accent: { bg: T.accentDim, color: T.accent, border: `1px solid ${T.accent}40` },
    success: { bg: "rgba(34,197,94,0.1)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.3)" },
    warn: { bg: "rgba(251,191,36,0.1)", color: T.amber, border: "1px solid rgba(251,191,36,0.3)" },
    danger: { bg: "rgba(239,68,68,0.1)", color: T.red, border: "1px solid rgba(239,68,68,0.3)" },
    info: { bg: "rgba(96,165,250,0.1)", color: T.blue, border: "1px solid rgba(96,165,250,0.3)" },
  };
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider rounded font-medium"
      style={{ ...tones[tone], fontFamily: T.fontDisplay }}>
      {children}
    </span>
  );
};

const Stat = ({ label, value, sub, tone = "default", icon: Icon }) => (
  <div className="p-5" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
    <div className="flex items-center justify-between mb-3">
      <div className="text-[10px] uppercase tracking-[0.2em]" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>{label}</div>
      {Icon && <Icon size={14} style={{ color: T.textMute }} />}
    </div>
    <div className="flex items-baseline gap-2">
      <div className="text-3xl" style={{ fontFamily: T.fontMono, color: tone === "accent" ? T.accent : T.text, fontWeight: 300 }}>{value}</div>
      {sub && <div className="text-xs" style={{ color: T.textMute, fontFamily: T.fontMono }}>{sub}</div>}
    </div>
  </div>
);

const Input = ({ label, value, onChange, placeholder, type = "text", multiline, rows = 3, mono }) => (
  <div>
    {label && <label className="text-[10px] uppercase tracking-wider block mb-2" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>{label}</label>}
    {multiline ? (
      <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full px-3 py-2 text-sm focus:outline-none transition resize-none rounded"
        style={{ backgroundColor: T.bg, border: `1px solid ${T.border}`, color: T.text, fontFamily: mono ? T.fontMono : T.fontDisplay }} />
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2 text-sm focus:outline-none transition rounded"
        style={{ backgroundColor: T.bg, border: `1px solid ${T.border}`, color: T.text, fontFamily: mono ? T.fontMono : T.fontDisplay }} />
    )}
  </div>
);

// ============= RICH TEXT EDITOR =============
const VARS = ["firstName", "lastName", "email", "city", "company"];
const RichTextEditor = ({ label, value, onChange, minHeight = 220 }) => {
  const ref = useRef(null);
  const lastHtml = useRef(value || "");
  const [showVars, setShowVars] = useState(false);

  // Sync external value changes (e.g. picking a template) into the DOM,
  // but never on our own emitted edits (would reset the caret).
  useEffect(() => {
    if (ref.current && (value || "") !== lastHtml.current) {
      ref.current.innerHTML = value || "";
      lastHtml.current = value || "";
    }
  }, [value]);

  const emit = () => {
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    lastHtml.current = html;
    onChange(html);
  };

  const exec = (cmd, arg) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const insertVar = (v) => {
    ref.current?.focus();
    document.execCommand("insertText", false, `{{${v}}}`);
    setShowVars(false);
    emit();
  };

  const addLink = () => {
    const url = prompt("Link URL", "https://");
    if (url) exec("createLink", url);
  };

  const tools = [
    { icon: Bold, cmd: () => exec("bold"), title: "Bold" },
    { icon: Italic, cmd: () => exec("italic"), title: "Italic" },
    { icon: Underline, cmd: () => exec("underline"), title: "Underline" },
    { icon: Heading2, cmd: () => exec("formatBlock", "<h2>"), title: "Heading" },
    { icon: List, cmd: () => exec("insertUnorderedList"), title: "Bullet list" },
    { icon: ListOrdered, cmd: () => exec("insertOrderedList"), title: "Numbered list" },
    { icon: Link2, cmd: addLink, title: "Insert link" },
  ];

  return (
    <div>
      {label && <label className="text-[10px] uppercase tracking-wider block mb-2" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>{label}</label>}
      <div className="rounded overflow-hidden" style={{ border: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b flex-wrap" style={{ borderColor: T.border, backgroundColor: T.bgCard }}>
          {tools.map((t, i) => (
            <button key={i} type="button" title={t.title} onMouseDown={e => e.preventDefault()} onClick={t.cmd}
              className="w-7 h-7 flex items-center justify-center rounded transition hover:opacity-100"
              style={{ color: T.textDim }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = T.bgHover}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
              <t.icon size={14} />
            </button>
          ))}
          <div className="w-px h-5 mx-1" style={{ backgroundColor: T.border }} />
          <div className="relative">
            <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => setShowVars(v => !v)}
              className="h-7 px-2 flex items-center gap-1 text-xs rounded transition"
              style={{ color: T.accent, fontFamily: T.fontMono }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = T.bgHover}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
              <Type size={13} /> {"{{ }}"}
            </button>
            {showVars && (
              <div className="absolute z-20 mt-1 py-1 rounded shadow-lg" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}`, minWidth: 140 }}>
                {VARS.map(v => (
                  <button key={v} type="button" onMouseDown={e => e.preventDefault()} onClick={() => insertVar(v)}
                    className="w-full text-left px-3 py-1.5 text-xs transition" style={{ color: T.textDim, fontFamily: T.fontMono }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = T.bgHover}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          data-placeholder="Write your email… use the toolbar for formatting and {{ }} for personalization"
          className="rte-body px-4 py-3 text-sm focus:outline-none overflow-auto"
          style={{ backgroundColor: T.bg, color: T.text, fontFamily: T.fontDisplay, minHeight, lineHeight: 1.6 }}
        />
      </div>
    </div>
  );
};

// ============= SMTP CONFIG WARNING BANNER =============
const SmtpBanner = ({ smtpConfigured, onConfigure }) => {
  if (smtpConfigured) return null;
  return (
    <div className="flex items-start gap-3 p-4 rounded mb-6"
      style={{ backgroundColor: "rgba(251,191,36,0.08)", border: `1px solid rgba(251,191,36,0.3)` }}>
      <AlertTriangle size={18} style={{ color: T.amber }} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="text-sm mb-1" style={{ color: T.text, fontWeight: 500 }}>SMTP / Email Service Not Configured</div>
        <div className="text-xs" style={{ color: T.textDim }}>
          To actually send emails, connect SendGrid, Mailgun, Amazon SES, Brevo, or your SMTP server.
          Without this, this tool runs in <span style={{ color: T.amber }}>simulation mode</span> — events are tracked but no real emails leave.
        </div>
      </div>
      <Btn size="sm" variant="secondary" icon={Settings} onClick={onConfigure}>Configure</Btn>
    </div>
  );
};

// ============= SIDEBAR =============
const Sidebar = ({ view, setView, counts }) => {
  const items = [
    { key: "dashboard", label: "Dashboard", icon: Activity },
    { key: "campaigns", label: "Campaigns", icon: Send, count: counts.campaigns },
    { key: "subscribers", label: "Subscribers", icon: Users, count: counts.subscribers },
    { key: "bounced", label: "Bounced", icon: AlertCircle, count: counts.bounced },
    { key: "suppressions", label: "Suppressions", icon: Ban, count: counts.suppressions },
    { key: "templates", label: "Templates", icon: FileText, count: counts.templates },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
    { key: "settings", label: "Settings", icon: Settings },
  ];
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col p-5 border-r h-screen sticky top-0" style={{ backgroundColor: T.bg, borderColor: T.border }}>
      <div className="mb-8">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 flex items-center justify-center rounded" style={{ backgroundColor: T.accent }}>
            <Send size={15} className="text-black" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-base tracking-tight" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600 }}>Postwave</div>
            <div className="text-[9px] uppercase tracking-[0.15em]" style={{ color: T.textMute, fontFamily: T.fontMono }}>Bulk email engine</div>
          </div>
        </div>
      </div>

      <nav className="space-y-0.5 flex-1 overflow-y-auto min-h-0 -mx-1 px-1">
        {items.map(item => {
          const active = view.name === item.key || (item.key === "campaigns" && (view.name === "new_campaign" || view.name === "campaign_detail"));
          return (
            <button key={item.key} onClick={() => setView({ name: item.key })}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded transition"
              style={{
                backgroundColor: active ? T.bgCard : "transparent",
                color: active ? T.text : T.textDim,
                fontFamily: T.fontDisplay,
              }}>
              <item.icon size={14} strokeWidth={active ? 2 : 1.5} style={active ? { color: T.accent } : {}} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.count !== undefined && <span className="text-xs" style={{ color: T.textMute, fontFamily: T.fontMono }}>{item.count}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

// ============= WORLD MAP =============
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const MAP_W = 820, MAP_H = 420;

const WorldMap = ({ subscribers, totalSent }) => {
  const [features, setFeatures] = useState(null);
  const [error, setError] = useState(false);
  const [hover, setHover] = useState(null);

  // Load the world topojson once (from CDN) and convert to GeoJSON features
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(GEO_URL);
        if (!res.ok) throw new Error("fetch failed");
        const topo = await res.json();
        const fc = feature(topo, topo.objects.countries);
        if (alive) setFeatures(fc.features);
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Per-country values. Uses real audience location; if none is tagged, falls back to a sample spread.
  const { points, usingDemo, useSends, totalReach } = useMemo(() => {
    const active = subscribers.filter(s => s.status === "active" && s.country && COUNTRY_BY_CODE[s.country]);
    const counts = {};
    active.forEach(s => { counts[s.country] = (counts[s.country] || 0) + 1; });
    const totalSub = active.length;
    const sends = totalSent > 0;
    let pts;
    let demo = false;
    if (totalSub > 0) {
      pts = COUNTRIES.filter(c => counts[c.code]).map(c => {
        const share = counts[c.code] / totalSub;
        return { ...c, value: sends ? Math.max(1, Math.round(totalSent * share)) : counts[c.code] };
      });
    } else {
      demo = true;
      pts = COUNTRIES.map(c => ({ ...c, value: c.weight }));
    }
    pts.sort((a, b) => b.value - a.value);
    return { points: pts, usingDemo: demo, useSends: sends && !demo, totalReach: pts.reduce((a, p) => a + p.value, 0) };
  }, [subscribers, totalSent]);

  // Equal-Earth projection, fitted to the loaded land (or a full sphere while loading)
  const { pathGen, project } = useMemo(() => {
    const fit = features ? { type: "FeatureCollection", features } : { type: "Sphere" };
    const proj = geoEqualEarth().fitExtent([[10, 10], [MAP_W - 10, MAP_H - 10]], fit);
    return { pathGen: geoPath(proj), project: proj };
  }, [features]);

  const maxVal = points.reduce((m, p) => Math.max(m, p.value), 0) || 1;
  const rFor = (v) => 4 + Math.sqrt(v / maxVal) * 24;
  const spherePath = pathGen({ type: "Sphere" });
  const unit = useSends ? "sends" : "contacts";
  const top = points.slice(0, 7);

  return (
    <div className="rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
      <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: T.border }}>
        <div className="flex items-center gap-2">
          <Globe size={15} style={{ color: T.accent }} />
          <div className="text-base" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600 }}>Worldwide reach</div>
          <Badge tone="accent">{points.length} countries</Badge>
          {usingDemo && <Badge tone="warn">sample</Badge>}
        </div>
        <div className="text-xs" style={{ color: T.textMute, fontFamily: T.fontMono }}>
          {useSends ? "estimated sends by recipient country" : "audience by country"}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-0">
        {/* Map */}
        <div className="lg:col-span-2 p-4 relative" style={{ borderRight: `1px solid ${T.border}` }}>
          <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} width="100%" style={{ display: "block" }}>
            {spherePath && <path d={spherePath} fill={T.bg} stroke={T.border} strokeWidth={0.5} />}
            {features && features.map((f, i) => (
              <path key={i} d={pathGen(f)} fill={T.bgHover} stroke={T.border} strokeWidth={0.4} />
            ))}
            {points.map((p) => {
              const xy = project([p.lng, p.lat]);
              if (!xy) return null;
              const [x, y] = xy;
              const active = hover && hover.code === p.code;
              return (
                <g key={p.code} transform={`translate(${x},${y})`}
                  onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)} style={{ cursor: "pointer" }}>
                  <circle r={rFor(p.value)} fill={T.accent} fillOpacity={active ? 0.5 : 0.28} stroke={T.accent} strokeWidth={active ? 1.5 : 1} />
                  <circle r={2} fill={T.accent} />
                </g>
              );
            })}
            {/* Tooltip */}
            {hover && (() => {
              const xy = project([hover.lng, hover.lat]);
              if (!xy) return null;
              const label = hover.name;
              const sub = `${hover.value.toLocaleString()} ${unit}`;
              const w = Math.max(label.length, sub.length) * 6.6 + 18;
              let tx = Math.min(Math.max(xy[0] - w / 2, 4), MAP_W - w - 4);
              let ty = xy[1] - rFor(hover.value) - 44;
              if (ty < 4) ty = xy[1] + rFor(hover.value) + 8;
              return (
                <g transform={`translate(${tx},${ty})`} pointerEvents="none">
                  <rect width={w} height={36} rx={4} fill={T.bg} stroke={`${T.accent}`} strokeWidth={0.6} />
                  <text x={9} y={15} fill={T.text} style={{ fontFamily: T.fontDisplay, fontSize: 11, fontWeight: 600 }}>{label}</text>
                  <text x={9} y={29} fill={T.accent} style={{ fontFamily: T.fontMono, fontSize: 11 }}>{sub}</text>
                </g>
              );
            })()}
          </svg>
          {!features && !error && (
            <div className="absolute bottom-4 left-4 text-[10px]" style={{ color: T.textMute, fontFamily: T.fontMono }}>loading map…</div>
          )}
          {error && (
            <div className="absolute bottom-4 left-4 text-[10px]" style={{ color: T.amber, fontFamily: T.fontMono }}>map tiles offline — showing bubbles + list</div>
          )}
        </div>

        {/* Top countries */}
        <div className="p-5 space-y-3">
          <div className="text-[10px] uppercase tracking-wider" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>Top countries</div>
          {top.map(p => {
            const pct = totalReach ? (p.value / totalReach) * 100 : 0;
            return (
              <div key={p.code}>
                <div className="flex items-baseline justify-between text-xs mb-1" style={{ fontFamily: T.fontMono }}>
                  <span style={{ color: T.textDim }}>{p.name}</span>
                  <span style={{ color: T.text }}>{p.value.toLocaleString()} <span style={{ color: T.textMute }}>· {pct.toFixed(0)}%</span></span>
                </div>
                <div className="h-1.5 rounded overflow-hidden" style={{ backgroundColor: T.bg }}>
                  <div className="h-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: T.accent }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============= DASHBOARD =============
const Dashboard = ({ campaigns, subscribers, suppressions = [], smtpConfigured, setView, onConfigure }) => {
  const totalSent = campaigns.reduce((acc, c) => acc + (c.stats?.sent || 0), 0);
  const totalOpened = campaigns.reduce((acc, c) => acc + (c.stats?.opened || 0), 0);
  const totalClicked = campaigns.reduce((acc, c) => acc + (c.stats?.clicked || 0), 0);
  const totalBounced = campaigns.reduce((acc, c) => acc + (c.stats?.bounced || 0), 0);
  const openRate = totalSent ? ((totalOpened / totalSent) * 100).toFixed(1) : "0.0";
  const clickRate = totalSent ? ((totalClicked / totalSent) * 100).toFixed(1) : "0.0";
  const bounceRate = totalSent ? ((totalBounced / totalSent) * 100).toFixed(1) : "0.0";
  const activeCount = subscribers.filter(s => s.status === "active").length;

  // Daily quota tracking
  const today = new Date().toDateString();
  const sentToday = campaigns.flatMap(c => c.events || []).filter(e => e.type === "sent" && new Date(e.timestamp).toDateString() === today).length;
  const dailyQuota = 5000;
  const quotaPercent = (sentToday / dailyQuota) * 100;

  // Upcoming scheduled campaigns (soonest first)
  const scheduled = useMemo(
    () => campaigns.filter(c => c.status === "scheduled").sort((a, b) => (a.scheduledAt || 0) - (b.scheduledAt || 0)),
    [campaigns]
  );

  // Recent campaigns
  const recent = [...campaigns].sort((a, b) => (b.sentAt || b.createdAt) - (a.sentAt || a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] mb-2" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>Overview</div>
          <h1 className="text-4xl tracking-tight" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600, letterSpacing: "-0.02em" }}>
            Campaigns dashboard
          </h1>
        </div>
        <Btn icon={Plus} size="lg" onClick={() => setView({ name: "new_campaign" })}>New campaign</Btn>
      </div>

      <SmtpBanner smtpConfigured={smtpConfigured} onConfigure={onConfigure} />

      {/* Quota tracker */}
      <div className="p-6 rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] mb-1" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>Daily sending quota</div>
            <div className="text-2xl" style={{ fontFamily: T.fontMono, color: T.text, fontWeight: 300 }}>
              {sentToday.toLocaleString()} <span style={{ color: T.textMute }}>/ {dailyQuota.toLocaleString()} emails today</span>
            </div>
          </div>
          <Badge tone={quotaPercent > 90 ? "danger" : quotaPercent > 70 ? "warn" : "success"}>
            {quotaPercent.toFixed(0)}% used
          </Badge>
        </div>
        <div className="h-2 rounded overflow-hidden" style={{ backgroundColor: T.bg }}>
          <div className="h-full transition-all" style={{
            width: `${Math.min(quotaPercent, 100)}%`,
            backgroundColor: quotaPercent > 90 ? T.red : quotaPercent > 70 ? T.amber : T.accent
          }} />
        </div>
        <div className="flex justify-between text-xs mt-2" style={{ color: T.textMute, fontFamily: T.fontMono }}>
          <span>Resets at midnight IST</span>
          <span>{(dailyQuota - sentToday).toLocaleString()} remaining</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Stat label="Subscribers" value={fmt(activeCount)} sub={`of ${subscribers.length}`} icon={Users} />
        <Stat label="Sent (all-time)" value={fmt(totalSent)} icon={Send} tone={totalSent > 0 ? "accent" : "default"} />
        <Stat label="Open rate" value={`${openRate}%`} icon={Eye} />
        <Stat label="Click rate" value={`${clickRate}%`} icon={MousePointerClick} />
        <Stat label="Bounce rate" value={`${bounceRate}%`} sub={fmt(totalBounced)} icon={AlertCircle} />
        <Stat label="Suppressed" value={fmt(suppressions.length)} icon={Ban} />
      </div>

      {/* Worldwide reach map */}
      <WorldMap subscribers={subscribers} totalSent={totalSent} />

      {/* Upcoming scheduled campaigns */}
      {scheduled.length > 0 && (
        <div className="rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
          <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: T.border }}>
            <div className="flex items-center gap-2">
              <Calendar size={15} style={{ color: T.amber }} />
              <div className="text-base" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600 }}>Upcoming (scheduled)</div>
              <Badge tone="warn">{scheduled.length}</Badge>
            </div>
            <Btn variant="ghost" size="sm" onClick={() => setView({ name: "campaigns" })}>View all →</Btn>
          </div>
          {scheduled.map((c, i) => {
            const when = c.scheduledAt;
            const overdue = when && when <= Date.now();
            return (
              <div key={c.id} onClick={() => setView({ name: "campaign_detail", id: c.id })}
                className="flex items-center justify-between px-5 py-3 cursor-pointer transition"
                style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = T.bgHover}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                <div className="min-w-0 flex-1">
                  <div className="text-sm truncate" style={{ color: T.text, fontFamily: T.fontDisplay, fontWeight: 500 }}>{c.name}</div>
                  <div className="text-xs truncate" style={{ color: T.textMute }}>{c.subject}</div>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <div className="text-xs flex items-center gap-1.5 justify-end" style={{ color: overdue ? T.amber : T.textDim, fontFamily: T.fontMono }}>
                    <Clock size={11} /> {overdue ? "sending soon" : (when ? fmtDate(when) : "—")}
                  </div>
                  <div className="text-[10px]" style={{ color: T.textMute, fontFamily: T.fontMono }}>{c.recipientIds?.length || 0} recipients</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent campaigns */}
      <div className="rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: T.border }}>
          <div className="text-base" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600 }}>Recent campaigns</div>
          <Btn variant="ghost" size="sm" onClick={() => setView({ name: "campaigns" })}>View all →</Btn>
        </div>
        {recent.length === 0 ? (
          <div className="p-12 text-center">
            <Mail size={28} style={{ color: T.textMute }} className="mx-auto mb-4" />
            <div className="text-sm mb-4" style={{ color: T.textDim, fontFamily: T.fontDisplay }}>No campaigns yet</div>
            <Btn icon={Plus} onClick={() => setView({ name: "new_campaign" })}>Create your first</Btn>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider border-b" style={{ borderColor: T.border, color: T.textMute, fontFamily: T.fontDisplay }}>
                <th className="text-left px-5 py-3 font-medium">Campaign</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Recipients</th>
                <th className="text-right px-5 py-3 font-medium">Open rate</th>
                <th className="text-right px-5 py-3 font-medium">Sent</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(c => {
                const or = c.stats?.sent ? ((c.stats.opened / c.stats.sent) * 100).toFixed(1) : "—";
                return (
                  <tr key={c.id} onClick={() => setView({ name: "campaign_detail", id: c.id })}
                    className="border-b cursor-pointer transition" style={{ borderColor: T.border }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = T.bgHover}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                    <td className="px-5 py-4">
                      <div className="text-sm" style={{ color: T.text, fontFamily: T.fontDisplay }}>{c.name}</div>
                      <div className="text-xs mt-0.5 truncate max-w-md" style={{ color: T.textMute }}>{c.subject}</div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={c.status === "sent" ? "success" : c.status === "sending" ? "info" : c.status === "scheduled" ? "warn" : "default"}>{c.status}</Badge>
                    </td>
                    <td className="px-5 py-4 text-right text-sm" style={{ color: T.text, fontFamily: T.fontMono }}>{c.recipientIds?.length || 0}</td>
                    <td className="px-5 py-4 text-right text-sm" style={{ color: or !== "—" ? T.accent : T.textMute, fontFamily: T.fontMono }}>{or !== "—" ? `${or}%` : "—"}</td>
                    <td className="px-5 py-4 text-right text-xs" style={{ color: T.textMute, fontFamily: T.fontMono }}>{c.sentAt ? fmtTime(c.sentAt) + " ago" : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ============= SUBSCRIBERS =============
const Subscribers = ({ subscribers, setSubscribers, onSuppress }) => {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [newSub, setNewSub] = useState({ email: "", firstName: "", lastName: "", city: "", tags: "Newsletter" });
  const [bulkText, setBulkText] = useState("");
  const [importStats, setImportStats] = useState(null);

  const filtered = useMemo(() =>
    subscribers.filter(s => !search || s.email.toLowerCase().includes(search.toLowerCase()) || `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase())),
    [subscribers, search]
  );

  const addOne = () => {
    if (!validateEmail(newSub.email)) { alert("Invalid email"); return; }
    setSubscribers([...subscribers, {
      id: uid(), ...newSub,
      tags: newSub.tags.split(",").map(t => t.trim()),
      status: "active", addedAt: Date.now(),
    }]);
    setNewSub({ email: "", firstName: "", lastName: "", city: "", tags: "Newsletter" });
    setShowAdd(false);
  };

  const importBulk = () => {
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    let added = 0, invalid = 0, duplicate = 0;
    const existing = new Set(subscribers.map(s => s.email.toLowerCase()));
    const newSubs = [];
    lines.forEach(line => {
      const parts = line.split(/[,;\t]/).map(p => p.trim());
      const email = parts[0];
      if (!validateEmail(email)) { invalid++; return; }
      if (existing.has(email.toLowerCase())) { duplicate++; return; }
      existing.add(email.toLowerCase());
      newSubs.push({
        id: uid(),
        email,
        firstName: parts[1] || "",
        lastName: parts[2] || "",
        city: parts[3] || "",
        tags: ["Imported"],
        status: "active",
        addedAt: Date.now(),
      });
      added++;
    });
    setSubscribers([...subscribers, ...newSubs]);
    setImportStats({ added, invalid, duplicate });
  };

  const remove = (id) => { if (confirm("Remove subscriber?")) setSubscribers(subscribers.filter(s => s.id !== id)); };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] mb-2" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>Audience</div>
          <h1 className="text-4xl tracking-tight" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600, letterSpacing: "-0.02em" }}>Subscribers</h1>
        </div>
        <div className="flex gap-2">
          <Btn variant="secondary" icon={FileUp} onClick={() => setShowImport(true)}>Bulk import</Btn>
          <Btn icon={Plus} onClick={() => setShowAdd(true)}>Add subscriber</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total" value={fmt(subscribers.length)} icon={Users} />
        <Stat label="Active" value={fmt(subscribers.filter(s => s.status === "active").length)} tone="accent" icon={CheckCircle2} />
        <Stat label="Unsubscribed" value={fmt(subscribers.filter(s => s.status === "unsubscribed").length)} icon={X} />
        <Stat label="Tags" value={new Set(subscribers.flatMap(s => s.tags || [])).size} icon={FileText} />
      </div>

      {/* Add modal */}
      {showAdd && (
        <div className="p-6 rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.accent}40` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-base" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600 }}>Add subscriber</div>
            <button onClick={() => setShowAdd(false)}><X size={16} style={{ color: T.textMute }} /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Email *" value={newSub.email} onChange={v => setNewSub({ ...newSub, email: v })} placeholder="user@example.com" mono />
            <Input label="First name" value={newSub.firstName} onChange={v => setNewSub({ ...newSub, firstName: v })} placeholder="Aarav" />
            <Input label="Last name" value={newSub.lastName} onChange={v => setNewSub({ ...newSub, lastName: v })} placeholder="Sharma" />
            <Input label="City" value={newSub.city} onChange={v => setNewSub({ ...newSub, city: v })} placeholder="Delhi" />
            <Input label="Tags (comma-separated)" value={newSub.tags} onChange={v => setNewSub({ ...newSub, tags: v })} placeholder="Newsletter, VIP" />
          </div>
          <div className="flex gap-2 mt-5">
            <Btn onClick={addOne}>Save subscriber</Btn>
            <Btn variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <div className="p-6 rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.accent}40` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-base" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600 }}>Bulk import (CSV format)</div>
            <button onClick={() => { setShowImport(false); setImportStats(null); setBulkText(""); }}><X size={16} style={{ color: T.textMute }} /></button>
          </div>
          <div className="text-xs mb-3 p-3 rounded" style={{ backgroundColor: T.bg, color: T.textDim, fontFamily: T.fontMono }}>
            Format: <span style={{ color: T.accent }}>email, firstName, lastName, city</span> — one per line<br />
            Example: priya.sharma@example.com, Priya, Sharma, Delhi
          </div>
          <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={8}
            placeholder="user1@example.com, John, Doe, Delhi&#10;user2@example.com, Jane, Smith, Mumbai&#10;..."
            className="w-full px-3 py-2 text-sm focus:outline-none rounded font-mono"
            style={{ backgroundColor: T.bg, border: `1px solid ${T.border}`, color: T.text, fontFamily: T.fontMono }} />
          {importStats && (
            <div className="mt-4 p-3 rounded text-sm" style={{ backgroundColor: T.bg, fontFamily: T.fontDisplay }}>
              <div style={{ color: T.accent }}>✓ {importStats.added} added successfully</div>
              {importStats.invalid > 0 && <div style={{ color: T.amber }}>⚠ {importStats.invalid} invalid emails skipped</div>}
              {importStats.duplicate > 0 && <div style={{ color: T.textDim }}>· {importStats.duplicate} duplicates ignored</div>}
            </div>
          )}
          <div className="flex gap-2 mt-5">
            <Btn icon={Upload} onClick={importBulk} disabled={!bulkText.trim()}>Import</Btn>
            <Btn variant="ghost" onClick={() => { setShowImport(false); setImportStats(null); setBulkText(""); }}>Done</Btn>
          </div>
        </div>
      )}

      {/* Search + table */}
      <div className="rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
        <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: T.border }}>
          <Search size={14} style={{ color: T.textMute }} className="ml-2" />
          <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none"
            style={{ color: T.text, fontFamily: T.fontDisplay }} />
          <div className="text-xs" style={{ color: T.textMute, fontFamily: T.fontMono }}>{filtered.length} / {subscribers.length}</div>
        </div>
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full">
            <thead className="sticky top-0" style={{ backgroundColor: T.bgCard }}>
              <tr className="text-[10px] uppercase tracking-wider border-b" style={{ borderColor: T.border, color: T.textMute, fontFamily: T.fontDisplay }}>
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium">Name</th>
                <th className="text-left px-5 py-3 font-medium">City</th>
                <th className="text-left px-5 py-3 font-medium">Tags</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Added</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12" style={{ color: T.textMute }}>No subscribers</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="border-b transition" style={{ borderColor: T.border }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = T.bgHover}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                  <td className="px-5 py-3 text-sm" style={{ color: T.text, fontFamily: T.fontMono }}>{s.email}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: T.textDim, fontFamily: T.fontDisplay }}>{s.firstName} {s.lastName}</td>
                  <td className="px-5 py-3 text-sm" style={{ color: T.textDim, fontFamily: T.fontDisplay }}>{s.city || "—"}</td>
                  <td className="px-5 py-3"><div className="flex gap-1 flex-wrap">{s.tags?.map(t => <Badge key={t}>{t}</Badge>)}</div></td>
                  <td className="px-5 py-3"><Badge tone={s.status === "active" ? "success" : "warn"}>{s.status}</Badge></td>
                  <td className="px-5 py-3 text-right text-xs" style={{ color: T.textMute, fontFamily: T.fontMono }}>{fmtTime(s.addedAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {s.status === "active" && (
                        <button title="Unsubscribe & suppress" onClick={() => { if (confirm(`Suppress ${s.email}? They will be excluded from all future sends.`)) onSuppress?.(s, "manual"); }}
                          className="transition" style={{ color: T.textMute }}
                          onMouseEnter={e => e.currentTarget.style.color = T.amber}
                          onMouseLeave={e => e.currentTarget.style.color = T.textMute}>
                          <Ban size={13} />
                        </button>
                      )}
                      <button title="Delete" onClick={() => remove(s.id)} className="transition" style={{ color: T.textMute }}
                        onMouseEnter={e => e.currentTarget.style.color = T.red}
                        onMouseLeave={e => e.currentTarget.style.color = T.textMute}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============= TEMPLATES =============
const Templates = ({ templates, setTemplates, onUse }) => {
  const [editingId, setEditingId] = useState(null);
  const [newTpl, setNewTpl] = useState({ name: "", category: "", subject: "", body: "" });
  const [showNew, setShowNew] = useState(false);

  const save = () => {
    if (!newTpl.name || !newTpl.subject) { alert("Name and subject required"); return; }
    setTemplates([...templates, { id: uid(), ...newTpl }]);
    setNewTpl({ name: "", category: "", subject: "", body: "" });
    setShowNew(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] mb-2" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>Library</div>
          <h1 className="text-4xl tracking-tight" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600, letterSpacing: "-0.02em" }}>Templates</h1>
        </div>
        <Btn icon={Plus} onClick={() => setShowNew(true)}>New template</Btn>
      </div>

      {showNew && (
        <div className="p-6 rounded space-y-4" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.accent}40` }}>
          <div className="flex items-center justify-between">
            <div className="text-base" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600 }}>Create template</div>
            <button onClick={() => setShowNew(false)}><X size={16} style={{ color: T.textMute }} /></button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Template name" value={newTpl.name} onChange={v => setNewTpl({ ...newTpl, name: v })} placeholder="Cold Outreach v1" />
            <Input label="Category" value={newTpl.category} onChange={v => setNewTpl({ ...newTpl, category: v })} placeholder="Sales / Newsletter / Onboarding" />
          </div>
          <Input label="Subject line" value={newTpl.subject} onChange={v => setNewTpl({ ...newTpl, subject: v })} placeholder="Hi {{firstName}}, ..." />
          <RichTextEditor label="Email body" value={newTpl.body} onChange={v => setNewTpl({ ...newTpl, body: v })} />
          <Btn onClick={save}>Save template</Btn>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(t => (
          <div key={t.id} className="rounded overflow-hidden flex flex-col"
            style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
            <div className="p-5 flex-1">
              <div className="flex items-start justify-between mb-3">
                <Badge>{t.category}</Badge>
                <button onClick={() => { if (confirm("Delete template?")) setTemplates(templates.filter(x => x.id !== t.id)); }}>
                  <Trash2 size={12} style={{ color: T.textMute }} />
                </button>
              </div>
              <div className="text-base mb-2" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600 }}>{t.name}</div>
              <div className="text-xs mb-3 line-clamp-2" style={{ color: T.textDim, fontFamily: T.fontDisplay }}>{t.subject}</div>
              <div className="text-xs line-clamp-3" style={{ color: T.textMute, fontFamily: T.fontDisplay }}>{stripHtml(t.body).slice(0, 150)}…</div>
            </div>
            <div className="p-4 border-t flex gap-2" style={{ borderColor: T.border }}>
              <Btn size="sm" variant="secondary" onClick={() => onUse(t)}>Use in campaign</Btn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============= NEW CAMPAIGN =============
const NewCampaign = ({ subscribers, templates, suppressions = [], smtpConfigured, resendConfigured, initialTemplate, onLaunch, onSchedule, setView }) => {
  const [step, setStep] = useState(1);
  const [testEmail, setTestEmail] = useState("");
  const [testMsg, setTestMsg] = useState(null);
  const [testing, setTesting] = useState(false);
  const [form, setForm] = useState({
    name: initialTemplate ? `${initialTemplate.name} — ${new Date().toLocaleDateString()}` : "",
    subject: initialTemplate?.subject || "",
    body: initialTemplate?.body || "",
    senderName: "Your Company",
    senderEmail: "you@yourcompany.com",
    replyTo: "",
    tagFilter: null,
    sendMode: "now", // 'now' or 'scheduled'
    scheduledTime: "",
    sendRate: 100, // emails per minute (throttling)
  });

  const suppressedSet = useMemo(() => new Set(suppressions.map(s => s.email.toLowerCase())), [suppressions]);
  const active = subscribers.filter(s => s.status === "active");
  const eligible = active.filter(s => !suppressedSet.has(s.email.toLowerCase()));
  const excludedCount = active.length - eligible.length;
  const recipients = useMemo(() => form.tagFilter ? eligible.filter(s => s.tags?.includes(form.tagFilter)) : eligible, [eligible, form.tagFilter]);
  const tags = [...new Set(eligible.flatMap(s => s.tags || []))];

  const can = () => {
    if (step === 1) return form.name && form.subject && form.body && form.senderEmail;
    if (step === 2) return recipients.length > 0;
    return true;
  };

  const go = () => {
    if (form.sendMode === "scheduled") onSchedule({ ...form, recipientIds: recipients.map(r => r.id) });
    else onLaunch({ ...form, recipientIds: recipients.map(r => r.id) });
  };

  const sendTest = async () => {
    if (!validateEmail(testEmail)) { setTestMsg({ err: true, text: "Enter a valid email address" }); return; }
    setTesting(true); setTestMsg(null);
    try {
      const res = await fetch("/api/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: form.senderEmail, fromName: form.senderName, replyTo: form.replyTo,
          subject: form.subject, html: toHtml(form.body),
          recipients: [{ email: testEmail, firstName: "there", lastName: "", city: "", company: "" }],
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.sent) setTestMsg({ err: false, text: `Test email sent to ${testEmail}` });
      else setTestMsg({ err: true, text: json.message || json.error || "Send failed" });
    } catch {
      setTestMsg({ err: true, text: "Network error — is the dev server running?" });
    }
    setTesting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <button onClick={() => setView({ name: "campaigns" })}
          className="flex items-center gap-1.5 text-xs mb-4 transition hover:text-white"
          style={{ color: T.textMute, fontFamily: T.fontDisplay }}>
          <ArrowLeft size={12} /> Cancel
        </button>
        <div className="text-xs uppercase tracking-[0.25em] mb-2" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>Step {step} of 3</div>
        <h1 className="text-4xl tracking-tight" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600, letterSpacing: "-0.02em" }}>
          {step === 1 && "Compose"}
          {step === 2 && "Choose recipients"}
          {step === 3 && "Review & send"}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className="w-7 h-7 flex items-center justify-center text-xs rounded transition"
              style={{ backgroundColor: step >= s ? T.accent : T.bgCard, color: step >= s ? "#000" : T.textMute, fontFamily: T.fontMono }}>
              {step > s ? <CheckCircle2 size={13} /> : s}
            </div>
            <div className="flex-1 h-px" style={{ backgroundColor: step > s ? T.accent : T.border }}></div>
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 1 && (
        <div className="space-y-5">
          <Input label="Campaign name (internal)" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Q2 Cold Outreach Batch 1" />
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="From name" value={form.senderName} onChange={v => setForm({ ...form, senderName: v })} />
            <Input label="From email" value={form.senderEmail} onChange={v => setForm({ ...form, senderEmail: v })} mono />
          </div>
          <Input label="Reply-to email (optional)" value={form.replyTo} onChange={v => setForm({ ...form, replyTo: v })} placeholder="reply@yourcompany.com" mono />
          <Input label="Subject line" value={form.subject} onChange={v => setForm({ ...form, subject: v })} placeholder="Use {{firstName}} for personalization" />
          <RichTextEditor label="Email body" value={form.body} onChange={v => setForm({ ...form, body: v })} minHeight={280} />
          <div className="text-xs p-3 rounded" style={{ backgroundColor: T.bg, color: T.textDim, fontFamily: T.fontMono }}>
            <span style={{ color: T.accent }}>Personalization variables:</span> {"{{firstName}}, {{lastName}}, {{email}}, {{city}}, {{company}}"}
          </div>

          {!initialTemplate && templates.length > 0 && (
            <div className="pt-4 border-t" style={{ borderColor: T.border }}>
              <div className="text-[10px] uppercase tracking-wider mb-3" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>Or use a template</div>
              <div className="grid grid-cols-3 gap-2">
                {templates.map(t => (
                  <button key={t.id} onClick={() => setForm({ ...form, subject: t.subject, body: t.body })}
                    className="text-left p-3 rounded transition" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
                    <Badge>{t.category}</Badge>
                    <div className="text-sm mt-2" style={{ color: T.text, fontFamily: T.fontDisplay }}>{t.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="p-5 rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
            <div className="text-[10px] uppercase tracking-wider mb-3" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>Filter by tag (optional)</div>
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setForm({ ...form, tagFilter: null })}
                className="px-3 py-1.5 text-xs rounded transition"
                style={!form.tagFilter ? { backgroundColor: T.accent, color: "#000", fontFamily: T.fontDisplay, fontWeight: 500 }
                  : { backgroundColor: "transparent", color: T.textDim, border: `1px solid ${T.border}`, fontFamily: T.fontDisplay }}>
                All ({eligible.length})
              </button>
              {tags.map(t => {
                const count = eligible.filter(s => s.tags?.includes(t)).length;
                return (
                  <button key={t} onClick={() => setForm({ ...form, tagFilter: t })}
                    className="px-3 py-1.5 text-xs rounded transition"
                    style={form.tagFilter === t ? { backgroundColor: T.accent, color: "#000", fontFamily: T.fontDisplay, fontWeight: 500 }
                      : { backgroundColor: "transparent", color: T.textDim, border: `1px solid ${T.border}`, fontFamily: T.fontDisplay }}>
                    {t} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-8 rounded text-center" style={{ backgroundColor: T.accentDim, border: `1px solid ${T.accent}40` }}>
            <div className="text-6xl mb-2" style={{ fontFamily: T.fontMono, color: T.accent, fontWeight: 300 }}>{recipients.length.toLocaleString()}</div>
            <div className="text-sm" style={{ color: T.textDim, fontFamily: T.fontDisplay }}>recipients selected</div>
            {excludedCount > 0 && (
              <div className="text-xs mt-2 inline-flex items-center gap-1.5" style={{ color: T.amber, fontFamily: T.fontDisplay }}>
                <ShieldAlert size={12} /> {excludedCount} suppressed {excludedCount === 1 ? "address" : "addresses"} excluded
              </div>
            )}
          </div>

          <div className="rounded max-h-64 overflow-auto" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
            {recipients.slice(0, 100).map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2 border-b text-xs" style={{ borderColor: T.border }}>
                <div className="flex-1" style={{ color: T.text, fontFamily: T.fontDisplay }}>{r.firstName} {r.lastName}</div>
                <div style={{ color: T.textMute, fontFamily: T.fontMono }}>{r.email}</div>
              </div>
            ))}
            {recipients.length > 100 && (
              <div className="px-4 py-2 text-center text-xs" style={{ color: T.textMute, fontFamily: T.fontMono }}>+ {recipients.length - 100} more</div>
            )}
          </div>
        </div>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <div className="space-y-5">
          {resendConfigured ? (
            <div className="p-4 rounded flex items-start gap-3" style={{ backgroundColor: "rgba(34,197,94,0.08)", border: `1px solid rgba(34,197,94,0.3)` }}>
              <CheckCircle2 size={18} style={{ color: "#4ade80" }} className="flex-shrink-0 mt-0.5" />
              <div className="text-xs" style={{ color: T.textDim, fontFamily: T.fontDisplay }}>
                <span style={{ color: "#4ade80", fontWeight: 500 }}>Real sending via Resend is active.</span> Launching this campaign will deliver real email to the selected recipients.
              </div>
            </div>
          ) : (
            <div className="p-4 rounded flex items-start gap-3" style={{ backgroundColor: "rgba(251,191,36,0.08)", border: `1px solid rgba(251,191,36,0.3)` }}>
              <AlertTriangle size={18} style={{ color: T.amber }} className="flex-shrink-0 mt-0.5" />
              <div className="text-xs" style={{ color: T.textDim, fontFamily: T.fontDisplay }}>
                Resend not configured. This will run in <span style={{ color: T.amber, fontWeight: 500 }}>simulation mode</span> — events will be tracked, but no real emails sent. Add a key in Settings → Real sending to send for real.
              </div>
            </div>
          )}

          {/* Send a test email */}
          {resendConfigured && (
            <div className="p-5 rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
              <div className="text-[10px] uppercase tracking-wider mb-3" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>Send a test email first</div>
              <div className="flex flex-col md:flex-row gap-2">
                <input placeholder="you@yourdomain.com" value={testEmail} onChange={e => setTestEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !testing && sendTest()}
                  className="flex-1 px-3 py-2 text-sm focus:outline-none rounded"
                  style={{ backgroundColor: T.bg, border: `1px solid ${T.border}`, color: T.text, fontFamily: T.fontMono }} />
                <Btn variant="secondary" icon={Send} onClick={sendTest} disabled={testing || !testEmail.trim()}>{testing ? "Sending…" : "Send test"}</Btn>
              </div>
              {testMsg && (
                <div className="text-xs mt-2" style={{ color: testMsg.err ? T.amber : "#4ade80", fontFamily: T.fontDisplay }}>
                  {testMsg.err ? "⚠ " : "✓ "}{testMsg.text}
                </div>
              )}
            </div>
          )}

          {/* Email preview */}
          <div className="rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
            <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: T.border }}>
              <div className="text-xs" style={{ color: T.textMute, fontFamily: T.fontDisplay }}>Preview as it appears in inbox</div>
              <Inbox size={14} style={{ color: T.textMute }} />
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b" style={{ borderColor: T.border }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: T.accent, color: "#000" }}>
                  {form.senderName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm" style={{ color: T.text, fontFamily: T.fontDisplay, fontWeight: 500 }}>{form.senderName}</div>
                  <div className="text-xs" style={{ color: T.textMute, fontFamily: T.fontMono }}>{form.senderEmail}</div>
                </div>
              </div>
              <div className="text-lg" style={{ color: T.text, fontFamily: T.fontDisplay, fontWeight: 600 }}>{form.subject}</div>
              <div className="email-body text-sm leading-relaxed" style={{ color: T.textDim, fontFamily: T.fontDisplay }}
                dangerouslySetInnerHTML={{ __html: toHtml(form.body) }} />
              <div className="text-[10px] pt-2" style={{ color: T.textMute, fontFamily: T.fontMono }}>
                Variables like {"{{firstName}}"} are personalized per recipient at send time.
              </div>
            </div>
          </div>

          {/* Send mode */}
          <div className="p-5 rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
            <div className="text-[10px] uppercase tracking-wider mb-3" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>When to send</div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button onClick={() => setForm({ ...form, sendMode: "now" })}
                className="p-4 rounded text-left transition"
                style={form.sendMode === "now" ? { backgroundColor: T.accentDim, border: `1px solid ${T.accent}` } : { backgroundColor: "transparent", border: `1px solid ${T.border}` }}>
                <Zap size={16} style={{ color: form.sendMode === "now" ? T.accent : T.textMute }} className="mb-2" />
                <div className="text-sm" style={{ color: T.text, fontFamily: T.fontDisplay, fontWeight: 500 }}>Send now</div>
                <div className="text-xs" style={{ color: T.textMute }}>Start immediately</div>
              </button>
              <button onClick={() => setForm({ ...form, sendMode: "scheduled" })}
                className="p-4 rounded text-left transition"
                style={form.sendMode === "scheduled" ? { backgroundColor: T.accentDim, border: `1px solid ${T.accent}` } : { backgroundColor: "transparent", border: `1px solid ${T.border}` }}>
                <Calendar size={16} style={{ color: form.sendMode === "scheduled" ? T.accent : T.textMute }} className="mb-2" />
                <div className="text-sm" style={{ color: T.text, fontFamily: T.fontDisplay, fontWeight: 500 }}>Schedule</div>
                <div className="text-xs" style={{ color: T.textMute }}>Pick a date/time</div>
              </button>
            </div>
            {form.sendMode === "scheduled" && (
              <Input type="datetime-local" value={form.scheduledTime} onChange={v => setForm({ ...form, scheduledTime: v })} />
            )}

            <div className="mt-4 pt-4 border-t" style={{ borderColor: T.border }}>
              <div className="text-[10px] uppercase tracking-wider mb-2" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>
                Sending rate (deliverability protection)
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: 50, l: "Slow", d: "50/min" },
                  { v: 100, l: "Standard", d: "100/min" },
                  { v: 250, l: "Fast", d: "250/min" },
                ].map(r => (
                  <button key={r.v} onClick={() => setForm({ ...form, sendRate: r.v })}
                    className="p-3 rounded text-center transition"
                    style={form.sendRate === r.v ? { backgroundColor: T.accent, color: "#000" } : { backgroundColor: "transparent", color: T.textDim, border: `1px solid ${T.border}` }}>
                    <div className="text-sm font-medium" style={{ fontFamily: T.fontDisplay }}>{r.l}</div>
                    <div className="text-[10px]" style={{ fontFamily: T.fontMono }}>{r.d}</div>
                  </button>
                ))}
              </div>
              <div className="text-xs mt-2" style={{ color: T.textMute, fontFamily: T.fontDisplay }}>
                {recipients.length} emails @ {form.sendRate}/min → {Math.ceil(recipients.length / form.sendRate)} minutes total
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Recipients" value={fmt(recipients.length)} tone="accent" />
            <Stat label="Send mode" value={form.sendMode === "now" ? "Now" : "Scheduled"} />
            <Stat label="Est. duration" value={`~${Math.ceil(recipients.length / form.sendRate)}m`} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-6 border-t" style={{ borderColor: T.border }}>
        {step > 1 ? <Btn variant="secondary" onClick={() => setStep(step - 1)}>← Back</Btn> : <div />}
        {step < 3 ? (
          <Btn onClick={() => setStep(step + 1)} disabled={!can()}>Continue →</Btn>
        ) : (
          <Btn icon={form.sendMode === "now" ? Send : Calendar} onClick={go} disabled={!can() || (form.sendMode === "scheduled" && !form.scheduledTime)}>
            {form.sendMode === "now" ? "Launch campaign" : "Schedule campaign"}
          </Btn>
        )}
      </div>
    </div>
  );
};

// ============= CAMPAIGN LIST =============
const CampaignList = ({ campaigns, setView }) => {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const filtered = campaigns.filter(c =>
    (filter === "all" || c.status === filter) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.subject || "").toLowerCase().includes(search.toLowerCase()))
  );
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] mb-2" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>Campaigns</div>
          <h1 className="text-4xl tracking-tight" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600, letterSpacing: "-0.02em" }}>All campaigns</h1>
        </div>
        <Btn icon={Plus} onClick={() => setView({ name: "new_campaign" })}>New campaign</Btn>
      </div>

      <div className="flex items-center justify-between gap-3 border-b flex-wrap" style={{ borderColor: T.border }}>
        <div className="flex gap-1">
          {["all", "draft", "scheduled", "sending", "sent"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-2 text-xs uppercase tracking-wider transition relative"
              style={{ color: filter === f ? T.text : T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>
              {f} {f !== "all" && `(${campaigns.filter(c => c.status === f).length})`}
              {filter === f && <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: T.accent }} />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 pb-1 pr-1">
          <Search size={14} style={{ color: T.textMute }} />
          <input placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm focus:outline-none w-44" style={{ color: T.text, fontFamily: T.fontDisplay }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded p-12 text-center" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
          <Mail size={28} style={{ color: T.textMute }} className="mx-auto mb-4" />
          <div className="mb-4" style={{ color: T.textDim, fontFamily: T.fontDisplay }}>No campaigns found</div>
          <Btn icon={Plus} onClick={() => setView({ name: "new_campaign" })}>Create one</Btn>
        </div>
      ) : (
        <div className="rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
          {filtered.map((c, i) => {
            const or = c.stats?.sent ? ((c.stats.opened / c.stats.sent) * 100).toFixed(1) : "—";
            return (
              <div key={c.id} onClick={() => setView({ name: "campaign_detail", id: c.id })}
                className="grid grid-cols-12 gap-4 px-6 py-4 cursor-pointer transition"
                style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = T.bgHover}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                <div className="col-span-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge tone={c.status === "sent" ? "success" : c.status === "sending" ? "info" : c.status === "scheduled" ? "warn" : "default"}>{c.status}</Badge>
                    <div className="text-sm truncate" style={{ color: T.text, fontFamily: T.fontDisplay, fontWeight: 500 }}>{c.name}</div>
                  </div>
                  <div className="text-xs truncate" style={{ color: T.textMute }}>{c.subject}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: T.textMute, fontFamily: T.fontDisplay }}>Recipients</div>
                  <div className="text-sm" style={{ color: T.text, fontFamily: T.fontMono }}>{c.recipientIds?.length || 0}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: T.textMute, fontFamily: T.fontDisplay }}>Open rate</div>
                  <div className="text-sm" style={{ color: or !== "—" ? T.accent : T.textMute, fontFamily: T.fontMono }}>{or !== "—" ? `${or}%` : "—"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-[10px] uppercase tracking-wider" style={{ color: T.textMute, fontFamily: T.fontDisplay }}>Sent</div>
                  <div className="text-xs" style={{ color: T.textDim, fontFamily: T.fontMono }}>{c.sentAt ? fmtDate(c.sentAt) : "—"}</div>
                </div>
                <div className="col-span-1 flex justify-end items-center"><ChevronRight size={14} style={{ color: T.textMute }} /></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============= CAMPAIGN DETAIL =============
const CampaignDetail = ({ campaign, subscribers, setView }) => {
  const stats = campaign.stats || { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 };
  const or = stats.sent ? ((stats.opened / stats.sent) * 100).toFixed(1) : "0.0";
  const cr = stats.sent ? ((stats.clicked / stats.sent) * 100).toFixed(1) : "0.0";
  const br = stats.sent ? ((stats.bounced / stats.sent) * 100).toFixed(1) : "0.0";
  const events = campaign.events || [];
  const subMap = Object.fromEntries(subscribers.map(s => [s.id, s]));

  // Timeline
  const timeline = useMemo(() => {
    const opens = events.filter(e => e.type === "opened");
    if (!opens.length) return [];
    const start = Math.min(...opens.map(e => e.timestamp));
    const end = Math.max(...opens.map(e => e.timestamp));
    const bucketMs = Math.max(1000, (end - start) / 12);
    const buckets = {};
    events.filter(e => ["opened", "clicked"].includes(e.type)).forEach(e => {
      const b = Math.floor((e.timestamp - start) / bucketMs);
      buckets[b] = buckets[b] || { t: b, opens: 0, clicks: 0 };
      if (e.type === "opened") buckets[b].opens++;
      else buckets[b].clicks++;
    });
    return Object.values(buckets).sort((a, b) => a.t - b.t).map((v, i) => ({ ...v, t: i }));
  }, [events]);

  return (
    <div className="space-y-8">
      <div>
        <button onClick={() => setView({ name: "campaigns" })}
          className="flex items-center gap-1.5 text-xs mb-4 transition"
          style={{ color: T.textMute, fontFamily: T.fontDisplay }}>
          <ArrowLeft size={12} /> Back to campaigns
        </button>
        <div className="flex items-center gap-2 mb-2">
          <Badge tone={campaign.status === "sent" ? "success" : "info"}>{campaign.status}</Badge>
          <div className="text-xs" style={{ color: T.textMute, fontFamily: T.fontMono }}>{campaign.sentAt ? `Sent ${fmtDate(campaign.sentAt)}` : "Draft"}</div>
        </div>
        <h1 className="text-4xl tracking-tight" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600, letterSpacing: "-0.02em" }}>{campaign.name}</h1>
        <div className="text-sm mt-2" style={{ color: T.textDim, fontFamily: T.fontDisplay }}>{campaign.subject}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Stat label="Sent" value={fmt(stats.sent)} icon={Send} />
        <Stat label="Delivered" value={fmt(stats.delivered)} sub={stats.sent ? `${((stats.delivered / stats.sent) * 100).toFixed(0)}%` : ""} icon={CheckCircle2} />
        <Stat label="Opened" value={fmt(stats.opened)} sub={`${or}%`} tone="accent" icon={Eye} />
        <Stat label="Clicked" value={fmt(stats.clicked)} sub={`${cr}%`} icon={MousePointerClick} />
        <Stat label="Bounced" value={fmt(stats.bounced)} sub={`${br}%`} icon={AlertCircle} />
        <Stat label="Unsubscribed" value={fmt(stats.unsubscribed)} icon={X} />
      </div>

      {/* Funnel */}
      <div className="p-6 rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
        <div className="text-base mb-5" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600 }}>Engagement funnel</div>
        <div className="space-y-4">
          {[
            { label: "Sent", value: stats.sent, max: stats.sent, color: T.textDim },
            { label: "Delivered", value: stats.delivered, max: stats.sent, color: T.blue },
            { label: "Opened", value: stats.opened, max: stats.sent, color: T.accent },
            { label: "Clicked", value: stats.clicked, max: stats.sent, color: "#a78bfa" },
          ].map(r => {
            const pct = r.max ? (r.value / r.max) * 100 : 0;
            return (
              <div key={r.label}>
                <div className="flex items-baseline justify-between text-xs mb-1.5" style={{ fontFamily: T.fontMono }}>
                  <span style={{ color: T.textDim }}>{r.label}</span>
                  <span style={{ color: T.text }}>{r.value} · {pct.toFixed(1)}%</span>
                </div>
                <div className="h-2 rounded overflow-hidden" style={{ backgroundColor: T.bg }}>
                  <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: r.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {timeline.length > 0 && (
        <div className="p-6 rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
          <div className="text-base mb-5" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600 }}>Opens & clicks over time</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={T.accent} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={T.accent} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={T.border} strokeDasharray="2 4" vertical={false} />
              <XAxis dataKey="t" stroke={T.textMute} fontSize={10} />
              <YAxis stroke={T.textMute} fontSize={10} />
              <Tooltip contentStyle={{ background: T.bg, border: `1px solid ${T.border}`, fontSize: 12 }} />
              <Area type="monotone" dataKey="opens" stroke={T.accent} fill="url(#g1)" strokeWidth={2} />
              <Area type="monotone" dataKey="clicks" stroke="#a78bfa" fill="url(#g2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

// ============= ANALYTICS =============
const Analytics = ({ campaigns }) => {
  const last30Sent = campaigns.flatMap(c => (c.events || []).filter(e => e.type === "sent" && Date.now() - e.timestamp < 30 * 86400000));

  const dailyData = useMemo(() => {
    const days = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const k = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      days[k] = { day: k, sent: 0, opened: 0, clicked: 0 };
    }
    campaigns.flatMap(c => c.events || []).forEach(e => {
      const d = new Date(e.timestamp);
      const k = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (days[k]) {
        if (e.type === "sent") days[k].sent++;
        else if (e.type === "opened") days[k].opened++;
        else if (e.type === "clicked") days[k].clicked++;
      }
    });
    return Object.values(days);
  }, [campaigns]);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] mb-2" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>Performance</div>
        <h1 className="text-4xl tracking-tight" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600, letterSpacing: "-0.02em" }}>Analytics</h1>
      </div>

      <div className="p-6 rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
        <div className="text-base mb-5" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600 }}>Last 30 days</div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={dailyData}>
            <defs>
              <linearGradient id="sentG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.blue} stopOpacity={0.3} />
                <stop offset="100%" stopColor={T.blue} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="openG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={T.accent} stopOpacity={0.4} />
                <stop offset="100%" stopColor={T.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={T.border} strokeDasharray="2 4" vertical={false} />
            <XAxis dataKey="day" stroke={T.textMute} fontSize={10} />
            <YAxis stroke={T.textMute} fontSize={10} />
            <Tooltip contentStyle={{ background: T.bg, border: `1px solid ${T.border}`, fontSize: 12 }} />
            <Area type="monotone" dataKey="sent" stroke={T.blue} fill="url(#sentG)" strokeWidth={2} />
            <Area type="monotone" dataKey="opened" stroke={T.accent} fill="url(#openG)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Total sent (30d)" value={fmt(last30Sent.length)} icon={Send} />
        <Stat label="Avg daily volume" value={fmt(Math.round(last30Sent.length / 30))} icon={TrendingUp} />
        <Stat label="Active campaigns" value={fmt(campaigns.filter(c => c.status === "sending").length)} icon={Activity} />
      </div>
    </div>
  );
};

// ============= SETTINGS =============
const SettingsPage = ({ smtpConfig, setSmtpConfig, resend = { configured: false } }) => {
  const [config, setConfig] = useState(smtpConfig);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSmtpConfig(config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const providers = [
    { id: "sendgrid", name: "SendGrid", host: "smtp.sendgrid.net", port: 587 },
    { id: "ses", name: "Amazon SES", host: "email-smtp.us-east-1.amazonaws.com", port: 587 },
    { id: "mailgun", name: "Mailgun", host: "smtp.mailgun.org", port: 587 },
    { id: "brevo", name: "Brevo (Sendinblue)", host: "smtp-relay.brevo.com", port: 587 },
    { id: "postmark", name: "Postmark", host: "smtp.postmarkapp.com", port: 587 },
    { id: "custom", name: "Custom SMTP", host: "", port: 587 },
  ];

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] mb-2" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>Configuration</div>
        <h1 className="text-4xl tracking-tight" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600, letterSpacing: "-0.02em" }}>Settings</h1>
      </div>

      {/* Real sending (Resend) */}
      <div className="p-6 rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${resend.configured ? "rgba(34,197,94,0.4)" : T.border}` }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Send size={16} style={{ color: T.accent }} />
            <div className="text-base" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600 }}>Real sending (Resend)</div>
          </div>
          <Badge tone={resend.configured ? "success" : "warn"}>{resend.configured ? "✓ Connected" : "Not configured"}</Badge>
        </div>
        {resend.configured ? (
          <div className="text-xs" style={{ color: T.textDim, fontFamily: T.fontDisplay }}>
            The server has a Resend API key{resend.from ? <> and a default from address (<span style={{ color: T.accent, fontFamily: T.fontMono }}>{resend.from}</span>)</> : ""}. Launching a campaign will deliver real email, and you can send a test from the campaign review step.
          </div>
        ) : (
          <div className="text-xs space-y-2" style={{ color: T.textDim, fontFamily: T.fontDisplay }}>
            <div>Sending runs in <span style={{ color: T.amber }}>simulation mode</span> until you add a server-side Resend key. The key is never exposed to the browser.</div>
            <ol className="space-y-1 ml-1" style={{ fontFamily: T.fontMono }}>
              <li>1. Get a key → <span style={{ color: T.accent }}>resend.com/api-keys</span></li>
              <li>2. Verify a domain → <span style={{ color: T.accent }}>resend.com/domains</span></li>
              <li>3. In <span style={{ color: T.accent }}>.env.local</span> set <span style={{ color: T.accent }}>RESEND_API_KEY</span> (and <span style={{ color: T.accent }}>RESEND_FROM</span>)</li>
              <li>4. Restart <span style={{ color: T.accent }}>npm run dev</span></li>
            </ol>
          </div>
        )}
      </div>

      <div className="p-6 rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-2 mb-2">
          <Server size={16} style={{ color: T.accent }} />
          <div className="text-base" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600 }}>SMTP (alternative / reference)</div>
        </div>
        <div className="text-xs mb-6" style={{ color: T.textDim, fontFamily: T.fontDisplay }}>
          Configure your SMTP service to actually send emails. Without this, the tool runs in simulation mode.
        </div>

        <div className="mb-5">
          <label className="text-[10px] uppercase tracking-wider block mb-3" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>Provider</label>
          <div className="grid grid-cols-3 gap-2">
            {providers.map(p => (
              <button key={p.id} onClick={() => setConfig({ ...config, provider: p.id, host: p.host, port: p.port })}
                className="p-3 rounded text-left transition"
                style={config.provider === p.id ? { backgroundColor: T.accentDim, border: `1px solid ${T.accent}` } : { backgroundColor: "transparent", border: `1px solid ${T.border}` }}>
                <div className="text-sm" style={{ color: T.text, fontFamily: T.fontDisplay, fontWeight: 500 }}>{p.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Input label="SMTP host" value={config.host} onChange={v => setConfig({ ...config, host: v })} placeholder="smtp.sendgrid.net" mono />
          <Input label="Port" value={config.port} onChange={v => setConfig({ ...config, port: v })} placeholder="587" mono />
          <Input label="Username / API key user" value={config.username} onChange={v => setConfig({ ...config, username: v })} placeholder="apikey" mono />
          <Input label="Password / API key" type="password" value={config.password} onChange={v => setConfig({ ...config, password: v })} placeholder="SG.xxxx..." mono />
          <Input label="Default from email" value={config.fromEmail} onChange={v => setConfig({ ...config, fromEmail: v })} placeholder="hello@yourdomain.com" mono />
          <Input label="Default from name" value={config.fromName} onChange={v => setConfig({ ...config, fromName: v })} placeholder="Your Brand" />
        </div>

        <div className="mt-6 flex items-center gap-2">
          <Btn icon={Key} onClick={save}>Save configuration</Btn>
          {saved && <Badge tone="success">✓ Saved</Badge>}
        </div>
      </div>

      <div className="p-6 rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
        <div className="text-base mb-3" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600 }}>Daily sending limits</div>
        <div className="text-xs mb-4" style={{ color: T.textDim }}>Protect your sender reputation with daily caps</div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Max emails per day" value={config.dailyLimit} onChange={v => setConfig({ ...config, dailyLimit: v })} placeholder="5000" mono />
          <Input label="Max emails per minute" value={config.rateLimit} onChange={v => setConfig({ ...config, rateLimit: v })} placeholder="100" mono />
        </div>
      </div>

      <div className="p-6 rounded" style={{ backgroundColor: "rgba(96,165,250,0.05)", border: `1px solid rgba(96,165,250,0.2)` }}>
        <div className="flex items-start gap-3">
          <AlertCircle size={18} style={{ color: T.blue }} className="flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm mb-2" style={{ color: T.text, fontWeight: 500 }}>Before sending 5,000+ emails/day</div>
            <ul className="text-xs space-y-1.5" style={{ color: T.textDim, fontFamily: T.fontDisplay }}>
              <li>• Set up SPF, DKIM, DMARC for your domain</li>
              <li>• Verify domain ownership with your provider</li>
              <li>• Use a dedicated IP (not shared) for high volume</li>
              <li>• Warm up the sending domain over 2-4 weeks</li>
              <li>• Only email opted-in subscribers (DPDP Act / GDPR)</li>
              <li>• Include unsubscribe link in every email</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============= SUPPRESSIONS =============
const REASON_TONE = { unsubscribed: "warn", bounced: "danger", complaint: "danger", manual: "default", imported: "info" };
const Suppressions = ({ suppressions, setSuppressions }) => {
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("manual");
  const [bulkText, setBulkText] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importStats, setImportStats] = useState(null);

  const filtered = useMemo(() =>
    suppressions.filter(s => !search || s.email.toLowerCase().includes(search.toLowerCase())),
    [suppressions, search]
  );

  const exists = (e) => suppressions.some(s => s.email.toLowerCase() === e.toLowerCase());

  const addOne = () => {
    if (!validateEmail(email)) { alert("Invalid email"); return; }
    if (exists(email)) { alert("Already suppressed"); return; }
    setSuppressions([{ id: uid(), email: email.trim(), reason, addedAt: Date.now() }, ...suppressions]);
    setEmail("");
  };

  const importBulk = () => {
    const lines = bulkText.split("\n").map(l => l.trim()).filter(Boolean);
    let added = 0, invalid = 0, duplicate = 0;
    const seen = new Set(suppressions.map(s => s.email.toLowerCase()));
    const fresh = [];
    lines.forEach(line => {
      const e = line.split(/[,;\t]/)[0].trim();
      if (!validateEmail(e)) { invalid++; return; }
      if (seen.has(e.toLowerCase())) { duplicate++; return; }
      seen.add(e.toLowerCase());
      fresh.push({ id: uid(), email: e, reason: "imported", addedAt: Date.now() });
      added++;
    });
    setSuppressions([...fresh, ...suppressions]);
    setImportStats({ added, invalid, duplicate });
  };

  const remove = (id) => { if (confirm("Remove from suppression list? They can be emailed again.")) setSuppressions(suppressions.filter(s => s.id !== id)); };

  const byReason = (r) => suppressions.filter(s => s.reason === r).length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] mb-2" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>Compliance</div>
          <h1 className="text-4xl tracking-tight" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600, letterSpacing: "-0.02em" }}>Suppression list</h1>
        </div>
        <Btn variant="secondary" icon={FileUp} onClick={() => setShowImport(true)}>Bulk import</Btn>
      </div>

      <div className="p-4 rounded flex items-start gap-3" style={{ backgroundColor: "rgba(96,165,250,0.05)", border: `1px solid rgba(96,165,250,0.2)` }}>
        <ShieldAlert size={18} style={{ color: T.blue }} className="flex-shrink-0 mt-0.5" />
        <div className="text-xs" style={{ color: T.textDim, fontFamily: T.fontDisplay }}>
          Addresses here are <span style={{ color: T.text }}>never emailed</span> — they're filtered out of every campaign automatically. Unsubscribes and hard bounces are added here for you.
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Stat label="Suppressed" value={fmt(suppressions.length)} tone="accent" icon={Ban} />
        <Stat label="Unsubscribed" value={fmt(byReason("unsubscribed"))} icon={X} />
        <Stat label="Bounced" value={fmt(byReason("bounced"))} icon={AlertCircle} />
        <Stat label="Complaints" value={fmt(byReason("complaint"))} icon={AlertTriangle} />
        <Stat label="Manual / imported" value={fmt(byReason("manual") + byReason("imported"))} icon={ShieldAlert} />
      </div>

      {/* Quick add */}
      <div className="p-5 rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
        <div className="text-[10px] uppercase tracking-wider mb-3" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>Add an address</div>
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <input placeholder="blocked@example.com" value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addOne()}
              className="w-full px-3 py-2 text-sm focus:outline-none rounded"
              style={{ backgroundColor: T.bg, border: `1px solid ${T.border}`, color: T.text, fontFamily: T.fontMono }} />
          </div>
          <select value={reason} onChange={e => setReason(e.target.value)}
            className="px-3 py-2 text-sm rounded focus:outline-none"
            style={{ backgroundColor: T.bg, border: `1px solid ${T.border}`, color: T.text, fontFamily: T.fontDisplay }}>
            <option value="manual">Manual</option>
            <option value="complaint">Complaint</option>
            <option value="bounced">Bounced</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
          <Btn icon={Plus} onClick={addOne} disabled={!email.trim()}>Suppress</Btn>
        </div>
      </div>

      {/* Import modal */}
      {showImport && (
        <div className="p-6 rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.accent}40` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-base" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600 }}>Bulk import suppressions</div>
            <button onClick={() => { setShowImport(false); setImportStats(null); setBulkText(""); }}><X size={16} style={{ color: T.textMute }} /></button>
          </div>
          <div className="text-xs mb-3 p-3 rounded" style={{ backgroundColor: T.bg, color: T.textDim, fontFamily: T.fontMono }}>
            One email per line. Imported entries are tagged <span style={{ color: T.accent }}>imported</span>.
          </div>
          <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} rows={8}
            placeholder="blocked1@example.com&#10;blocked2@example.com&#10;..."
            className="w-full px-3 py-2 text-sm focus:outline-none rounded"
            style={{ backgroundColor: T.bg, border: `1px solid ${T.border}`, color: T.text, fontFamily: T.fontMono }} />
          {importStats && (
            <div className="mt-4 p-3 rounded text-sm" style={{ backgroundColor: T.bg, fontFamily: T.fontDisplay }}>
              <div style={{ color: T.accent }}>✓ {importStats.added} added</div>
              {importStats.invalid > 0 && <div style={{ color: T.amber }}>⚠ {importStats.invalid} invalid skipped</div>}
              {importStats.duplicate > 0 && <div style={{ color: T.textDim }}>· {importStats.duplicate} duplicates ignored</div>}
            </div>
          )}
          <div className="flex gap-2 mt-5">
            <Btn icon={Upload} onClick={importBulk} disabled={!bulkText.trim()}>Import</Btn>
            <Btn variant="ghost" onClick={() => { setShowImport(false); setImportStats(null); setBulkText(""); }}>Done</Btn>
          </div>
        </div>
      )}

      {/* Search + table */}
      <div className="rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
        <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: T.border }}>
          <Search size={14} style={{ color: T.textMute }} className="ml-2" />
          <input placeholder="Search suppressed addresses..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none" style={{ color: T.text, fontFamily: T.fontDisplay }} />
          <div className="text-xs" style={{ color: T.textMute, fontFamily: T.fontMono }}>{filtered.length} / {suppressions.length}</div>
        </div>
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full">
            <thead className="sticky top-0" style={{ backgroundColor: T.bgCard }}>
              <tr className="text-[10px] uppercase tracking-wider border-b" style={{ borderColor: T.border, color: T.textMute, fontFamily: T.fontDisplay }}>
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium">Reason</th>
                <th className="text-right px-5 py-3 font-medium">Added</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-12" style={{ color: T.textMute }}>No suppressed addresses</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="border-b transition" style={{ borderColor: T.border }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = T.bgHover}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                  <td className="px-5 py-3 text-sm" style={{ color: T.text, fontFamily: T.fontMono }}>{s.email}</td>
                  <td className="px-5 py-3"><Badge tone={REASON_TONE[s.reason] || "default"}>{s.reason}</Badge></td>
                  <td className="px-5 py-3 text-right text-xs" style={{ color: T.textMute, fontFamily: T.fontMono }}>{fmtTime(s.addedAt)}</td>
                  <td className="px-5 py-3 text-right">
                    <button title="Remove from suppression list" onClick={() => remove(s.id)} className="transition" style={{ color: T.textMute }}
                      onMouseEnter={e => e.currentTarget.style.color = T.text}
                      onMouseLeave={e => e.currentTarget.style.color = T.textMute}>
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============= BOUNCED =============
const Bounced = ({ campaigns, onSuppress }) => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const rows = useMemo(() => {
    const all = campaigns.flatMap(c => (c.bounces || []).map(b => ({ ...b, campaign: c.name, campaignId: c.id })));
    return all.sort((a, b) => b.timestamp - a.timestamp);
  }, [campaigns]);

  const hardCount = rows.filter(r => r.type === "hard").length;
  const softCount = rows.filter(r => r.type === "soft").length;

  const filtered = useMemo(() =>
    rows.filter(r =>
      (typeFilter === "all" || r.type === typeFilter) &&
      (!search || r.email.toLowerCase().includes(search.toLowerCase()) || r.campaign.toLowerCase().includes(search.toLowerCase()))
    ),
    [rows, search, typeFilter]
  );

  const suppressHard = () => {
    const entries = rows.filter(r => r.type === "hard").map(r => ({ email: r.email, reason: "bounced" }));
    if (!entries.length) { alert("No hard bounces to suppress."); return; }
    if (confirm(`Add ${entries.length} hard-bounced ${entries.length === 1 ? "address" : "addresses"} to the suppression list?`)) onSuppress?.(entries);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] mb-2" style={{ color: T.textMute, fontFamily: T.fontDisplay, fontWeight: 500 }}>Deliverability</div>
          <h1 className="text-4xl tracking-tight" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600, letterSpacing: "-0.02em" }}>Bounced mail</h1>
        </div>
        <Btn variant="secondary" icon={Ban} onClick={suppressHard} disabled={hardCount === 0}>Suppress hard bounces</Btn>
      </div>

      <div className="p-4 rounded flex items-start gap-3" style={{ backgroundColor: "rgba(239,68,68,0.05)", border: `1px solid rgba(239,68,68,0.2)` }}>
        <AlertCircle size={18} style={{ color: T.red }} className="flex-shrink-0 mt-0.5" />
        <div className="text-xs" style={{ color: T.textDim, fontFamily: T.fontDisplay }}>
          <span style={{ color: T.text }}>Hard bounces</span> (invalid / non-existent addresses) hurt sender reputation — suppress them. <span style={{ color: T.text }}>Soft bounces</span> (mailbox full, temporary) usually clear on their own.
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Total bounced" value={fmt(rows.length)} tone="accent" icon={AlertCircle} />
        <Stat label="Hard" value={fmt(hardCount)} icon={Ban} />
        <Stat label="Soft" value={fmt(softCount)} icon={Clock} />
        <Stat label="Across campaigns" value={fmt(new Set(rows.map(r => r.campaignId)).size)} icon={Send} />
      </div>

      {/* Filters + table */}
      <div className="rounded" style={{ backgroundColor: T.bgCard, border: `1px solid ${T.border}` }}>
        <div className="p-3 border-b flex items-center gap-2 flex-wrap" style={{ borderColor: T.border }}>
          <Search size={14} style={{ color: T.textMute }} className="ml-2" />
          <input placeholder="Search by email or campaign..." value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm focus:outline-none min-w-[160px]" style={{ color: T.text, fontFamily: T.fontDisplay }} />
          <div className="flex gap-1">
            {["all", "hard", "soft"].map(f => (
              <button key={f} onClick={() => setTypeFilter(f)}
                className="px-3 py-1 text-xs rounded transition"
                style={typeFilter === f ? { backgroundColor: T.accent, color: "#000", fontFamily: T.fontDisplay, fontWeight: 500 }
                  : { backgroundColor: "transparent", color: T.textDim, border: `1px solid ${T.border}`, fontFamily: T.fontDisplay }}>
                {f}
              </button>
            ))}
          </div>
          <div className="text-xs" style={{ color: T.textMute, fontFamily: T.fontMono }}>{filtered.length} / {rows.length}</div>
        </div>
        <div className="overflow-auto max-h-[600px]">
          <table className="w-full">
            <thead className="sticky top-0" style={{ backgroundColor: T.bgCard }}>
              <tr className="text-[10px] uppercase tracking-wider border-b" style={{ borderColor: T.border, color: T.textMute, fontFamily: T.fontDisplay }}>
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium">Type</th>
                <th className="text-left px-5 py-3 font-medium">Reason</th>
                <th className="text-left px-5 py-3 font-medium">Campaign</th>
                <th className="text-right px-5 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12" style={{ color: T.textMute }}>No bounced mail</td></tr>
              ) : filtered.slice(0, 500).map(r => (
                <tr key={r.id} className="border-b transition" style={{ borderColor: T.border }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = T.bgHover}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                  <td className="px-5 py-3 text-sm" style={{ color: T.text, fontFamily: T.fontMono }}>{r.email}</td>
                  <td className="px-5 py-3"><Badge tone={r.type === "hard" ? "danger" : "warn"}>{r.type}</Badge></td>
                  <td className="px-5 py-3 text-sm" style={{ color: T.textDim, fontFamily: T.fontDisplay }}>{r.reason}</td>
                  <td className="px-5 py-3 text-sm truncate max-w-[220px]" style={{ color: T.textDim, fontFamily: T.fontDisplay }}>{r.campaign}</td>
                  <td className="px-5 py-3 text-right text-xs" style={{ color: T.textMute, fontFamily: T.fontMono }}>{fmtTime(r.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 500 && (
            <div className="px-5 py-2 text-center text-xs" style={{ color: T.textMute, fontFamily: T.fontMono }}>showing first 500 of {filtered.length}</div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============= MAIN APP =============
export default function App() {
  const [view, setView] = useState({ name: "dashboard" });
  const [campaigns, setCampaigns] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [templates, setTemplates] = useState(sampleTemplates());
  const [smtpConfig, setSmtpConfig] = useState({
    provider: "", host: "", port: "587", username: "", password: "",
    fromEmail: "", fromName: "", dailyLimit: "5000", rateLimit: "100"
  });
  const [suppressions, setSuppressions] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [sendingState, setSendingState] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [resend, setResend] = useState({ configured: false, from: null });

  // Ask the server whether real sending (Resend) is configured
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/send");
        if (r.ok) setResend(await r.json());
      } catch {}
    })();
  }, []);

  const smtpConfigured = smtpConfig.host && smtpConfig.username && smtpConfig.password;

  // Refs hold the latest data so the scheduler interval never reads stale state
  const campaignsRef = useRef(campaigns);
  const subscribersRef = useRef(subscribers);
  const suppressionsRef = useRef(suppressions);
  useEffect(() => { campaignsRef.current = campaigns; }, [campaigns]);
  useEffect(() => { subscribersRef.current = subscribers; }, [subscribers]);
  useEffect(() => { suppressionsRef.current = suppressions; }, [suppressions]);

  const pushToast = (msg) => {
    const id = uid();
    setToasts(prev => [...prev, { id, msg }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  useEffect(() => {
    (async () => {
      const s = await loadState();
      if (s) {
        setCampaigns(s.campaigns && s.campaigns.length ? s.campaigns : sampleCampaigns());
        setSubscribers(s.subscribers && s.subscribers.length ? s.subscribers : sampleSubscribers());
        if (s.templates) setTemplates(s.templates);
        if (s.smtpConfig) setSmtpConfig(s.smtpConfig);
        setSuppressions(s.suppressions && s.suppressions.length ? s.suppressions : sampleSuppressions());
      } else {
        setSubscribers(sampleSubscribers());
        setCampaigns(sampleCampaigns());
        setSuppressions(sampleSuppressions());
      }
      setLoaded(true);
    })();
  }, []);

  // Persist whenever the serialized data actually changes (single stable dependency)
  const snapshot = JSON.stringify({ campaigns, subscribers, templates, smtpConfig, suppressions });
  useEffect(() => {
    if (!loaded) return;
    saveState(JSON.parse(snapshot));
  }, [snapshot, loaded]);

  // Inject fonts + global styles
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap";
    document.head.appendChild(link);
    const style = document.createElement("style");
    style.textContent = `
      body { background: ${T.bg}; margin: 0; }
      * { box-sizing: border-box; }
      ::-webkit-scrollbar { width: 8px; height: 8px; }
      ::-webkit-scrollbar-track { background: ${T.bg}; }
      ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 4px; }
      ::-webkit-scrollbar-thumb:hover { background: ${T.textMute}; }
      ::selection { background: ${T.accent}; color: #000; }
      [contenteditable][data-placeholder]:empty:before {
        content: attr(data-placeholder);
        color: ${T.textMute};
        pointer-events: none;
      }
      .rte-body h2 { font-size: 1.15rem; font-weight: 600; margin: 0.4em 0; color: ${T.text}; }
      .rte-body p { margin: 0 0 0.6em; }
      .rte-body ul { list-style: disc; padding-left: 1.4em; margin: 0 0 0.6em; }
      .rte-body ol { list-style: decimal; padding-left: 1.4em; margin: 0 0 0.6em; }
      .rte-body a { color: ${T.accent}; text-decoration: underline; }
      .email-body h2 { font-size: 1.15rem; font-weight: 600; margin: 0.4em 0; color: ${T.text}; }
      .email-body p { margin: 0 0 0.7em; }
      .email-body ul { list-style: disc; padding-left: 1.4em; margin: 0 0 0.7em; }
      .email-body ol { list-style: decimal; padding-left: 1.4em; margin: 0 0 0.7em; }
      .email-body a { color: ${T.accent}; text-decoration: underline; }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(link); document.head.removeChild(style); };
  }, []);

  // Add addresses to the suppression list, de-duplicating against what's already there
  const addSuppressions = (entries) => {
    setSuppressions(prev => {
      const seen = new Set(prev.map(s => s.email.toLowerCase()));
      const fresh = [];
      entries.forEach(en => {
        const key = (en.email || "").toLowerCase();
        if (!key || seen.has(key)) return;
        seen.add(key);
        fresh.push({ id: uid(), email: en.email, reason: en.reason || "manual", addedAt: Date.now() });
      });
      return fresh.length ? [...fresh, ...prev] : prev;
    });
  };

  // Suppress a subscriber from the table: mark unsubscribed + add to suppression list
  const suppressSubscriber = (sub, reason = "unsubscribed") => {
    setSubscribers(prev => prev.map(s => s.id === sub.id ? { ...s, status: "unsubscribed" } : s));
    addSuppressions([{ email: sub.email, reason }]);
  };

  // Shared send simulation. Filters suppressed recipients at fire time, generates
  // events/stats, marks the campaign sent, and auto-suppresses bounces + unsubscribes.
  const simulateResults = (campaignId, recipientIds, sendRate, onDone) => {
    setTimeout(() => {
      const suppressedSet = new Set(suppressionsRef.current.map(s => s.email.toLowerCase()));
      const subMap = Object.fromEntries(subscribersRef.current.map(s => [s.id, s]));
      const sendIds = (recipientIds || []).filter(id => {
        const sub = subMap[id];
        return sub ? !suppressedSet.has(sub.email.toLowerCase()) : true;
      });

      const events = [];
      const startTs = Date.now();
      sendIds.forEach((id, i) => {
        const ts = startTs + i * (60000 / (sendRate || 100));
        events.push({ id: uid(), contactId: id, type: "sent", timestamp: ts });
        if (Math.random() > 0.04) {
          events.push({ id: uid(), contactId: id, type: "delivered", timestamp: ts + 1000 });
          if (Math.random() < 0.45) {
            events.push({ id: uid(), contactId: id, type: "opened", timestamp: ts + 5000 + Math.random() * 30000 });
            if (Math.random() < 0.20) events.push({ id: uid(), contactId: id, type: "clicked", timestamp: ts + 10000 + Math.random() * 60000 });
            if (Math.random() < 0.015) events.push({ id: uid(), contactId: id, type: "unsubscribed", timestamp: ts + 15000 });
          }
        } else {
          events.push({ id: uid(), contactId: id, type: "bounced", timestamp: ts + 500 });
        }
      });

      const stats = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 };
      const seenOpen = new Set(), seenClick = new Set();
      events.forEach(e => {
        if (e.type === "sent") stats.sent++;
        else if (e.type === "delivered") stats.delivered++;
        else if (e.type === "opened" && !seenOpen.has(e.contactId)) { stats.opened++; seenOpen.add(e.contactId); }
        else if (e.type === "clicked" && !seenClick.has(e.contactId)) { stats.clicked++; seenClick.add(e.contactId); }
        else if (e.type === "bounced") stats.bounced++;
        else if (e.type === "unsubscribed") stats.unsubscribed++;
      });

      // Bounce records (with the recipient's email, type and reason) for the Bounced page
      const bounces = events.filter(e => e.type === "bounced").map(e => {
        const sub = subMap[e.contactId];
        const meta = randBounceMeta();
        return { id: uid(), email: sub ? sub.email : randBounceEmail(), type: meta.type, reason: meta.reason, timestamp: e.timestamp };
      });

      setCampaigns(prev => prev.map(x => x.id === campaignId ? { ...x, status: "sent", stats, events, bounces, sentAt: x.sentAt || Date.now() } : x));

      // Auto-suppress hard bounces and unsubscribes
      const toSuppress = [];
      const seen = new Set();
      events.forEach(e => {
        if (e.type === "bounced" || e.type === "unsubscribed") {
          const sub = subMap[e.contactId];
          if (sub && !seen.has(sub.email.toLowerCase())) {
            seen.add(sub.email.toLowerCase());
            toSuppress.push({ email: sub.email, reason: e.type === "bounced" ? "bounced" : "unsubscribed" });
          }
        }
      });
      // Rare spam complaints among delivered mail → suppress as "complaint"
      events.filter(e => e.type === "delivered").forEach(e => {
        if (Math.random() < 0.002) {
          const sub = subMap[e.contactId];
          if (sub && !seen.has(sub.email.toLowerCase())) {
            seen.add(sub.email.toLowerCase());
            toSuppress.push({ email: sub.email, reason: "complaint" });
          }
        }
      });
      if (toSuppress.length) addSuppressions(toSuppress);

      onDone?.(campaignId);
    }, 3000);
  };

  // Real send via the /api/send route (Resend). No open/click data without webhooks,
  // so we record sent/delivered, and bounced for any address the API reports as failed.
  const realSend = async (c, data) => {
    const subMap = Object.fromEntries(subscribersRef.current.map(s => [s.id, s]));
    const suppressedSet = new Set(suppressionsRef.current.map(s => s.email.toLowerCase()));
    const recips = (data.recipientIds || []).map(id => subMap[id]).filter(Boolean)
      .filter(s => !suppressedSet.has(s.email.toLowerCase()))
      .map(s => ({ email: s.email, firstName: s.firstName, lastName: s.lastName, city: s.city, company: s.company || "" }));

    const failSet = new Set();
    let sent = 0, failed = 0;
    try {
      for (let i = 0; i < recips.length; i += 500) {
        const chunk = recips.slice(i, i + 500);
        const res = await fetch("/api/send", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ from: data.senderEmail, fromName: data.senderName, replyTo: data.replyTo, subject: data.subject, html: toHtml(data.body), recipients: chunk }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.message || json.error || `HTTP ${res.status}`);
        sent += json.sent || 0;
        failed += json.failed || 0;
        (json.failures || []).forEach(f => failSet.add((f.email || "").toLowerCase()));
      }
    } catch (e) {
      setSendingState(null);
      pushToast(`Send failed: ${e.message} — falling back to simulation.`);
      simulateResults(c.id, data.recipientIds, data.sendRate, (id) => setView({ name: "campaign_detail", id }));
      return;
    }

    const now = Date.now();
    const events = [], bounces = [];
    recips.forEach((r, idx) => {
      const id = (data.recipientIds || [])[idx];
      const ts = now + idx * 10;
      events.push({ id: uid(), contactId: id, type: "sent", timestamp: ts });
      if (failSet.has(r.email.toLowerCase())) {
        events.push({ id: uid(), contactId: id, type: "bounced", timestamp: ts + 500 });
        const meta = randBounceMeta();
        bounces.push({ id: uid(), email: r.email, type: meta.type, reason: meta.reason, timestamp: ts + 500 });
      } else {
        events.push({ id: uid(), contactId: id, type: "delivered", timestamp: ts + 1000 });
      }
    });
    const stats = { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 };
    events.forEach(e => { if (e.type === "sent") stats.sent++; else if (e.type === "delivered") stats.delivered++; else if (e.type === "bounced") stats.bounced++; });
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: "sent", stats, events, bounces, sentAt: x.sentAt || now } : x));
    if (bounces.length) addSuppressions(bounces.map(b => ({ email: b.email, reason: "bounced" })));
    setSendingState(null);
    pushToast(`Sent ${sent} email${sent === 1 ? "" : "s"} via Resend${failed ? ` · ${failed} failed` : ""}`);
    setView({ name: "campaign_detail", id: c.id });
  };

  const launchCampaign = async (data) => {
    const real = resend.configured;
    if (real && !confirm(`Send ${data.recipientIds.length} real email${data.recipientIds.length === 1 ? "" : "s"} via Resend now? This actually delivers mail.`)) return;
    const c = {
      id: uid(), ...data,
      status: "sending", createdAt: Date.now(), sentAt: Date.now(),
      stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
      events: [],
    };
    setCampaigns(prev => [c, ...prev]);
    setSendingState({ campaign: c, status: real ? "sending_real" : "simulating" });
    if (real) {
      await realSend(c, data);
    } else {
      simulateResults(c.id, data.recipientIds, data.sendRate, (id) => {
        setSendingState(null);
        setView({ name: "campaign_detail", id });
      });
    }
  };

  const scheduleCampaign = (data) => {
    const c = {
      id: uid(), ...data,
      status: "scheduled", createdAt: Date.now(), scheduledAt: new Date(data.scheduledTime).getTime(),
      stats: { sent: 0, delivered: 0, opened: 0, clicked: 0, bounced: 0, unsubscribed: 0 },
      events: [],
    };
    setCampaigns(prev => [c, ...prev]);
    setView({ name: "campaigns" });
  };

  // Scheduler: fire any scheduled campaign whose time has arrived (checked every 5s)
  useEffect(() => {
    if (!loaded) return;
    const tick = () => {
      const now = Date.now();
      const due = campaignsRef.current.filter(c => c.status === "scheduled" && c.scheduledAt && c.scheduledAt <= now);
      if (!due.length) return;
      const dueIds = new Set(due.map(c => c.id));
      // Flip to "sending" immediately so the next tick can't pick them up again
      setCampaigns(prev => prev.map(c => dueIds.has(c.id) ? { ...c, status: "sending", sentAt: now } : c));
      due.forEach(c => {
        pushToast(`Scheduled campaign “${c.name}” is now sending`);
        simulateResults(c.id, c.recipientIds, c.sendRate);
      });
    };
    tick();
    const iv = setInterval(tick, 5000);
    return () => clearInterval(iv);
  }, [loaded]);

  if (!loaded) return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: T.bg, color: T.textMute, fontFamily: T.fontMono }}>Loading...</div>;

  const selectedCampaign = view.name === "campaign_detail" ? campaigns.find(c => c.id === view.id) : null;

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: T.bg, color: T.text, fontFamily: T.fontDisplay }}>
      <Sidebar view={view} setView={setView} counts={{ campaigns: campaigns.length, subscribers: subscribers.length, suppressions: suppressions.length, bounced: campaigns.reduce((a, c) => a + (c.bounces?.length || 0), 0), templates: templates.length }} />
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8 md:p-10">
          {view.name === "dashboard" && <Dashboard campaigns={campaigns} subscribers={subscribers} suppressions={suppressions} smtpConfigured={smtpConfigured} setView={setView} onConfigure={() => setView({ name: "settings" })} />}
          {view.name === "campaigns" && <CampaignList campaigns={campaigns} setView={setView} />}
          {view.name === "subscribers" && <Subscribers subscribers={subscribers} setSubscribers={setSubscribers} onSuppress={suppressSubscriber} />}
          {view.name === "bounced" && <Bounced campaigns={campaigns} onSuppress={addSuppressions} />}
          {view.name === "suppressions" && <Suppressions suppressions={suppressions} setSuppressions={setSuppressions} />}
          {view.name === "templates" && <Templates templates={templates} setTemplates={setTemplates} onUse={t => setView({ name: "new_campaign", template: t })} />}
          {view.name === "analytics" && <Analytics campaigns={campaigns} />}
          {view.name === "settings" && <SettingsPage smtpConfig={smtpConfig} setSmtpConfig={setSmtpConfig} resend={resend} />}
          {view.name === "new_campaign" && <NewCampaign subscribers={subscribers} templates={templates} suppressions={suppressions} smtpConfigured={smtpConfigured} resendConfigured={resend.configured} initialTemplate={view.template} onLaunch={launchCampaign} onSchedule={scheduleCampaign} setView={setView} />}
          {view.name === "campaign_detail" && selectedCampaign && <CampaignDetail campaign={selectedCampaign} subscribers={subscribers} setView={setView} />}
        </div>
      </main>

      {/* Toasts */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 space-y-2">
          {toasts.map(t => (
            <div key={t.id} className="flex items-center gap-2 px-4 py-3 rounded shadow-lg"
              style={{ backgroundColor: T.bgCard, border: `1px solid ${T.accent}40`, maxWidth: 360 }}>
              <Send size={14} style={{ color: T.accent }} />
              <span className="text-sm" style={{ color: T.text, fontFamily: T.fontDisplay }}>{t.msg}</span>
            </div>
          ))}
        </div>
      )}

      {sendingState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.92)", backdropFilter: "blur(8px)" }}>
          <div className="text-center max-w-md p-8">
            <div className="inline-flex items-center gap-2 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: T.accent }}></span>
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: T.accent }}></span>
              </span>
              <span className="text-xs uppercase tracking-[0.2em]" style={{ color: T.accent, fontFamily: T.fontDisplay, fontWeight: 500 }}>
                {sendingState.status === "simulating" ? "Simulating send" : "Sending live"}
              </span>
            </div>
            <h2 className="text-3xl mb-3" style={{ fontFamily: T.fontDisplay, color: T.text, fontWeight: 600 }}>{sendingState.campaign.name}</h2>
            <p className="text-sm" style={{ color: T.textDim }}>
              {sendingState.status === "simulating"
                ? "Simulation mode — events will track but no real emails are sent. Configure Resend in Settings to send for real."
                : `Delivering ${sendingState.campaign.recipientIds.length.toLocaleString()} email${sendingState.campaign.recipientIds.length === 1 ? "" : "s"} via Resend…`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

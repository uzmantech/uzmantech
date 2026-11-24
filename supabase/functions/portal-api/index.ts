import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const url = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const sessionSecret = Deno.env.get("ADMIN_SESSION_SECRET") || "";
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
function b64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function decode64url(value: string): Uint8Array {
  let s = value.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}
function safeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function makeOtp(): string {
  const values = new Uint32Array(1);
  let value = 0;
  do {
    crypto.getRandomValues(values);
    value = values[0];
  } while (value >= 4294000000);
  return String(value % 1000000).padStart(6, "0");
}
function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return (name.length < 3 ? name[0] || "*" : name.slice(0, 2)) + "***@" + domain;
}
async function gmailAccessToken(): Promise<string> {
  const clientId = Deno.env.get("GMAIL_CLIENT_ID") || "";
  const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET") || "";
  const refreshToken = Deno.env.get("GMAIL_REFRESH_TOKEN") || "";
  if (!clientId || !clientSecret || !refreshToken) throw new Error("Google Gmail sunucu yetkilendirmesi eksik.");
  const form = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
    signal: AbortSignal.timeout(12000),
  });
  const tokenData = await tokenResponse.json().catch(() => ({}));
  if (!tokenResponse.ok || !tokenData.access_token) {
    console.error("Gmail OAuth refresh failed", tokenResponse.status, tokenData.error || "unknown");
    throw new Error("Google Gmail yetkilendirmesi yenilenemedi.");
  }
  return String(tokenData.access_token);
}
function gmailBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/g, "");
}

function escapeEmailHtml(value: string): string {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[char] || char));
}
function brandedEmailHtml(body: string, innerHtml?: string): string {
  const lowerHtml = String(innerHtml || "").toLowerCase();
  const bodyStart = lowerHtml.indexOf("<body");
  const contentStart = bodyStart >= 0 ? lowerHtml.indexOf(">", bodyStart) + 1 : -1;
  const contentEnd = lowerHtml.lastIndexOf("</body>");
  const innerBody = contentStart > 0 && contentEnd > contentStart ? innerHtml!.slice(contentStart, contentEnd) : (innerHtml || "");
  const content = innerBody || ('<div style="font-size:15px;line-height:1.85;color:#334155;white-space:pre-line">' + escapeEmailHtml(body).replace(/\n/g, "<br>") + '</div>');
  return `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>Uzmantech</title></head>
<body style="margin:0;padding:0;background:#eef3f9;font-family:Arial,Helvetica,sans-serif;color:#172033">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#eef3f9;padding:30px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 12px 35px rgba(15,40,75,.10)">
<tr><td bgcolor="#ffffff" style="padding:24px 30px;background-color:#ffffff !important;border-bottom:4px solid #1476d4">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
<td align="center" style="padding:4px 0 12px"><img src="https://uzmantool.com.tr/assets/images/uzmantech-email-logo.jpg" width="92" height="92" alt="Uzmantech logosu" style="display:block;width:92px;height:92px;object-fit:contain;border:0;background-color:#ffffff"></td>
</tr><tr><td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:1.3;font-weight:800;letter-spacing:1px;color:#102a56 !important;-webkit-text-fill-color:#102a56">UZMANTECH</td></tr>
<tr><td align="center" style="padding-top:7px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#42566f !important;-webkit-text-fill-color:#42566f">Cep telefonu yazılım ve servis çözümleri</td></tr>
</table></td></tr>
<tr><td style="padding:32px 30px">${content}</td></tr>
<tr><td style="padding:19px 30px;background:#f7f9fc;border-top:1px solid #e8eef5">
<div style="font-size:13px;font-weight:700;color:#243b59">Uzmantech</div>
<div style="font-size:11px;line-height:1.7;color:#718096;margin-top:5px">Bu e-posta Uzmantech hesabınızla ilgili otomatik bir bilgilendirmedir.</div>
<a href="https://uzmantool.com.tr" style="display:inline-block;margin-top:7px;font-size:12px;color:#1769bd;text-decoration:none">uzmantool.com.tr</a>
</td></tr></table>
<div style="font-size:10px;color:#93a2b5;margin-top:15px">© Uzmantech</div>
</td></tr></table></body></html>`;
}
async function sendPortalEmail(recipient: string, subject: string, body: string, html?: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(recipient)) {
    throw new Error("Alıcı e-posta adresi geçersiz.");
  }

  // Preferred transactional provider: Resend.
  const resendKey = (Deno.env.get("RESEND_API_KEY") || "").trim();
  if (resendKey) {
    const configuredFrom = (Deno.env.get("RESEND_FROM_EMAIL") || "").trim();
    const fromMatch = configuredFrom.match(/<([^<>]+)>/);
    const fromAddress = (fromMatch ? fromMatch[1] : configuredFrom).trim();
    const from = fromAddress.includes("@") ? "Uzmantech <" + fromAddress + ">" : configuredFrom;
    if (!from || !/^[^<>]+\s*<[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+>$|^[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+$/.test(from)) {
      throw new Error("RESEND_FROM_EMAIL eksik veya geçersiz. Doğrulanmış alan adındaki gönderici adresini tanımlayın.");
    }
    const sendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + resendKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject,
        text: body,
        html: brandedEmailHtml(body, html),
      }),
      signal: AbortSignal.timeout(20000),
    });
    const sendData = await sendResponse.json().catch(() => ({}));
    if (!sendResponse.ok || !sendData.id) {
      const providerMessage = String(sendData.message || sendData.error || "Resend gönderimi reddetti.").slice(0, 300);
      console.error("Resend email send failed", sendResponse.status, providerMessage);
      throw new Error("Resend e-posta gönderimi başarısız: " + providerMessage);
    }
    console.info("Transactional email accepted by Resend", { id: sendData.id });
    return { provider: "resend", id: String(sendData.id) };
  }

  // Temporary fallback until RESEND_API_KEY is configured.
  const configuredSender = (Deno.env.get("GMAIL_FROM_EMAIL") || "").trim();
  const senderMatch = configuredSender.match(/<([^<>]+)>/);
  const configuredEmail = (senderMatch ? senderMatch[1] : configuredSender).trim();
  const senderEmail = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(configuredEmail)
    ? configuredEmail
    : "uzmantech58@gmail.com";
  if (!configuredSender || senderEmail === "uzmantech58@gmail.com" && configuredEmail !== senderEmail) {
    console.warn("GMAIL_FROM_EMAIL is missing or malformed; using the configured fallback sender.");
  }
  const senderDisplay = "Uzmantech <" + senderEmail + ">";
  const token = await gmailAccessToken();
  const encodedSubject = "=?UTF-8?B?" + btoa(unescape(encodeURIComponent(subject))) + "?=";
  const effectiveHtml = brandedEmailHtml(body, html);
  const rawMessage = [
        "To: " + recipient,
        "From: " + senderDisplay,
        "Subject: " + encodedSubject,
        "MIME-Version: 1.0",
        "Content-Type: multipart/alternative; boundary=\"uzmantech_alt_boundary\"",
        "",
        "--uzmantech_alt_boundary",
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        gmailBase64Url(new TextEncoder().encode(body || "")),
        "--uzmantech_alt_boundary",
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        gmailBase64Url(new TextEncoder().encode(brandedEmailHtml(body, html))),
        "--uzmantech_alt_boundary--",
      ].join("\r\n");
  const raw = gmailBase64Url(new TextEncoder().encode(rawMessage));
  const sendResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
    signal: AbortSignal.timeout(20000),
  });
  const sendData = await sendResponse.json().catch(() => ({}));
  if (!sendResponse.ok || !sendData.id) {
    console.error("Gmail message send failed", sendResponse.status, sendData.error?.message || "unknown");
    throw new Error("Google Gmail e-postayı gönderemedi.");
  }
  return { provider: "gmail", id: String(sendData.id) };
}

async function sendResendOnly(recipient: string, subject: string, body: string, html: string) {
  const key = (Deno.env.get("RESEND_API_KEY") || "").trim();
  const configuredFrom = (Deno.env.get("RESEND_FROM_EMAIL") || "").trim();
  if (!key || !configuredFrom) throw new Error("Resend yapılandırması eksik: RESEND_API_KEY veya RESEND_FROM_EMAIL bulunamadı.");
  const match = configuredFrom.match(/<([^<>]+)>/);
  const address = (match ? match[1] : configuredFrom).trim();
  const from = address.includes("@") ? "Uzmantech <" + address + ">" : configuredFrom;
  if (!/^[^<>]+\\s*<[^<>\\s@]+@[^<>\\s@]+\\.[^<>\\s@]+>$|^[^<>\\s@]+@[^<>\\s@]+\\.[^<>\\s@]+$/.test(from)) {
    throw new Error("RESEND_FROM_EMAIL geçersiz.");
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [recipient], subject, text: body, html: brandedEmailHtml(body, html) }),
    signal: AbortSignal.timeout(20000),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.id) throw new Error("Resend gönderimi başarısız: " + String(data.message || data.error || r.status).slice(0, 250));
  return String(data.id);
}

async function queuePortalEmail(recipient: string, subject: string, body: string, html?: string) {
  const { data: job, error: insertError } = await db.from("portal_email_outbox").insert({
    recipient, subject, body, status: "queued",
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  }).select("id").single();
  if (insertError || !job) return { error: insertError || new Error("E-posta kuyruğu oluşturulamadı.") };
  const { error: claimError } = await db.from("portal_email_outbox").update({
    status: "sending", attempts: 1, lease_until: new Date(Date.now() + 60000).toISOString(), last_error: null,
  }).eq("id", job.id).eq("status", "queued");
  if (claimError) return { error: claimError };
  try {
    const providerResult = await sendPortalEmail(recipient, subject, body, html);
    const { error: sentError } = await db.from("portal_email_outbox").update({
      status: "sent", provider_id: providerResult?.id || null, body: null, sent_at: new Date().toISOString(), lease_until: null, last_error: null,
    }).eq("id", job.id).eq("status", "sending");
    if (sentError) {
      console.error("Gmail sent but outbox status update failed", sentError);
      return { error: sentError };
    }
    return { error: null };
  } catch (sendError) {
    const safeMessage = sendError instanceof Error ? sendError.message : "Gmail gönderimi başarısız.";
    await db.from("portal_email_outbox").update({
      status: "failed", body: null, lease_until: null, last_error: safeMessage.slice(0, 500),
    }).eq("id", job.id).eq("status", "sending");
    return { error: sendError };
  }
}
async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = String(stored || "").split("$");
    if (parts.length !== 4 || parts[0] !== "pbkdf2_sha256") return false;
    const iterations = Number(parts[1]);
    if (!Number.isInteger(iterations) || iterations < 100000 || iterations > 2000000) return false;
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt: decode64url(parts[2]), iterations, hash: "SHA-256" },
      key,
      decode64url(parts[3]).length * 8,
    );
    return safeEqual(new Uint8Array(bits), decode64url(parts[3]));
  } catch { return false; }
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" }, key, 256,
  );
  return "pbkdf2_sha256$310000$" + b64url(salt) + "$" + b64url(new Uint8Array(bits));
}
async function signSession(user: { id: string; role: string }) {
  if (!sessionSecret) throw new Error("Oturum anahtarı yapılandırılmamış.");
  const payload = b64url(new TextEncoder().encode(JSON.stringify({
    sub: user.id, role: user.role, web: true,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
  })));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(sessionSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload)));
  return payload + "." + b64url(signature);
}
async function verifySession(token: string, allowExpired = false) {
  if (!sessionSecret || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  try {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(sessionSecret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    if (!await crypto.subtle.verify("HMAC", key, decode64url(parts[1]), new TextEncoder().encode(parts[0]))) return null;
    const payload = JSON.parse(new TextDecoder().decode(decode64url(parts[0])));
    if (!payload.sub || Number(payload.exp) <= Math.floor(Date.now() / 1000)) return null;
    const { data: user, error } = await db.from("users")
      .select("id,username,email,phone,country_code,language_code,registration_channel,role,status,email_verified,created_at,last_login,disabled_reason,expiry_date,license_plan,license_days,license_started_at")
      .eq("id", payload.sub).maybeSingle();
    if (error || !user || user.email_verified !== true) return null;
    if (user.role !== "admin" && !["web", "unknown"].includes(String(user.registration_channel || "unknown"))) return null;

    const expiryTime = user.expiry_date ? new Date(user.expiry_date).getTime() : 0;
    const expired = user.role !== "admin" && (!expiryTime || expiryTime <= Date.now());
    const renewalOnly = user.status === "disabled"
      && user.disabled_reason === "license_expired"
      && !!expiryTime
      && expiryTime <= Date.now();

    if (user.status !== "active" && !(allowExpired && renewalOnly)) return null;
    if (!allowExpired && user.role !== "admin" && expired) return null;
    if (!allowExpired && user.expiry_date && expiryTime <= Date.now()) return null;

    return {
      ...user,
      role: user.role,
      tokenRole: String(payload.role || "user"),
      membership_expired: expired,
      renewal_only: renewalOnly,
      license_status: user.role === "admin" ? "admin" : (!expiryTime ? "unassigned" : (expiryTime <= Date.now() ? "expired" : "active")),
    };
  } catch { return null; }
}

let enparaRateCache: { value: number; at: number } | null = null;
async function getEnparaUsdSell(): Promise<number> {
  if (enparaRateCache && Date.now() - enparaRateCache.at < 60_000) return enparaRateCache.value;
  const res = await fetch("https://www.enpara.com/hesaplar/doviz-ve-altin-kurlari", {
    headers: { "Accept": "text/html", "User-Agent": "UzmantechPortal/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error("Enpara kur sayfasına ulaşılamadı.");
  const html = await res.text();
  const plain = html.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ");
  const match = plain.match(/USD\s*\(\s*\$\s*\)\s*([\d.,]+)\s*TL\s*([\d.,]+)\s*TL/i)
    || plain.match(/USD[\s\S]{0,250}?([\d.,]+)\s*TL[\s\S]{0,100}?([\d.,]+)\s*TL/i);
  if (!match) throw new Error("Enpara USD satış kuru sayfadan okunamadı.");
  const parseTr = (v: string) => Number(v.replace(/\./g, "").replace(",", "."));
  const sell = parseTr(match[2]);
  if (!Number.isFinite(sell) || sell < 1 || sell > 10000) throw new Error("Enpara USD satış kuru geçersiz.");
  enparaRateCache = { value: sell, at: Date.now() };
  return sell;
}

function tokenFrom(req: Request) {
  const header = req.headers.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}
function scrubLinks(value: any): any {
  if (typeof value === "string") {
    const https = value.indexOf("https://");
    const http = value.indexOf("http://");
    const positions = [https, http].filter(x => x >= 0);
    return positions.length ? value.slice(0, Math.min(...positions)).trim() : value;
  }
  if (Array.isArray(value)) return value.map((item, index) => index === 4 && typeof item === "string" ? "" : scrubLinks(item));
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    if (/(download|file|direct|mirror|drive|mega|url|link)/i.test(key)) continue;
    out[key] = scrubLinks(item);
  }
  return out;
}

const paidArchivePlans = new Set(["weekly", "monthly", "half_year", "annual", "365", "full_365", "custom"]);
function hasPaidArchiveAccess(member: any): boolean {
  return !!member && (
    member.role === "admin" ||
    (member.status === "active" && !member.membership_expired &&
      paidArchivePlans.has(String(member.license_plan || "").toLowerCase()))
  );
}


type GlassModel = { brand: string; model: string };
type GlassGroup = { group: string; url: string; models: string[] };
let glassCatalogCache: { groups: GlassGroup[]; at: number } | null = null;
const glassSourceUrl = "https://www.simkon.com.tr/uyumluluk";
const glassBrands: Record<string, string> = {
  apple:"Apple", samsung:"Samsung", xiaomi:"Xiaomi", redmi:"Redmi", poco:"POCO",
  oppo:"OPPO", vivo:"Vivo", realme:"Realme", huawei:"Huawei", honor:"Honor",
  motorola:"Motorola", oneplus:"OnePlus", tecno:"Tecno", infinix:"Infinix", lg:"LG",
  tcl:"TCL", wiko:"Wiko", nokia:"Nokia", iqoo:"iQOO", meizu:"Meizu", zte:"ZTE",
  asus:"ASUS", sony:"Sony", google:"Google", htc:"HTC", lenovo:"Lenovo",
  reeder:"Reeder", vestel:"Vestel", casper:"Casper", omix:"OMIX",
  "general mobile":"General Mobile", gm:"General Mobile",
};
function glassText(value: string): string {
  return value.replace(/<script\b[\s\S]*?<\/script>/gi," ")
    .replace(/<style\b[\s\S]*?<\/style>/gi," ")
    .replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/gi," ")
    .replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
    .replace(/\s+/g," ").trim();
}
function glassNorm(value: string): string {
  return value.toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/ı/g,"i").replace(/\s+/g," ").trim();
}
function glassSearchMatches(model: string, query: string): boolean {
  const normalizedModel = glassNorm(model);
  const normalizedQuery = glassNorm(query);
  const compactModel = normalizedModel.replace(/[^a-z0-9]/g, "");
  const compactQuery = normalizedQuery.replace(/[^a-z0-9]/g, "");
  if (compactQuery && compactModel.includes(compactQuery)) return true;
  const queryTerms = normalizedQuery.split(/[^a-z0-9]+/).filter(Boolean);
  const modelTerms = normalizedModel.split(/[^a-z0-9]+/).filter(Boolean);
  return queryTerms.length > 0 && queryTerms.every(term => modelTerms.some(candidate => candidate.includes(term)));
}
function parseGlassGroup(url: string, html: string): GlassGroup | null {
  const titleMatch = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  const title = titleMatch ? glassText(titleMatch[1]) : "Kırılmaz cam kalıbı";
  const models: string[] = [];
  const sections = [...html.matchAll(/<h2\b[^>]*>([\s\S]*?)<\/h2>([\s\S]*?)(?=<h2\b[^>]*>|$)/gi)];
  for (const section of sections) {
    const brand = glassBrands[glassNorm(glassText(section[1]))];
    if (!brand) continue;
    for (const li of section[2].matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
      let model = glassText(li[1]);
      if (!model || model.length > 120) continue;
      const key = glassNorm(model);
      if (/toptan fiyatina|basvuru formu|bayilik|hakkimizda|iletisim|uyumluluk arac|kay[n]agi ac/.test(key)) continue;
      if (!glassNorm(model).startsWith(glassNorm(brand)+" ") && glassNorm(model)!==glassNorm(brand)) {
        if (brand==="Apple" && /^iphone\b/i.test(model)) model = model;
        else if (brand==="Xiaomi" && /^(redmi|poco|xiaomi)\b/i.test(model)) model = model;
        else model = brand+" "+model;
      }
      if (model.split(/\s+/).length <= 14) models.push(model);
    }
  }
  const unique = [...new Map(models.map(m=>[glassNorm(m),m])).values()];
  return unique.length ? { group:title, url, models:unique } : null;
}
async function loadGlassCatalog(): Promise<GlassGroup[]> {
  if (glassCatalogCache && Date.now()-glassCatalogCache.at < 6*60*60*1000) return glassCatalogCache.groups;
  const headers = { "User-Agent":"UzmantechPortal/1.0", "Accept":"text/html,application/xhtml+xml", "Accept-Language":"tr-TR,tr;q=0.9" };
  const mainRes = await fetch(glassSourceUrl,{headers,signal:AbortSignal.timeout(12000)});
  if (!mainRes.ok) throw new Error("Cam uyumluluk kaynağına ulaşılamadı.");
  const mainHtml = await mainRes.text();
  const links = [...mainHtml.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map(m=>({url:new URL(m[1],glassSourceUrl).toString().split("#")[0],label:glassText(m[2])}))
    .filter(x=>new URL(x.url).hostname==="www.simkon.com.tr" && new URL(x.url).pathname.startsWith("/uyumluluk/") && /kal[ıi]b[ıi]/i.test(x.label));
  const uniqueLinks = [...new Map(links.map(x=>[x.url,x])).values()];
  if (!uniqueLinks.length) throw new Error("Cam kalıp listesi kaynak sayfada bulunamadı.");
  const groups: GlassGroup[] = [];
  let cursor = 0;
  const workers = Array.from({length:8},async()=>{
    while(cursor<uniqueLinks.length){
      const item=uniqueLinks[cursor++];
      try {
        const res=await fetch(item.url,{headers,signal:AbortSignal.timeout(10000)});
        if(res.ok){const group=parseGlassGroup(item.url,await res.text());if(group)groups.push(group);}
      } catch(error) { console.warn("Glass group fetch failed",item.url,error); }
    }
  });
  await Promise.all(workers);
  if (!groups.length) throw new Error("Cam kalıp verileri okunamadı.");
  groups.sort((a,b)=>a.group.localeCompare(b.group,"tr"));
  glassCatalogCache={groups,at:Date.now()};
  return groups;
}



type SamFwFirmware = { model:string; csc:string; version:string; bit:string; patch:string; os:string; buildDate:string; sourceUrl:string };
const samfwCache = new Map<string,{items:SamFwFirmware[];at:number}>();
const samfwBase = "https://samfw.com";
function samfwText(value:string):string {
 return value.replace(/<script\b[\s\S]*?<\/script>/gi," ").replace(/<style\b[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/\s+/g," ").trim();
}
async function loadSamFwFirmware(model:string,csc="TUR"):Promise<SamFwFirmware[]> {
 const key=model.toUpperCase(),region=csc.toUpperCase(),cacheKey=key+"|"+region,cached=samfwCache.get(cacheKey);
 if(cached&&Date.now()-cached.at<30*60*1000)return cached.items;
 if(!/^SM-[A-Z0-9]+$/.test(key))throw new Error("Geçerli Samsung model kodu girin.");
 if(!/^[A-Z0-9]{3}$/.test(region))throw new Error("CSC kodu 3 karakter olmalıdır.");
 const source=new URL("/firmware/"+encodeURIComponent(key)+"/"+encodeURIComponent(region)+"/",samfwBase).toString();
 const res=await fetch(source,{headers:{"User-Agent":"Mozilla/5.0 (compatible; UzmantechPortal/1.0)","Accept":"text/html,application/xhtml+xml"},signal:AbortSignal.timeout(20000)});
 if(!res.ok)throw new Error("SamFW firmware sayfasına ulaşılamadı.");
 const html=await res.text(),heading=html.search(/Samsung firmware\s+SM-/i),tableStart=heading>=0?html.indexOf("<table",heading):html.indexOf("<table"),tableEnd=tableStart>=0?html.indexOf("</table>",tableStart):-1;
 if(tableStart<0||tableEnd<0)throw new Error("SamFW firmware tablosu bulunamadı.");
 const table=html.slice(tableStart,tableEnd+8),items:SamFwFirmware[]=[];
 for(const row of table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
  const cells=[...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(x=>x[1]);if(cells.length<5)continue;
  const values=cells.map(samfwText),version=values.find(x=>/^[A-Z0-9]{8,20}$/.test(x)),rowCsc=values.find(x=>/^[A-Z]{3}$/.test(x));if(!version||!rowCsc||rowCsc!==region)continue;
  const anchors=[...row[1].matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)].map(x=>x[1]);
  const candidate=anchors.map(x=>{try{return new URL(x,samfwBase)}catch{return null}}).find(x=>x&&x.protocol==="https:"&&x.hostname==="samfw.com"&&x.pathname.startsWith("/firmware/"));
  items.push({model:key,csc:rowCsc,version,bit:values.find(x=>/^[0-9A-F]$/.test(x))||"",patch:values.find(x=>/^20\d{2}-\d{2}-\d{2}$/.test(x))||"",os:values.find(x=>/Android\s+\d+/i.test(x))||"",buildDate:values.find(x=>/^20\d{13,}$/.test(x))||"",sourceUrl:candidate?.toString()||source});
 }
 const unique=[...new Map(items.map(x=>[x.csc+"|"+x.version+"|"+x.buildDate,x])).values()];if(!unique.length)throw new Error("SamFW bu model ve CSC kodu için firmware kaydı döndürmedi.");
 samfwCache.set(cacheKey,{items:unique,at:Date.now()});return unique;
}

type EngineerRom = { model: string; codename: string; sourceUrl: string };
let engineerRomCache: { items: EngineerRom[]; at: number } | null = null;
const engineerRomSource = "https://xiaomitools.com/xiaomi-engineer-rom/";
function romText(value: string): string {
  return value.replace(/<script\b[\s\S]*?<\/script>/gi, " ").replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/&nbsp;|&#160;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/\s+/g, " ").trim();
}
async function loadEngineerRoms(): Promise<EngineerRom[]> {
  if (engineerRomCache && Date.now()-engineerRomCache.at < 3*60*60*1000) return engineerRomCache.items;
  const res=await fetch(engineerRomSource,{headers:{"User-Agent":"Mozilla/5.0 (compatible; UzmantechPortal/1.0)","Accept":"text/html,application/xhtml+xml"},signal:AbortSignal.timeout(15000)});
  if(!res.ok) throw new Error("Xiaomi Tools kaynak sayfasına ulaşılamadı.");
  const html=await res.text(); const tableMatch=html.match(/<table\b[\s\S]*?<\/table>/i);
  if(!tableMatch) throw new Error("Engineer ROM tablosu kaynak sayfada bulunamadı.");
  const items:EngineerRom[]=[];
  for(const row of tableMatch[0].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)){
    const cells=[...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(x=>x[1]);
    if(cells.length<3) continue;
    const model=romText(cells[0]),codename=romText(cells[1]);
    const a=cells[2].match(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if(!model||!codename||!a) continue;
    try { const u=new URL(a[1],engineerRomSource); if(u.protocol!=="https:"||!["xiaomitools.com","www.xiaomitools.com"].includes(u.hostname)) continue; items.push({model,codename,sourceUrl:u.toString()}); } catch {}
  }
  const unique=[...new Map(items.map(x=>[x.sourceUrl,x])).values()];
  if(!unique.length) throw new Error("Engineer ROM kayıtları okunamadı.");
  engineerRomCache={items:unique,at:Date.now()}; return unique;
}


type NewsFeedSource = { name: string; url: string; hosts: string[] };
const NEWS_FEEDS: NewsFeedSource[] = [
  { name: "DonanımHaber", url: "https://www.donanimhaber.com/rss/tum/", hosts: ["donanimhaber.com", "www.donanimhaber.com"] },
  { name: "Webtekno", url: "https://www.webtekno.com/rss.xml", hosts: ["webtekno.com", "www.webtekno.com"] },
  { name: "ShiftDelete.Net", url: "https://shiftdelete.net/feed", hosts: ["shiftdelete.net", "www.shiftdelete.net"] },
  { name: "Technopat", url: "https://www.technopat.net/feed/", hosts: ["technopat.net", "www.technopat.net"] },
  { name: "Webrazzi", url: "https://webrazzi.com/feed", hosts: ["webrazzi.com", "www.webrazzi.com"] },
];
function newsXmlDecode(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/\s+/g, " ").trim();
}
function newsTag(xml: string, tag: string): string {
  const pattern = "<(?:[\\w.-]+:)?" + tag + "\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w.-]+:)?" + tag + "\\s*>";
  const match = xml.match(new RegExp(pattern, "i"));
  return match?.[1] || "";
}
function newsImage(xml: string): string | null {
  const candidates = [
    xml.match(/<(?:[\w.-]+:)?(?:content|thumbnail)\b[^>]*\burl=["']([^"']+)["']/i)?.[1],
    xml.match(/<enclosure\b[^>]*\burl=["']([^"']+)["']/i)?.[1],
    xml.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)?.[1],
  ];
  for (const value of candidates) {
    try { const u = new URL(newsXmlDecode(value || "")); if (u.protocol === "https:") return u.toString(); } catch {}
  }
  return null;
}
function newsSummary(xml: string): string {
  const raw = newsTag(xml, "description") || newsTag(xml, "summary") || newsTag(xml, "encoded") || newsTag(xml, "content");
  return newsXmlDecode(raw).slice(0, 360);
}
function newsSlugBase(value: string): string {
  return value.toLocaleLowerCase("tr-TR").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s")
    .replace(/ı/g,"i").replace(/ö/g,"o").replace(/ç/g,"c").normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,100) || "teknoloji-haberi";
}
async function parseNewsFeed(source: NewsFeedSource): Promise<any[]> {
  const res = await fetch(source.url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; UzmantechNewsBot/1.0; +https://uzmantool.com.tr)", "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8" },
    signal: AbortSignal.timeout(14000),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const xml = await res.text();
  if (!/<(?:rss|feed|rdf:RDF)\b/i.test(xml)) throw new Error("RSS/Atom XML formatı tanınmadı");
  const blocks = [...xml.matchAll(/<(item|entry)\b[^>]*>[\s\S]*?<\/\1\s*>/gi)].map(m => m[0]).slice(0, 35);
  const items: any[] = [];
  for (const block of blocks) {
    const title = newsXmlDecode(newsTag(block, "title"));
    const linkRaw = newsTag(block, "link");
    const atomHref = linkRaw.match(/\bhref=["']([^"']+)["']/i)?.[1];
    const linkText = newsXmlDecode(linkRaw);
    const link = atomHref || linkText;
    let parsed: URL;
    try { parsed = new URL(link); } catch { continue; }
    if (parsed.protocol !== "https:" || !source.hosts.includes(parsed.hostname.toLowerCase()) || !title) continue;
    const dateRaw = newsXmlDecode(newsTag(block, "pubDate") || newsTag(block, "published") || newsTag(block, "updated") || newsTag(block, "date"));
    const date = dateRaw ? new Date(dateRaw) : new Date();
    const publishedAt = Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    const summary = newsSummary(block) || title;
    const imageUrl = newsImage(block);
    const digest = await sha256Hex(parsed.toString());
    items.push({
      slug: newsSlugBase(title) + "-" + digest.slice(0, 10),
      title: title.slice(0, 300), summary, source_name: source.name,
      source_url: parsed.toString(), source_published_at: publishedAt,
      category: "technology", image_url: imageUrl, published_at: publishedAt, is_published: true,
    });
  }
  return [...new Map(items.map(item => [item.source_url, item])).values()];
}
async function syncPortalNews() {
  const { data: run, error: runError } = await db.from("portal_news_sync_runs").insert({ status: "running" }).select("id").single();
  if (runError || !run) throw new Error("Haber senkronizasyon kaydı açılamadı.");
  const results: any[] = [], allItems: any[] = [];
  for (const source of NEWS_FEEDS) {
    try {
      const items = await parseNewsFeed(source);
      allItems.push(...items);
      results.push({ source: source.name, fetched: items.length, status: "success" });
    } catch (error) {
      const message = String(error instanceof Error ? error.message : error).slice(0, 220);
      console.error("News RSS source failed", source.name, message);
      results.push({ source: source.name, fetched: 0, status: "failed", error: message });
    }
  }
  const uniqueItems = [...new Map(allItems.map(item => [item.source_url, item])).values()];
  let inserted = 0, updated = 0;
  for (let i = 0; i < uniqueItems.length; i += 40) {
    const batch = uniqueItems.slice(i, i + 40), urls = batch.map(item => item.source_url);
    const { data: existing, error: existingError } = await db.from("portal_news").select("source_url").in("source_url", urls);
    if (existingError) throw existingError;
    const existingSet = new Set((existing || []).map((row: any) => row.source_url));
    const { error } = await db.from("portal_news").upsert(batch, { onConflict: "source_url" });
    if (error) throw error;
    for (const item of batch) existingSet.has(item.source_url) ? updated++ : inserted++;
  }
  const failed = results.filter(x => x.status === "failed").length;
  const status = failed === results.length ? "failed" : failed ? "partial" : "success";
  const finishedAt = new Date().toISOString();
  await db.from("portal_news_sync_runs").update({
    finished_at: finishedAt, inserted_count: inserted, updated_count: updated,
    fetched_count: uniqueItems.length, source_results: results, status,
    error_message: failed ? failed + " kaynak okunamadı." : null,
  }).eq("id", run.id);
  return { success: status !== "failed", status, fetched: uniqueItems.length, inserted, updated, sources: results, finished_at: finishedAt };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!url || !serviceKey) return response({ success: false, message: "Sunucu yapılandırması eksik." }, 500);

  const path = new URL(req.url);
  if (req.method === "GET" && path.pathname.endsWith("/health")) {
    return response({ success: true, service: "uzmantech-portal-api" });
  }

  if (req.method === "GET" && path.pathname.endsWith("/news")) {
    const slug = String(path.searchParams.get("slug") || "").trim().slice(0, 120);
    if (slug) {
      if (!/^[a-z0-9-]+$/.test(slug)) return response({ success: false, message: "Haber bulunamadı." }, 404);
      const { data, error } = await db.from("portal_news")
        .select("slug,title,summary,source_name,source_url,category,image_url,published_at")
        .eq("slug", slug).eq("is_published", true).maybeSingle();
      if (error) {
        console.error("Portal news detail query failed", error);
        return response({ success: false, message: "Haber ayrıntısı okunamadı." }, 503);
      }
      if (!data) return response({ success: false, message: "Haber bulunamadı." }, 404);
      return response({ success: true, news: data });
    }
    const requestedLimit = Number(path.searchParams.get("limit") || "18");
    const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? Math.floor(requestedLimit) : 18, 1), 30);
    const { data, error } = await db.from("portal_news")
      .select("slug,title,summary,source_name,source_url,category,image_url,published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(limit);
    if (error) {
      console.error("Portal news query failed", error);
      return response({ success: false, message: "Haber akışı veritabanından okunamadı." }, 503);
    }
    return response({ success: true, news: data || [], count: (data || []).length });
  }

  if (req.method === "GET" && path.pathname.endsWith("/exchange-rate")) {
    try {
      const usd_sell = await getEnparaUsdSell();
      return response({ success: true, provider: "Enpara", currency: "USD/TRY", usd_sell, fetched_at: new Date().toISOString() });
    } catch (error) {
      console.error("Enpara exchange rate fetch failed", error);
      return response({ success: false, message: "Enpara güncel USD satış kuru şu anda alınamıyor. Lütfen daha sonra tekrar deneyin." }, 503);
    }
  }


  if (req.method === "GET" && path.pathname.endsWith("/cam-uyumluluk")) {
    const member = await verifySession(tokenFrom(req));
    if (!hasPaidArchiveAccess(member)) {
      return response({ success: false, code: "PACKAGE_REQUIRED", error: "Cam Uyumluluk Merkezi için aktif üyelik paketi gerekir." }, 403);
    }
    const query = String(path.searchParams.get("q") || "").trim();
    const catalogRequest = path.searchParams.get("catalog") === "1";
    const suggestRequest = path.searchParams.has("suggest");
    const searchTerm = suggestRequest ? String(path.searchParams.get("suggest") || "").trim() : query;
    if (!catalogRequest && (searchTerm.length < 2 || searchTerm.length > 100)) {
      return response({ success: false, error: "En az 2 karakterlik model adı girin." }, 400);
    }
    try {
      const groups = await loadGlassCatalog();
      const unique = new Map<string, string>();
      for (const group of groups) for (const model of group.models) {
        const key = glassNorm(model);
        if (key && !unique.has(key)) unique.set(key, model);
      }
      const allModels = [...unique.values()];
      const brandFor = (model: string): string => {
        const value = glassNorm(model);
        const rules: [RegExp, string][] = [
          [/^(iphone|ipad)\b/, "Apple"], [/^apple\b/, "Apple"],
          [/^(samsung|galaxy)\b/, "Samsung"], [/^(redmi|xiaomi)\b/, "Xiaomi"],
          [/^poco\b/, "POCO"], [/^oppo\b/, "OPPO"], [/^vivo\b/, "Vivo"],
          [/^realme\b/, "Realme"], [/^huawei\b/, "Huawei"], [/^honor\b/, "Honor"],
          [/^motorola\b|^moto\b/, "Motorola"], [/^oneplus\b/, "OnePlus"],
          [/^tecno\b/, "Tecno"], [/^infinix\b/, "Infinix"], [/^nokia\b/, "Nokia"],
          [/^google\b|^pixel\b/, "Google"], [/^sony\b/, "Sony"], [/^asus\b/, "ASUS"],
          [/^tcl\b/, "TCL"], [/^meizu\b/, "Meizu"], [/^zte\b/, "ZTE"],
          [/^lg\b/, "LG"], [/^reeder\b/, "Reeder"], [/^vestel\b/, "Vestel"],
          [/^casper\b/, "Casper"], [/^omix\b/, "OMIX"], [/^general mobile\b|^gm\b/, "General Mobile"],
          [/^htc\b/, "HTC"], [/^lenovo\b/, "Lenovo"], [/^wiko\b/, "Wiko"], [/^iqoo\b/, "iQOO"]
        ];
        return rules.find(([pattern]) => pattern.test(value))?.[1] || "Diğer";
      };
      if (catalogRequest) {
        const catalog: Record<string, string[]> = {};
        for (const model of allModels) {
          const brand = brandFor(model);
          (catalog[brand] ||= []).push(model);
        }
        for (const brand of Object.keys(catalog)) catalog[brand].sort((a,b)=>a.localeCompare(b,"tr"));
        return response({ success: true, catalog, source: "Simkon" });
      }
      if (suggestRequest) {
        const suggestions = allModels.filter(model => glassSearchMatches(model, searchTerm))
          .sort((a,b)=>a.localeCompare(b,"tr")).slice(0,10);
        return response({ success: true, suggestions, source: "Simkon" });
      }
      const matches = groups.filter(group => group.models.some(model => {
        if (query === "__other__") {
          const first = glassNorm(model).split(/[^a-z0-9]+/)[0];
          return !["apple", "iphone", "samsung", "xiaomi", "redmi", "poco", "oppo", "vivo", "realme", "huawei", "honor"].includes(first);
        }
        return glassSearchMatches(model, query);
      }));
      const uniqueModels = new Map<string, string>();
      for (const group of matches) for (const model of group.models) {
        const key = glassNorm(model);
        if (key && !uniqueModels.has(key)) uniqueModels.set(key, model);
      }
      const compatibleModels = [...uniqueModels.values()];
      const resultGroups = compatibleModels.length ? [{ group: (query === "__other__" ? "Diğer markalar" : query) + " ile uyumlu modeller", models: compatibleModels }] : [];
      return response({ success: true, groups: resultGroups, source: "Simkon", cached: !!glassCatalogCache && Date.now()-glassCatalogCache.at >= 0 });
    } catch (error) {
      console.error("Glass compatibility lookup failed", error);
      return response({ success: false, error: "Cam uyumluluk kataloğu şu anda alınamıyor. Lütfen tekrar deneyin." }, 503);
    }
  }


  if (req.method === "GET" && path.pathname.endsWith("/samsung-firmware-search")) {
    const model=String(path.searchParams.get("q")||"").trim().toUpperCase();
    if(!/^SM-[A-Z0-9]+$/.test(model))return response({success:false,message:"Samsung model kodunu SM-A546E biçiminde girin."},400);
    const pageUrl="https://firmwareindex.com/samsung/"+model.toLowerCase()+"/";
    try {
      const res=await fetch(pageUrl,{headers:{"Accept":"text/html,application/xhtml+xml","User-Agent":"Mozilla/5.0 (compatible; UzmantechPortal/2.0; firmware metadata lookup)","Accept-Language":"en-US,en;q=0.9"},signal:AbortSignal.timeout(22000)});
      if(!res.ok)throw new Error("FirmwareIndex HTTP "+res.status);
      const html=await res.text();
      const clean=(v:string)=>v.replace(/<script\b[\s\S]*?<\/script>/gi," ").replace(/<style\b[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/\s+/g," ").trim();
      const tables=[...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)].map(m=>m[1]);
      const items:any[]=[];
      let matchedTable=false;
      for(const table of tables){
        const rows=[...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>m[1]);
        if(!rows.length)continue;
        const cellsOf=(row:string)=>[...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m=>clean(m[1]));
        const header=cellsOf(rows[0]).map(v=>v.toLowerCase());
        const isCscTable=header.some(v=>v==="csc")&&header.some(v=>v.includes("region"))&&header.some(v=>v.includes("latest build"));
        if(!isCscTable)continue;
        matchedTable=true;
        for(const row of rows.slice(1)){
          const cells=cellsOf(row);
          if(cells.length<5)continue;
          const csc=cells[0].toUpperCase();
          const version=cells[2].trim();
          if(!/^[A-Z0-9]{3}$/.test(csc)||!/^[A-Z0-9]{8,20}$/.test(version))continue;
          const href=[...row.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(m=>m[1]).map(v=>{try{return new URL(v,pageUrl).toString()}catch{return ""}}).find(v=>v.startsWith("https://firmwareindex.com/"))||pageUrl;
          items.push({model,csc,regionName:cells[1],version,os:cells[3],buildDate:cells[4],changelist:"",sourceUrl:href,provider:"FirmwareIndex"});
        }
      }
      const unique=[...new Map(items.map(x=>[x.model+"|"+x.csc+"|"+x.version,x])).values()];
      const requestedCsc=String(path.searchParams.get("csc")||"").trim().toUpperCase();
      if(requestedCsc&&!/^[A-Z0-9]{3}$/.test(requestedCsc))return response({success:false,message:"CSC kodu 3 karakter olmalıdır."},400);
      const filtered=requestedCsc?unique.filter(x=>x.csc===requestedCsc):unique;
      return response({success:true,source:"FirmwareIndex",provider:"FirmwareIndex",model,csc:requestedCsc||null,count:filtered.length,items:filtered,pageUrl,matchedTable,parserTables:tables.length});
    } catch(error) {
      console.error("FirmwareIndex lookup failed",model,error);
      return response({success:false,message:"Samsung firmware kataloğuna şu anda erişilemiyor.",provider:"FirmwareIndex",detail:String(error)},503);
    }
  }

  if (req.method === "GET" && path.pathname.endsWith("/samfrew-firmware")) {
    const model=String(path.searchParams.get("q")||"").trim().toUpperCase();
    const limit=Math.min(Math.max(Number(path.searchParams.get("limit")||"50"),1),50);
    if(!/^SM-[A-Z0-9]+$/.test(model))return response({success:false,message:"Samsung model kodunu SM-XXXX biçiminde girin."},400);
    try {
      const source="https://samfrew.com/firmware/model/"+encodeURIComponent(model)+"/upload/Desc/0/"+limit;
      const res=await fetch(source,{headers:{"User-Agent":"Mozilla/5.0 (compatible; UzmantechPortal/1.0)","Accept":"text/html,application/xhtml+xml"},signal:AbortSignal.timeout(20000)});
      if(!res.ok)throw new Error("SamFrew sayfası HTTP "+res.status);
      const html=await res.text();
      const rows=[...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(m=>m[1]);
      const clean=(v:string)=>v.replace(/<script\b[\s\S]*?<\/script>/gi," ").replace(/<style\b[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;|&#160;/gi," ").replace(/&amp;/gi,"&").replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/\s+/g," ").trim();
      const items:any[]=[];
      for(const row of rows){
        const rowText=clean(row);
        const cells=[...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(m=>clean(m[1]));
        const rowModel=cells.find(v=>v===model||v.startsWith(model+" "))||rowText.match(/(?:^|\s)(SM-[A-Z0-9]+)(?=\s)/)?.[1]||"";
        if(rowModel!==model)continue;
        const regionCell=cells.find(v=>/^[A-Z0-9]{3}(?:\s|$)/.test(v)&&!/^Android\b/i.test(v));
        const regionMatch=regionCell?.match(/^([A-Z0-9]{3})(?:\s+(.*))?$/);
        let csc=regionMatch?.[1]||"",regionName=regionMatch?.[2]||"";
        let version=cells.find(v=>/^[A-Z0-9]{8,20}$/.test(v)&&!v.startsWith("SM-"))||"";
        let os=cells.find(v=>/^Android\s+\d+/i.test(v))||"";
        let buildDate=cells.find(v=>/^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+20\d{2}$|^\d{1,2}\/\d{1,2}\/\d{4}$/.test(v))||"";
        let changelist=cells.find(v=>/^\d{6,}$/.test(v))||"";
        if(!csc||!version||!os){
          const afterModel=rowText.slice(rowText.indexOf(model)+model.length).trim();
          const cscMatch=afterModel.match(/^([A-Z0-9]{3})\b/);
          const beforeAndroid=afterModel.split(/\bAndroid\s+\d+/i)[0].trim();
          const tokens=beforeAndroid.split(/\s+/);
          const fallbackVersion=tokens[tokens.length-1]||"";
          if(!csc)csc=cscMatch?.[1]||"";
          if(!regionName&&cscMatch)regionName=beforeAndroid.slice(cscMatch[0].length).replace(new RegExp("\s*"+fallbackVersion+"$"),"").trim();
          if(!version&&/^[A-Z0-9]{8,20}$/.test(fallbackVersion)&&!fallbackVersion.startsWith("SM-"))version=fallbackVersion;
          if(!os)os=rowText.match(/Android\s+\d+/i)?.[0]||"";
          if(!buildDate)buildDate=rowText.match(/(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+20\d{2}|\b\d{1,2}\/\d{1,2}\/\d{4}\b/)?.[0]||"";
          if(!changelist)changelist=rowText.match(/\b\d{6,}\b/)?.[0]||"";
        }
        if(!version||!csc)continue;
        const href=[...row.matchAll(/<a\b[^>]*href=["']([^"']+)["']/gi)].map(m=>m[1]).map(v=>{try{return new URL(v,"https://samfrew.com").toString()}catch{return ""}}).find(v=>v.startsWith("https://samfrew.com/"))||"";
        items.push({model,csc,regionName,version,os,buildDate,changelist,sourceUrl:href||source});
      }
      const unique=[...new Map(items.map(x=>[x.model+"|"+x.csc+"|"+x.version+"|"+x.buildDate,x])).values()];
      return response({success:true,source:"SamFrew",model,count:unique.length,items:unique,pageUrl:source,parserRows:rows.length,parserMode:"cells+row-fallback"});
    } catch(error) {
      console.error("SamFrew firmware lookup failed",model,error);
      return response({success:false,message:"SamFrew model firmware listesi şu anda alınamıyor. Lütfen tekrar deneyin."},503);
    }
  }

  if (req.method === "GET" && path.pathname.endsWith("/samfw-firmware")) {
    const model=String(path.searchParams.get("q")||"").trim().toUpperCase();
    const csc=String(path.searchParams.get("csc")||"TUR").trim().toUpperCase();
    if(!/^SM-[A-Z0-9]+$/.test(model))return response({success:false,message:"Samsung model kodunu SM-XXXX biçiminde girin."},400);
    if(!/^[A-Z0-9]{3}$/.test(csc))return response({success:false,message:"CSC kodu 3 karakter olmalıdır. Örnek: TUR, XSG, INS."},400);
    try { const items=await loadSamFwFirmware(model,csc);return response({success:true,source:"SamFW",model,csc,count:items.length,items}); }
    catch(error) { console.error("SamFW firmware lookup failed",model,csc,error);return response({success:false,message:"SamFW firmware listesi şu anda alınamıyor. Model ve CSC kodunu kontrol edip tekrar deneyin."},503); }
  }

  if (req.method === "GET" && path.pathname.endsWith("/engineer-roms")) {
    try {
      const items=await loadEngineerRoms();
      const q=String(path.searchParams.get("q")||"").trim().toLocaleLowerCase("tr-TR");
      const filtered=q?items.filter(x=>(x.model+" "+x.codename).toLocaleLowerCase("tr-TR").includes(q)):items;
      return response({success:true,source:engineerRomSource,count:filtered.length,total:items.length,items:filtered,updated_at:new Date(engineerRomCache!.at).toISOString()});
    } catch(error) {
      console.error("Engineer ROM catalog fetch failed",error);
      return response({success:false,message:"Xiaomi Engineer ROM listesi şu anda alınamıyor. Lütfen tekrar deneyin."},503);
    }
  }

  if (req.method === "GET" && path.pathname.endsWith("/catalog")) {
    const { data, error } = await db.from("archive_records").select("records").eq("category", "models").maybeSingle();
    if (error || !data?.records || typeof data.records !== "object" || Array.isArray(data.records)) {
      return response({ success: false, message: "Marka ve model kataloğu şu anda okunamıyor." }, 503);
    }
    const catalog: Record<string, string[]> = {};
    for (const [brand, models] of Object.entries(data.records as Record<string, unknown>)) {
      catalog[brand] = Array.isArray(models) ? models.filter((x): x is string => typeof x === "string").sort((a,b)=>a.localeCompare(b,"tr")) : [];
    }
    return response({ success: true, catalog });
  }

  if (req.method === "GET" && path.pathname.endsWith("/recent")) {
    const member = await verifySession(tokenFrom(req));
    const archiveAccess = hasPaidArchiveAccess(member);
    const requestedLimit = Number(path.searchParams.get("limit") || "40");
    const limit = Math.min(Math.max(Number.isFinite(requestedLimit) ? requestedLimit : 40, 8), 48);
    const categories = ["firmware", "eng", "imei", "test_point", "resistor"];
    const { data, error } = await db.from("archive_records").select("category,records").in("category", categories);
    if (error) return response({ success: false, message: "Son eklenen dosyalar yüklenemedi." }, 503);
    const recent: any[] = [];
    let order = 0;
    for (const row of data || []) {
      const records = Array.isArray(row.records) ? row.records : [];
      for (let i = records.length - 1; i >= Math.max(0, records.length - 24); i--) {
        const item = records[i];
        const d = Array.isArray(item) ? { brand:item[0], model:item[1], codename:item[2], description:item[3], link:item[4], version:item[5], android:item[6], region:item[7] } : item;
        recent.push({ category: row.category, data: archiveAccess ? d : scrubLinks(d), _order: order++ });
      }
    }
    recent.sort((a,b) => {
      const dateA = Date.parse(String(a.data?.updated_at || a.data?.created_at || a.data?.date || ""));
      const dateB = Date.parse(String(b.data?.updated_at || b.data?.created_at || b.data?.date || ""));
      if (Number.isFinite(dateA) && Number.isFinite(dateB) && dateA !== dateB) return dateB - dateA;
      return a._order - b._order;
    });
    return response({ success: true, member: archiveAccess, results: recent.slice(0, limit).map(({ _order, ...item }) => item) });
  }

  if (req.method === "GET" && path.pathname.endsWith("/archive")) {
    const member = await verifySession(tokenFrom(req));
    if (!hasPaidArchiveAccess(member)) {
      return response({ success: false, code: "PACKAGE_REQUIRED", message: "Dosya deposuna erişmek için bir paket satın almanız ve yönetici onayını beklemeniz gerekir." }, 403);
    }
    const q = String(path.searchParams.get("q") || "").trim().toLocaleLowerCase("tr-TR");
    const requested = String(path.searchParams.get("category") || "all").toLowerCase();
    const limitRaw = Number(path.searchParams.get("limit") || "60");
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 60, 1), 100);
    const allowed = ["firmware", "eng", "imei", "test_point", "resistor"];
    const categories = requested === "all" ? allowed : allowed.includes(requested) ? [requested] : [];
    if (!categories.length) return response({ success: false, message: "Geçersiz arşiv kategorisi." }, 400);
    const { data, error } = await db.from("archive_records").select("category,records").in("category", categories);
    if (error) return response({ success: false, message: "Arşiv şu anda okunamıyor." }, 503);
    const results: any[] = [];
    for (const row of data || []) {
      const records = Array.isArray(row.records) ? row.records : [];
      for (let i = records.length - 1; i >= 0; i--) {
        const item = records[i];
        const haystack = (Array.isArray(item) ? item.join(" ") : JSON.stringify(item || "")).toLocaleLowerCase("tr-TR");
        if (q && !haystack.includes(q)) continue;
        results.push({
          category: row.category,
          data: item,
        });
        if (results.length >= limit) break;
      }
      if (results.length >= limit) break;
    }
    const { data: noticesRow } = await db.from("archive_records").select("records").eq("category", "announcements").maybeSingle();
    const announcements = Array.isArray(noticesRow?.records) ? noticesRow.records.filter((x: any) => x?.active !== false).slice(0, 30) : [];
    return response({ success: true, member: true, query: q, category: requested, results, count: results.length, announcements });
  }


  // Dekont dosyası özel bucket'a yalnızca sunucu üzerinden yüklenir.
  if (req.method === "POST" && path.pathname.endsWith("/payment-receipt")) {
    const member = await verifySession(tokenFrom(req), true);
    if (!member || member.role === "admin") return response({ success: false, message: "Ödeme bildirimi için geçerli üye oturumu gerekli." }, 401);
    const plan = String(path.searchParams.get("plan") || "");
    const planDays: Record<string, number> = { weekly: 7, monthly: 30, half_year: 180, annual: 365 };
    const usdPrices: Record<string, number> = { weekly: 5, monthly: 10, half_year: 20, annual: 40 };
    const days = planDays[plan];
    const amountUsd = usdPrices[plan] || 0;
    const suppliedUsd = Number(path.searchParams.get("amount_usd") || "0");
    const suppliedTry = Number(path.searchParams.get("amount_try") || "0");
    const suppliedRate = Number(path.searchParams.get("rate") || "0");
    if (!days || !amountUsd || !Number.isFinite(suppliedUsd) || Math.abs(suppliedUsd - amountUsd) > 0.01) {
      return response({ success: false, message: "Paket tutarı değişmiş veya geçersiz. Lütfen paket ekranını yenileyin." }, 409);
    }
    let exchangeRate: number;
    try { exchangeRate = await getEnparaUsdSell(); }
    catch (error) {
      console.error("payment exchange rate failed", error);
      return response({ success: false, message: "Ödeme tutarı için güncel Enpara kuru doğrulanamadı. Lütfen daha sonra tekrar deneyin." }, 503);
    }
    const amountTry = Math.round(amountUsd * exchangeRate * 100) / 100;
    if (!Number.isFinite(suppliedTry) || Math.abs(suppliedTry - amountTry) > 0.02
      || !Number.isFinite(suppliedRate) || Math.abs(suppliedRate - exchangeRate) > 0.01) {
      return response({ success: false, message: "Döviz kuru veya TL tutarı değişti. Paket ekranını yenileyip dekontu tekrar gönderin." }, 409);
    }

    const payerName = String(path.searchParams.get("payer_name") || "").trim();
    const mime = String(req.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    const extensions: Record<string, string> = {
      "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf",
    };
    if (payerName.length < 2 || payerName.length > 120 || !extensions[mime]) {
      return response({ success: false, message: "Ödeyen adı veya dosya türü geçersiz." }, 400);
    }
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (!bytes.length || bytes.length > 5 * 1024 * 1024) {
      return response({ success: false, message: "Dekont dosyası boş olamaz ve 5 MB sınırını aşamaz." }, 413);
    }
    const objectPath = member.id + "/" + crypto.randomUUID() + "." + extensions[mime];
    const { error: uploadError } = await db.storage.from("portal-receipts").upload(objectPath, bytes, {
      contentType: mime, upsert: false,
    });
    if (uploadError) {
      console.error("payment receipt upload failed", uploadError);
      return response({ success: false, message: "Dekont güvenli alana yüklenemedi." }, 503);
    }
    const { data: notice, error: insertError } = await db.from("portal_payment_notices").insert({
      user_id: member.id,
      plan,
      license_days: days,
      amount: amountUsd,
      currency: "USD",
      amount_try: amountTry,
      exchange_rate: exchangeRate,
      payer_name: payerName,
      receipt_path: objectPath,
    }).select("id,status,created_at,amount,currency,amount_try,exchange_rate,plan,license_days").single();
    if (insertError) {
      await db.storage.from("portal-receipts").remove([objectPath]);
      console.error("payment notice insert failed", insertError);
      return response({ success: false, message: "Ödeme bildirimi kaydedilemedi." }, 503);
    }
    return response({ success: true, message: "Dekont ve ödeme bildirimi alındı. Yönetici onayı bekleniyor.", notice });
  }

  if (req.method !== "POST") return response({ success: false, message: "Yöntem desteklenmiyor." }, 405);
  let body: any;
  try { body = await req.json(); } catch { return response({ success: false, message: "Geçersiz istek." }, 400); }





  if (body.action === "ai_chat_log") {
    const member = await verifySession(tokenFrom(req), true);
    if (!member || member.role !== "user") return response({ success: false, message: "Sohbet kaydı için geçerli üye oturumu gerekli." }, 401);
    const question = String(body.question || "").trim().slice(0, 4000);
    const answer = String(body.answer || "").trim().slice(0, 12000);
    const sessionId = String(body.session_id || "");
    if (!question || !answer || !/^[0-9a-f-]{36}$/i.test(sessionId)) return response({ success: false, message: "Sohbet kaydı eksik veya geçersiz." }, 400);
    const sources = Array.isArray(body.sources) ? body.sources.slice(0, 8).map((s: any) => ({ title: String(s?.title || "").slice(0, 200), source: String(s?.source || "").slice(0, 500) })) : [];
    const { error } = await db.from("ai_chat_logs").insert({ user_id: member.id, session_id: sessionId, question, answer, sources, model: String(body.model || "").slice(0, 100) });
    if (error) { console.error("AI chat log insert failed", error); return response({ success: false, message: "Sohbet kaydı oluşturulamadı." }, 503); }
    return response({ success: true });
  }

  if (body.action === "admin_ai_chat_logs") {
    const admin = await verifySession(tokenFrom(req));
    if (!admin || admin.role !== "admin" || admin.tokenRole !== "admin") return response({ success: false, message: "Sohbet geçmişi için yönetici yetkisi gerekli." }, 403);
    const { data: rows, error } = await db.from("ai_chat_logs").select("id,user_id,session_id,question,answer,sources,model,created_at").order("created_at", { ascending: false }).limit(500);
    if (error) return response({ success: false, message: "Yapay zekâ sohbet geçmişi okunamadı." }, 503);
    const ids = [...new Set((rows || []).map((x: any) => x.user_id))];
    const { data: users, error: usersError } = ids.length ? await db.from("users").select("id,username,email").in("id", ids) : { data: [], error: null };
    if (usersError) return response({ success: false, message: "Sohbet kullanıcıları okunamadı." }, 503);
    const map = new Map((users || []).map((u: any) => [u.id, u]));
    return response({ success: true, logs: (rows || []).map((x: any) => ({ ...x, user: map.get(x.user_id) || null })) });
  }

  if (body.action === "admin_acquisition_list") {
    const admin = await verifySession(tokenFrom(req));
    if (!admin || admin.role !== "admin" || admin.tokenRole !== "admin") return response({ success: false, message: "Bu kayıtları görüntülemek için yönetici yetkisi gerekli." }, 403);
    const { data, error } = await db.from("users")
      .select("id,username,email,created_at,registration_channel,acquisition_source,acquisition_medium,acquisition_campaign,acquisition_referrer,acquisition_landing_page,acquisition_captured_at")
      .order("created_at", { ascending: false }).limit(300);
    if (error) return response({ success: false, message: "Üye kaynak bilgileri okunamadı." }, 503);
    return response({ success: true, users: data || [] });
  }

  if (body.action === "admin_mail_log") {
    const admin = await verifySession(tokenFrom(req));
    if (!admin || admin.role !== "admin" || admin.tokenRole !== "admin") return response({ success: false, message: "Bu kayıtları görüntülemek için yönetici yetkisi gerekli." }, 403);
    const [reengagementResult, outboxResult, recipientResult] = await Promise.all([
      db.from("portal_reengagement_sends").select("id,user_id,status,provider_id,last_error,created_at,sent_at,subject,body").order("created_at", { ascending: false }).limit(150),
      db.from("portal_email_outbox").select("id,recipient,subject,status,attempts,last_error,created_at,sent_at,provider_id").order("created_at", { ascending: false }).limit(150),
      db.from("portal_email_campaign_recipients").select("id,campaign_id,email,status,attempts,last_error,created_at,sent_at").order("created_at", { ascending: false }).limit(250)
    ]);
    if (reengagementResult.error || outboxResult.error || recipientResult.error) {
      console.error("Admin email log query failed", reengagementResult.error, outboxResult.error, recipientResult.error);
      return response({ success: false, message: "E-posta gönderim kayıtları okunamadı." }, 503);
    }
    const reRows = reengagementResult.data || [];
    const userIds = [...new Set(reRows.map((x: any) => x.user_id).filter(Boolean))];
    const campaignIds = [...new Set((recipientResult.data || []).map((x: any) => x.campaign_id).filter(Boolean))];
    const [usersResult, campaignsResult] = await Promise.all([
      userIds.length ? db.from("users").select("id,username,email").in("id", userIds) : Promise.resolve({ data: [], error: null }),
      campaignIds.length ? db.from("portal_email_campaigns").select("id,subject,body,audience,category").in("id", campaignIds) : Promise.resolve({ data: [], error: null })
    ]);
    if (usersResult.error || campaignsResult.error) return response({ success: false, message: "E-posta kayıtlarının ayrıntıları okunamadı." }, 503);
    const userMap = new Map((usersResult.data || []).map((u: any) => [u.id, u]));
    const campaignMap = new Map((campaignsResult.data || []).map((c: any) => [c.id, c]));
    const logs: any[] = [];
    for (const row of reRows) {
      const user: any = userMap.get(row.user_id) || {};
      logs.push({ id: row.id, source: "Otomatik hatırlatma", recipient: user.email || "", username: user.username || "", subject: row.subject || "Uzmantech'te işinizi kolaylaştıran özellikleri keşfedin", body: row.body || "", status: row.status, attempts: 1, last_error: row.last_error, provider_id: row.provider_id, created_at: row.created_at, sent_at: row.sent_at });
    }
    for (const row of (recipientResult.data || [])) {
      const campaign: any = campaignMap.get(row.campaign_id) || {};
      logs.push({ id: "campaign-" + row.id, source: campaign.category === "marketing" ? "Bülten / kampanya" : "Toplu e-posta", recipient: row.email, username: "", subject: campaign.subject || "(Konu bulunamadı)", body: campaign.body || "", status: row.status, attempts: row.attempts, last_error: row.last_error, provider_id: "", created_at: row.created_at, sent_at: row.sent_at });
    }
    for (const row of (outboxResult.data || [])) {
      logs.push({ id: "outbox-" + row.id, source: "Sistem e-postası", recipient: row.recipient, username: "", subject: row.subject, body: "", status: row.status, attempts: row.attempts, last_error: row.last_error, provider_id: row.provider_id || "", created_at: row.created_at, sent_at: row.sent_at });
    }
    logs.sort((a, b) => new Date(b.sent_at || b.created_at).getTime() - new Date(a.sent_at || a.created_at).getTime());
    return response({ success: true, logs: logs.slice(0, 300), count: logs.length });
  }

  if (body.action === "reengagement_status" || body.action === "reengagement_run") {
    const suppliedSecret = req.headers.get("x-reengagement-secret") || "";
    const { data: authorized, error: authError } = await db.rpc("portal_verify_reengagement_secret", { p_secret: suppliedSecret });
    if (authError || authorized !== true) return response({ success: false, message: "Otomatik e-posta yetkisi geçersiz." }, 401);
    const resendConfigured = !!(Deno.env.get("RESEND_API_KEY") || "").trim() && !!(Deno.env.get("RESEND_FROM_EMAIL") || "").trim();
    if (body.action === "reengagement_status") {
      const cutoff = new Date(Date.now() - 14 * 86400000).toISOString();
      const { count, error } = await db.from("users").select("id", { count: "exact", head: true })
        .eq("email_verified", true).neq("role", "admin").not("email", "is", null)
        .or("status.eq.active,and(status.eq.disabled,disabled_reason.eq.license_expired)")
        .or("last_login.lt." + cutoff + ",and(last_login.is.null,created_at.lt." + cutoff + ")");
      if (error) return response({ success: false, message: "Hedef kitle okunamadı." }, 503);
      return response({ success: true, provider: "Resend", resend_configured: resendConfigured, eligible_count: count || 0, schedule: "Her gün 11:00 Türkiye saati", inactivity_days: 14, cooldown_days: 30, daily_batch: 20 });
    }
    if (!resendConfigured) return response({ success: false, provider: "Resend", message: "Resend ortam değişkenleri eksik; hiçbir üyeye e-posta gönderilmedi." }, 503);
    const cutoff = new Date(Date.now() - 14 * 86400000).toISOString();
    const { data: candidates, error: candidateError } = await db.from("users")
      .select("id,email,username,status,disabled_reason,last_login,created_at")
      .eq("email_verified", true).neq("role", "admin").not("email", "is", null)
      .or("status.eq.active,and(status.eq.disabled,disabled_reason.eq.license_expired)")
      .or("last_login.lt." + cutoff + ",and(last_login.is.null,created_at.lt." + cutoff + ")")
      .order("last_login", { ascending: true, nullsFirst: true }).limit(50);
    if (candidateError) return response({ success: false, message: "Hedef üyeler okunamadı." }, 503);
    let sent = 0, skipped = 0, failed = 0;
    for (const member of (candidates || [])) {
      const email = String(member.email || "").trim().toLowerCase();
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(email)) { skipped++; continue; }
      const { data: suppressed, error: suppressionError } = await db.from("portal_marketing_suppressions").select("email").eq("email", email).maybeSingle();
      if (suppressionError) { console.error("Marketing suppression lookup failed", suppressionError); failed++; continue; }
      if (suppressed) { skipped++; continue; }
      const { data: claimId, error: claimError } = await db.rpc("portal_claim_reengagement_send", { p_user_id: member.id });
      if (claimError) { console.error("Re-engagement claim failed", claimError); failed++; continue; }
      if (!claimId) { skipped++; continue; }
      try {
        const payload = b64url(new TextEncoder().encode(email));
        const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(sessionSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const signature = b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))));
        const unsubscribeUrl = "https://uzmantool.com.tr/newsletter-unsubscribe.html?token=" + encodeURIComponent(payload + "." + signature);
        const displayName = String(member.username || "Merhaba");
        const subject = "Uzmantech'te işinizi kolaylaştıran özellikleri keşfedin";
        const bodyText = displayName + " merhaba,\\n\\nUzmantech hesabınızı bir süredir kullanmadığınızı fark ettik. Telefon yazılım ve servis işlerinizi hızlandıran araçlarımızı yeniden keşfedebilirsiniz.\\n\\n• Firmware arşivi: marka ve modele göre yazılım dosyalarını bulun.\\n• Cihaz araçları: ADB, Fastboot ve cihaz bilgisi işlemlerini tek noktadan yönetin.\\n• Servis takip: cihaz kabul, işlem durumu ve müşteri bilgilendirmelerini düzenleyin.\\n• Cam uyumluluk: modele uygun ekran/cam bilgisini hızlıca kontrol edin.\\n\\nHesabınıza buradan giriş yapabilirsiniz: https://uzmantool.com.tr\\n\\nBu bilgilendirme e-postalarını almak istemiyorsanız aboneliği kaldırın: " + unsubscribeUrl + "\\n\\nUzmantech";
        const html = '<div style="font-size:15px;line-height:1.85;color:#334155"><p>' + escapeEmailHtml(displayName) + ' merhaba,</p><p>Uzmantech hesabınızı bir süredir kullanmadığınızı fark ettik. Telefon yazılım ve servis işlerinizi hızlandıran özelliklerimizi yeniden keşfedebilirsiniz.</p><ul><li><b>Firmware arşivi:</b> marka ve modele göre yazılım dosyalarını bulun.</li><li><b>Cihaz araçları:</b> ADB, Fastboot ve cihaz bilgisi işlemlerini tek noktadan yönetin.</li><li><b>Servis takip:</b> cihaz kabul ve işlem durumlarını düzenleyin.</li><li><b>Cam uyumluluk:</b> modele uygun ekran/cam bilgisini kontrol edin.</li></ul><p><a href="https://uzmantool.com.tr" style="display:inline-block;padding:12px 20px;background:#1769bd;color:#fff;text-decoration:none;border-radius:8px">Uzmantech\'e giriş yap</a></p><hr><p style="font-size:12px;color:#64748b">Bu e-postaları almak istemiyorsanız <a href="' + unsubscribeUrl + '">aboneliğinizi buradan kaldırabilirsiniz</a>.</p></div>';
        await db.from("portal_reengagement_sends").update({ subject, body: bodyText }).eq("id", claimId);
        const providerId = await sendResendOnly(email, subject, bodyText, html);
        await db.from("portal_reengagement_sends").update({ status: "sent", provider_id: providerId, sent_at: new Date().toISOString(), last_error: null }).eq("id", claimId);
        sent++;
      } catch (e) {
        const msg = String(e instanceof Error ? e.message : e).slice(0, 400);
        await db.from("portal_reengagement_sends").update({ status: "failed", last_error: msg }).eq("id", claimId);
        console.error("Re-engagement email failed", { user_id: member.id, error: msg });
        failed++;
      }
      if (sent >= 20) break;
    }
    return response({ success: true, provider: "Resend", candidates: (candidates || []).length, sent, skipped, failed, message: "Otomatik hatırlatma grubu işlendi." });
  }

  if (body.action === "news_sync") {
    const suppliedSecret = req.headers.get("x-news-secret") || "";
    const { data: authorized, error: authError } = await db.rpc("portal_verify_news_ingest_secret", { p_secret: suppliedSecret });
    if (authError || authorized !== true) return response({ success: false, message: "Haber senkronizasyon yetkisi geçersiz." }, 401);
    try {
      const result = await syncPortalNews();
      return response(result, result.status === "failed" ? 503 : 200);
    } catch (error) {
      console.error("Portal news sync failed", error);
      return response({ success: false, message: "Haber akışı güncellenemedi.", error: String(error instanceof Error ? error.message : error).slice(0, 240) }, 503);
    }
  }

  if (body.action === "archive_link_report") {
    const member = await verifySession(tokenFrom(req), true);
    if (!member) return response({ success: false, message: "Bildirim göndermek için giriş yapmalısınız." }, 401);
    const brand = String(body.brand || "").trim().slice(0, 80);
    const model = String(body.model || "").trim().slice(0, 120);
    const reason = String(body.reason || "").trim();
    const details = String(body.details || "").trim().slice(0, 1200);
    const pageUrl = String(body.page_url || "").trim().slice(0, 500);
    const allowedReasons = ["Kırık veya açılmayan bağlantı", "Yanlış modele ait yazılım", "Yanlış sürüm veya bölge", "Diğer"];
    if (!brand || !model || brand.length > 80 || model.length > 120 || !allowedReasons.includes(reason)) {
      return response({ success: false, message: "Marka, model ve geçerli bildirim nedeni gerekli." }, 400);
    }
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await db.from("portal_support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", member.id).eq("category", "archive").gte("created_at", since);
    if (countError) {
      console.error("archive report rate limit lookup failed", countError);
      return response({ success: false, message: "Bildirim servisi şu anda kullanılamıyor." }, 503);
    }
    if (Number(count || 0) >= 10) return response({ success: false, message: "24 saat içinde en fazla 10 arşiv bildirimi gönderebilirsiniz." }, 429);
    const message = [
      "Arşiv bağlantı/model bildirimi",
      "Marka: " + brand,
      "Model: " + model,
      "Bildirim nedeni: " + reason,
      pageUrl ? "Sayfa: " + pageUrl : "",
      details ? "Açıklama: " + details : "",
    ].filter(Boolean).join("\\n");
    const { data: ticket, error } = await db.from("portal_support_tickets")
      .insert({ user_id: member.id, subject: ("Arşiv bildirimi: " + brand + " " + model).slice(0, 120), category: "archive", message })
      .select("id,subject,category,status,created_at").single();
    if (error) {
      console.error("archive link report insert failed", error);
      return response({ success: false, message: "Bildiriminiz kaydedilemedi. Lütfen tekrar deneyin." }, 503);
    }
    return response({ success: true, message: "Bildiriminiz alındı. Arşiv ekibi inceleyecek.", ticket }, 201);
  }

  if (body.action === "support_ticket") {
    const sessionMember = await verifySession(tokenFrom(req), true);
    // Yönetici oturumları da bu genel iletişim formunu ziyaretçi bilgileriyle kullanabilir.
    const member = sessionMember?.role === "admin" ? null : sessionMember;
    const subject = String(body.subject || "").trim();
    const category = String(body.category || "other");
    const message = String(body.message || "").trim();
    const guestName = String(body.guest_name || "").trim();
    const guestEmail = String(body.guest_email || "").trim().toLowerCase();
    const allowedCategories = ["technical", "license", "payment", "archive", "other"];
    if (subject.length < 4 || subject.length > 120 || !allowedCategories.includes(category) || message.length < 20 || message.length > 4000) {
      return response({ success: false, message: "Konu, kategori veya mesaj alanını kontrol edin. Mesaj 20-4000 karakter olmalı." }, 400);
    }
    if (!member && (guestName.length < 2 || guestName.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(guestEmail) || guestEmail.length > 254)) {
      return response({ success: false, message: "Ziyaretçi talepleri için adınızı ve geçerli e-posta adresinizi girin." }, 400);
    }
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let countQuery = db.from("portal_support_tickets").select("id", { count: "exact", head: true }).gte("created_at", since);
    countQuery = member ? countQuery.eq("user_id", member.id) : countQuery.is("user_id", null).eq("guest_email", guestEmail);
    const { count, error: countError } = await countQuery;
    if (countError) {
      console.error("support ticket rate limit lookup failed", countError);
      return response({ success: false, message: "Destek servisi şu anda kullanılamıyor." }, 503);
    }
    const limit = member ? 5 : 3;
    if (Number(count || 0) >= limit) return response({ success: false, message: "24 saat içinde en fazla " + limit + " destek talebi gönderebilirsiniz." }, 429);
    const { data: ticket, error } = await db.from("portal_support_tickets")
      .insert({ user_id: member?.id || null, guest_name: member ? null : guestName, guest_email: member ? null : guestEmail, subject, category, message })
      .select("id,subject,category,status,created_at").single();
    if (error) {
      console.error("support ticket insert failed", error);
      return response({ success: false, message: "Destek talebi kaydedilemedi. Lütfen tekrar deneyin." }, 503);
    }
    return response({ success: true, message: "Destek talebiniz alındı. İletişim bilgileriniz yönetici ekibine iletildi.", ticket }, 201);
  }


  if (body.action === "support_history") {
    const member = await verifySession(tokenFrom(req), true);
    if (!member || member.role === "admin") return response({ success: false, message: "Destek geçmişi için üye oturumu gerekli." }, 401);
    const { data, error } = await db.from("portal_support_tickets")
      .select("id,subject,category,status,admin_note,created_at,updated_at,resolved_at")
      .eq("user_id", member.id).order("created_at", { ascending: false }).limit(30);
    if (error) return response({ success: false, message: "Destek geçmişi okunamadı." }, 503);
    return response({ success: true, tickets: data || [] });
  }

  if (body.action === "support_list") {
    const admin = await verifySession(tokenFrom(req));
    if (!admin || admin.role !== "admin" || admin.tokenRole !== "admin") return response({ success: false, message: "Bu işlem için yönetici yetkisi gerekli." }, 403);
    const { data: rows, error } = await db.from("portal_support_tickets")
      .select("id,user_id,guest_name,guest_email,subject,category,message,status,admin_note,created_at,updated_at,resolved_at")
      .order("created_at", { ascending: false }).limit(150);
    if (error) return response({ success: false, message: "Destek talepleri okunamadı." }, 503);
    const ids = [...new Set((rows || []).map((x: any) => x.user_id))];
    const { data: users } = ids.length
      ? await db.from("users").select("id,username,email").in("id", ids)
      : { data: [] };
    const userMap = new Map((users || []).map((u: any) => [u.id, u]));
    return response({ success: true, tickets: (rows || []).map((row: any) => ({ ...row, user: userMap.get(row.user_id) || null })) });
  }

  if (body.action === "support_update") {
    const admin = await verifySession(tokenFrom(req));
    if (!admin || admin.role !== "admin" || admin.tokenRole !== "admin") return response({ success: false, message: "Bu işlem için yönetici yetkisi gerekli." }, 403);
    const ticketId = String(body.ticket_id || "").trim();
    const status = String(body.status || "");
    const note = String(body.admin_note || "").trim().slice(0, 1000);
    if (!ticketId || !["open", "in_progress", "resolved"].includes(status)) return response({ success: false, message: "Geçerli destek kaydı ve durum gerekli." }, 400);
    const now = new Date().toISOString();
    const { data: ticket, error: ticketError } = await db.from("portal_support_tickets").select("id,user_id,guest_name,guest_email,subject").eq("id", ticketId).maybeSingle();
    if (ticketError || !ticket) return response({ success: false, message: "Destek talebi bulunamadı." }, 404);
    const { data, error } = await db.from("portal_support_tickets").update({
      status, admin_note: note || null, updated_at: now,
      resolved_at: status === "resolved" ? now : null,
      resolved_by: status === "resolved" ? admin.id : null,
    }).eq("id", ticketId).select("id,status,admin_note,updated_at,resolved_at").maybeSingle();
    if (error || !data) return response({ success: false, message: "Destek talebi güncellenemedi." }, 503);
    let recipient = String(ticket.guest_email || "").trim();
    if (ticket.user_id) {
      const { data: ticketUser } = await db.from("users").select("email,username").eq("id", ticket.user_id).maybeSingle();
      recipient = String(ticketUser?.email || recipient);
    }
    let emailSent = false;
    if (recipient) {
      const statusText = status === "resolved" ? "çözüldü" : status === "in_progress" ? "işleme alındı" : "yeniden açıldı";
      const emailBody = "Merhaba,\\n\\nUzmantech destek talebiniz (" + String(ticket.subject || "Destek talebi") + ") " + statusText + "." +
        (note ? "\\n\\nYönetim yanıtı: " + note : "") + "\\n\\nUzmantech Destek";
      const queued = await queuePortalEmail(recipient, "Uzmantech destek talebiniz güncellendi", emailBody);
      emailSent = !queued.error;
      if (queued.error) console.error("Support update notification failed", queued.error);
    }
    return response({ success: true, ticket: data, email_sent: emailSent, message: "Destek talebi güncellendi." + (emailSent ? " Bildirim e-postası gönderildi." : " E-posta adresi bulunamadı veya gönderim başarısız oldu.") });
  }


  if (body.action === "admin_notification") {
    const admin = await verifySession(tokenFrom(req));
    if (!admin || admin.role !== "admin" || admin.tokenRole !== "admin") {
      return response({ success: false, message: "Bu işlem için yönetici yetkisi gerekli." }, 403);
    }
    const userId = String(body.user_id || "").trim();
    const event = String(body.event || "").trim();
    const days = Number(body.days || 0);
    const allowedEvents = ["activated", "disabled", "license_extended", "password_changed"];
    if (!userId || !allowedEvents.includes(event)) return response({ success: false, message: "Geçersiz bildirim isteği." }, 400);
    const { data: target, error } = await db.from("users")
      .select("id,username,email,status,expiry_date,license_plan")
      .eq("id", userId).maybeSingle();
    if (error || !target || !target.email) return response({ success: true, email_sent: false, message: "İşlem tamamlandı; kullanıcı e-posta adresi bulunamadığı için bildirim gönderilemedi." });
    const name = String(target.username || "Üyemiz");
    const expiry = target.expiry_date ? new Date(target.expiry_date).toLocaleDateString("tr-TR") : "Belirtilmedi";
    const notices: Record<string, { subject: string; body: string }> = {
      activated: {
        subject: "Uzmantech üyeliğiniz onaylandı",
        body: name + " merhaba,\n\nUzmantech üyeliğiniz yönetim tarafından onaylandı ve hesabınız aktif edildi.\nLisans süreniz: " + (Number.isFinite(days) && days > 0 ? days + " gün" : "Hesabınızda tanımlı") + "\nBitiş tarihi: " + expiry + "\n\nUzmantech'i kullanmaya başlayabilirsiniz.\n\nUzmantech Yönetimi"
      },
      disabled: {
        subject: "Uzmantech hesabınız hakkında bilgilendirme",
        body: name + " merhaba,\n\nUzmantech hesabınız yönetim tarafından pasifleştirildi. Hesabınızla ilgili bilgi almak için destek ekibimizle iletişime geçebilirsiniz.\n\nUzmantech Yönetimi"
      },
      license_extended: {
        subject: "Uzmantech lisans süreniz güncellendi",
        body: name + " merhaba,\n\nUzmantech lisansınıza " + days + " gün eklendi.\nYeni lisans bitiş tarihiniz: " + expiry + "\n\nİyi çalışmalar.\nUzmantech Yönetimi"
      },
      password_changed: {
        subject: "Uzmantech hesap şifreniz değiştirildi",
        body: name + " merhaba,\n\nUzmantech hesabınızın şifresi yönetim panelinden değiştirildi. Bu işlemi siz talep etmediyseniz hemen destek ekibimizle iletişime geçin.\n\nUzmantech Yönetimi"
      }
    };
    const mail = notices[event];
    const queued = await queuePortalEmail(String(target.email), mail.subject, mail.body);
    if (queued.error) {
      console.error("Admin notification email failed", { event, user_id: userId, error: queued.error });
      return response({ success: true, email_sent: false, message: "İşlem tamamlandı ancak bilgilendirme e-postası gönderilemedi: " + String(queued.error instanceof Error ? queued.error.message : "Gönderim hatası").slice(0, 180) });
    }
    return response({ success: true, email_sent: true, message: "İşlem tamamlandı ve kullanıcıya e-posta gönderildi." });
  }


  if (body.action === "resend_test") {
    const admin = await verifySession(tokenFrom(req));
    if (!admin || admin.role !== "admin" || admin.tokenRole !== "admin") {
      return response({ success: false, message: "Bu işlem için yönetici yetkisi gerekli." }, 403);
    }
    // Deliberately fixed to the recipient explicitly authorized for this one-off delivery test.
    const recipient = "ataturkiyehack@gmail.com";
    const configuredFrom = (Deno.env.get("RESEND_FROM_EMAIL") || "").trim();
    if (!Deno.env.get("RESEND_API_KEY") || !configuredFrom) {
      return response({ success: false, message: "Resend yapılandırması eksik. RESEND_API_KEY ve RESEND_FROM_EMAIL tanımlanmalı." }, 503);
    }
    try {
      await sendPortalEmail(
        recipient,
        "Uzmantech - Resend bağlantı testi",
        "Bu, Uzmantech yönetim panelinden gönderilen tek alıcılı Resend bağlantı testidir.\n\nGönderim zamanı: " + new Date().toISOString() + "\nGönderen: " + configuredFrom + "\n\nToplu gönderim başlatılmadı."
      );
      return response({ success: true, provider: "Resend", recipient, message: "Test e-postası Resend tarafından kabul edildi." });
    } catch (error) {
      console.error("Resend test email failed", error);
      return response({ success: false, provider: "Resend", recipient, message: error instanceof Error ? error.message : "Resend test gönderimi başarısız." }, 502);
    }
  }

  if (body.action === "broadcast_prepare") {
    const admin = await verifySession(tokenFrom(req));
    if (!admin || admin.role !== "admin" || admin.tokenRole !== "admin") return response({ success: false, message: "Bu işlem için yönetici yetkisi gerekli." }, 403);
    const subject = String(body.subject || "").trim().slice(0, 180);
    const message = String(body.message || "").trim().slice(0, 12000);
    const audience = String(body.audience || "");
    const category = audience === "newsletter" ? "marketing" : "service";
    if (subject.length < 1 || message.length < 5) return response({ success: false, message: "Konu ve en az 5 karakterlik mesaj gerekli." }, 400);
    if (!["members", "newsletter"].includes(audience)) return response({ success: false, message: "Geçersiz alıcı grubu." }, 400);
    let emails: string[] = [];
    if (audience === "members") {
      let from = 0;
      while (true) {
        const { data, error } = await db.from("users").select("email")
          .eq("email_verified", true).neq("role", "admin").not("email", "is", null)
          .order("created_at", { ascending: true }).range(from, from + 999);
        if (error) return response({ success: false, message: "Üye e-posta listesi okunamadı." }, 503);
        const batch = (data || []).map((x: any) => String(x.email || "").trim().toLowerCase()).filter((x: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x));
        emails.push(...batch);
        if (!data || data.length < 1000 || from >= 19999) break;
        from += 1000;
      }
    } else {
      let from = 0;
      while (true) {
        const { data, error } = await db.from("portal_newsletter_subscribers").select("email")
          .eq("status", "active").order("subscribed_at", { ascending: true }).range(from, from + 999);
        if (error) return response({ success: false, message: "Bülten aboneleri okunamadı." }, 503);
        emails.push(...(data || []).map((x: any) => String(x.email || "").trim().toLowerCase()));
        if (!data || data.length < 1000 || from >= 19999) break;
        from += 1000;
      }
    }
    emails = [...new Set(emails)].filter((x: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x));
    if (!emails.length) return response({ success: false, message: audience === "newsletter" ? "Henüz izinli bülten abonesi bulunmuyor. Kampanya oluşturulmadı." : "Gönderime uygun doğrulanmış üye bulunamadı." }, 400);
    const { data: campaign, error: campaignError } = await db.from("portal_email_campaigns").insert({
      subject, body: message, audience, category, status: "draft", recipient_count: emails.length, created_by: admin.id
    }).select("id,subject,audience,category,status,recipient_count,created_at").single();
    if (campaignError || !campaign) {
      console.error("Broadcast campaign create failed", campaignError);
      return response({ success: false, message: "E-posta taslağı oluşturulamadı." }, 503);
    }
    for (let offset = 0; offset < emails.length; offset += 500) {
      const rows = emails.slice(offset, offset + 500).map(email => ({ campaign_id: campaign.id, email, status: "queued" }));
      const { error } = await db.from("portal_email_campaign_recipients").insert(rows);
      if (error) {
        console.error("Broadcast recipients insert failed", error);
        await db.from("portal_email_campaigns").delete().eq("id", campaign.id);
        return response({ success: false, message: "Alıcı listesi hazırlanamadı; taslak geri alındı." }, 503);
      }
    }
    return response({ success: true, campaign, recipient_count: emails.length, message: "Taslak hazırlandı. Henüz hiçbir e-posta gönderilmedi." }, 201);
  }

  if (body.action === "broadcast_list") {
    const admin = await verifySession(tokenFrom(req));
    if (!admin || admin.role !== "admin" || admin.tokenRole !== "admin") return response({ success: false, message: "Bu işlem için yönetici yetkisi gerekli." }, 403);
    const { data, error } = await db.from("portal_email_campaigns")
      .select("id,subject,audience,category,status,recipient_count,sent_count,failed_count,created_at,started_at,completed_at")
      .order("created_at", { ascending: false }).limit(20);
    if (error) return response({ success: false, message: "Gönderim geçmişi okunamadı." }, 503);
    return response({ success: true, campaigns: data || [] });
  }

  if (body.action === "broadcast_start") {
    const admin = await verifySession(tokenFrom(req));
    if (!admin || admin.role !== "admin" || admin.tokenRole !== "admin") return response({ success: false, message: "Bu işlem için yönetici yetkisi gerekli." }, 403);
    const id = String(body.campaign_id || "");
    const { data, error } = await db.from("portal_email_campaigns").update({ status: "sending", started_at: new Date().toISOString() })
      .eq("id", id).eq("status", "draft").select("id,status,recipient_count").maybeSingle();
    if (error || !data) return response({ success: false, message: "Gönderim taslağı bulunamadı veya başlatılamıyor." }, 409);
    return response({ success: true, campaign: data, message: "Gönderim başlatıldı. E-postalar 5 kişilik gruplar hâlinde işlenecek." });
  }

  if (body.action === "broadcast_process") {
    const admin = await verifySession(tokenFrom(req));
    if (!admin || admin.role !== "admin" || admin.tokenRole !== "admin") return response({ success: false, message: "Bu işlem için yönetici yetkisi gerekli." }, 403);
    const id = String(body.campaign_id || "");
    const { data: campaign, error: campaignError } = await db.from("portal_email_campaigns")
      .select("id,subject,body,audience,category,status,recipient_count").eq("id", id).maybeSingle();
    if (campaignError || !campaign || campaign.status !== "sending") return response({ success: false, message: "Aktif gönderim bulunamadı." }, 409);
    const { data: queued, error: queueError } = await db.from("portal_email_campaign_recipients")
      .select("id,email").eq("campaign_id", id).eq("status", "queued").order("id").limit(5);
    if (queueError) return response({ success: false, message: "Gönderim kuyruğu okunamadı." }, 503);
    let sentNow = 0, failedNow = 0;
    for (const recipient of (queued || [])) {
      const { data: claimed } = await db.from("portal_email_campaign_recipients")
        .update({ status: "sending", attempts: 1, last_error: null }).eq("id", recipient.id).eq("status", "queued").select("id").maybeSingle();
      if (!claimed) continue;
      try {
        let emailBody = String(campaign.body || "");
        let emailHtml: string | undefined;
        if (campaign.category === "marketing") {
          const payload = b64url(new TextEncoder().encode(String(recipient.email).toLowerCase()));
          const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(sessionSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
          const signature = b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))));
          const unsubscribeUrl = "https://uzmantool.com.tr/newsletter-unsubscribe.html?token=" + encodeURIComponent(payload + "." + signature);
          emailBody += "\\n\\n---\\nBu bülteni almak istemiyorsanız aboneliğinizi buradan kaldırabilirsiniz: " + unsubscribeUrl;
          emailHtml = '<div style="font-size:15px;line-height:1.85;color:#334155;white-space:pre-line">' + escapeEmailHtml(String(campaign.body || "")).replace(/\\n/g, "<br>") + '<hr style="border:0;border-top:1px solid #dbe4ee;margin:24px 0"><p style="font-size:12px;color:#64748b">Bu bülteni almak istemiyorsanız <a href="' + unsubscribeUrl + '" style="color:#1769aa">aboneliğinizi buradan kaldırabilirsiniz</a>.</p></div>';
        }
        await sendPortalEmail(String(recipient.email), String(campaign.subject), emailBody, emailHtml);
        await db.from("portal_email_campaign_recipients").update({ status: "sent", sent_at: new Date().toISOString(), last_error: null }).eq("id", recipient.id);
        sentNow++;
      } catch (sendError) {
        const safe = String(sendError instanceof Error ? sendError.message : "Gönderim başarısız.").slice(0, 300);
        await db.from("portal_email_campaign_recipients").update({ status: "failed", last_error: safe }).eq("id", recipient.id);
        failedNow++;
      }
    }
    const [sent, failed, queuedLeft, sendingLeft] = await Promise.all([
      db.from("portal_email_campaign_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", id).eq("status", "sent"),
      db.from("portal_email_campaign_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", id).eq("status", "failed"),
      db.from("portal_email_campaign_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", id).eq("status", "queued"),
      db.from("portal_email_campaign_recipients").select("id", { count: "exact", head: true }).eq("campaign_id", id).eq("status", "sending")
    ]);
    const sentCount = Number(sent.count || 0), failedCount = Number(failed.count || 0);
    const remaining = Number(queuedLeft.count || 0) + Number(sendingLeft.count || 0);
    await db.from("portal_email_campaigns").update({
      sent_count: sentCount, failed_count: failedCount,
      ...(remaining === 0 ? { status: "completed", completed_at: new Date().toISOString() } : {})
    }).eq("id", id);
    return response({ success: true, sent_now: sentNow, failed_now: failedNow, sent_count: sentCount, failed_count: failedCount, remaining, completed: remaining === 0, message: remaining === 0 ? "Gönderim tamamlandı." : "Grup işlendi. Devam etmek için tekrar gönderim yapın." });
  }

  if (body.action === "newsletter_unsubscribe") {
    const token = String(body.token || "");
    const parts = token.split(".");
    if (parts.length !== 2 || !sessionSecret) return response({ success: false, message: "Abonelik bağlantısı geçersiz." }, 400);
    try {
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(sessionSecret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
      if (!await crypto.subtle.verify("HMAC", key, decode64url(parts[1]), new TextEncoder().encode(parts[0]))) return response({ success: false, message: "Abonelik bağlantısı geçersiz." }, 400);
      const email = new TextDecoder().decode(decode64url(parts[0])).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return response({ success: false, message: "Abonelik bağlantısı geçersiz." }, 400);
      const now = new Date().toISOString();
      const { error: suppressionError } = await db.from("portal_marketing_suppressions").upsert({ email, reason: "unsubscribe", created_at: now }, { onConflict: "email" });
      if (suppressionError) return response({ success: false, message: "E-posta tercihiniz kaydedilemedi. Lütfen tekrar deneyin." }, 503);
      const { error } = await db.from("portal_newsletter_subscribers").update({ status: "unsubscribed", unsubscribed_at: now }).eq("email", email);
      if (error) return response({ success: false, message: "Abonelik tercihiniz kaydedilemedi." }, 503);
      return response({ success: true, message: "Bülten aboneliğiniz kaldırıldı." });
    } catch {
      return response({ success: false, message: "Abonelik bağlantısı geçersiz." }, 400);
    }
  }

  if (body.action === "register") {
    const username = String(body.username || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const rawPhone = String(body.phone || "").trim();
    const countryCode = String(body.country_code || "TR").trim().toUpperCase();
    const password = String(body.password || "");

    if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(username)) {
      return response({ success: false, message: "Kullanıcı adı 3-32 karakter olmalı; harf, rakam, nokta, alt çizgi veya tire kullanın." }, 400);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
      return response({ success: false, message: "Geçerli bir e-posta adresi girin." }, 400);
    }
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      return response({ success: false, message: "Geçerli ülke seçimi gerekli." }, 400);
    }
    if (password.length < 8 || password.length > 128) {
      return response({ success: false, message: "Şifre en az 8, en fazla 128 karakter olmalıdır." }, 400);
    }

    let phone = rawPhone;
    if (countryCode === "TR") {
      let digits = rawPhone.replace(/\D/g, "");
      if (digits.startsWith("90") && digits.length === 12) digits = "0" + digits.slice(2);
      else if (digits.length === 10 && digits.startsWith("5")) digits = "0" + digits;
      phone = digits;
      if (!/^05\d{9}$/.test(phone)) {
        return response({ success: false, message: "Türkiye için 05XXXXXXXXX biçiminde geçerli cep telefonu girin." }, 400);
      }
    } else {
      phone = rawPhone.replace(/[^\d+]/g, "");
      if (!phone.startsWith("+")) phone = "+" + phone;
      if (!/^\+\d{7,15}$/.test(phone)) {
        return response({ success: false, message: "Ülke koduyla birlikte geçerli telefon numarası girin. Örnek: +12025550123." }, 400);
      }
    }

    const forwarded = req.headers.get("cf-connecting-ip")
      || String(req.headers.get("x-forwarded-for") || "").split(",")[0].trim()
      || req.headers.get("x-real-ip")
      || "";
    let ipHash: string | null = null;
    if (forwarded && sessionSecret) {
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(sessionSecret + "|" + forwarded));
      ipHash = Array.from(new Uint8Array(digest)).map(x => x.toString(16).padStart(2, "0")).join("");
    }

    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [ipCount, emailCount] = await Promise.all([
      ipHash
        ? db.from("portal_registration_attempts").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", hourAgo)
        : Promise.resolve({ count: 0, error: null }),
      db.from("portal_registration_attempts").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", dayAgo),
    ]);
    if (ipCount.error || emailCount.error) {
      console.error("registration rate limit lookup failed", ipCount.error || emailCount.error);
      return response({ success: false, message: "Kayıt servisi şu anda kullanılamıyor. Lütfen daha sonra tekrar deneyin." }, 503);
    }
    if (Number(ipCount.count || 0) >= 30 || Number(emailCount.count || 0) >= 15) {
      console.warn("portal registration rate limit reached", { ipAttempts: Number(ipCount.count || 0), emailAttempts: Number(emailCount.count || 0) });
      return response({ success: false, code: "REGISTRATION_RATE_LIMIT", message: "Güvenlik nedeniyle kayıt isteği geçici olarak sınırlandı. Lütfen bir süre bekleyip tekrar deneyin." }, 429);
    }

    const { error: attemptError } = await db.from("portal_registration_attempts").insert({ email, ip_hash: ipHash });
    if (attemptError) {
      console.error("registration attempt log failed", attemptError);
      return response({ success: false, message: "Kayıt isteği şu anda alınamıyor." }, 503);
    }

    const [byUsername, byEmail, byPhone] = await Promise.all([
      db.from("users").select("id").eq("username", username).maybeSingle(),
      db.from("users").select("id").in("registration_channel", ["web", "unknown"]).eq("email", email).maybeSingle();
      db.from("users").select("id").eq("phone", phone).maybeSingle(),
    ]);
    if (byUsername.data) return response({ success: false, message: "Bu kullanıcı adı zaten kullanılıyor." }, 409);
    if (byEmail.data) return response({ success: false, message: "Bu e-posta adresi zaten kayıtlı." }, 409);
    if (byPhone.data) return response({ success: false, message: "Bu telefon numarası zaten kayıtlı." }, 409);
    if (byUsername.error || byEmail.error || byPhone.error) {
      console.error("registration duplicate lookup failed", byUsername.error || byEmail.error || byPhone.error);
      return response({ success: false, message: "Kayıt bilgileri kontrol edilemedi." }, 503);
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" }, key, 256);
    const passwordHash = "pbkdf2_sha256$310000$" + b64url(salt) + "$" + b64url(new Uint8Array(bits));
    const code = makeOtp();
    const codeHash = await sha256Hex(code);
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const languageCode = String(body.language_code || "tr").toLowerCase() === "en" ? "en" : "tr";
    const registrationChannel = "web";
    const rawAttribution = body.attribution && typeof body.attribution === "object" ? body.attribution : {};
    const allowedSources = new Set(["google","instagram","facebook","youtube","tiktok","whatsapp","email","referral","direct","other","unknown"]);
    const acquisitionSource = allowedSources.has(String(rawAttribution.source || "").toLowerCase()) ? String(rawAttribution.source).toLowerCase() : "unknown";
    const cleanAttr = (value: unknown, max = 300) => String(value || "").replace(/[<>\u0000-\u001f]/g, "").trim().slice(0, max);
    const acquisition = {
      registration_channel: registrationChannel,
      acquisition_source: acquisitionSource,
      acquisition_medium: cleanAttr(rawAttribution.medium, 100) || null,
      acquisition_campaign: cleanAttr(rawAttribution.campaign, 160) || null,
      acquisition_referrer: cleanAttr(rawAttribution.referrer, 500) || null,
      acquisition_landing_page: cleanAttr(rawAttribution.landing_page, 500) || null,
      acquisition_captured_at: new Date().toISOString(),
    };

    const { error: verificationError } = await db.from("registration_verifications").upsert({
      username, email, phone, country_code: countryCode, language_code: languageCode,
      password_hash: passwordHash, code_hash: codeHash, expires_at: expiresAt,
      ...acquisition, attempts: 0, created_at: now,
    }, { onConflict: "registration_channel,email" });
    if (verificationError) {
      console.error("portal registration verification upsert failed", verificationError);
      return response({ success: false, message: "Doğrulama isteği oluşturulamadı. Lütfen tekrar deneyin." }, 503);
    }

    const mailBody =
      "Merhaba " + username + ",\n\n" +
      "Uzmantech üyelik başvurunuzu tamamlamak için e-posta doğrulama kodunuz: " + code + "\n\n" +
      "Bu kod 10 dakika geçerlidir ve yalnızca bir kez kullanılabilir.\n\n" +
      "Bu işlemi siz başlatmadıysanız bu e-postayı dikkate almayın.\n\n" +
      "Uzmantech | https://uzmantool.com.tr";

    const safeUsername = username.replace(/[&<>\"]/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;",
    }[char] || char));
    const mailHtml = `<!doctype html>
<html lang="tr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>Uzmantech e-posta doğrulama</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#172033">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f1f5f9;padding:32px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden">
<tr><td style="padding:28px 32px;background:#102a56;background-image:linear-gradient(135deg,#102a56,#1764c0)">
<div style="font-size:13px;letter-spacing:3px;font-weight:700;color:#bfdbfe">UZMANTECH</div>
<div style="font-size:25px;line-height:1.3;font-weight:700;color:#ffffff;margin-top:12px">E-posta adresini doğrula</div>
<div style="font-size:14px;line-height:1.6;color:#dbeafe;margin-top:8px">Hesabını güvenle oluşturmaya bir adım kaldı.</div>
</td></tr>
<tr><td style="padding:32px">
<p style="font-size:16px;line-height:1.6;margin:0 0 12px">Merhaba <strong>${safeUsername}</strong>,</p>
<p style="font-size:14px;line-height:1.7;color:#475569;margin:0 0 24px">Uzmantech üyelik başvurunu tamamlamak için aşağıdaki doğrulama kodunu kullan:</p>
<div style="background:#f1f6ff;border:1px solid #d7e6ff;border-radius:14px;padding:22px 12px;text-align:center">
<div style="font-size:11px;letter-spacing:2px;font-weight:700;color:#526783;margin-bottom:10px">DOĞRULAMA KODUN</div>
<div style="font-size:34px;line-height:1.3;font-weight:700;letter-spacing:9px;color:#1557b0;font-family:Arial,Helvetica,sans-serif">${code}</div>
</div>
<p style="font-size:13px;line-height:1.7;color:#475569;margin:22px 0 0"><strong>Önemli:</strong> Bu kod 10 dakika geçerlidir ve yalnızca bir kez kullanılabilir.</p>
<div style="height:1px;background:#e8edf4;margin:24px 0"></div>
<p style="font-size:12px;line-height:1.7;color:#64748b;margin:0">Bu üyelik işlemini sen başlatmadıysan bu e-postayı yok sayabilirsin. Güvenliğin için doğrulama kodunu hiç kimseyle paylaşma.</p>
</td></tr>
<tr><td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #edf1f5">
<div style="font-size:12px;font-weight:700;color:#334155">Uzmantech</div>
<div style="font-size:11px;line-height:1.6;color:#94a3b8;margin-top:5px">Cep telefonu yazılım ve servis çözümleri</div>
<a href="https://uzmantool.com.tr" style="font-size:11px;color:#2563eb;text-decoration:none">uzmantool.com.tr</a>
</td></tr>
</table>
<div style="font-size:10px;color:#94a3b8;margin-top:16px">Bu otomatik bir bilgilendirme e-postasıdır. Lütfen yanıtlamayın.</div>
</td></tr></table>
</body></html>`;
    const { error: mailError } = await queuePortalEmail(email, "Uzmantech | E-posta Adresi Doğrulama", mailBody, mailHtml);
    if (mailError) {
      await db.from("registration_verifications").delete().eq("email", email).eq("registration_channel", "web");
      console.error("portal registration email queue failed", mailError);
      return response({ success: false, message: "Doğrulama e-postası kuyruğa alınamadı. Lütfen tekrar deneyin." }, 503);
    }

    await db.from("portal_registration_attempts").delete().lt("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());
    return response({
      success: true,
      verification_required: true,
      email: maskEmail(email),
      message: "6 haneli doğrulama kodu e-posta adresinize gönderildi.",
    }, 200);
  }

  if (body.action === "register_verify") {
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.code || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !/^\d{6}$/.test(code)) {
      return response({ success: false, message: "E-posta veya doğrulama kodu geçersiz." }, 400);
    }

    const { data: verification, error: verificationLookupError } = await db.from("registration_verifications")
      .select("id,username,email,phone,country_code,language_code,registration_channel,password_hash,code_hash,expires_at,attempts")
      .eq("email", email).eq("registration_channel", "web").maybeSingle();
    if (verificationLookupError || !verification) {
      return response({ success: false, message: "Kod geçersiz veya süresi dolmuş. Yeni kod isteyin." }, 400);
    }

    const attempts = Number(verification.attempts || 0);
    if (attempts >= 8) return response({ success: false, code: "VERIFICATION_ATTEMPTS_EXCEEDED", message: "Çok fazla hatalı kod denemesi yapıldı. Yeni doğrulama kodu isteyin." }, 429);
    if (new Date(verification.expires_at).getTime() <= Date.now()) {
      await db.from("registration_verifications").delete().eq("id", verification.id);
      return response({ success: false, message: "Doğrulama kodunun süresi doldu. Yeni kod isteyin." }, 400);
    }

    const suppliedHash = await sha256Hex(code);
    if (!safeEqual(new TextEncoder().encode(suppliedHash), new TextEncoder().encode(String(verification.code_hash || "").toLowerCase()))) {
      await db.from("registration_verifications").update({ attempts: attempts + 1 }).eq("id", verification.id);
      return response({ success: false, message: "Doğrulama kodu hatalı." }, 400);
    }

    const [byUsername, byEmail, byPhone] = await Promise.all([
      db.from("users").select("id").eq("username", verification.username).maybeSingle(),
      db.from("users").select("id").in("registration_channel", ["web", "unknown"]).eq("email", verification.email).maybeSingle();
      db.from("users").select("id").eq("phone", verification.phone).maybeSingle(),
    ]);
    if (byUsername.error || byEmail.error || byPhone.error) {
      return response({ success: false, message: "Kayıt bilgileri doğrulanamadı." }, 503);
    }
    if (byUsername.data || byEmail.data || byPhone.data) {
      await db.from("registration_verifications").delete().eq("id", verification.id);
      return response({ success: false, message: "Kullanıcı adı, e-posta veya telefon artık kullanılıyor." }, 409);
    }

    const now = new Date().toISOString();
    const { data: newUser, error: createError } = await db.from("users").insert({
      username: verification.username,
      email: verification.email,
      phone: verification.phone,
      country_code: verification.country_code,
      language_code: verification.language_code,
      password_hash: verification.password_hash,
      registration_channel: "web",
      role: "user",
      status: "pending",
      email_verified: true,
      expiry_date: null,
      license_plan: "none",
      license_days: 0,
      license_started_at: null,
      disabled_reason: null,
      ...Object.fromEntries(Object.entries(verification).filter(([key]) => key.startsWith("acquisition_"))),
      created_at: now,
      updated_at: now,
    }).select("id,username,email,phone,country_code,language_code,role,status,email_verified,created_at").single();

    if (createError) {
      console.error("portal verified registration insert failed", createError);
      if (createError.code === "23505") return response({ success: false, message: "Kullanıcı adı, e-posta veya telefon zaten kayıtlı." }, 409);
      return response({ success: false, message: "Kayıt tamamlanamadı. Lütfen tekrar deneyin." }, 503);
    }

    await db.from("registration_verifications").delete().eq("id", verification.id);
    return response({
      success: true,
      message: "E-posta adresiniz doğrulandı. Hesabınız yönetici onayını bekliyor.",
      user: newUser,
    }, 201);
  }


  if (body.action === "email_queue_claim") {
    const admin = await verifySession(tokenFrom(req));
    if (!admin || admin.role !== "admin" || admin.tokenRole !== "admin") {
      return response({ success: false, message: "E-posta kuyruğu için yönetici yetkisi gerekli." }, 403);
    }
    const now = new Date().toISOString();
    const { data: queued, error: queuedError } = await db.from("portal_email_outbox")
      .select("id,recipient,subject,body,status,attempts,expires_at")
      .eq("status", "queued").gt("expires_at", now)
      .order("created_at", { ascending: true }).limit(1);
    if (queuedError) return response({ success: false, message: "E-posta kuyruğu okunamadı." }, 503);

    let job = queued?.[0] || null;
    if (!job) {
      const { data: stale, error: staleError } = await db.from("portal_email_outbox")
        .select("id,recipient,subject,body,status,attempts,expires_at")
        .eq("status", "sending").lte("lease_until", now).gt("expires_at", now)
        .order("created_at", { ascending: true }).limit(1);
      if (staleError) return response({ success: false, message: "E-posta kuyruğu okunamadı." }, 503);
      job = stale?.[0] || null;
    }
    if (!job) return response({ success: true, email: null });

    let claim = db.from("portal_email_outbox").update({
      status: "sending",
      attempts: Number(job.attempts || 0) + 1,
      lease_until: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
      last_error: null,
    }).eq("id", job.id).eq("status", job.status);
    if (job.status === "sending") claim = claim.lte("lease_until", now);
    const { data: claimed, error: claimError } = await claim
      .select("id,recipient,subject,body,attempts").maybeSingle();
    if (claimError) return response({ success: false, message: "E-posta işi alınamadı." }, 503);
    return response({ success: true, email: claimed || null });
  }

  if (body.action === "email_queue_complete") {
    const admin = await verifySession(tokenFrom(req));
    if (!admin || admin.role !== "admin" || admin.tokenRole !== "admin") {
      return response({ success: false, message: "E-posta kuyruğu için yönetici yetkisi gerekli." }, 403);
    }
    const id = String(body.email_id || "").trim();
    const sent = body.sent === true;
    if (!id) return response({ success: false, message: "E-posta işi kimliği gerekli." }, 400);
    const { data: job, error: lookupError } = await db.from("portal_email_outbox")
      .select("id,attempts,expires_at").eq("id", id).eq("status", "sending").maybeSingle();
    if (lookupError || !job) return response({ success: false, message: "E-posta işi bulunamadı veya artık size ait değil." }, 404);

    const now = new Date().toISOString();
    const attempts = Number(job.attempts || 0);
    const patch = sent
      ? { status: "sent", body: null, sent_at: now, lease_until: null, last_error: null }
      : (attempts < 3 && new Date(job.expires_at).getTime() > Date.now()
        ? { status: "queued", lease_until: null, last_error: String(body.error || "Gönderim başarısız.").slice(0, 500) }
        : { status: "failed", body: null, lease_until: null, last_error: String(body.error || "Gönderim başarısız.").slice(0, 500) });
    const { error: updateError } = await db.from("portal_email_outbox").update(patch).eq("id", id).eq("status", "sending");
    if (updateError) return response({ success: false, message: "E-posta sonucu kaydedilemedi." }, 503);
    return response({ success: true });
  }


  if (body.action === "password_reset_request") {
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
      return response({ success: false, message: "Geçerli bir e-posta adresi girin." }, 400);
    }
    const { data: user, error } = await db.from("users")
      .select("id,username,status,reset_code_sent_at").in("registration_channel", ["web", "unknown"]).eq("email", email).maybeSingle();
    if (error) return response({ success: false, message: "Şifre sıfırlama servisi şu anda kullanılamıyor." }, 503);
    if (!user || user.status === "disabled") return response({ success: true, accepted: true });
    const lastSent = user.reset_code_sent_at ? new Date(user.reset_code_sent_at).getTime() : 0;
    if (lastSent && Date.now() - lastSent < 60000) return response({ success: true, accepted: true });

    const code = makeOtp();
    const codeHash = await sha256Hex(code);
    const now = new Date().toISOString();
    const { error: updateError } = await db.from("users").update({
      reset_code_hash: codeHash,
      reset_code_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      reset_code_attempts: 0,
      reset_code_sent_at: now,
      updated_at: now,
    }).eq("id", user.id);
    if (updateError) return response({ success: false, message: "Doğrulama isteği kaydedilemedi." }, 503);

    const mailBody =
      "Merhaba " + String(user.username || "") + ",\n\n" +
      "Uzmantech şifre sıfırlama kodunuz:\n\n    " + code +
      "\n\nBu kod 10 dakika geçerlidir ve yalnızca bir kez kullanılabilir." +
      "\n\nBu işlemi siz başlatmadıysanız bu e-postayı dikkate almayın.\n\nUzmantech";
    const { error: mailError } = await queuePortalEmail(email, "Uzmantech - Şifre Sıfırlama Kodu", mailBody);
    if (mailError) {
      await db.from("users").update({
        reset_code_hash: null, reset_code_expires_at: null,
        reset_code_attempts: 0, reset_code_sent_at: null, updated_at: new Date().toISOString(),
      }).eq("id", user.id);
      console.error("portal password reset mail queue failed", mailError);
      return response({ success: false, message: "Doğrulama e-postası kuyruğa alınamadı." }, 503);
    }
    return response({ success: true, accepted: true });
  }

  if (body.action === "password_reset_confirm") {
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.code || "").trim();
    const newPassword = String(body.new_password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !/^\d{6}$/.test(code)) {
      return response({ success: false, message: "E-posta veya doğrulama kodu geçersiz." }, 400);
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      return response({ success: false, message: "Yeni şifre 8-128 karakter arasında olmalıdır." }, 400);
    }
    const { data: user, error } = await db.from("users")
      .select("id,status,reset_code_hash,reset_code_expires_at,reset_code_attempts")
      .in("registration_channel", ["web", "unknown"]).eq("email", email).maybeSingle();
    if (error) return response({ success: false, message: "Hesap bilgileri okunamadı." }, 503);
    if (!user || user.status === "disabled") return response({ success: false, message: "Kod geçersiz veya süresi dolmuş." }, 400);
    const attempts = Number(user.reset_code_attempts || 0);
    if (attempts >= 5) return response({ success: false, message: "Çok fazla hatalı deneme yapıldı. Yeni kod isteyin." }, 429);
    const expiresAt = user.reset_code_expires_at ? new Date(user.reset_code_expires_at).getTime() : 0;
    if (!user.reset_code_hash || !expiresAt || expiresAt <= Date.now()) {
      return response({ success: false, message: "Kod geçersiz veya süresi dolmuş." }, 400);
    }
    const suppliedHash = await sha256Hex(code);
    if (!safeEqual(new TextEncoder().encode(suppliedHash), new TextEncoder().encode(String(user.reset_code_hash).toLowerCase()))) {
      await db.from("users").update({ reset_code_attempts: attempts + 1, updated_at: new Date().toISOString() }).eq("id", user.id);
      return response({ success: false, message: "Doğrulama kodu hatalı." }, 400);
    }
    const passwordHash = await hashPassword(newPassword);
    const { error: updateError } = await db.from("users").update({
      password_hash: passwordHash,
      reset_code_hash: null,
      reset_code_expires_at: null,
      reset_code_attempts: 0,
      reset_code_sent_at: null,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (updateError) return response({ success: false, message: "Yeni şifre kaydedilemedi." }, 503);
    return response({ success: true, message: "Şifreniz başarıyla güncellendi." });
  }

  if (body.action === "login") {
    const identifier = String(body.identifier || body.username || "").trim();
    const password = String(body.password || "");
    if (!identifier || !password || identifier.length > 254 || password.length > 256) {
      return response({ success: false, message: "Kullanıcı adı/e-posta ve şifre gerekli." }, 400);
    }
    let result = await db.from("users")
      .select("id,username,email,password_hash,email_verified,role,status,disabled_reason,expiry_date,license_plan,license_days,license_started_at,country_code,language_code,registration_channel")
      .eq("username", identifier).in("registration_channel", ["web", "unknown"]).maybeSingle();
    if (!result.data && !result.error) {
      result = await db.from("users")
        .select("id,username,email,password_hash,email_verified,role,status,disabled_reason,expiry_date,license_plan,license_days,license_started_at,country_code,language_code,registration_channel")
        .eq("email", identifier.toLowerCase()).in("registration_channel", ["web", "unknown"]).maybeSingle();
    }
    const user = result.data;
    if (result.error) return response({ success: false, message: "Giriş servisi şu anda kullanılamıyor." }, 503);
    const validPassword = !!user && await verifyPassword(password, user.password_hash);
    const logLogin = async (success: boolean, details: string) => {
      if (!user?.id) return;
      await db.from("activity_logs").insert({
        user_id: user.id, username: user.username, action: "portal_login",
        category: "account_login", result: success ? "success" : "failed",
        details, app_version: "portal"
      });
    };
    if (!validPassword) {
      await logLogin(false, "Portal login failed: invalid credentials");
      return response({ success: false, message: "Kullanıcı bilgileri hatalı." }, 401);
    }
    if (user.email_verified !== true) {
      await logLogin(false, "Portal login blocked: email not verified");
      return response({ success: false, status: "email_not_verified", message: "E-posta adresiniz henüz doğrulanmadı. Lütfen e-posta doğrulama işlemini tamamlayın." }, 403);
    }
    if (user.status === "pending") {
      await logLogin(false, "Portal login blocked: approval pending");
      return response({ success: false, status: "pending", message: "Hesabınız yönetici onayı bekliyor." }, 403);
    }
    const expiryTime = user.expiry_date ? new Date(user.expiry_date).getTime() : 0;
    const isExpired = user.role !== "admin" && (!expiryTime || expiryTime <= Date.now());
    const renewalOnly = user.status === "disabled" && user.disabled_reason === "license_expired" && !!expiryTime && expiryTime <= Date.now();
    if (user.status !== "active" && !renewalOnly) {
      await logLogin(false, "Portal login blocked: account disabled");
      return response({ success: false, status: "disabled", message: "Hesabınız yönetici tarafından devre dışı bırakılmış veya onay bekliyor." }, 403);
    }
    const now = new Date().toISOString();
    await db.from("users").update({ last_login: now, updated_at: now }).eq("id", user.id);
    await logLogin(true, "Portal login successful");
    const session_token = await signSession({ id: user.id, role: user.role });
    const { password_hash: _secret, ...safeUser } = user;
    return response({
      success: true,
      session_token,
      user: {
        ...safeUser,
        membership_expired: isExpired,
        renewal_only: renewalOnly,
        license_status: user.role === "admin" ? "admin" : (!expiryTime ? "unassigned" : (expiryTime <= Date.now() ? "expired" : "active")),
      },
      expires_in: 43200
    });
  }

  if (body.action === "account_profile") {
    const member = await verifySession(tokenFrom(req), true);
    if (!member) return response({ success: false, message: "Oturum geçersiz veya süresi dolmuş." }, 401);
    const { data: events, error } = await db.from("activity_logs")
      .select("id,created_at,result,details")
      .eq("user_id", member.id).eq("action", "portal_login")
      .order("created_at", { ascending: false }).limit(10);
    if (error) return response({ success: false, message: "Giriş geçmişi okunamadı." }, 503);
    return response({ success: true, user: member, login_events: events || [] });
  }

  if (body.action === "account_password_change") {
    const member = await verifySession(tokenFrom(req), true);
    if (!member) return response({ success: false, message: "Oturum geçersiz veya süresi dolmuş." }, 401);
    const current = String(body.current_password || "");
    const next = String(body.new_password || "");
    if (next.length < 8 || next.length > 128) return response({ success: false, message: "Yeni şifre 8-128 karakter arasında olmalıdır." }, 400);
    const { data: row, error } = await db.from("users").select("password_hash").eq("id", member.id).single();
    if (error || !row || !await verifyPassword(current, row.password_hash)) return response({ success: false, message: "Mevcut şifreniz hatalı." }, 400);
    const { error: updateError } = await db.from("users").update({ password_hash: await hashPassword(next), updated_at: new Date().toISOString() }).eq("id", member.id);
    if (updateError) return response({ success: false, message: "Şifre güncellenemedi." }, 503);
    return response({ success: true, message: "Şifreniz güncellendi." });
  }

  if (body.action === "account_email_request") {
    const member = await verifySession(tokenFrom(req), true);
    if (!member) return response({ success: false, message: "Oturum geçersiz veya süresi dolmuş." }, 401);
    const email = String(body.new_email || "").trim().toLowerCase();
    const currentPassword = String(body.current_password || "");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return response({ success: false, message: "Geçerli bir e-posta adresi girin." }, 400);
    if (email === String(member.email || "").toLowerCase()) return response({ success: false, message: "Bu adres zaten hesabınızda kayıtlı." }, 400);
    const { data: row, error: userError } = await db.from("users").select("password_hash").eq("id", member.id).single();
    if (userError || !row || !await verifyPassword(currentPassword, row.password_hash)) return response({ success: false, message: "Güvenlik için mevcut şifrenizi doğrulayın." }, 400);
    const { data: taken } = await db.from("users").select("id").in("registration_channel", ["web", "unknown"]).eq("email", email).maybeSingle();
    if (taken) return response({ success: false, message: "Bu e-posta başka bir hesapta kullanılıyor." }, 409);
    const code = makeOtp();
    const codeHash = await sha256Hex(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error: saveError } = await db.from("portal_email_change_requests").upsert({
      user_id: member.id, new_email: email, code_hash: codeHash, expires_at: expiresAt, attempts: 0, created_at: new Date().toISOString()
    }, { onConflict: "user_id" });
    if (saveError) return response({ success: false, message: "E-posta değişikliği başlatılamadı." }, 503);
    const queued = await queuePortalEmail(email, "Uzmantech e-posta değişikliği doğrulaması", "Uzmantech hesabınızın e-posta adresini değiştirmek için doğrulama kodunuz: " + code + "\\nKod 10 dakika geçerlidir. Bu işlemi siz başlatmadıysanız bu e-postayı dikkate almayın.");
    if (queued.error) return response({ success: false, message: "Doğrulama e-postası sıraya alınamadı." }, 503);
    return response({ success: true, message: "Doğrulama kodu yeni e-posta adresinize gönderildi." });
  }

  if (body.action === "account_email_confirm") {
    const member = await verifySession(tokenFrom(req), true);
    if (!member) return response({ success: false, message: "Oturum geçersiz veya süresi dolmuş." }, 401);
    const code = String(body.code || "").trim();
    if (!/^\d{6}$/.test(code)) return response({ success: false, message: "6 haneli doğrulama kodunu girin." }, 400);
    const { data: pending, error } = await db.from("portal_email_change_requests").select("*").eq("user_id", member.id).maybeSingle();
    if (error || !pending) return response({ success: false, message: "Bekleyen e-posta değişikliği bulunamadı." }, 404);
    if (Number(pending.attempts || 0) >= 5 || new Date(pending.expires_at).getTime() <= Date.now()) return response({ success: false, message: "Kodun süresi doldu veya deneme sınırı aşıldı. Yeniden kod isteyin." }, 400);
    const supplied = await sha256Hex(code);
    if (!safeEqual(new TextEncoder().encode(supplied), new TextEncoder().encode(String(pending.code_hash)))) {
      await db.from("portal_email_change_requests").update({ attempts: Number(pending.attempts || 0) + 1 }).eq("id", pending.id);
      return response({ success: false, message: "Doğrulama kodu hatalı." }, 400);
    }
    const { data: taken } = await db.from("users").select("id").in("registration_channel", ["web", "unknown"]).eq("email", pending.new_email).maybeSingle();
    if (taken && taken.id !== member.id) return response({ success: false, message: "Bu e-posta başka bir hesapta kullanılıyor." }, 409);
    const { error: updateError } = await db.from("users").update({ email: pending.new_email, updated_at: new Date().toISOString() }).eq("id", member.id);
    if (updateError) return response({ success: false, message: "E-posta adresi güncellenemedi." }, 503);
    await db.from("portal_email_change_requests").delete().eq("id", pending.id);
    return response({ success: true, message: "E-posta adresiniz güncellendi.", email: pending.new_email });
  }

  if (body.action === "session") {
    const user = await verifySession(String(body.session_token || tokenFrom(req)), true);
    if (!user) return response({ success: false, message: "Oturum geçersiz veya süresi dolmuş." }, 401);
    const { tokenRole: _tokenRole, ...safeUser } = user;
    return response({ success: true, user: safeUser });
  }

  if (body.action === "logout") return response({ success: true });


  if (body.action === "payment_history") {
    const member = await verifySession(tokenFrom(req), true);
    if (!member || member.role === "admin") return response({ success: false, message: "Ödeme geçmişi için geçerli üye oturumu gerekli." }, 401);
    const { data, error } = await db.from("portal_payment_notices")
      .select("id,plan,license_days,amount,currency,amount_try,exchange_rate,status,admin_note,created_at,reviewed_at")
      .eq("user_id", member.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) return response({ success: false, message: "Ödeme geçmişi okunamadı." }, 503);
    return response({ success: true, payments: data || [] });
  }

  if (body.action === "payment_list") {
    const admin = await verifySession(tokenFrom(req));
    if (!admin || admin.role !== "admin" || admin.tokenRole !== "admin") {
      return response({ success: false, message: "Bu işlem için yönetici yetkisi gerekli." }, 403);
    }
    const { data: rows, error } = await db.from("portal_payment_notices")
      .select("*").order("created_at", { ascending: false }).limit(100);
    if (error) return response({ success: false, message: "Ödeme bildirimleri okunamadı." }, 503);
    const ids = [...new Set((rows || []).map((x: any) => x.user_id))];
    const { data: users } = ids.length
      ? await db.from("users").select("id,username,email").in("id", ids)
      : { data: [] };
    const userMap = new Map((users || []).map((u: any) => [u.id, u]));
    const payments = await Promise.all((rows || []).map(async (row: any) => {
      const signed = await db.storage.from("portal-receipts").createSignedUrl(row.receipt_path, 600);
      return {
        ...row,
        user: userMap.get(row.user_id) || null,
        receipt_url: signed.error ? null : signed.data?.signedUrl || null,
      };
    }));
    return response({ success: true, payments });
  }

  if (body.action === "payment_review") {
    const admin = await verifySession(tokenFrom(req));
    if (!admin || admin.role !== "admin" || admin.tokenRole !== "admin") {
      return response({ success: false, message: "Bu işlem için yönetici yetkisi gerekli." }, 403);
    }
    const paymentId = String(body.payment_id || "").trim();
    const status = String(body.status || "");
    const note = String(body.admin_note || "").trim().slice(0, 500);
    if (!paymentId || !["approved", "rejected"].includes(status)) {
      return response({ success: false, message: "Ödeme kaydı ve geçerli karar gerekli." }, 400);
    }
    const { data, error } = await db.rpc("portal_review_payment", {
      p_payment_id: paymentId, p_status: status, p_admin_id: admin.id, p_admin_note: note,
    });
    if (error) {
      console.error("payment review failed", error);
      return response({ success: false, message: error.message || "Ödeme kararı uygulanamadı." }, 400);
    }
    const targetId = String((data as any)?.user_id || "");
    const { data: target } = targetId ? await db.from("users").select("username,email,expiry_date").eq("id", targetId).maybeSingle() : { data: null };
    let emailSent = false;
    if (target?.email) {
      const subject = status === "approved" ? "Uzmantech ödeme bildiriminiz onaylandı" : "Uzmantech ödeme bildiriminiz reddedildi";
      const bodyText = String(target.username || "Üyemiz") + " merhaba,\\n\\n" +
        (status === "approved"
          ? "Ödeme bildiriminiz onaylandı ve lisans süreniz hesabınıza eklendi. Yeni lisans bitiş tarihi: " + (target.expiry_date ? new Date(target.expiry_date).toLocaleDateString("tr-TR") : "Hesabınızı kontrol edin") + "."
          : "Ödeme bildiriminiz yönetim tarafından reddedildi. Açıklama: " + (note || "Ek bir açıklama girilmedi.") ) +
        "\\n\\nUzmantech Yönetimi";
      const queued = await queuePortalEmail(String(target.email), subject, bodyText);
      emailSent = !queued.error;
      if (queued.error) console.error("Payment review notification failed", queued.error);
    }
    return response({ success: true, result: data, email_sent: emailSent, message: (status === "approved" ? "Ödeme onaylandı ve lisans süresi eklendi." : "Ödeme reddedildi.") + (emailSent ? " Üyeye e-posta gönderildi." : " Ancak üyeye e-posta gönderilemedi.") });
  }

  return response({ success: false, message: "Geçersiz işlem." }, 400);
});

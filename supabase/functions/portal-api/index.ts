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
async function queuePortalEmail(recipient: string, subject: string, body: string) {
  return await db.from("portal_email_outbox").insert({
    recipient, subject, body, status: "queued",
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  });
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
      .select("id,username,email,phone,country_code,language_code,role,status,created_at,last_login,disabled_reason,expiry_date,license_plan,license_days,license_started_at")
      .eq("id", payload.sub).maybeSingle();
    if (error || !user) return null;

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

const paidArchivePlans = new Set(["weekly", "monthly", "half_year", "annual", "365", "full_365"]);
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!url || !serviceKey) return response({ success: false, message: "Sunucu yapılandırması eksik." }, 500);

  const path = new URL(req.url);
  if (req.method === "GET" && path.pathname.endsWith("/health")) {
    return response({ success: true, service: "uzmantech-portal-api" });
  }

  if (req.method === "GET" && path.pathname.endsWith("/news")) {
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
    const query = String(path.searchParams.get("q") || "").trim();
    if (query.length < 2 || query.length > 100) return response({ success: false, error: "En az 2 karakterlik model adı girin." }, 400);
    try {
      const groups = await loadGlassCatalog();
      const matches = groups.filter(group => group.models.some(model => glassSearchMatches(model, query)))
        .map(group => ({ group: group.group, models: group.models }));
      return response({ success: true, groups: matches, source: "Simkon", cached: !!glassCatalogCache && Date.now()-glassCatalogCache.at >= 0 });
    } catch (error) {
      console.error("Glass compatibility lookup failed", error);
      return response({ success: false, error: "Cam uyumluluk kataloğu şu anda alınamıyor. Lütfen tekrar deneyin." }, 503);
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
    const categories = ["firmware", "eng", "imei", "test_point", "resistor"];
    const { data, error } = await db.from("archive_records").select("category,records").in("category", categories);
    if (error) return response({ success: false, message: "Son eklenen dosyalar yüklenemedi." }, 503);
    const recent: any[] = [];
    for (const row of data || []) {
      const records = Array.isArray(row.records) ? row.records : [];
      for (let i = records.length - 1; i >= Math.max(0, records.length - 8); i--) {
        const item = records[i];
        const d = Array.isArray(item) ? { brand:item[0], model:item[1], codename:item[2], description:item[3], link:item[4], version:item[5], android:item[6], region:item[7] } : item;
        recent.push({ category: row.category, data: archiveAccess ? d : scrubLinks(d) });
      }
    }
    recent.sort((a,b) => {
      const da = String(a.data?.updated_at || a.data?.created_at || a.data?.date || a.data?.description || "");
      const dbb = String(b.data?.updated_at || b.data?.created_at || b.data?.date || b.data?.description || "");
      return dbb.localeCompare(da);
    });
    return response({ success: true, member: archiveAccess, results: recent.slice(0, 8) });
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


  if (body.action === "support_ticket") {
    const member = await verifySession(tokenFrom(req), true);
    if (member?.role === "admin") return response({ success: false, message: "Yönetici hesapları ziyaretçi destek formunu kullanamaz." }, 403);
    const subject = String(body.subject || "").trim();
    const category = String(body.category || "other");
    const message = String(body.message || "").trim();
    const guestName = String(body.guest_name || "").trim();
    const guestEmail = String(body.guest_email || "").trim().toLowerCase();
    const allowedCategories = ["technical", "license", "payment", "archive", "other"];
    if (subject.length < 4 || subject.length > 120 || !allowedCategories.includes(category) || message.length < 20 || message.length > 4000) {
      return response({ success: false, message: "Konu, kategori veya mesaj alanını kontrol edin. Mesaj 20-4000 karakter olmalı." }, 400);
    }
    if (!member && (guestName.length < 2 || guestName.length > 100 || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(guestEmail) || guestEmail.length > 254)) {
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
    const { data, error } = await db.from("portal_support_tickets").update({
      status, admin_note: note || null, updated_at: now,
      resolved_at: status === "resolved" ? now : null,
      resolved_by: status === "resolved" ? admin.id : null,
    }).eq("id", ticketId).select("id,status,admin_note,updated_at,resolved_at").maybeSingle();
    if (error || !data) return response({ success: false, message: "Destek talebi güncellenemedi." }, 503);
    return response({ success: true, ticket: data, message: "Destek talebi güncellendi." });
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
    if (Number(ipCount.count || 0) >= 6 || Number(emailCount.count || 0) >= 3) {
      return response({ success: false, message: "Çok fazla kayıt denemesi yapıldı. Lütfen daha sonra tekrar deneyin." }, 429);
    }

    const { error: attemptError } = await db.from("portal_registration_attempts").insert({ email, ip_hash: ipHash });
    if (attemptError) {
      console.error("registration attempt log failed", attemptError);
      return response({ success: false, message: "Kayıt isteği şu anda alınamıyor." }, 503);
    }

    const [byUsername, byEmail, byPhone] = await Promise.all([
      db.from("users").select("id").eq("username", username).maybeSingle(),
      db.from("users").select("id").eq("email", email).maybeSingle(),
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

    const { error: verificationError } = await db.from("registration_verifications").upsert({
      username, email, phone, country_code: countryCode, language_code: languageCode,
      password_hash: passwordHash, code_hash: codeHash, expires_at: expiresAt,
      attempts: 0, created_at: now,
    }, { onConflict: "email" });
    if (verificationError) {
      console.error("portal registration verification upsert failed", verificationError);
      return response({ success: false, message: "Doğrulama isteği oluşturulamadı. Lütfen tekrar deneyin." }, 503);
    }

    const mailBody =
      "Merhaba " + username + ",\n\n" +
      "Uzmantech üyelik başvurunuzu tamamlamak için e-posta doğrulama kodunuz:\n\n" +
      "    " + code + "\n\n" +
      "Bu kod 10 dakika geçerlidir ve yalnızca bir kez kullanılabilir.\n\n" +
      "Bu işlemi siz başlatmadıysanız bu e-postayı dikkate almayın.\n\nUzmantech";
    const { error: mailError } = await queuePortalEmail(email, "Uzmantech - E-posta Doğrulama Kodu", mailBody);
    if (mailError) {
      await db.from("registration_verifications").delete().eq("email", email);
      console.error("portal registration email queue failed", mailError);
      return response({ success: false, message: "Doğrulama e-postası kuyruğa alınamadı. Lütfen tekrar deneyin." }, 503);
    }

    await db.from("portal_registration_attempts").delete().lt("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());
    return response({
      success: true,
      verification_required: true,
      email: maskEmail(email),
      message: "6 haneli doğrulama kodu e-posta adresinize gönderilmek üzere sıraya alındı.",
    }, 200);
  }

  if (body.action === "register_verify") {
    const email = String(body.email || "").trim().toLowerCase();
    const code = String(body.code || "").trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !/^\d{6}$/.test(code)) {
      return response({ success: false, message: "E-posta veya doğrulama kodu geçersiz." }, 400);
    }

    const { data: verification, error: verificationLookupError } = await db.from("registration_verifications")
      .select("id,username,email,phone,country_code,language_code,password_hash,code_hash,expires_at,attempts")
      .eq("email", email).maybeSingle();
    if (verificationLookupError || !verification) {
      return response({ success: false, message: "Kod geçersiz veya süresi dolmuş. Yeni kod isteyin." }, 400);
    }

    const attempts = Number(verification.attempts || 0);
    if (attempts >= 5) return response({ success: false, message: "Çok fazla hatalı deneme yapıldı. Yeni kod isteyin." }, 429);
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
      db.from("users").select("id").eq("email", verification.email).maybeSingle(),
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
      role: "user",
      status: "active",
      email_verified: true,
      expiry_date: null,
      license_plan: "none",
      license_days: 0,
      license_started_at: null,
      disabled_reason: null,
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
      message: "E-posta adresiniz doğrulandı. Hesabınız aktif edildi.",
      session_token: await signSession({ id: newUser.id, role: newUser.role }),
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
      .select("id,username,status,reset_code_sent_at").eq("email", email).maybeSingle();
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
      .eq("email", email).maybeSingle();
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
      .select("id,username,email,password_hash,role,status,disabled_reason,expiry_date,license_plan,license_days,license_started_at,country_code,language_code")
      .eq("username", identifier).maybeSingle();
    if (!result.data && !result.error) {
      result = await db.from("users")
        .select("id,username,email,password_hash,role,status,disabled_reason,expiry_date,license_plan,license_days,license_started_at,country_code,language_code")
        .eq("email", identifier.toLowerCase()).maybeSingle();
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
    const { data: taken } = await db.from("users").select("id").eq("email", email).maybeSingle();
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
    return response({ success: true, message: "Doğrulama kodu yeni e-posta adresinize gönderilmek üzere sıraya alındı." });
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
    const { data: taken } = await db.from("users").select("id").eq("email", pending.new_email).maybeSingle();
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
    return response({ success: true, result: data, message: status === "approved" ? "Ödeme onaylandı ve lisans süresi eklendi." : "Ödeme reddedildi." });
  }

  return response({ success: false, message: "Geçersiz işlem." }, 400);
});

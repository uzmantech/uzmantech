const PROTECTED_PATHS = new Set([
  "/imei-araclari.html",
  "/mediatek-temp-root.html",
  "/cam-uyumluluk.html",
  "/servis-takip.html",
]);
const API_BASE = "https://iutehccebzqnhqkevawz.supabase.co/functions/v1";
const PUBLISHABLE_KEY = "sb_publishable_T2ogx50EKeT1ST_m6Tszsw_joA5zLpB";
const PAID_PLANS = new Set(["weekly", "monthly", "half_year", "annual", "365", "full_365"]);

function sessionCookie(request) {
  const cookie = request.headers.get("Cookie") || "";
  const item = cookie.split(";").map(x => x.trim()).find(x => x.startsWith("uzmantech_edge_session="));
  if (!item) return "";
  try { return decodeURIComponent(item.slice("uzmantech_edge_session=".length)); }
  catch { return ""; }
}

function redirectToPackages(request) {
  const target = new URL("/paketler.html?required=1", request.url);
  return new Response(null, {
    status: 302,
    headers: {
      Location: target.toString(),
      "Cache-Control": "private, no-store",
      Vary: "Cookie",
    },
  });
}

function unavailable() {
  return new Response(
    "Üyelik erişimi şu anda doğrulanamıyor. Birkaç saniye sonra tekrar deneyin.",
    {
      status: 503,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "private, no-store",
        "Retry-After": "5",
        Vary: "Cookie",
      },
    },
  );
}

export async function onRequest(context) {
  const { request, next } = context;
  const pathname = new URL(request.url).pathname.toLowerCase();
  if (!PROTECTED_PATHS.has(pathname)) return next();

  const token = sessionCookie(request);
  if (!token) return redirectToPackages(request);

  let result;
  try {
    const response = await fetch(API_BASE + "/portal-api", {
      method: "POST",
      headers: {
        apikey: PUBLISHABLE_KEY,
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "session" }),
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 401 || response.status === 403) return redirectToPackages(request);
    if (!response.ok) return unavailable();
    result = await response.json();
  } catch {
    return unavailable();
  }

  const user = result?.success ? result.user : null;
  const entitled = !!user && (
    user.role === "admin" ||
    (user.status === "active" && user.license_status === "active" && !user.membership_expired && PAID_PLANS.has(String(user.license_plan || "").toLowerCase()))
  );
  if (!entitled) return redirectToPackages(request);

  const response = await next();
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "private, no-store");
  const vary = headers.get("Vary") || "";
  if (!vary.toLowerCase().split(",").map(x => x.trim()).includes("cookie")) {
    headers.set("Vary", vary ? vary + ", Cookie" : "Cookie");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

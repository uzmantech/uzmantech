(() => {
  const config = window.UZMANTECH_CONFIG || {};
  const token = () => { const saved = localStorage.getItem("uzmantech_web_session"); if(saved) return saved; const legacy = sessionStorage.getItem("uzmantech_web_session") || ""; if(legacy){ localStorage.setItem("uzmantech_web_session", legacy); sessionStorage.removeItem("uzmantech_web_session"); } return legacy; };
  async function call(path, options = {}) {
    if (!config.apiBaseUrl || !config.publishableKey) throw new Error("Portal bağlantısı yapılandırılmamış.");
    const response = await fetch(config.apiBaseUrl + path, {
      ...options,
      headers: {
        apikey: config.publishableKey,
        Authorization: "Bearer " + (token() || config.publishableKey),
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) throw new Error(data.message || "İşlem tamamlanamadı.");
    return data;
  }
  window.UzmantechAPI = Object.freeze({
    login: data => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "login", ...data }) }),
    register: data => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "register", ...data }) }),
    registerVerify: data => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "register_verify", ...data }) }),
    registerVerify: data => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "register_verify", ...data }) }),
    registerVerify: data => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "register_verify", ...data }) }),
    requestPasswordReset: data => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "password_reset_request", ...data }) }),
    confirmPasswordReset: data => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "password_reset_confirm", ...data }) }),
    session: () => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "session" }) }),
    accountProfile: () => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "account_profile" }) }),
    changePassword: data => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "account_password_change", ...data }) }),
    requestEmailChange: data => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "account_email_request", ...data }) }),
    confirmEmailChange: data => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "account_email_confirm", ...data }) }),
    archive: params => call("/portal-api/archive?" + new URLSearchParams(params || {})),
    catalog: () => call("/portal-api/catalog"),
    recent: () => call("/portal-api/recent"),
    news: params => call("/portal-api/news?" + new URLSearchParams(params || {})),
    admin: data => call("/rapid-service", { method: "POST", body: JSON.stringify(data) }),
    archiveAdmin: data => call("/archive-service", { method: "POST", body: JSON.stringify(data) }),
    archiveFiles: () => call("/archive-service?resource=files"),
    archiveFileDownload: id => call("/archive-service", { method: "POST", body: JSON.stringify({ action: "archive_file_download_url", id }) }),
    siteStats: () => call("/archive-service?resource=stats"),
    visitorPing: visitorId => call("/archive-service", { method: "POST", body: JSON.stringify({ action: "visitor_ping", visitor_id: visitorId }) }),
    portalAdmin: data => call("/portal-api", { method: "POST", body: JSON.stringify(data) }),
    exchangeRate: () => call("/portal-api/exchange-rate"),
    paymentReceipt: ({plan, amountUsd, amountTry, rate, payerName, file}) => {
      const params = new URLSearchParams({
        plan,
        amount_usd: String(amountUsd),
        amount_try: String(amountTry),
        rate: String(rate),
        payer_name: payerName
      });
      return call("/portal-api/payment-receipt?" + params.toString(), { method: "POST", body: file, headers: {"Content-Type": file.type} });
    },
    paymentHistory: () => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "payment_history" }) }),
    supportTicket: data => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "support_ticket", ...data }) }),
    supportHistory: () => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "support_history" }) }),
    supportList: () => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "support_list" }) }),
    supportUpdate: data => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "support_update", ...data }) }),
    setSession: value => { if(value){ localStorage.setItem("uzmantech_web_session", value); sessionStorage.removeItem("uzmantech_web_session"); } else { localStorage.removeItem("uzmantech_web_session"); sessionStorage.removeItem("uzmantech_web_session"); } },
    getToken: token
  });

  // Anonymous live visitor heartbeat. A browser is counted once while active.
  try {
    let visitorId = localStorage.getItem("uzmantech_visitor_id");
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      localStorage.setItem("uzmantech_visitor_id", visitorId);
    }
    const ping = () => {
      if (document.visibilityState === "visible") {
        window.UzmantechAPI.visitorPing(visitorId).catch(() => {});
      }
    };
    ping();
    window.setInterval(ping, 30000);
    document.addEventListener("visibilitychange", ping);
  } catch { /* Storage may be disabled; public pages remain usable. */ }
})();
(() => {
  const config = window.UZMANTECH_CONFIG || {};
  const token = () => sessionStorage.getItem("uzmantech_web_session") || "";
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
    session: () => call("/portal-api", { method: "POST", body: JSON.stringify({ action: "session" }) }),
    archive: params => call("/portal-api/archive?" + new URLSearchParams(params || {})),
    admin: data => call("/rapid-service", { method: "POST", body: JSON.stringify(data) }),
    portalAdmin: data => call("/portal-api", { method: "POST", body: JSON.stringify(data) }),
    paymentReceipt: ({plan, amount, payerName, file}) => {
      const params = new URLSearchParams({plan, amount: String(amount), payer_name: payerName});
      return call("/portal-api/payment-receipt?" + params.toString(), { method: "POST", body: file, headers: {"Content-Type": file.type} });
    },
    setSession: value => value ? sessionStorage.setItem("uzmantech_web_session", value) : sessionStorage.removeItem("uzmantech_web_session"),
    getToken: token
  });
})();
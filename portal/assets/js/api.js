/* API boundary for future server integration. UI code must not access Supabase tables directly. */
window.UzmantechAPI = (() => {
  const config = window.UZMANTECH_CONFIG || { mode: "demo", apiBaseUrl: "" };
  async function request(path, options = {}) {
    if (config.mode !== "live" || !config.apiBaseUrl) {
      throw new Error("Portal servis bağlantısı henüz etkin değil.");
    }
    const response = await fetch(config.apiBaseUrl.replace(/\/$/, "") + path, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      credentials: "include"
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || "İşlem tamamlanamadı.");
    return payload;
  }
  return Object.freeze({
    getSession: () => request("/session"),
    login: (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    register: (data) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    listArchive: (params = {}) => request("/archive?" + new URLSearchParams(params)),
    createPaymentNotice: (data) => request("/payments", { method: "POST", body: JSON.stringify(data) })
  });
})();
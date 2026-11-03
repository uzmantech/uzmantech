/* Public browser configuration only. Never place service_role keys or private secrets here. */
window.UZMANTECH_CONFIG = Object.freeze({
  mode: "demo",
  supabaseUrl: "",
  supabaseAnonKey: "",
  // The web portal will use its own server-verified session.
  // Desktop device-hash login must not be reused in the browser.
  apiBaseUrl: ""
});
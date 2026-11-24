import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Supabase environment variables are missing.");
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders,
  });
}

function validEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function base64Url(bytes: Uint8Array) {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

async function pbkdf2PasswordHash(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 310000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );

  return `pbkdf2_sha256$310000$${base64Url(salt)}$${base64Url(new Uint8Array(bits))}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ success: false, message: "Sadece POST destekleniyor." }, 405);
  }

  try {
    const body = await req.json();
    const action = String(body?.action ?? "");
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!validEmail(email)) {
      return json({ success: false, message: "Geçerli bir e-posta adresi girin." }, 400);
    }

    // ------------------------------------------------------------
    // 1) Kod oluşturma isteği
    // ------------------------------------------------------------
    if (action === "request") {
      const codeHash = String(body?.code_hash ?? "").trim().toLowerCase();

      if (!/^[a-f0-9]{64}$/.test(codeHash)) {
        return json({ success: false, message: "Geçersiz doğrulama isteği." }, 400);
      }

      const { data: user, error: lookupError } = await supabase
        .from("users")
        .select("id, status")
        .eq("email", email)
        .in("registration_channel", ["desktop_app", "unknown"])
        .maybeSingle();

      if (lookupError) {
        console.error("request lookup:", lookupError);
        return json({ success: false, message: "Sunucu hatası oluştu." }, 500);
      }

      if (!user || user.status === "disabled") {
        return json({ accepted: false, success: true });
      }

      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: updateError } = await supabase
        .from("users")
        .update({
          reset_code_hash: codeHash,
          reset_code_expires_at: expiresAt,
          reset_code_attempts: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("request update:", updateError);
        return json({ success: false, message: "Şifre sıfırlama isteği kaydedilemedi." }, 500);
      }

      return json({ accepted: true, success: true });
    }

    // ------------------------------------------------------------
    // 2) Kod + yeni şifre ile şifre değiştirme
    // ------------------------------------------------------------
    if (action === "reset") {
      const code = String(body?.code ?? "").trim();
      const newPassword = String(body?.new_password ?? "");

      if (!/^\d{6}$/.test(code)) {
        return json({ success: false, message: "Doğrulama kodu 6 haneli olmalıdır." }, 400);
      }

      if (newPassword.length < 6) {
        return json({ success: false, message: "Yeni şifre en az 6 karakter olmalıdır." }, 400);
      }

      console.log("reset: user lookup started");

      const { data: user, error: lookupError } = await supabase
        .from("users")
        .select(
          "id, status, reset_code_hash, reset_code_expires_at, reset_code_attempts",
        )
        .eq("email", email)
        .in("registration_channel", ["desktop_app", "unknown"])
        .maybeSingle();

      if (lookupError) {
        console.error("reset lookup:", lookupError);
        return json({ success: false, message: "Hesap bilgileri okunamadı." }, 500);
      }

      if (!user) {
        return json({ success: false, message: "Kod geçersiz veya süresi dolmuş." }, 400);
      }

      if (user.status === "disabled") {
        return json({ success: false, message: "Bu hesap devre dışı." }, 403);
      }

      const attempts = Number(user.reset_code_attempts ?? 0);

      if (attempts >= 5) {
        return json({
          success: false,
          message: "Çok fazla hatalı deneme yapıldı. Yeni bir kod isteyin.",
        }, 429);
      }

      const expiresAt = user.reset_code_expires_at
        ? new Date(user.reset_code_expires_at).getTime()
        : 0;

      if (!user.reset_code_hash || !expiresAt || expiresAt <= Date.now()) {
        return json({ success: false, message: "Kod geçersiz veya süresi dolmuş." }, 400);
      }

      console.log("reset: code verification started");

      const suppliedHash = await sha256Hex(code);
      const storedHash = String(user.reset_code_hash).trim().toLowerCase();

      if (!safeEqual(suppliedHash, storedHash)) {
        await supabase
          .from("users")
          .update({
            reset_code_attempts: attempts + 1,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        return json({ success: false, message: "Doğrulama kodu hatalı." }, 400);
      }

      console.log("reset: password hashing started");

      const passwordHash = await pbkdf2PasswordHash(newPassword);

      console.log("reset: database update started");

      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          password_hash: passwordHash,
          reset_code_hash: null,
          reset_code_expires_at: null,
          reset_code_attempts: 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select("id")
        .single();

      if (updateError) {
        console.error("reset database update:", updateError);
        return json({ success: false, message: "Yeni şifre veritabanına kaydedilemedi." }, 500);
      }

      if (!updatedUser?.id) {
        console.error("reset database update: no updated row");
        return json({ success: false, message: "Yeni şifre kaydedilemedi." }, 500);
      }

      console.log("reset: completed successfully");

      return json({
        success: true,
        message: "Şifreniz başarıyla güncellendi.",
      });
    }

    return json({ success: false, message: "Geçersiz işlem." }, 400);
  } catch (error) {
    console.error("password-reset fatal error:", error);
    return json({
      success: false,
      message: "Sunucu hatası oluştu.",
    }, 500);
  }
});

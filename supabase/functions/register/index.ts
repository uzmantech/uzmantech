import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

/* ============================================================
   TELEFON NUMARASI
   ============================================================ */

function normalizePhone(
  value: string,
  countryCode: string,
): string {
  const raw = String(value || "").trim();

  if (countryCode === "TR") {
    let digits = raw.replace(/\D/g, "");

    // +90 5XXXXXXXXX / 905XXXXXXXXX
    if (digits.startsWith("90") && digits.length === 12) {
      digits = "0" + digits.slice(2);
    }
    // 5XXXXXXXXX
    else if (digits.length === 10 && digits.startsWith("5")) {
      digits = "0" + digits;
    }

    return digits;
  }

  // Uluslararası numaralar
  let international = raw.replace(/[^\d+]/g, "");

  if (!international.startsWith("+")) {
    international = "+" + international;
  }

  return international;
}

/* ============================================================
   DİL
   ============================================================ */

function normalizeLanguage(
  value: string,
  acceptLanguage: string,
): string {
  const explicit = String(value || "")
    .trim()
    .toLowerCase();

  // Kullanıcı açıkça dil seçtiyse bunu kullan
  if (explicit === "en") {
    return "en";
  }

  if (explicit === "tr") {
    return "tr";
  }

  // Tarayıcı / uygulama dilini kontrol et
  const header = String(acceptLanguage || "").toLowerCase();

  const englishDetected =
    header.startsWith("en") ||
    header.includes(",en") ||
    header.includes("en-us") ||
    header.includes("en-gb") ||
    header.includes("en-ca") ||
    header.includes("en-au");

  if (englishDetected) {
    return "en";
  }

  return "tr";
}

/* ============================================================
   ÜLKE
   ============================================================ */

function normalizeCountry(
  value: string,
  phone: string,
): string {
  const explicit = String(value || "")
    .trim()
    .toUpperCase();

  // Kullanıcı ülkeyi açıkça gönderiyorsa onu kullan
  if (/^[A-Z]{2}$/.test(explicit)) {
    return explicit;
  }

  const normalizedPhone = String(phone || "")
    .replace(/\s/g, "");

  // Türkiye
  if (
    normalizedPhone.startsWith("+90") ||
    normalizedPhone.startsWith("0090") ||
    normalizedPhone.startsWith("90") ||
    normalizedPhone.startsWith("05")
  ) {
    return "TR";
  }

  // Amerika / Kanada
  if (normalizedPhone.startsWith("+1")) {
    return "US";
  }

  // İngiltere
  if (normalizedPhone.startsWith("+44")) {
    return "GB";
  }

  // Almanya
  if (normalizedPhone.startsWith("+49")) {
    return "DE";
  }

  // Fransa
  if (normalizedPhone.startsWith("+33")) {
    return "FR";
  }

  // Hollanda
  if (normalizedPhone.startsWith("+31")) {
    return "NL";
  }

  // Belçika
  if (normalizedPhone.startsWith("+32")) {
    return "BE";
  }

  // Avusturya
  if (normalizedPhone.startsWith("+43")) {
    return "AT";
  }

  // İsviçre
  if (normalizedPhone.startsWith("+41")) {
    return "CH";
  }

  // İtalya
  if (normalizedPhone.startsWith("+39")) {
    return "IT";
  }

  // İspanya
  if (normalizedPhone.startsWith("+34")) {
    return "ES";
  }

  // Suudi Arabistan
  if (normalizedPhone.startsWith("+966")) {
    return "SA";
  }

  // Birleşik Arap Emirlikleri
  if (normalizedPhone.startsWith("+971")) {
    return "AE";
  }

  // Azerbaycan
  if (normalizedPhone.startsWith("+994")) {
    return "AZ";
  }

  // Kıbrıs
  if (normalizedPhone.startsWith("+357")) {
    return "CY";
  }

  // Hiçbir şey algılanamazsa mevcut sistemin
  // varsayılanı Türkiye olarak kalır.
  return "TR";
}

/* ============================================================
   BASE64URL
   ============================================================ */

function base64url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/* ============================================================
   ŞİFRE HASH
   ============================================================ */

async function hashPassword(
  password: string,
): Promise<string> {
  const iterations = 310000;

  const salt = crypto.getRandomValues(
    new Uint8Array(16),
  );

  const key = await crypto.subtle.importKey(
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
      iterations,
      hash: "SHA-256",
    },
    key,
    256,
  );

  return `pbkdf2_sha256$${iterations}$${base64url(
    salt,
  )}$${base64url(new Uint8Array(bits))}`;
}

/* ============================================================
   REGISTER
   ============================================================ */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse(
      {
        success: false,
        message: "Sadece POST isteği kabul edilir.",
      },
      405,
    );
  }

  try {
    const body = await req.json();

    const username = String(
      body.username || "",
    ).trim();

    const email = String(
      body.email || "",
    )
      .trim()
      .toLowerCase();

    const requestedCountry = String(
      body.country_code ||
        body.country ||
        "",
    );

    const requestedLanguage = String(
      body.language_code ||
        body.language ||
        "",
    );

    const acceptLanguage =
      req.headers.get("accept-language") || "";

    const countryCode = normalizeCountry(
      requestedCountry,
      String(body.phone || ""),
    );

    const languageCode = normalizeLanguage(
      requestedLanguage,
      acceptLanguage,
    );

    const phone = normalizePhone(
      String(body.phone || ""),
      countryCode,
    );

    const password = String(
      body.password || "",
    );

    /* ========================================================
       TELEFON DOĞRULAMA
       ======================================================== */

    if (countryCode === "TR") {
      if (!/^05\d{9}$/.test(phone)) {
        return jsonResponse(
          {
            success: false,
            message:
              "Geçerli bir Türkiye cep telefonu numarası girin. Örnek: 05XXXXXXXXX",
          },
          400,
        );
      }
    } else {
      if (!/^\+\d{7,15}$/.test(phone)) {
        return jsonResponse(
          {
            success: false,
            message:
              "Geçerli bir uluslararası telefon numarası girin.",
          },
          400,
        );
      }
    }

    /* ========================================================
       E-POSTA
       ======================================================== */

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ||
      email.length > 254
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Geçerli bir e-posta adresi girin.",
        },
        400,
      );
    }

    /* ========================================================
       ZORUNLU ALANLAR
       ======================================================== */

    if (
      !username ||
      !email ||
      !phone ||
      !password
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Kullanıcı adı, e-posta, telefon ve şifre zorunludur.",
        },
        400,
      );
    }

    if (password.length < 6) {
      return jsonResponse(
        {
          success: false,
          message:
            "Şifre en az 6 karakter olmalıdır.",
        },
        400,
      );
    }

    /* ========================================================
       SUPABASE
       ======================================================== */

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const serviceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY",
      );

    if (
      !supabaseUrl ||
      !serviceRoleKey
    ) {
      return jsonResponse(
        {
          success: false,
          message:
            "Sunucu yapılandırması eksik.",
        },
        500,
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
    );

    /* ========================================================
       E-POSTA DOĞRULAMA
       ======================================================== */

    if (
      body.action ===
      "request_verification"
    ) {
      const codeHash = String(
        body.code_hash || "",
      )
        .trim()
        .toLowerCase();

      if (
        !/^[a-f0-9]{64}$/.test(
          codeHash,
        )
      ) {
        return jsonResponse(
          {
            success: false,
            message:
              "Geçersiz doğrulama kodu.",
          },
          400,
        );
      }

      if (
        !username ||
        !email ||
        !phone ||
        !password
      ) {
        return jsonResponse(
          {
            success: false,
            message:
              "Kayıt bilgileri eksik.",
          },
          400,
        );
      }

      if (password.length < 6) {
        return jsonResponse(
          {
            success: false,
            message:
              "Şifre en az 6 karakter olmalıdır.",
          },
          400,
        );
      }

      /* ======================================================
         MEVCUT KULLANICI KONTROLÜ
         ====================================================== */

      const [
        { data: existingUsername },
        { data: existingEmail },
        { data: existingPhone },
      ] = await Promise.all([
        supabase
          .from("users")
          .select("id")
          .eq("username", username)
          .maybeSingle(),

        supabase
          .from("users")
          .select("id")
          .eq("email", email)
          .in("registration_channel", ["desktop_app", "unknown"])
          .maybeSingle(),

        supabase
          .from("users")
          .select("id")
          .eq("phone", phone)
          .in("registration_channel", ["desktop_app", "unknown"])
          .maybeSingle(),
      ]);

      if (existingUsername) {
        return jsonResponse(
          {
            success: false,
            message:
              "Bu kullanıcı adı zaten kullanılıyor.",
          },
          409,
        );
      }

      if (existingEmail) {
        return jsonResponse(
          {
            success: false,
            message:
              "Bu e-posta adresi zaten kullanılıyor.",
          },
          409,
        );
      }

      if (existingPhone) {
        return jsonResponse(
          {
            success: false,
            message:
              "Bu telefon numarası zaten kayıtlı.",
          },
          409,
        );
      }

      /* ======================================================
         ŞİFRE HASH
         ====================================================== */

      const passwordHash =
        await hashPassword(
          password,
        );

      const expiresAt =
        new Date(
          Date.now() +
            10 * 60 * 1000,
        ).toISOString();

      /* ======================================================
         DOĞRULAMA KAYDI
         ====================================================== */

      const {
        error: verificationError,
      } = await supabase
        .from(
          "registration_verifications",
        )
        .upsert(
          {
            username,
            email,
            phone,
            registration_channel: "desktop_app",

            // YENİ
            country_code:
              countryCode,

            // YENİ
            language_code:
              languageCode,

            password_hash:
              passwordHash,

            code_hash:
              codeHash,

            expires_at:
              expiresAt,

            attempts: 0,

            created_at:
              new Date().toISOString(),
          },
          {
            onConflict:
              "registration_channel,email",
          },
        );

      if (verificationError) {
        console.error(
          "Registration verification create:",
          verificationError,
        );

        return jsonResponse(
          {
            success: false,
            message:
              "E-posta doğrulama isteği oluşturulamadı.",
          },
          500,
        );
      }

      return jsonResponse({
        success: true,
        verification_required:
          true,

        // Uygulamanın kayıt sırasında
        // hangi dili/ülkeyi belirlediğini
        // görmesi için geri döndürüyoruz.
        country_code:
          countryCode,

        language_code:
          languageCode,

        message:
          "Doğrulama kodu gönderilmeye hazır.",
      });
    }

    /* ========================================================
       E-POSTA DOĞRULAMA
       ======================================================== */

    if (
      body.action ===
      "verify_email"
    ) {
      const verifyCode = String(
        body.code || "",
      ).trim();

      if (!/^\d{6}$/.test(
        verifyCode,
      )) {
        return jsonResponse(
          {
            success: false,
            message:
              "Doğrulama kodu 6 haneli olmalıdır.",
          },
          400,
        );
      }

      if (!email) {
        return jsonResponse(
          {
            success: false,
            message:
              "E-posta adresi gerekli.",
          },
          400,
        );
      }

      /* ======================================================
         DOĞRULAMA KAYDINI GETİR
         ====================================================== */

      const {
        data: verification,
        error:
          verificationLookupError,
      } = await supabase
        .from(
          "registration_verifications",
        )
        .select(`
          id,
          username,
          email,
          phone,
          country_code,
          language_code,
          password_hash,
          code_hash,
          expires_at,
          attempts
        `)
        .eq("email", email)
        .eq("registration_channel", "desktop_app")
        .maybeSingle();

      if (
        verificationLookupError ||
        !verification
      ) {
        return jsonResponse(
          {
            success: false,
            message:
              "Doğrulama kodu bulunamadı. Yeni kod isteyin.",
          },
          400,
        );
      }

      /* ======================================================
         DENEME SAYISI
         ====================================================== */

      const attempts = Number(
        verification.attempts || 0,
      );

      if (attempts >= 5) {
        return jsonResponse(
          {
            success: false,
            message:
              "Çok fazla hatalı deneme yapıldı. Yeni doğrulama kodu isteyin.",
          },
          429,
        );
      }

      /* ======================================================
         SÜRE KONTROLÜ
         ====================================================== */

      if (
        new Date(
          verification.expires_at,
        ).getTime() <= Date.now()
      ) {
        await supabase
          .from(
            "registration_verifications",
          )
          .delete()
          .eq(
            "id",
            verification.id,
          );

        return jsonResponse(
          {
            success: false,
            message:
              "Doğrulama kodunun süresi doldu. Yeni kod isteyin.",
          },
          400,
        );
      }

      /* ======================================================
         KOD HASH
         ====================================================== */

      const suppliedHash =
        await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(
            verifyCode,
          ),
        );

      const suppliedHex =
        Array.from(
          new Uint8Array(
            suppliedHash,
          ),
        )
          .map((b) =>
            b.toString(16)
              .padStart(2, "0"),
          )
          .join("");

      if (
        suppliedHex !==
        String(
          verification.code_hash,
        ).toLowerCase()
      ) {
        await supabase
          .from(
            "registration_verifications",
          )
          .update({
            attempts:
              attempts + 1,
          })
          .eq(
            "id",
            verification.id,
          );

        return jsonResponse(
          {
            success: false,
            message:
              "Doğrulama kodu hatalı.",
          },
          400,
        );
      }

      /* ======================================================
         TEKRAR KULLANICI KONTROLÜ
         ====================================================== */

      const [
        { data: existingUsername },
        { data: existingEmail },
        { data: existingPhone },
      ] = await Promise.all([
        supabase
          .from("users")
          .select("id")
          .eq(
            "username",
            verification.username,
          )
          .maybeSingle(),

        supabase
          .from("users")
          .select("id")
          .eq(
            "email",
            verification.email,
          )
          .in("registration_channel", ["desktop_app", "unknown"])
          .maybeSingle(),

        supabase
          .from("users")
          .select("id")
          .eq(
            "phone",
            verification.phone,
          )
          .maybeSingle(),
      ]);

      if (
        existingUsername ||
        existingEmail ||
        existingPhone
      ) {
        await supabase
          .from(
            "registration_verifications",
          )
          .delete()
          .eq(
            "id",
            verification.id,
          );

        return jsonResponse(
          {
            success: false,
            message:
              "Bu kullanıcı adı, e-posta veya telefon numarası artık kullanılıyor.",
          },
          409,
        );
      }

      /* ======================================================
         GERÇEK KULLANICI KAYDI
         ====================================================== */

      const {
        data,
        error,
      } = await supabase
        .from("users")
        .insert({
          username:
            verification.username,

          email:
            verification.email,

          phone:
            verification.phone,
          registration_channel: "desktop_app",

          // YENİ
          country_code:
            verification.country_code ||
            "TR",

          // YENİ
          language_code:
            verification.language_code ||
            "tr",

          password_hash:
            verification.password_hash,

          role: "user",

          status: "pending",

          created_at:
            new Date().toISOString(),

          expiry_date: null,

          last_login: null,

          updated_at:
            new Date().toISOString(),
        })
        .select(`
          id,
          username,
          email,
          phone,
          country_code,
          language_code,
          role,
          status,
          created_at,
          expiry_date,
          last_login,
          updated_at
        `)
        .single();

      if (error) {
        console.error(
          "Verified registration insert:",
          error,
        );

        if (
          error.code ===
          "23505"
        ) {
          return jsonResponse(
            {
              success: false,
              message:
                "Bu kullanıcı adı, e-posta veya telefon numarası zaten kayıtlı.",
            },
            409,
          );
        }

        return jsonResponse(
          {
            success: false,
            message:
              "Kayıt oluşturulamadı.",
          },
          500,
        );
      }

      /* ======================================================
         GEÇİCİ DOĞRULAMA KAYDINI SİL
         ====================================================== */

      await supabase
        .from(
          "registration_verifications",
        )
        .delete()
        .eq(
          "id",
          verification.id,
        );

      /* ======================================================
         BAŞARILI
         ====================================================== */

      return jsonResponse({
        success: true,

        message:
          "E-posta doğrulandı. Kayıt başarıyla oluşturuldu. Admin onayı bekliyor.",

        user: data,
      });
    }

    /* ========================================================
       DOĞRULAMA KODU OLMADAN DOĞRUDAN KAYIT YOK
       ======================================================== */

    return jsonResponse(
      {
        success: false,
        verification_required:
          true,
        message:
          "E-posta doğrulaması zorunludur. Önce doğrulama kodu isteyin.",
      },
      400,
    );

  } catch (error) {
    console.error(
      "Register error:",
      error,
    );

    return jsonResponse(
      {
        success: false,
        message:
          "Kayıt işlemi sırasında bir hata oluştu.",
      },
      500,
    );
  }
});
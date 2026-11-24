import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

function base64urlDecode(
  value: string,
): Uint8Array {
  let s = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  while (s.length % 4) {
    s += "=";
  }

  const binary = atob(s);

  return Uint8Array.from(
    binary,
    (c) => c.charCodeAt(0),
  );
}

function safeEqual(
  a: Uint8Array,
  b: Uint8Array,
): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let diff = 0;

  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }

  return diff === 0;
}

async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  try {
    const parts = String(
      storedHash || "",
    ).split("$");

    if (
      parts.length !== 4 ||
      parts[0] !== "pbkdf2_sha256"
    ) {
      return false;
    }

    const iterations = Number(parts[1]);

    if (
      !Number.isInteger(iterations) ||
      iterations < 100000
    ) {
      return false;
    }

    const salt = base64urlDecode(
      parts[2],
    );

    const expected =
      base64urlDecode(parts[3]);

    const key =
      await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(
          password,
        ),
        "PBKDF2",
        false,
        ["deriveBits"],
      );

    const bits =
      await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt,
          iterations,
          hash: "SHA-256",
        },
        key,
        expected.length * 8,
      );

    return safeEqual(
      new Uint8Array(bits),
      expected,
    );
  } catch {
    return false;
  }
}

/* ============================================================
   ADMIN SESSION
   ============================================================ */

async function createAdminSession(
  userId: string,
): Promise<string | null> {
  const secret = Deno.env.get(
    "ADMIN_SESSION_SECRET",
  );

  if (!secret) {
    return null;
  }

  const payload = {
    sub: userId,
    role: "admin",
    exp:
      Math.floor(Date.now() / 1000) +
      12 * 60 * 60,
  };

  const payloadPart = base64url(
    new TextEncoder().encode(
      JSON.stringify(payload),
    ),
  );

  const key =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256",
      },
      false,
      ["sign"],
    );

  const signature =
    new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(
          payloadPart,
        ),
      ),
    );

  return `${payloadPart}.${base64url(
    signature,
  )}`;
}

/* ============================================================
   RESPONSE
   ============================================================ */

function jsonResponse(
  body: unknown,
  status = 200,
): Response {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          "application/json",
      },
    },
  );
}

/* ============================================================
   LOGIN
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
        message:
          "Sadece POST isteği kabul edilir.",
      },
      405,
    );
  }

  try {
    const body = await req.json();

    const username = String(
      body.username || "",
    ).trim();

    const password = String(
      body.password ?? "",
    );

    const deviceHash = String(
      body.device_hash ?? "",
    ).trim();

    /* ========================================================
       DEVICE HASH
       ======================================================== */

    if (
      !/^[a-f0-9]{64}$/i.test(
        deviceHash,
      )
    ) {
      return jsonResponse(
        {
          success: false,
          status: "device_required",
          message:
            "Cihaz kimliği alınamadı. Uygulamayı yeniden başlatın.",
        },
        400,
      );
    }

    /* ========================================================
       CREDENTIALS
       ======================================================== */

    if (!username || !password) {
      return jsonResponse(
        {
          success: false,
          status:
            "invalid_credentials",
          message:
            "Kullanıcı adı ve şifre zorunludur.",
        },
        400,
      );
    }

    /* ========================================================
       SUPABASE
       ======================================================== */

    const supabaseUrl =
      Deno.env.get(
        "SUPABASE_URL",
      );

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

    const supabase =
      createClient(
        supabaseUrl,
        serviceRoleKey,
      );

    /* ========================================================
       KULLANICIYI GETİR
       ======================================================== */

    const {
      data: user,
      error,
    } = await supabase
      .from("users")
      .select(`
        id,
        username,
        email,
        phone,

        country_code,
        language_code,

        password_hash,
        role,
        status,
        created_at,
        expiry_date,
        license_plan,
        license_days,
        license_started_at,
        last_login,
        updated_at,
        device_hash,
        device_bound_at,
        registration_channel
      `)
      .eq(
        "username",
        username,
      )
      .in("registration_channel", ["desktop_app", "unknown"])
      .maybeSingle();

    if (error) {
      console.error(
        "Login user lookup:",
        error,
      );

      return jsonResponse(
        {
          success: false,
          message:
            "Kullanıcı bilgisi alınamadı.",
        },
        500,
      );
    }

    if (!user) {
      return jsonResponse(
        {
          success: false,
          status:
            "invalid_credentials",
          message:
            "Kullanıcı adı veya şifre hatalı.",
        },
        401,
      );
    }

    /* ========================================================
       ŞİFRE
       ======================================================== */

    const passwordValid =
      await verifyPassword(
        password,
        String(
          user.password_hash || "",
        ),
      );

    if (!passwordValid) {
      return jsonResponse(
        {
          success: false,
          status:
            "invalid_credentials",
          message:
            "Kullanıcı adı veya şifre hatalı.",
        },
        401,
      );
    }

    /* ========================================================
       SÜRE KONTROLÜ
       ======================================================== */

    const now = new Date();

    if (
      user.expiry_date &&
      new Date(
        user.expiry_date,
      ).getTime() <=
        now.getTime()
    ) {
      await supabase
        .from("users")
        .update({
          status: "disabled",
          updated_at:
            now.toISOString(),
        })
        .eq(
          "id",
          user.id,
        );

      return jsonResponse(
        {
          success: false,
          status: "expired",
          message:
            "Üyelik süreniz dolmuştur. Hesabınız pasif duruma getirildi.",
        },
        403,
      );
    }

    /* ========================================================
       PENDING
       ======================================================== */

    if (
      user.status === "pending"
    ) {
      return jsonResponse(
        {
          success: false,
          status: "pending",
          message:
            "Hesabınız henüz admin tarafından onaylanmadı.",
        },
        403,
      );
    }

    /* ========================================================
       DISABLED
       ======================================================== */

    if (
      user.status !== "active"
    ) {
      return jsonResponse(
        {
          success: false,
          status: "disabled",
          message:
            "Hesabınız pasif durumdadır.",
        },
        403,
      );
    }

    /* ========================================================
       ADMIN
       ======================================================== */

    if (
      user.role === "admin"
    ) {
      const {
        data: adminUser,
        error:
          adminUpdateError,
      } = await supabase
        .from("users")
        .update({
          last_login:
            now.toISOString(),

          updated_at:
            now.toISOString(),
        })
        .eq(
          "id",
          user.id,
        )
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
          license_plan,
          license_days,
          license_started_at,
          last_login,
          updated_at,
          device_hash,
          device_bound_at
        `)
        .single();

      if (adminUpdateError) {
        return jsonResponse(
          {
            success: false,
            message:
              "Giriş bilgisi güncellenemedi.",
          },
          500,
        );
      }

      const sessionToken =
        await createAdminSession(
          user.id,
        );

      if (!sessionToken) {
        return jsonResponse(
          {
            success: false,
            message:
              "Admin oturumu oluşturulamadı.",
          },
          500,
        );
      }

      return jsonResponse({
        success: true,
        message:
          "Giriş başarılı.",

        /*
         * DİL BİLGİSİ ARTIK LOGIN
         * CEVABINDA DA VAR.
         */
        country_code:
          adminUser.country_code ||
          "TR",

        language_code:
          adminUser.language_code ||
          "tr",

        user: adminUser,

        session_token:
          sessionToken,
      });
    }

    /* ========================================================
       AKTİF LİSANS ZORUNLULUĞU
       Admin kullanıcıları yukarıda ayrı oturumla döner. Normal kullanıcılar
       yalnızca onaylanmış, geçerli ve süresi devam eden pakete sahip ise
       masaüstü uygulamasına girebilir. Lisansı olmayan hesabı disabled yapma;
       kullanıcı web hesabından ödeme/dekont sürecini tamamlayabilsin.
       ======================================================== */

    const licensePlan = String(user.license_plan ?? "").trim().toLowerCase();
    const licenseDays = Number(user.license_days ?? 0);
    const expiryTimestamp = user.expiry_date
      ? new Date(user.expiry_date).getTime()
      : Number.NaN;

    if (
      !licensePlan ||
      licensePlan === "none" ||
      !Number.isFinite(licenseDays) ||
      licenseDays <= 0 ||
      !Number.isFinite(expiryTimestamp) ||
      expiryTimestamp <= now.getTime()
    ) {
      return jsonResponse(
        {
          success: false,
          status: "no_license",
          message:
            "Hesabınızda onaylanmış ve süresi devam eden bir paket bulunmuyor. Web hesabınızdan ödeme bildirimi oluşturup dekontunuzu yükleyin. Yönetici onayından sonra lisansınız aktif olur.",
        },
        403,
      );
    }

    /* ========================================================
       DEVICE KONTROLÜ
       ======================================================== */

    const boundDeviceHash =
      String(
        user.device_hash || "",
      ).trim();

    if (
      boundDeviceHash &&
      boundDeviceHash !==
        deviceHash
    ) {
      const {
        data: blockedDevice,
      } = await supabase
        .from("user_devices")
        .select(
          "blocked_until",
        )
        .eq(
          "user_id",
          user.id,
        )
        .eq(
          "device_hash",
          deviceHash,
        )
        .maybeSingle();

      if (
        blockedDevice?.blocked_until &&
        new Date(
          blockedDevice.blocked_until,
        ).getTime() >
          now.getTime()
      ) {
        return jsonResponse(
          {
            success: false,
            status:
              "device_blocked",

            blocked_until:
              blockedDevice.blocked_until,

            message:
              "Bu bilgisayardan giriş geçici olarak engellendi. 72 saat sonra tekrar deneyin.",
          },
          403,
        );
      }

      const blockedUntil =
        new Date(
          now.getTime() +
            72 *
              60 *
              60 *
              1000,
        );

      await supabase
        .from("user_devices")
        .upsert(
          {
            user_id:
              user.id,

            device_hash:
              deviceHash,

            blocked_until:
              blockedUntil.toISOString(),

            last_attempt_at:
              now.toISOString(),
          },
          {
            onConflict:
              "user_id,device_hash",
          },
        );

      return jsonResponse(
        {
          success: false,
          status:
            "device_blocked",

          blocked_until:
            blockedUntil.toISOString(),

          message:
            "Bu hesap başka bir bilgisayara bağlıdır. Bu bilgisayardan giriş 72 saat süreyle engellendi.",
        },
        403,
      );
    }

    /* ========================================================
       İLK CİHAZ BAĞLAMA
       ======================================================== */

    if (!boundDeviceHash) {
      const {
        error: bindError,
      } = await supabase
        .from("users")
        .update({
          device_hash:
            deviceHash,

          device_bound_at:
            now.toISOString(),

          updated_at:
            now.toISOString(),
        })
        .eq(
          "id",
          user.id,
        );

      if (bindError) {
        return jsonResponse(
          {
            success: false,
            status:
              "device_error",
            message:
              "Bu bilgisayar hesaba bağlanamadı.",
          },
          500,
        );
      }
    }

    /* ========================================================
       SON LOGIN BİLGİSİNİ GÜNCELLE
       ======================================================== */

    const {
      data: updatedUser,
      error: updateError,
    } = await supabase
      .from("users")
      .update({
        last_login:
          now.toISOString(),

        updated_at:
          now.toISOString(),
      })
      .eq(
        "id",
        user.id,
      )
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
        license_plan,
        license_days,
        license_started_at,
        last_login,
        updated_at,
        device_hash,
        device_bound_at
      `)
      .single();

    if (updateError) {
      return jsonResponse(
        {
          success: false,
          message:
            "Giriş bilgisi güncellenemedi.",
        },
        500,
      );
    }

    /* ========================================================
       SESSION
       ======================================================== */

    let sessionToken:
      | string
      | null = null;

    if (
      updatedUser.role ===
      "admin"
    ) {
      sessionToken =
        await createAdminSession(
          updatedUser.id,
        );

      if (!sessionToken) {
        return jsonResponse(
          {
            success: false,
            message:
              "Admin oturumu oluşturulamadı.",
          },
          500,
        );
      }
    }

    /* ========================================================
       BAŞARILI LOGIN
       ======================================================== */

    return jsonResponse({
      success: true,

      message:
        "Giriş başarılı.",

      /*
       * UYGULAMANIN DİLİ BURADAN
       * BELİRLENEBİLECEK.
       */

      country_code:
        updatedUser.country_code ||
        "TR",

      language_code:
        updatedUser.language_code ||
        "tr",

      user: updatedUser,

      ...(sessionToken
        ? {
            session_token:
              sessionToken,
          }
        : {}),
    });

  } catch (error) {
    console.error(
      "Login error:",
      error,
    );

    return jsonResponse(
      {
        success: false,
        message:
          "Giriş işlemi sırasında bir hata oluştu.",
      },
      500,
    );
  }
});
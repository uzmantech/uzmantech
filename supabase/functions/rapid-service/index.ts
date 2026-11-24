import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function base64urlDecode(input: string): Uint8Array {
  let value = input.replace(/-/g, "+").replace(/_/g, "/");
  while (value.length % 4) value += "=";
  const binary = atob(value);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function verifyAdminToken(token: string): Promise<any | null> {
  try {
    const secret = Deno.env.get("ADMIN_SESSION_SECRET");
    if (!secret || !token) return null;

    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const payloadPart = parts[0];
    const signaturePart = parts[1];

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const expectedSignature = new Uint8Array(
      await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(payloadPart)
      )
    );

    const actualSignature = base64urlDecode(signaturePart);

    if (expectedSignature.length !== actualSignature.length) return null;

    let difference = 0;
    for (let i = 0; i < expectedSignature.length; i++) {
      difference |= expectedSignature[i] ^ actualSignature[i];
    }
    if (difference !== 0) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(base64urlDecode(payloadPart))
    );

    if (!payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.role !== "admin") return null;

    return payload;
  } catch (error) {
    console.error("Token doğrulama hatası:", error);
    return null;
  }
}

async function notifyPortalUser(req: Request, userId: string, event: string, days = 0): Promise<{ sent: boolean; message: string }> {
  const baseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const authorization = req.headers.get("authorization") || "";
  if (!baseUrl || !serviceKey || !authorization) return { sent: false, message: "E-posta bildirimi için sunucu bağlantısı eksik." };
  try {
    const result = await fetch(baseUrl + "/functions/v1/portal-api", {
      method: "POST",
      headers: { "Authorization": authorization, "apikey": serviceKey, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "admin_notification", user_id: userId, event, days }),
      signal: AbortSignal.timeout(25000),
    });
    const payload = await result.json().catch(() => ({}));
    return { sent: result.ok && payload.success === true && payload.email_sent === true, message: String(payload.message || "E-posta bildirimi gönderilemedi.") };
  } catch (error) {
    console.error("Admin notification bridge failed", error);
    return { sent: false, message: "E-posta bildirim servisine ulaşılamadı." };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Sadece POST isteği kabul edilir.",
      }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await req.json();
    const action = String(body.action || "").trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    /*
     * UZMANTECH UYGULAMA GÜNCELLEME KONTROLÜ
     *
     * Bu işlem admin oturumu gerektirmez.
     * Böylece normal kullanıcı da yeni sürüm kontrolü yapabilir.
     */
    if (action === "check_update") {
      const { data, error } = await supabase
        .from("app_updates")
        .select(
          "version, download_url, mandatory, release_notes, created_at"
        )
        .eq("app_name", "Uzmantech")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Güncelleme kontrol hatası:", error);

        return new Response(
          JSON.stringify({
            success: false,
            message: "Güncelleme bilgisi alınamadı.",
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          update: data || null,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    /*
     * ADMIN İŞLEMLERİ
     */
    const authorization = req.headers.get("Authorization") || "";

    if (!authorization.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Yetkilendirme bilgisi bulunamadı.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const token = authorization.substring(7);
    const adminSession = await verifyAdminToken(token);

    if (!adminSession) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Geçersiz veya süresi dolmuş admin oturumu.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    /*
     * Token imzası geçerli olsa bile hesabın güncel durumunu veritabanından doğrula.
     */
    const { data: currentAdmin, error: currentAdminError } =
      await supabase
        .from("users")
        .select("id, username, role, status")
        .eq("id", adminSession.sub)
        .maybeSingle();

    if (currentAdminError || !currentAdmin) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Admin hesabı doğrulanamadı.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (
      currentAdmin.role !== "admin" ||
      currentAdmin.status !== "active"
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Admin hesabınız aktif değil.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const adminUsername = String(currentAdmin.username || "uzmantech");
    async function writeAdminAudit(actionName: string, targetUserId: string | null, details: string) {
      try { await supabase.from("activity_logs").insert({user_id:adminSession.sub,username:adminUsername,action:actionName,category:"admin",item_name:targetUserId||"",result:"success",details:String(details||"").slice(0,1000),device_hash:"",app_version:"admin-web-v3"}); } catch(e){ console.error("Admin audit log hatası:",e); }
    }

    if (action === "analytics_dashboard") {
      const now=new Date(),since=new Date(now.getTime()-90*86400000).toISOString();
      const [{data:users,error:ue},{data:logs,error:le},{data:payments},{data:presence}]=await Promise.all([
        supabase.from("users").select("id,username,role,status,license_plan,created_at,last_login,expiry_date,acquisition_source,acquisition_medium,acquisition_campaign").order("created_at",{ascending:false}).limit(1000),
        supabase.from("activity_logs").select("id,user_id,username,created_at,category,action,item_name,result,app_version").gte("created_at",since).order("created_at",{ascending:false}).range(0,9999),
        supabase.from("portal_payment_notices").select("id,user_id,plan,status,created_at").gte("created_at",since).limit(1000),
        supabase.from("site_presence").select("visitor_id,last_seen").gte("last_seen",new Date(now.getTime()-86400000).toISOString()).limit(5000)
      ]);
      if(ue||le)return new Response(JSON.stringify({success:false,message:"Analiz verileri alınamadı."}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}});
      const allUsers=users||[],allLogs=logs||[],customerUsers=allUsers.filter((u:any)=>u.role!=="admin"),byId=new Map(allUsers.map((u:any)=>[String(u.id),u]));
      const customerLogs=allLogs.filter((l:any)=>byId.get(String(l.user_id))?.role!=="admin"&&!!byId.get(String(l.user_id)));
      const activity=new Map<string,any>(),daily=Array.from({length:30},(_,i)=>{const d=new Date(now);d.setUTCDate(d.getUTCDate()-(29-i));return {date:d.toISOString().slice(0,10),events:0,users:new Set<string>()};}),dayMap=new Map(daily.map((d:any)=>[d.date,d]));
      const dateKey=(v:any)=>new Date(v).toISOString().slice(0,10);
      for(const l of customerLogs){const id=String(l.user_id);let a=activity.get(id);if(!a){a={events:0,days:new Set<string>(),last:l.created_at,features:new Set<string>()};activity.set(id,a);}a.events++;a.days.add(dateKey(l.created_at));a.features.add(String(l.item_name||l.category||"Diğer"));const d=dayMap.get(dateKey(l.created_at));if(d){d.events++;d.users.add(id);}}
      const nowMs=now.getTime(),d7=nowMs-7*86400000,d30=nowMs-30*86400000;
      const activeSince=(ms:number)=>new Set(customerLogs.filter((l:any)=>new Date(l.created_at).getTime()>=ms).map((l:any)=>String(l.user_id))).size;
      const isPaid=(u:any)=>u.status==="active"&&!!u.license_plan&&u.license_plan!=="none"&&!String(u.license_plan).startsWith("trial");
      const enriched=customerUsers.map((u:any)=>{const a=activity.get(String(u.id))||{events:0,days:new Set(),last:null,features:new Set()};return {username:u.username,status:u.status,license_plan:u.license_plan,registered_at:u.created_at,last_login:u.last_login,last_activity:a.last,events_90d:a.events,active_days_90d:a.days.size,features:Array.from(a.features).slice(0,10),acquisition_source:u.acquisition_source||"unknown",acquisition_campaign:u.acquisition_campaign};}).sort((a:any,b:any)=>b.events_90d-a.events_90d);
      const featureMap=new Map<string,number>();for(const l of customerLogs){const n=String(l.item_name||l.category||"Diğer").trim()||"Diğer";featureMap.set(n,(featureMap.get(n)||0)+1);}
      const sourceMap=new Map<string,number>();for(const u of customerUsers){const n=String(u.acquisition_source||"unknown");sourceMap.set(n,(sourceMap.get(n)||0)+1);}
      const pay=payments||[];
      return new Response(JSON.stringify({success:true,generated_at:now.toISOString(),summary:{registered_total:customerUsers.length,registered_30d:customerUsers.filter((u:any)=>new Date(u.created_at).getTime()>=d30).length,active_7d:activeSince(d7),active_30d:activeSince(d30),active_90d:activity.size,paid_active:customerUsers.filter(isPaid).length,trial_accounts:customerUsers.filter((u:any)=>String(u.license_plan||"").startsWith("trial")).length,never_tracked:customerUsers.filter((u:any)=>!activity.has(String(u.id))).length,events_90d:customerLogs.length,visitors_24h:(presence||[]).length,payment_notices_90d:pay.length,payments_approved_90d:pay.filter((p:any)=>p.status==="approved").length},daily:daily.map((d:any)=>({date:d.date,events:d.events,users:d.users.size})),features:Array.from(featureMap.entries()).map(([name,events])=>({name,events})).sort((a:any,b:any)=>b.events-a.events).slice(0,15),sources:Array.from(sourceMap.entries()).map(([source,count])=>({source,count})).sort((a:any,b:any)=>b.count-a.count),users:enriched,payment_status:{pending:pay.filter((p:any)=>p.status==="pending").length,approved:pay.filter((p:any)=>p.status==="approved").length,rejected:pay.filter((p:any)=>p.status==="rejected").length},notes:{activity:"Müşteri etkinlikleri activity_logs üzerinden; yönetici hesapları hariç.",visitors:"24 saatlik değer site_presence heartbeat kayıtlarıdır; anonim ziyaretçi geçmişi henüz tutulmuyor.",paid:"Aktif ve trial_7/none dışında lisans planı olan hesaplar ücretli sayılır."}}),{status:200,headers:{...corsHeaders,"Content-Type":"application/json","Cache-Control":"no-store"}});
    }
    if (action === "dashboard_stats") {
      const now=new Date(),soon=new Date(now); soon.setDate(soon.getDate()+7);
      const [{data:allUsers},{data:allDevices}]=await Promise.all([supabase.from("users").select("id,status,expiry_date,last_login,created_at,role"),supabase.from("user_devices").select("id,blocked_until,last_attempt_at,created_at")]);
      const users=allUsers||[],devices=allDevices||[],active=users.filter((u:any)=>u.status==="active");
      const expiring7=active.filter((u:any)=>{if(!u.expiry_date)return false;const d=new Date(u.expiry_date);return d>now&&d<=soon;});
      const expired=active.filter((u:any)=>u.expiry_date&&new Date(u.expiry_date)<=now),today=now.toISOString().slice(0,10);
      return new Response(JSON.stringify({success:true,stats:{total:users.length,active:active.length,pending:users.filter((u:any)=>u.status==="pending").length,disabled:users.filter((u:any)=>u.status==="disabled").length,devices:devices.length,blocked_devices:devices.filter((d:any)=>d.blocked_until&&new Date(d.blocked_until)>now).length,expiring_7:expiring7.length,expired:expired.length,new_today:users.filter((u:any)=>String(u.created_at||"").slice(0,10)===today).length,login_today:users.filter((u:any)=>String(u.last_login||"").slice(0,10)===today).length,generated_at:now.toISOString()}}),{status:200,headers:{...corsHeaders,"Content-Type":"application/json"}});
    }
    if (action === "admin_logs") {
      // Admin panelindeki "Admin Logları" sekmesi tüm kullanıcı aktivite
      // kayıtlarını gösterebilir. Yetki kontrolü yukarıda yapıldığı için
      // normal kullanıcılar bu endpoint'e erişemez.
      const raw=Number(body.limit||100),limit=Math.min(Math.max(Number.isFinite(raw)?raw:100,1),500);
      const pageRaw=Number(body.page||1),page=Math.max(Number.isFinite(pageRaw)?Math.floor(pageRaw):1,1);
      const usernameFilter=String(body.username||"").trim();
      const from=(page-1)*limit;
      const to=from+limit-1;

      let query=supabase
        .from("activity_logs")
        .select("id,created_at,user_id,username,action,category,item_name,result,details,device_hash,app_version",{count:"exact"})
        .order("created_at",{ascending:false})
        .range(from,to);

      if(usernameFilter && usernameFilter !== "TÜMÜ"){
        query=query.eq("username",usernameFilter);
      }

      const {data,error,count}=await query;
      if(error){
        console.error("Aktivite logları alınamadı:",error);
        return new Response(JSON.stringify({success:false,message:"Aktivite logları alınamadı."}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}});
      }

      const total=Number(count||0);
      return new Response(JSON.stringify({
        success:true,
        logs:data||[],
        page,
        limit,
        total,
        has_more:from+((data||[]).length)<total
      }),{status:200,headers:{...corsHeaders,"Content-Type":"application/json"}});
    }
    if (action === "list_updates") {
      const {data,error}=await supabase.from("app_updates").select("id,app_name,version,download_url,mandatory,release_notes,is_active,created_at").eq("app_name","Uzmantech").order("created_at",{ascending:false}).limit(50);
      if(error)return new Response(JSON.stringify({success:false,message:"Güncelleme kayıtları alınamadı."}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}});
      return new Response(JSON.stringify({success:true,updates:data||[]}),{status:200,headers:{...corsHeaders,"Content-Type":"application/json"}});
    }
    if (action === "save_update") {
      const id=String(body.id||"").trim(),version=String(body.version||"").trim(),downloadUrl=String(body.download_url||"").trim(),releaseNotes=String(body.release_notes||"").trim(),mandatory=Boolean(body.mandatory),isActive=body.is_active!==false;
      if(!version||!downloadUrl)return new Response(JSON.stringify({success:false,message:"Sürüm ve indirme bağlantısı zorunlu."}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});
      if(isActive)await supabase.from("app_updates").update({is_active:false}).eq("app_name","Uzmantech");
      const payload={app_name:"Uzmantech",version,download_url:downloadUrl,mandatory,release_notes:releaseNotes,is_active:isActive}; let data,error;
      if(id){const z=await supabase.from("app_updates").update(payload).eq("id",id).select().maybeSingle();data=z.data;error=z.error;}else{const z=await supabase.from("app_updates").insert(payload).select().maybeSingle();data=z.data;error=z.error;}
      if(error)return new Response(JSON.stringify({success:false,message:"Güncelleme kaydedilemedi."}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}});
      await writeAdminAudit("update_save",null,"Uygulama güncellemesi: "+version); return new Response(JSON.stringify({success:true,update:data}),{status:200,headers:{...corsHeaders,"Content-Type":"application/json"}});
    }
    if (action === "set_update_active") {
      const id=String(body.id||"").trim(); if(!id)return new Response(JSON.stringify({success:false,message:"Güncelleme ID gerekli."}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});
      const {data:row}=await supabase.from("app_updates").select("id,version").eq("id",id).maybeSingle(); if(!row)return new Response(JSON.stringify({success:false,message:"Güncelleme bulunamadı."}),{status:404,headers:{...corsHeaders,"Content-Type":"application/json"}});
      await supabase.from("app_updates").update({is_active:false}).eq("app_name","Uzmantech"); const z=await supabase.from("app_updates").update({is_active:true}).eq("id",id).select().maybeSingle();
      if(z.error)return new Response(JSON.stringify({success:false,message:"Güncelleme aktifleştirilemedi."}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}});
      await writeAdminAudit("update_activate",null,"Aktif sürüm: "+row.version); return new Response(JSON.stringify({success:true,update:z.data}),{status:200,headers:{...corsHeaders,"Content-Type":"application/json"}});
    }
    /*
     * KULLANICILARI GETİR
     */

    if (action === "delete_user") {
      const userId = String(body.user_id || "").trim();
      if (!userId) return new Response(JSON.stringify({ success: false, message: "Silinecek kullanıcı ID gerekli." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (userId === adminSession.sub) return new Response(JSON.stringify({ success: false, message: "Kendi yönetici hesabınızı silemezsiniz." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: target, error: targetError } = await supabase.from("users").select("id,username,email,role,auth_user_id").eq("id", userId).maybeSingle();
      if (targetError || !target) return new Response(JSON.stringify({ success: false, message: "Kullanıcı bulunamadı." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (target.role === "admin") return new Response(JSON.stringify({ success: false, message: "Yönetici hesapları bu bölümden silinemez." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const cleanup = await Promise.all([
        supabase.from("archive_files").update({ created_by: null }).eq("created_by", userId),
        supabase.from("portal_payment_notices").update({ reviewed_by: null }).eq("reviewed_by", userId),
        supabase.from("portal_support_tickets").update({ resolved_by: null }).eq("resolved_by", userId),
      ]);
      const cleanupError = cleanup.find((item) => item.error)?.error;
      if (cleanupError) return new Response(JSON.stringify({ success: false, message: "Bağlı kayıtlar temizlenemedi. Hesap silinmedi." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (target.auth_user_id) {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(String(target.auth_user_id));
        if (authDeleteError) return new Response(JSON.stringify({ success: false, message: "Kimlik doğrulama hesabı silinemedi. Üyelik kaydı korundu." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { error: deleteError } = await supabase.from("users").delete().eq("id", userId);
      if (deleteError) return new Response(JSON.stringify({ success: false, message: "Üyelik kaydı silinemedi." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await writeAdminAudit("user_delete", userId, "Üye kalıcı olarak silindi: " + String(target.username || "") + " (" + String(target.email || "") + ")");
      return new Response(JSON.stringify({ success: true, message: "Üye kalıcı olarak silindi." }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "list") {
      const { data, error } = await supabase
        .from("users")
        .select(
          "id, username, email, phone, role, status, disabled_reason, email_verified, registration_channel, created_at, expiry_date, license_plan, license_days, license_started_at, last_login, updated_at, trial_expiry_email_sent_at"
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return new Response(
          JSON.stringify({
            success: false,
            message: "Kullanıcılar alınamadı.",
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      return new Response(
        JSON.stringify({ success: true, users: data || [] }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    /*
     * BİLGİSAYAR ENGELLERİNİ GETİR
     */
    if (action === "list_devices") {
      const { data, error } = await supabase
        .from("user_devices")
        .select(
          "id, user_id, device_hash, blocked_until, last_attempt_at, created_at"
        )
        .order("blocked_until", { ascending: true });

      if (error) {
        console.error(error);
        return new Response(
          JSON.stringify({
            success: false,
            message: "Bilgisayar engelleri alınamadı.",
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const rows = data || [];
      const userIds = [
        ...new Set(
          rows
            .map((x: any) => String(x.user_id || ""))
            .filter(Boolean)
        ),
      ];

      const userMap: Record<string, any> = {};

      if (userIds.length) {
        const { data: users, error: usersError } = await supabase
          .from("users")
          .select("id, username, email")
          .in("id", userIds);

        if (!usersError) {
          for (const u of users || []) userMap[u.id] = u;
        }
      }

      const devices = rows.map((x: any) => {
        const hash = String(x.device_hash || "");
        const masked =
          hash.length > 10
            ? `${hash.slice(0, 6)}••••${hash.slice(-4)}`
            : "gizli";

        return {
          id: x.id,
          user_id: x.user_id,
          username:
            userMap[x.user_id]?.username || "Bilinmeyen kullanıcı",
          email: userMap[x.user_id]?.email || "",
          device_hash_masked: masked,
          blocked_until: x.blocked_until,
          last_attempt_at: x.last_attempt_at,
          created_at: x.created_at,
        };
      });

      return new Response(
        JSON.stringify({ success: true, devices }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    /*
     * BİLGİSAYAR ENGELİNİ KALDIR
     */
    if (action === "unblock_device") {
      const deviceId = String(body.device_id || "").trim();
      const userId = String(body.user_id || "").trim();

      if (!deviceId && !userId) {
        return new Response(JSON.stringify({ success: false, message: "Kullanıcı ID veya cihaz ID gerekli." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const now = new Date().toISOString();

      // Admin belirli bir cihaz seçtiyse yalnızca o cihaz hedeflenir.
      // Sadece user_id geldiyse en son aktif engelli cihaz hedeflenir.
      let deviceQuery = supabase
        .from("user_devices")
        .select("id, user_id, device_hash, blocked_until, last_attempt_at, created_at")
        .not("blocked_until", "is", null);

      if (deviceId) {
        deviceQuery = deviceQuery.eq("id", deviceId);
      } else {
        deviceQuery = deviceQuery.eq("user_id", userId).order("created_at", { ascending: false }).limit(1);
      }

      const { data: targetRows, error: targetError } = await deviceQuery;

      if (targetError) {
        console.error("Açılacak cihaz sorgu hatası:", targetError);
        return new Response(JSON.stringify({ success: false, message: "Açılacak bilgisayar bulunamadı.", error: targetError.message || String(targetError) }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const targetDevice = Array.isArray(targetRows) ? targetRows[0] : null;

      if (!targetDevice) {
        return new Response(JSON.stringify({
          success: false,
          message: deviceId ? "Bu cihaz için aktif engelli kayıt bulunamadı." : "Bu kullanıcı için aktif bilgisayar engeli bulunamadı.",
          unblocked_count: 0,
        }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const targetUserId = String(targetDevice.user_id || userId).trim();
      const targetHash = String(targetDevice.device_hash || "").trim();

      if (!targetUserId || !targetHash) {
        return new Response(JSON.stringify({ success: false, message: "Cihaz kaydında geçerli kullanıcı veya cihaz bilgisi bulunamadı." }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // KRİTİK KURAL: Admin engeli kaldırdığı cihazı hesabın yeni bağlı
      // bilgisayarı yapar. Eski bilgisayar bundan sonra yabancı cihazdır.
      const { error: bindError } = await supabase
        .from("users")
        .update({ device_hash: targetHash, device_bound_at: now, updated_at: now })
        .eq("id", targetUserId);

      if (bindError) {
        console.error("Yeni cihaz bağlama hatası:", bindError);
        return new Response(JSON.stringify({ success: false, message: "Yeni bilgisayar hesaba bağlanamadı. Engel kaldırma işlemi uygulanmadı.", error: bindError.message || String(bindError) }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Yalnızca yeni bağlanan cihazın geçici 72 saatlik engelini temizle.
      // Eski cihazların kayıtları korunur. Böylece eski PC tekrar denenirse
      // login.ts onu yabancı cihaz olarak yeniden 72 saat engeller.
      const { data: clearedDevice, error: clearError } = await supabase
        .from("user_devices")
        .update({ blocked_until: null, last_attempt_at: now })
        .eq("id", targetDevice.id)
        .select("id, user_id, device_hash, blocked_until, last_attempt_at, created_at")
        .single();

      if (clearError) {
        console.error("Bilgisayar engeli temizleme hatası:", clearError);
        return new Response(JSON.stringify({ success: false, message: "Yeni bilgisayar hesaba bağlandı fakat engel kaydı temizlenemedi. Lütfen cihaz listesini kontrol edin.", error: clearError.message || String(clearError) }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const maskedHash = targetHash.length > 10 ? `${targetHash.slice(0, 6)}••••${targetHash.slice(-4)}` : "gizli";

      await writeAdminAudit("device_unblock", targetUserId, "Cihaz engeli kaldırıldı ve cihaz yeniden bağlandı.");
      return new Response(JSON.stringify({
        success: true,
        message: "Bilgisayar engeli kaldırıldı ve bu bilgisayar hesabın yeni bağlı bilgisayarı yapıldı.",
        unblocked_count: 1,
        devices: clearedDevice ? [clearedDevice] : [],
        processed_at: now,
        new_bound_device_hash_masked: maskedHash,
      }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    /*
     * DENEME SÜRESİ BİTİŞ MAİLİ GÖNDERİLDİ İŞARETLE
     */
    if (action === "mark_trial_expiry_email_sent") {
      const userId = String(body.user_id || "").trim();
      if (!userId) {
        return new Response(JSON.stringify({ success: false, message: "Kullanıcı ID gerekli." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("users")
        .update({ trial_expiry_email_sent_at: now, updated_at: now })
        .eq("id", userId)
        .like("license_plan", "trial_%")
        .select("id, username, email, trial_expiry_email_sent_at")
        .maybeSingle();
      if (error || !data) {
        return new Response(JSON.stringify({ success: false, message: "Deneme süresi mail kaydı güncellenemedi." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      await writeAdminAudit("trial_expiry_email_sent", userId, "Deneme süresi bitiş e-postası gönderildi olarak işaretlendi.");
      return new Response(JSON.stringify({ success: true, user: data }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    /*
     * HESAP ONAYI: LISANS TANIMLAMAZ.
     * Lisans verme, mevcut "activate" / "extend" eylemlerinden ayri tutulur.
     */
    if (action === "grant_desktop_trial") {
      const userId = String(body.user_id || "").trim();
      const days = Number(body.days || 7);
      if (!userId || !Number.isInteger(days) || days < 1 || days > 30) {
        return new Response(JSON.stringify({ success: false, message: "1 ile 30 gün arasında deneme süresi seçin." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { data: target, error: findError } = await supabase.from("users")
        .select("id,username,role,registration_channel").eq("id", userId).maybeSingle();
      if (findError || !target) return new Response(JSON.stringify({ success: false, message: "Kullanıcı bulunamadı." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (target.role === "admin" || target.registration_channel !== "desktop_app") {
        return new Response(JSON.stringify({ success: false, message: "Deneme lisansı yalnızca masaüstü uygulamasından kayıt olan üyelere verilebilir." }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const now = new Date();
      const expiry = new Date(now);
      expiry.setDate(expiry.getDate() + days);
      const { data, error } = await supabase.from("users").update({
        status: "active", disabled_reason: null, expiry_date: expiry.toISOString(),
        license_plan: "trial_" + days, license_days: days, license_started_at: now.toISOString(),
        trial_expiry_email_sent_at: null, updated_at: now.toISOString()
      }).eq("id", userId).select("id,username,email,registration_channel,status,expiry_date,license_plan,license_days").single();
      if (error || !data) return new Response(JSON.stringify({ success: false, message: "Deneme lisansı verilemedi." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      await writeAdminAudit("desktop_trial_granted", userId, days + " günlük masaüstü deneme lisansı verildi.");
      const notification = await notifyPortalUser(req, userId, "activated", days);
      return new Response(JSON.stringify({ success: true, message: days + " günlük deneme lisansı verildi.", email_sent: notification.sent, user: data }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "activate_account") {
      const userId = String(body.user_id || "").trim();
      if (!userId || userId === adminSession.sub) {
        return new Response(JSON.stringify({success:false,message:"Geçerli kullanıcı ID gerekli."}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});
      }
      const {data: target,error: findError} = await supabase.from("users")
        .select("id,username,role,status,license_plan,expiry_date")
        .eq("id",userId).maybeSingle();
      if (findError || !target) {
        return new Response(JSON.stringify({success:false,message:"Kullanıcı bulunamadı."}),{status:404,headers:{...corsHeaders,"Content-Type":"application/json"}});
      }
      if (target.role === "admin") {
        return new Response(JSON.stringify({success:false,message:"Yönetici hesabı bu işlemle değiştirilemez."}),{status:403,headers:{...corsHeaders,"Content-Type":"application/json"}});
      }
      const {data,error} = await supabase.from("users")
        .update({status:"active",disabled_reason:null,updated_at:new Date().toISOString()})
        .eq("id",userId)
        .select("id,username,role,status,license_plan,expiry_date,license_days,disabled_reason")
        .maybeSingle();
      if (error || !data) {
        return new Response(JSON.stringify({success:false,message:"Hesap onaylanamadı."}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}});
      }
      await writeAdminAudit("user_account_approved",userId,"Hesap aktif edildi; lisans değiştirilmedi.");
      const notification = await notifyPortalUser(req, userId, "activated");
      const notificationMessage = notification.sent
        ? " Onay bilgilendirmesi e-postası gönderildi."
        : " Ancak onay e-postası gönderilemedi: " + notification.message;
      return new Response(JSON.stringify({
        success: true,
        message: "Hesap etkinleştirildi. Lisans/paket tanımlanmadı." + notificationMessage,
        email_sent: notification.sent,
        email_message: notification.message,
        user: data
      }),{status:200,headers:{...corsHeaders,"Content-Type":"application/json"}});
    }

    /*
     * KULLANICI AKTİFLEŞTİR
     */
    if (action === "activate") {
      const userId = String(body.user_id || "").trim();
      const daysRaw = Number(body.days || 0);

      if (!userId) {
        return new Response(JSON.stringify({ success: false, message: "Kullanıcı ID gerekli." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (!Number.isFinite(daysRaw) || daysRaw < 1 || daysRaw > 3650) {
        return new Response(JSON.stringify({ success: false, message: "1 ile 3650 arasında geçerli gün sayısı gerekli." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { data: targetUser, error: targetError } = await supabase
        .from("users")
        .select("id, username, email, phone, role, status, disabled_reason, created_at, expiry_date, license_plan, license_days, license_started_at, last_login, updated_at")
        .eq("id", userId)
        .maybeSingle();

      if (targetError || !targetUser) {
        return new Response(JSON.stringify({ success: false, message: "Kullanıcı bulunamadı." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const now = new Date();
      const appliedDays = Math.floor(daysRaw);
      const expiryDate = new Date(now);
      expiryDate.setDate(expiryDate.getDate() + appliedDays);
      const licensePlan = appliedDays === 7 ? "trial_7" : appliedDays === 365 ? "full_365" : "custom";

      const { data, error } = await supabase
        .from("users")
        .update({
          status: "active",
          disabled_reason: null,
          expiry_date: expiryDate.toISOString(),
          license_plan: licensePlan,
          license_days: appliedDays,
          license_started_at: now.toISOString(),
          trial_expiry_email_sent_at: null,
          updated_at: now.toISOString(),
        })
        .eq("id", userId)
        .select("id, username, email, phone, role, status, disabled_reason, created_at, expiry_date, license_plan, license_days, license_started_at, last_login, updated_at")
        .maybeSingle();

      if (error) {
        console.error(error);
        return new Response(JSON.stringify({ success: false, message: "Kullanıcı aktifleştirilemedi." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      await writeAdminAudit("user_activate", userId, appliedDays+" gün lisans aktifleştirildi.");
      const notification = await notifyPortalUser(req, userId, "activated", appliedDays);
      return new Response(JSON.stringify({
        success: true,
        email_sent: notification.sent,
        message: notification.message,
        days: appliedDays,
        license_plan: licensePlan,
        user: data,
      }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    /*
     * KULLANICI PASİFLEŞTİR
     */
    if (action === "disable") {
      const userId = String(body.user_id || "").trim();

      if (!userId) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Kullanıcı ID gerekli.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (userId === adminSession.sub) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Kendi admin hesabınızı pasifleştiremezsiniz.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const { data, error } = await supabase
        .from("users")
        .update({
          status: "disabled",
          disabled_reason: "admin_disabled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select(
          "id, username, email, phone, role, status, disabled_reason, created_at, expiry_date, license_plan, license_days, license_started_at, last_login, updated_at"
        )
        .maybeSingle();

      if (error) {
        console.error(error);
        return new Response(
          JSON.stringify({
            success: false,
            message: "Kullanıcı pasifleştirilemedi.",
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      await writeAdminAudit("user_disable", userId, "Kullanıcı pasifleştirildi.");
      const notification = await notifyPortalUser(req, userId, "disabled");
      return new Response(
        JSON.stringify({
          success: true,
          email_sent: notification.sent,
          message: notification.message,
          user: data,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    /*
     * LİSANS UZAT
     */
    if (action === "extend") {
      const userId = String(body.user_id || "").trim();
      const days = Number(body.days || 0);

      if (!userId || !Number.isInteger(days) || days < 1 || days > 3650) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Kullanıcı ID ve 1 ile 3650 arasında geçerli gün sayısı gerekli.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const { data: existingUser, error: findError } =
        await supabase
          .from("users")
          .select("id, username, email, phone, role, status, disabled_reason, created_at, expiry_date, license_plan, license_days, license_started_at, last_login, updated_at")
          .eq("id", userId)
          .maybeSingle();

      if (findError || !existingUser) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Kullanıcı bulunamadı.",
          }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const now = new Date();
      const currentExpiry = existingUser.expiry_date ? new Date(existingUser.expiry_date) : now;
      const hadValidLicense = currentExpiry.getTime() > now.getTime();
      const baseDate = hadValidLicense ? currentExpiry : now;
      baseDate.setDate(baseDate.getDate() + days);

      const { data, error } = await supabase
        .from("users")
        .update({
          status: "active",
          disabled_reason: null,
          expiry_date: baseDate.toISOString(),
          license_plan: "custom",
          license_days: (hadValidLicense ? Number(existingUser.license_days || 0) : 0) + days,
          license_started_at: hadValidLicense ? (existingUser.license_started_at || now.toISOString()) : now.toISOString(),
          trial_expiry_email_sent_at: null,
          updated_at: now.toISOString(),
        })
        .eq("id", userId)
        .select("id, username, email, phone, role, status, disabled_reason, created_at, expiry_date, license_plan, license_days, license_started_at, last_login, updated_at")
        .maybeSingle();

      if (error) {
        console.error(error);
        return new Response(
          JSON.stringify({
            success: false,
            message: "Lisans süresi uzatılamadı.",
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      await writeAdminAudit("license_extend", userId, days + " gün lisans eklendi.");
      const notification = await notifyPortalUser(req, userId, "license_extended", days);
      return new Response(
        JSON.stringify({
          success: true,
          email_sent: notification.sent,
          message: notification.message,
          user: data,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (action === "set_password") {
      const userId=String(body.user_id||"").trim(),password=String(body.password||""); if(!userId||password.length<6)return new Response(JSON.stringify({success:false,message:"Kullanıcı ID ve en az 6 karakterlik şifre gerekli."}),{status:400,headers:{...corsHeaders,"Content-Type":"application/json"}});
      const salt=new Uint8Array(16);crypto.getRandomValues(salt);const iterations=310000,key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]),bits=await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations,hash:"SHA-256"},key,256);
      const b64=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,""); const hash="pbkdf2_sha256$"+iterations+"$"+b64(salt)+"$"+b64(new Uint8Array(bits));
      const {error}=await supabase.from("users").update({password_hash:hash,updated_at:new Date().toISOString()}).eq("id",userId); if(error)return new Response(JSON.stringify({success:false,message:"Şifre değiştirilemedi."}),{status:500,headers:{...corsHeaders,"Content-Type":"application/json"}});
      await writeAdminAudit("password_change",userId,"Kullanıcı şifresi admin panelinden değiştirildi."); const notification=await notifyPortalUser(req,userId,"password_changed"); return new Response(JSON.stringify({success:true,email_sent:notification.sent,message:notification.message}),{status:200,headers:{...corsHeaders,"Content-Type":"application/json"}});
    }

    /*
     * KULLANICI DÜZENLE
     */
    if (action === "edit") {
      const userId = String(body.user_id || "").trim();

      if (!userId) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Kullanıcı ID gerekli.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const updates: Record<string, any> = {};

      if (body.email !== undefined) {
        updates.email = String(body.email).trim();
      }

      if (body.phone !== undefined) {
        updates.phone = String(body.phone).trim();
      }

      if (body.role === "user" || body.role === "admin") {
        updates.role = body.role;
      }

      if (
        body.status === "active" ||
        body.status === "pending" ||
        body.status === "disabled"
      ) {
        updates.status = body.status;
      }

      if (body.expiry_date !== undefined) {
        updates.expiry_date = body.expiry_date
          ? String(body.expiry_date)
          : null;
      }

      if (userId === adminSession.sub) {
        if (
          updates.role !== undefined &&
          updates.role !== "admin"
        ) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Kendi admin rolünüzü kaldıramazsınız.",
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }

        if (
          updates.status !== undefined &&
          updates.status !== "active"
        ) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "Kendi admin hesabınızı pasifleştiremezsiniz.",
            }),
            {
              status: 400,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
              },
            }
          );
        }
      }

      if (Object.keys(updates).length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Değiştirilecek bilgi bulunamadı.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", userId)
        .select(
          "id, username, email, phone, role, status, disabled_reason, created_at, expiry_date, license_plan, license_days, license_started_at, last_login, updated_at"
        )
        .maybeSingle();

      if (error) {
        console.error(error);
        return new Response(
          JSON.stringify({
            success: false,
            message: "Kullanıcı güncellenemedi.",
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      await writeAdminAudit("user_edit", userId, "Kullanıcı bilgileri düzenlendi.");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Kullanıcı güncellendi.",
          user: data,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    /*
     * KULLANICI SİL
     */
    if (action === "delete") {
      const userId = String(body.user_id || "").trim();

      if (!userId) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Kullanıcı ID gerekli.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (userId === adminSession.sub) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Kendi admin hesabınızı silemezsiniz.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const { data: targetUser } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", userId)
        .maybeSingle();

      if (!targetUser) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Kullanıcı bulunamadı.",
          }),
          {
            status: 404,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      if (targetUser.role === "admin") {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Admin hesabı silinemez.",
          }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (error) {
        console.error(error);
        return new Response(
          JSON.stringify({
            success: false,
            message: "Kullanıcı silinemedi.",
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      await writeAdminAudit("user_delete", userId, "Kullanıcı silindi.");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Kullanıcı silindi.",
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: "Geçersiz işlem.",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error(error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Sunucu tarafında beklenmeyen bir hata oluştu.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

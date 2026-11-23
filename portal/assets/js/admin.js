(() => {
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const api=window.UzmantechAPI;
 let users=[];
 let acquisitionByUser=new Map();
 let payments=[];
 let tickets=[];
 let archiveFiles=[];
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const toast=m=>{const e=$("#toast");e.textContent=m;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),3200)};
 function navigate(id){$$(".view").forEach(v=>v.classList.toggle("active",v.id===id));$$("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===id));$("#breadcrumb").textContent=id==="analytics"?"Kullanıcı Analizi":id==="siteMetrics"?"Site İstatistikleri":id==="users"?"Üyeler ve Lisanslar":id==="payments"?"Ödeme Bildirimleri":id==="support"?"Destek Talepleri":id==="email"?"Toplu E-posta":id==="archive"?"Dosya Arşivi Yönetimi":id==="ai"?"Yapay Zekâ Eğitim Merkezi":id==="content"?"Site İçeriği":"Genel Bakış";if(id==="email"){loadBroadcasts().catch(e=>toast(e.message));loadMailLog().catch(e=>toast(e.message));}if(id==="siteMetrics")loadSiteMetrics().catch(e=>toast(e.message));if(id==="analytics")loadAnalytics().catch(e=>toast(e.message));if(id==="payments")loadPayments().catch(e=>toast(e.message));if(id==="support")loadSupport().catch(e=>toast(e.message));if(id==="archive")loadArchiveFiles().catch(e=>toast(e.message));if(id==="ai")loadAiKnowledge().catch(e=>toast(e.message));$("#sidebar").classList.remove("open");}
 async function adminCall(action,extra={}){return api.admin({action,...extra});}

 const planNames={monthly:"1 Aylık",half_year:"6 Aylık",annual:"12 Aylık"};
 const statusNames={pending:"Onay bekliyor",approved:"Onaylandı",rejected:"Reddedildi"};

 function formatBytes(n){n=Number(n||0);if(!n)return "0 B";const u=["B","KB","MB","GB"];const i=Math.min(Math.floor(Math.log(n)/Math.log(1024)),3);return (n/Math.pow(1024,i)).toFixed(i?1:0)+" "+u[i];}
 function renderArchiveFiles(){
  const q=($("#archiveFileSearch")?.value||"").trim().toLocaleLowerCase("tr-TR");
  const rows=archiveFiles.filter(f=>[f.title,f.brand,f.model,f.category,f.original_filename].join(" ").toLocaleLowerCase("tr-TR").includes(q));
  $("#archiveFilesBody").innerHTML=rows.map(f=>'<tr><td><strong>'+esc(f.title)+'</strong><br><small>'+esc(f.original_filename)+'</small></td><td>'+esc(f.brand)+'<br><small>'+esc(f.model||"-")+'</small></td><td>'+esc(f.category)+'</td><td>'+formatBytes(f.file_size)+'</td><td><span class="status '+(f.is_active?"active":"expired")+'">'+(f.is_active?"Yayında":"Pasif")+'</span></td><td><button class="btn" data-file-action="download" data-id="'+esc(f.id)+'">İndir</button> <button class="btn" data-file-action="edit" data-id="'+esc(f.id)+'">Düzenle</button> <button class="btn" data-file-action="toggle" data-id="'+esc(f.id)+'">'+(f.is_active?"Yayından kaldır":"Yayınla")+'</button> <button class="btn danger" data-file-action="delete" data-id="'+esc(f.id)+'">Sil</button></td></tr>').join("")||'<tr><td colspan="6">Henüz arşive dosya eklenmemiş.</td></tr>';
  $("#fileStatTotal").textContent=archiveFiles.length;$("#fileStatActive").textContent=archiveFiles.filter(f=>f.is_active).length;$("#fileStatInactive").textContent=archiveFiles.filter(f=>!f.is_active).length;
 }
 async function loadArchiveFiles(){
  $("#archiveFilesBody").innerHTML='<tr><td colspan="6">Dosyalar yükleniyor…</td></tr>';
  const result=await api.archiveAdmin({action:"file_list"});archiveFiles=result.files||[];renderArchiveFiles();
 }
 $("#archiveFileForm")?.addEventListener("submit",async e=>{
  e.preventDefault();
  const form=e.currentTarget,fd=new FormData(form),rawUrl=String(fd.get("external_url")||"").trim();
  let link;
  try{link=new URL(rawUrl);}catch{toast("Geçerli bir bağlantı gir.");return;}
  if(link.protocol!=="https:"||!link.hostname||link.username||link.password){toast("Güvenlik için yalnızca kullanıcı bilgisi içermeyen HTTPS bağlantıları kabul edilir.");return;}
  const btn=$("#archiveUploadBtn");btn.disabled=true;$("#archiveUploadMessage").textContent=""; 
  try{
   await api.archiveAdmin({action:"file_create",title:fd.get("title"),brand:fd.get("brand"),model:fd.get("model"),category:fd.get("category"),description:fd.get("description"),external_url:link.href,storage_path:null,original_filename:link.hostname,file_size:0,mime_type:"application/octet-stream",is_active:fd.get("is_active")==="on"});
   form.reset();form.querySelector('[name="is_active"]').checked=true;
   $("#archiveUploadMessage").textContent="Bağlantı kaydedildi ve arşiv kaydı oluşturuldu.";
   toast("Bağlantı arşive eklendi.");await loadArchiveFiles();
  }catch(err){$("#archiveUploadMessage").textContent=err.message||"Bağlantı kaydedilemedi.";toast(err.message||"Kayıt başarısız.");}
  finally{btn.disabled=false;}
 });

 let archiveBulkRows=[];
  function previewArchiveBulk(){
   const raw=$("#archiveBulkInput")?.value||"",category=$("#archiveBulkCategory")?.value||"firmware";
   const allowed=["firmware","eng","imei","test_point","resistor","usb","other"];
   archiveBulkRows=raw.split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map((line,index)=>{
    const parts=line.split("|").map(x=>x.trim());
    const [title,brand,model,url,...descriptionParts]=parts,description=descriptionParts.join(" | ");
    let error="",parsed=null;
    if(parts.length<4)error="4 zorunlu alan gerekli";
    else if(!title||!brand||!model||!url)error="Başlık, marka, model ve bağlantı zorunlu";
    else if(!allowed.includes(category))error="Kategori geçersiz";
    try{parsed=new URL(url)}catch{error=error||"Bağlantı geçersiz"}
    if(parsed&&(parsed.protocol!=="https:"||!parsed.hostname||parsed.username||parsed.password))error=error||"Yalnızca güvenli HTTPS bağlantısı";
    const duplicate=!!(!error&&archiveFiles.some(f=>
     String(f.external_url||"").replace(/\/$/,"").toLowerCase()===parsed.href.replace(/\/$/,"").toLowerCase()||
     (String(f.brand||"").toLowerCase()===brand.toLowerCase()&&String(f.model||"").toLowerCase()===model.toLowerCase()&&String(f.title||"").toLowerCase()===title.toLowerCase())
    ));
    return {line:index+1,title,brand,model,url:parsed?.href||url,description,category,status:error?"HATA":duplicate?"TEKRAR":"EKLENECEK",error};
   });
   $("#archiveBulkPreview").innerHTML=archiveBulkRows.map(r=>'<tr><td>'+r.line+'</td><td>'+esc(r.title||"-")+'<br><small>'+esc(r.brand+" / "+r.model)+'</small></td><td>'+esc(r.error||r.status)+'</td></tr>').join("")||'<tr><td colspan="3">Aktarılacak satır bulunamadı.</td></tr>';
   const ready=archiveBulkRows.filter(r=>r.status==="EKLENECEK").length,skipped=archiveBulkRows.length-ready;
   $("#archiveBulkMessage").textContent=ready+" kayıt eklenecek, "+skipped+" satır atlanacak. Supabase'e yalnızca bağlantı ve metadata kaydedilir.";
   $("#archiveBulkImportBtn").disabled=ready===0;
  }
  $("#archiveBulkPreviewBtn")?.addEventListener("click",previewArchiveBulk);
  $("#archiveBulkImportBtn")?.addEventListener("click",async()=>{
   const ready=archiveBulkRows.filter(r=>r.status==="EKLENECEK");if(!ready.length)return;
   if(!confirm(ready.length+" dış bağlantı arşive eklensin mi?"))return;
   const btn=$("#archiveBulkImportBtn");btn.disabled=true;let added=0,failed=[];
   for(const row of ready){
    try{
     await api.archiveAdmin({action:"file_create",title:row.title,brand:row.brand,model:row.model,category:row.category,description:row.description||"",external_url:row.url,storage_path:null,original_filename:new URL(row.url).pathname.split("/").filter(Boolean).pop()||new URL(row.url).hostname,file_size:0,mime_type:"application/octet-stream",is_active:true});
     added++;$("#archiveBulkMessage").textContent=added+"/"+ready.length+" kayıt eklendi…";
    }catch(err){failed.push("Satır "+row.line+": "+err.message);}
   }
   $("#archiveBulkMessage").textContent="Tamamlandı: "+added+" eklendi, "+failed.length+" başarısız. "+(failed.length?failed.join(" • "):"");
   toast(added+" arşiv bağlantısı eklendi"+(failed.length?", "+failed.length+" hata":"")+".");
   await loadArchiveFiles();previewArchiveBulk();btn.disabled=archiveBulkRows.every(r=>r.status!=="EKLENECEK");
  });
  $("#reloadArchiveFiles")?.addEventListener("click",()=>loadArchiveFiles().catch(e=>toast(e.message)));
 $("#archiveFileSearch")?.addEventListener("input",renderArchiveFiles);
 function renderPayments(){
  const body=$("#paymentsBody");if(!body)return;
  body.innerHTML=payments.map(p=>{
   const user=p.user||{},displayEmail=user.email||p.email||"E-posta yok",date=p.created_at?new Date(p.created_at).toLocaleString("tr-TR"):"-";
   const receipt=p.receipt_url?'<a class="btn" href="'+esc(p.receipt_url)+'" target="_blank" rel="noopener noreferrer">Dekontu aç</a>':'<span class="muted">Açılamadı</span>';
   const actions=p.status==="pending"?'<button class="btn" data-payment-action="approved" data-id="'+esc(p.id)+'">Onayla</button> <button class="btn" data-payment-action="rejected" data-id="'+esc(p.id)+'">Reddet</button>':'-';
   const usd='$'+Number(p.amount||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2})+' USD';
   const tryAmount=p.amount_try==null?'<small class="muted">Eski kayıt: TL tutarı yok</small>':'<small>₺'+Number(p.amount_try).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2})+' · Kur '+Number(p.exchange_rate||0).toLocaleString("tr-TR",{minimumFractionDigits:4,maximumFractionDigits:4})+'</small>';
   return '<tr><td>'+esc(user.username||"Bilinmeyen")+'<br><small>'+esc(displayEmail)+'</small></td><td>'+esc(planNames[p.plan]||p.plan)+'<br><small>'+esc(p.license_days)+' gün</small></td><td><strong>'+usd+'</strong><br>'+tryAmount+'</td><td>'+receipt+'</td><td>'+esc(date)+'</td><td><span class="status '+(p.status==="approved"?"active":p.status==="pending"?"pending":"expired")+'">'+esc(statusNames[p.status]||p.status)+'</span></td><td>'+actions+'</td></tr>';
  }).join("")||'<tr><td colspan="7">Henüz ödeme bildirimi yok.</td></tr>';
 }
 async function loadPayments(){
  const body=$("#paymentsBody");if(body)body.innerHTML='<tr><td colspan="7">Ödeme bildirimleri yükleniyor…</td></tr>';
  const result=await api.portalAdmin({action:"payment_list"});payments=result.payments||[];renderPayments();
 }


 function renderSupport(){
  const body=$("#supportBody");if(!body)return;
  const labels={open:"Yeni",in_progress:"İşlemde",resolved:"Çözüldü"};
  const categoryNames={technical:"Teknik",license:"Lisans",payment:"Ödeme",archive:"Arşiv",other:"Diğer"};
  body.innerHTML=tickets.map(t=>{
   const user=t.user||{},displayName=user.username||t.guest_name||"Ziyaretçi",displayEmail=user.email||t.guest_email||"E-posta yok",date=t.created_at?new Date(t.created_at).toLocaleString("tr-TR"):"-";
   const status=t.status||"open";
   const actions=status==="resolved"
    ?'<button class="btn" data-support-status="open" data-id="'+esc(t.id)+'">Yeniden Aç</button>'
    :'<button class="btn" data-support-status="in_progress" data-id="'+esc(t.id)+'">İşleme Al</button> <button class="btn" data-support-status="resolved" data-id="'+esc(t.id)+'">Çözüldü</button>';
   return '<tr><td>'+esc(displayName)+'<br><small>'+esc(user.email||"")+'</small></td>'+
    '<td><strong>'+esc(t.subject)+'</strong><br><small>'+esc(categoryNames[t.category]||t.category)+'</small></td>'+
    '<td><details><summary>Mesajı görüntüle</summary><p class="ticket-message">'+esc(t.message)+'</p>'+(t.admin_note?'<p class="ticket-note"><b>Yanıt:</b> '+esc(t.admin_note)+'</p>':'')+'</details></td>'+
    '<td>'+esc(date)+'</td><td><span class="status '+(status==="resolved"?"active":status==="in_progress"?"pending":"expired")+'">'+esc(labels[status]||status)+'</span></td><td>'+actions+'</td></tr>';
  }).join("")||'<tr><td colspan="6">Henüz destek talebi yok.</td></tr>';
 }
 async function loadSupport(){
  const body=$("#supportBody");if(body)body.innerHTML='<tr><td colspan="6">Destek talepleri yükleniyor…</td></tr>';
  const result=await api.supportList();tickets=result.tickets||[];renderSupport();
 }

 function renderUsers(){
  const q=$("#userSearch").value.trim().toLocaleLowerCase("tr-TR");
  const list=users.filter(u=>[u.username,u.email,u.phone].join(" ").toLocaleLowerCase("tr-TR").includes(q));
  const planNames={monthly:"1 Aylık",half_year:"6 Aylık",annual:"12 Aylık",trial_7:"7 Gün Deneme",full_365:"12 Aylık",custom:"Özel Lisans","365":"12 Aylık","none":"Lisans Yok"};
  $( "#usersBody" ).innerHTML=list.map(u=>{
   const expiry=u.expiry_date?new Date(u.expiry_date):null;
   const dateText=expiry&&!Number.isNaN(expiry.getTime())?expiry.toLocaleDateString("tr-TR"):"-";
   const remaining=expiry&&!Number.isNaN(expiry.getTime())?Math.ceil((expiry.getTime()-Date.now())/86400000):null;
   const status=u.status==="active"?(remaining!==null&&remaining<=0?"Lisans süresi doldu":"Aktif"):u.status==="pending"?"Onay bekliyor":u.disabled_reason==="license_expired"?"Lisans süresi doldu · Yenileme açık":u.disabled_reason==="admin_disabled"?"Yönetici tarafından kapatıldı":"Pasif";
   const plan=planNames[u.license_plan]||u.license_plan||"Lisans yok";
   const remainingText=remaining===null?"Lisans atanmamış":remaining<=0?"Süresi doldu":remaining+" gün kaldı";
   const hasValidLicense=!!(expiry&&expiry.getTime()>Date.now()&&u.license_plan&&u.license_plan!=="none");
   const actionButtons=u.status==="pending"
    ?'<button class="btn" data-action="activate_account" data-id="'+esc(u.id)+'">Hesabı Onayla (Paketsiz)</button> <button class="btn" data-action="disable" data-id="'+esc(u.id)+'">Reddet</button>'
    :u.status==="disabled"
     ?'<button class="btn" data-action="activate_account" data-id="'+esc(u.id)+'">Hesabı Aktif Et</button>'
     :hasValidLicense
      ?'<button class="btn" data-action="extend" data-id="'+esc(u.id)+'">Süre uzat</button> <button class="btn" data-action="disable" data-id="'+esc(u.id)+'">Pasifleştir</button>'
      :'<button class="btn" data-action="activate" data-id="'+esc(u.id)+'">Lisans Ver</button> <button class="btn" data-action="disable" data-id="'+esc(u.id)+'">Pasifleştir</button>';
   const buttons=actionButtons+' <button class="btn danger" data-action="delete" data-id="'+esc(u.id)+'">Sil</button>';
   const css=u.status==="active"?(remaining!==null&&remaining<=0?"expired":"active"):u.status==="pending"?"pending":"expired";
   const emailState=u.email_verified===false?'<br><small class="muted">E-posta doğrulanmadı</small>':'';
   const acq=acquisitionByUser.get(u.id)||{};const sourceNames={google:"Google",instagram:"Instagram",facebook:"Facebook",youtube:"YouTube",tiktok:"TikTok",whatsapp:"WhatsApp",email:"E-posta",referral:"Diğer site",direct:"Doğrudan",other:"Diğer",unknown:"Bilinmiyor"};const sourceLabel=sourceNames[acq.acquisition_source]||acq.acquisition_source||"Bilinmiyor";const channelNames={web:"Web sitesi",desktop_app:"Masaüstü uygulama",unknown:"Bilinmiyor"};const channelLabel=channelNames[acq.registration_channel]||"Bilinmiyor";const sourceDetail=[channelLabel,acq.acquisition_medium,acq.acquisition_campaign].filter(Boolean).join(" · ");return '<tr><td>'+esc(u.username)+'</td><td>'+esc(u.email)+emailState+'</td><td>'+esc(sourceLabel)+(sourceDetail?'<br><small>'+esc(sourceDetail)+'</small>':'')+'</td><td><span class="status '+css+'">'+esc(status)+'</span></td><td>'+esc(dateText)+'<br><small>'+esc(plan)+' · '+esc(remainingText)+'</small></td><td>'+buttons+'</td></tr>';
  }).join("")||'<tr><td colspan="6">Kayıt bulunamadı.</td></tr>';
 }
 async function loadUsers(){
  $("#usersBody").innerHTML='<tr><td colspan="6">Kullanıcılar yükleniyor…</td></tr>';
  const [result, acquisitionResult]=await Promise.all([adminCall("list"),api.portalAdmin({action:"admin_acquisition_list"}).catch(()=>({users:[]}))]);
  users=result.users||[];acquisitionByUser=new Map((acquisitionResult.users||[]).map(u=>[u.id,u]));renderUsers();
  const now=Date.now(),active=users.filter(u=>u.status==="active"),pending=users.filter(u=>u.status==="pending"),expired=active.filter(u=>u.expiry_date&&new Date(u.expiry_date).getTime()<=now);
  $("#statTotal").textContent=users.length;$("#statActive").textContent=active.length;$("#statPending").textContent=pending.length;$("#statExpired").textContent=expired.length;
 }
 let analyticsData=null;
 const analyticsDate=v=>v?new Date(v).toLocaleString("tr-TR",{dateStyle:"short",timeStyle:"short"}):"—";
 function renderAnalytics(){if(!analyticsData)return;const s=analyticsData.summary||{};[["anTotal","registered_total"],["an7d","active_7d"],["an30d","active_30d"],["an90d","active_90d"],["anPaid","paid_active"],["anTrial","trial_accounts"],["anNever","never_tracked"],["anVisitors","visitors_24h"]].forEach(([id,k])=>$("#"+id).textContent=Number(s[k]||0).toLocaleString("tr-TR"));
 const max=Math.max(1,...(analyticsData.daily||[]).map(x=>x.events));$("#analyticsTrend").innerHTML=(analyticsData.daily||[]).map(x=>'<div class="trend-day" title="'+esc(x.date+": "+x.events+" etkinlik · "+x.users+" kullanıcı")+'"><i style="height:'+Math.max(3,Math.round(x.events/max*100))+'%"></i><small>'+esc(x.date.slice(8))+'</small></div>').join("");$("#analyticsTrendNote").textContent=Number(s.events_90d||0).toLocaleString("tr-TR")+" müşteri etkinliği / son 90 gün.";
 const funnel=[["Kayıtlı müşteri",s.registered_total],["Son 30 gün aktif",s.active_30d],["Aktif ücretli",s.paid_active],["Deneme hesabı",s.trial_accounts]];$("#analyticsFunnel").innerHTML=funnel.map(([l,v])=>'<div class="funnel-row"><span>'+esc(l)+'</span><b>'+Number(v||0).toLocaleString("tr-TR")+'</b></div>').join("");$("#analyticsPaymentNote").textContent="Son 90 gün ödeme bildirimi: "+Number(s.payment_notices_90d||0)+" · Onaylanan: "+Number(s.payments_approved_90d||0);
 $("#analyticsFeatures").innerHTML=(analyticsData.features||[]).map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+Number(x.events).toLocaleString("tr-TR")+'</td></tr>').join("")||'<tr><td colspan="2">Henüz veri yok.</td></tr>';$("#analyticsSources").innerHTML=(analyticsData.sources||[]).map(x=>'<tr><td>'+esc(x.source)+'</td><td>'+Number(x.count).toLocaleString("tr-TR")+'</td></tr>').join("")||'<tr><td colspan="2">Henüz veri yok.</td></tr>';
 const q=($("#analyticsUserSearch")?.value||"").trim().toLocaleLowerCase("tr-TR"),rows=(analyticsData.users||[]).filter(u=>String(u.username||"").toLocaleLowerCase("tr-TR").includes(q));$("#analyticsUsers").innerHTML=rows.map(u=>'<tr><td><strong>'+esc(u.username)+'</strong></td><td>'+esc(u.status)+'<br><small>'+esc(u.license_plan||"none")+'</small></td><td>'+Number(u.events_90d||0).toLocaleString("tr-TR")+'</td><td>'+Number(u.active_days_90d||0)+'</td><td>'+esc(analyticsDate(u.last_activity||u.last_login))+'</td><td>'+esc(u.acquisition_source||"unknown")+'</td><td>'+esc((u.features||[]).slice(0,4).join(", ")||"—")+'</td></tr>').join("")||'<tr><td colspan="7">Eşleşen kullanıcı yok.</td></tr>';$("#analyticsGenerated").textContent="Son güncelleme: "+analyticsDate(analyticsData.generated_at)+" · Ölçüm dönemi: son 90 gün.";}
 async function loadAnalytics(){$("#analyticsUsers").innerHTML='<tr><td colspan="7">Analiz verileri yükleniyor…</td></tr>';analyticsData=await adminCall("analytics_dashboard");renderAnalytics();}
 $("#reloadAnalytics")?.addEventListener("click",()=>loadAnalytics().catch(e=>toast(e.message)));$("#analyticsUserSearch")?.addEventListener("input",renderAnalytics);

 async function loadSiteMetrics(){
 const stats=await api.siteStats();
 const real=Number(stats.real_visitors??stats.visitors??0);
 $("#metricRealNow").textContent=real;
 $("#metric24h").textContent=Number(stats.visitors_24h??0);
 $("#metricMembers").textContent=users.length;
 $("#metricDisplay").textContent=Number(stats.visitors??real);
 $("#visitorDisplayFloor").value=Number(stats.visitor_display_floor??0);
 $("#visitorDisplayMessage").textContent="Gerçek anlık: "+real+" · Gösterim alt sınırı: "+Number(stats.visitor_display_floor??0);
}
async function loadDashboard(){await loadUsers();if(!$("#siteMetrics").hidden)await loadSiteMetrics();$("#metricMembers").textContent=users.length;}
 async function enter(user){
  if(user.role!=="admin"){api.setSession("");throw new Error("Bu hesap yönetici yetkisine sahip değil.");}
  $("#loginView").hidden=true;$("#appView").hidden=false;$("#adminName").textContent=user.username;$("#logoutBtn").hidden=false;
  await loadDashboard();
 }
 $("#adminLogin").addEventListener("submit",async e=>{
  e.preventDefault();const btn=$("#adminLoginBtn");btn.disabled=true;btn.textContent="Kontrol ediliyor…";$("#loginError").textContent="";
  const form=new FormData(e.currentTarget);
  try{const result=await api.login({identifier:form.get("identifier"),password:form.get("password")});api.setSession(result.session_token);await enter(result.user);toast("Yönetici girişi başarılı.");}
  catch(err){api.setSession("");$("#loginError").textContent=err.message;}
  finally{btn.disabled=false;btn.textContent="Giriş Yap";}
 });
 async function checkSession(){if(!api.getToken())return;try{const result=await api.session();await enter(result.user);}catch{api.setSession("");}}
 $("#logoutBtn").addEventListener("click",()=>{api.setSession("");location.reload();});
 $("#refreshBtn").addEventListener("click",()=>loadDashboard().catch(e=>toast(e.message)));
 $("#reloadSiteMetrics")?.addEventListener("click",()=>loadSiteMetrics().catch(e=>toast(e.message)));
 $("#visitorDisplayForm")?.addEventListener("submit",async e=>{e.preventDefault();const value=Number($("#visitorDisplayFloor").value);if(!Number.isInteger(value)||value<0||value>100000){toast("0 ile 100000 arasında bir sayı gir.");return;}const btn=$("#saveVisitorDisplay");btn.disabled=true;try{await api.archiveAdmin({action:"site_metrics_settings",visitor_display_floor:value});$("#visitorDisplayMessage").textContent="Ayar kaydedildi. Ana sayfadaki sayaç gerçek sayı ile alt sınırın yüksek olanını gösterecek.";toast("Anlık sayaç ayarı kaydedildi.");await loadSiteMetrics();}catch(err){toast(err.message);}finally{btn.disabled=false;}});
 $("#reloadUsers").addEventListener("click",()=>loadUsers().catch(e=>toast(e.message)));
 $("#reloadPayments")?.addEventListener("click",()=>loadPayments().catch(e=>toast(e.message)));
 $("#reloadSupport")?.addEventListener("click",()=>loadSupport().catch(e=>toast(e.message)));
 $("#userSearch").addEventListener("input",renderUsers);
 $("#adminNav").addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)navigate(b.dataset.view);});
 document.addEventListener("click",async e=>{
  const jump=e.target.closest("[data-jump]");if(jump)navigate(jump.dataset.jump);
  if(e.target.id==="navToggle")$("#sidebar").classList.toggle("open");

  const supportBtn=e.target.closest("[data-support-status]");
  if(supportBtn){
   const id=supportBtn.dataset.id,status=supportBtn.dataset.supportStatus,t=tickets.find(x=>x.id===id);if(!t)return;
   const note=prompt("Yönetici yanıtı / notu (üyenin destek geçmişinde görünür):",t.admin_note||"");
   if(note===null)return;
   supportBtn.disabled=true;
   try{await api.supportUpdate({ticket_id:id,status,admin_note:note});toast("Destek talebi güncellendi.");await loadSupport();}
   catch(err){toast(err.message);}
   finally{supportBtn.disabled=false;}
   return;
  }
  const paymentBtn=e.target.closest("[data-payment-action]");
  if(paymentBtn){
   const id=paymentBtn.dataset.id,status=paymentBtn.dataset.paymentAction,p=payments.find(x=>x.id===id);if(!p)return;
   const actionLabel=status==="approved"?"onaylanacak ve lisansı eklenecek":"reddedilecek";
   if(!confirm((p.user?.username||"Kullanıcı")+" ödeme bildirimi "+actionLabel+" mı?"))return;
   const adminNote=status==="rejected"?(prompt("Ret nedeni (üyenin ödeme geçmişinde görünür):","Dekont veya ödeme bilgisi doğrulanamadı.")||""):"";
   paymentBtn.disabled=true;
   try{await api.portalAdmin({action:"payment_review",payment_id:id,status,admin_note:adminNote});toast(status==="approved"?"Ödeme onaylandı, lisans eklendi.":"Ödeme reddedildi.");await loadPayments();await loadUsers();}
   catch(err){toast(err.message);}
   finally{paymentBtn.disabled=false;}
   return;
  }

  const fileBtn=e.target.closest("[data-file-action]");
  if(fileBtn){
   const f=archiveFiles.find(x=>x.id===fileBtn.dataset.id);if(!f)return;
   fileBtn.disabled=true;
   try{
    if(fileBtn.dataset.fileAction==="download"){const r=await api.archiveAdmin({action:"file_download_url",id:f.id});window.open(r.url,"_blank","noopener");}
    else if(fileBtn.dataset.fileAction==="edit"){const title=prompt("Dosya başlığı:",f.title);if(title===null)return;const model=prompt("Model:",f.model||"");if(model===null)return;const description=prompt("Açıklama:",f.description||"");if(description===null)return;const externalUrl=prompt("Dosya bağlantısı (HTTPS):",f.external_url||"");if(externalUrl===null)return;let parsedUrl;try{parsedUrl=new URL(externalUrl.trim());}catch{throw new Error("Geçerli bir dosya bağlantısı girin.");}if(parsedUrl.protocol!=="https:"||!parsedUrl.hostname||parsedUrl.username||parsedUrl.password)throw new Error("Yalnızca güvenli HTTPS bağlantıları kabul edilir.");await api.archiveAdmin({action:"file_update",id:f.id,title:title.trim(),model:model.trim(),description:description.trim(),external_url:parsedUrl.href});toast("Dosya bilgileri ve indirme bağlantısı güncellendi.");await loadArchiveFiles();}
    else if(fileBtn.dataset.fileAction==="toggle"){await api.archiveAdmin({action:"file_update",id:f.id,is_active:!f.is_active});toast(f.is_active?"Dosya yayından kaldırıldı.":"Dosya yayına alındı.");await loadArchiveFiles();}
    else if(fileBtn.dataset.fileAction==="delete"){if(!confirm('"'+f.title+'" dosyası depodan kalıcı olarak silinsin mi?'))return;await api.archiveAdmin({action:"file_delete",id:f.id});toast("Dosya kalıcı olarak silindi.");await loadArchiveFiles();}
   }catch(err){toast(err.message);}
   finally{fileBtn.disabled=false;}
   return;
  }
  const btn=e.target.closest("[data-action]");if(!btn)return;
  const id=btn.dataset.id,action=btn.dataset.action,u=users.find(x=>x.id===id);if(!u)return;
  if(action==="delete"){
   const typed=prompt("Bu üyeyi kalıcı olarak silmek üzeresiniz. Bu işlem geri alınamaz.\\n\\nKullanıcı: "+u.username+"\\nE-posta: "+u.email+"\\n\\nOnaylamak için kullanıcı adını aynen yazın:");
   if(typed!==u.username){if(typed!==null)toast("Silme iptal edildi. Kullanıcı adı eşleşmedi.");return;}
   btn.disabled=true;
   try{const result=await adminCall("delete_user",{user_id:id});toast(result.message||"Üye silindi.");await loadDashboard();}
   catch(err){toast(err.message||"Üye silinemedi.");}
   finally{btn.disabled=false;}
   return;
  }
  let days=365;
  if(action==="activate"||action==="extend"){
   const answer=prompt(u.username+" için kaç günlük lisans verilsin?",action==="activate"?"30":"30");
   if(answer===null)return;days=Number(answer);
   if(!Number.isInteger(days)||days<1||days>3650){toast("1 ile 3650 arasında gün gir.");return;}
  }
  const label=action==="activate_account"?"hesap paket tanımlanmadan etkinleştirilsin":action==="activate"?"lisans verilsin":action==="extend"?"üyelik süresi uzatılsın":"hesap pasifleştirilsin";
  if(!confirm(u.username+" hesabı için "+label+" mı?"))return;
  btn.disabled=true;
  try{const result=await adminCall(action,{user_id:id,...(action==="activate"||action==="extend"?{days}:{})});toast(result.message||"İşlem tamamlandı.");await loadDashboard();}
  catch(err){toast(err.message);}
  finally{btn.disabled=false;}
 });

 $("#resendTestBtn")?.addEventListener("click",async()=>{
  const btn=$("#resendTestBtn"),status=$("#resendTestStatus");
  if(!confirm("Yalnızca ataturkiyehack@gmail.com adresine Resend üzerinden bir test e-postası gönderilsin mi? Toplu gönderim yapılmayacak."))return;
  btn.disabled=true;status.textContent="Resend bağlantısı kontrol ediliyor ve test e-postası gönderiliyor...";
  try{
   const result=await api.broadcastAdmin({action:"resend_test"});
   status.textContent=result.message+" Alıcı: "+result.recipient+" · Sağlayıcı: "+result.provider;
   toast("Resend test e-postası sağlayıcıya iletildi.");
  }catch(err){
   status.textContent=err.message||"Test e-postası gönderilemedi.";
   toast(err.message||"Resend testi başarısız.");
  }finally{btn.disabled=false;}
 });
 let activeBroadcast=null;
 const audienceNames={members:"Doğrulanmış üyeler (hizmet duyurusu)",newsletter:"İzinli bülten aboneleri (kampanya)"};
 const campaignStatusNames={draft:"Taslak",sending:"Gönderiliyor",completed:"Tamamlandı",cancelled:"İptal"};
 let mailLogs=[];
 const mailStatusNames={sent:"Gönderildi",sending:"Gönderiliyor",queued:"Kuyrukta",failed:"Başarısız"};
 function renderMailLog(){
  const q=($("#mailLogSearch")?.value||"").trim().toLocaleLowerCase("tr-TR");
  const status=$("#mailLogStatus")?.value||"";
  const rows=mailLogs.filter(x=>(!status||x.status===status)&&[x.recipient,x.username,x.subject,x.source].join(" ").toLocaleLowerCase("tr-TR").includes(q));
  $("#mailLogBody").innerHTML=rows.map(x=>{
   const stamp=x.sent_at||x.created_at;
   const date=stamp?new Date(stamp).toLocaleString("tr-TR"):"-";
   const statusLabel=mailStatusNames[x.status]||x.status||"-";
   const statusClass=x.status==="sent"?"active":x.status==="failed"?"expired":"pending";
   const detail=x.body?'<details><summary>Mesajı görüntüle</summary><p class="ticket-message">'+esc(x.body)+'</p></details>':x.last_error?'<details><summary>Hata ayrıntısı</summary><p class="ticket-message">'+esc(x.last_error)+'</p></details>':'<span class="muted">İçerik bu eski kayıtta tutulmamış.</span>';
   return '<tr><td><strong>'+esc(x.username||x.recipient||"-")+'</strong>'+(x.username?'<br><small>'+esc(x.recipient)+'</small>':'')+'</td><td>'+esc(x.subject||"-")+'</td><td>'+esc(x.source||"-")+'</td><td><span class="status '+statusClass+'">'+esc(statusLabel)+'</span></td><td>'+esc(date)+'</td><td>'+detail+(x.provider_id?'<br><small>Resend ID: '+esc(x.provider_id)+'</small>':'')+'</td></tr>';
  }).join("")||'<tr><td colspan="6">Bu filtreyle eşleşen e-posta kaydı yok.</td></tr>';
  $("#mailLogSummary").textContent=rows.length+" kayıt gösteriliyor · Son 300 kayıt listelenir.";
 }
 async function loadMailLog(){
  $("#mailLogBody").innerHTML='<tr><td colspan="6">E-posta kayıtları yükleniyor…</td></tr>';
  const result=await api.mailLogAdmin();mailLogs=result.logs||[];renderMailLog();
 }
 $("#mailLogSearch")?.addEventListener("input",renderMailLog);
 $("#mailLogStatus")?.addEventListener("change",renderMailLog);
 $("#reloadMailLog")?.addEventListener("click",()=>loadMailLog().catch(e=>toast(e.message)));
 async function loadBroadcasts(){
  const r=await api.broadcastAdmin({action:"broadcast_list"});
  const rows=r.campaigns||[];
  $("#broadcastsBody").innerHTML=rows.map(x=>'<tr><td><strong>'+esc(x.subject)+'</strong></td><td>'+esc(audienceNames[x.audience]||x.audience)+'</td><td>'+esc(campaignStatusNames[x.status]||x.status)+'</td><td>'+Number(x.recipient_count||0)+'</td><td>'+Number(x.sent_count||0)+'</td><td>'+Number(x.failed_count||0)+'</td><td>'+esc(new Date(x.created_at).toLocaleString("tr-TR"))+'</td><td>'+(x.status==="draft"||x.status==="sending"?'<button class="btn" data-broadcast-resume="'+esc(x.id)+'"> '+(x.status==="draft"?"Taslağı aç":"Devam et")+'</button>':"—")+'</td></tr>').join("")||'<tr><td colspan="8">Henüz toplu e-posta gönderimi yok.</td></tr>';
 }
 $("#broadcastAudience")?.addEventListener("change",()=>{
  const marketing=$("#broadcastAudience").value==="newsletter";
  $("#broadcastAudienceHint").textContent=marketing
   ?"Yalnızca aktif bülten abonelerine gönderilir. E-postaya abonelikten çıkış bağlantısı otomatik eklenir."
   :"Yalnızca e-posta adresi doğrulanmış kayıtlı üyelere hizmet ve güvenlik duyuruları gönderilebilir. Reklam veya kampanya metni kullanmayın.";
 });
 $("#broadcastForm")?.addEventListener("submit",async e=>{
  e.preventDefault();const btn=$("#broadcastPrepare");btn.disabled=true;$("#broadcastFormStatus").textContent="Alıcılar kontrol ediliyor ve taslak hazırlanıyor...";
  try{
   const r=await api.broadcastAdmin({action:"broadcast_prepare",audience:$("#broadcastAudience").value,subject:$("#broadcastSubject").value,message:$("#broadcastMessage").value});
   activeBroadcast=r.campaign;$("#broadcastDraftPanel").hidden=false;$("#broadcastStart").hidden=false;$("#broadcastProcess").hidden=true;
   $("#broadcastDraftSummary").textContent='"'+r.campaign.subject+'" · '+audienceNames[r.campaign.audience]+' · '+Number(r.recipient_count).toLocaleString("tr-TR")+' alıcı. Henüz e-posta gönderilmedi.';
   $("#broadcastProgress").textContent=r.message;$("#broadcastFormStatus").textContent="Taslak oluşturuldu.";
   await loadBroadcasts();
  }catch(err){$("#broadcastFormStatus").textContent=err.message||"Taslak oluşturulamadı.";}
  finally{btn.disabled=false;}
 });
 $("#broadcastStart")?.addEventListener("click",async()=>{
  if(!activeBroadcast)return;
  if(!confirm(activeBroadcast.recipient_count+" alıcıya e-posta gönderimi başlatılsın mı? Bu işlem gerçek e-posta gönderir."))return;
  const btn=$("#broadcastStart");btn.disabled=true;
  try{await api.broadcastAdmin({action:"broadcast_start",campaign_id:activeBroadcast.id});btn.hidden=true;$("#broadcastProcess").hidden=false;$("#broadcastProgress").textContent="Gönderim başladı. Her adımda 5 e-posta gönderilecek.";await loadBroadcasts();}
  catch(err){toast(err.message);btn.disabled=false;}
 });
 $("#broadcastProcess")?.addEventListener("click",async()=>{
  if(!activeBroadcast)return;const btn=$("#broadcastProcess");btn.disabled=true;btn.textContent="Gönderiliyor...";
  try{
   const r=await api.broadcastAdmin({action:"broadcast_process",campaign_id:activeBroadcast.id});
   $("#broadcastProgress").textContent="Bu grup: "+r.sent_now+" başarılı, "+r.failed_now+" başarısız. Toplam: "+r.sent_count+" başarılı, "+r.failed_count+" başarısız. Kalan: "+r.remaining+".";
   if(r.completed){btn.hidden=true;$("#broadcastStart").hidden=true;$("#broadcastProgress").textContent+=" Gönderim tamamlandı.";}
   await loadBroadcasts();
  }catch(err){toast(err.message);}
  finally{btn.disabled=false;btn.textContent="Sonraki 5 kişiye gönder";}
 });
 $("#reloadBroadcasts")?.addEventListener("click",()=>loadBroadcasts().catch(e=>toast(e.message)));

 let aiEntries=[];
 function renderAiKnowledge(){
  const q=($("#aiKnowledgeSearch")?.value||"").trim().toLocaleLowerCase("tr-TR");
  const rows=aiEntries.filter(x=>[x.title,x.category,x.content,(x.keywords||[]).join(" ")].join(" ").toLocaleLowerCase("tr-TR").includes(q));
  $("#aiKnowledgeBody").innerHTML=rows.map(x=>'<tr><td><strong>'+esc(x.title)+'</strong><br><small>'+esc((x.content||"").slice(0,150))+(x.content?.length>150?"…":"")+'</small></td><td>'+esc(x.category)+'</td><td><span class="status '+(x.is_active?"active":"expired")+'">'+(x.is_active?"Aktif":"Pasif")+'</span></td><td>'+esc(x.updated_at?new Date(x.updated_at).toLocaleString("tr-TR"):"-")+'</td><td><button class="btn" data-ai-edit="'+esc(x.id)+'">Düzenle</button> <button class="btn" data-ai-toggle="'+esc(x.id)+'">'+(x.is_active?"Pasifleştir":"Aktifleştir")+'</button> <button class="btn danger" data-ai-delete="'+esc(x.id)+'">Sil</button></td></tr>').join("")||'<tr><td colspan="5">Henüz öğretilmiş bilgi yok.</td></tr>';
  $("#aiStatTotal").textContent=aiEntries.length;$("#aiStatActive").textContent=aiEntries.filter(x=>x.is_active).length;
 }
 async function loadAiKnowledge(){
  $("#aiKnowledgeBody").innerHTML='<tr><td colspan="5">Bilgi havuzu yükleniyor…</td></tr>';
  const r=await api.aiKnowledge({action:"list"});aiEntries=r.entries||[];renderAiKnowledge();
  $("#aiSystemInstructions").value=r.settings?.system_instructions||"";
  $("#aiProviderStatus").textContent="Testte kontrol edilecek";
 }
 function resetAiForm(){const f=$("#aiKnowledgeForm");f.reset();f.elements.id.value="";f.elements.is_active.checked=true;$("#aiFormStatus").textContent="Yeni bilgi eklemeye hazır.";}
 $("#aiKnowledgeForm")?.addEventListener("submit",async e=>{
  e.preventDefault();const f=e.currentTarget,fd=new FormData(f),btn=$("#aiSaveBtn");btn.disabled=true;$("#aiFormStatus").textContent="Kaydediliyor…";
  try{
   const r=await api.aiKnowledge({action:"save",id:String(fd.get("id")||"")||null,title:fd.get("title"),category:fd.get("category"),content:fd.get("content"),keywords:String(fd.get("keywords")||"").split(",").map(x=>x.trim()).filter(Boolean),is_active:fd.get("is_active")==="on"});
   $("#aiFormStatus").textContent=r.message;toast(r.message);resetAiForm();await loadAiKnowledge();
  }catch(err){$("#aiFormStatus").textContent=err.message;toast(err.message);}
  finally{btn.disabled=false;}
 });
 $("#aiResetBtn")?.addEventListener("click",resetAiForm);
 $("#aiReload")?.addEventListener("click",()=>loadAiKnowledge().catch(e=>toast(e.message)));
 $("#aiSyncAll")?.addEventListener("click",async()=>{
  const btn=$("#aiSyncAll"),status=$("#aiSyncStatus");
  btn.disabled=true;status.textContent="Aktif kayıtlar vektörleştiriliyor; pasif ve silinmiş kayıtlar temizleniyor…";
  try{
   const r=await api.aiKnowledge({action:"sync_all"});
   status.textContent=(r.message||"Eşitleme tamamlandı.")+" Eşitlenen: "+r.synced+" · Temizlenen: "+r.removed;
   toast(status.textContent);
  }catch(err){status.textContent="Eşitleme başarısız: "+err.message;toast(err.message);}
  finally{btn.disabled=false;}
 });
 $("#aiKnowledgeSearch")?.addEventListener("input",renderAiKnowledge);
 $("#aiKnowledgeBody")?.addEventListener("click",async e=>{
  const edit=e.target.closest("[data-ai-edit]"),toggle=e.target.closest("[data-ai-toggle]"),del=e.target.closest("[data-ai-delete]");
  const item=aiEntries.find(x=>x.id===(edit?.dataset.aiEdit||toggle?.dataset.aiToggle||del?.dataset.aiDelete));if(!item)return;
  if(edit){const f=$("#aiKnowledgeForm");f.elements.id.value=item.id;f.elements.title.value=item.title;f.elements.category.value=item.category;f.elements.content.value=item.content;f.elements.keywords.value=(item.keywords||[]).join(", ");f.elements.is_active.checked=item.is_active;$("#aiFormStatus").textContent="Düzenleme: "+item.title;f.scrollIntoView({behavior:"smooth",block:"center"});return;}
  if(del){if(!confirm('"'+item.title+'" bilgi kaydı kalıcı olarak silinsin mi?'))return;try{await api.aiKnowledge({action:"delete",id:item.id});toast("Bilgi silindi.");await loadAiKnowledge();}catch(err){toast(err.message);}return;}
  if(toggle){try{await api.aiKnowledge({action:"save",id:item.id,title:item.title,category:item.category,content:item.content,keywords:item.keywords||[],is_active:!item.is_active});toast("Bilgi durumu güncellendi.");await loadAiKnowledge();}catch(err){toast(err.message);}}
 });
 $("#aiSaveInstructions")?.addEventListener("click",async()=>{
  const btn=$("#aiSaveInstructions");btn.disabled=true;$("#aiInstructionsStatus").textContent="Kaydediliyor…";
  try{const r=await api.aiKnowledge({action:"settings_save",system_instructions:$("#aiSystemInstructions").value});$("#aiInstructionsStatus").textContent=r.message;toast(r.message);}
  catch(err){$("#aiInstructionsStatus").textContent=err.message;toast(err.message);}
  finally{btn.disabled=false;}
 });
 $("#aiTestBtn")?.addEventListener("click",async()=>{
  const btn=$("#aiTestBtn"),out=$("#aiTestResult"),question=$("#aiTestQuestion").value.trim();if(!question){toast("Önce test sorusunu yaz.");return;}
  btn.disabled=true;out.textContent="Bilgi havuzu taranıyor ve cevap hazırlanıyor…";
  try{
   const r=await api.aiKnowledge({action:"test",question});
   if(!r.configured){$("#aiProviderStatus").textContent="API anahtarı eksik";out.innerHTML='<strong>Bilgi havuzu bağlantısı çalışıyor.</strong><p>'+esc(r.message)+'</p><p>Eşleşen kayıt: '+r.retrieved+'</p>'+(r.sources||[]).map(s=>'<div class="ai-source">• '+esc(s.title)+' · '+esc(s.source||s.category||"")+'</div>').join("");}
   else{$("#aiProviderStatus").textContent="Bağlı";out.innerHTML='<div class="ai-answer">'+esc(r.answer).replace(/\n/g,"<br>")+'</div><h3>Kullanılan bilgi kaynakları</h3>'+(r.sources||[]).map(s=>'<div class="ai-source">• '+esc(s.title)+' · '+esc(s.source||s.category||"")+'</div>').join("")||'<p class="muted">Eşleşen kayıt bulunmadı.</p>';}
  }catch(err){out.textContent=err.message;toast(err.message);}
  finally{btn.disabled=false;}
 });

 let aiChatLogs=[];
 function renderAiChatLogs(){
  const q=($("#aiChatLogsSearch")?.value||"").trim().toLocaleLowerCase("tr-TR"),uid=$("#aiChatLogsUser")?.value||"";
  const rows=aiChatLogs.filter(x=>(!uid||x.user_id===uid)&&[x.user?.username,x.user?.email,x.question,x.answer].join(" ").toLocaleLowerCase("tr-TR").includes(q));
  $("#aiChatLogsBody").innerHTML=rows.map(x=>'<tr><td><strong>'+esc(x.user?.username||"Bilinmeyen üye")+'</strong><br><small>'+esc(x.user?.email||"")+'</small></td><td>'+esc(x.question.slice(0,180))+(x.question.length>180?"…":"")+'</td><td>'+esc(x.answer.slice(0,180))+(x.answer.length>180?"…":"")+'</td><td>'+esc(new Date(x.created_at).toLocaleString("tr-TR"))+'</td><td><button class="btn" data-ai-chat-detail="'+esc(x.id)+'">Görüntüle</button></td></tr>').join("")||'<tr><td colspan="5">Eşleşen sohbet kaydı yok.</td></tr>';
  $("#aiChatLogsStatus").textContent=rows.length+" kayıt gösteriliyor · Toplam "+aiChatLogs.length+" kayıt";
 }
 async function loadAiChatLogs(){
  $("#aiChatLogsStatus").textContent="Sohbet geçmişi yükleniyor…";
  const r=await api.portalAdmin({action:"admin_ai_chat_logs"});aiChatLogs=r.logs||[];
  const select=$("#aiChatLogsUser"),prev=select.value,users=[...new Map(aiChatLogs.map(x=>[x.user_id,x.user]).filter(x=>x[1])).entries()];
  select.innerHTML='<option value="">Tüm üyeler</option>'+users.map(([id,u])=>'<option value="'+esc(id)+'">'+esc(u.username||u.email||"Üye")+' · '+esc(u.email||"")+'</option>').join("");
  if(users.some(([id])=>id===prev))select.value=prev;renderAiChatLogs();
 }
 $("#adminNav [data-view=\"ai\"]")?.addEventListener("click",()=>loadAiChatLogs().catch(e=>{$("#aiChatLogsStatus").textContent=e.message}));
 $("#aiChatLogsReload")?.addEventListener("click",()=>loadAiChatLogs().catch(e=>{$("#aiChatLogsStatus").textContent=e.message;toast(e.message)}));
 $("#aiChatLogsSearch")?.addEventListener("input",renderAiChatLogs);$("#aiChatLogsUser")?.addEventListener("change",renderAiChatLogs);
 $("#aiChatLogsBody")?.addEventListener("click",e=>{const b=e.target.closest("[data-ai-chat-detail]");if(!b)return;const x=aiChatLogs.find(v=>v.id===b.dataset.aiChatDetail);if(!x)return;const box=$("#aiChatLogDetail");box.hidden=false;box.innerHTML='<h3>'+esc(x.user?.username||"Üye")+' · '+esc(x.user?.email||"")+'</h3><p><strong>Soru</strong></p><div class="ai-answer">'+esc(x.question).replace(/\n/g,"<br>")+'</div><p><strong>Yapay zekâ yanıtı</strong></p><div class="ai-answer">'+esc(x.answer).replace(/\n/g,"<br>")+'</div><p class="muted">Model: '+esc(x.model||"-")+' · '+esc(new Date(x.created_at).toLocaleString("tr-TR"))+'</p><h3>Kullanılan kaynaklar</h3>'+(x.sources||[]).map(s=>'<div class="ai-source">• '+esc(s.title)+' · '+esc(s.source)+'</div>').join("")||'<p class="muted">Kaynak kaydı yok.</p>';box.scrollIntoView({behavior:"smooth",block:"center"})});

 checkSession().catch(e=>toast(e.message));
})();
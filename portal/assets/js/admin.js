(() => {
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const api=window.UzmantechAPI;
 let users=[];
 let payments=[];
 let tickets=[];
 let archiveFiles=[];
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const toast=m=>{const e=$("#toast");e.textContent=m;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),3200)};
 function navigate(id){$$(".view").forEach(v=>v.classList.toggle("active",v.id===id));$$("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===id));$("#breadcrumb").textContent=id==="siteMetrics"?"Site İstatistikleri":id==="users"?"Üyeler ve Lisanslar":id==="payments"?"Ödeme Bildirimleri":id==="support"?"Destek Talepleri":id==="email"?"Toplu E-posta":id==="archive"?"Dosya Arşivi Yönetimi":id==="content"?"Site İçeriği":"Genel Bakış";if(id==="email")loadBroadcasts().catch(e=>toast(e.message));if(id==="siteMetrics")loadSiteMetrics().catch(e=>toast(e.message));if(id==="payments")loadPayments().catch(e=>toast(e.message));if(id==="support")loadSupport().catch(e=>toast(e.message));if(id==="archive")loadArchiveFiles().catch(e=>toast(e.message));$("#sidebar").classList.remove("open");}
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
   const user=p.user||{},date=p.created_at?new Date(p.created_at).toLocaleString("tr-TR"):"-";
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
   const actionButtons=u.status==="pending"
    ?'<button class="btn" data-action="activate" data-id="'+esc(u.id)+'">Onayla + lisans ver</button> <button class="btn" data-action="disable" data-id="'+esc(u.id)+'">Reddet</button>'
    :u.status==="disabled"
     ?'<button class="btn" data-action="activate" data-id="'+esc(u.id)+'">Aktif Et</button>'
     :'<button class="btn" data-action="extend" data-id="'+esc(u.id)+'">Süre uzat</button> <button class="btn" data-action="disable" data-id="'+esc(u.id)+'">Pasifleştir</button>';
   const buttons=actionButtons+' <button class="btn danger" data-action="delete" data-id="'+esc(u.id)+'">Sil</button>';
   const css=u.status==="active"?(remaining!==null&&remaining<=0?"expired":"active"):u.status==="pending"?"pending":"expired";
   const emailState=u.email_verified===false?'<br><small class="muted">E-posta doğrulanmadı</small>':'';
   return '<tr><td>'+esc(u.username)+'</td><td>'+esc(u.email)+emailState+'</td><td><span class="status '+css+'">'+esc(status)+'</span></td><td>'+esc(dateText)+'<br><small>'+esc(plan)+' · '+esc(remainingText)+'</small></td><td>'+buttons+'</td></tr>';
  }).join("")||'<tr><td colspan="5">Kayıt bulunamadı.</td></tr>';
 }
 async function loadUsers(){
  $("#usersBody").innerHTML='<tr><td colspan="5">Kullanıcılar yükleniyor…</td></tr>';
  const result=await adminCall("list");users=result.users||[];renderUsers();
  const now=Date.now(),active=users.filter(u=>u.status==="active"),pending=users.filter(u=>u.status==="pending"),expired=active.filter(u=>u.expiry_date&&new Date(u.expiry_date).getTime()<=now);
  $("#statTotal").textContent=users.length;$("#statActive").textContent=active.length;$("#statPending").textContent=pending.length;$("#statExpired").textContent=expired.length;
 }
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
   const answer=prompt(u.username+" için kaç günlük lisans verilsin?",action==="activate"?"365":"30");
   if(answer===null)return;days=Number(answer);
   if(!Number.isInteger(days)||days<1||days>3650){toast("1 ile 3650 arasında gün gir.");return;}
  }
  const label=action==="activate"?"lisans verilsin":action==="extend"?"üyelik süresi uzatılsın":"hesap pasifleştirilsin";
  if(!confirm(u.username+" hesabı için "+label+" mı?"))return;
  btn.disabled=true;
  try{const result=await adminCall(action,{user_id:id,...(action==="activate"||action==="extend"?{days}:{})});toast(result.message||"İşlem tamamlandı.");await loadDashboard();}
  catch(err){toast(err.message);}
  finally{btn.disabled=false;}
 });

 let activeBroadcast=null;
 const audienceNames={members:"Doğrulanmış üyeler (hizmet duyurusu)",newsletter:"İzinli bülten aboneleri (kampanya)"};
 const campaignStatusNames={draft:"Taslak",sending:"Gönderiliyor",completed:"Tamamlandı",cancelled:"İptal"};
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
 checkSession().catch(e=>toast(e.message));
})();
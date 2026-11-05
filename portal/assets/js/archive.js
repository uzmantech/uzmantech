(()=>{const $=s=>document.querySelector(s);const toast=m=>{const el=$("#toast");if(!el)return;el.textContent=m;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)};function showLogin(){$("#modalTitle").textContent="Üye girişi";$("#modalBody").innerHTML='<form id="loginForm"><label class="field"><span>Kullanıcı adı veya e-posta</span><input name="identifier" autocomplete="username" required></label><label class="field"><span>Şifre</span><input name="password" type="password" autocomplete="current-password" required></label><button class="button button-primary" type="submit" style="width:100%">Giriş Yap</button></form>';$("#modal").classList.add("open");$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{const r=await UzmantechAPI.login({identifier:f.get("identifier"),password:f.get("password")});UzmantechAPI.setSession(r.session_token);$("#modal").classList.remove("open");toast("Giriş başarılı.");}catch(err){toast(err.message||"Giriş yapılamadı.");}})}document.addEventListener("click",e=>{if(e.target.closest('[data-open="login"]'))showLogin();if(e.target.id==="modalClose"||e.target.id==="modal")$("#modal").classList.remove("open");if(e.target.id==="menuToggle")$(".archive-top-actions")?.classList.toggle("open")});document.addEventListener("keydown",e=>{if(e.key==="Escape")$("#modal").classList.remove("open")});
let archiveItems=[],selectedDevice=null;
const archiveEsc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const archiveCategory={firmware:"Firmware",eng:"ENG",imei:"IMEI",test_point:"Test Point",resistor:"Direnç",usb:"USB Sürücüleri",other:"Diğer"};
function filteredArchiveItems(){
 const q=($("#archiveQuery")?.value||"").trim().toLocaleLowerCase("tr-TR");
 const brand=window.archiveSelectedBrand||"";
 return archiveItems.filter(f=>(!brand||f.brand===brand)&&[f.title,f.brand,f.model,f.category,f.description].join(" ").toLocaleLowerCase("tr-TR").includes(q));
}
function renderLiveArchive(){
 const grid=$("#archiveLiveGrid"),count=$("#archiveFileCount"),head=$(".archive-live-head");
 const list=filteredArchiveItems();
 if(selectedDevice){
  const deviceItems=list.filter(f=>f.brand===selectedDevice.brand&&f.model===selectedDevice.model);
  count.textContent=deviceItems.length+" DOSYA";
  head.querySelector("h2").textContent=selectedDevice.model;
  head.querySelector("p").textContent=selectedDevice.brand+" cihazı için arşiv dosyaları";
  grid.innerHTML='<button type="button" class="archive-back-devices" id="archiveBackDevices">← Tüm cihazlara dön</button>'+deviceItems.map(f=>'<article class="archive-live-card"><div class="archive-live-card-top"><span>'+archiveEsc(f.brand)+'</span><small>'+archiveEsc(archiveCategory[f.category]||f.category)+'</small></div><h3>'+archiveEsc(f.title)+'</h3><p class="archive-live-model">'+archiveEsc(f.model||"Model belirtilmemiş")+'</p><p class="archive-live-description">'+archiveEsc(f.description||"Teknik dosya açıklaması eklenmemiş.")+'</p><div class="archive-live-meta"><span>'+archiveEsc(f.original_filename||"Dosya")+'</span><span>'+archiveEsc(f.created_at?new Date(f.created_at).toLocaleDateString("tr-TR"):"")+'</span></div><button type="button" class="archive-live-download" data-archive-download="'+archiveEsc(f.id)+'">İndir</button></article>').join("")||'<p class="archive-live-empty">Bu cihaz için eşleşen dosya bulunamadı.</p>';
  return;
 }
 head.querySelector("h2").textContent="Cihaz modelleri";
 head.querySelector("p").textContent="Dosyalarını görüntülemek istediğiniz cihazı seçin.";
 const devices=[...new Map(list.filter(f=>f.model).map(f=>[f.brand+"::"+f.model,{brand:f.brand,model:f.model,count:list.filter(x=>x.brand===f.brand&&x.model===f.model).length}])).values()];
 count.textContent=devices.length+" CİHAZ";
 grid.innerHTML=devices.map(d=>'<button type="button" class="archive-device-card" data-device-brand="'+archiveEsc(d.brand)+'" data-device-model="'+archiveEsc(d.model)+'"><span class="archive-device-icon" aria-hidden="true">▦</span><strong>'+archiveEsc(d.model)+'</strong><small>'+archiveEsc(d.brand)+'</small><em>'+d.count+' dosya</em></button>').join("")||'<p class="archive-live-empty">Henüz bu filtreye uygun cihaz modeli eklenmemiş.</p>';
}
async function loadLiveArchive(){
 try{const result=await UzmantechAPI.archiveFiles();archiveItems=result.files||[];renderLiveArchive();}
 catch(err){$("#archiveLiveGrid").innerHTML='<p class="archive-live-empty">Arşiv şu anda yüklenemiyor. Lütfen sayfayı yenileyin.</p>';$("#archiveFileCount").textContent="";console.error(err);}
}
$("#archiveSearchForm")?.addEventListener("submit",e=>{e.preventDefault();selectedDevice=null;renderLiveArchive();document.querySelector("#new-files")?.scrollIntoView({behavior:"smooth"});});
$("#archiveQuery")?.addEventListener("input",()=>{selectedDevice=null;renderLiveArchive();});
document.querySelectorAll(".archive-brand-list button").forEach(btn=>btn.addEventListener("click",()=>{const label=btn.querySelector("b")?.textContent?.trim()||"";window.archiveSelectedBrand=window.archiveSelectedBrand===label?"":label;selectedDevice=null;document.querySelectorAll(".archive-brand-list button").forEach(x=>x.classList.toggle("active",x===btn&&window.archiveSelectedBrand===label));renderLiveArchive();document.querySelector("#new-files")?.scrollIntoView({behavior:"smooth"});}));
document.addEventListener("click",async e=>{
 const device=e.target.closest("[data-device-model]");
 if(device){selectedDevice={brand:device.dataset.deviceBrand,model:device.dataset.deviceModel};renderLiveArchive();return;}
 if(e.target.id==="archiveBackDevices"){selectedDevice=null;renderLiveArchive();return;}
 const btn=e.target.closest("[data-archive-download]");if(!btn)return;
 const id=btn.dataset.archiveDownload;btn.disabled=true;
 const tab=window.open("about:blank","_blank");
 try{const result=await UzmantechAPI.archiveFileDownload(id);if(tab)tab.location=result.url;else window.location.href=result.url;}
 catch(err){if(tab)tab.close();toast(err.message||"İndirme bağlantısı alınamadı.");if(/giriş|üyelik/i.test(err.message||""))showLogin();}
 finally{btn.disabled=false;}
});
loadLiveArchive();
})();
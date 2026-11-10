(()=>{const $=s=>document.querySelector(s);const main=$(".dash-content");if(!main)return;
const layout=$(".dash-layout"),download=$("#download"),account=$("#accountPage");
const primary=$(".dash-primary"),license=$("#license"),support=$("#support"),announcements=$("#announcements"),premium=$("#premium"),packages=$("#packages"),welcome=$(".welcome-card");
const make=(id,title,sub)=>{const el=document.createElement("section");el.className="portal-page";el.dataset.pageView=id;el.innerHTML='<div class="portal-page-heading"><span class="eyebrow">UZMANTOOL PORTAL</span><h1>'+title+'</h1><p>'+sub+'</p></div>';const footer=main.querySelector(".dash-footer");if(footer)main.insertBefore(el,footer);else main.appendChild(el);return el;};
const home=make("home","Ana Sayfa","Hesabınızın ve Uzmantool hizmetlerinin genel görünümü.");home.querySelector(".portal-page-heading")?.remove();home.prepend(layout);
home.insertAdjacentHTML("beforeend",'<section class="home-latest-news"><div class="home-latest-heading"><div><span>TEKNOLOJİ GÜNDEMİ</span><h2>En yeni haberler</h2><p>Yayınlanan son teknoloji haberleri.</p></div><a href="#updates" data-page="updates">Tüm haberleri gör <b>↗</b></a></div><div class="home-latest-grid" id="homeLatestNewsGrid"><div class="home-news-loading">Son haberler yükleniyor…</div></div></section>');

const dl=make("download","Uzmantech İndir","Windows masaüstü uygulamasının resmî indirme merkezi.");dl.appendChild(download);
const lic=make("license","Lisans Aktivasyonu","Uzmantool lisansınızı güvenle etkinleştirin veya yeni lisans satın alın.");
lic.classList.add("license-page","license-reference-layout");
lic.insertAdjacentHTML("beforeend",'<div class="activation-hero"><div class="activation-copy"><div class="activation-brandline"><span>UZMANTOOL</span><i></i></div><h2>Lisans <em>Aktivasyonu</em></h2><p>Uzmantool’u tüm özellikleriyle kullanmak için lisansınızı aktive edin veya yeni lisans satın alın.</p><div class="activation-benefits"><div class="activation-benefit"><span class="activation-icon">♢</span><div><b>Güvenli ve Hızlı Aktivasyon</b><small>Lisansınız anında aktif olur.</small></div></div><div class="activation-benefit"><span class="activation-icon">∞</span><div><b>Esnek Lisans Seçenekleri</b><small>Günlük, aylık ve yıllık planlar.</small></div></div><div class="activation-benefit"><span class="activation-icon">⟳</span><div><b>Sürekli Güncel Sürüm</b><small>Lisans süresince tüm güncellemeler ücretsiz.</small></div></div></div></div><div class="activation-product" aria-label="Uzmantool lisans kutusu"><div class="activation-product-glow"></div><div class="activation-product-box"><div class="activation-box-side">UZMANTOOL</div><div class="activation-box-front"><img src="assets/logo.svg" alt="Uzmantool"><b>Uzmantool</b><small>Mobil Servis Çözümleri<br>Platformu</small><div class="activation-platforms"><span>●</span><span>●</span><span>▦</span></div></div></div><div class="activation-platform-ring"></div></div><div class="activation-panel"><div class="activation-panel-title"><span class="activation-key-icon">⚿</span><h3>Lisans Aktivasyonu</h3></div><p>Satın aldığınız lisans anahtarını girerek uygulamanızı aktive edin.</p><label class="activation-input-wrap"><span>⚿</span><input id="licenseKeyInput" type="text" placeholder="Lisans Anahtarınızı Girin" autocomplete="off" spellcheck="false"></label><button class="activation-submit" id="licenseActivateBtn" type="button"><span>✓</span> Lisansı Aktive Et</button><div class="activation-or"><i></i><span>veya</span><i></i></div><button class="activation-buy" type="button" data-open="plans"><span>🛒</span> Yeni Lisans Satın Al <b>›</b></button><small class="activation-note" id="activationNote" aria-live="polite"></small></div></div>');
if(license){license.classList.add("license-status-card");lic.appendChild(license);}
lic.insertAdjacentHTML("beforeend",'<div class="activation-feature-grid"><article><span>ϟ</span><div><b>Hızlı Aktivasyon</b><small>Saniyeler içinde kullanıma hazır.</small></div></article><article><span>♢</span><div><b>Güvenli Lisans</b><small>Cihazınıza özel, güvenli ve stabil.</small></div></article><article><span>⟳</span><div><b>Ücretsiz Güncellemeler</b><small>Lisans süresince tüm yeni sürümler.</small></div></article><article><span>♧</span><div><b>Teknik Destek</b><small>Satın alma ve aktivasyon sonrası destek.</small></div></article></div>');
if(packages){packages.classList.add("license-packages-section");lic.appendChild(packages);}



const upd=make("updates","Haberler","Uzmantech dünyasından haberler, ürün duyuruları ve sürüm notları.");
upd.classList.add("updates-page","news-page");
upd.innerHTML+=`
<section class="news-auto-feed news-only-feed">
 <div class="news-section-heading"><div><span class="news-section-kicker">LATEST TECHNOLOGY</span><h3>Son eklenen haberler</h3><p>Yeni yayınlanan teknoloji haberleri en üstte gösterilir.</p></div><span class="news-section-count" id="newsFeedUpdated">AKIŞ YÜKLENİYOR</span></div>
 <div class="news-card-grid" id="autoTechNewsGrid" aria-live="polite"><article class="news-card"><div class="news-card-body"><p>Teknoloji haberleri yükleniyor…</p></div></article></div>
 <p class="news-feed-disclaimer">Haber başlıkları ve kısa açıklamalar ilgili yayıncıların RSS akışlarından alınır. Özgün içerik ve tüm hakları kaynak yayıncıya aittir.</p>
</section>
<section class="news-newsletter">
 <div class="newsletter-orb" aria-hidden="true"></div><div class="newsletter-copy"><span class="news-section-kicker">UZMANTECH NEWSLETTER</span><h3>Teknoloji gündemi<br><em>e-posta kutunuzda.</em></h3><p>Yeni teknoloji haberleri ve önemli gelişmeler yayınlandığında e-posta ile haberdar olun.</p><small>İstediğiniz zaman abonelikten çıkabilirsiniz.</small></div>
 <form class="newsletter-form" id="newsNewsletterForm"><label for="newsNewsletterEmail">E-posta adresiniz</label><div class="newsletter-input-row"><input id="newsNewsletterEmail" name="email" type="email" placeholder="ornek@eposta.com" autocomplete="email" required maxlength="254"><button type="submit">Abone ol <b>↗</b></button></div><input class="newsletter-honey" type="text" name="company" tabindex="-1" autocomplete="off" aria-hidden="true"><label class="newsletter-consent"><input type="checkbox" required><span>Yeni haberler ve Uzmantech duyuruları için e-posta almayı kabul ediyorum.</span></label><p class="newsletter-feedback" id="newsNewsletterFeedback" role="status" aria-live="polite"></p></form>
</section>`;
const newsEsc=value=>String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
async function loadHomeLatestNews(){
 const grid=home.querySelector("#homeLatestNewsGrid");
 if(!grid||!window.UzmantechAPI?.news)return;
 try{
  const result=await window.UzmantechAPI.news({limit:"4"});
  const items=Array.isArray(result.news)?result.news.slice(0,4):[];
  if(!items.length){grid.innerHTML='<p class="home-news-loading">Henüz haber bulunmuyor.</p>';return;}
  grid.innerHTML=items.map((item,index)=>{
   const title=newsEsc(item.title),summary=newsEsc(item.summary||item.title),source=newsEsc(item.source_name);
   const slug=encodeURIComponent(String(item.slug||""));
   const image=String(item.image_url||"");
   const safeImage=/^https:\/\//i.test(image)?newsEsc(image):"";
   const date=item.published_at?new Date(item.published_at):null;
   const dateText=date&&!Number.isNaN(date.getTime())?date.toLocaleDateString("tr-TR",{day:"numeric",month:"short",year:"numeric"}):"Güncel";
   return '<article class="home-latest-card"><a class="home-latest-image" href="/haber/'+slug+'">'+(safeImage?'<img src="'+safeImage+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'<span class="home-news-fallback">TECH<br><b>0'+(index+1)+'</b></span>')+'<span class="home-latest-source">'+source+'</span></a><div class="home-latest-copy"><small>'+dateText+'</small><h3><a href="/haber/'+slug+'">'+title+'</a></h3><p>'+summary+'</p><a class="home-latest-read" href="/haber/'+slug+'">Haberi oku <b>→</b></a></div></article>';
  }).join("");
 }catch(error){console.warn("Homepage news could not be loaded",error);grid.innerHTML='<p class="home-news-loading">Haberler şu anda yüklenemiyor.</p>';}
}
loadHomeLatestNews();
async function loadAutoTechNews(){
 const grid=upd.querySelector("#autoTechNewsGrid"),stamp=upd.querySelector("#newsFeedUpdated");
 if(!grid||!window.UzmantechAPI?.news)return;
 try{
  const result=await window.UzmantechAPI.news({limit:"18"});
  const items=Array.isArray(result.news)?result.news:[];
  if(!items.length){grid.innerHTML='<article class="news-card"><div class="news-card-body"><p>Henüz yayınlanmış teknoloji haberi bulunmuyor.</p></div></article>';return;}
  grid.innerHTML=items.map((item,index)=>{
   const title=newsEsc(item.title),summary=newsEsc(item.summary||item.title),source=newsEsc(item.source_name);
   const slug=encodeURIComponent(String(item.slug||""));
   const category=newsEsc(item.category||"TEKNOLOJİ").toLocaleUpperCase("tr-TR");
   const rawImage=String(item.image_url||"");
   const imageUrl=/^https:\/\//i.test(rawImage)?newsEsc(rawImage):"";
   const date=item.published_at?new Date(item.published_at):null;
   const dateText=date&&!Number.isNaN(date.getTime())?date.toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"}):"Güncel";
   const art=imageUrl?'<img src="'+imageUrl+'" alt="" loading="lazy" referrerpolicy="no-referrer">':"";
   return '<a class="news-card" href="/haber/'+slug+'" aria-label="'+title+' haberini oku"><div class="news-card-art '+(imageUrl?'has-image':'')+'">'+art+'<div class="news-art-top"><span>'+category+'</span><span>TECH / FEED</span></div><span class="news-art-index">UZMANTECH&nbsp; / &nbsp;'+String(index+1).padStart(2,"0")+'</span><b class="news-art-mark">01</b></div><div class="news-card-body"><span class="news-category-tag">'+source+'</span><h4>'+title+'</h4><p>'+summary+'</p><div class="news-featured-meta"><span>'+dateText+'</span><span>•</span><span>Kaynak haber</span></div><span class="news-card-link">Haberi oku <b>→</b></span></div></a>';
  }).join("");
  if(stamp)stamp.textContent=items.length+" HABER / GÜNCEL";
 }catch(error){
  console.warn("Technology news could not be loaded",error);
  grid.innerHTML='<article class="news-card"><div class="news-card-body"><p>Haber akışı şu anda yüklenemiyor. Lütfen daha sonra tekrar deneyin.</p></div></article>';
  if(stamp)stamp.textContent="AKIŞA ULAŞILAMADI";
 }
}
let autoTechNewsLoaded=false;
upd.querySelector("#newsNewsletterForm")?.addEventListener("submit",async e=>{
 e.preventDefault();
 const form=e.currentTarget,email=form.querySelector("#newsNewsletterEmail"),feedback=form.querySelector("#newsNewsletterFeedback"),button=form.querySelector('button[type="submit"]');
 if(!email?.value.trim()||!form.querySelector('input[type="checkbox"]')?.checked)return;
 button.disabled=true;button.textContent="Kaydediliyor…";feedback.textContent="";
 try{
  const result=await window.UzmantechAPI.newsletterSubscribe({email:email.value,company:form.querySelector('[name="company"]')?.value||""});
  feedback.textContent=result.message||"Aboneliğiniz kaydedildi.";feedback.dataset.state="success";form.reset();
 }catch(error){feedback.textContent=error.message||"Abonelik kaydedilemedi. Lütfen tekrar deneyin.";feedback.dataset.state="error";}
 finally{button.disabled=false;button.innerHTML='Abone ol <b>↗</b>';}
});




const ann=make("announcements","Duyurular","Uzmantool ve Uzmantech ile ilgili önemli bilgilendirmeler.");if(announcements)ann.appendChild(announcements);
const help=make("help","Destek","Bağımsız destek merkezi.");
help.classList.add("help-center-page");
help.innerHTML='<div class="notice">Destek merkezine yönlendiriliyorsunuz...</div>';
const pages=[...main.querySelectorAll("[data-page-view]")];
function show(id,update=true){const key=pages.some(p=>p.dataset.pageView===id)?id:"home";pages.forEach(p=>p.hidden=p.dataset.pageView!==key);document.body.classList.toggle("account-view",key==="account");document.querySelectorAll(".dash-nav [data-page],.activation-site-header [data-page]").forEach(a=>a.classList.toggle("active",a.dataset.page===key));try{sessionStorage.setItem("uzmantech_portal_active_page",key);}catch{}if(update){history.replaceState(null,"",location.pathname+location.search);}window.scrollTo({top:0,behavior:"instant"});if(key==="updates"&&!autoTechNewsLoaded){autoTechNewsLoaded=true;loadAutoTechNews();}}
document.addEventListener("click",e=>{const a=e.target.closest("[data-page]");if(!a)return;e.preventDefault();show(a.dataset.page);});
document.addEventListener("portal:show-account",()=>show("account"));
document.addEventListener("click",e=>{if(e.target.closest("#activationAccountLink"))document.dispatchEvent(new CustomEvent("portal:show-account"));});
document.addEventListener("click",function(e){
  if(e.target.closest("#licenseActivateBtn")){
    const input=document.getElementById("licenseKeyInput");
    const note=document.getElementById("activationNote");
    if(!input||!note)return;
    if(!input.value.trim()){note.textContent="Lütfen lisans anahtarınızı girin.";input.focus();return;}
    note.textContent="Lisans anahtarı doğrulama servisi henüz portala bağlanmadı. Mevcut lisans işlemleri için hesabınıza giriş yapabilirsiniz.";
  }
});
window.UzmantoolPages={show};
const forceHome=new URLSearchParams(location.search).get("view")==="home";let initialPage="home";if(forceHome){try{sessionStorage.removeItem("uzmantech_portal_active_page");}catch{}initialPage="home";}else{try{initialPage=location.hash.slice(1)||sessionStorage.getItem("uzmantech_portal_active_page")||"home";}catch{initialPage=location.hash.slice(1)||"home";}}
show(initialPage,false);
if(initialPage==="account") document.dispatchEvent(new CustomEvent("portal:show-account"));
window.addEventListener("hashchange",()=>{
 const target=location.hash.slice(1)||"home";
 show(target,false);
 if(target==="account") document.dispatchEvent(new CustomEvent("portal:show-account"));
});
})();
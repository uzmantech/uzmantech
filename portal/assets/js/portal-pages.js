(()=>{const $=s=>document.querySelector(s);const main=$(".dash-content");if(!main)return;
const layout=$(".dash-layout"),download=$("#download"),account=$("#accountPage");
const primary=$(".dash-primary"),license=$("#license"),support=$("#support"),announcements=$("#announcements"),premium=$("#premium"),packages=$("#packages"),welcome=$(".welcome-card");
const make=(id,title,sub)=>{const el=document.createElement("section");el.className="portal-page";el.dataset.pageView=id;el.innerHTML='<div class="portal-page-heading"><span class="eyebrow">UZMANTOOL PORTAL</span><h1>'+title+'</h1><p>'+sub+'</p></div>';main.appendChild(el);return el;};
const home=make("home","Ana Sayfa","Hesabınızın ve Uzmantool hizmetlerinin genel görünümü.");home.querySelector(".portal-page-heading")?.remove();home.prepend(layout);
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
<section class="news-masthead">
 <div class="news-masthead-copy">
  <span class="news-eyebrow"><i></i> UZMANTECH HABER MERKEZİ</span>
  <h2>Teknolojiden<br><em>haberdar olun.</em></h2>
  <p>Uzmantech güncellemeleri, yeni özellikler, teknik ipuçları ve önemli duyurular. Hepsi tek bir yerde.</p>
  <div class="news-masthead-actions"><a href="#download" data-page="download">Uygulamayı keşfet <b>↗</b></a><span><i></i> Resmî haber ve duyuru merkezi</span></div>
 </div>
 <div class="news-masthead-visual" aria-hidden="true">
  <div class="news-glow-ring ring-a"></div><div class="news-glow-ring ring-b"></div>
  <div class="news-orbit-dot dot-a"></div><div class="news-orbit-dot dot-b"></div>
  <div class="news-glass-panel"><span>UZMANTECH</span><b>NEWS<span>.</span></b><small>UPDATE · INNOVATION · SUPPORT</small><div class="news-panel-lines"><i></i><i></i><i></i></div></div>
  <div class="news-floating-chip chip-update">↻ <span>Güncellemeler</span></div><div class="news-floating-chip chip-tech">⌘ <span>Teknik içerikler</span></div>
 </div>
 <div class="news-masthead-bottom"><span><b>01</b> Resmî duyurular</span><span><b>02</b> Sürüm notları</span><span><b>03</b> Teknik içerikler</span></div>
</section>
<section class="news-featured">
 <div class="news-featured-visual"><div class="news-featured-version"><small>UZMANTECH DESKTOP</small><b>1.1.8</b><span>RELEASE</span></div><div class="news-featured-spark"></div><span class="news-featured-label">ÖNE ÇIKAN</span></div>
 <div class="news-featured-copy"><span class="news-category-tag">YAZILIM GÜNCELLEMESİ</span><h3>Uzmantech v1.1.8</h3><p>Uzmantech masaüstü uygulamasının sürüm bilgilerini ve yayın notlarını inceleyin. Yeni sürüm duyurularını resmî kaynak üzerinden takip edin.</p><div class="news-featured-meta"><span>Uzmantech Desktop</span><span>Resmî sürüm kaydı</span></div><a href="https://github.com/uzmantech/uzmantech/releases/tag/v1.1.8" target="_blank" rel="noopener">Sürüm notlarını görüntüle <b>↗</b></a></div>
</section>
<div class="news-section-heading"><div><span class="news-section-kicker">KEŞFET</span><h3>Haber başlıkları</h3><p>İhtiyacınız olan içeriğe hızlıca ulaşın.</p></div><span class="news-section-count">UZMANTECH / PORTAL</span></div>
<div class="news-filter-row" role="group" aria-label="Haber kategorileri">
 <button type="button" class="is-active" data-news-filter="all">Tümü</button><button type="button" data-news-filter="product">Ürün &amp; Özellikler</button><button type="button" data-news-filter="archive">Dosya Arşivi</button><button type="button" data-news-filter="support">Destek</button><button type="button" data-news-filter="release">Sürüm Notları</button>
</div>
<section class="news-card-grid" aria-label="Haber içerikleri">
 <article class="news-card" data-news-category="product"><div class="news-card-art art-devices"><span>ADB</span><span>FASTBOOT</span><span>UZMANTOOL</span><i>⌘</i></div><div class="news-card-body"><span class="news-category-tag">ÜRÜN &amp; ÖZELLİKLER</span><h4>Teknik servis araçları tek merkezde</h4><p>ADB, Fastboot, cihaz bilgisi ve servis araçlarına Uzmantool içerisinden erişin.</p><a href="#download" data-page="download">Uzmantool'u keşfet <b>→</b></a></div></article>
 <article class="news-card" data-news-category="archive"><div class="news-card-art art-archive"><i>▤</i><span>FIRMWARE<br>ARCHIVE</span><b>01 / 08</b></div><div class="news-card-body"><span class="news-category-tag">DOSYA ARŞİVİ</span><h4>Teknik dosyalar için merkezi arşiv</h4><p>Marka ve model bazlı firmware ve teknik dosya arşivini keşfedin.</p><a href="archive.html">Dosya arşivine git <b>→</b></a></div></article>
 <article class="news-card" data-news-category="support"><div class="news-card-art art-support"><i>✳</i><span>DESTEK<br>MERKEZİ</span><b>7/24</b></div><div class="news-card-body"><span class="news-category-tag">DESTEK</span><h4>Yardım ve destek merkezi</h4><p>Hesap, lisans ve uygulama kullanımıyla ilgili destek kanallarına ulaşın.</p><a href="#help" data-page="help">Destek merkezini aç <b>→</b></a></div></article>
 <article class="news-card" data-news-category="release"><div class="news-card-art art-release"><span>VERSION</span><b>1.1.8</b><i>↗</i></div><div class="news-card-body"><span class="news-category-tag">SÜRÜM NOTLARI</span><h4>Uzmantech sürüm geçmişi</h4><p>Yayınlanan sürümleri ve resmî değişiklik kayıtlarını GitHub üzerinden takip edin.</p><a href="https://github.com/uzmantech/uzmantech/releases" target="_blank" rel="noopener">Tüm sürümleri görüntüle <b>→</b></a></div></article>
</section>
<div class="news-bottom-banner"><div><span class="news-section-kicker">GÜNCEL KALIN</span><h3>Uzmantech'teki yenilikleri kaçırmayın.</h3><p>Yeni sürümler ve önemli duyurular için resmî kanalları takip edin.</p></div><a href="https://github.com/uzmantech/uzmantech/releases" target="_blank" rel="noopener">Yayınları takip et <b>↗</b></a></div>`;
upd.addEventListener("click",e=>{const b=e.target.closest("[data-news-filter]");if(!b)return;const key=b.dataset.newsFilter;upd.querySelectorAll("[data-news-filter]").forEach(x=>x.classList.toggle("is-active",x===b));upd.querySelectorAll("[data-news-category]").forEach(card=>card.hidden=key!=="all"&&card.dataset.newsCategory!==key);});


const ann=make("announcements","Duyurular","Uzmantool ve Uzmantech ile ilgili önemli bilgilendirmeler.");if(announcements)ann.appendChild(announcements);
const help=make("help","Yardım ve Destek","Uzmantool kullanımı, lisans işlemleri ve teknik destek için ihtiyacınız olan her şey tek noktada.");
help.classList.add("help-center-page");
help.insertAdjacentHTML("beforeend", `
<section class="help-center-hero">
 <div class="help-center-copy">
  <span class="help-center-eyebrow"><i></i> UZMANTOOL YARDIM MERKEZİ</span>
  <h2>İhtiyacınız olduğunda<br><em>yanınızdayız.</em></h2>
  <p>Hesabınız, lisansınız veya masaüstü uygulamanızla ilgili sorularınızın yanıtlarını bulun. Çözüm bulamazsanız destek ekibimize doğrudan ulaşın.</p>
 </div>
 <div class="help-center-steps">
  <article><b>01</b><span><strong>Konunuzu seçin</strong><small>İhtiyacınız olan yardım başlığını belirleyin.</small></span></article>
  <article><b>02</b><span><strong>Talebinizi iletin</strong><small>Sorununuzu ayrıntılarıyla bize gönderin.</small></span></article>
  <article><b>03</b><span><strong>Yanıtı takip edin</strong><small>Destek geçmişinizden süreci izleyin.</small></span></article>
 </div>
</section>
<div class="help-topic-grid">
 <article><span>⌂</span><div><b>Hesap ve giriş</b><small>Giriş, parola ve hesap bilgileri</small></div></article>
 <article><span>⌑</span><div><b>Lisans ve ödeme</b><small>Lisans durumu, paketler ve ödemeler</small></div></article>
 <article><span>▣</span><div><b>Masaüstü uygulaması</b><small>Kurulum ve kullanım desteği</small></div></article>
</div>
<div class="help-contact-heading"><div><span>DOĞRUDAN DESTEK</span><h2>Bir konuda yardıma mı ihtiyacınız var?</h2><p>Destek talebi oluşturun ve yanıtları bu sayfadan takip edin.</p></div></div>
`);

if(support)help.appendChild(support);
const pages=[...main.querySelectorAll("[data-page-view]")];
function show(id,update=true){const key=id==="account"?"account":id;pages.forEach(p=>p.hidden=p.dataset.pageView!==key);document.body.classList.toggle("account-view",key==="account");document.querySelectorAll(".dash-nav [data-page],.activation-site-header [data-page]").forEach(a=>a.classList.toggle("active",a.dataset.page===key));if(update){const url=key==="home"?location.pathname+location.search:"#"+key;history.replaceState(null,"",url);}window.scrollTo({top:0,behavior:"instant"});}
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
window.UzmantoolPages={show};show(location.hash.slice(1)||"home",false);
})();
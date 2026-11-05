(()=>{const $=s=>document.querySelector(s);const main=$(".dash-content");if(!main)return;
const layout=$(".dash-layout"),download=$("#download"),account=$("#accountPage");
const primary=$(".dash-primary"),license=$("#license"),support=$("#support"),announcements=$("#announcements"),premium=$("#premium"),packages=$("#packages"),welcome=$(".welcome-card");
const make=(id,title,sub)=>{const el=document.createElement("section");el.className="portal-page";el.dataset.pageView=id;el.innerHTML='<div class="portal-page-heading"><span class="eyebrow">UZMANTOOL PORTAL</span><h1>'+title+'</h1><p>'+sub+'</p></div>';main.appendChild(el);return el;};
const home=make("home","Ana Sayfa","Hesabınızın ve Uzmantool hizmetlerinin genel görünümü.");home.prepend(layout);
const dl=make("download","Uzmantech İndir","Windows masaüstü uygulamasının resmî indirme merkezi.");dl.appendChild(download);
const lic=make("license","Lisans Aktivasyonu","Uzmantool lisansınızı güvenle etkinleştirin veya yeni lisans satın alın.");
lic.classList.add("license-page","license-reference-layout");
lic.insertAdjacentHTML("beforeend",'<div class="activation-hero"><div class="activation-copy"><div class="activation-brandline"><span>UZMANTOOL</span><i></i></div><h2>Lisans <em>Aktivasyonu</em></h2><p>Uzmantool’u tüm özellikleriyle kullanmak için lisansınızı aktive edin veya yeni lisans satın alın.</p><div class="activation-benefits"><div class="activation-benefit"><span class="activation-icon">♢</span><div><b>Güvenli ve Hızlı Aktivasyon</b><small>Lisansınız anında aktif olur.</small></div></div><div class="activation-benefit"><span class="activation-icon">∞</span><div><b>Esnek Lisans Seçenekleri</b><small>Günlük, aylık ve yıllık planlar.</small></div></div><div class="activation-benefit"><span class="activation-icon">⟳</span><div><b>Sürekli Güncel Sürüm</b><small>Lisans süresince tüm güncellemeler ücretsiz.</small></div></div></div></div><div class="activation-product" aria-label="Uzmantool lisans kutusu"><div class="activation-product-glow"></div><div class="activation-product-box"><div class="activation-box-side">UZMANTOOL</div><div class="activation-box-front"><img src="assets/logo.svg" alt="Uzmantool"><b>Uzmantool</b><small>Mobil Servis Çözümleri<br>Platformu</small><div class="activation-platforms"><span>●</span><span>●</span><span>▦</span></div></div></div><div class="activation-platform-ring"></div></div><div class="activation-panel"><div class="activation-panel-title"><span class="activation-key-icon">⚿</span><h3>Lisans Aktivasyonu</h3></div><p>Satın aldığınız lisans anahtarını girerek uygulamanızı aktive edin.</p><label class="activation-input-wrap"><span>⚿</span><input id="licenseKeyInput" type="text" placeholder="Lisans Anahtarınızı Girin" autocomplete="off" spellcheck="false"></label><button class="activation-submit" id="licenseActivateBtn" type="button"><span>✓</span> Lisansı Aktive Et</button><div class="activation-or"><i></i><span>veya</span><i></i></div><button class="activation-buy" type="button" data-open="plans"><span>🛒</span> Yeni Lisans Satın Al <b>›</b></button><small class="activation-note" id="activationNote" aria-live="polite"></small></div></div>');
if(license){license.classList.add("license-status-card");lic.appendChild(license);}
lic.insertAdjacentHTML("beforeend",'<div class="activation-feature-grid"><article><span>ϟ</span><div><b>Hızlı Aktivasyon</b><small>Saniyeler içinde kullanıma hazır.</small></div></article><article><span>♢</span><div><b>Güvenli Lisans</b><small>Cihazınıza özel, güvenli ve stabil.</small></div></article><article><span>⟳</span><div><b>Ücretsiz Güncellemeler</b><small>Lisans süresince tüm yeni sürümler.</small></div></article><article><span>♧</span><div><b>Teknik Destek</b><small>Satın alma ve aktivasyon sonrası destek.</small></div></article></div>');
if(packages){packages.classList.add("license-packages-section");lic.appendChild(packages);}



const upd=make("updates","Güncellemeler","Uzmantech sürüm bilgileri ve yayınlanan yenilikler.");
upd.classList.add("updates-page");
upd.innerHTML+='<section class="updates-hero"><div class="updates-hero-copy"><span class="updates-eyebrow"><i></i> UZMANTECH / YAZILIM GÜNCELLEMELERİ</span><h2>Her zaman<br><em>güncel kalın.</em></h2><p>Uygulamanız için yayınlanan sürümleri, yenilikleri ve iyileştirmeleri tek bir yerden takip edin.</p><div class="updates-hero-meta"><span><small>EN SON SÜRÜM</small><b>v1.1.8</b></span><span><small>ÜRÜN</small><b>Uzmantech Desktop</b></span></div></div><div class="updates-version-art"><div class="updates-orbit updates-orbit-one"></div><div class="updates-orbit updates-orbit-two"></div><div class="updates-version-tile"><small>UZMANTECH</small><b>1.1.8</b><span>RELEASE</span></div><div class="updates-live-pill"><i></i> Güncel sürüm</div></div></section><section class="updates-release-card"><div class="updates-release-head"><div><span class="updates-release-label">SON YAYIN</span><h3>Uzmantech v1.1.8</h3><p>En son yayınlanan masaüstü uygulaması sürümü.</p></div><span class="updates-current-badge"><i></i> Güncel</span></div><div class="updates-release-details"><article><span class="updates-detail-icon">✦</span><div><b>Yeni özellikler</b><small>Uygulamaya eklenen yeni işlevler ve geliştirmeler.</small></div></article><article><span class="updates-detail-icon">↗</span><div><b>İyileştirmeler</b><small>Mevcut ekranlarda ve kullanım akışlarında düzenlemeler.</small></div></article><article><span class="updates-detail-icon">✓</span><div><b>Hata düzeltmeleri</b><small>Daha kararlı ve tutarlı kullanım için düzeltmeler.</small></div></article></div><div class="updates-release-footer"><span><b>v1.1.8</b> · Uzmantech masaüstü uygulaması</span><a href="https://github.com/uzmantech/uzmantech/releases/tag/v1.1.8" target="_blank" rel="noopener">Sürüm sayfasını görüntüle <b>↗</b></a></div></section><div class="updates-note"><span>ⓘ</span><p>Yeni sürümleri yüklemeden önce mevcut verilerinizin yedeğini almanızı öneririz.</p></div>';


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
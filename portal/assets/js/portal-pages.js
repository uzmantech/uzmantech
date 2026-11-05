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
  <div class="news-visual-grid"></div><div class="news-glow-ring ring-a"></div><div class="news-glow-ring ring-b"></div>
  <div class="news-orbit-dot dot-a"></div><div class="news-orbit-dot dot-b"></div>
  <div class="news-dashboard-card"><div class="news-dashboard-top"><span>● UZMANTECH</span><small>NEWS CENTER / 2026</small></div><div class="news-dashboard-main"><div class="news-dashboard-side"><i></i><i></i><i></i><i></i></div><div class="news-dashboard-content"><b>GÜNCEL<br><em>GELİŞMELER</em></b><div class="news-dashboard-bars"><i></i><i></i><i></i></div><div class="news-dashboard-tags"><span>ADB</span><span>FASTBOOT</span><span>ROM</span></div></div></div><div class="news-dashboard-footer"><span>ÜRÜN HABERLERİ</span><span>● CANLI AKIŞ</span></div></div>
  <div class="news-floating-chip chip-update">↻ <span>Yeni güncellemeler</span></div><div class="news-floating-chip chip-tech">⌘ <span>Teknik içerikler</span></div>
  <div class="news-float-version"><small>SON SÜRÜM</small><b>v1.1.8</b><i>RELEASE</i></div>
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
<div class="adsense-news-slot" style="width:100%;max-width:100%;margin:26px auto;padding:8px 0;text-align:center" aria-label="Reklam">
 <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-0160654735972608" data-ad-slot="3773132506" data-ad-format="auto" data-full-width-responsive="true"></ins>
</div>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
<div class="news-bottom-banner"><div><span class="news-section-kicker">GÜNCEL KALIN</span><h3>Uzmantech'teki yenilikleri kaçırmayın.</h3><p>Yeni sürümler ve önemli duyurular için resmî kanalları takip edin.</p></div><a href="https://github.com/uzmantech/uzmantech/releases" target="_blank" rel="noopener">Yayınları takip et <b>↗</b></a></div>`;
upd.addEventListener("click",e=>{const b=e.target.closest("[data-news-filter]");if(!b)return;const key=b.dataset.newsFilter;upd.querySelectorAll("[data-news-filter]").forEach(x=>x.classList.toggle("is-active",x===b));upd.querySelectorAll("[data-news-category]").forEach(card=>card.hidden=key!=="all"&&card.dataset.newsCategory!==key);});


const ann=make("announcements","Duyurular","Uzmantool ve Uzmantech ile ilgili önemli bilgilendirmeler.");if(announcements)ann.appendChild(announcements);
const help=make("help","Destek","Teknik Destek ve Yardım Merkezi.");
help.classList.add("help-center-page","support-reference-page");
help.innerHTML+=`
<section class="support-reference-hero">
 <div class="support-reference-copy">
  <span class="support-reference-eyebrow"><i></i> UZMANTECH DESTEK MERKEZİ</span>
  <h2>Teknik Destek <em>ve Yardım Merkezi</em></h2>
  <p>Uzmantech ve Uzmantool ile ilgili tüm sorularınız, teknik sorunlarınız ve çözüm talepleriniz için yanınızdayız.</p>
  <form class="support-search" id="supportSearchForm"><span>⌕</span><input id="supportSearchInput" type="search" placeholder="Yardım veya çözüm arayın..." aria-label="Yardım veya çözüm arayın"><button type="submit">Ara</button></form>
  <div class="support-popular-searches"><b>Popüler Aramalar:</b><button type="button" data-support-search="Kurulum">Kurulum</button><button type="button" data-support-search="Lisans">Lisans</button><button type="button" data-support-search="ADB">ADB</button><button type="button" data-support-search="Fastboot">Fastboot</button><button type="button" data-support-search="Yedekleme">Yedekleme</button><button type="button" data-support-search="Hata Çözümleri">Hata Çözümleri</button></div>
 </div>
 <div class="support-reference-art" role="img" aria-label="Uzmantech destek görevlisi ve destek merkezi görseli"></div>
</section>
<nav class="support-quick-actions" aria-label="Hızlı destek işlemleri">
 <button type="button" data-support-open><span class="support-quick-icon quick-ticket"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4v5m0 14v5M4 16h5m14 0h5M8 8l3.5 3.5m9 9L24 24m0-16-3.5 3.5m-9 9L8 24" /><circle cx="16" cy="16" r="5.5"/><path d="M16 10.5v-3M16 24.5v-3"/></svg></span><b>Destek Talebi Oluştur<small>Teknik destek talebi gönderin.</small></b><i>›</i></button>
 <button type="button" data-support-open><span class="support-quick-icon quick-chat"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 12V8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v4M7 12h18M7 12a4 4 0 0 0-4 4v5a3 3 0 0 0 3 3h3v-8H6m19-7a4 4 0 0 1 4 4v8a3 3 0 0 1-3 3h-3v-8h3M11 24h10M14 27h4"/></svg></span><b>Canlı Destek<small>Anlık destek alın.</small></b><i>›</i></button>
 <button type="button" data-support-faq><span class="support-quick-icon quick-knowledge"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 5h22v22H5zM10 10h12v12H10zM13 13h6v6h-6z"/></svg></span><b>Bilgi Bankası<small>Rehber ve çözüm içerikleri.</small></b><i>›</i></button>
 <a href="archive.html"><span class="support-quick-icon quick-download"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3v18m-7-7 7 7 7-7M5 23v5h22v-5"/></svg></span><b>Gerekli Dosyalar<small>Sürücü, araç ve ek dosyalar.</small></b><i>›</i></a>
</nav>
<div class="support-reference-layout">
 <div class="support-reference-main">
  <div class="support-reference-section-head"><div><span>DESTEK MERKEZİ</span><h3>Yardım Kategorileri</h3><p>İhtiyacınıza uygun kategoriye göz atın.</p></div><a href="#support-faq">Tüm Kategorileri Gör　→</a></div>
  <div class="support-category-grid">
   <button type="button" data-support-search="Kurulum"><i class="support-cat-icon cat-install"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 5h22v22H5zM10 10h12v12H10zM13 13h6v6h-6z"/></svg></i><span><b>Kurulum ve İlk Ayarlar</b><small>Uzmantech kurulumu, lisans aktivasyonu ve ilk ayarlar.</small></span></button>
   <button type="button" data-support-search="ADB Fastboot Android"><i class="support-cat-icon cat-android"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="9" r="4"/><path d="M8 26v-4a8 8 0 0 1 16 0v4zM12 4l-2-2m10 2 2-2"/></svg></i><span><b>Android İşlemleri</b><small>ADB, Fastboot, yedekleme ve diğer Android araçları.</small></span></button>
   <button type="button" data-support-search="Apple iOS"><i class="support-cat-icon cat-apple"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M19 8c0-3 2-5 5-5 0 3-2 5-5 5Zm-2 3c-2-2-5-2-7 0-4 3-2 10 1 14 2 3 4 3 6 1 2 2 4 2 6-1 1-2 2-4 2-6-3 0-5-2-5-4s2-4 4-4c-2-3-5-3-7 0Z"/></svg></i><span><b>Apple İşlemleri</b><small>iOS yedekleme, veri yönetimi ve cihaz işlemleri.</small></span></button>
   <button type="button" data-support-search="Hata Çözümleri"><i class="support-cat-icon cat-errors"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M13 3h6l1 4 3 2 4-1 3 5-3 3v4l3 3-3 5-4-1-3 2-1 4h-6l-1-4-3-2-4 1-3-5 3-3v-4l-3-3 3-5 4 1 3-2z" transform="translate(0 -2) scale(1 .95)"/><circle cx="16" cy="16" r="4"/></svg></i><span><b>Hata Çözümleri</b><small>Sık karşılaşılan hatalar ve çözüm adımları.</small></span></button>
   <button type="button" data-support-search="Araçlar Modüller"><i class="support-cat-icon cat-tools"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 7h22l-4 18H2z"/></svg></i><span><b>Araçlar ve Modüller</b><small>Uzmantool ve entegre araçlar hakkında destek.</small></span></button>
   <button type="button" data-support-search="Güncellemeler"><i class="support-cat-icon cat-update"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M26 13a11 11 0 1 0 1 7M26 5v8h-8"/></svg></i><span><b>Güncellemeler</b><small>Sürüm notları, güncelleme adımları ve yenilikler.</small></span></button>
  </div>
  <div class="support-reference-section-head faq-heading" id="support-faq"><div><span>MERAK EDİLENLER</span><h3>Sıkça Sorulan Sorular</h3><p>En çok merak edilen sorular ve cevapları.</p></div><a href="#support-faq">Tüm Soruları Gör　→</a></div>
  <div class="support-faq-grid">
   <details data-support-faq><summary>Uzmantech nasıl kurulur?</summary><p>Uygulamanın kurulum dosyasını indirme bölümünden alın. Kurulum tamamlandığında programı yönetici olarak çalıştırıp hesabınızla giriş yapın.</p></details>
   <details data-support-faq><summary>ADB cihazı görünmüyor, ne yapmalıyım?</summary><p>Telefonda USB hata ayıklamayı etkinleştirin, uygun USB sürücüsünü kurun ve bağlantı modunu kontrol edin. Ardından kabloyu yeniden takıp ADB cihaz listesini yenileyin.</p></details>
   <details data-support-faq><summary>Lisans aktivasyonu nasıl yapılır?</summary><p>Hesabınıza giriş yapın ve Lisans Aktivasyonu sayfasındaki adımları izleyin. Lisans anahtarınızı kimseyle paylaşmayın.</p></details>
   <details data-support-faq><summary>Yedekleme nerede saklanır?</summary><p>Yedekleme konumu kullandığınız modüle ve seçtiğiniz klasöre göre değişebilir. İşlem öncesinde hedef klasörü kontrol edin.</p></details>
  </div>
  <div class="adsense-support-slot" style="width:100%;max-width:100%;margin:26px auto;padding:8px 0;text-align:center" aria-label="Reklam">
   <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-0160654735972608" data-ad-slot="2820364674" data-ad-format="auto" data-full-width-responsive="true"></ins>
  </div>
  <script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
 </div>
 <aside class="support-reference-sidebar">
  <section class="support-side-card support-contact-card"><div class="support-side-heading"><span>♧</span><div><b>İletişim Kanalları</b><small>Bize dilediğiniz kanaldan ulaşabilirsiniz.</small></div></div><button type="button" data-support-open><i class="contact-whatsapp">◉</i><span><b>WhatsApp Destek</b><small>Hızlı ve doğrudan iletişim.</small></span><strong>→</strong></button><button type="button" data-support-open><i class="contact-telegram">➤</i><span><b>Telegram Destek</b><small>Güncel duyurular ve destek.</small></span><strong>→</strong></button><button type="button" data-support-open><i class="contact-email">✉</i><span><b>E-Posta Destek</b><small>destek@uzmantech.com</small></span><strong>→</strong></button></section>
  <section class="support-side-card support-status-card"><div class="support-side-heading"><span>⌁</span><div><b>Sistem Durumu</b><small>Hizmetlerimizin anlık çalışma durumu.</small></div><strong class="support-all-online">✓ Tüm Sistemler Çalışıyor</strong></div><div class="support-status-row"><i></i><b>Web Portal</b><small>Çevrimiçi</small></div><div class="support-status-row"><i></i><b>Dosya Arşivi</b><small>Çevrimiçi</small></div><div class="support-status-row"><i></i><b>Lisans Sunucusu</b><small>Çevrimiçi</small></div><div class="support-status-row"><i></i><b>Destek Sistemi</b><small>Çevrimiçi</small></div></section>
 </aside>
</div>`;
help.addEventListener("click",e=>{
 const searchButton=e.target.closest("[data-support-search]");
 if(searchButton){const input=help.querySelector("#supportSearchInput");input.value=searchButton.dataset.supportSearch;help.querySelector("#supportSearchForm").requestSubmit();return;}
 if(e.target.closest("[data-support-open]")){document.getElementById("supportRequest")?.click();return;}
 if(e.target.closest("[data-support-faq]")){help.querySelector("#support-faq")?.scrollIntoView({behavior:"smooth"});}
});
help.querySelector("#supportSearchForm")?.addEventListener("submit",e=>{
 e.preventDefault();const q=help.querySelector("#supportSearchInput").value.trim().toLocaleLowerCase("tr");let count=0;
 help.querySelectorAll("[data-support-faq]").forEach(item=>{const show=!q||item.textContent.toLocaleLowerCase("tr").includes(q);item.hidden=!show;if(show)count++;});
 help.querySelector("#support-faq")?.scrollIntoView({behavior:"smooth",block:"start"});
 if(!count)help.querySelector("#support-faq").insertAdjacentHTML("beforeend",'<p class="support-no-results">Bu arama için hazır bir cevap bulunamadı. Destek talebi oluşturabilirsiniz.</p>');
});


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
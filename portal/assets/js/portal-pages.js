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
<div class="adsense-news-detail-slot" style="width:100%;max-width:100%;margin:26px auto;padding:8px 0;text-align:center" aria-label="Reklam">
 <ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-0160654735972608" data-ad-slot="7330455321" data-ad-format="auto" data-full-width-responsive="true"></ins>
</div>
<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>
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
const help=make("help","Destek","Uzmantech destek merkezi.");
help.classList.add("help-center-page","support-redesign");
help.querySelector(".portal-page-heading")?.remove();
help.innerHTML+=\`
<section class="sr-hero">
 <div class="sr-hero-copy"><span class="sr-eyebrow"><i></i> UZMANTECH · DESTEK MERKEZİ</span><h2>Takıldığınız yerde<br><em>yanınızdayız.</em></h2><p>Uzmantech ve Uzmantool için çözüm, rehber ve teknik destek tek bir merkezde.</p>
 <form class="sr-search" id="srSearch"><span>⌕</span><input id="srSearchInput" type="search" placeholder="Örn. ADB cihazı görmüyor, lisans, kurulum..." aria-label="Destek makalelerinde ara"><button type="submit">Ara <b>↗</b></button></form>
 <div class="sr-search-hints"><span>Popüler:</span><button type="button" data-sr-query="ADB">ADB</button><button type="button" data-sr-query="Fastboot">Fastboot</button><button type="button" data-sr-query="Lisans">Lisans</button><button type="button" data-sr-query="Yedekleme">Yedekleme</button></div></div>
 <div class="sr-hero-visual" aria-hidden="true"><div class="sr-visual-grid"></div><div class="sr-orbit sr-orbit-a"></div><div class="sr-orbit sr-orbit-b"></div><div class="sr-support-device"><div class="sr-device-top"><i></i><i></i><i></i><span>UZMANTECH / HELP DESK</span></div><div class="sr-device-body"><div class="sr-device-side"><b>U</b><i></i><i></i><i></i></div><div class="sr-device-content"><small>DESTEK PANELİ</small><strong>Nasıl yardımcı<br>olabiliriz?</strong><div class="sr-device-line"></div><div class="sr-device-line short"></div><div class="sr-device-status"><i></i> TALEPLERİNİZ GÜVENDE</div></div></div></div><div class="sr-float-bubble sr-bubble-one">24/7 <small>DESTEK MERKEZİ</small></div><div class="sr-float-bubble sr-bubble-two">✓ <small>ÇÖZÜM ODAKLI</small></div></div>
</section>
<section class="sr-action-grid" aria-label="Destek seçenekleri">
 <button type="button" class="sr-action sr-action-primary" data-sr-ticket><span class="sr-action-icon">✉</span><span><b>Destek talebi oluştur</b><small>Sorununuzu ekibimize iletin</small></span><i>↗</i></button>
 <a class="sr-action" href="mailto:destek@uzmantech.com"><span class="sr-action-icon sr-icon-mail">＠</span><span><b>E-posta ile ulaşın</b><small>destek@uzmantech.com</small></span><i>↗</i></a>
 <a class="sr-action" href="archive.html"><span class="sr-action-icon sr-icon-files">▤</span><span><b>Dosya arşivi</b><small>Sürücü ve teknik dosyalar</small></span><i>↗</i></a>
</section>
<section class="sr-section"><div class="sr-section-heading"><div><span class="sr-kicker">KONUYA GÖRE DESTEK</span><h3>Size nasıl yardımcı olabiliriz?</h3><p>İhtiyacınız olan başlığı seçin, ilgili çözümlere hızlıca ulaşın.</p></div><span class="sr-section-index">01 / KATEGORİLER</span></div>
 <div class="sr-category-grid">
  <button type="button" data-sr-query="Kurulum"><span class="sr-category-symbol">⌘</span><b>Kurulum ve başlangıç</b><small>Kurulum, sistem gereksinimleri ve ilk ayarlar</small><i>→</i></button>
  <button type="button" data-sr-query="ADB Fastboot"><span class="sr-category-symbol">⌁</span><b>Android ve bağlantı</b><small>ADB, Fastboot, sürücüler ve cihaz algılama</small><i>→</i></button>
  <button type="button" data-sr-query="Apple yedekleme"><span class="sr-category-symbol">◉</span><b>Apple işlemleri</b><small>iOS yedekleme ve cihaz yönetimi</small><i>→</i></button>
  <button type="button" data-sr-query="Lisans üyelik ödeme"><span class="sr-category-symbol">◇</span><b>Lisans ve ödemeler</b><small>Üyelik, lisans, satın alma ve dekont</small><i>→</i></button>
  <button type="button" data-sr-query="Yedekleme geri yükleme"><span class="sr-category-symbol">▣</span><b>Yedekleme ve geri yükleme</b><small>Yedek konumu, dosyalar ve geri yükleme</small><i>→</i></button>
  <button type="button" data-sr-query="Hata çözümleri"><span class="sr-category-symbol">⚙</span><b>Hata çözümleri</b><small>Yaygın sorunlar ve kontrol adımları</small><i>→</i></button>
 </div></section>
<section class="sr-knowledge" id="srKnowledge"><div class="sr-section-heading"><div><span class="sr-kicker">BİLGİ BANKASI</span><h3>Sık sorulan sorular</h3><p>En çok karşılaşılan konular için kısa ve uygulanabilir yanıtlar.</p></div><span class="sr-section-index">02 / YARDIM</span></div>
 <div class="sr-faq-list">
  <details data-sr-faq><summary><span><i>01</i> ADB cihazımı görmüyor, ne yapmalıyım?</span><b>＋</b></summary><p>Telefonda Geliştirici Seçenekleri ve USB Hata Ayıklama açık olmalı. Telefon ekranındaki bilgisayar izin penceresini onaylayın, veri aktarımını destekleyen bir kablo kullanın ve Windows USB sürücüsünü kontrol edin. Ardından ADB sunucusunu yeniden başlatıp cihaz listesini yenileyin.</p></details>
  <details data-sr-faq><summary><span><i>02</i> Fastboot cihazı algılanmıyorsa neyi kontrol etmeliyim?</span><b>＋</b></summary><p>Cihazın gerçekten Fastboot/Bootloader modunda olduğunu doğrulayın. Windows Aygıt Yöneticisi'nde Android Bootloader Interface sürücüsünü kontrol edin, farklı USB portu ve sağlam bir veri kablosu deneyin. Ardından fastboot devices çıktısını kontrol edin.</p></details>
  <details data-sr-faq><summary><span><i>03</i> Lisans veya üyelik ödemem ne zaman aktif olur?</span><b>＋</b></summary><p>Ödeme dekontu gönderildikten sonra bildirim yönetici incelemesine alınır. Ödeme doğrulanıp onaylandığında seçilen paket hesabınıza tanımlanır. Onaylanmadan lisansın aktif olduğunu varsaymayın.</p></details>
  <details data-sr-faq><summary><span><i>04</i> Yedekleme dosyalarım nerede saklanır?</span><b>＋</b></summary><p>Yedekleme modülünde seçtiğiniz hedef klasörü kontrol edin. İşlem tamamlandı mesajından sonra klasörde dosya oluştuğunu ve dosya boyutunun sıfır olmadığını doğrulayın.</p></details>
  <details data-sr-faq><summary><span><i>05</i> Apple yedeklemesinde neden çok sayıda dosya oluşuyor?</span><b>＋</b></summary><p>Seçilen yedekleme kapsamı ve modülün oluşturduğu manifest/veri dosyaları sonucu etkileyebilir. Yalnızca rehber yedeği istiyorsanız rehber dışındaki kategorileri kapatın ve hedef klasördeki dosyaları işlem raporuyla karşılaştırın.</p></details>
 </div><p class="sr-no-results" id="srNoResults" hidden>Bu arama için hazır bir yanıt bulamadık. Destek talebi oluşturarak bize ulaşabilirsiniz.</p></section>
<section class="sr-bottom-cta"><div><span class="sr-kicker">BURADAYIZ</span><h3>Aradığınız yanıtı bulamadınız mı?</h3><p>Teknik detayları ve aldığınız hata mesajını paylaşın. Talebinizi inceleyelim.</p></div><button type="button" data-sr-ticket>Destek talebi oluştur <b>↗</b></button></section>
<div class="sr-legacy-backend" hidden></div>\`;
if(support){help.querySelector(".sr-legacy-backend").appendChild(support);}
help.addEventListener("click",e=>{
 const q=e.target.closest("[data-sr-query]");
 if(q){const input=help.querySelector("#srSearchInput");input.value=q.dataset.srQuery;help.querySelector("#srSearch").requestSubmit();return;}
 if(e.target.closest("[data-sr-ticket]")){document.getElementById("supportRequest")?.click();return;}
});
help.querySelector("#srSearch")?.addEventListener("submit",e=>{
 e.preventDefault();const q=help.querySelector("#srSearchInput").value.trim().toLocaleLowerCase("tr");let count=0;
 help.querySelectorAll("[data-sr-faq]").forEach(item=>{const show=!q||item.textContent.toLocaleLowerCase("tr").includes(q);item.hidden=!show;if(show)count++;});
 help.querySelector("#srNoResults").hidden=count>0;
 help.querySelector("#srKnowledge").scrollIntoView({behavior:"smooth",block:"start"});
});
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
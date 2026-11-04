(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const state = { user: null, category: "all", query: "", busy: false, timer: null, exchangeRate: null, exchangeRateAt: 0 };
  const toast = message => {
    const el=$("#toast"); if(!el) return;
    el.textContent=message; el.classList.add("show");
    setTimeout(()=>el.classList.remove("show"),3200);
  };
  function modal(title, body) {
    $("#modalTitle").textContent=title; $("#modalBody").innerHTML=body; $("#modal").classList.add("open");
  }
  function closeModal(){ $("#modal").classList.remove("open"); }
  function syncHeader(){
    const actions=$(".header-actions");
    if(actions){
      if(state.user){
        actions.innerHTML='<span class="muted header-user">'+esc(state.user.username)+'</span><button class="button button-quiet" id="logoutBtn">Çıkış Yap</button>';
      }else{
        actions.innerHTML='<button class="button button-quiet" data-open="login">Giriş Yap</button><button class="button button-primary" data-open="register">Üye Ol</button><button class="menu-toggle" id="menuToggle" aria-label="Menüyü aç">☰</button>';
      }
    }

    const account=$("#accountName");
    if(account){
      const user=state.user;
      const username=user?.username||"UZMAN";
      const expired=!!user?.membership_expired;
      const role=user?(expired?"Üyelik Süresi Doldu":"Premium Üye"):"Premium Üye";
      account.textContent=username;
      if($("#welcomeName"))$("#welcomeName").textContent="Merhaba, "+username;
      if($("#accountRole"))$("#accountRole").textContent=role;
      if($("#welcomeRole"))$("#welcomeRole").textContent=role;
      const licenseType=$("#licenseType"),licenseEnd=$("#licenseEnd"),remaining=$("#licenseRemaining");
      if(user){
        if(licenseType)licenseType.textContent=user.membership_type||user.license_type||(expired?"Süresi Doldu":"Premium");
        const expiry=user.membership_expires_at||user.membership_end_date||user.license_expires_at||user.license_end||user.expires_at||null;
        if(expiry){
          const date=new Date(expiry);
          if(!Number.isNaN(date.getTime())){
            if(licenseEnd)licenseEnd.textContent=date.toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"});
            const days=Math.ceil((date.getTime()-Date.now())/86400000);
            if(remaining)remaining.textContent=days>=0?days+" Gün":"Süresi Doldu";
          }
        }else{
          if(licenseEnd)licenseEnd.textContent="Bilgi yok";
          if(remaining)remaining.textContent="-";
        }
      }
      const profile=$(".top-profile");
      if(profile){
        if(user){profile.removeAttribute("data-open");profile.id="logoutBtn";profile.title="Oturumu kapat";}
        else{profile.id="";profile.setAttribute("data-open","login");profile.title="Hesabım";}
      }
    }
  }
  function recordView(entry){
    const d=entry.data;
    let brand="",model="",code="",description="",version="",android="",region="",link="";
    if(Array.isArray(d)){
      [brand,model,code,description,link,version,android,region]=d;
    }else if(d && typeof d==="object"){
      brand=d.brand||d.manufacturer||d.category||"";
      model=d.model||d.title||d.name||"Teknik kayıt";
      code=d.codename||d.code||d.model_code||"";
      description=d.description||d.notes||d.message||d.source||"";
      version=d.version||d.firmware_version||"";
      region=d.region||d.csc||"";
      link=d.download_url||d.file_url||d.download||d.url||d.link||d.source_url||"";
    }
    const cat=String(entry.category||"").toUpperCase().replace("_"," ");
    const title=model||code||"Arşiv kaydı";
    const meta=[brand,code&&("Kod: "+code),version,android,region].filter(Boolean).join(" · ");
    const hasLink=state.user && typeof link==="string" && /^https?:\/\//i.test(link.trim());
    return '<article class="content-card archive-card"><span class="tag">'+esc(cat)+'</span><h3>'+esc(title)+'</h3><p>'+esc(description||"Uzmantech merkezi arşiv kaydı")+'</p><div class="card-meta">'+esc(meta||"Teknik servis kaydı")+'</div>' +
      (hasLink?'<a class="button button-primary" href="'+esc(link)+'" target="_blank" rel="noopener noreferrer">Dosyayı indir ↗</a>':
      '<button class="button button-outline" data-file="'+esc(title)+'">'+(state.user?"İndirme bağlantısı yok":"Üyelik ile indir")+'</button>')+'</article>';
  }
  async function loadArchive(){
    if(!$("#archiveGrid"))return;
    if(state.busy)return;
    state.busy=true;
    const grid=$("#archiveGrid"), empty=$("#archiveEmpty");
    grid.innerHTML='<div class="empty-state">Arşiv yükleniyor…</div>';
    try{
      const result=await window.UzmantechAPI.archive({q:state.query,category:state.category,limit:60});
      grid.innerHTML=(result.results||[]).map(recordView).join("");
      if(empty) empty.hidden=(result.results||[]).length!==0;
      if(!result.results?.length) grid.innerHTML='<div class="empty-state">Bu aramada kayıt bulunamadı. Farklı model veya kod adı deneyin.</div>';
      const label=$(".demo-label"); if(label) label.textContent="CANLI MERKEZİ ARŞİV";
    }catch(error){
      grid.innerHTML='<div class="empty-state">Arşiv yüklenemedi: '+esc(error.message)+'</div>';
      if(empty)empty.hidden=true;
    }finally{state.busy=false;}
  }
  async function loadRecent(){
    const grid=$("#recentGrid");if(!grid)return;
    try{
      const result=await window.UzmantechAPI.recent();
      const items=result.results||[];
      grid.innerHTML=items.map(entry=>{
        const d=entry.data||{},model=d.model||d.title||"Teknik kayıt",brand=d.brand||"",code=d.codename||d.code||"";
        const category=String(entry.category||"").replace("_"," ").toUpperCase();
        return '<article class="recent-card"><div class="recent-top"><span class="tag">'+esc(category)+'</span><span class="recent-brand">'+esc(brand)+'</span></div><h3>'+esc(model)+'</h3><p>'+esc(code?("Kod adı: "+code):(d.description||d.notes||"Yeni arşiv kaydı"))+'</p><a href="archive.html?q='+encodeURIComponent(model)+'">Kaydı görüntüle →</a></article>';
      }).join("");
      if(!items.length)grid.innerHTML='<div class="empty-state">Henüz gösterilecek yeni kayıt yok.</div>';
    }catch(error){grid.innerHTML='<div class="empty-state">Son eklenenler yüklenemedi.</div>';}
  }

  function openLogin(){
    modal("Üye girişi",'<form id="loginForm"><label class="field"><span>Kullanıcı adı veya e-posta</span><input name="identifier" autocomplete="username" required maxlength="254"></label><label class="field"><span>Şifre</span><input name="password" type="password" autocomplete="current-password" required maxlength="256"></label><button class="button button-primary" id="loginSubmit" type="submit" style="width:100%">Giriş Yap</button><p class="muted">Masaüstü uygulamasındaki cihaz kilidinden bağımsız web oturumu kullanılır.</p></form>');
    $("#loginForm").addEventListener("submit",async e=>{
      e.preventDefault(); const btn=$("#loginSubmit");btn.disabled=true;btn.textContent="Kontrol ediliyor…";
      const form=new FormData(e.currentTarget);
      try{
        const result=await window.UzmantechAPI.login({identifier:form.get("identifier"),password:form.get("password")});
        window.UzmantechAPI.setSession(result.session_token);state.user=result.user;closeModal();syncHeader();toast(result.user.membership_expired?"Üyelik süreniz dolmuş. Yenilemek için paket seçebilirsiniz.":"Giriş başarılı. Hoş geldiniz.");loadArchive();
      }catch(error){toast(error.message);}
      finally{btn.disabled=false;btn.textContent="Giriş Yap";}
    });
  }
  function openRegister(){
    modal("Yeni üyelik",'<div class="notice">Web kayıt ekranı, mevcut e-posta doğrulama ve yönetici onay akışına bağlanacak. E-posta gönderim servisi henüz web için yapılandırılmadığından şu anda kayıt alınmıyor.</div><p class="muted">Hesap güvenliği için doğrulama kodu gönderilemeyen bir kayıt formunu aktif etmiyorum.</p>');
  }

  async function refreshExchangeRate(force=false){
    if(!force && state.exchangeRate && Date.now()-state.exchangeRateAt<60000) return state.exchangeRate;
    const result=await window.UzmantechAPI.exchangeRate();
    const rate=Number(result.usd_sell);
    if(!Number.isFinite(rate)||rate<=0) throw new Error("Enpara USD satış kuru alınamadı.");
    state.exchangeRate=rate;state.exchangeRateAt=Date.now();
    const packageUsd={monthly:15,half_year:30,annual:40};
    document.querySelectorAll("[data-price]").forEach(el=>{
      const usd=packageUsd[el.dataset.price];
      if(usd)el.textContent=new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.round(usd*rate*100)/100);
    });
    document.querySelectorAll("[data-usd]").forEach(el=>{
      const usd=packageUsd[el.dataset.usd];
      if(usd)el.textContent=usd+" USD";
    });
    const rateLabel=$("#exchangeRateLabel");
    if(rateLabel)rateLabel.textContent="Enpara USD satış kuru: "+rate.toLocaleString("tr-TR",{minimumFractionDigits:4,maximumFractionDigits:4})+" TL";
    return rate;
  }

  async function openPlan(plan, label, days){
    if(!state.user){
      modal(label+" üyelik",'<div class="notice">Ödeme bildirimi göndermek için önce Uzmantech hesabınla giriş yapmalısın.</div><button class="button button-primary" id="planLogin" type="button">Giriş Yap</button>');
      $("#planLogin").addEventListener("click",openLogin);
      return;
    }
    let rate;
    try{rate=await refreshExchangeRate(true);}catch(error){toast(error.message);return;}
    const usd=({monthly:15,half_year:30,annual:40})[plan];
    const amount=Math.round(usd*rate*100)/100;
    const amountText=new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",minimumFractionDigits:2}).format(amount);
    modal(label+" üyelik başvurusu",'<div class="notice">Paket süresi: '+days+' gün. Ücret: <strong>'+usd+' USD</strong> = <strong>'+amountText+'</strong>. Hesaplama Enpara USD satış kuruna göre yapılır.</div><div class="content-card" style="margin:12px 0;padding:14px"><strong>Havale bilgileri</strong><p>Alıcı: Ömer Özen<br>Banka: Enpara<br>IBAN: <strong>TR65 0015 7000 0000 0091 1012 51</strong></p><p class="muted">1 USD = '+rate.toLocaleString("tr-TR",{minimumFractionDigits:4,maximumFractionDigits:4})+' TL</p></div><form id="paymentForm"><label class="field"><span>Ödeyen adı soyadı</span><input name="payer_name" required minlength="2" maxlength="120"></label><label class="field"><span>Ödeme tutarı (TL)</span><input name="amount" type="text" value="'+amount.toFixed(2)+'" readonly></label><input name="rate" type="hidden" value="'+rate+'"><label class="field"><span>Banka dekontu (PDF, JPG, PNG, WEBP · en fazla 5 MB)</span><input name="receipt" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required></label><button class="button button-primary" id="paymentSubmit" type="submit" style="width:100%">Dekontu gönder</button><p class="muted">Havale işlemini yukarıdaki TL tutarıyla yap. Yönetici onayından sonra '+days+' günlük lisans otomatik tanımlanır.</p></form>');
    $("#paymentForm").addEventListener("submit",async e=>{
      e.preventDefault();
      const form=e.currentTarget,file=form.elements.receipt.files[0],amount=Number(form.elements.amount.value),rate=Number(form.elements.rate.value),payerName=form.elements.payer_name.value.trim();
      if(!file||file.size===0||file.size>5*1024*1024){toast("Dekont dosyası boş olamaz ve 5 MB sınırını aşamaz.");return;}
      if(!["application/pdf","image/jpeg","image/png","image/webp"].includes(file.type)){toast("Yalnızca PDF, JPG, PNG veya WEBP yükleyebilirsin.");return;}
      const btn=$("#paymentSubmit");btn.disabled=true;btn.textContent="Güvenli şekilde yükleniyor…";
      try{
        const result=await window.UzmantechAPI.paymentReceipt({plan,amount,rate,payerName,file});
        closeModal();toast(result.message||"Ödeme bildirimi alındı.");
      }catch(error){toast(error.message);}
      finally{btn.disabled=false;btn.textContent="Dekontu gönder";}
    });
  }

  // Hero carousel: pauses on hover, focus, and hidden tabs.
  const heroSlides=[...document.querySelectorAll("[data-hero-slide]")];
  if(heroSlides.length){
    const heroDots=[...document.querySelectorAll("[data-hero-dot]")];
    let heroIndex=0,heroTimer=null;
    const renderHero=()=>{heroSlides.forEach((s,i)=>{s.classList.toggle("is-active",i===heroIndex);s.setAttribute("aria-hidden",i===heroIndex?"false":"true");});heroDots.forEach((d,i)=>d.classList.toggle("is-active",i===heroIndex));};
    const stopHero=()=>{if(heroTimer)clearInterval(heroTimer);heroTimer=null;};
    const startHero=()=>{stopHero();if(window.matchMedia("(prefers-reduced-motion: reduce)").matches||document.hidden)return;heroTimer=setInterval(()=>{heroIndex=(heroIndex+1)%heroSlides.length;renderHero();},5600);};
    const goHero=i=>{heroIndex=(i+heroSlides.length)%heroSlides.length;renderHero();startHero();};
    document.querySelector("[data-hero-prev]")?.addEventListener("click",()=>goHero(heroIndex-1));
    document.querySelector("[data-hero-next]")?.addEventListener("click",()=>goHero(heroIndex+1));
    heroDots.forEach((d,i)=>d.addEventListener("click",()=>goHero(i)));
    const stage=document.querySelector(".showcase-stage");
    stage?.addEventListener("mouseenter",stopHero);stage?.addEventListener("mouseleave",startHero);
    stage?.addEventListener("focusin",stopHero);stage?.addEventListener("focusout",e=>{if(!stage.contains(e.relatedTarget))startHero();});
    document.addEventListener("visibilitychange",()=>document.hidden?stopHero():startHero());
    renderHero();startHero();
  }

  document.addEventListener("click",e=>{
    const opener=e.target.closest("[data-open]");
    if(opener?.dataset.open==="login")openLogin();
    if(opener?.dataset.open==="register")openRegister();
    if(e.target.id==="modalClose"||e.target.id==="modal")closeModal();
    if(e.target.closest("#logoutBtn")){window.UzmantechAPI.setSession("");state.user=null;syncHeader();toast("Oturum kapatıldı.");loadArchive();}
    if(e.target.id==="menuToggle")$(".main-nav")?.classList.toggle("open");
    const tool=e.target.closest("[data-tool]");
    if(tool){modal(tool.dataset.tool,'<div class="notice">Bu işlem Uzmantech masaüstü uygulamasında gerçekleştirilir. Web portalı cihaz üzerinde ADB veya Fastboot komutu çalıştırmaz.</div><p class="muted">Masaüstü uygulamasındaki ilgili bölümü kullanabilirsin.</p>');}
    if(e.target.closest("#supportRequest")){modal("Hızlı Destek",'<div class="notice">Destek talebi formu bu portal sürümüne henüz bağlanmadı.</div><p class="muted">Çalışmayan bir e-posta adresine yönlendirmek yerine bu bağlantıyı şimdilik bilgilendirme olarak bıraktım.</p>');}
    if(e.target.closest("[data-file]")&&!state.user){openLogin();}
    if(e.target.closest("[data-file]")&&state.user){toast("Bu kayıt için indirme bağlantısı henüz tanımlanmamış.");}
    const course=e.target.closest("[data-course]");if(course){modal(course.dataset.course,'<div class="notice">Bu eğitimin video içeriği henüz yayınlanmadı.</div><p class="muted">Eğitim kataloğu ve video erişimi sonraki aşamada bağlanacak.</p>');}
    const plan=e.target.closest("[data-plan]");if(plan){const key=plan.dataset.plan;const cfg={monthly:["1 aylık",30],half_year:["6 aylık",180],annual:["12 aylık",365]}[key];if(cfg)openPlan(key,cfg[0],cfg[1]);}
    if(e.target.id==="deviceSearchForm"){}
  });
  $("#deviceSearchForm")?.addEventListener("submit",e=>{e.preventDefault();const q=$("#deviceQuery").value.trim();location.href="archive.html"+(q?"?q="+encodeURIComponent(q):"");});
  $("#modalClose")?.addEventListener("click",closeModal);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
  (async()=>{
    const token=window.UzmantechAPI.getToken();
    if(token){try{const result=await window.UzmantechAPI.session();state.user=result.user;}catch{window.UzmantechAPI.setSession("");}}
    syncHeader();await refreshExchangeRate().catch(error=>{document.querySelectorAll("[data-price]").forEach(el=>el.textContent="Kur alınamadı");console.warn(error);});await loadRecent();await loadArchive();
  })();
})();
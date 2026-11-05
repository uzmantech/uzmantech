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

    const user=state.user;
    const account=$("#accountName");
    const username=user?.username||"Misafir";
    const admin=user?.role==="admin";
    const expiry=user?.expiry_date?new Date(user.expiry_date):null;
    const expiryValid=expiry && !Number.isNaN(expiry.getTime());
    const expired=!!(user && !admin && (!expiryValid || expiry.getTime()<=Date.now()));
    const remainingDays=expiryValid?Math.ceil((expiry.getTime()-Date.now())/86400000):null;
    const roleLabel=!user?"Portal Ziyaretçisi":admin?"Yönetici":expired?"Lisans Süresi Doldu":"Premium Üye";

    if(account)account.textContent=username;
    if($("#welcomeName"))$("#welcomeName").textContent=user?"Merhaba, "+username:"Merhaba!";
    if($("#accountRole"))$("#accountRole").textContent=roleLabel;
    if($("#welcomeRole"))$("#welcomeRole").textContent=!user?"Uzmantech Portal'a hoş geldiniz":roleLabel;

    const planNames={monthly:"1 Aylık",half_year:"6 Aylık",annual:"12 Aylık",trial_7:"7 Gün Deneme",full_365:"12 Aylık",custom:"Özel Lisans","365":"12 Aylık","none":"Lisans Yok"};
    const licenseType=$("#licenseType"),licenseEnd=$("#licenseEnd"),remaining=$("#licenseRemaining");
    if(licenseType){
      licenseType.textContent=!user?"Giriş yapın":admin?"Yönetici":expired?(expiryValid?"Süresi Doldu":"Lisans Atanmamış"):(planNames[user.license_plan]||"Aktif Lisans");
    }
    if(licenseEnd){
      licenseEnd.textContent=expiryValid?expiry.toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"}):(admin?"Süresiz":"-");
    }
    if(remaining){
      remaining.textContent=!user?"-":admin?"Süresiz":!expiryValid?"Lisans Yok":remainingDays<=0?"Süresi Doldu":remainingDays+" Gün";
    }
    const licenseAction=$("#licenseAction");
    if(licenseAction){
      if(admin){
        licenseAction.textContent="Yönetici hesabı";
        licenseAction.removeAttribute("data-open");
        licenseAction.disabled=true;
      }else{
        licenseAction.disabled=false;
        licenseAction.textContent=user?"Lisansı Yenile":"Giriş Yap";
        licenseAction.dataset.open=user?"plans":"login";
      }
    }
    const historyButton=$("#paymentHistoryBtn");
    if(historyButton)historyButton.hidden=!user || admin;

    const registerButton=$("#headerRegister");
    if(registerButton)registerButton.hidden=false;

    const profile=$(".top-profile");
    if(profile){
      if(user){profile.removeAttribute("data-open");profile.id="logoutBtn";profile.title="Oturumu kapat";}
      else{profile.id="";profile.setAttribute("data-open","login");profile.title="Hesabım";}
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
    modal("Üye girişi",'<form id="loginForm"><label class="field"><span>Kullanıcı adı veya e-posta</span><input name="identifier" autocomplete="username" required maxlength="254"></label><label class="field"><span>Şifre</span><input name="password" type="password" autocomplete="current-password" required maxlength="256"></label><button class="button button-primary" id="loginSubmit" type="submit" style="width:100%">Giriş Yap</button><p class="muted">Masaüstü uygulamasındaki cihaz kilidinden bağımsız web oturumu kullanılır.</p><p class="muted"><button type="button" class="text-button" data-open="forgot">Şifremi unuttum?</button></p><p class="muted">Henüz hesabın yok mu? <button type="button" class="text-button" data-open="register">Üye ol</button></p></form>');
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
    const body='<form id="registerForm">'+
      '<label class="field"><span>Kullanıcı adı</span><input name="username" autocomplete="username" required minlength="3" maxlength="32" pattern="[A-Za-z0-9_.-]+" placeholder="Örn. uzmantech_user"></label>'+
      '<label class="field"><span>E-posta adresi</span><input name="email" type="email" autocomplete="email" required maxlength="254" placeholder="ornek@eposta.com"></label>'+
      '<label class="field"><span>Ülke</span><select name="country_code" required><option value="TR" selected>Türkiye (+90)</option><option value="US">ABD (+1)</option><option value="GB">Birleşik Krallık (+44)</option><option value="DE">Almanya (+49)</option><option value="FR">Fransa (+33)</option><option value="NL">Hollanda (+31)</option><option value="BE">Belçika (+32)</option><option value="AT">Avusturya (+43)</option><option value="CH">İsviçre (+41)</option><option value="IT">İtalya (+39)</option><option value="ES">İspanya (+34)</option><option value="AZ">Azerbaycan (+994)</option></select></label>'+
      '<label class="field"><span>Telefon numarası</span><input name="phone" type="tel" autocomplete="tel" required maxlength="24" placeholder="05XXXXXXXXX"></label>'+
      '<label class="field"><span>Şifre</span><input name="password" type="password" autocomplete="new-password" required minlength="8" maxlength="128"></label>'+
      '<label class="field"><span>Şifre tekrar</span><input name="password_confirm" type="password" autocomplete="new-password" required minlength="8" maxlength="128"></label>'+
      '<label class="register-consent"><input name="consent" type="checkbox" required><span>Kayıt talebimin yönetici incelemesine alınacağını ve e-posta doğrulama kodunun şu anda otomatik gönderilmediğini anlıyorum.</span></label>'+
      '<div class="notice">Kayıt sonrası hesabın <strong>Yönetici Onayı Bekliyor</strong> durumunda oluşturulur. Yönetici onaylayana kadar giriş yapamazsın. E-posta adresi otomatik doğrulanmaz.</div>'+
      '<button class="button button-primary" id="registerSubmit" type="submit" style="width:100%">Üyelik Başvurusu Gönder</button>'+
      '<p class="muted">Zaten hesabın var mı? <button type="button" class="text-button" data-open="login">Giriş yap</button></p>'+
      '</form>';
    modal("Yeni üyelik",body);
    $("#registerForm").addEventListener("submit",async e=>{
      e.preventDefault();
      const form=e.currentTarget;
      const data=new FormData(form);
      const password=String(data.get("password")||"");
      const passwordConfirm=String(data.get("password_confirm")||"");
      if(password!==passwordConfirm){toast("Şifreler aynı değil.");return;}
      const btn=$("#registerSubmit");
      btn.disabled=true;
      btn.textContent="Başvuru gönderiliyor…";
      try{
        const lang=(document.documentElement.lang||"tr").toLowerCase().startsWith("en")?"en":"tr";
        const result=await window.UzmantechAPI.register({
          username:String(data.get("username")||"").trim(),
          email:String(data.get("email")||"").trim().toLowerCase(),
          phone:String(data.get("phone")||"").trim(),
          country_code:String(data.get("country_code")||"TR"),
          language_code:lang,
          password
        });
        modal("Başvurun alındı",'<div class="notice"><strong>'+esc(result.message||"Üyelik başvurun oluşturuldu.")+'</strong></div><p>Hesabın yönetici onayına alındı. Onay verildiğinde kullanıcı adı veya e-posta adresinle giriş yapabilirsin.</p><p class="muted">E-posta adresin otomatik doğrulanmadı. Yanlış bilgi girdiysen yöneticiyle iletişime geç.</p><button class="button button-primary" type="button" data-open="login" style="width:100%">Giriş ekranına dön</button>');
      }catch(error){
        toast(error.message);
        btn.disabled=false;
        btn.textContent="Üyelik Başvurusu Gönder";
      }
    });
  }

  function openForgotPassword(){
    modal("Şifremi unuttum",
      '<form id="forgotRequestForm">'+
      '<label class="field"><span>Hesabınıza kayıtlı e-posta</span><input name="email" type="email" autocomplete="email" required maxlength="254" placeholder="ornek@eposta.com"></label>'+
      '<p class="muted">E-posta adresiniz kayıtlıysa tek kullanımlık doğrulama kodu gönderilir.</p>'+
      '<button class="button button-primary" id="forgotRequestSubmit" type="submit" style="width:100%">Doğrulama Kodu Gönder</button></form>');
    $("#forgotRequestForm").addEventListener("submit",async e=>{
      e.preventDefault();
      const email=String(new FormData(e.currentTarget).get("email")||"").trim().toLowerCase();
      const btn=$("#forgotRequestSubmit");
      btn.disabled=true;btn.textContent="Kod hazırlanıyor…";
      try{
        await window.UzmantechAPI.requestPasswordReset({email});
        modal("Şifre sıfırlama",
          '<p>Bu e-posta bir Uzmantech hesabına kayıtlıysa doğrulama kodu gönderilmek üzere sıraya alındı.</p>'+
          '<form id="forgotConfirmForm">'+
          '<label class="field"><span>6 haneli doğrulama kodu</span><input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" required></label>'+
          '<label class="field"><span>Yeni şifre</span><input name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></label>'+
          '<label class="field"><span>Yeni şifre tekrar</span><input name="password_confirm" type="password" autocomplete="new-password" minlength="8" maxlength="128" required></label>'+
          '<button class="button button-primary" id="forgotConfirmSubmit" type="submit" style="width:100%">Şifremi Güncelle</button></form>');
        $("#forgotConfirmForm").addEventListener("submit",async ev=>{
          ev.preventDefault();
          const data=new FormData(ev.currentTarget);
          const password=String(data.get("password")||"");
          if(password!==String(data.get("password_confirm")||"")){toast("Şifreler aynı değil.");return;}
          const confirmBtn=$("#forgotConfirmSubmit");
          confirmBtn.disabled=true;confirmBtn.textContent="Güncelleniyor…";
          try{
            const result=await window.UzmantechAPI.confirmPasswordReset({
              email,code:String(data.get("code")||"").trim(),new_password:password
            });
            modal("Şifre güncellendi",
              '<div class="notice"><strong>'+esc(result.message||"Şifreniz başarıyla güncellendi.")+'</strong></div>'+
              '<button class="button button-primary" type="button" data-open="login" style="width:100%">Giriş Yap</button>');
          }catch(error){toast(error.message);confirmBtn.disabled=false;confirmBtn.textContent="Şifremi Güncelle";}
        });
      }catch(error){toast(error.message);btn.disabled=false;btn.textContent="Doğrulama Kodu Gönder";}
    });
  }

  async function refreshExchangeRate(force=false){
    let rate=state.exchangeRate;
    if(force||!rate||Date.now()-state.exchangeRateAt>=60000){
      const result=await window.UzmantechAPI.exchangeRate();
      rate=Number(result.usd_sell);
      if(!Number.isFinite(rate)||rate<=0)throw new Error("Enpara USD satış kuru alınamadı.");
      state.exchangeRate=rate;state.exchangeRateAt=Date.now();
    }
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
    const planRate=$("#planRateNote");
    if(planRate)planRate.textContent="1 USD = "+rate.toLocaleString("tr-TR",{minimumFractionDigits:4,maximumFractionDigits:4})+" TL";
    return rate;
  }

  function openPlans(){
    if(!state.user){openLogin();return;}
    refreshExchangeRate(true).then(async rate=>{
      const packages=[
        ["monthly","1 Aylık","30 gün",15],
        ["half_year","6 Aylık","180 gün",30],
        ["annual","12 Aylık","365 gün",40]
      ];
      const cards=packages.map(item=>{
        const key=item[0],label=item[1],days=item[2],usd=item[3];
        return '<article class="plan-option"><h3>'+label+'</h3><p>'+days+'</p><strong data-usd="'+key+'">'+usd+' USD</strong><b data-price="'+key+'">Hesaplanıyor…</b><button class="button button-primary" type="button" data-plan="'+key+'">Bu paketi seç</button></article>';
      }).join("");
      modal("Lisans paketleri",'<p class="muted">Ödeme Enpara USD satış kuru üzerinden TL olarak hesaplanır. Dekont yönetici tarafından onaylandığında lisans süresi hesabına eklenir.</p><div class="plan-options">'+cards+'</div><p class="muted" id="planRateNote">1 USD = '+rate.toLocaleString("tr-TR",{minimumFractionDigits:4,maximumFractionDigits:4})+' TL</p>');
      await refreshExchangeRate();
    }).catch(error=>toast(error.message));
  }

  async function openPaymentHistory(){
    if(!state.user){openLogin();return;}
    modal("Ödeme geçmişim",'<div class="empty-state">Ödeme kayıtları yükleniyor…</div>');
    try{
      const result=await window.UzmantechAPI.paymentHistory();
      const rows=result.payments||[];
      const names={monthly:"1 Aylık",half_year:"6 Aylık",annual:"12 Aylık"};
      const statuses={pending:"Onay bekliyor",approved:"Onaylandı",rejected:"Reddedildi"};
      const html=rows.length
        ? '<div class="payment-history-list">'+rows.map(p=>{
            const usd=Number(p.amount||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
            const tl=p.amount_try==null?"TL tutarı kaydedilmemiş":new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY"}).format(Number(p.amount_try));
            const dt=p.created_at?new Date(p.created_at).toLocaleString("tr-TR"):"-";
            const status=p.status||"pending";
            const rate=p.exchange_rate?Number(p.exchange_rate).toLocaleString("tr-TR",{minimumFractionDigits:4,maximumFractionDigits:4}):"";
            return '<article class="payment-history-item"><div><b>'+esc(names[p.plan]||p.plan)+'</b><small>'+esc(dt)+' · '+esc(p.license_days)+' gün</small></div><div class="payment-history-amount"><b>$'+usd+' USD</b><small>'+esc(tl)+(rate?' · Kur '+esc(rate):'')+'</small></div><span class="payment-history-status '+esc(status)+'">'+esc(statuses[status]||status)+'</span>'+(p.admin_note?'<p class="payment-history-note">'+esc(p.admin_note)+'</p>':'')+'</article>';
          }).join("")+'</div>'
        : '<div class="empty-state">Henüz ödeme bildirimin bulunmuyor.</div>';
      modal("Ödeme geçmişim",html);
    }catch(error){
      modal("Ödeme geçmişim",'<div class="notice">'+esc(error.message)+'</div>');
    }
  }

  async function openPlan(plan,label,days){
    if(!state.user){openLogin();return;}
    const usd=({monthly:15,half_year:30,annual:40})[plan];
    if(!usd){toast("Seçilen lisans paketi geçersiz.");return;}
    let rate;
    try{rate=await refreshExchangeRate(true);}catch(error){toast(error.message);return;}
    const amountTry=Math.round(usd*rate*100)/100;
    const amountText=new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY",minimumFractionDigits:2}).format(amountTry);
    modal(label+" üyelik başvurusu",'<div class="notice">Paket süresi: <strong>'+days+' gün</strong>. Paket bedeli: <strong>'+usd+' USD</strong>. Havale tutarı: <strong>'+amountText+'</strong>.</div><div class="content-card" style="margin:12px 0;padding:14px"><strong>Havale bilgileri</strong><p>Alıcı: Ömer Özen<br>Banka: Enpara<br>IBAN: <strong>TR65 0015 7000 0000 0091 1012 51</strong></p><p class="muted">1 USD = '+rate.toLocaleString("tr-TR",{minimumFractionDigits:4,maximumFractionDigits:4})+' TL. Sunucu bu kuru ödeme bildirimi sırasında yeniden doğrular.</p></div><form id="paymentForm"><label class="field"><span>Ödeyen adı soyadı</span><input name="payer_name" required minlength="2" maxlength="120"></label><label class="field"><span>Havale tutarı (TL)</span><input name="amount" type="text" value="'+amountTry.toFixed(2)+'" readonly></label><input name="amount_usd" type="hidden" value="'+usd+'"><input name="rate" type="hidden" value="'+rate+'"><label class="field"><span>Banka dekontu (PDF, JPG, PNG, WEBP · en fazla 5 MB)</span><input name="receipt" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" required></label><button class="button button-primary" id="paymentSubmit" type="submit" style="width:100%">Dekontu gönder</button><p class="muted">Dekontun yönetici onayına düşer. Onaydan sonra lisans süren otomatik uzatılır.</p></form>');
    $("#paymentForm").addEventListener("submit",async e=>{
      e.preventDefault();
      const form=e.currentTarget;
      const file=form.elements.receipt.files[0];
      const amount=Number(form.elements.amount.value);
      const rateValue=Number(form.elements.rate.value);
      const amountUsd=Number(form.elements.amount_usd.value);
      const payerName=form.elements.payer_name.value.trim();
      if(!file||file.size===0||file.size>5*1024*1024){toast("Dekont dosyası boş olamaz ve 5 MB sınırını aşamaz.");return;}
      if(!["application/pdf","image/jpeg","image/png","image/webp"].includes(file.type)){toast("Yalnızca PDF, JPG, PNG veya WEBP yükleyebilirsin.");return;}
      const btn=$("#paymentSubmit");
      btn.disabled=true;
      btn.textContent="Güvenli şekilde yükleniyor…";
      try{
        const latest=await window.UzmantechAPI.exchangeRate();
        const currentRate=Number(latest.usd_sell);
        const currentAmount=Math.round(amountUsd*currentRate*100)/100;
        if(!Number.isFinite(currentRate)||currentRate<=0)throw new Error("Güncel döviz kuru doğrulanamadı.");
        if(Math.abs(currentRate-rateValue)>0.01||Math.abs(currentAmount-amount)>0.02){
          form.elements.amount.value=currentAmount.toFixed(2);
          form.elements.rate.value=String(currentRate);
          toast("Döviz kuru güncellendi. Yeni TL tutarını kontrol edip dekontu yeniden gönder.");
          return;
        }
        const result=await window.UzmantechAPI.paymentReceipt({plan,amountUsd,amountTry:amount,rate:rateValue,payerName,file});
        closeModal();
        toast(result.message||"Ödeme bildirimi alındı.");
      }catch(error){toast(error.message);}
      finally{btn.disabled=false;btn.textContent="Dekontu gönder";}
    });
  }


  async function loadSupportHistory(){
    const host=$("#supportHistory");
    if(!host)return;
    host.innerHTML='<div class="empty-state">Destek geçmişi yükleniyor…</div>';
    try{
      const result=await window.UzmantechAPI.supportHistory();
      const statuses={open:"Yeni",in_progress:"İşlemde",resolved:"Çözüldü"};
      const rows=result.tickets||[];
      host.innerHTML=rows.length?'<div class="support-history-list">'+rows.map(ticket=>
        '<article class="support-history-item"><div><b>'+esc(ticket.subject)+'</b><small>'+esc(new Date(ticket.created_at).toLocaleString("tr-TR"))+' · '+esc(statuses[ticket.status]||ticket.status)+'</small></div>'+
        (ticket.admin_note?'<p>'+esc(ticket.admin_note)+'</p>':'')+'</article>'
      ).join("")+'</div>':'<div class="empty-state">Henüz destek talebiniz yok.</div>';
    }catch(error){host.innerHTML='<div class="notice">'+esc(error.message)+'</div>';}
  }

  function openSupport(){
    if(!state.user){openLogin();return;}
    modal("Hızlı Destek",
      '<p class="muted">Sorununuzu açıklayın. Talebiniz yönetim paneline kaydedilir ve buradan durumunu takip edebilirsiniz.</p>'+
      '<form id="supportForm">'+
      '<label class="field"><span>Konu</span><input name="subject" required minlength="4" maxlength="120" placeholder="Örn. Cihaz bağlantısı sorunu"></label>'+
      '<label class="field"><span>Kategori</span><select name="category" required><option value="technical">Teknik destek</option><option value="license">Lisans ve üyelik</option><option value="payment">Ödeme</option><option value="archive">Dosya arşivi</option><option value="other">Diğer</option></select></label>'+
      '<label class="field"><span>Mesajınız</span><textarea name="message" required minlength="20" maxlength="4000" rows="5" placeholder="Sorunu ve varsa aldığınız hata mesajını açıklayın."></textarea></label>'+
      '<button class="button button-primary" id="supportSubmit" type="submit" style="width:100%">Destek Talebini Gönder</button></form>'+
      '<div class="support-history-heading"><h3>Destek taleplerim</h3><span class="muted">Son 30 kayıt</span></div><div id="supportHistory"></div>');
    $("#supportForm").addEventListener("submit",async e=>{
      e.preventDefault();
      const form=e.currentTarget, data=new FormData(form), btn=$("#supportSubmit");
      const subject=String(data.get("subject")||"").trim();
      const category=String(data.get("category")||"other");
      const message=String(data.get("message")||"").trim();
      if(subject.length<4||message.length<20){toast("Konu ve mesaj alanlarını kontrol edin.");return;}
      btn.disabled=true;btn.textContent="Gönderiliyor…";
      try{
        const result=await window.UzmantechAPI.supportTicket({subject,category,message});
        toast(result.message||"Destek talebi oluşturuldu.");
        form.reset();
        await loadSupportHistory();
      }catch(error){toast(error.message);}
      finally{btn.disabled=false;btn.textContent="Destek Talebini Gönder";}
    });
    loadSupportHistory();
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
    if(opener?.dataset.open==="forgot")openForgotPassword();
    if(opener?.dataset.open==="plans")openPlans();
    if(e.target.closest("#paymentHistoryBtn"))openPaymentHistory();
    if(e.target.id==="modalClose"||e.target.id==="modal")closeModal();
    if(e.target.closest("#logoutBtn")){window.UzmantechAPI.setSession("");state.user=null;syncHeader();toast("Oturum kapatıldı.");loadArchive();}
    if(e.target.id==="menuToggle")$(".main-nav")?.classList.toggle("open");
    const tool=e.target.closest("[data-tool]");
    if(tool){modal(tool.dataset.tool,'<div class="notice">Bu işlem Uzmantech masaüstü uygulamasında gerçekleştirilir. Web portalı cihaz üzerinde ADB veya Fastboot komutu çalıştırmaz.</div><p class="muted">Masaüstü uygulamasındaki ilgili bölümü kullanabilirsin.</p>');}
    if(e.target.closest("#supportRequest"))openSupport();
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

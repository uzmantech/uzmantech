(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const state = { user: null, category: "all", query: "", busy: false, timer: null };
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
    if(!actions) return;
    if(state.user){
      actions.innerHTML='<span class="muted header-user">'+esc(state.user.username)+'</span><button class="button button-quiet" id="logoutBtn">Çıkış Yap</button>';
    }else{
      actions.innerHTML='<button class="button button-quiet" data-open="login">Giriş Yap</button><button class="button button-primary" data-open="register">Üye Ol</button><button class="menu-toggle" id="menuToggle" aria-label="Menüyü aç">☰</button>';
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
  function openLogin(){
    modal("Üye girişi",'<form id="loginForm"><label class="field"><span>Kullanıcı adı veya e-posta</span><input name="identifier" autocomplete="username" required maxlength="254"></label><label class="field"><span>Şifre</span><input name="password" type="password" autocomplete="current-password" required maxlength="256"></label><button class="button button-primary" id="loginSubmit" type="submit" style="width:100%">Giriş Yap</button><p class="muted">Masaüstü uygulamasındaki cihaz kilidinden bağımsız web oturumu kullanılır.</p></form>');
    $("#loginForm").addEventListener("submit",async e=>{
      e.preventDefault(); const btn=$("#loginSubmit");btn.disabled=true;btn.textContent="Kontrol ediliyor…";
      const form=new FormData(e.currentTarget);
      try{
        const result=await window.UzmantechAPI.login({identifier:form.get("identifier"),password:form.get("password")});
        window.UzmantechAPI.setSession(result.session_token);state.user=result.user;closeModal();syncHeader();toast("Giriş başarılı. Hoş geldiniz.");loadArchive();
      }catch(error){toast(error.message);}
      finally{btn.disabled=false;btn.textContent="Giriş Yap";}
    });
  }
  function openRegister(){
    modal("Yeni üyelik",'<div class="notice">Web kayıt ekranı, mevcut e-posta doğrulama ve yönetici onay akışına bağlanacak. E-posta gönderim servisi henüz web için yapılandırılmadığından şu anda kayıt alınmıyor.</div><p class="muted">Hesap güvenliği için doğrulama kodu gönderilemeyen bir kayıt formunu aktif etmiyorum.</p>');
  }
  document.addEventListener("click",e=>{
    const opener=e.target.closest("[data-open]");
    if(opener?.dataset.open==="login")openLogin();
    if(opener?.dataset.open==="register")openRegister();
    if(e.target.id==="modalClose"||e.target.id==="modal")closeModal();
    if(e.target.id==="logoutBtn"){window.UzmantechAPI.setSession("");state.user=null;syncHeader();toast("Oturum kapatıldı.");loadArchive();}
    if(e.target.id==="menuToggle")$(".main-nav")?.classList.toggle("open");
    if(e.target.closest("[data-file]")&&!state.user){openLogin();}
    if(e.target.id==="deviceSearchForm"){}
  });
  $("#deviceSearchForm").addEventListener("submit",e=>{e.preventDefault();state.query=$("#deviceQuery").value.trim();$("#archiveQuery").value=state.query;loadArchive();$("#arsiv").scrollIntoView({behavior:"smooth"});});
  $("#deviceQuery").addEventListener("input",e=>{
    clearTimeout(state.timer);state.timer=setTimeout(()=>{state.query=e.target.value.trim();$("#archiveQuery").value=state.query;loadArchive();},450);
  });
  $("#archiveQuery").addEventListener("input",e=>{clearTimeout(state.timer);state.timer=setTimeout(()=>{state.query=e.target.value.trim();loadArchive();},450);});
  $("#archiveCategory").addEventListener("change",e=>{state.category=e.target.value;loadArchive();});
  $("#modalClose").addEventListener("click",closeModal);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
  (async()=>{
    const token=window.UzmantechAPI.getToken();
    if(token){try{const result=await window.UzmantechAPI.session();state.user=result.user;}catch{window.UzmantechAPI.setSession("");}}
    syncHeader();await loadArchive();
  })();
})();
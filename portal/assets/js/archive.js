(() => {
  const $=s=>document.querySelector(s);
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const state={user:null,catalog:{},query:"",category:"all",activeModel:""};
  const toast=m=>{const el=$("#toast");el.textContent=m;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),3000);};
  function showLogin(){
    $("#modalTitle").textContent="Üye girişi";
    $("#modalBody").innerHTML='<form id="loginForm"><label class="field"><span>Kullanıcı adı veya e-posta</span><input name="identifier" autocomplete="username" required></label><label class="field"><span>Şifre</span><input name="password" type="password" autocomplete="current-password" required></label><button class="button button-primary" type="submit" style="width:100%">Giriş Yap</button></form>';
    $("#modal").classList.add("open");
    $("#loginForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{const r=await UzmantechAPI.login({identifier:f.get("identifier"),password:f.get("password")});UzmantechAPI.setSession(r.session_token);state.user=r.user;syncHeader();$("#modal").classList.remove("open");toast("Giriş başarılı.");loadResults();}catch(err){toast(err.message);}});
  }
  function syncHeader(){
    const el=$("#archiveHeaderActions");if(!el)return;
    el.innerHTML=state.user?'<span class="muted header-user">'+esc(state.user.username)+'</span><button class="button button-quiet" id="logoutBtn">Çıkış Yap</button><button class="menu-toggle" id="menuToggle">☰</button>':'<button class="button button-quiet" data-open="login">Giriş Yap</button><a class="button button-primary" href="index.html#uyelik">Üye Ol</a><button class="menu-toggle" id="menuToggle">☰</button>';
  }
  function renderBrands(){
    const list=$("#brandList"),entries=Object.entries(state.catalog).sort((a,b)=>a[0].localeCompare(b[0],"tr"));
    $("#brandCount").textContent=entries.length+" marka";
    $("#archiveCount").textContent=entries.reduce((n,[,models])=>n+models.length,0).toLocaleString("tr-TR")+" model";
    const filter=$("#brandSearch").value.trim().toLocaleLowerCase("tr-TR");
    const visible=entries.filter(([brand,models])=>!filter||brand.toLocaleLowerCase("tr-TR").includes(filter)||models.some(m=>m.toLocaleLowerCase("tr-TR").includes(filter)));
    list.innerHTML=visible.map(([brand,models])=>'<details class="brand-item" data-brand="'+esc(brand)+'"><summary><span>'+esc(brand)+'</span><span class="model-count">'+models.length+'</span></summary><div class="model-list">'+models.map(model=>'<button class="model-choice" type="button" data-model="'+esc(model)+'">'+esc(model)+'</button>').join("")+'</div></details>').join("")||'<div class="empty-state">Marka bulunamadı.</div>';
    if(filter)list.querySelectorAll(".brand-item").forEach(d=>d.open=true);
  }
  function updateFilter(){
    const label=$("#activeFilter span");
    label.textContent=(state.activeModel?"Model: "+state.activeModel:state.query?"Arama: "+state.query:"Tüm markalar")+(state.category!=="all"?" · "+state.category.toUpperCase():"");
    $("#clearFilter").hidden=!state.query&&!state.activeModel&&state.category==="all";
  }
  function resultCard(entry){
    const d=entry.data||{};let brand="",model="",code="",desc="",link="",version="",region="";
    if(Array.isArray(d)){[brand,model,code,desc,link,version,,region]=d;}
    else{brand=d.brand||d.manufacturer||d.category||"";model=d.model||d.title||d.name||"Teknik kayıt";code=d.codename||d.code||d.model_code||"";desc=d.description||d.notes||d.message||d.source||"";link=d.download_url||d.file_url||d.download||d.url||d.link||d.source_url||"";version=d.version||d.firmware_version||"";region=d.region||d.csc||"";}
    const category=String(entry.category||"").replace("_"," ").toUpperCase();
    const hasLink=state.user&&typeof link==="string"&&/^https?:\/\//i.test(link.trim());
    return '<article class="archive-result"><div><span class="tag">'+esc(category)+'</span></div><h3>'+esc(model||code||"Arşiv kaydı")+'</h3><p>'+esc(desc||"Uzmantech teknik arşiv kaydı")+'</p><div class="result-meta">'+esc([brand,code&&("Kod: "+code),version,region].filter(Boolean).join(" · "))+'</div>'+(hasLink?'<a class="button button-primary" target="_blank" rel="noopener noreferrer" href="'+esc(link)+'">Dosyayı indir ↗</a>':'<button class="button button-outline" data-locked="1">'+(state.user?"İndirme bağlantısı yok":"Üyelik ile indir")+'</button>')+'</article>';
  }
  async function loadResults(){
    const grid=$("#archiveGrid");grid.innerHTML='<div class="archive-empty">Arşiv kayıtları aranıyor…</div>';updateFilter();
    try{const r=await UzmantechAPI.archive({q:state.query,category:state.category,limit:100});const rows=r.results||[];grid.innerHTML=rows.map(resultCard).join("")||'<div class="archive-empty">Bu model veya arama için kayıt bulunamadı. Başka bir model deneyin.</div>';$("#archiveFooter").textContent=rows.length+" kayıt gösteriliyor. Daha fazla sonuç için aramayı daraltabilirsin.";}
    catch(e){grid.innerHTML='<div class="archive-empty">'+esc(e.message)+'</div>';}
  }
  function chooseModel(model){
    state.query=model;state.activeModel=model;$("#archiveQuery").value=model;$("#brandList").querySelectorAll(".model-choice").forEach(b=>b.classList.toggle("active",b.dataset.model===model));loadResults();
  }
  $("#brandList").addEventListener("click",e=>{const b=e.target.closest("[data-model]");if(b)chooseModel(b.dataset.model);});
  $("#brandSearch").addEventListener("input",renderBrands);
  $("#searchArchive").addEventListener("click",()=>{state.query=$("#archiveQuery").value.trim();state.activeModel="";loadResults();});
  $("#archiveQuery").addEventListener("keydown",e=>{if(e.key==="Enter"){state.query=e.target.value.trim();state.activeModel="";loadResults();}});
  $("#archiveCategory").addEventListener("change",e=>{state.category=e.target.value;loadResults();});
  $("#clearFilter").addEventListener("click",()=>{state.query="";state.activeModel="";state.category="all";$("#archiveQuery").value="";$("#archiveCategory").value="all";$("#brandSearch").value="";renderBrands();loadResults();});
  document.addEventListener("click",e=>{
    if(e.target.closest('[data-open="login"]'))showLogin();
    if(e.target.id==="modalClose"||e.target.id==="modal")$("#modal").classList.remove("open");
    if(e.target.id==="logoutBtn"){UzmantechAPI.setSession("");state.user=null;syncHeader();loadResults();toast("Oturum kapatıldı.");}
    if(e.target.id==="menuToggle")$(".main-nav")?.classList.toggle("open");
    if(e.target.closest("[data-locked]"))showLogin();
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape")$("#modal").classList.remove("open");});
  (async()=>{
    const token=UzmantechAPI.getToken();if(token){try{const r=await UzmantechAPI.session();state.user=r.user;}catch{UzmantechAPI.setSession("");}}
    syncHeader();
    try{const r=await UzmantechAPI.catalog();state.catalog=r.catalog||{};renderBrands();}catch(e){$("#brandList").innerHTML='<div class="empty-state">Marka kataloğu yüklenemedi.</div>';}
    const q=new URLSearchParams(location.search).get("q")||"";if(q){state.query=q;state.activeModel=q;$("#archiveQuery").value=q;}
    await loadResults();
  })();
})();
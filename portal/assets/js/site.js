(() => {
  const devices = [
    ["Xiaomi","Redmi Note 13 Pro","garnet"],["Xiaomi","POCO X6 Pro","duchamp"],["Xiaomi","Redmi Note 13","sapphire"],
    ["Samsung","Galaxy A54 5G","SM-A546E"],["Samsung","Galaxy S23 Ultra","SM-S918B"],
    ["OPPO","Reno 11","CPH2599"],["vivo","V29","V2250"],["Huawei","P30 Pro","VOG-L29"]
  ];
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const toast = (message) => { const el=$("#toast"); el.textContent=message; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2800); };
  function searchDevices(query) {
    const box=$("#searchResults"), q=query.trim().toLowerCase();
    if(!q){box.innerHTML="";return;}
    const matches=devices.filter(row=>row.join(" ").toLowerCase().includes(q));
    box.innerHTML=matches.length ? matches.map(row=>'<div class="search-result"><div><b>'+row[1]+'</b><br><small>'+row[0]+' · '+row[2]+'</small></div><span class="tag">ÖRNEK</span></div>').join("") : '<div class="empty-state">Eşleşen örnek cihaz bulunamadı.</div>';
  }
  function filterArchive(){
    const q=$("#archiveQuery").value.toLowerCase().trim(), category=$("#archiveCategory").value;
    let shown=0;
    $$(".archive-card").forEach(card=>{
      const okCategory=category==="all"||card.dataset.category===category;
      const okQuery=!q||card.dataset.search.includes(q)||card.innerText.toLowerCase().includes(q);
      card.hidden=!(okCategory&&okQuery); if(!card.hidden)shown++;
    });
    $("#archiveEmpty").hidden=shown!==0;
  }
  function openModal(title, html){$("#modalTitle").textContent=title;$("#modalBody").innerHTML=html;$("#modal").classList.add("open");}
  function closeModal(){$("#modal").classList.remove("open");}
  document.addEventListener("click", event=>{
    const open=event.target.closest("[data-open]");
    const file=event.target.closest("[data-file]");
    const course=event.target.closest("[data-course]");
    const plan=event.target.closest("[data-plan]");
    if(open?.dataset.open==="login")openModal("Üye girişi",'<label class="field"><span>Kullanıcı adı veya e-posta</span><input autocomplete="username" placeholder="kullanici@ornek.com"></label><label class="field"><span>Şifre</span><input type="password" autocomplete="current-password"></label><button class="button button-primary" style="width:100%" id="demoLogin">Giriş Yap</button><p class="muted">Demo görünümü. Gerçek oturum açılmaz.</p>');
    if(open?.dataset.open==="register")openModal("Hesap oluştur",'<label class="field"><span>Kullanıcı adı</span><input placeholder="kullaniciadi"></label><label class="field"><span>E-posta</span><input type="email" placeholder="mail@ornek.com"></label><label class="field"><span>Telefon</span><input placeholder="05xx xxx xx xx"></label><label class="field"><span>Şifre</span><input type="password"></label><button class="button button-primary" style="width:100%" id="demoRegister">Kayıt ol</button><p class="muted">Kayıt ve e-posta doğrulama henüz bağlı değil.</p>');
    if(file)openModal(file.dataset.file,'<div class="notice">Bu bir örnek katalog kaydıdır. Gerçek dosya bağlantısı henüz eklenmedi.</div><p class="muted">Canlı sistemde indirme yetkisi sunucu tarafında doğrulanacak ve süreli bağlantı verilecek.</p><button class="button button-primary" style="width:100%" id="demoDownload">Üyelik ile indir</button>');
    if(course)openModal(course.dataset.course,'<div class="notice">Video oynatıcı henüz bağlanmadı. Bu ekran eğitim detay taslağıdır.</div>');
    if(plan)openModal(plan.dataset.plan+" üyelik",'<div class="notice">Gerçek ödeme alınmaz. Canlı sistemde havale/EFT bildirimi yönetici onayına gönderilecek.</div><button class="button button-primary" style="width:100%" id="demoPayment">Devam et</button>');
    if(event.target.id==="modalClose"||event.target.id==="modal")closeModal();
    if(event.target.id==="demoLogin")toast("Demo: gerçek giriş servisi bağlı değil.");
    if(event.target.id==="demoRegister")toast("Demo: kayıt veritabanına gönderilmedi.");
    if(event.target.id==="demoDownload")toast("Demo: indirme kapalı.");
    if(event.target.id==="demoPayment")toast("Demo: ödeme talebi oluşturulmadı.");
    if(event.target.id==="menuToggle")$(".main-nav").classList.toggle("open");
  });
  $("#deviceSearchForm").addEventListener("submit",e=>{e.preventDefault();searchDevices($("#deviceQuery").value);});
  $("#deviceQuery").addEventListener("input",e=>searchDevices(e.target.value));
  $("#archiveQuery").addEventListener("input",filterArchive);
  $("#archiveCategory").addEventListener("change",filterArchive);
  $("#modalClose").addEventListener("click",closeModal);
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
  if(window.UZMANTECH_CONFIG?.mode==="demo")console.info("Uzmantech portal demo mode: no live account, payment or download service.");
})();
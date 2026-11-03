(() => {
 const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
 const api=window.UzmantechAPI;
 let users=[];
 const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
 const toast=m=>{const e=$("#toast");e.textContent=m;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),3200)};
 function navigate(id){$$(".view").forEach(v=>v.classList.toggle("active",v.id===id));$$("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===id));$("#breadcrumb").textContent=id==="users"?"Üyeler ve Lisanslar":id==="archive"?"Arşiv durumu":"Genel Bakış";$("#sidebar").classList.remove("open");}
 async function adminCall(action,extra={}){return api.admin({action,...extra});}
 function renderUsers(){
  const q=$("#userSearch").value.trim().toLocaleLowerCase("tr-TR");
  const list=users.filter(u=>[u.username,u.email,u.phone].join(" ").toLocaleLowerCase("tr-TR").includes(q));
  $("#usersBody").innerHTML=list.map(u=>{
   const expiry=u.expiry_date?new Date(u.expiry_date).toLocaleDateString("tr-TR"):"-";
   const status=u.status==="active"?"Aktif":u.status==="pending"?"Onay bekliyor":"Pasif";
   const buttons=u.status==="pending"
    ?'<button class="btn" data-action="activate" data-id="'+esc(u.id)+'">Onayla + lisans ver</button> <button class="btn" data-action="disable" data-id="'+esc(u.id)+'">Reddet</button>'
    :'<button class="btn" data-action="extend" data-id="'+esc(u.id)+'">Süre uzat</button> <button class="btn" data-action="disable" data-id="'+esc(u.id)+'">Pasifleştir</button>';
   return '<tr><td>'+esc(u.username)+'</td><td>'+esc(u.email)+'</td><td><span class="status '+(u.status==="active"?"active":u.status==="pending"?"pending":"expired")+'">'+status+'</span></td><td>'+expiry+'</td><td>'+buttons+'</td></tr>';
  }).join("")||'<tr><td colspan="5">Kayıt bulunamadı.</td></tr>';
 }
 async function loadUsers(){
  $("#usersBody").innerHTML='<tr><td colspan="5">Kullanıcılar yükleniyor…</td></tr>';
  const result=await adminCall("list");users=result.users||[];renderUsers();
  const now=Date.now(),active=users.filter(u=>u.status==="active"),pending=users.filter(u=>u.status==="pending"),expired=active.filter(u=>u.expiry_date&&new Date(u.expiry_date).getTime()<=now);
  $("#statTotal").textContent=users.length;$("#statActive").textContent=active.length;$("#statPending").textContent=pending.length;$("#statExpired").textContent=expired.length;
 }
 async function loadDashboard(){await loadUsers();}
 async function enter(user){
  if(user.role!=="admin"){api.setSession("");throw new Error("Bu hesap yönetici yetkisine sahip değil.");}
  $("#loginView").hidden=true;$("#appView").hidden=false;$("#adminName").textContent=user.username;$("#logoutBtn").hidden=false;
  await loadDashboard();
 }
 $("#adminLogin").addEventListener("submit",async e=>{
  e.preventDefault();const btn=$("#adminLoginBtn");btn.disabled=true;btn.textContent="Kontrol ediliyor…";$("#loginError").textContent="";
  const form=new FormData(e.currentTarget);
  try{const result=await api.login({identifier:form.get("identifier"),password:form.get("password")});api.setSession(result.session_token);await enter(result.user);toast("Yönetici girişi başarılı.");}
  catch(err){api.setSession("");$("#loginError").textContent=err.message;}
  finally{btn.disabled=false;btn.textContent="Giriş Yap";}
 });
 async function checkSession(){if(!api.getToken())return;try{const result=await api.session();await enter(result.user);}catch{api.setSession("");}}
 $("#logoutBtn").addEventListener("click",()=>{api.setSession("");location.reload();});
 $("#refreshBtn").addEventListener("click",()=>loadDashboard().catch(e=>toast(e.message)));
 $("#reloadUsers").addEventListener("click",()=>loadUsers().catch(e=>toast(e.message)));
 $("#userSearch").addEventListener("input",renderUsers);
 $("#adminNav").addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)navigate(b.dataset.view);});
 document.addEventListener("click",async e=>{
  const jump=e.target.closest("[data-jump]");if(jump)navigate(jump.dataset.jump);
  if(e.target.id==="navToggle")$("#sidebar").classList.toggle("open");
  const btn=e.target.closest("[data-action]");if(!btn)return;
  const id=btn.dataset.id,action=btn.dataset.action,u=users.find(x=>x.id===id);if(!u)return;
  let days=365;
  if(action==="activate"||action==="extend"){
   const answer=prompt(u.username+" için kaç günlük lisans verilsin?",action==="activate"?"365":"30");
   if(answer===null)return;days=Number(answer);
   if(!Number.isInteger(days)||days<1||days>3650){toast("1 ile 3650 arasında gün gir.");return;}
  }
  const label=action==="activate"?"lisans verilsin":action==="extend"?"üyelik süresi uzatılsın":"hesap pasifleştirilsin";
  if(!confirm(u.username+" hesabı için "+label+" mı?"))return;
  btn.disabled=true;
  try{await adminCall(action,{user_id:id,...(action==="activate"||action==="extend"?{days}:{})});toast("İşlem tamamlandı.");await loadDashboard();}
  catch(err){toast(err.message);}
  finally{btn.disabled=false;}
 });
 checkSession().catch(e=>toast(e.message));
})();
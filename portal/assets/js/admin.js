(() => {
 const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
 const names={overview:"Genel Bakış",payments:"Ödeme Onayları",users:"Üyeler",archive:"Dosya Arşivi",courses:"Eğitimler",logs:"İşlem Kayıtları",settings:"Ayarlar"};
 const toast=(msg)=>{const el=$("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)};
 function navigate(id){$$(".view").forEach(v=>v.classList.toggle("active",v.id===id));$$("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===id));$("#breadcrumb").textContent=names[id]||"Yönetim";$("#sidebar").classList.remove("open");}
 $("#adminNav").addEventListener("click",e=>{const b=e.target.closest("[data-view]");if(b)navigate(b.dataset.view)});
 document.addEventListener("click",e=>{
  const jump=e.target.closest("[data-jump]");if(jump)navigate(jump.dataset.jump);
  const msg=e.target.closest("[data-toast]");if(msg)toast(msg.dataset.toast);
  if(e.target.id==="navToggle")$("#sidebar").classList.toggle("open");
  const decision=e.target.closest(".approve,.reject");
  if(decision){const row=decision.closest("tr"),username=row.cells[0].textContent,approved=decision.classList.contains("approve");if(!confirm(username+" için demo "+(approved?"onay":"ret")+" işlemi yapılsın mı?"))return;row.cells[5].innerHTML='<span class="status '+(approved?"active":"expired")+'">'+(approved?"Onaylandı":"Reddedildi")+' · demo</span>';const count=$$("#paymentsTable tbody tr").filter(r=>r.cells[5].innerText.includes("Onayla")).length;$("#pendingTotal").textContent=count;$(".count").textContent=count;toast("Demo işlemi tamamlandı. Gerçek üyelik değişmedi.");}
 });
 $$("[data-search]").forEach(input=>input.addEventListener("input",()=>{const table=$("#"+input.dataset.search),q=input.value.toLowerCase();$$("tbody tr",table).forEach(row=>row.hidden=!row.innerText.toLowerCase().includes(q));}));
 console.info("Uzmantech admin UI loaded in prototype mode. No privileged operations are enabled.");
})();
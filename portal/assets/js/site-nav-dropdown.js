(()=>{
 if(window.__uzDropdownBound)return;
 window.__uzDropdownBound=true;
 const close=()=>{
  document.querySelectorAll(".site-nav-dropdown.is-open").forEach(drop=>{
   const menu=drop.querySelector(".site-nav-dropdown-menu");
   if(menu&&menu.dataset.portalOpen==="1"){
    menu.classList.remove("is-portal-open");
    menu.style.removeProperty("top");menu.style.removeProperty("left");
    menu.dataset.portalOpen="";
    drop.appendChild(menu);
   }
   drop.classList.remove("is-open");
   drop.querySelector(".site-nav-dropdown-toggle")?.setAttribute("aria-expanded","false");
  });
 };
 const open=(drop,toggle)=>{
  close();
  const menu=drop.querySelector(".site-nav-dropdown-menu");
  if(!menu)return;
  const rect=toggle.getBoundingClientRect();
  document.body.appendChild(menu);
  menu.dataset.portalOpen="1";
  menu.classList.add("is-portal-open");
  menu.style.top=Math.round(rect.bottom+6)+"px";
  menu.style.left=Math.max(8,Math.min(Math.round(rect.left),window.innerWidth-menu.offsetWidth-8))+"px";
  drop.classList.add("is-open");
  toggle.setAttribute("aria-expanded","true");
 };
 document.addEventListener("click",e=>{
  const toggle=e.target.closest(".site-nav-dropdown-toggle");
  if(toggle){
   const drop=toggle.closest(".site-nav-dropdown");
   if(drop?.classList.contains("is-open"))close();else if(drop)open(drop,toggle);
   e.preventDefault();e.stopPropagation();return;
  }
  if(e.target.closest(".site-nav-dropdown-menu.is-portal-open"))return;
  if(!e.target.closest(".site-nav-dropdown"))close();
 });
 document.addEventListener("keydown",e=>{if(e.key==="Escape")close();});
 window.addEventListener("resize",close);
 document.addEventListener("scroll",e=>{
  if(document.querySelector(".site-nav-dropdown.is-open")&&!e.target.closest?.(".site-nav-dropdown-menu"))close();
 },true);
})();
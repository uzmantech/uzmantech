(()=>{
 // Keep the global navigation compact: move Cam Uyumluluğu into Araçlar on every page using this shared controller.
 const globalNav=document.querySelector(".site-global-nav");
 if(globalNav){
  const camLink=globalNav.querySelector('a[href="cam-uyumluluk.html"]');
  let toolsMenu=globalNav.querySelector(".site-nav-dropdown .site-nav-dropdown-menu");
  if(camLink&&toolsMenu){
   const active=location.pathname.toLowerCase().endsWith("/cam-uyumluluk.html");
   camLink.classList.remove("site-nav-link");
   camLink.classList.add("site-nav-dropdown-item");
   camLink.classList.toggle("active",active);
   const icon=camLink.querySelector(".site-nav-icon");
   if(icon){icon.className="";icon.setAttribute("aria-hidden","true");}
   toolsMenu.appendChild(camLink);
  }
 }
 if(window.__uzDropdownBound)return;
 window.__uzDropdownBound=true;
 const close=()=>{
  const drop=document.querySelector(".site-nav-dropdown.is-open");
  const menu=document.querySelector(".site-nav-dropdown-menu.is-portal-open");
  if(drop&&menu){
   menu.classList.remove("is-portal-open");
   menu.style.removeProperty("top");menu.style.removeProperty("left");
   menu.dataset.portalOpen="";
   drop.appendChild(menu);
  }
  document.querySelectorAll(".site-nav-dropdown.is-open").forEach(node=>{
   node.classList.remove("is-open");
   node.querySelector(".site-nav-dropdown-toggle")?.setAttribute("aria-expanded","false");
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
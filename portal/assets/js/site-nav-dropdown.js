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
 // Global UZMAN ASISTAN robot launcher. One shared implementation for every portal page.
 if(!document.getElementById("uzman-asistan-site-widget")){
  const style=document.createElement("style");
  style.id="uzman-asistan-site-widget-style";
  style.textContent="#uzman-asistan-site-widget{position:fixed!important;display:block!important;right:0!important;bottom:0!important;max-width:none!important;max-height:none!important;min-width:0!important;min-height:0!important;border:0!important;margin:0!important;padding:0!important;background:transparent!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;z-index:2147483000!important;transition:width .18s ease,height .18s ease}";
  document.head.appendChild(style);
  const frame=document.createElement("iframe");
  frame.id="uzman-asistan-site-widget";
  frame.src=new URL("uzman-asistan.html?widget=1&mascot=fullbody-20261116-1",location.href).href;
  frame.title="UZMAN ASİSTAN";
  frame.setAttribute("aria-label","UZMAN ASİSTAN sohbet penceresi");
  frame.style.cssText="position:fixed;display:block;right:0;bottom:0;border:0;background:transparent;z-index:2147483000;transition:width .18s ease,height .18s ease";
  const setWidgetSize=(width,height)=>{frame.style.setProperty("width",width,"important");frame.style.setProperty("height",height,"important")};
  setWidgetSize(innerWidth<=560?"132px":"148px",innerWidth<=560?"174px":"190px");
  document.body.appendChild(frame);
  window.addEventListener("resize",()=>{if(frame.isConnected&&frame.offsetWidth<200)setWidgetSize(innerWidth<=560?"132px":"148px",innerWidth<=560?"174px":"190px")});
  window.addEventListener("message",event=>{
   if(event.source!==frame.contentWindow)return;
   const type=event.data?.type,mobile=innerWidth<=560;
   if(type==="uzman-asistan-resize"){
    const opened=!!event.data.open;
    setWidgetSize(opened?(mobile?"100vw":"454px"):(mobile?"132px":"148px"),opened?(mobile?"100vh":"684px"):(mobile?"174px":"190px"));
   }
  });
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
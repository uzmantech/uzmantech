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
  style.textContent="#uzman-asistan-site-widget{position:fixed!important;display:block!important;right:0!important;bottom:0!important;max-width:none!important;max-height:none!important;min-width:0!important;min-height:0!important;border:0!important;margin:0!important;padding:0!important;background:transparent!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;touch-action:manipulation!important;z-index:2147483000!important;transition:width .18s ease,height .18s ease}";
  document.head.appendChild(style);
  const frame=document.createElement("iframe");
  frame.id="uzman-asistan-site-widget";
  frame.src=new URL("uzman-asistan.html?widget=1&mascot=parent-launcher-20261116-2",location.href).href;
  frame.title="UZMAN ASİSTAN";
  frame.setAttribute("aria-label","UZMAN ASİSTAN sohbet penceresi");
  frame.style.cssText="position:fixed;display:block;right:0;bottom:0;border:0;background:transparent;z-index:2147483000;pointer-events:none;transition:width .18s ease,height .18s ease";
  const setWidgetSize=(width,height)=>{frame.style.setProperty("width",width,"important");frame.style.setProperty("height",height,"important")};
  const viewportHeight=()=>Math.round(window.visualViewport?.height||window.innerHeight);
  const mobile=()=>innerWidth<=560;
  const setClosedSize=()=>setWidgetSize(mobile()?"1px":"1px",mobile()?"1px":"1px");
  setClosedSize();
  document.body.appendChild(frame);
  const mascot=document.createElement("button");
  mascot.type="button";
  mascot.id="uzman-asistan-parent-mascot";
  mascot.setAttribute("aria-label","UZMAN ASİSTAN sohbetini aç");
  mascot.innerHTML="<svg class=\"uzman-parent-robot\" viewBox=\"0 0 120 160\" role=\"img\" aria-label=\"UZMAN robot maskotu\" xmlns=\"http://www.w3.org/2000/svg\">\n<defs>\n <linearGradient id=\"uBody\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop stop-color=\"#f5fdff\"/><stop offset=\".48\" stop-color=\"#9cc9dd\"/><stop offset=\"1\" stop-color=\"#36728f\"/></linearGradient>\n <linearGradient id=\"uDark\" x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\"><stop stop-color=\"#173b55\"/><stop offset=\"1\" stop-color=\"#061522\"/></linearGradient>\n <linearGradient id=\"uCyan\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"1\"><stop stop-color=\"#a4ffff\"/><stop offset=\".45\" stop-color=\"#00dff5\"/><stop offset=\"1\" stop-color=\"#0075c9\"/></linearGradient>\n <filter id=\"uGlow\" x=\"-80%\" y=\"-80%\" width=\"260%\" height=\"260%\"><feGaussianBlur stdDeviation=\"3.2\" result=\"b\"/><feMerge><feMergeNode in=\"b\"/><feMergeNode in=\"SourceGraphic\"/></feMerge></filter>\n</defs>\n<ellipse cx=\"60\" cy=\"148\" rx=\"31\" ry=\"5\" fill=\"#00cfff\" opacity=\".28\" filter=\"url(#uGlow)\"/>\n<g stroke=\"#48eaff\" stroke-width=\"2.5\" stroke-linecap=\"round\" fill=\"none\" filter=\"url(#uGlow)\">\n <path d=\"M60 12V5\"/><path d=\"M43 30 34 24\"/><path d=\"M77 30 86 24\"/>\n</g><circle cx=\"60\" cy=\"5\" r=\"4\" fill=\"#7fffff\" filter=\"url(#uGlow)\"/>\n<g stroke=\"#235b78\" stroke-width=\"2\">\n <path d=\"M42 82 27 99 19 111\" fill=\"none\" stroke-width=\"10\" stroke-linecap=\"round\"/>\n <path d=\"M49 111 42 132 39 140\" fill=\"none\" stroke-width=\"12\" stroke-linecap=\"round\"/>\n <path d=\"M71 111 78 132 81 140\" fill=\"none\" stroke-width=\"12\" stroke-linecap=\"round\"/>\n</g>\n<g class=\"robot-wave-arm\" stroke=\"#235b78\" stroke-width=\"10\" stroke-linecap=\"round\" fill=\"none\">\n <path d=\"M78 82 93 99 101 111\"/>\n <circle cx=\"101\" cy=\"113\" r=\"7\" fill=\"url(#uBody)\" stroke=\"#6bb8d4\" stroke-width=\"1.5\"/>\n</g>\n<g fill=\"url(#uBody)\" stroke=\"#6bb8d4\" stroke-width=\"1.5\">\n <circle cx=\"19\" cy=\"113\" r=\"7\"/>\n <path d=\"M41 77 Q60 69 79 77 L82 111 Q60 123 38 111Z\"/>\n <path d=\"M45 108 39 136 Q39 143 47 143 L54 141 59 116Z\"/>\n <path d=\"M75 108 81 136 Q81 143 73 143 L66 141 61 116Z\"/>\n</g>\n<path d=\"M50 84 Q60 80 70 84 L70 104 Q60 111 50 104Z\" fill=\"url(#uDark)\" stroke=\"#00cfe9\" stroke-width=\"1.5\"/>\n<text x=\"60\" y=\"100\" text-anchor=\"middle\" font-family=\"Arial,sans-serif\" font-size=\"13\" font-weight=\"800\" fill=\"#55f4ff\">U</text>\n<g fill=\"url(#uBody)\" stroke=\"#70bad4\" stroke-width=\"1.5\">\n <rect x=\"13\" y=\"37\" width=\"94\" height=\"57\" rx=\"22\"/>\n <rect x=\"7\" y=\"51\" width=\"12\" height=\"28\" rx=\"6\"/><rect x=\"101\" y=\"51\" width=\"12\" height=\"28\" rx=\"6\"/>\n <rect x=\"17\" y=\"42\" width=\"86\" height=\"49\" rx=\"18\" fill=\"url(#uDark)\" stroke=\"#78c6df\"/>\n</g>\n<rect x=\"25\" y=\"49\" width=\"70\" height=\"35\" rx=\"13\" fill=\"#03101d\"/>\n<g fill=\"none\" stroke=\"url(#uCyan)\" stroke-width=\"4\" stroke-linecap=\"round\" filter=\"url(#uGlow)\">\n <path d=\"M36 65 Q43 56 50 65\"/><path d=\"M70 65 Q77 56 84 65\"/>\n</g>\n<path d=\"M51 75 Q60 80 69 75\" fill=\"none\" stroke=\"#39d9ee\" stroke-width=\"2\" stroke-linecap=\"round\"/>\n<path d=\"M38 43 Q60 34 82 43\" fill=\"none\" stroke=\"#fff\" stroke-width=\"2\" opacity=\".7\"/>\n<circle cx=\"13\" cy=\"65\" r=\"3\" fill=\"#00eaff\"/><circle cx=\"107\" cy=\"65\" r=\"3\" fill=\"#00eaff\"/>\n</svg>";
  mascot.style.cssText="position:fixed!important;right:2px!important;bottom:2px!important;width:132px!important;height:164px!important;padding:0!important;margin:0!important;border:0!important;background:transparent!important;display:grid!important;place-items:end center!important;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;z-index:2147483002!important;pointer-events:auto!important;overflow:visible!important";
  const mascotStyle=document.createElement("style");
  mascotStyle.textContent="#uzman-asistan-parent-mascot .uzman-parent-robot{display:block;width:100%;height:100%;object-fit:contain;overflow:visible;filter:drop-shadow(0 0 8px #00eaff55);transform-origin:50% 86%;animation:uzParentJump 1.9s cubic-bezier(.36,.07,.2,1) infinite}#uzman-asistan-parent-mascot .robot-wave-arm{transform-box:view-box;transform-origin:65% 51%;animation:uzParentWave .72s ease-in-out infinite alternate}@keyframes uzParentJump{0%,100%{transform:translateY(0) rotate(-5deg) scale(1)}22%{transform:translateY(-13px) rotate(-2deg) scale(1.015)}38%{transform:translateY(-18px) rotate(5deg) scale(1.02)}52%{transform:translateY(-5px) rotate(2deg) scale(1.01)}66%{transform:translateY(1px) rotate(-3deg) scale(1.04,.96)}78%{transform:translateY(0) rotate(2deg) scale(1)}}@keyframes uzParentWave{from{transform:rotate(-16deg)}to{transform:rotate(28deg)}}@media(prefers-reduced-motion:reduce){#uzman-asistan-parent-mascot .uzman-parent-robot,#uzman-asistan-parent-mascot .robot-wave-arm{animation:none!important}}";
  document.head.appendChild(mascotStyle);
  document.body.appendChild(mascot);
  mascot.addEventListener("click",()=>{
   mascot.style.setProperty("display","none","important");
   frame.style.setProperty("pointer-events","auto","important");
   setWidgetSize(mobile()?"100vw":"454px",mobile()?viewportHeight()+"px":"684px");
   const openFrame=()=>frame.contentWindow?.postMessage({type:"uzman-asistan-parent-open"},"*");
   if(frame.dataset.ready==="1")openFrame();else frame.addEventListener("load",openFrame,{once:true});
  });
  frame.addEventListener("load",()=>{frame.dataset.ready="1"});
  const closeWidgetFrame=()=>{
   frame.style.setProperty("pointer-events","none","important");
   setClosedSize();
   mascot.style.setProperty("display","grid","important");
  };
  window.addEventListener("resize",()=>{if(frame.style.pointerEvents!=="none"&&frame.offsetWidth>=innerWidth-2)setWidgetSize("100vw",viewportHeight()+"px")});
  window.visualViewport?.addEventListener("resize",()=>{if(frame.style.pointerEvents!=="none")setWidgetSize("100vw",viewportHeight()+"px")});
  window.addEventListener("message",event=>{
   if(event.source!==frame.contentWindow)return;
   if(event.data?.type==="uzman-asistan-resize"&&event.data.open===false)closeWidgetFrame();
   if(event.data?.type==="uzman-asistan-resize"&&event.data.open===true){
    frame.style.setProperty("pointer-events","auto","important");
    setWidgetSize(mobile()?"100vw":"454px",mobile()?viewportHeight()+"px":"684px");
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
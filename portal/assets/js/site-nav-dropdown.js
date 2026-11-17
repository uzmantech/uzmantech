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
 // Global UZMAN ASISTAN launcher: visible on every portal page.
 if(!document.getElementById("uzman-asistan-parent-mascot")){
  const mascot=document.createElement("button");
  mascot.type="button";
  mascot.id="uzman-asistan-parent-mascot";
  mascot.setAttribute("aria-label","UZMAN ASİSTAN sohbetini aç");
  mascot.title="UZMAN ASİSTAN";
  mascot.innerHTML='<svg viewBox="0 0 120 160" role="img" aria-label="UZMAN robot maskotu" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="uzRobotBody" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5fdff"/><stop offset=".5" stop-color="#9cc9dd"/><stop offset="1" stop-color="#36728f"/></linearGradient><linearGradient id="uzRobotFace" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#173b55"/><stop offset="1" stop-color="#061522"/></linearGradient></defs><ellipse cx="60" cy="148" rx="31" ry="5" fill="#00cfff" opacity=".28"/><g stroke="#235b78" stroke-width="10" stroke-linecap="round" fill="none"><path d="M42 82 27 99 19 111"/><path d="M49 111 42 132 39 140"/><path d="M71 111 78 132 81 140"/><path class="uz-robot-wave" d="M78 82 93 99 101 111"/></g><g fill="url(#uzRobotBody)" stroke="#6bb8d4" stroke-width="1.5"><circle cx="19" cy="113" r="7"/><path d="M41 77 Q60 69 79 77 L82 111 Q60 123 38 111Z"/><path d="M45 108 39 136 Q39 143 47 143 L54 141 59 116Z"/><path d="M75 108 81 136 Q81 143 73 143 L66 141 61 116Z"/><rect x="13" y="37" width="94" height="57" rx="22"/><rect x="7" y="51" width="12" height="28" rx="6"/><rect x="101" y="51" width="12" height="28" rx="6"/></g><rect x="17" y="42" width="86" height="49" rx="18" fill="url(#uzRobotFace)" stroke="#78c6df"/><path d="M36 65 Q43 56 50 65 M70 65 Q77 56 84 65" fill="none" stroke="#00dff5" stroke-width="4" stroke-linecap="round"/><path d="M51 75 Q60 80 69 75" fill="none" stroke="#39d9ee" stroke-width="2" stroke-linecap="round"/><path d="M60 12V5" stroke="#48eaff" stroke-width="2.5"/><circle cx="60" cy="5" r="4" fill="#7fffff"/></svg>';
  const style=document.createElement("style");
  style.textContent='#uzman-asistan-parent-mascot{position:fixed!important;right:8px!important;bottom:8px!important;width:126px!important;height:158px!important;padding:0!important;margin:0!important;border:0!important;background:transparent!important;display:grid!important;place-items:end center!important;cursor:pointer!important;touch-action:manipulation!important;-webkit-tap-highlight-color:transparent!important;z-index:2147483002!important;overflow:visible!important}#uzman-asistan-parent-mascot svg{display:block;width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 0 9px #00eaff70);transform-origin:50% 86%;animation:uzGlobalRobotFloat 1.9s ease-in-out infinite}#uzman-asistan-parent-mascot .uz-robot-wave{transform-box:view-box;transform-origin:65% 51%;animation:uzGlobalRobotWave .72s ease-in-out infinite alternate}@keyframes uzGlobalRobotFloat{0%,100%{transform:translateY(0) rotate(-4deg)}40%{transform:translateY(-12px) rotate(4deg)}68%{transform:translateY(1px) scale(1.03,.97)}}@keyframes uzGlobalRobotWave{from{transform:rotate(-16deg)}to{transform:rotate(28deg)}}@media(max-width:560px){#uzman-asistan-parent-mascot{width:104px!important;height:136px!important;right:3px!important;bottom:3px!important}}@media(prefers-reduced-motion:reduce){#uzman-asistan-parent-mascot svg,#uzman-asistan-parent-mascot .uz-robot-wave{animation:none!important}}';
  document.head.appendChild(style);
  document.body.appendChild(mascot);
  mascot.addEventListener("click",()=>{
   if(document.getElementById("uzman-chat-overlay"))return;
   const overlay=document.createElement("div");
   overlay.id="uzman-chat-overlay";
   overlay.innerHTML='<button type="button" class="uz-chat-backdrop" aria-label="Sohbeti kapat"></button><section class="uz-chat-frame-wrap" role="dialog" aria-label="UZMAN ASİSTAN sohbeti"><iframe title="UZMAN ASİSTAN" src="/uzman-asistan.html?widget=1&v=assistant-no-header-gap-20261117-3" allow="clipboard-read; clipboard-write"></iframe></section>';
   const css=document.createElement("style");
   css.textContent='#uzman-chat-overlay{position:fixed;inset:0;z-index:2147483001;margin:0;padding:0;pointer-events:none}#uzman-chat-overlay .uz-chat-backdrop{position:absolute;inset:0;width:100%;height:100%;border:0;background:rgba(3,12,24,.22);pointer-events:auto}#uzman-chat-overlay .uz-chat-frame-wrap{position:fixed;right:18px;bottom:18px;width:min(460px,calc(100vw - 24px));height:min(700px,calc(100dvh - 30px));max-height:none;margin:0;padding:0;border:1px solid #00cfe6;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 18px 65px #000b;pointer-events:auto}#uzman-chat-overlay iframe{position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:#fff}@media(max-width:560px){#uzman-chat-overlay .uz-chat-frame-wrap{right:12px;bottom:12px;width:calc(100vw - 24px);height:min(700px,calc(100dvh - 24px));border-radius:14px}}';
   overlay.appendChild(css);document.body.appendChild(overlay);mascot.style.visibility="hidden";
   const close=()=>{overlay.remove();mascot.style.visibility="";};
   overlay.querySelector(".uz-chat-backdrop").addEventListener("click",close);
   overlay.querySelector("iframe").addEventListener("load",e=>e.target.contentWindow.postMessage({type:"uzman-asistan-parent-open"},"*"));
   window.addEventListener("message",function onAssistantMessage(e){if(e.source===overlay.querySelector("iframe").contentWindow&&e.data?.type==="uzman-asistan-close"){close();window.removeEventListener("message",onAssistantMessage)}});
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
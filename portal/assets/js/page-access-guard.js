(()=>{"use strict";
const pagePath=(()=>{let p=location.pathname.toLowerCase();while(p.length>1&&p.endsWith("/"))p=p.slice(0,-1);return p.endsWith(".html")?p:(p+".html");})();
const protectedPaths=["/imei-araclari.html","/mediatek-temp-root.html","/cam-uyumluluk.html","/servis-takip.html"];
const paidPlans=new Set(["weekly","monthly","half_year","annual","365","full_365"]);
if(!protectedPaths.includes(pagePath))return;
const root=document.documentElement;
const style=document.createElement("style");
style.textContent=".uz-page-access-pending main{visibility:hidden!important}.uz-page-access-gate{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 50% 20%,#12345a,#06101d 65%);color:#edf6ff;font-family:inherit}.uz-page-access-card{width:min(480px,100%);padding:34px;border:1px solid #29496b;border-radius:20px;background:#0c1b2c;box-shadow:0 24px 80px #0008;text-align:center}.uz-page-access-card h1{margin:12px 0;font-size:25px}.uz-page-access-card p{color:#b9c9da;line-height:1.65}.uz-page-access-card a,.uz-page-access-card button{display:inline-flex;justify-content:center;align-items:center;margin:10px 5px 0;padding:12px 18px;border:0;border-radius:10px;background:#1685e8;color:white;text-decoration:none;font-weight:700;cursor:pointer}.uz-page-access-card a.secondary{background:#20364f}.uz-page-access-card .lock{font-size:38px}";
document.head.appendChild(style);
function gate(title,message,retry=false){
 root.classList.add("uz-page-access-pending");
 document.querySelector(".uz-page-access-gate")?.remove();
 const box=document.createElement("section");box.className="uz-page-access-gate";box.innerHTML='<div class="uz-page-access-card"><div class="lock">🔐</div><h1></h1><p></p><a href="/index.html?login=1">GİRİŞ YAP</a><a class="secondary" href="/paketler.html">PAKETLERİ GÖR</a>'+(retry?'<button type="button" id="uzAccessRetry">TEKRAR DENE</button>':"")+'</div>';
 box.querySelector("h1").textContent=title;box.querySelector("p").textContent=message;document.body.appendChild(box);
 if(retry)box.querySelector("#uzAccessRetry").addEventListener("click",check);
}
function load(src){return new Promise((resolve,reject)=>{const x=document.createElement("script");x.src=src;x.onload=resolve;x.onerror=()=>reject(new Error("Oturum bileşeni yüklenemedi."));document.head.appendChild(x);});}
function goPackages(){location.replace("/paketler.html?required=1");}
async function check(){
 const existing=document.querySelector(".uz-page-access-gate");if(existing)existing.remove();
 try{
  if(!window.UZMANTECH_CONFIG)await load("/assets/js/config.js");
  if(!window.UzmantechAPI)await load("/assets/js/api.js");
  let token="";try{token=localStorage.getItem("uzmantech_web_session")||sessionStorage.getItem("uzmantech_web_session")||"";}catch(_){}
  if(!token){if(pagePath==="/imei-araclari.html"||pagePath==="/mediatek-temp-root.html"){gate("Bu bölüm paket sahiplerine özeldir","Bu aracı kullanabilmek için hesabınıza giriş yapmalı ve aktif bir üyelik paketi satın almalısınız.");return;}goPackages();return;}
  const result=await window.UzmantechAPI.session();
  const user=result?.user;
  const entitled=!!user&&(user.role==="admin"||(user.status==="active"&&user.license_status==="active"&&!user.membership_expired&&paidPlans.has(String(user.license_plan||"").toLowerCase())));
  if(entitled){root.classList.remove("uz-page-access-pending");return;}
  if(pagePath==="/imei-araclari.html"||pagePath==="/mediatek-temp-root.html"){gate("Bu bölüm paket sahiplerine özeldir","Bu aracı kullanabilmek için aktif bir üyelik paketi satın almalısınız.");return;}
  goPackages();
 }catch(e){
  gate("Oturum doğrulanamadı",e.message||"Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.",true);
 }
}
check();
})();
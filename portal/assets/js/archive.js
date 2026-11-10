(()=>{const $=s=>document.querySelector(s);const toast=m=>{const el=$("#toast");if(!el)return;el.textContent=m;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)};function showLogin(){$("#modal").dataset.locked="false";$("#modalClose").hidden=false;$("#modalTitle").textContent="Üye girişi";$("#modalBody").innerHTML='<form id="loginForm"><label class="field"><span>Kullanıcı adı veya e-posta</span><input name="identifier" autocomplete="username" required></label><label class="field"><span>Şifre</span><input name="password" type="password" autocomplete="current-password" required></label><button class="button button-primary" type="submit" style="width:100%">Giriş Yap</button></form>';$("#modal").classList.add("open");$("#loginForm").addEventListener("submit",async e=>{e.preventDefault();const f=new FormData(e.currentTarget);try{const r=await UzmantechAPI.login({identifier:f.get("identifier"),password:f.get("password")});UzmantechAPI.setSession(r.session_token);location.reload();}catch(err){toast(err.message||"Giriş yapılamadı.");}})}document.addEventListener("click",e=>{const profile=e.target.closest("#profileBtn");if(profile){const menu=$("#profileDropdown");if(menu){menu.hidden=!menu.hidden;profile.setAttribute("aria-expanded",String(!menu.hidden));}return;}const profileAction=e.target.closest("[data-archive-profile-action]");if(profileAction){if(profileAction.dataset.archiveProfileAction==="logout"){UzmantechAPI.setSession("");location.reload();}else if(profileAction.dataset.archiveProfileAction==="account"){location.href="index.html?account=1";}else if(profileAction.dataset.archiveProfileAction==="management"){location.href="admin.html";}return;}const opened=$("#profileDropdown");if(opened&&!e.target.closest(".profile-menu-wrap")){opened.hidden=true;$("#profileBtn")?.setAttribute("aria-expanded","false");}if(e.target.closest('[data-open="login"]'))showLogin();if(e.target.id==="archivePackageContinue"){location.href="paketler.html";return;}if(e.target.id==="modalClose"||e.target.id==="modal"){if($("#modal").dataset.locked==="true")return;$("#modal").classList.remove("open");}if(e.target.id==="menuToggle")$(".archive-top-actions")?.classList.toggle("open")});document.addEventListener("keydown",e=>{if(e.key==="Escape"&&$("#modal").dataset.locked!=="true")$("#modal").classList.remove("open")});

document.querySelectorAll(".archive-brand-logo>img").forEach(img=>{img.addEventListener("error",()=>{img.dataset.failed="true";},{once:true});});
const brandSearchForm=$("#archiveBrandSearchForm"),brandSearchInput=$("#archiveBrandQuery");
function filterBrandCards(){
 const q=(brandSearchInput?.value||"").trim().toLocaleLowerCase("tr-TR");
 let visible=0;
 document.querySelectorAll(".archive-brand-card").forEach(card=>{
  const name=(card.dataset.brand||"").toLocaleLowerCase("tr-TR");
  const match=!q||name.includes(q);
  card.hidden=!match;
  if(match)visible++;
 });
 const count=document.querySelector(".archive-brand-catalog-head>strong");
 if(count)count.textContent=q?visible+" MARKA":"19 MARKA";
}
brandSearchForm?.addEventListener("submit",e=>{e.preventDefault();filterBrandCards();const first=[...document.querySelectorAll(".archive-brand-card")].find(card=>!card.hidden);if(first&&brandSearchInput.value.trim()&&first.dataset.brand.toLocaleLowerCase("tr-TR")===brandSearchInput.value.trim().toLocaleLowerCase("tr-TR"))first.click();});
brandSearchInput?.addEventListener("input",filterBrandCards);
$("#archiveBrandSearchClear")?.addEventListener("click",()=>{if(brandSearchInput)brandSearchInput.value="";filterBrandCards();brandSearchInput?.focus();});

const pageParams=new URLSearchParams(location.search);
let archiveItems=[],selectedDevice=pageParams.get("model")||null,selectedBrand=normBrand(pageParams.get("brand")||"")||null,selectedFolder=null,selectedFile=null,modelSearch=pageParams.get("q")||"";

const MODEL_CATALOG={
 "Xiaomi":"Mi 1|Mi 1S|Mi 2|Mi 2S|Mi 3|Mi 4|Mi 4i|Mi 4c|Mi 5|Mi 5s|Mi 5s Plus|Mi 5c|Mi 5X|Mi 6|Mi 6X|Mi 8|Mi 8 Lite|Mi 8 Pro|Mi 8 SE|Mi 9|Mi 9 SE|Mi 9T|Mi 9T Pro|Mi 10|Mi 10 Pro|Mi 10 Lite|Mi 10T|Mi 10T Pro|Mi 10T Lite|Mi 11|Mi 11 Lite|Mi 11 Lite 5G NE|Mi 11 Pro|Mi 11 Ultra|Xiaomi 11T|Xiaomi 11T Pro|Xiaomi 12|Xiaomi 12 Pro|Xiaomi 12X|Xiaomi 12 Lite|Xiaomi 12T|Xiaomi 12T Pro|Xiaomi 13|Xiaomi 13 Pro|Xiaomi 13 Ultra|Xiaomi 13 Lite|Xiaomi 13T|Xiaomi 13T Pro|Xiaomi 14|Xiaomi 14 Pro|Xiaomi 14 Ultra|Xiaomi 14T|Xiaomi 14T Pro|Xiaomi 15|Xiaomi 15 Pro|Xiaomi 15 Ultra|Xiaomi 15T|Xiaomi 15T Pro|Xiaomi 17|Xiaomi 17 Pro|Xiaomi 17 Pro Max|Redmi 1|Redmi 2|Redmi 3|Redmi 4|Redmi 5|Redmi 6|Redmi 7|Redmi 8|Redmi 9|Redmi 10|Redmi 12|Redmi 13|Redmi 14C|Redmi 15|Redmi 15C|Redmi Note 3|Redmi Note 4|Redmi Note 5|Redmi Note 6 Pro|Redmi Note 7|Redmi Note 8|Redmi Note 8 Pro|Redmi Note 9|Redmi Note 9S|Redmi Note 9 Pro|Redmi Note 10|Redmi Note 10 Pro|Redmi Note 11|Redmi Note 11 Pro|Redmi Note 12|Redmi Note 12 Pro|Redmi Note 13|Redmi Note 13 Pro|Redmi Note 13 Pro+|Redmi Note 14|Redmi Note 14 Pro|Redmi Note 14 Pro+|Redmi Note 15|Redmi Note 15 Pro|Redmi Note 15 Pro+|POCO F1|POCO F2 Pro|POCO F3|POCO F4|POCO F5|POCO F5 Pro|POCO F6|POCO F6 Pro|POCO F7|POCO X3|POCO X3 Pro|POCO X4 Pro|POCO X5|POCO X5 Pro|POCO X6|POCO X6 Pro|POCO X7|POCO X7 Pro|POCO M3|POCO M4 Pro|POCO M5|POCO M6|POCO C3|POCO C55|POCO C65|POCO C75",
 "Samsung":"Galaxy S6|Galaxy S7|Galaxy S8|Galaxy S9|Galaxy S10|Galaxy S10+|Galaxy S10e|Galaxy S20|Galaxy S20+|Galaxy S20 Ultra|Galaxy S20 FE|Galaxy S21|Galaxy S21+|Galaxy S21 Ultra|Galaxy S21 FE|Galaxy S22|Galaxy S22+|Galaxy S22 Ultra|Galaxy S23|Galaxy S23+|Galaxy S23 Ultra|Galaxy S23 FE|Galaxy S24|Galaxy S24+|Galaxy S24 Ultra|Galaxy S24 FE|Galaxy S25|Galaxy S25+|Galaxy S25 Ultra|Galaxy S25 Edge|Galaxy S26|Galaxy S26+|Galaxy S26 Ultra|Galaxy Note 8|Galaxy Note 9|Galaxy Note 10|Galaxy Note 10+|Galaxy Note 20|Galaxy Note 20 Ultra|Galaxy Z Fold2|Galaxy Z Fold3|Galaxy Z Fold4|Galaxy Z Fold5|Galaxy Z Fold6|Galaxy Z Fold7|Galaxy Z Flip|Galaxy Z Flip3|Galaxy Z Flip4|Galaxy Z Flip5|Galaxy Z Flip6|Galaxy Z Flip7|Galaxy A10|Galaxy A12|Galaxy A13|Galaxy A14|Galaxy A15|Galaxy A16|Galaxy A20|Galaxy A21s|Galaxy A22|Galaxy A23|Galaxy A24|Galaxy A25|Galaxy A30|Galaxy A31|Galaxy A32|Galaxy A33|Galaxy A34|Galaxy A35|Galaxy A36|Galaxy A50|Galaxy A51|Galaxy A52|Galaxy A52s|Galaxy A53|Galaxy A54|Galaxy A55|Galaxy A56|Galaxy A70|Galaxy A71|Galaxy A72|Galaxy A73|Galaxy A80|Galaxy A90|Galaxy M12|Galaxy M13|Galaxy M14|Galaxy M15|Galaxy M20|Galaxy M21|Galaxy M23|Galaxy M30|Galaxy M31|Galaxy M32|Galaxy M33|Galaxy M34|Galaxy M35|Galaxy M51|Galaxy M52|Galaxy M53|Galaxy M54|Galaxy M55|Galaxy F12|Galaxy F13|Galaxy F14|Galaxy F15|Galaxy F23|Galaxy F34|Galaxy F54|SM-S936U|SM-S731U|SM-S938U|SM-A065F|SM-M066B|SM-X356B|SM-F766U|SM-F966U|SM-A176B|SM-S918B|SM-S9010|SM-S901U|SM-S901B|SM-F936B|SM-G9980|SM-G998U|SM-G998B|SM-G996B|SM-F776B|SM-F776W|SM-F7760|SM-F776N|SM-F776U|SM-S928B|SM-A546E|SM-S911B|SM-X710",
 "Huawei":"P8|P9|P10|P20|P20 Pro|P30|P30 Pro|P40|P40 Pro|P40 Pro+|P50|P50 Pro|P60|P60 Pro|Pura 70|Pura 70 Pro|Pura 70 Ultra|Pura 80|Pura 80 Pro|Pura 80 Ultra|Mate 8|Mate 9|Mate 10|Mate 10 Pro|Mate 20|Mate 20 Pro|Mate 30|Mate 30 Pro|Mate 40|Mate 40 Pro|Mate 50|Mate 50 Pro|Mate 60|Mate 60 Pro|Mate 70|Mate 70 Pro|Nova 3|Nova 5T|Nova 7|Nova 8|Nova 9|Nova 10|Nova 11|Nova 12|Nova 13|Nova 14|Y5|Y6|Y7|Y9|Y9 Prime",
 "Oppo":"Find X|Find X2|Find X2 Pro|Find X3 Pro|Find X5|Find X5 Pro|Find X6 Pro|Find X7 Ultra|Find X8|Find X8 Pro|Find X9|Find X9 Pro|Reno|Reno 2|Reno 3|Reno 4|Reno 5|Reno 6|Reno 7|Reno 8|Reno 9|Reno 10|Reno 11|Reno 12|Reno 13|Reno 14|Reno 15|Reno 15 Pro|A3|A5|A9|A15|A16|A17|A18|A31|A38|A52|A53|A54|A55|A57|A58|A72|A74|A76|A77|A78|A79|A P|K3|K5|K9|F9|F11|F15|F17|F19|F21 Pro|F23|F25 Pro",
 "Vivo":"X50|X60|X60 Pro|X70|X70 Pro|X80|X80 Pro|X90|X90 Pro|X100|X100 Pro|X100 Ultra|X200|X200 Pro|X200 Ultra|X300|V15|V17|V19|V20|V21|V23|V25|V27|V29|V30|V40|V50|V60|Y11|Y12|Y15|Y17|Y20|Y21|Y22|Y27|Y28|Y treinta|Y35|Y36|Y50|Y51|Y53|Y55|Y serisi|T1|T2|T3|T4|iQOO 3|iQOO 7|iQOO 9|iQOO 11|iQOO 12|iQOO 13|iQOO Neo 7|iQOO Neo 9|X500 E PD2620F|V80 PD2620F|Y32 5G PD2617F|S2 PD2575F|V80 Lite 5G PD2575F|T5 Pro 5G PD2512F|X500 Pro PD2608F|X500 Pro Max PD2602F|X500 5G PD2609F|Y300 GT PD2452|Y300c PD2435|Y300 PD2435|V25 5G PD2558F|Y300 Pro Plus PD2456|X200 Ultra PD2454|V60 Lite 5G PD2512F|V70 Lite 5G PD2512F|Y500 PD2506|Y31e 5G PD2511F|Y31s 5G PD2511F|Y29t 5G PD2443F|Y19s GT 5G PD2443F|Y19S PD2420F|Y19s Pro PD2420F|Y05e PD2577F|S30 PD2464|V30 Lite 5G PD2341F|Y400 PD2470F|Y500 Pro PD2516|V60e 5G PD2504F|S30 Pro Mini PD2465|V50 Lite 5G PD2447F|V40 SE PD2358F|V30 Lite PD2358F|Y200 PD2358F|X300 Pro PD2502|X300 PD2502|X300 FE PD2527F|X300 Ultra PD2547F|T5 PD2533F|V3 PD1524F|V7 PD1718F|V9|V71 PD1731F|Y71 PD1731F|V70 Elite PD2528F|V40 PD2421F|V27 PD2269F|T2 Pro PD2285CF|V29 PD2283EF|Y19S 5G PD2420F|V1 PD1730C|T1 44W PD2201F|Y51 2021 PD2050F|V25 5G PD2215BF|X Fold 5 5G PD2436F|X Note PD2170|X Fold PD2178|X Fold 3 5G PD2363F|X Fold 3 PD2303|X Fold 3 Pro PD2337F|X5 Max V PD1408V|X5 Max S PD1424L",
 "Realme":"Realme 1|Realme 2|Realme 3|Realme 5|Realme 6|Realme 7|Realme 8|Realme 9|Realme 10|Realme 11|Realme 12|Realme 13|Realme 14|Realme 15|Realme C11|Realme C15|Realme C21|Realme C25|Realme C30|Realme C31|Realme C33|Realme C35|Realme C51|Realme C53|Realme C55|Realme C61|Realme C63|Realme C65|Realme C67|Realme C75|Realme C85|Realme Narzo 10|Realme Narzo 20|Realme Narzo 30|Realme Narzo 50|Realme Narzo 60|Realme Narzo 70|Realme Narzo 80|Realme GT|Realme GT 2|Realme GT 2 Pro|Realme GT 3|Realme GT 5|Realme GT 6|Realme GT 7|Realme X|Realme X2|Realme X3|Realme X7",
 "OnePlus":"OnePlus One|OnePlus 2|OnePlus 3|OnePlus 3T|OnePlus 5|OnePlus 5T|OnePlus 6|OnePlus 6T|OnePlus 7|OnePlus 7 Pro|OnePlus 7T|OnePlus 7T Pro|OnePlus 8|OnePlus 8 Pro|OnePlus 8T|OnePlus 9|OnePlus 9 Pro|OnePlus 9R|OnePlus 9RT|OnePlus 10 Pro|OnePlus 10T|OnePlus 10R|OnePlus 11|OnePlus 11R|OnePlus 12|OnePlus 12R|OnePlus 13|OnePlus 13R|OnePlus 15|OnePlus Nord|Nord 2|Nord 2T|Nord 3|Nord 4|Nord 5|Nord CE|Nord CE 2|Nord CE 3|Nord CE 4|Nord CE 5|Nord N10|Nord N20|Nord N30",
 "Honor":"Honor 6|Honor 7|Honor 8|Honor 9|Honor 10|Honor 20|Honor 30|Honor 50|Honor 60|Honor 70|Honor 80|Honor 90|Honor 100|Honor 200|Honor 300|Honor 400|Honor 500|Honor Magic|Magic 2|Magic 3|Magic 4|Magic 5|Magic 6|Magic 7|Magic 8|Magic V|Magic V2|Magic V3|Magic V5|Honor X5|Honor X6|Honor X7|Honor X8|Honor X9|Honor X10|Honor X20|Honor X30|Honor X40|Honor X50|Honor X60|Honor X70|Honor Play|Honor View 20",
 "Tecno":"Camon 11|Camon 12|Camon 15|Camon 16|Camon 17|Camon 18|Camon 19|Camon 20|Camon 20 Pro|Camon 30|Camon 30 Pro|Camon 40|Camon 40 Pro|Camon 50|Spark 4|Spark 5|Spark 6|Spark 7|Spark 8|Spark 9|Spark 10|Spark 20|Spark 20 Pro|Spark 30|Spark 40|Pova|Pova 2|Pova 3|Pova 4|Pova 5|Pova 6|Pova 7|Phantom X|Phantom X2|Phantom V Fold|Phantom V Flip|Pop 5|Pop 6|Pop 7|Pop 8|Pop 9",
 "Infinix":"Hot 8|Hot 9|Hot 10|Hot 11|Hot 12|Hot 20|Hot 30|Hot 40|Hot 50|Hot 60|Note 7|Note 8|Note 10|Note 11|Note 12|Note 30|Note 40|Note 50|Note 60|Zero 8|Zero 20|Zero 30|Zero 40|Zero Flip|GT 10 Pro|GT 20 Pro|Smart 5|Smart 6|Smart 7|Smart 8|Smart 9|Smart 10",
 "Google":"Pixel|Pixel XL|Pixel 2|Pixel 2 XL|Pixel 3|Pixel 3 XL|Pixel 3a|Pixel 3a XL|Pixel 4|Pixel 4 XL|Pixel 4a|Pixel 4a 5G|Pixel 5|Pixel 5a|Pixel 6|Pixel 6 Pro|Pixel 6a|Pixel 7|Pixel 7 Pro|Pixel 7a|Pixel 8|Pixel 8 Pro|Pixel 8a|Pixel 9|Pixel 9 Pro|Pixel 9 Pro XL|Pixel 9 Pro Fold|Pixel 9a|Pixel 10|Pixel 10 Pro|Pixel 10 Pro XL|Pixel 10 Pro Fold",
 "Motorola":"Moto G|Moto G2|Moto G3|Moto G4|Moto G5|Moto G5 Plus|Moto G6|Moto G7|Moto G8|Moto G9|Moto G10|Moto G20|Moto G30|Moto G31|Moto G32|Moto G40 Fusion|Moto G50|Moto G52|Moto G53|Moto G54|Moto G60|Moto G62|Moto G72|Moto G73|Moto G84|Moto G85|Moto G86|Moto E4|Moto E5|Moto E6|Moto E7|Moto E13|Moto E20|Moto E22|Moto E32|Moto E40|Moto Edge|Edge 20|Edge 20 Pro|Edge 30|Edge 30 Pro|Edge 30 Fusion|Edge 40|Edge 40 Neo|Edge 50|Edge 50 Pro|Edge 50 Ultra|Edge 60|Edge 60 Pro|Razr 2019|Razr 5G|Razr 40|Razr 40 Ultra|Razr 50|Razr 50 Ultra|Razr 60|Razr 60 Ultra",
 "Nokia":"Nokia 1|Nokia 1.3|Nokia 1.4|Nokia 2|Nokia 2.1|Nokia 2.2|Nokia 2.3|Nokia 2.4|Nokia 3|Nokia 3.1|Nokia 3.2|Nokia 3.4|Nokia 4.2|Nokia 5|Nokia 5.1|Nokia 5.3|Nokia 5.4|Nokia 6|Nokia 6.1|Nokia 6.2|Nokia 7|Nokia 7 Plus|Nokia 7.1|Nokia 7.2|Nokia 8|Nokia 8 Sirocco|Nokia 8.1|Nokia 8.3|Nokia 9 PureView|Nokia C1|Nokia C2|Nokia C3|Nokia C10|Nokia C20|Nokia C21|Nokia C22|Nokia C32|Nokia G10|Nokia G11|Nokia G20|Nokia G21|Nokia G22|Nokia G42|Nokia G50|Nokia G60|Nokia X10|Nokia X20|Nokia X30|Nokia XR20|Nokia XR21",
 "Sony":"Xperia 1|Xperia 1 II|Xperia 1 III|Xperia 1 IV|Xperia 1 V|Xperia 1 VI|Xperia 1 VII|Xperia 5|Xperia 5 II|Xperia 5 III|Xperia 5 IV|Xperia 5 V|Xperia 10|Xperia 10 II|Xperia 10 III|Xperia 10 IV|Xperia 10 V|Xperia 10 VI|Xperia X|Xperia X Compact|Xperia X Performance|Xperia XZ|Xperia XZ1|Xperia XZ2|Xperia XZ3|Xperia XA|Xperia XA1|Xperia XA2|Xperia L1|Xperia L2|Xperia L3|Xperia Ace|Xperia Ace II|Xperia Ace III|Xperia PRO|Xperia PRO-I",
 "ASUS":"Zenfone 2|Zenfone 3|Zenfone 4|Zenfone 5|Zenfone 5Z|Zenfone 6|Zenfone 7|Zenfone 7 Pro|Zenfone 8|Zenfone 8 Flip|Zenfone 9|Zenfone 10|Zenfone 11 Ultra|Zenfone 12 Ultra|ROG Phone|ROG Phone II|ROG Phone 3|ROG Phone 5|ROG Phone 5s|ROG Phone 6|ROG Phone 6D|ROG Phone 7|ROG Phone 8|ROG Phone 8 Pro|ROG Phone 9|ROG Phone 9 Pro",
 "Nothing":"Nothing Phone (1)|Nothing Phone (2)|Nothing Phone (2a)|Nothing Phone (2a) Plus|Nothing Phone (3)|Nothing Phone (3a)|Nothing Phone (3a) Pro|CMF Phone 1|CMF Phone 2 Pro",
 "ZTE":"Axon 7|Axon 9 Pro|Axon 10 Pro|Axon 11|Axon 20|Axon 30|Axon 40 Ultra|Axon 50 Ultra|Axon 60 Ultra|Axon 70 Ultra|Blade A3|Blade A5|Blade A7|Blade A31|Blade A51|Blade A71|Blade V8|Blade V9|Blade V10|Blade V20|Blade V30|Blade V40|Blade V50|Blade V60|Nubia Z17|Nubia Z18|Nubia Z20|Nubia Z30 Pro|Nubia Z40 Pro|Nubia Z50|Nubia Z60 Ultra|RedMagic 5G|RedMagic 6|RedMagic 7|RedMagic 8 Pro|RedMagic 9 Pro|RedMagic 10 Pro|RedMagic 11 Pro",
 "Black Shark":"Black Shark|Black Shark 2|Black Shark 2 Pro|Black Shark 3|Black Shark 3 Pro|Black Shark 4|Black Shark 4 Pro|Black Shark 5|Black Shark 5 Pro",
 "Apple":"iPhone 5|iPhone 5c|iPhone 5s|iPhone 6|iPhone 6 Plus|iPhone 6s|iPhone 6s Plus|iPhone SE (1st gen)|iPhone 7|iPhone 7 Plus|iPhone 8|iPhone 8 Plus|iPhone X|iPhone XR|iPhone XS|iPhone XS Max|iPhone 11|iPhone 11 Pro|iPhone 11 Pro Max|iPhone SE (2nd gen)|iPhone 12 mini|iPhone 12|iPhone 12 Pro|iPhone 12 Pro Max|iPhone 13 mini|iPhone 13|iPhone 13 Pro|iPhone 13 Pro Max|iPhone SE (3rd gen)|iPhone 14|iPhone 14 Plus|iPhone 14 Pro|iPhone 14 Pro Max|iPhone 15|iPhone 15 Plus|iPhone 15 Pro|iPhone 15 Pro Max|iPhone 16|iPhone 16 Plus|iPhone 16 Pro|iPhone 16 Pro Max|iPhone 16e|iPhone 17|iPhone 17 Pro|iPhone 17 Pro Max|iPhone Air"
};
const archiveEsc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const archiveCategory={firmware:"Firmware",eng:"ENG",imei:"IMEI",test_point:"Test Point",resistor:"Direnç",usb:"USB Sürücüleri",other:"Diğer"};
async function fetchSamFwCatalog(model,csc="TUR"){
 const normalized=String(model||"").trim().toUpperCase(),region=String(csc||"TUR").trim().toUpperCase();
 if(!/^SM-[A-Z0-9]+$/.test(normalized)){throw new Error("Samsung model kodunu SM-S928B biçiminde girin.");}
 if(!/^[A-Z0-9]{3}$/.test(region)){throw new Error("CSC kodu 3 karakter olmalıdır. Örnek: TUR, XSG, INS.");}
 const cfg=window.UZMANTECH_CONFIG||{};
 if(!cfg.apiBaseUrl||!cfg.publishableKey)throw new Error("Arşiv API yapılandırması bulunamadı.");
 const headers={apikey:cfg.publishableKey,Authorization:"Bearer "+cfg.publishableKey};
 const url=cfg.apiBaseUrl+"/portal-api/samfw-firmware?q="+encodeURIComponent(normalized)+"&csc="+encodeURIComponent(region);
 const response=await fetch(url,{headers,signal:AbortSignal.timeout(20000)});
 const catalog=await response.json().catch(()=>({}));
 if(!response.ok||!catalog.success)throw new Error(catalog.message||"SamFW firmware listesi alınamadı.");
 const firmwareItems=(Array.isArray(catalog.items)?catalog.items:[]).filter(x=>x&&x.version&&x.csc).map(x=>({
  id:"samfw:"+x.model+":"+x.csc+":"+x.version+":"+x.buildDate,
  brand:"Samsung",model:normalized,category:"firmware",
  title:"SamFW Firmware • "+x.csc+" • "+x.version,
  original_filename:x.version,
  description:"CSC: "+x.csc+" | Bit/SW Rev: "+(x.bit||"-")+" | Güvenlik yaması: "+(x.patch||"-")+" | "+(x.os||"Android sürümü belirtilmemiş")+" | Build: "+(x.buildDate||"-"),
  created_at:null,
  source_url:/^https:\/\/(www\.)?samfw\.com\//i.test(x.sourceUrl||"")?x.sourceUrl:"https://samfw.com/firmware/"+normalized+"/"+region,
  is_samfw:true
 }));
 if(!firmwareItems.length)throw new Error("Bu model ve CSC kodu için SamFW firmware kaydı bulunamadı.");
 archiveItems=[...archiveItems.filter(x=>!String(x.id||"").startsWith("samfw:")),...firmwareItems];
 selectedDevice=normalized;selectedFolder="firmware";selectedFile=null;renderLiveArchive();
 return firmwareItems.length;
}

function normBrand(v){const x=String(v||"").toLocaleLowerCase("tr-TR");if(x==="redmi"||x==="poco"||x==="xiaomi")return "Xiaomi";if(x==="samsung")return "Samsung";if(x==="oppo")return "Oppo";if(x==="vivo")return "Vivo";if(x==="realme")return "Realme";if(x==="huawei")return "Huawei";if(x==="honor")return "Honor";if(x==="oneplus")return "OnePlus";if(x==="tecno")return "Tecno";if(x==="infinix")return "Infinix";if(x==="google")return "Google";if(x==="apple")return "Apple";if(x==="motorola")return "Motorola";if(x==="nokia"||x==="hmd")return "Nokia";if(x==="sony")return "Sony";if(x==="asus")return "ASUS";if(x==="nothing")return "Nothing";if(x==="zte"||x==="nubia")return "ZTE";if(x==="black shark"||x==="blackshark")return "Black Shark";return v;}
function getModels(brand){
 const base=(MODEL_CATALOG[brand]||"").split("|").filter(Boolean);
 if(brand==="Samsung"&&/^SM-[A-Z0-9]+$/i.test(modelSearch))base.push(modelSearch.toUpperCase());
 const uploaded=archiveItems.filter(f=>normBrand(f.brand)===brand).map(f=>f.model).filter(Boolean);
 return [...new Set([...base,...uploaded])].sort((a,b)=>a.localeCompare(b,"tr",{numeric:true,sensitivity:"base"}));
}
function renderBrandArchiveCounts(){
 const cards=document.querySelectorAll(".archive-brand-card[data-brand]");
 cards.forEach(card=>{
  const brand=normBrand(card.dataset.brand||"");
  const items=archiveItems.filter(file=>normBrand(file.brand)===brand);
  const models=new Set(items.map(file=>String(file.model||"").trim()).filter(Boolean));
  let counts=card.querySelector(".archive-brand-counts");
  if(!counts){counts=document.createElement("span");counts.className="archive-brand-counts";card.appendChild(counts);}
  counts.textContent=models.size.toLocaleString("tr-TR")+" model · "+items.length.toLocaleString("tr-TR")+" yazılım";
  counts.setAttribute("aria-label",models.size+" model, "+items.length+" yazılım kaydı");
 });
}
function renderRecentSoftware(){
 const track=$("#archiveRecentTrack"),count=$("#archiveRecentCount");if(!track||!count)return;
 const sorted=[...archiveItems].filter(f=>f&&f.is_active!==false).sort((a,b)=>{const dateDiff=new Date(b.created_at||0)-new Date(a.created_at||0);return dateDiff||String(b.id||"").localeCompare(String(a.id||""));});
 // Aynı toplu aktarım saatinde tek markanın tüm alanı kaplamasını önle: önce her markanın en yeni kayıtlarını göster.
 const recent=[],seenBrands=new Set();
 for(const file of sorted){const brand=normBrand(file.brand||"");if(brand&&!seenBrands.has(brand)){recent.push(file);seenBrands.add(brand);}}
 for(const file of sorted){if(recent.length>=12)break;if(!recent.some(x=>String(x.id)===String(file.id)))recent.push(file);}
 count.textContent=recent.length+" DOSYA";
 const cards=recent.map(f=>'<a class="archive-recent-folder" href="models.html?brand='+encodeURIComponent(normBrand(f.brand)||"")+'&model='+encodeURIComponent(f.model||"")+'"><span class="archive-recent-folder-icon">📁</span><span class="archive-recent-folder-info"><strong>'+archiveEsc(f.title||f.original_filename||"Teknik dosya")+'</strong><small>'+archiveEsc((f.brand||"")+" "+(f.model||""))+'</small></span><em>'+archiveEsc(archiveCategory[f.category]||f.category||"Diğer")+'</em></a>').join("");
 track.innerHTML=recent.length?cards+cards:'<p class="archive-live-empty">Henüz arşive dosya eklenmemiş.</p>';
 track.classList.toggle("is-static",recent.length<4);
}
function renderLiveArchive(){
 const grid=$("#archiveLiveGrid"),count=$("#archiveFileCount"),head=$(".archive-live-head");
 if(!grid||!count||!head)return;
 const brand=selectedBrand;
 if(!brand){
  head.querySelector("h2").textContent="Cihaz markaları";
  head.querySelector("p").textContent="Başlamak için üst menüden bir marka seçin.";
  count.textContent=Object.keys(MODEL_CATALOG).length+" MARKA";
  grid.innerHTML='<p class="archive-live-empty">Bir marka seçerek cihaz modellerini görüntüleyin.</p>';
  return;
 }
 if(selectedDevice){
  const deviceItems=archiveItems.filter(f=>normBrand(f.brand)===brand&&f.model&&(f.model===selectedDevice||selectedDevice.endsWith(" "+f.model)||f.model.endsWith(" "+selectedDevice)));
  if(selectedFile){
   const file=deviceItems.find(f=>f.id===selectedFile);
   if(!file){selectedFile=null;renderLiveArchive();return;}
   count.textContent="DOSYA DETAYI";
   head.querySelector("h2").textContent=file.title||file.original_filename||"Yazılım dosyası";
   head.querySelector("p").textContent=brand+" • "+selectedDevice+" • "+(archiveCategory[file.category]||file.category||"Diğer");
   grid.innerHTML='<button type="button" class="archive-back-devices" id="archiveBackFile">← Dosya klasörüne dön</button><article class="archive-file-detail"><div class="archive-file-detail-icon">📁</div><span class="archive-file-detail-category">'+archiveEsc(archiveCategory[file.category]||file.category||"Diğer")+'</span><h3>'+archiveEsc(file.title||file.original_filename||"Yazılım dosyası")+'</h3><p>'+archiveEsc(file.description||"Bu dosya için açıklama eklenmemiş.")+'</p><div class="archive-file-detail-meta"><span>Marka: <b>'+archiveEsc(brand)+'</b></span><span>Model: <b>'+archiveEsc(selectedDevice)+'</b></span><span>Dosya: <b>'+archiveEsc(file.original_filename||"Teknik dosya")+'</b></span><span>Eklenme: <b>'+archiveEsc(file.created_at?new Date(file.created_at).toLocaleDateString("tr-TR"):"-")+'</b></span></div>'+((file.is_engineer_rom||file.is_samfw)?'<a class="archive-live-download" href="'+archiveEsc(file.source_url)+'" target="_blank" rel="noopener noreferrer">KAYNAK İNDİRME SAYFASINI AÇ</a>':file.external_url&&/^https:\/\/(www\.)?firmwarefile\.com\//i.test(file.external_url)?'<a class="archive-live-download" href="'+archiveEsc(file.external_url)+'" target="_blank" rel="noopener noreferrer">FIRMWAREFILE FREE LİNKİNİ AÇ</a>':'<button type="button" class="archive-live-download" data-archive-download="'+archiveEsc(file.id)+'">İNDİRMEYİ BAŞLAT</button>')+'</article>';
   return;
  }
  if(selectedFolder){
   const folderItems=deviceItems.filter(f=>(f.category||"other")===selectedFolder);
   count.textContent=folderItems.length+" DOSYA";
   head.querySelector("h2").textContent=selectedFolder==="other"?"Diğer dosyalar":(archiveCategory[selectedFolder]||selectedFolder);
   head.querySelector("p").textContent=selectedDevice+" • "+brand+" yazılımları";
   grid.innerHTML='<button type="button" class="archive-back-devices" id="archiveBackFolder">← Klasörlere dön</button>'+folderItems.map(f=>'<button type="button" class="archive-folder-card archive-file-folder-card" data-archive-file="'+archiveEsc(f.id)+'"><span class="archive-folder-icon" aria-hidden="true">📁</span><strong>'+archiveEsc(f.title||f.original_filename||"Yazılım dosyası")+'</strong><small>'+archiveEsc(f.original_filename||"Dosya")+'</small></button>').join("")||'<p class="archive-live-empty">Bu klasörde henüz dosya bulunmuyor.</p>';
   return;
  }
  const folders=[...new Set(deviceItems.map(f=>f.category||"other"))].sort((x,y)=>(archiveCategory[x]||x).localeCompare(archiveCategory[y]||y,"tr"));
  count.textContent=folders.length+" KLASÖR";
  head.querySelector("h2").textContent=selectedDevice;
  head.querySelector("p").textContent=brand+" cihazının yazılım klasörleri";
  grid.innerHTML='<button type="button" class="archive-back-devices" id="archiveBackDevices">← '+archiveEsc(brand)+' modellerine dön</button>'+(folders.length?folders.map(cat=>'<button type="button" class="archive-folder-card" data-archive-folder="'+archiveEsc(cat)+'"><span class="archive-folder-icon" aria-hidden="true">📁</span><strong>'+archiveEsc(archiveCategory[cat]||cat)+'</strong><small>'+deviceItems.filter(f=>(f.category||"other")===cat).length+' dosya</small></button>').join(""):'<p class="archive-live-empty">Bu modele ait yazılım henüz yüklenmemiştir.</p>');
  return;
 }
 head.querySelector("h2").textContent=brand+" cihaz modelleri";
 head.querySelector("p").textContent="Modeli arayın veya listeden seçin.";
 const models=getModels(brand).filter(m=>m.toLocaleLowerCase("tr-TR").includes(modelSearch.toLocaleLowerCase("tr-TR")));
 count.textContent=models.length+" MODEL";
 grid.innerHTML='<div class="archive-model-search-wrap"><input id="archiveModelSearch" type="search" value="'+archiveEsc(modelSearch)+'" placeholder="'+archiveEsc(brand)+' model adı ara..." aria-label="Model ara"></div>'+models.map(model=>'<button type="button" class="archive-device-card" data-device-model="'+archiveEsc(model)+'"><span class="archive-device-icon" aria-hidden="true">▦</span><strong>'+archiveEsc(model)+'</strong><small>'+archiveEsc(brand)+'</small><em>'+archiveItems.filter(f=>normBrand(f.brand)===brand&&f.model===model).length+' dosya</em></button>').join("")||'<p class="archive-live-empty">Bu arama için model bulunamadı.</p>';
}
async function loadLiveArchive(){try{const result=await UzmantechAPI.archiveFiles();archiveItems=result.files||[];const cfg=window.UZMANTECH_CONFIG||{};const headers={apikey:cfg.publishableKey,Authorization:"Bearer "+cfg.publishableKey};try{const response=await fetch(cfg.apiBaseUrl+"/portal-api/engineer-roms",{headers});if(!response.ok)throw new Error("Engineer ROM kataloğu alınamadı");const catalog=await response.json();if(catalog.success&&Array.isArray(catalog.items)){const engineerItems=catalog.items.filter(x=>x&&x.model&&x.codename&&/^https:\/\/(www\.)?xiaomitools\.com\//i.test(x.sourceUrl||"")).map(x=>({id:"engineer-rom:"+x.codename,brand:"Xiaomi",model:x.model,category:"eng",title:"Engineer ROM • "+x.model,original_filename:x.codename+" • Engineer ROM",description:"Engineer ROM indirme sayfası XiaomiTools üzerinden açılır. Günlük kullanım için uygun değildir.",created_at:catalog.updated_at||null,source_url:x.sourceUrl,is_engineer_rom:true}));archiveItems=[...archiveItems.filter(x=>!String(x.id||"").startsWith("engineer-rom:")),...engineerItems];}}catch(catalogError){console.warn("Engineer ROM kataloğu yüklenemedi:",catalogError);}if(normBrand(selectedBrand)==="Samsung"&&selectedDevice&&/^SM-[A-Z0-9]+$/i.test(selectedDevice)){try{await fetchSamFwCatalog(selectedDevice,"TUR");}catch(samError){console.warn("SamFW firmware kataloğu yüklenemedi:",samError);}}renderBrandArchiveCounts();renderRecentSoftware();renderLiveArchive();}catch(err){archiveItems=[];renderBrandArchiveCounts();renderRecentSoftware();renderLiveArchive();console.error(err);}}

$("#archiveSearchForm")?.addEventListener("submit",e=>{e.preventDefault();const q=($("#archiveQuery")?.value||"").trim().toLocaleLowerCase("tr-TR");const found=Object.keys(MODEL_CATALOG).find(b=>b.toLocaleLowerCase("tr-TR").includes(q));if(found){location.href="models.html?brand="+encodeURIComponent(found);return;}const match=Object.keys(MODEL_CATALOG).find(b=>getModels(b).some(m=>m.toLocaleLowerCase("tr-TR").includes(q)));if(match){location.href="models.html?brand="+encodeURIComponent(match)+"&q="+encodeURIComponent(q);return;}toast("Marka veya model bulunamadı.");});
$("#archiveQuery")?.addEventListener("input",()=>{if(!$("#archiveQuery").value.trim()){selectedBrand=null;selectedDevice=null;selectedFolder=null;modelSearch="";renderLiveArchive();}});
document.addEventListener("click",e=>{const btn=e.target.closest("[data-brand]");if(!btn)return;const label=normBrand(btn.dataset.brand||"");if(MODEL_CATALOG[label])location.href="models.html?brand="+encodeURIComponent(label);});
document.addEventListener("input",e=>{if(e.target.id==="archiveModelSearch"){modelSearch=e.target.value;const pos=e.target.selectionStart;renderLiveArchive();const next=$("#archiveModelSearch");next?.focus();next?.setSelectionRange(pos,pos);}});
document.addEventListener("click",async e=>{
 const device=e.target.closest("[data-device-model]");
 if(device){selectedDevice=device.dataset.deviceModel;selectedFolder=null;selectedFile=null;if(normBrand(selectedBrand)==="Samsung"&&/^SM-[A-Z0-9]+$/i.test(selectedDevice)){try{await fetchSamFwCatalog(selectedDevice,"TUR");}catch(err){toast(err.message||"SamFW listesi yüklenemedi.");}}renderLiveArchive();return;}
 const folder=e.target.closest("[data-archive-folder]");if(folder){selectedFolder=folder.dataset.archiveFolder;renderLiveArchive();return;}
 if(e.target.id==="archiveBackFolder"){selectedFolder=null;selectedFile=null;renderLiveArchive();return;}
 const fileCard=e.target.closest("[data-archive-file]");if(fileCard){selectedFile=fileCard.dataset.archiveFile;renderLiveArchive();return;}
 if(e.target.id==="archiveBackFile"){selectedFile=null;renderLiveArchive();return;}
 if(e.target.id==="archiveBackDevices"){selectedDevice=null;location.href="models.html?brand="+encodeURIComponent(selectedBrand||"");return;}
 const btn=e.target.closest("[data-archive-download]");if(!btn)return;
 const id=btn.dataset.archiveDownload;btn.disabled=true;const tab=window.open("about:blank","_blank");
 try{const result=await UzmantechAPI.archiveFileDownload(id);if(tab)tab.location=result.url;else window.location.href=result.url;}
 catch(err){if(tab)tab.close();toast(err.message||"İndirme bağlantısı alınamadı.");if(/giriş|üyelik/i.test(err.message||""))showLogin();}
 finally{btn.disabled=false;}
});
if($("#archiveModelsPage")){if(!selectedBrand||!MODEL_CATALOG[selectedBrand]){location.replace("archive.html");}else{const label=$("#archiveModelBrandLabel");if(label)label.textContent=selectedBrand.toLocaleUpperCase("tr-TR")+" MODEL KATALOĞU";const title=$("#archiveModelPageTitle");if(title)title.textContent=selectedBrand+" Cihaz Modelleri";}}
function showPackageRequired(){
 $("#modal").dataset.locked="true";
 $("#modalClose").hidden=true;
 $("#modalTitle").textContent="Dosya Arşivi";
 $("#modalBody").innerHTML=`<div class="archive-access-symbol" aria-hidden="true"><svg viewBox="0 0 48 48"><rect x="9" y="21" width="30" height="22" rx="5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M15 21v-7a9 9 0 0 1 18 0v7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="24" cy="31" r="2.2" fill="currentColor"/><path d="M24 33v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></div><span class="archive-access-kicker">UZMANTOOL DOSYA ARŞİVİ</span><h3 class="archive-access-title">Arşiv erişime açık değil</h3><p class="archive-access-copy">Marka ve modellere ait teknik dosyaları görüntülemek için aktif bir üyelik paketine ihtiyacınız var.</p><div class="archive-access-divider"></div><button type="button" class="archive-access-button" id="archivePackageContinue">Paketleri Görüntüle <span aria-hidden="true">→</span></button><small class="archive-access-note">Satın alma işleminiz yönetici tarafından onaylandığında erişiminiz açılır.</small>`;
 $("#modal").classList.add("open");
}
function syncArchiveHeader(user){
 const auth=$("#headerAuth");if(!auth)return;
 if(user){
  const name=String(user.username||user.email||"Kullanıcı").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const role=user.role==="admin"?"Yönetici":user.role==="member"?"Premium Üye":"Üye";
  auth.innerHTML='<div class="profile-menu-wrap"><button class="top-profile logged-in-profile" type="button" id="profileBtn" title="Kullanıcı menüsü" aria-haspopup="true" aria-expanded="false" aria-controls="profileDropdown"><span class="avatar"><svg viewBox="0 0 24 24"><use href="#i-user"/></svg></span><span class="top-account"><b>'+name+'</b><small>'+role+'</small></span><svg class="top-chevron" viewBox="0 0 24 24"><use href="#i-chevron"/></svg></button><div class="profile-dropdown" id="profileDropdown" hidden><button type="button" data-archive-profile-action="account"><span>Hesabım</span></button>'+(user.role==="admin"?'<button type="button" data-archive-profile-action="management"><span>Yönetim</span></button>':'')+'<div class="profile-language-row"><label for="languageSelect"><span>🌐</span><span>Dil Seçimi</span></label><select id="languageSelect" aria-label="Dil seçimi"><option value="tr">🇹🇷 Türkçe</option><option value="en">🇬🇧 English</option></select></div><button type="button" data-archive-profile-action="logout"><span>Çıkış</span></button></div></div>';
 }else{
  auth.innerHTML='<div class="profile-menu-wrap"><button class="top-profile logged-in-profile guest-profile" type="button" id="profileBtn" aria-haspopup="true" aria-expanded="false" aria-controls="profileDropdown"><span class="avatar"><svg viewBox="0 0 24 24"><use href="#i-user"/></svg></span><span class="top-account"><b>Misafir</b><small>Portal Ziyaretçisi</small></span><svg class="top-chevron" viewBox="0 0 24 24"><use href="#i-chevron"/></svg></button><div class="profile-dropdown" id="profileDropdown" hidden><div class="profile-language-row"><label for="languageSelect"><span>🌐</span><span>Dil Seçimi</span></label><select id="languageSelect" aria-label="Dil seçimi"><option value="tr">🇹🇷 Türkçe</option><option value="en">🇬🇧 English</option></select></div><button type="button" data-open="login">Giriş Yap</button><a class="profile-menu-link" href="kayit.html">Üye Ol</a></div></div>';
 }
 const languageSelect=$("#profileDropdown #languageSelect");
 if(languageSelect){let saved="tr";try{saved=localStorage.getItem("uzmantech_portal_language")||"tr";}catch{}languageSelect.value=saved;}
}
function applyLockedArchivePreview(){
 document.querySelectorAll(".archive-global-search,.archive-brand-catalog-head,.archive-brand-search").forEach(el=>{el.hidden=true;el.style.setProperty("display","none","important");});
}
async function enforceArchiveLicense(){
 const gate=$("#archiveLicenseGate"),stage=$(".archive-stage");
 if(stage)stage.hidden=true;
 try{
  const result=await UzmantechAPI.session();
  const user=result.user||{};
  syncArchiveHeader(user);
  const paidPlans=new Set(["weekly","monthly","half_year","annual","365","full_365"]);
  const hasPaidAccess=user.role==="admin"||(user.license_status==="active"&&paidPlans.has(String(user.license_plan||"").toLowerCase()));
  if(!hasPaidAccess){document.body.classList.remove("archive-authorized");document.body.classList.add("archive-preview-locked");applyLockedArchivePreview();if(stage)stage.hidden=false;if(gate){gate.hidden=false;gate.style.setProperty("display","flex","important");}return;}
  document.body.classList.remove("archive-preview-locked");
  document.body.classList.add("archive-authorized");
  if(stage)stage.hidden=false;
  if(gate)gate.hidden=true;
  await loadLiveArchive();
 }catch(error){
  syncArchiveHeader(null);
  // Ziyaretçi veya oturumu olmayan kullanıcı kayıt sayfasına atılmaz.
  // Dosya deposunun kilitli olduğunu görür; yalnızca Tamam ile paketlere gider.
  document.body.classList.remove("archive-authorized");
  document.body.classList.add("archive-preview-locked");
  applyLockedArchivePreview();
  if(stage)stage.hidden=false;
  if(gate){gate.hidden=false;gate.style.setProperty("display","flex","important");}
 }
}
enforceArchiveLicense();
document.addEventListener("click",e=>{const b=e.target.closest(".site-mobile-nav-toggle");if(!b)return;const nav=document.querySelector(".site-global-nav");const open=nav?.classList.toggle("is-open")||false;b.setAttribute("aria-expanded",String(open));});
})();
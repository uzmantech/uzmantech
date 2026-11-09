(()=>{"use strict";
const $=s=>document.querySelector(s);
const input=$("#glassQuery"),button=$("#glassSearch"),body=$("#glassResultBody"),title=$("#glassResultTitle"),lang=$("#languageSelect"),brandSelect=$("#compatBrand"),modelSelect=$("#compatModel"),glassTab=$("#glassTab"),batteryTab=$("#batteryTab"),searchPanel=$("#glassSearchPanel"),batteryPanel=$("#batteryPanel");
if(!input||!button||!body||!title)return;
let language=localStorage.getItem("uzmantech_portal_language")||localStorage.getItem("uzmantech_lang")||"tr",timer,seq=0,catalog={};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=s=>String(s||"").toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/[^a-z0-9]/g,"");
function t(tr,en){return language==="en"?en:tr;}
function setLanguage(v){
 language=v==="en"?"en":"tr";document.documentElement.lang=language;
 document.querySelectorAll("[data-tr][data-en]").forEach(e=>{e.textContent=e.dataset[language];});
 document.querySelectorAll("[data-tr-placeholder][data-en-placeholder]").forEach(e=>{e.placeholder=language==="en"?e.dataset.enPlaceholder:e.dataset.trPlaceholder;});
 if(lang)lang.value=language;
 document.querySelectorAll(".language-control").forEach(e=>e.dataset.current=language==="en"?"EN":"TR");
 document.querySelectorAll(".language-globe").forEach(e=>{e.textContent="";e.dataset.lang=language;e.setAttribute("aria-label",language==="en"?"English":"Türkçe");});
 populateBrands(brandSelect.value);populateModels(modelSelect.value);
 localStorage.setItem("uzmantech_lang",language);localStorage.setItem("uzmantech_portal_language",language);
}
function fillSelect(select,placeholder,items,selected=""){
 select.innerHTML='<option value="">'+esc(placeholder)+'</option>'+items.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join("");
 if(items.includes(selected))select.value=selected;
}
function populateBrands(selected=""){
 fillSelect(brandSelect,t("Marka seçin","Select brand"),Object.keys(catalog).sort((a,b)=>a.localeCompare(b,language==="tr"?"tr":"en")),selected);
}
function populateModels(selected=""){
 const items=brandSelect.value?(catalog[brandSelect.value]||[]):[];
 fillSelect(modelSelect,brandSelect.value?t("Model seçin","Select model"):t("Önce marka seçin","Choose a brand first"),items,selected);
 modelSelect.disabled=!brandSelect.value||!items.length;
}
async function loadCatalog(){
 try{
  const c=window.UZMANTECH_CONFIG;
  const r=await fetch(c.apiBaseUrl+"/portal-api/catalog",{headers:{apikey:c.publishableKey,Authorization:"Bearer "+c.publishableKey}});
  const d=await r.json();if(!r.ok||!d.success||!d.catalog)throw Error(d.message||"Catalog unavailable");
  catalog=d.catalog;populateBrands();
 }catch(e){brandSelect.innerHTML='<option value="">'+esc(t("Marka listesi yüklenemedi","Brand list unavailable"))+'</option>';brandSelect.disabled=true;}
}
function renderResults(models,query){
 const unique=[...new Map(models.map(m=>[norm(m),m])).values()];
 title.textContent=t("Uyumlu modeller: ","Compatible models: ")+query;
 if(!unique.length){body.innerHTML='<div class="compat-empty"><strong>'+esc(t("Eşleşme bulunamadı.","No matches found."))+'</strong><p>'+esc(t("Farklı bir model adı deneyin.","Try another model name."))+'</p></div>';return;}
 body.innerHTML='<div class="compat-result-summary"><strong>'+unique.length+'</strong> '+esc(t("uyumlu model","compatible models"))+'</div><div class="compat-model-list">'+unique.sort((a,b)=>a.localeCompare(b,"tr")).map((m,i)=>'<div class="compat-model-row"><span>'+String(i+1).padStart(2,"0")+'</span><strong>'+esc(m)+'</strong></div>').join("")+'</div>';
}
async function search(queryOverride){
 const query=String(queryOverride??input.value).trim(),id=++seq;
 if(query.length<2){title.textContent=t("En az 2 karakter girin","Enter at least 2 characters");return;}
 button.disabled=true;button.querySelector("span").textContent=t("ARANIYOR","SEARCHING");
 title.textContent=t("Katalog kontrol ediliyor","Checking catalog");
 body.innerHTML='<div class="compat-empty">'+esc(t("Uyumluluk verileri yükleniyor...","Loading compatibility data..."))+'</div>';
 try{
  const c=window.UZMANTECH_CONFIG;
  const r=await fetch(c.apiBaseUrl+"/portal-api/cam-uyumluluk?q="+encodeURIComponent(query),{headers:{apikey:c.publishableKey,Authorization:"Bearer "+c.publishableKey}});
  const d=await r.json();if(id!==seq)return;if(!r.ok||!d.success)throw Error(d.error||t("Katalog kullanılamıyor","Catalog unavailable"));
  const models=(d.groups||[]).flatMap(g=>g.models||[]);
  renderResults(models,query);
 }catch(e){if(id!==seq)return;title.textContent=t("Kataloğa ulaşılamadı","Catalog unavailable");body.innerHTML='<div class="compat-empty"><strong>'+esc(e.message)+'</strong></div>';}
 finally{if(id===seq){button.disabled=false;button.querySelector("span").textContent=t("SORGULA","SEARCH");}}
}
$("#glassSearchForm")?.addEventListener("submit",e=>{e.preventDefault();search();});
button.addEventListener("click",()=>search());
input.addEventListener("input",()=>{clearTimeout(timer);if(input.value.trim().length>=3)timer=setTimeout(()=>search(),700);});
brandSelect.addEventListener("change",()=>{populateModels();});
modelSelect.addEventListener("change",()=>{if(modelSelect.value){input.value=modelSelect.value;search(modelSelect.value);}});
glassTab.addEventListener("click",()=>{glassTab.classList.add("is-active");glassTab.setAttribute("aria-selected","true");batteryTab.classList.remove("is-active");batteryTab.setAttribute("aria-selected","false");searchPanel.hidden=false;batteryPanel.hidden=true;});
batteryTab.addEventListener("click",()=>{batteryTab.classList.add("is-active");batteryTab.setAttribute("aria-selected","true");glassTab.classList.remove("is-active");glassTab.setAttribute("aria-selected","false");searchPanel.hidden=true;batteryPanel.hidden=false;});
lang?.addEventListener("change",()=>setLanguage(lang.value));
setLanguage(language);loadCatalog();
})();
(()=>{"use strict";
const $=s=>document.querySelector(s);
const input=$("#glassQuery"),button=$("#glassSearch"),body=$("#glassResultBody"),title=$("#glassResultTitle"),lang=$("#languageSelect"),brandSelect=$("#compatBrand"),modelSelect=$("#compatModel"),glassTab=$("#glassTab"),batteryTab=$("#batteryTab"),searchPanel=$("#glassSearchPanel"),batteryPanel=$("#batteryPanel"),suggestions=$("#glassSuggestions");
if(!input||!button||!body||!title||!brandSelect||!modelSelect)return;
let language=localStorage.getItem("uzmantech_portal_language")||localStorage.getItem("uzmantech_lang")||"tr",timer,suggestTimer,seq=0,suggestSeq=0,catalog={};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=s=>String(s||"").toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ı/g,"i").replace(/[^a-z0-9]/g,"");
function t(tr,en){return language==="en"?en:tr;}
function api(){const c=window.UZMANTECH_CONFIG;if(!c?.apiBaseUrl||!c?.publishableKey)throw Error("Portal API ayarları bulunamadı.");return c;}
function headers(){const c=api();return {apikey:c.publishableKey,Authorization:"Bearer "+c.publishableKey};}
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
 const brands=Object.keys(catalog).sort((a,b)=>a.localeCompare(b,language==="tr"?"tr":"en"));
 fillSelect(brandSelect,t("Marka seçin","Select brand"),brands,selected);
 brandSelect.disabled=!brands.length;
}
function populateModels(selected=""){
 const items=brandSelect.value?(catalog[brandSelect.value]||[]):[];
 fillSelect(modelSelect,brandSelect.value?t("Model seçin","Select model"):t("Önce marka seçin","Choose a brand first"),items,selected);
 modelSelect.disabled=!brandSelect.value||!items.length;
}
async function loadCatalog(){
 try{
  const c=api(),r=await fetch(c.apiBaseUrl+"/portal-api/cam-uyumluluk?catalog=1",{headers:headers()});
  const d=await r.json();if(!r.ok||!d.success||!d.catalog)throw Error(d.error||"Uyumluluk kataloğu yüklenemedi.");
  catalog=d.catalog;populateBrands();
 }catch(e){brandSelect.innerHTML='<option value="">'+esc(t("Marka listesi yüklenemedi","Brand list unavailable"))+'</option>';brandSelect.disabled=true;console.error("Glass compatibility catalog failed",e);}
}
function hideSuggestions(){suggestions.hidden=true;suggestions.innerHTML="";}
function showSuggestions(models,query){
 if(!models.length){hideSuggestions();return;}
 suggestions.innerHTML='<div class="compat-suggest-title">'+esc(t("UYUMLU MODELLER","COMPATIBLE MODELS"))+'</div>'+models.slice(0,10).map((m,i)=>'<button type="button" class="compat-suggestion" role="option" data-model="'+esc(m)+'"><span>'+esc(m)+'</span><b>↗</b></button>').join("")+'<button type="button" class="compat-suggest-all">'+esc(t("Tüm uyumluluk sonuçlarını göster","Show all compatibility results"))+' <b>→</b></button>';
 suggestions.hidden=false;
 suggestions.querySelectorAll("[data-model]").forEach(el=>el.addEventListener("click",()=>{const model=el.dataset.model;input.value=model;hideSuggestions();search(model);}));
 suggestions.querySelector(".compat-suggest-all")?.addEventListener("click",()=>{hideSuggestions();search(query);});
}
async function loadSuggestions(query){
 const id=++suggestSeq;
 if(query.trim().length<2){hideSuggestions();return;}
 try{
  const c=api(),r=await fetch(c.apiBaseUrl+"/portal-api/cam-uyumluluk?suggest="+encodeURIComponent(query),{headers:headers()});
  const d=await r.json();if(id!==suggestSeq)return;if(!r.ok||!d.success)throw Error(d.error||"Öneriler yüklenemedi.");
  showSuggestions(d.suggestions||[],query);
 }catch(e){if(id===suggestSeq)hideSuggestions();console.warn("Glass suggestions failed",e);}
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
  const c=api(),r=await fetch(c.apiBaseUrl+"/portal-api/cam-uyumluluk?q="+encodeURIComponent(query),{headers:headers()});
  const d=await r.json();if(id!==seq)return;if(!r.ok||!d.success)throw Error(d.error||t("Katalog kullanılamıyor","Catalog unavailable"));
  const models=(d.groups||[]).flatMap(g=>g.models||[]);
  renderResults(models,query);
 }catch(e){if(id!==seq)return;title.textContent=t("Kataloğa ulaşılamadı","Catalog unavailable");body.innerHTML='<div class="compat-empty"><strong>'+esc(e.message)+'</strong></div>';}
 finally{if(id===seq){button.disabled=false;button.querySelector("span").textContent=t("SORGULA","SEARCH");}}
}
$("#glassSearchForm")?.addEventListener("submit",e=>{e.preventDefault();hideSuggestions();search();});
button.addEventListener("click",()=>{hideSuggestions();search();});
input.addEventListener("input",()=>{
 clearTimeout(timer);clearTimeout(suggestTimer);
 const q=input.value.trim();
 suggestTimer=setTimeout(()=>loadSuggestions(q),220);
 if(q.length>=3)timer=setTimeout(()=>search(q),650);
});
input.addEventListener("keydown",e=>{if(e.key==="Escape")hideSuggestions();if(e.key==="Enter"&&!suggestions.hidden){const first=suggestions.querySelector("[data-model]");if(first){e.preventDefault();first.click();}}});
document.addEventListener("click",e=>{if(!e.target.closest(".compat-search-row"))hideSuggestions();});
brandSelect.addEventListener("change",()=>{populateModels();});
modelSelect.addEventListener("change",()=>{if(modelSelect.value){input.value=modelSelect.value;hideSuggestions();search(modelSelect.value);}});
glassTab.addEventListener("click",()=>{glassTab.classList.add("is-active");glassTab.setAttribute("aria-selected","true");batteryTab.classList.remove("is-active");batteryTab.setAttribute("aria-selected","false");searchPanel.hidden=false;batteryPanel.hidden=true;});
batteryTab.addEventListener("click",()=>{batteryTab.classList.add("is-active");batteryTab.setAttribute("aria-selected","true");glassTab.classList.remove("is-active");glassTab.setAttribute("aria-selected","false");searchPanel.hidden=true;batteryPanel.hidden=false;});
lang?.addEventListener("change",()=>setLanguage(lang.value));
setLanguage(language);loadCatalog();
})();
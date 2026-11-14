(()=>{
 if(window.__uzDropdownBound)return;
 window.__uzDropdownBound=true;
 document.addEventListener("click",function(e){
  const toggle=e.target.closest(".site-nav-dropdown-toggle");
  const current=toggle&&toggle.closest(".site-nav-dropdown");
  if(current){
   const opening=!current.classList.contains("is-open");
   document.querySelectorAll(".site-nav-dropdown.is-open").forEach(function(node){node.classList.remove("is-open");node.querySelector(".site-nav-dropdown-toggle")?.setAttribute("aria-expanded","false");});
   if(opening){current.classList.add("is-open");toggle.setAttribute("aria-expanded","true");}
   e.preventDefault();e.stopPropagation();return;
  }
  if(!e.target.closest(".site-nav-dropdown"))document.querySelectorAll(".site-nav-dropdown.is-open").forEach(function(node){node.classList.remove("is-open");node.querySelector(".site-nav-dropdown-toggle")?.setAttribute("aria-expanded","false");});
 });
 document.addEventListener("keydown",function(e){if(e.key==="Escape")document.querySelectorAll(".site-nav-dropdown.is-open").forEach(function(node){node.classList.remove("is-open");node.querySelector(".site-nav-dropdown-toggle")?.setAttribute("aria-expanded","false");});});
})();

interface Env {}
interface Context { request: Request; env: Env }
const API="https://iutehccebzqnhqkevawz.supabase.co/functions/v1/portal-api/news";
const KEY="sb_publishable_T2ogx50EKeT1ST_m6Tszsw_joA5zLpB";
const xml=(v:unknown)=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
export async function onRequest():Promise<Response>{
 let items:any[]=[];
 try{const r=await fetch(API+"?limit=60",{headers:{apikey:KEY,Authorization:"Bearer "+KEY},cf:{cacheTtl:300,cacheEverything:true}});const d=await r.json() as any;if(r.ok&&d.success&&Array.isArray(d.news))items=d.news;}catch{}
 const fixed=["/","/archive.html","/cam-uyumluluk.html","/paketler.html","/destek.html","/gizlilik-politikasi.html"];
 const urls=fixed.map(path=>'<url><loc>https://uzmantool.com.tr'+path+'</loc><changefreq>weekly</changefreq><priority>'+(path==="/"?"1.0":"0.6")+'</priority></url>');
 for(const n of items){if(n.slug)urls.push('<url><loc>https://uzmantool.com.tr/haber/'+encodeURIComponent(n.slug)+'</loc><lastmod>'+xml(n.published_at||new Date().toISOString())+'</lastmod><changefreq>monthly</changefreq><priority>0.5</priority></url>');}
 const body='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+urls.join("")+'</urlset>';
 return new Response(body,{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"public, max-age=300"}});
}

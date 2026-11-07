interface Env {}
interface Context { request: Request; params: { slug?: string }; env: Env }
const API="https://iutehccebzqnhqkevawz.supabase.co/functions/v1/portal-api/news";
const KEY="sb_publishable_T2ogx50EKeT1ST_m6Tszsw_joA5zLpB";
const esc=(v:unknown)=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]!));
export async function onRequest({params}:Context):Promise<Response>{
 const slug=String(params.slug||"").slice(0,120);
 if(!/^[a-z0-9-]+$/.test(slug))return new Response("Haber bulunamadı.",{status:404});
 let item:any;
 try{
  const res=await fetch(API+"?slug="+encodeURIComponent(slug),{headers:{apikey:KEY,Authorization:"Bearer "+KEY,Accept:"application/json"},cf:{cacheTtl:60,cacheEverything:true}});
  const data=await res.json() as any;
  if(!res.ok||!data.success||!data.news)return new Response("Haber bulunamadı.",{status:404,headers:{"Content-Type":"text/plain; charset=utf-8"}});
  item=data.news;
 }catch{return new Response("Haber şu anda yüklenemiyor.",{status:503});}
 const title=String(item.title||"Teknoloji Haberleri").slice(0,240);
 const summary=String(item.summary||title).slice(0,560);
 const canonical="https://uzmantool.com.tr/haber/"+encodeURIComponent(slug);
 const date=item.published_at&& !Number.isNaN(Date.parse(item.published_at))?new Date(item.published_at).toISOString():new Date().toISOString();
 const source=String(item.source_name||"Teknoloji haber kaynağı");
 const sourceUrl=String(item.source_url||"");
 const image=String(item.image_url||"");
 const schema={"@context":"https://schema.org","@type":"NewsArticle","headline":title,"description":summary,"datePublished":date,"dateModified":date,"mainEntityOfPage":canonical,"author":{"@type":"Organization","name":source,"url":sourceUrl},"publisher":{"@type":"Organization","name":"Uzmantech","url":"https://uzmantool.com.tr/"}};
 if(/^https:\/\//.test(image))Object.assign(schema,{image:[image]});
 const html='<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(title)+' | Uzmantech Teknoloji Haberleri</title><meta name="description" content="'+esc(summary.slice(0,160))+'"><link rel="canonical" href="'+canonical+'"><meta name="robots" content="index,follow,max-image-preview:large"><meta property="og:type" content="article"><meta property="og:site_name" content="Uzmantech"><meta property="og:title" content="'+esc(title)+'"><meta property="og:description" content="'+esc(summary.slice(0,200))+'"><meta property="og:url" content="'+canonical+'">'+(image?' <meta property="og:image" content="'+esc(image)+'">':'')+'<meta property="article:published_time" content="'+date+'"><meta name="twitter:card" content="summary_large_image"><script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,"\\u003c")+'</script><style>*{box-sizing:border-box}body{margin:0;background:#07111f;color:#e8f2ff;font:16px/1.75 Inter,system-ui,Arial,sans-serif}.wrap{width:min(900px,calc(100% - 36px));margin:0 auto;padding:42px 0 70px}.brand{color:#54c8ff;text-decoration:none;font-weight:800;letter-spacing:2px}.crumb{margin:34px 0 12px;color:#8ca8c3;font-size:13px}.crumb a{color:#71cfff;text-decoration:none}.tag{display:inline-block;padding:5px 10px;border:1px solid #245178;border-radius:20px;color:#62caff;font-size:11px;letter-spacing:1px}.article{margin-top:16px;padding:clamp(22px,5vw,48px);border:1px solid #203b59;border-radius:22px;background:linear-gradient(145deg,#10243b,#0b1728)}h1{font-size:clamp(30px,5vw,48px);line-height:1.15;letter-spacing:-1px;margin:18px 0}.meta{color:#91a9c1;font-size:13px}.summary{margin:30px 0;color:#d2e2f2;font-size:18px;line-height:1.85}.source{padding:18px;border:1px solid #294764;border-radius:12px;background:#09182a}.source a,.back{color:#56caff;text-decoration:none;font-weight:700}.notice{margin-top:20px;color:#8099b2;font-size:12px}.back{display:inline-block;margin-top:28px}</style></head><body><main class="wrap"><a class="brand" href="/">UZMANTECH</a><div class="crumb"><a href="/">Ana Sayfa</a> / <a href="/index.html#updates">Haberler</a> / Teknoloji</div><article class="article"><span class="tag">TEKNOLOJİ HABERİ</span><h1>'+esc(title)+'</h1><div class="meta">'+esc(source)+' · '+new Date(date).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})+'</div><p class="summary">'+esc(summary)+'</p><div class="source"><b>Haber kaynağı</b><p>Bu haberin özgün içeriği kaynak yayıncıya aittir. Ayrıntılar ve güncel bilgiler için orijinal haberi ziyaret edin.</p><a href="'+esc(sourceUrl)+'" target="_blank" rel="noopener noreferrer nofollow">Kaynak haberi görüntüle ↗</a></div><a class="back" href="/index.html#updates">← Haberler sayfasına dön</a></article></main></body></html>';
 return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"public, max-age=60, s-maxage=300","X-Content-Type-Options":"nosniff"}});
}

export async function onRequestGet({ request }) {
  const channelId = "UCZkyD6X05MM8MJJqq8epJGA";
  const feedUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=" + channelId;
  try {
    const upstream = await fetch(feedUrl, {
      headers: { "User-Agent": "UzmantechPortal/1.0" },
      cf: { cacheTtl: 300, cacheEverything: true }
    });
    if (!upstream.ok) {
      return Response.json({ videos: [], error: "YouTube akışı alınamadı." }, { status: 502 });
    }
    const xml = await upstream.text();
    const videos = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => {
      const entry = match[1];
      const read = (tag) => {
        const found = entry.match(new RegExp("<" + tag + "[^>]*>([\\s\\S]*?)<\\/" + tag + ">"));
        return found ? found[1].replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'") : "";
      };
      const id = read("yt:videoId");
      return {
        id,
        title: read("title"),
        published: read("published"),
        thumbnail: id ? "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg" : ""
      };
    }).filter((video) => /^[A-Za-z0-9_-]{11}$/.test(video.id) && video.title);\n    // YouTube RSS returns the latest channel uploads. Shuffle and select a subset\n    // so each page visit presents a different mix instead of a fixed list.\n    for (let i = videos.length - 1; i > 0; i--) {\n      const j = Math.floor(Math.random() * (i + 1));\n      [videos[i], videos[j]] = [videos[j], videos[i]];\n    }\n    videos.splice(8);
    return Response.json({ videos }, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" }
    });
  } catch (_) {
    return Response.json({ videos: [], error: "YouTube akışına şu anda ulaşılamıyor." }, { status: 502 });
  }
}

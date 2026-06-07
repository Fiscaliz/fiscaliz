// Fetch URL (site or legislation) and return cleaned text for AI training.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { url } = await req.json();
    if (!url || !/^https?:\/\//i.test(url)) {
      return new Response(JSON.stringify({ error: "URL inválida" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 FiscalizBot" },
      redirect: "follow",
    });
    const html = await r.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100000);
    return new Response(JSON.stringify({ title, text, length: text.length }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});

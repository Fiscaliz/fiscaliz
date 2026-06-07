// Evidence Engine — analyzes an image and returns structured findings as JSON.
// Future-ready: provider can be swapped to OpenAI Vision or Claude Vision.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Provider = "lovable" | "openai" | "claude";

interface EngineInput {
  image_url?: string;        // public or signed URL
  image_base64?: string;     // data URL or raw base64
  category?: string;
  area_of_practice?: string;
  context?: string;
  provider?: Provider;       // default 'lovable'
  evidence_id?: string;      // optional: persist result back to evidences row
}

const SYSTEM_PROMPT = `Você é o Evidence Engine: um analista técnico de evidências fotográficas.
Receba uma imagem e retorne SOMENTE um objeto JSON válido com este schema EXATO:
{
  "description": "descrição objetiva do que se observa (2-4 frases)",
  "caption": "legenda curta, técnica, até 80 caracteres",
  "annotation_suggestions": [
    { "type": "arrow|circle|rect|highlight|number|text", "target": "o que marcar", "rationale": "por que" }
  ],
  "possible_findings": [
    { "finding": "descrição do achado", "evidence": "o que na imagem sustenta", "confidence": "low|medium|high" }
  ],
  "criticality": "low|medium|high|critical",
  "criticality_reason": "justificativa breve",
  "tags": ["palavras-chave"]
}
Use linguagem técnica adequada à área informada. Não inclua texto fora do JSON.`;

async function callLovable(payload: EngineInput) {
  const key = Deno.env.get("LOVABLE_API_KEY")!;
  const userParts: any[] = [
    { type: "text", text: `Área de atuação: ${payload.area_of_practice ?? "N/D"}\nCategoria: ${payload.category ?? "N/D"}\nContexto: ${payload.context ?? "N/D"}` },
  ];
  if (payload.image_url) userParts.push({ type: "image_url", image_url: { url: payload.image_url } });
  else if (payload.image_base64) {
    const url = payload.image_base64.startsWith("data:") ? payload.image_base64 : `data:image/jpeg;base64,${payload.image_base64}`;
    userParts.push({ type: "image_url", image_url: { url } });
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userParts },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`Lovable AI ${res.status}: ${await res.text()}`);
  const j = await res.json();
  const content = j.choices?.[0]?.message?.content ?? "{}";
  try { return JSON.parse(content); } catch { return { description: content, raw: true }; }
}

async function callOpenAI(_payload: EngineInput): Promise<any> {
  throw new Error("OpenAI Vision provider not configured. Set OPENAI_API_KEY and implement adapter.");
}

async function callClaude(_payload: EngineInput): Promise<any> {
  throw new Error("Claude Vision provider not configured. Set ANTHROPIC_API_KEY and implement adapter.");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as EngineInput;
    if (!body.image_url && !body.image_base64) {
      return new Response(JSON.stringify({ error: "image_url or image_base64 is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const provider: Provider = body.provider ?? "lovable";
    const t0 = Date.now();
    let analysis: any;
    if (provider === "openai") analysis = await callOpenAI(body);
    else if (provider === "claude") analysis = await callClaude(body);
    else analysis = await callLovable(body);
    const elapsed_ms = Date.now() - t0;

    // Optional: persist back to evidences row if caller is authenticated and provided evidence_id
    if (body.evidence_id) {
      try {
        const authHeader = req.headers.get("Authorization") ?? "";
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
        const { data: u } = await userClient.auth.getUser();
        if (u?.user) {
          const admin = createClient(supabaseUrl, serviceKey);
          await admin.from("evidences").update({
            ai_analysis: analysis,
            ai_status: "completed",
            caption: analysis.caption ?? null,
            observation: analysis.description ?? null,
            finding: Array.isArray(analysis.possible_findings) && analysis.possible_findings.length > 0
              ? analysis.possible_findings.map((f: any) => f.finding).join("; ") : null,
            risk_level: analysis.criticality ?? null,
          }).eq("id", body.evidence_id).eq("user_id", u.user.id);
        }
      } catch (e) {
        console.error("persist error", e);
      }
    }

    return new Response(JSON.stringify({ ok: true, provider, elapsed_ms, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

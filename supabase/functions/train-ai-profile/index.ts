// AI Trainer - analyzes uploaded documents and builds the company technical profile
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = userData.user.id;
    const admin = createClient(supabaseUrl, serviceKey);

    // Load pending docs + their extracted text (if any)
    const { data: docs } = await admin
      .from("ai_training_documents")
      .select("id, name, doc_type, extracted_text")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    const { data: existingProfile } = await admin
      .from("ai_company_profile")
      .select("area_of_practice, profession, report_types")
      .eq("user_id", userId)
      .maybeSingle();

    const corpus = (docs ?? [])
      .map((d) => `# ${d.doc_type.toUpperCase()} — ${d.name}\n${(d.extracted_text ?? "").slice(0, 4000)}`)
      .join("\n\n---\n\n")
      .slice(0, 60000);

    const system = `Você é um analista que constrói um Perfil Técnico de uma empresa a partir de seus documentos.
Responda SOMENTE com um JSON válido no formato:
{
  "summary": "resumo executivo (2-3 frases)",
  "vocabulary": ["termo1","termo2", ...],
  "document_structure": { "secoes_comuns": ["..."], "padroes": "..." },
  "evidence_types": ["fotos","laudos analíticos", ...],
  "report_format": { "tom": "formal", "linguagem": "técnica", "elementos": ["..."] }
}`;

    const userMsg = `Área: ${existingProfile?.area_of_practice ?? "N/D"}\nProfissão: ${existingProfile?.profession ?? "N/D"}\nTipos de relatório: ${(existingProfile?.report_types ?? []).join(", ")}\n\nDocumentos:\n${corpus || "(nenhum texto disponível)"}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI error", detail: t }), { status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const aiJson = await aiRes.json();
    const content = aiJson.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = { summary: content }; }

    await admin.from("ai_company_profile").upsert({
      user_id: userId,
      summary: parsed.summary ?? null,
      vocabulary: parsed.vocabulary ?? [],
      document_structure: parsed.document_structure ?? {},
      evidence_types: parsed.evidence_types ?? [],
      report_format: parsed.report_format ?? {},
      documents_analyzed: (docs ?? []).length,
      last_trained_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return new Response(JSON.stringify({ ok: true, profile: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

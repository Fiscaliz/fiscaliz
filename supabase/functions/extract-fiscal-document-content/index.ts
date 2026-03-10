/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

async function verifyAuth(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  return { userId: data.claims.sub as string };
}

function getPromptForType(documentType: string): { system: string; user: string } {
  const typeLabels: Record<string, string> = {
    termo_intimacao: 'Termo de Intimação',
    auto_infracao: 'Auto de Infração',
    advertencia: 'Advertência',
    inutilizacao: 'Termo de Inutilização',
    apreensao: 'Termo de Apreensão',
    interdicao: 'Termo de Interdição',
    notificacao: 'Notificação',
    visita_fiscal: 'Visita Fiscal',
    replica: 'Réplica/Impugnação',
  };
  const label = typeLabels[documentType] || documentType;

  const schemas: Record<string, string> = {
    termo_intimacao: `{
  "content": "texto completo das irregularidades/exigências",
  "deadlineDays": número de dias do prazo (ex: 15),
  "observations": "observações adicionais",
  "documentDate": "YYYY-MM-DD",
  "documentTime": "HH:MM"
}`,
    auto_infracao: `{
  "infracoes": [
    { "descricao": "descrição da infração", "dispositivo": "artigo/lei infringida" }
  ],
  "valorMulta": "valor da multa se mencionado",
  "prazoDefesa": número de dias para defesa (ex: 15),
  "documentDate": "YYYY-MM-DD",
  "documentTime": "HH:MM"
}`,
    advertencia: `{
  "irregularidades": [
    { "descricao": "descrição da irregularidade", "dispositivo": "legislação" }
  ],
  "prazo": "prazo para adequação",
  "fundamentacaoLegal": "base legal",
  "orientacoes": "orientações dadas",
  "documentDate": "YYYY-MM-DD",
  "documentTime": "HH:MM"
}`,
    inutilizacao: `{
  "produtos": [
    { "produto": "nome do produto", "marca": "marca", "lote": "lote", "quantidade": "qtd", "unidade": "un", "pesoKg": "peso em kg", "motivoInutilizacao": "motivo" }
  ],
  "metodoInutilizacao": "método utilizado",
  "localInutilizacao": "local da inutilização",
  "testemunhas": "nomes das testemunhas",
  "justificativa": "justificativa legal",
  "documentDate": "YYYY-MM-DD",
  "documentTime": "HH:MM"
}`,
    apreensao: `{
  "produtos": [
    { "produto": "nome do produto", "marca": "marca", "lote": "lote", "quantidade": "qtd", "unidade": "un", "pesoKg": "peso", "naoConformidade": "motivo", "dispositivoLegal": "legislação" }
  ],
  "lacreNumeros": ["número do lacre"],
  "destinacao": "destino dos produtos apreendidos",
  "fielDepositario": true ou false,
  "observacoes": "observações",
  "documentDate": "YYYY-MM-DD",
  "documentTime": "HH:MM"
}`,
    interdicao: `{
  "tipoInterdicao": "total" ou "parcial",
  "areasInterditadas": "áreas/setores interditados",
  "motivoInterdicao": "motivo da interdição",
  "fundamentacaoLegal": "base legal",
  "condicoesDesinterdicao": "condições para desinterdição",
  "observacoes": "observações",
  "documentDate": "YYYY-MM-DD",
  "documentTime": "HH:MM"
}`,
    notificacao: `{
  "assunto": "assunto da notificação",
  "conteudo": "conteúdo/corpo da notificação",
  "fundamentacaoLegal": "base legal",
  "prazoResposta": "prazo para resposta",
  "documentDate": "YYYY-MM-DD",
  "documentTime": "HH:MM"
}`,
    visita_fiscal: `{
  "purpose": ["finalidade da visita (ex: Inspeção, Reinspeção, Orientação)"],
  "anotacoes": "observações feitas durante a visita",
  "orientacoes": "orientações dadas",
  "documentDate": "YYYY-MM-DD",
  "documentTime": "HH:MM"
}`,
    replica: `{
  "documentoOrigem": "número do documento original (Auto de Infração, etc.)",
  "numeroProcesso": "número do processo",
  "folhasDefesa": "folhas da defesa",
  "descricaoInfracao": "infração original",
  "capitulacaoLegal": "capitulação legal",
  "resumoDefesa": "resumo da defesa apresentada",
  "analiseDefesa": "análise técnica da defesa",
  "conclusao": "conclusão/parecer",
  "fundamentacaoLegal": "base legal da réplica",
  "documentDate": "YYYY-MM-DD",
  "documentTime": "HH:MM"
}`,
  };

  const schema = schemas[documentType] || `{ "content": "texto extraído do documento", "documentDate": "YYYY-MM-DD", "documentTime": "HH:MM" }`;

  const system = `Você é um especialista em extrair informações de documentos fiscais sanitários brasileiros.
Analise a(s) imagem(ns) de um documento do tipo "${label}" preenchido (pode ser manuscrito ou impresso) e extraia TODOS os dados relevantes.

IMPORTANTE:
- Extraia APENAS dados que estejam claramente visíveis no documento
- Se não conseguir identificar algum campo, use string vazia "" ou null
- Não invente dados
- Datas devem ser formatadas como YYYY-MM-DD
- Horários como HH:MM (24h)
- Remova pontuação de CNPJs e CPFs`;

  const user = `Extraia os dados deste documento fiscal do tipo "${label}" e retorne em formato JSON conforme o schema abaixo:

${schema}

Retorne APENAS o JSON, sem texto adicional ou explicações.`;

  return { system, user };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof Response) return authResult;

    const { imagesBase64, documentType } = await req.json();
    if (!imagesBase64 || !Array.isArray(imagesBase64) || imagesBase64.length === 0) {
      return new Response(JSON.stringify({ error: "Imagens não fornecidas" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!documentType) {
      return new Response(JSON.stringify({ error: "Tipo de documento não informado" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    console.log(`[extract-fiscal-document-content] Processing ${documentType} with ${imagesBase64.length} images`);

    const { system, user } = getPromptForType(documentType);

    const imageContent = imagesBase64.map((img: string) => ({
      type: "image_url" as const,
      image_url: { url: img },
    }));

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: [{ type: "text", text: user }, ...imageContent] },
        ],
        temperature: 0.1,
      }),
    });

    if (!aiResp.ok) {
      const errorText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errorText);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Tente novamente em instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: `Erro ao processar: ${aiResp.status}` }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiResp.json();
    const responseText = json?.choices?.[0]?.message?.content as string | undefined;
    if (!responseText) {
      return new Response(JSON.stringify({ error: "Resposta vazia da IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[extract-fiscal-document-content] AI response:`, responseText.substring(0, 500));

    let extractedData: any = {};
    try {
      let jsonString = responseText.trim();
      if (jsonString.startsWith("```")) {
        jsonString = jsonString.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      extractedData = JSON.parse(jsonString);
    } catch {
      console.error("Failed to parse AI response");
      return new Response(
        JSON.stringify({ error: "Não foi possível extrair dados. Tente com uma imagem mais clara." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ data: extractedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-fiscal-document-content error:", e);
    return new Response(JSON.stringify({ error: "Erro ao processar solicitação" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

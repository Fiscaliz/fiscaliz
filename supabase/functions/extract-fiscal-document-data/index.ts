/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ALLOWED_ORIGINS = [
  "https://fiscaliz.lovable.app",
  "https://id-preview--4a07efe0-5065-4b28-9142-91e42ddd1344.lovable.app",
  "http://localhost:5173",
  "http://localhost:8100",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

type ExtractedData = {
  cnpj?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  endereco?: string;
  bairro?: string;
  cep?: string;
  cnaePrincipal?: string;
  responsavelNome?: string;
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64 } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "Imagem não fornecida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("[extract-fiscal-document-data] Processing fiscal document image...");

    const systemPrompt = `Você é um especialista em extrair informações de documentos fiscais sanitários brasileiros.

Os documentos podem ser: Termo de Intimação, Visita Fiscal, Auto de Infração, Notificação, Certidão, ou outros documentos da Vigilância Sanitária.

Analise a imagem do documento fiscal e extraia as seguintes informações do ESTABELECIMENTO fiscalizado:
- CNPJ (formato: XX.XXX.XXX/XXXX-XX ou apenas números)
- Razão Social (nome oficial da empresa)
- Nome Fantasia (nome comercial, se disponível)
- Endereço completo (logradouro, número, complemento, quadra, lote)
- Bairro
- CEP (formato: XXXXX-XXX ou apenas números)
- CNAE/Atividade Principal (PRIORIDADE ALTA: busque código numérico como 5611-2/01, 4712-1/00 ou descrição como "Restaurante", "Lanchonete", "Padaria")
- Nome do Responsável/Representante do estabelecimento

IMPORTANTE:
- Foque nos dados do ESTABELECIMENTO, não do órgão fiscalizador
- CNAE é fundamental para classificação de risco - busque atentamente por códigos numéricos no formato XXXX-X/XX ou descrições de atividade econômica
- Retorne APENAS os dados que você conseguir identificar claramente na imagem
- Se não conseguir identificar algum campo, deixe-o como null
- Não invente dados
- Limpe e formate o CNPJ e CEP se encontrados (remova pontuação)`;

    const userPrompt = `Extraia os dados do estabelecimento fiscalizado desta imagem de documento fiscal e retorne em formato JSON com as seguintes chaves:
{
  "cnpj": "string (apenas números) ou null",
  "razaoSocial": "string ou null",
  "nomeFantasia": "string ou null",
  "endereco": "string ou null",
  "bairro": "string ou null",
  "cep": "string (apenas números) ou null",
  "cnaePrincipal": "string (código CNAE no formato XXXX-X/XX ou descrição da atividade) ou null",
  "responsavelNome": "string ou null"
}

ATENÇÃO ESPECIAL para CNAE: procure por códigos como "5611-2/01", "4712-1/00", ou descrições como "Restaurantes e similares", "Lanchonete", "Padaria", "Açougue", etc.

Retorne APENAS o JSON, sem texto adicional ou explicações.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: { url: imageBase64 },
              },
            ],
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!aiResp.ok) {
      const errorText = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, errorText);

      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace para continuar." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(JSON.stringify({ error: `Erro ao processar imagem: ${aiResp.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiResp.json();
    const responseText = json?.choices?.[0]?.message?.content as string | undefined;

    if (!responseText) {
      return new Response(JSON.stringify({ error: "Resposta vazia da IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[extract-fiscal-document-data] AI response:", responseText);

    let extractedData: ExtractedData = {};
    try {
      let jsonString = responseText.trim();
      if (jsonString.startsWith("```")) {
        jsonString = jsonString.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      extractedData = JSON.parse(jsonString);
      
      if (extractedData.cnpj) {
        extractedData.cnpj = extractedData.cnpj.replace(/\D/g, '');
      }
      if (extractedData.cep) {
        extractedData.cep = extractedData.cep.replace(/\D/g, '');
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      return new Response(
        JSON.stringify({ error: "Não foi possível extrair dados da imagem. Tente com uma imagem mais clara." }),
        {
          status: 422,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[extract-fiscal-document-data] Extracted data:", extractedData);

    return new Response(JSON.stringify({ data: extractedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-fiscal-document-data error:", e);
    const corsHeaders = getCorsHeaders(req);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

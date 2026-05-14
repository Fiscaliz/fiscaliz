/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

type ExtractedData = {
  cnpj?: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  endereco?: string;
  bairro?: string;
  cep?: string;
  alvaraNumero?: string;
  alvaraValidade?: string;
  cnaePrincipal?: string;
  responsavelNome?: string;
};

async function verifyAuth(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return { userId: data.claims.sub as string };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT
    const authResult = await verifyAuth(req);
    if (authResult instanceof Response) return authResult;

    const { imageBase64 } = await req.json();
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return new Response(JSON.stringify({ error: "Imagem não fornecida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!imageBase64.startsWith('data:image/')) {
      return new Response(JSON.stringify({ error: "Formato de imagem inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (imageBase64.length > 7_000_000) {
      return new Response(JSON.stringify({ error: "Imagem muito grande (máx ~5MB)" }), {
        status: 413,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("[extract-alvara-data] Processing alvará image...");

    const systemPrompt = `Você é um especialista em extrair informações de documentos de Alvará Sanitário brasileiro.

Analise a imagem do alvará e extraia as seguintes informações:
- CNPJ (formato: XX.XXX.XXX/XXXX-XX)
- Razão Social (nome da empresa)
- Nome Fantasia (se disponível)
- Endereço completo (logradouro, número, complemento)
- Bairro
- CEP (formato: XXXXX-XXX)
- Número do Alvará
- Data de Validade do Alvará (formato: DD/MM/AAAA)
- CNAE Principal (código e descrição se disponível)
- Nome do Responsável Legal/Técnico

IMPORTANTE:
- Retorne APENAS os dados que você conseguir identificar claramente na imagem
- Se não conseguir identificar algum campo, deixe-o vazio
- Não invente dados
- Formate o CNPJ e CEP corretamente se encontrados`;

    const userPrompt = `Extraia os dados do alvará sanitário desta imagem e retorne em formato JSON com as seguintes chaves:
{
  "cnpj": "string ou null",
  "razaoSocial": "string ou null",
  "nomeFantasia": "string ou null",
  "endereco": "string ou null",
  "bairro": "string ou null",
  "cep": "string ou null",
  "alvaraNumero": "string ou null",
  "alvaraValidade": "string ou null",
  "cnaePrincipal": "string ou null",
  "responsavelNome": "string ou null"
}

Retorne APENAS o JSON, sem texto adicional.`;

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

      return new Response(JSON.stringify({ error: "Erro ao processar imagem" }), {
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

    console.log("[extract-alvara-data] AI response:", responseText);

    let extractedData: ExtractedData = {};
    try {
      let jsonString = responseText.trim();
      if (jsonString.startsWith("```")) {
        jsonString = jsonString.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      extractedData = JSON.parse(jsonString);
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

    console.log("[extract-alvara-data] Extracted data:", extractedData);

    return new Response(JSON.stringify({ data: extractedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-alvara-data error:", e);
    return new Response(JSON.stringify({ error: "Erro ao processar solicitação" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

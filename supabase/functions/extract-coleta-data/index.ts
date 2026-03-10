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
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authResult = await verifyAuth(req);
    if (authResult instanceof Response) return authResult;

    const { imagesBase64 } = await req.json();
    if (!imagesBase64 || !Array.isArray(imagesBase64) || imagesBase64.length === 0) {
      return new Response(JSON.stringify({ error: "Imagens não fornecidas" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("[extract-coleta-data] Processing", imagesBase64.length, "images...");

    const systemPrompt = `Você é um especialista em extrair informações de Termos de Coleta para Análise da Vigilância Sanitária brasileira.

Analise a(s) imagem(ns) do documento de coleta de amostra preenchido à mão e extraia TODOS os dados dos produtos coletados.

Para CADA produto encontrado no documento, extraia:
- nome: Nome/denominação do produto
- marca: Marca comercial
- natureza: Natureza do produto (ex: industrializado, artesanal, in natura)
- apresentacao: Apresentação/forma (ex: líquido, sólido, pó, cápsula)
- dataFabricacao: Data de fabricação (formato YYYY-MM-DD se possível)
- dataValidade: Data de validade (formato YYYY-MM-DD se possível)
- lote: Número do lote
- numeroRegistro: Número de registro no MS/ANVISA
- volumePeso: Volume ou peso (ex: "500g", "1L")
- temperatura: Temperatura no momento da coleta (ex: "8°C")
- fabricante: Nome do fabricante
- fabricanteCnpj: CNPJ do fabricante (apenas números)
- fabricanteEndereco: Endereço do fabricante
- fabricanteLocalidade: Localidade/distrito do fabricante
- fabricanteMunicipio: Município do fabricante
- fabricanteUf: UF do fabricante (sigla de 2 letras)
- fundamentacaoLegal: Fundamentação legal citada
- tipoAnalise: Tipo de análise (Análise Fiscal, Análise de Orientação, Análise de Controle, Análise Prévia, Análise de Contraprova)
- observacoes: Quaisquer observações adicionais

Também extraia:
- categoriaProduto: Categoria geral (ALIMENTO, MEDICAMENTO, CORRELATO, QUÍMICO, SANEANTE DOMISSANITÁRIO, OUTROS)
- involucros: Para cada produto, informações dos invólucros/amostras (número, lacre, unidades, destino: LABORATÓRIO ou CONTRA PROVA)

IMPORTANTE:
- Retorne APENAS os dados que conseguir identificar claramente
- Se não conseguir identificar algum campo, deixe como string vazia ""
- Não invente dados
- Datas devem ser no formato YYYY-MM-DD quando possível`;

    const userPrompt = `Extraia os dados do(s) produto(s) coletado(s) e retorne em formato JSON:
{
  "categoriaProduto": "ALIMENTO",
  "produtos": [
    {
      "nome": "",
      "marca": "",
      "natureza": "",
      "apresentacao": "",
      "dataFabricacao": "",
      "dataValidade": "",
      "lote": "",
      "numeroRegistro": "",
      "volumePeso": "",
      "temperatura": "",
      "fabricante": "",
      "fabricanteCnpj": "",
      "fabricanteEndereco": "",
      "fabricanteLocalidade": "",
      "fabricanteMunicipio": "",
      "fabricanteUf": "",
      "fundamentacaoLegal": "",
      "tipoAnalise": "",
      "observacoes": "",
      "involucros": [
        { "numero": "01", "lacreNumero": "", "unidades": "", "destino": "LABORATÓRIO" },
        { "numero": "02", "lacreNumero": "", "unidades": "", "destino": "" },
        { "numero": "03", "lacreNumero": "", "unidades": "", "destino": "CONTRA PROVA" }
      ]
    }
  ]
}

Retorne APENAS o JSON, sem texto adicional.`;

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
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              ...imageContent,
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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Erro ao processar imagem" }), {
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

    console.log("[extract-coleta-data] AI response:", responseText.substring(0, 500));

    let extractedData: any = {};
    try {
      let jsonString = responseText.trim();
      if (jsonString.startsWith("```")) {
        jsonString = jsonString.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
      }
      extractedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({ error: "Não foi possível extrair dados da imagem. Tente com uma imagem mais clara." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ data: extractedData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-coleta-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

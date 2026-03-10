/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");

type Body = {
  documentType: string;
  photos: string[]; // signed URLs from storage
  establishmentType?: string;
  description?: string; // for single photo re-analysis
  checklistItems?: string[]; // checklist items for contextual analysis
  targetLegislation?: string; // legislation focus override
  observation?: string; // custom observation to guide analysis
};

const SYSTEM_PROMPT = `Você é um auditor fiscal da Vigilância Sanitária experiente em inspeções de estabelecimentos alimentícios.

# TAREFA
Analise cada foto e produza uma legenda técnica descritiva para cada não conformidade visível.

# LEGISLAÇÃO BASE PADRÃO
Por padrão, utilize como referência:
- RDC 216/2004 (Boas Práticas para Serviços de Alimentação)
- Lei Municipal 8741/2008 (Código Sanitário de Goiânia)
Se o fiscal indicar outra legislação no campo "targetLegislation", priorize essa legislação na fundamentação.

# REGRAS DAS LEGENDAS
1. Descreva EXATAMENTE o que é visível — nunca generalize
2. Linguagem DESCRITIVA: diga O QUE está errado e ONDE (ex: "Piso com revestimento solto na cozinha")
3. PROIBIDO usar termos classificatórios genéricos como "perigo microbiológico", "perigo cruzado", "risco operacional"
4. Cite o dispositivo legal específico (item da RDC, artigo da Lei Municipal 8741/08, ou outra legislação indicada)
5. Máximo 80 caracteres — seja conciso e preciso
6. Cada legenda deve ser ÚNICA entre as fotos

# EXEMPLOS CORRETOS
✅ "Piso da área de manipulação com revestimento solto e rejunte deteriorado" (RDC 216/04 Item 4.1.3)
✅ "Caixas de papelão em contato direto com piso do depósito" (RDC 216/04 Item 4.7.6)
✅ "Ralo sem dispositivo de fechamento na cozinha" (RDC 216/04 Item 4.1.5)
✅ "Alvará sanitário vencido exposto no balcão" (LM 8741/08 Art. 81 Inc. XIX)
✅ "Produtos fracionados sem identificação de validade" (RDC 216/04 Item 4.8.18)

# EXEMPLOS ERRADOS (NÃO FAÇA)
❌ "Superfície com sujidade — perigo" (vago)
❌ "Armazenamento inadequado — perigo microbiológico" (genérico)

# FORMATO JSON (sem markdown):
{
  "nonConformities": [
    {
      "foto": 1,
      "description": "Legenda descritiva (máx 80 chars)",
      "severity": "grave",
      "legalBasis": "RDC 216/2004 - Item 4.1.3",
      "recommendation": "Ação corretiva",
      "deadline": "7 dias"
    }
  ],
  "generalObservations": "Síntese (máx 200 chars)",
  "confidence": 0.9
}`;

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

function validatePhotoUrls(photos: string[]): Response | null {
  if (!SUPABASE_URL) {
    // FAIL CLOSED
    return new Response(
      JSON.stringify({ error: "Service configuration error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (photos.length > 50) {
    return new Response(
      JSON.stringify({ error: "Maximum 50 photos per request" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const allowedOrigin = new URL(SUPABASE_URL).origin;

  for (const urlString of photos) {
    try {
      const url = new URL(urlString);
      if (url.protocol !== 'https:') {
        return new Response(
          JSON.stringify({ error: "Only HTTPS URLs allowed" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (url.origin !== allowedOrigin) {
        return new Response(
          JSON.stringify({ error: "URL de foto inválida. Apenas URLs do storage são permitidas." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (!url.pathname.startsWith('/storage/v1/object/')) {
        return new Response(
          JSON.stringify({ error: "Invalid storage path" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (_e) {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }
  return null;
}

serve(async (req) => {
  
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Verify JWT
    const authResult = await verifyAuth(req);
    if (authResult instanceof Response) return authResult;

    const { documentType, photos, establishmentType, description, checklistItems, targetLegislation, observation } = (await req.json()) as Body;
    if (!documentType || !Array.isArray(photos) || photos.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid payload: documentType and photos required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate photo URLs - prevent SSRF
    const urlError = validatePhotoUrls(photos);
    if (urlError) return urlError;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Special mode: suggest legal basis for user-edited description
    if (documentType === 'suggest_legal_basis' && description) {
      const suggestPrompt = `Você é um auditor fiscal da Vigilância Sanitária especializado em RDC 216/2004.

O fiscal identificou a seguinte não conformidade: "${description}"

Analise a foto e a descrição fornecida e retorne APENAS o item específico da RDC 216/2004 que melhor se aplica.

Consulte os itens:
- 4.1.x: Edificação e Instalações
- 4.2.x: Higienização
- 4.3.x: Controle de Pragas
- 4.4.x: Água
- 4.5.x: Resíduos
- 4.6.x: Manipuladores
- 4.7.x: Matérias-primas
- 4.8.x: Preparação
- 4.9.x: Armazenamento e Transporte
- 4.10.x: Exposição
- 4.11.x: Documentação

Retorne um JSON: {"item_rdc": "4.X.X", "justificativa": "breve explicação"}`;

      const suggestParts: any[] = [
        { type: "text", text: suggestPrompt },
        { type: "image_url", image_url: { url: photos[0] } }
      ];

      console.log(`[analyze-photos] Suggesting legal basis for description: ${description.substring(0, 50)}...`);

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: suggestParts }],
          temperature: 0.1,
        }),
      });

      if (!aiResp.ok) {
        const errorText = await aiResp.text();
        console.error("AI gateway error:", aiResp.status, errorText);
        return new Response(JSON.stringify({ error: `AI gateway error: ${aiResp.status}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const json = await aiResp.json();
      const rawText = (json?.choices?.[0]?.message?.content as string | undefined) || "";
      
      try {
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify({ 
            photoAnalysis: [{ foto: 1, item_rdc: result.item_rdc, legenda: description }],
            justificativa: result.justificativa,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } catch (parseError) {
        console.error("Failed to parse suggest response:", parseError);
      }
      
      return new Response(JSON.stringify({ photoAnalysis: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Process photos in batches of 5 to avoid timeouts with large sets
    const BATCH_SIZE = 5;
    const photoBatches: string[][] = [];
    const limitedPhotos = photos.slice(0, 50);
    for (let i = 0; i < limitedPhotos.length; i += BATCH_SIZE) {
      photoBatches.push(limitedPhotos.slice(i, i + BATCH_SIZE));
    }

    console.log(`[analyze-photos] Processing ${limitedPhotos.length} photos in ${photoBatches.length} batches of up to ${BATCH_SIZE}`);

    const allNonConformities: Array<{
      foto: number;
      description: string;
      severity: string;
      legalBasis: string;
      recommendation: string;
      deadline: string;
    }> = [];
    let generalObservations = "";
    let overallConfidence = 0;
    let batchesProcessed = 0;
    let timedOutBatches = 0;

    for (let batchIdx = 0; batchIdx < photoBatches.length; batchIdx++) {
      const batch = photoBatches[batchIdx];
      const startPhotoNum = batchIdx * BATCH_SIZE + 1;

      // Build checklist context if available (limit to 25 items to avoid oversized prompts)
      const limitedItems = checklistItems && checklistItems.length > 0 ? checklistItems.slice(0, 25) : [];
      const checklistContext = limitedItems.length > 0
        ? `\n\nCHECKLIST APLICADO (direcione a análise com base nestes itens):\n${limitedItems.map((item, i) => `${i + 1}. ${item}`).join('\n')}\n\nPRIORIZE não conformidades relacionadas ao checklist. Use a legislação citada quando aplicável.`
        : '';

      const legislationContext = targetLegislation && targetLegislation !== 'RDC 216/2004 + Lei Municipal 8741/2008'
        ? `\nLEGISLAÇÃO PRIORITÁRIA: ${targetLegislation}. Use preferencialmente os dispositivos desta legislação na fundamentação.`
        : '\nLEGISLAÇÃO BASE: RDC 216/2004 e Lei Municipal 8741/2008. Use dispositivos de ambas conforme aplicável.';

      const observationContext = observation
        ? `\nOBSERVAÇÃO DO FISCAL: ${observation}. Direcione a análise conforme esta orientação.`
        : '';

      const batchPrompt = `Analise ${batch.length} fotos de inspeção sanitária (numeradas ${startPhotoNum} a ${startPhotoNum + batch.length - 1})${establishmentType ? ` em ${establishmentType}` : ''}.
${legislationContext}${observationContext}${checklistContext}
IMPORTANTE: Para cada foto, escreva uma LEGENDA TÉCNICA DESCRITIVA do que está visível (máx 80 chars). Descreva O QUE está errado e ONDE, sem usar termos genéricos como "perigo microbiológico". Cite sempre o dispositivo legal específico (item da RDC, artigo da Lei Municipal 8741/08, ou da legislação indicada). Cada legenda deve ser única — não repita padrões entre fotos.

JSON sem markdown: {"nonConformities":[{"foto":N,"description":"legenda descritiva","severity":"grave","legalBasis":"Legislação - Dispositivo específico","recommendation":"ação corretiva","deadline":"prazo"}], "generalObservations":"", "confidence":0.9}`;

      const parts: any[] = [{ type: "text", text: batchPrompt }];
      for (const url of batch) {
        parts.push({ type: "image_url", image_url: { url } });
      }

      console.log(`[analyze-photos] Batch ${batchIdx + 1}/${photoBatches.length}: ${batch.length} photos (${startPhotoNum}-${startPhotoNum + batch.length - 1})`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: parts },
            ],
            temperature: 0.1,
            max_tokens: 2000,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!aiResp.ok) {
          const errorText = await aiResp.text();
          console.error(`[analyze-photos] Batch ${batchIdx + 1} AI error:`, aiResp.status, errorText);

          if (aiResp.status === 429) {
            return new Response(JSON.stringify({ error: "Rate limits exceeded. Tente novamente em instantes." }), {
              status: 429,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (aiResp.status === 402) {
            return new Response(
              JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace para continuar." }),
              { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
          // Skip this batch on other errors
          timedOutBatches++;
          continue;
        }

        const json = await aiResp.json();
        const rawText = (json?.choices?.[0]?.message?.content as string | undefined) || "";
        console.log(`[analyze-photos] Batch ${batchIdx + 1} response: ${rawText.substring(0, 300)}`);

        try {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.nonConformities) {
              allNonConformities.push(...parsed.nonConformities);
            }
            if (parsed.generalObservations) {
              generalObservations += (generalObservations ? "; " : "") + parsed.generalObservations;
            }
            overallConfidence += parsed.confidence || 0;
          }
        } catch (parseError) {
          console.error(`[analyze-photos] Batch ${batchIdx + 1} parse error:`, parseError);
        }
        batchesProcessed++;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.log(`[analyze-photos] Batch ${batchIdx + 1} timed out after 30s`);
          timedOutBatches++;
          continue;
        }
        throw fetchError;
      }
    }

    const photoAnalysis = allNonConformities.map(nc => ({
      foto: nc.foto,
      legenda: nc.description,
      item_rdc: (nc.legalBasis || '').replace('RDC 216/2004 - Item ', ''),
      severity: nc.severity,
      recommendation: nc.recommendation,
      deadline: nc.deadline,
    }));

    console.log(`[analyze-photos] Total: ${photoAnalysis.length} non-conformities from ${batchesProcessed} batches (${timedOutBatches} timed out)`);

    return new Response(JSON.stringify({ 
      photoAnalysis,
      analysisResult: {
        nonConformities: allNonConformities,
        generalObservations,
        confidence: batchesProcessed > 0 ? overallConfidence / batchesProcessed : 0,
      },
      timedOut: timedOutBatches === photoBatches.length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-photos error:", e);
    
    return new Response(JSON.stringify({ error: "Erro ao processar solicitação" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
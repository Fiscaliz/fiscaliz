/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const ALLOWED_URL_PREFIX = SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/` : null;

type Body = {
  documentType: string;
  photos: string[]; // public URLs
  establishmentType?: string;
  description?: string; // for single photo re-analysis
};

const SYSTEM_PROMPT = `Você é um auditor fiscal da Vigilância Sanitária de Goiânia, especializado em fiscalização de estabelecimentos de alimentação.

Analise as fotos fornecidas e identifique não conformidades baseadas EXCLUSIVAMENTE na RDC 216/2004.

# LEGISLAÇÃO BASE: RDC 216/2004

# 4.1 EDIFICAÇÃO E INSTALAÇÕES:
- Item 4.1.1: Edificação com fluxo ordenado; acesso controlado e independente
- Item 4.1.2: Dimensionamento compatível com operações; separação entre atividades
- Item 4.1.3: Piso, parede e teto devem ser lisos, impermeáveis, laváveis, íntegros (sem rachaduras, bolores, descascamentos)
- Item 4.1.4: Portas e janelas ajustadas aos batentes; portas com fechamento automático; telas milimétricas nas aberturas
- Item 4.1.5: Água corrente; ralos sifonados com dispositivo de fechamento
- Item 4.1.6: Caixas de gordura fora da área de preparação; dimensão compatível
- Item 4.1.7: Áreas livres de objetos em desuso; não permitida presença de animais
- Item 4.1.8: Iluminação adequada; luminárias protegidas contra explosão e quedas
- Item 4.1.9: Instalações elétricas embutidas ou protegidas
- Item 4.1.10: Ventilação adequada; fluxo de ar da área limpa para área suja
- Item 4.1.11: Equipamentos de climatização conservados e limpos
- Item 4.1.12: Sanitários sem comunicação direta com área de preparação; portas com fechamento automático
- Item 4.1.13: Lavatórios com produtos de higiene; coletores com tampa sem contato manual
- Item 4.1.14: Lavatórios exclusivos para higiene das mãos na área de manipulação
- Item 4.1.15: Equipamentos de materiais que não transmitam substâncias tóxicas; em bom estado
- Item 4.1.16: Manutenção programada de equipamentos; calibração de instrumentos
- Item 4.1.17: Superfícies lisas, impermeáveis, sem rugosidades ou frestas

# 4.2 HIGIENIZAÇÃO:
- Item 4.2.1: Instalações, equipamentos, móveis e utensílios em condições higiênico-sanitárias apropriadas
- Item 4.2.2: Caixas de gordura periodicamente limpas
- Item 4.2.3: Operações de limpeza registradas quando não rotineiras
- Item 4.2.4: Área de preparação higienizada; sem uso de substâncias odorizantes
- Item 4.2.5: Produtos saneantes regularizados e identificados
- Item 4.2.6: Utensílios de higienização próprios, conservados, guardados separadamente
- Item 4.2.7: Funcionários de limpeza sanitária com uniformes diferenciados

# 4.3 CONTROLE DE PRAGAS:
- Item 4.3.1: Edificação livre de vetores e pragas urbanas
- Item 4.3.2: Controle químico por empresa especializada quando necessário
- Item 4.3.3: Procedimentos pré e pós-tratamento para evitar contaminação

# 4.4 ÁGUA:
- Item 4.4.1: Uso exclusivo de água potável; solução alternativa com laudos semestrais
- Item 4.4.2: Gelo fabricado com água potável
- Item 4.4.3: Vapor de água potável
- Item 4.4.4: Reservatório de água íntegro, tampado, limpo, higienizado a cada 6 meses

# 4.5 RESÍDUOS:
- Item 4.5.1: Recipientes identificados, íntegros, em número suficiente
- Item 4.5.2: Coletores com tampas acionadas sem contato manual
- Item 4.5.3: Resíduos coletados frequentemente; estocados em local fechado e isolado

# 4.6 MANIPULADORES:
- Item 4.6.1: Controle de saúde registrado conforme legislação
- Item 4.6.2: Manipuladores com lesões/sintomas afastados
- Item 4.6.3: Uniformes limpos e conservados; uso exclusivo nas dependências internas
- Item 4.6.4: Lavagem cuidadosa das mãos; cartazes de orientação afixados
- Item 4.6.5: Proibido fumar, comer, manipular dinheiro durante atividades
- Item 4.6.6: Cabelos presos e protegidos; unhas curtas e sem esmalte; sem adornos
- Item 4.6.7: Manipuladores capacitados periodicamente
- Item 4.6.8: Visitantes com requisitos de higiene

# 4.7 MATÉRIAS-PRIMAS:
- Item 4.7.1: Critérios para avaliação de fornecedores
- Item 4.7.2: Recepção em área protegida e limpa
- Item 4.7.3: Inspeção e aprovação na recepção; embalagens íntegras; temperatura verificada
- Item 4.7.4: Lotes reprovados ou vencidos identificados e separados
- Item 4.7.5: Armazenamento em local limpo e organizado; identificado; prazo de validade respeitado
- Item 4.7.6: Armazenamento sobre paletes, estrados ou prateleiras; espaçamento para ventilação

# 4.8 PREPARAÇÃO:
- Item 4.8.1: Lavagem cuidadosa das matérias-primas
- Item 4.8.2: Ingredientes para alimentos crus devem ser submetidos a tratamento
- Item 4.8.3: Evitar contaminação cruzada; evitar contato entre alimentos crus e prontos
- Item 4.8.4: Contaminantes físicos, químicos e biológicos controlados
- Item 4.8.5: Ambiente climatizado para fracionamento de perecíveis
- Item 4.8.6: Alimentos fracionados identificados
- Item 4.8.7: Produtos perecíveis expostos apenas pelo tempo mínimo necessário
- Item 4.8.8: Tratamento térmico mínimo de 70ºC em todas as partes do alimento
- Item 4.8.9: Eficácia do tratamento térmico avaliada
- Item 4.8.10: Fritura com controles de contaminação química
- Item 4.8.11: Óleo de fritura não superior a 180ºC; substituição imediata quando alterado
- Item 4.8.12: Descongelamento antes do tratamento térmico
- Item 4.8.13: Descongelamento sob refrigeração (<5ºC) ou micro-ondas
- Item 4.8.14: Alimentos descongelados não podem ser recongelados
- Item 4.8.15: Alimentos quentes acima de 60ºC por no máximo 6 horas
- Item 4.8.16: Resfriamento de 60ºC a 10ºC em até 2 horas; conservação <5ºC ou congelado ≤-18ºC
- Item 4.8.17: Prazo máximo de 5 dias sob refrigeração a 4ºC
- Item 4.8.18: Alimentos armazenados identificados (designação, data, prazo)
- Item 4.8.19: Alimentos crus higienizados; produtos regularizados
- Item 4.8.20: Controle e garantia da qualidade documentados

# 4.9 ARMAZENAMENTO E TRANSPORTE:
- Item 4.9.1: Alimentos preparados identificados e protegidos
- Item 4.9.2: Transporte em condições de tempo e temperatura adequadas
- Item 4.9.3: Veículos higienizados; cobertura; sem outras cargas contaminantes

# 4.10 EXPOSIÇÃO:
- Item 4.10.1: Áreas de exposição organizadas e em condições higiênicas
- Item 4.10.2: Procedimentos para minimizar contaminação; antissepsia das mãos
- Item 4.10.3: Equipamentos de exposição com temperaturas controladas
- Item 4.10.4: Barreiras de proteção que previnam contaminação pelo consumidor
- Item 4.10.5: Utensílios descartáveis ou higienizados; armazenados protegidos
- Item 4.10.6: Ornamentos e plantas não devem contaminar alimentos
- Item 4.10.7: Área de pagamento reservada; funcionários não manipulam alimentos

# 4.11 DOCUMENTAÇÃO:
- Item 4.11.1: Manual de Boas Práticas e POPs disponíveis
- Item 4.11.2: POPs com instruções sequenciais, responsáveis identificados
- Item 4.11.3: Registros mantidos por 30 dias
- Item 4.11.4-8: POPs específicos para higienização, controle de pragas, reservatório, saúde

# INSTRUÇÕES:
1. Analise CADA foto cuidadosamente
2. Identifique não conformidades VISÍVEIS nas fotos
3. Para cada não conformidade, forneça:
   - Descrição clara e objetiva do problema (máx 60 caracteres)
   - Gravidade (leve, média, grave, gravíssima)
   - Base legal ESPECÍFICA (RDC 216/2004 - Item X.X.X)
   - Recomendação de ação corretiva
   - Prazo sugerido (imediato, 7 dias, 30 dias, 60 dias)
4. Classifique a gravidade conforme:
   - Leve: Não conformidade que não representa risco imediato à saúde
   - Média: Não conformidade que pode representar risco à saúde se não corrigida
   - Grave: Não conformidade que representa risco à saúde
   - Gravíssima: Não conformidade que representa risco iminente à saúde
5. Seja ESPECÍFICO e TÉCNICO
6. Use linguagem FORMAL e PROFISSIONAL
7. Cite SEMPRE o item específico da RDC 216/2004
8. NÃO invente não conformidades que não estão visíveis nas fotos
9. Se não houver não conformidades visíveis, retorne array vazio

# FORMATO DE RESPOSTA (JSON):
{
  "nonConformities": [
    {
      "foto": 1,
      "description": "Descrição curta da não conformidade (máx 60 chars)",
      "severity": "grave",
      "legalBasis": "RDC 216/2004 - Item 4.1.3",
      "recommendation": "Ação corretiva específica e prática",
      "deadline": "7 dias"
    }
  ],
  "generalObservations": "Observações gerais sobre o estabelecimento (máximo 200 caracteres)",
  "confidence": 0.92
}`;

function validatePhotoUrls(photos: string[], corsHeaders: Record<string, string>): Response | null {
  if (!ALLOWED_URL_PREFIX) {
    console.warn("[analyze-photos] SUPABASE_URL not configured, skipping URL validation");
    return null;
  }
  for (const url of photos) {
    if (!url.startsWith(ALLOWED_URL_PREFIX)) {
      return new Response(
        JSON.stringify({ error: "URL de foto inválida. Apenas URLs do storage são permitidas." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }
  return null;
}

serve(async (req) => {
  
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { documentType, photos, establishmentType, description } = (await req.json()) as Body;
    if (!documentType || !Array.isArray(photos) || photos.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid payload: documentType and photos required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate photo URLs - prevent SSRF
    const urlError = validatePhotoUrls(photos, corsHeaders);
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

Retorne um JSON: {\"item_rdc\": \"4.X.X\", \"justificativa\": \"breve explicação\"}`;

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

      const batchPrompt = `${batch.length} fotos de fiscalização (fotos ${startPhotoNum} a ${startPhotoNum + batch.length - 1})${establishmentType ? ` (${establishmentType})` : ''}.

Para CADA foto, retorne: foto (use números ${startPhotoNum}-${startPhotoNum + batch.length - 1}), description (máx 50 chars ou vazio), severity, legalBasis (RDC 216/2004), recommendation, deadline.

JSON: {"nonConformities":[...], "generalObservations":"", "confidence":0.9}
Sem markdown.`;

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
    
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

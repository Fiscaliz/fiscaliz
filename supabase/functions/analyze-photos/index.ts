/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Body = {
  documentType: string;
  photos: string[]; // public URLs
  establishmentType?: string;
};

const LEGISLATION_BASE = `
BASE LEGAL - LEGISLAÇÕES SANITÁRIAS:

1. RDC 216/2004 - ANVISA (Boas Práticas para Serviços de Alimentação)
- 4.1.1 - Área externa livre de focos de insalubridade, lixo acumulado, água estagnada
- 4.1.2 - Acesso direto e independente, não comum a residências
- 4.1.3 - Pisos de material liso, resistente, impermeável, lavável, antiderrapante
- 4.1.4 - Portas com fechamento automático; aberturas externas com telas milimétricas
- 4.1.5 - Ralos/grelhas com dispositivo de fechamento
- 4.1.6 - Caixas de gordura compatíveis, limpas e conservadas
- 4.1.7 - Móveis e utensílios estranhos à atividade; áreas internas livres de animais
- 4.1.8 - Iluminação adequada, luminárias protegidas
- 4.1.9 - Instalações elétricas protegidas; tomadas com espelho
- 4.1.10 - Ventilação adequada, sem incidência direta sobre alimentos
- 4.1.12 - Sanitários separados por sexo, não se comunicam com área de produção
- 4.1.14 - Lavatórios exclusivos para higiene das mãos na área de manipulação
- 4.1.15 - Superfícies de material liso, impermeável e resistente
- 4.1.16 - Troca das velas dos filtros de água e máquinas de gelo
- 4.1.17 - Equipamentos de material liso, impermeável e em bom estado
- 4.2.1 - Operações de limpeza e desinfecção validadas e registradas
- 4.2.2 - Limpeza e conservação de caixas de gordura
- 4.2.6 - Produtos de limpeza guardados em DML
- 4.3.2 - Comprovante de controle integrado de pragas
- 4.3.6 - Produtos e utensílios de limpeza guardados em local reservado
- 4.4.4 - Higienização da caixa d'água a cada seis meses
- 4.5.1 - Lixeiras com tampa acionada por pedal
- 4.5.3 - Local adequado para armazenamento externo do lixo
- 4.6 - Cartazes orientativos sobre lavagem das mãos
- 4.6.5 - Uniformes limpos, de cor clara, proteção de cabelo
- 4.6.6 - Objetos pessoais guardados em armários
- 4.6.7 - Capacitação em boas práticas (comprovante de treinamento)
- 4.7 - Nota fiscal das matérias-primas e relação dos fornecedores
- 4.7.3 - Planilhas de controle de temperatura
- 4.7.4 - Controle de validade dos produtos
- 4.7.5 - Armazenamento correto e identificado
- 4.8.3 - Alimentos crus separados de cozidos
- 4.8.5 - Sala climatizada (≤18°C) para fatiamento; produtos perecíveis fora de risco térmico
- 4.8.6 - Produtos fracionados identificados
- 4.8.9 - Hortaliças sanitizadas com hipoclorito
- 4.8.11 - Trocar óleo de fritura sempre que alterado
- 4.8.13 - Descongelamento sob refrigeração ou micro-ondas
- 4.8.16 - Alimentos quentes acima de 60°C e frios abaixo de 5°C
- 4.8.17 - Prazo máximo de 5 dias sob refrigeração
- 4.8.18 - Identificação do alimento preparado
- 4.9.1 - Identificação do alimento preparado
- 4.9.2 - Transporte em caixas térmicas
- 4.10.4 - Exposição protegida contra contaminação
- 4.10.7 - Funcionários do caixa não manipulam alimentos
- 4.11.1 - Manual de Boas Práticas disponível
- 4.11.6 - Comprovante de controle integrado de pragas
- 4.11.7 - Comprovante de higienização da caixa d'água

2. Lei Municipal 8741/2008 - Código Sanitário de Goiânia
Art. 81 - Infrações Sanitárias:
- Inc. IV - Produto fora do prazo de validade (casar com Art. 82 e alínea correspondente)
- Inc. X - Falsificar, adulterar, fraudar ou alterar produto alimentício
- Inc. XI - Expor ou vender produto impróprio para consumo
- Inc. XII - Expor ou vender produto com registro cancelado
- Inc. XVI - Descumprir normas legais ou regulamentares
- Inc. XVIII - Deixar de apresentar documentação obrigatória
- Inc. XIX - Descumprir normas de boas práticas de fabricação (ASSOCIAR SEMPRE com RDC 216/04)

Art. 82 - Quantificação de Penalidades:
- As penalidades são classificadas por gravidade e associadas às alíneas correspondentes

3. Portaria SMS 64/2023 (Municipal)
- Projeto Arquitetônico Sanitário (PAS) e Memorial Descritivo Sanitário (MDS)

4. Portaria 1288/1995
- Art. 7º inc. I e II - Piso, paredes e teto lisos, impermeáveis, laváveis
- Art. 7º inc. III - Sanitários separados da produção
- Art. 7º inc. IX - Pias com água corrente e sabão
- Art. 10 inc. II e III - Requisitos de acabamento

5. Portaria GM/MS 888/2021 (Potabilidade da Água)
- Padrão de potabilidade; fonte alternativa deve ter laudo laboratorial
- Poço artesiano deve ser outorgado pela SEMAD

6. Lei 14.026/2020 (Marco Legal do Saneamento)
- Art. 81, inc. III - Certificado de vistoria do veículo de transporte

7. Lei Estadual 20.498/2019 + Portaria CBMGO 03/2023
- Certificado do Corpo de Bombeiros

8. RDC 727/2022 - Rotulagem de Alimentos
- Produtos embalados com rótulo completo

9. Lei 8078/1990 - Código de Defesa do Consumidor
- Art. 81 incisos I a VI - Proibições

10. Lei 8217/2008 - Alvará Sanitário Municipal
- Obrigatoriedade de Alvará de Autorização Sanitária

REGRA FUNDAMENTAL: 
- SEMPRE associar RDC 216/2004 com LM 8741/08 Art. 81 Inc. XIX.
- Para produtos vencidos, usar LM 8741/08 Art. 81 Inc. IV casado com Art. 82 e alínea correspondente.
- Atentar para art. 81 inc. IV, X, XI, XII, XVI e XVIII que devem ser casados com art. 82.
`;

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  termo_intimacao: 'Termo de Intimação',
  visita_fiscal: 'Visita Fiscal',
  auto_infracao: 'Auto de Infração',
  advertencia: 'Advertência',
  inutilizacao: 'Inutilização',
  apreensao: 'Apreensão',
  interdicao: 'Interdição',
  relatorio_tecnico: 'Relatório Técnico',
  notificacao: 'Notificação',
  replica: 'Réplica',
  certidao: 'Certidão',
  coleta_amostra: 'Coleta de Amostra',
};

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

    const { documentType, photos, establishmentType } = (await req.json()) as Body;
    if (!documentType || !Array.isArray(photos) || photos.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid payload: documentType and photos required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const docLabel = DOCUMENT_TYPE_LABELS[documentType] || documentType;

    const systemPrompt = `Você é um auditor fiscal de Vigilância Sanitária.
Sua função é analisar fotos e identificar irregularidades com base na RDC 216/2004.

INSTRUÇÕES:
1. Para CADA foto, identifique irregularidades VISÍVEIS
2. Retorne um JSON com array de objetos, um por foto (na ordem enviada)
3. Cada objeto deve ter:
   - "foto": número da foto (1, 2, 3...)
   - "legenda": descrição curta da irregularidade (máx 60 caracteres)
   - "item_rdc": item específico da RDC 216/04 (ex: "4.1.3", "4.8.16")
4. Se não houver irregularidade visível na foto, retorne legenda vazia

EXEMPLO DE RESPOSTA:
[
  {"foto": 1, "legenda": "Piso danificado com rachaduras", "item_rdc": "4.1.3"},
  {"foto": 2, "legenda": "Alimento exposto sem proteção", "item_rdc": "4.10.4"},
  {"foto": 3, "legenda": "", "item_rdc": ""}
]

Seja DIRETO e OBJETIVO. Legendas curtas, apenas o essencial.`;

    const userPrompt = `Analise ${photos.length} fotos de fiscalização sanitária.
Retorne APENAS um array JSON com uma entrada para cada foto, na ordem.
Cada entrada deve ter: foto (número), legenda (curta, máx 60 chars), item_rdc (da RDC 216/04).
Se a foto não mostrar irregularidade clara, retorne legenda e item_rdc vazios.`;

    const parts: any[] = [{ type: "text", text: userPrompt }];
    for (const url of photos.slice(0, 50)) {
      parts.push({ type: "image_url", image_url: { url } });
    }

    console.log(`[analyze-photos] Analyzing ${photos.length} photos for document type: ${documentType}`);

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
          { role: "user", content: parts },
        ],
        temperature: 0.2,
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
          },
        );
      }

      return new Response(JSON.stringify({ error: `AI gateway error: ${aiResp.status}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiResp.json();
    const rawText = (json?.choices?.[0]?.message?.content as string | undefined) || "";

    console.log(`[analyze-photos] Raw response: ${rawText.substring(0, 500)}`);

    // Try to parse as JSON array
    let photoAnalysis: Array<{ foto: number; legenda: string; item_rdc: string }> = [];
    try {
      // Extract JSON from possible markdown code blocks
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        photoAnalysis = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Fallback: return raw text for backward compatibility
      return new Response(JSON.stringify({ text: rawText, photoAnalysis: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[analyze-photos] Parsed ${photoAnalysis.length} photo analyses`);

    return new Response(JSON.stringify({ 
      text: rawText, 
      photoAnalysis 
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

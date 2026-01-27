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
- 4.1.3 - Aberturas com telas milimétricas (portas, janelas, exaustores)
- 4.1.4 - Portas com fechamento automático (mola ou similar)
- 4.1.5 - Pisos de material liso, resistente, impermeável, lavável, antiderrapante
- 4.1.6 - Paredes de material liso, resistente, impermeável, lavável, cor clara
- 4.1.7 - Tetos de material liso, resistente, impermeável, lavável, cor clara
- 4.1.8 - Iluminação adequada, sem ofuscamento, sem sombras
- 4.1.9 - Luminárias com proteção contra explosão e quedas
- 4.1.10 - Ventilação adequada, sem correntes de ar sobre alimentos
- 4.1.11 - Instalações sanitárias separadas por sexo, não se comunicam com área de produção
- 4.1.12 - Lavatórios exclusivos para higiene das mãos na área de manipulação
- 4.1.13 - Produtos de higienização regularizados pelo Ministério da Saúde
- 4.2.1 - Operações de limpeza e desinfecção validadas e registradas
- 4.3.1 - Ações preventivas e corretivas para controle de pragas
- 4.4.1 - Água potável para manipulação de alimentos
- 4.4.2 - Reservatório de água limpo, higienizado semestralmente
- 4.5.1 - Lixeiras com tampa acionada por pedal
- 4.6.2 - Uniformes limpos, de cor clara, completos (calça, camisa, avental, touca, sapato fechado)
- 4.6.3 - Asseio pessoal (unhas curtas, sem esmalte, sem adornos, barba feita)
- 4.6.5 - Capacitação em boas práticas (comprovante de treinamento)
- 4.7.2 - Armazenamento: separado por categorias, sobre estrados, distante de paredes
- 4.7.3 - Produtos vencidos ou impróprios descartados imediatamente
- 4.8.1 - Alimentos crus separados de cozidos
- 4.8.3 - Tratamento térmico adequado (75°C no centro do alimento)
- 4.9.1 - Alimentos quentes mantidos acima de 60°C
- 4.9.2 - Alimentos frios mantidos abaixo de 5°C
- 4.10.2 - Proteção contra contaminação (barreiras físicas, embalagens)
- 4.11.1 - Manual de Boas Práticas disponível
- 4.11.2 - Procedimentos Operacionais Padronizados (POPs) implementados

2. RDC 44/2009 - ANVISA (Boas Práticas Farmacêuticas)
- Art. 3º - Responsável técnico presente durante horário de funcionamento
- Art. 4º - Área de dispensação separada de outras atividades
- Art. 5º - Medicamentos armazenados em condições adequadas (temperatura, umidade)
- Art. 6º - Medicamentos controlados em área restrita (Portaria 344/98)
- Art. 7º - Escrituração de medicamentos controlados (SNGPC)
- Art. 8º - Produtos vencidos ou impróprios segregados e identificados

3. Portaria 2.914/2011 - Ministério da Saúde (Potabilidade da Água)
- Art. 5º - Padrão de potabilidade (ausência de E. coli, coliformes totais)
- Art. 11º - Reservatório de água limpo, tampado, higienizado
- Art. 13º - Análise laboratorial da água (semestral)

4. Lei Municipal 9.532/2019 - Goiânia (Código Sanitário)
- Art. 45 - Alvará sanitário obrigatório
- Art. 46 - Licença sanitária renovada anualmente
- Art. 47 - Responsável técnico com registro ativo no conselho de classe
- Art. 48 - Estabelecimento em conformidade com projeto aprovado
- Art. 49 - Documentação disponível para fiscalização

5. Portaria 344/98 - SVS/MS (Medicamentos Controlados)
- Art. 35 - Livro de registro de medicamentos controlados (SNGPC)
- Art. 36 - Armazenamento em local seguro (armário trancado)
- Art. 37 - Balanço mensal de estoque
- Art. 38 - Notificação de Receita arquivada por 2 anos

6. RDC 50/2002 - ANVISA (Estabelecimentos de Saúde)
- Item 4.1 - Área física adequada (mínimo 1m²/leito)
- Item 4.2 - Instalações hidráulicas e elétricas em conformidade
- Item 4.3 - Lavatórios com acionamento sem uso das mãos
- Item 4.4 - Sala de procedimentos com pia exclusiva
- Item 4.5 - Resíduos de saúde segregados (Grupo A, B, C, D, E)
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

    const systemPrompt = `Você é um auditor fiscal especializado em Vigilância Sanitária do Município de Goiânia/GO.
Sua função é analisar fotos de estabelecimentos e identificar não conformidades sanitárias com base nas seguintes legislações:

${LEGISLATION_BASE}

INSTRUÇÕES DE ANÁLISE:
1. Analise CUIDADOSAMENTE cada foto fornecida
2. Identifique APENAS não conformidades que você pode VER claramente nas fotos
3. NÃO invente ou assuma não conformidades que não estão visíveis
4. Seja ESPECÍFICO e TÉCNICO nas descrições
5. Use linguagem formal, imperativa (ex: "Adequar", "Providenciar", "Corrigir", "Manter")
6. Sempre cite a base legal específica (ex: "RDC 216/2004 - Item 4.1.3")

CRITÉRIOS DE GRAVIDADE:
- Leve: Não conformidades que não oferecem risco imediato à saúde
- Média: Não conformidades que podem oferecer risco se não corrigidas
- Grave: Não conformidades que oferecem risco significativo à saúde
- Gravíssima: Não conformidades que oferecem risco iminente à saúde

Se NÃO identificar nenhuma não conformidade, retorne: "Não foram identificadas irregularidades nas fotos analisadas."

Gere o texto em português do Brasil, objetivo, em tom imperativo, pronto para inserção em documento fiscal.`;

    const userPrompt = `Analise as fotos de uma fiscalização e produza o conteúdo para um documento do tipo: ${docLabel}.
${establishmentType ? `Tipo de estabelecimento: ${establishmentType}` : ''}

Saída desejada:
1) Uma lista numerada de irregularidades/achados encontrados nas fotos.
2) Para cada item, inclua:
   - Descrição clara e objetiva do problema
   - Base legal (legislação específica)
   - Recomendação de adequação em linguagem imperativa
3) Se não for possível identificar algo com segurança, diga "Não foi possível confirmar nas fotos".

NÃO invente dados como CNPJ, endereço ou nomes de pessoas.
O fiscal poderá EDITAR todas as sugestões antes de gerar o documento final.`;

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
    const text = (json?.choices?.[0]?.message?.content as string | undefined) || "";

    console.log(`[analyze-photos] Analysis complete. Response length: ${text.length}`);

    return new Response(JSON.stringify({ text }), {
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

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LEGISLATION_CONTEXT = `
Você é um assistente jurídico especializado em Vigilância Sanitária do município de Goiânia-GO.
Sua função é responder perguntas sobre legislação sanitária com base no compêndio de leis abaixo.
Seja preciso, cite os dispositivos legais e artigos quando possível, e responda em português.

## COMPÊNDIO DE LEGISLAÇÃO SANITÁRIA

### LEGISLAÇÃO FEDERAL - ANVISA
- **RDC 216/2004** - Boas Práticas para Serviços de Alimentação: Regulamento Técnico de Boas Práticas para Serviços de Alimentação. Norma principal para restaurantes, lanchonetes, cozinhas industriais, padarias e similares.
- **RDC 275/2002** - Boas Práticas de Fabricação (Indústria): Regulamento Técnico de POPs aplicados a Estabelecimentos Produtores/Industrializadores de Alimentos.
- **RDC 267/2003** - Gelados Comestíveis: BPF para Estabelecimentos Industrializadores de Gelados Comestíveis (sorvetes, picolés).
- **RDC 727/2022** - Rotulagem de Alimentos: Regulamento Técnico de Rotulagem de Alimentos Embalados.
- **IN 75/2020** - Rotulagem Nutricional: Instrução Normativa sobre Rotulagem Nutricional de Alimentos Embalados.
- **RDC 259/2002** - Rotulagem Geral: Regulamento Técnico sobre Rotulagem de Alimentos Embalados.
- **RDC 843/2024** - Suplementos Alimentares: Requisitos para Comunicado de Início de Fabricação e Notificação.
- **RDC 656/2022** - Alimentos em Eventos: Boas Práticas para Manipulação de Alimentos em Eventos de Massa e Locais Públicos.
- **RDC 44/2009** - Farmácias e Drogarias: Boas Práticas Farmacêuticas para controle sanitário.
- **RDC 50/2002** - Estabelecimentos de Saúde: Regulamento para projetos físicos de estabelecimentos assistenciais de saúde.
- **RDC 222/2018** - Resíduos de Serviços de Saúde: Boas Práticas de Gerenciamento dos Resíduos.
- **RDC 56/2008** - Estabelecimentos de Beleza: BPF para Serviços de Estética e Embelezamento.
- **RDC 15/2012** - CME: Requisitos de boas práticas para processamento de produtos para saúde.
- **RDC 07/2015** - Cosméticos: Requisitos técnicos para regularização de cosméticos e perfumes.
- **Portaria 344/1998** - Substâncias Controladas: Regulamento sobre substâncias e medicamentos sujeitos a controle especial.
- **Portaria 888/2021** - Qualidade da Água: Procedimentos de controle e vigilância da qualidade da água para consumo humano.
- **Portaria 1288/1995** - Instalações de Alimentação: Requisitos de instalações para estabelecimentos de alimentos.
- **NR 32** - Segurança em Serviços de Saúde: Segurança e saúde no trabalho em serviços de saúde.
- **Lei 14.026/2020** - Marco Legal do Saneamento: Atualiza o marco legal do saneamento básico.
- **Lei 8078/1990** - Código de Defesa do Consumidor.
- **Lei Federal 6437/1977** - Infrações à legislação sanitária federal: Configura infrações à legislação sanitária federal, estabelece as sanções respectivas.

### LEGISLAÇÃO ESTADUAL - GOIÁS
- **Lei Estadual 16.140/2007** - Código de Saúde do Estado de Goiás: Vigilância Sanitária estadual.
- **Lei Estadual 20.498/2019** - Normas de Segurança Contra Incêndio: Código Estadual de Segurança Contra Incêndio e Pânico.
- **Portaria CBMGO 03/2023** - Certificado do Corpo de Bombeiros: Requisitos para emissão de certificado de vistoria.

### LEGISLAÇÃO MUNICIPAL - GOIÂNIA
- **Lei 8741/2008** - Código Sanitário de Goiânia: Código Sanitário do Município de Goiânia - Vigilância Sanitária. Norma base municipal.
  - **Art. 81** - Infrações Sanitárias: Define infrações e penalidades sanitárias.
  - **Art. 82** - Quantificação de Penalidades: Classificação e quantificação das penalidades por gravidade.
- **Lei 8217/2008** - Alvará Sanitário Municipal: Concessão de Alvará de Autorização Sanitária.
- **LM 8887/2010** - Controle de Vetores (Dengue): Medidas de prevenção e controle da dengue em Goiânia.
- **LM 9631/2015** - Combate à Dengue: Obrigatoriedade de adoção de medidas para combate à dengue.
- **LM 9731/2015** - Dengue (Medidas Complementares): Medidas complementares de combate à dengue.
- **LM 9904/2016** - Arboviroses: Prevenção e controle de arboviroses (dengue, zika, chikungunya).
- **Portaria SMS 64/2023** - Projeto Arquitetônico Sanitário: Requisitos para PAS e MDS de estabelecimentos de interesse à saúde.
- **Decreto 506/2016** - Regulamentação Sanitária: Regulamenta disposições do Código Sanitário Municipal.

### PORTARIAS E NORMAS DE REFERÊNCIA
- **Portaria SMS-G n°2619/11 (São Paulo)** - Adaptada à legislação municipal para restaurantes por análise de risco. Classificação: I-Imprescindível, N-Necessário, R-Recomendável.

### TIPOS DE DOCUMENTOS FISCAIS
1. **Termo de Intimação** - Exige prazo de 1 a 45 dias para adequação. Base legal: Lei 8741/08.
2. **Visita Fiscal** - Documento informativo, sem prazo. Inclui vistoria de dengue obrigatória.
3. **Auto de Infração** - Lavrado quando há infração sanitária comprovada. Exige fotos.
4. **Advertência** - Penalidade mais branda para infrações leves.
5. **Inutilização** - Para alimentos impróprios ao consumo. Calcula peso total.
6. **Apreensão** - Recolhimento de produtos com lacres. Destino: sede da Vigilância.
7. **Interdição** - Parcial ou total. Total exige número de O.S. 
8. **Relatório Técnico** - Documento analítico sem numeração sequencial.
9. **Notificação** - Comunicação formal ao estabelecimento.
10. **Réplica** - Análise ponto a ponto da defesa do autuado.
11. **Certidão** - Documento certificatório.
12. **Coleta de Amostra** - Termo de coleta para análise laboratorial.

### PENALIDADES (Lei 8741/08)
- Advertência
- Multa (calculada em UVF - Unidade de Valor Fiscal)
- Apreensão de produto
- Inutilização de produto
- Interdição parcial ou total
- Cancelamento de alvará sanitário
- Proibição de propaganda

Ao responder, sempre:
1. Cite o dispositivo legal específico (ex: "conforme RDC 216/2004, item 4.1.3")
2. Explique de forma prática e acessível
3. Se não tiver certeza sobre um artigo específico, informe ao fiscal
4. Quando pertinente, sugira qual documento fiscal seria adequado para a situação
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Messages array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Consulting legislation AI with', messages.length, 'messages');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: LEGISLATION_CONTEXT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Limite de requisições excedido. Tente novamente em alguns instantes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Créditos de IA esgotados. Adicione créditos ao workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Erro no serviço de IA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Streaming AI response');
    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    console.error('Legislation consultation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Checklists pré-atestados por tipo de estabelecimento
// Baseado na legislação sanitária vigente
// TEXTO EM IMPERATIVO - para adequação das não conformidades

// ============= BANCO DE LEGISLAÇÕES =============
export interface LegislationReference {
  code: string;
  name: string;
  description: string;
  scope: string; // 'federal' | 'estadual' | 'municipal'
  category: string;
}

export const legislationDatabase: LegislationReference[] = [
  // Legislação Estadual
  { 
    code: 'Lei Estadual 16.140/2007', 
    name: 'Código de Saúde do Estado de Goiás',
    description: 'Código de Saúde do Estado de Goiás - Vigilância Sanitária',
    scope: 'estadual',
    category: 'Geral'
  },
  
  // Legislação Federal - ANVISA
  { 
    code: 'RDC 275/2002', 
    name: 'Boas Práticas de Fabricação - Indústria',
    description: 'Regulamento Técnico de Procedimentos Operacionais Padronizados aplicados aos Estabelecimentos Produtores/Industrializadores de Alimentos',
    scope: 'federal',
    category: 'Indústria'
  },
  { 
    code: 'RDC 267/2003', 
    name: 'Gelados Comestíveis',
    description: 'Regulamento Técnico de Boas Práticas de Fabricação para Estabelecimentos Industrializadores de Gelados Comestíveis',
    scope: 'federal',
    category: 'Gelados'
  },
  { 
    code: 'RDC 727/2022', 
    name: 'Rotulagem de Alimentos',
    description: 'Regulamento Técnico de Rotulagem de Alimentos Embalados',
    scope: 'federal',
    category: 'Rotulagem'
  },
  { 
    code: 'IN 75/2020', 
    name: 'Rotulagem Nutricional',
    description: 'Instrução Normativa sobre Rotulagem Nutricional de Alimentos Embalados',
    scope: 'federal',
    category: 'Rotulagem'
  },
  { 
    code: 'RDC 843/2024', 
    name: 'Suplementos Alimentares',
    description: 'Requisitos para Comunicado de Início de Fabricação e Notificação de Suplementos Alimentares',
    scope: 'federal',
    category: 'Suplementos'
  },
  { 
    code: 'RDC 216/2004', 
    name: 'Boas Práticas para Serviços de Alimentação',
    description: 'Regulamento Técnico de Boas Práticas para Serviços de Alimentação',
    scope: 'federal',
    category: 'Alimentos'
  },
  { 
    code: 'RDC 656/2022', 
    name: 'Alimentos em Eventos',
    description: 'Boas Práticas para Manipulação de Alimentos em Eventos de Massa e Locais Públicos',
    scope: 'federal',
    category: 'Eventos'
  },
  { 
    code: 'RDC 44/2009', 
    name: 'Farmácias e Drogarias',
    description: 'Boas Práticas Farmacêuticas para o controle sanitário do funcionamento de farmácias e drogarias',
    scope: 'federal',
    category: 'Farmácia'
  },
  { 
    code: 'RDC 50/2002', 
    name: 'Estabelecimentos de Saúde',
    description: 'Regulamento Técnico para planejamento, programação, elaboração e avaliação de projetos físicos de estabelecimentos assistenciais de saúde',
    scope: 'federal',
    category: 'Saúde'
  },
  { 
    code: 'RDC 222/2018', 
    name: 'Resíduos de Serviços de Saúde',
    description: 'Regulamenta as Boas Práticas de Gerenciamento dos Resíduos de Serviços de Saúde',
    scope: 'federal',
    category: 'Resíduos'
  },
  { 
    code: 'RDC 56/2008', 
    name: 'Estabelecimentos de Beleza',
    description: 'Regulamento Técnico de Boas Práticas para Serviços de Estética e Embelezamento',
    scope: 'federal',
    category: 'Beleza'
  },
  { 
    code: 'Portaria 344/1998', 
    name: 'Substâncias Controladas',
    description: 'Regulamento Técnico sobre substâncias e medicamentos sujeitos a controle especial',
    scope: 'federal',
    category: 'Medicamentos'
  },
  { 
    code: 'Portaria 888/2021', 
    name: 'Qualidade da Água',
    description: 'Procedimentos de controle e de vigilância da qualidade da água para consumo humano',
    scope: 'federal',
    category: 'Água'
  },
  { 
    code: 'RDC 259/2002', 
    name: 'Rotulagem Geral',
    description: 'Regulamento Técnico sobre Rotulagem de Alimentos Embalados',
    scope: 'federal',
    category: 'Rotulagem'
  },
  { 
    code: 'RDC 15/2012', 
    name: 'CME - Processamento de Produtos para Saúde',
    description: 'Requisitos de boas práticas para o processamento de produtos para saúde',
    scope: 'federal',
    category: 'Saúde'
  },
  { 
    code: 'RDC 07/2015', 
    name: 'Cosméticos',
    description: 'Requisitos técnicos para a regularização de produtos de higiene pessoal, cosméticos e perfumes',
    scope: 'federal',
    category: 'Cosméticos'
  },
  { 
    code: 'NR 32', 
    name: 'Segurança em Serviços de Saúde',
    description: 'Segurança e saúde no trabalho em serviços de saúde',
    scope: 'federal',
    category: 'Segurança'
  },
  
  // Legislação Municipal - Goiânia - Dengue/Controle de Vetores
  { 
    code: 'LM 8887/2010', 
    name: 'Controle de Vetores - Dengue',
    description: 'Dispõe sobre medidas de prevenção e controle da dengue no âmbito do município de Goiânia',
    scope: 'municipal',
    category: 'Dengue'
  },
  { 
    code: 'LM 9631/2015', 
    name: 'Combate à Dengue - Obrigatoriedade',
    description: 'Dispõe sobre a obrigatoriedade de adoção de medidas para combate à dengue',
    scope: 'municipal',
    category: 'Dengue'
  },
  { 
    code: 'LM 9731/2015', 
    name: 'Dengue - Medidas Complementares',
    description: 'Medidas complementares de combate à dengue no município de Goiânia',
    scope: 'municipal',
    category: 'Dengue'
  },
  { 
    code: 'LM 9904/2016', 
    name: 'Arboviroses',
    description: 'Dispõe sobre medidas de prevenção e controle de arboviroses (dengue, zika, chikungunya)',
    scope: 'municipal',
    category: 'Dengue'
  },
  
  // Legislação Municipal - Goiânia - Geral
  { 
    code: 'Lei 8741/2008', 
    name: 'Código Sanitário de Goiânia',
    description: 'Código Sanitário do Município de Goiânia - Vigilância Sanitária',
    scope: 'municipal',
    category: 'Geral'
  },
  { 
    code: 'LM 8741/08 Art. 81', 
    name: 'Infrações Sanitárias',
    description: 'Infrações e penalidades sanitárias - Código Sanitário de Goiânia',
    scope: 'municipal',
    category: 'Infrações'
  },
  { 
    code: 'LM 8741/08 Art. 82', 
    name: 'Quantificação de Penalidades',
    description: 'Classificação e quantificação das penalidades por gravidade',
    scope: 'municipal',
    category: 'Infrações'
  },
  { 
    code: 'Lei 8217/2008', 
    name: 'Alvará Sanitário Municipal',
    description: 'Dispõe sobre a concessão de Alvará de Autorização Sanitária',
    scope: 'municipal',
    category: 'Documentação'
  },
  { 
    code: 'Portaria SMS 64/2023', 
    name: 'Projeto Arquitetônico Sanitário',
    description: 'Requisitos para PAS e MDS de estabelecimentos de interesse à saúde',
    scope: 'municipal',
    category: 'Documentação'
  },
  { 
    code: 'Portaria 1288/1995', 
    name: 'Instalações de Alimentação',
    description: 'Requisitos de instalações para estabelecimentos de alimentos',
    scope: 'federal',
    category: 'Alimentos'
  },
  { 
    code: 'Lei Estadual 20.498/2019', 
    name: 'Normas de Segurança Contra Incêndio',
    description: 'Código Estadual de Segurança Contra Incêndio e Pânico',
    scope: 'estadual',
    category: 'Segurança'
  },
  { 
    code: 'Portaria CBMGO 03/2023', 
    name: 'Certificado Corpo de Bombeiros',
    description: 'Requisitos para emissão de certificado de vistoria do CBMGO',
    scope: 'estadual',
    category: 'Segurança'
  },
  { 
    code: 'Lei 14.026/2020', 
    name: 'Marco Legal do Saneamento',
    description: 'Atualiza o marco legal do saneamento básico',
    scope: 'federal',
    category: 'Água'
  },
  { 
    code: 'Decreto 506/2016', 
    name: 'Regulamentação Sanitária',
    description: 'Regulamenta disposições do Código Sanitário Municipal',
    scope: 'municipal',
    category: 'Geral'
  },
  { 
    code: 'Lei 8078/1990', 
    name: 'Código de Defesa do Consumidor',
    description: 'Dispõe sobre a proteção do consumidor',
    scope: 'federal',
    category: 'Consumidor'
  },
];

// Função para buscar legislação por código
export const getLegislationByCode = (code: string): LegislationReference | undefined => {
  return legislationDatabase.find(leg => 
    leg.code.toLowerCase().includes(code.toLowerCase()) || 
    code.toLowerCase().includes(leg.code.toLowerCase())
  );
};

// Função para buscar legislações por categoria
export const getLegislationsByCategory = (category: string): LegislationReference[] => {
  return legislationDatabase.filter(leg => leg.category === category);
};

// Função para buscar legislações por escopo
export const getLegislationsByScope = (scope: string): LegislationReference[] => {
  return legislationDatabase.filter(leg => leg.scope === scope);
};

// ============= CHECKLISTS =============
export interface ChecklistItem {
  id: string;
  text: string; // Texto imperativo para adequação
  category: string;
  legislation?: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  items: ChecklistItem[];
  legislationBase?: string;
}

export const checklistTemplates: ChecklistTemplate[] = [
  {
    id: 'eventos_temporarios',
    name: 'Eventos Temporários',
    description: 'Feiras, festas e eventos com comércio de alimentos',
    icon: 'PartyPopper',
    legislationBase: 'RDC ANVISA nº 656/2022 e Lei Municipal nº 8.741/08',
    items: [
      { id: 'evt1', text: 'Providenciar Alvará Sanitário para Evento Temporário', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 'evt2', text: 'Adequar estrutura das instalações em condições de higiene, conservação e fácil limpeza', category: 'Estrutura', legislation: 'RDC 656/22' },
      { id: 'evt3', text: 'Higienizar equipamentos, móveis e utensílios, mantendo em condições adequadas de conservação', category: 'Equipamentos', legislation: 'RDC 656/22' },
      { id: 'evt4', text: 'Utilizar superfícies em contato direto com alimentos de material liso, lavável, impermeável e resistente', category: 'Equipamentos', legislation: 'RDC 656/22' },
      { id: 'evt5', text: 'Guardar produtos saneantes regularizados em local reservado e utilizar de forma adequada', category: 'Produtos', legislation: 'RDC 656/22' },
      { id: 'evt6', text: 'Adotar medidas preventivas para evitar presença de vetores e pragas ou comprovar controle integrado', category: 'Controle de Pragas', legislation: 'RDC 656/22' },
      { id: 'evt7', text: 'Estocar resíduos em lixeiras com tampas sem acionamento manual', category: 'Resíduos', legislation: 'RDC 656/22' },
      { id: 'evt8', text: 'Providenciar local apropriado para armazenamento provisório dos resíduos', category: 'Resíduos', legislation: 'RDC 656/22' },
      { id: 'evt9', text: 'Instalar lixeiras na área externa em quantidade compatível com número de participantes do evento', category: 'Resíduos', legislation: 'RDC 656/22' },
      { id: 'evt10', text: 'Implementar sistema de coleta de resíduos durante o evento para evitar acúmulo', category: 'Resíduos', legislation: 'RDC 656/22' },
      { id: 'evt11', text: 'Abastecer instalações com água corrente potável para manipulação de alimentos e higienização', category: 'Água', legislation: 'RDC 656/22' },
      { id: 'evt12', text: 'Manter reservatório de água de material adequado, tampado, higienizado e continuamente abastecido', category: 'Água', legislation: 'RDC 656/22' },
      { id: 'evt13', text: 'Instalar sistema adequado para escoamento ou armazenamento de água servida', category: 'Estrutura', legislation: 'RDC 656/22' },
      { id: 'evt14', text: 'Adequar higiene e saúde dos manipuladores: uniforme adequado, unhas, adornos, maquiagem e hábitos higiênicos', category: 'Pessoal', legislation: 'RDC 656/22' },
      { id: 'evt15', text: 'Higienizar as mãos e usar utensílios próprios na manipulação dos alimentos', category: 'Pessoal', legislation: 'RDC 656/22' },
      { id: 'evt16', text: 'Guardar roupas e objetos pessoais (inclusive celulares) em local reservado', category: 'Pessoal', legislation: 'RDC 656/22' },
      { id: 'evt17', text: 'Comprovar capacitação de manipuladores em higiene pessoal, manipulação de alimentos e DTAs', category: 'Documentação', legislation: 'RDC 656/22' },
      { id: 'evt18', text: 'Instalar estrutura para higiene de mãos com sabonete líquido inodoro, antisséptico e papel toalha', category: 'Higiene', legislation: 'RDC 656/22' },
      { id: 'evt19', text: 'Armazenar matérias-primas e insumos com procedência comprovada, em condições adequadas e dentro do prazo de validade', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt20', text: 'Expor perecíveis à temperatura ambiente pelo tempo mínimo necessário à operação', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt21', text: 'Evitar contato direto ou indireto entre alimentos prontos para consumo, semiprontos e crus', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt22', text: 'Aplicar tratamento térmico adequado dos alimentos (mínimo de 70°C inclusive no centro)', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt23', text: 'Utilizar óleos de fritura a temperaturas não superiores a 180°C e substituir quando alterados', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt24', text: 'Descongelar sob refrigeração ou em micro-ondas', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt25', text: 'Armazenar alimentos pré-preparados e preparados com informações de denominação, data de preparo e prazo de validade', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt26', text: 'Não recongelar alimentos descongelados', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt27', text: 'Manter temperatura de alimentos preparados após cocção acima de 60°C por até seis horas', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt28', text: 'Manter temperatura de alimentos preparados resfriados até 5°C por até três dias', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt29', text: 'Consumir alimentos preparados sob temperatura abaixo de 60°C em até 60 minutos', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt30', text: 'Higienizar frutas, legumes e vegetais a serem consumidos crus com produtos regularizados', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt31', text: 'Manipular alimentos proteicos crus em área climatizada (entre 12°C e 18°C) e armazenar abaixo de 5°C', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt32', text: 'Transportar alimentos preparados em temperatura e veículos adequados', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt33', text: 'Identificar alimentos preparados fora do local com denominação, produtor, endereço, data, temperatura e validade', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt34', text: 'Não reutilizar restos e sobras de alimentos', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt35', text: 'Dimensionar e manter equipamentos para exposição e distribuição de alimentos em adequado estado de higiene e funcionamento', category: 'Equipamentos', legislation: 'RDC 656/22' },
      { id: 'evt36', text: 'Monitorar constantemente a temperatura dos alimentos mantidos nos equipamentos de exposição e distribuição', category: 'Equipamentos', legislation: 'RDC 656/22' },
      { id: 'evt37', text: 'Armazenar bebidas sem contato direto com o piso', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt38', text: 'Transportar e armazenar gelo de água potável adequadamente, com procedência comprovada (rótulo)', category: 'Alimentos', legislation: 'RDC 656/22' },
      { id: 'evt39', text: 'Manter utensílios para consumo de alimentos e bebidas limpos, em bom estado, armazenados em local protegido', category: 'Equipamentos', legislation: 'RDC 656/22' },
      { id: 'evt40', text: 'Separar área de recebimento de pagamento dos manipuladores de alimentos preparados', category: 'Estrutura', legislation: 'RDC 656/22' },
      { id: 'evt41', text: 'Realizar coleta de amostra dos alimentos preparados', category: 'Documentação', legislation: 'RDC 656/22' },
    ]
  },
  {
    id: 'restaurante',
    name: 'Restaurante / Lanchonete',
    description: 'Estabelecimentos de preparo e venda de alimentos prontos',
    icon: 'UtensilsCrossed',
    legislationBase: 'RDC 216/04 e Lei Municipal nº 8.741/08',
    items: [
      { id: 'r1', text: 'Contratar empresa especializada para controle integrado de pragas', category: 'Controle de Pragas', legislation: 'RDC 216/04' },
      { id: 'r2', text: 'Instalar lavatórios com sabonete líquido inodoro e papel toalha não reciclado', category: 'Higiene', legislation: 'RDC 216/04' },
      { id: 'r3', text: 'Manter alimentos dentro do prazo de validade', category: 'Alimentos', legislation: 'Lei 8741/08' },
      { id: 'r4', text: 'Aplicar tratamento térmico adequado (mínimo 70°C no centro geométrico)', category: 'Alimentos', legislation: 'RDC 216/04' },
      { id: 'r5', text: 'Manter equipamentos de refrigeração funcionando em temperatura adequada', category: 'Equipamentos', legislation: 'RDC 216/04' },
      { id: 'r6', text: 'Fornecer e exigir uso de uniformes limpos e adequados pelos manipuladores', category: 'Pessoal', legislation: 'RDC 216/04' },
      { id: 'r7', text: 'Remover objetos estranhos da área de manipulação de alimentos', category: 'Estrutura', legislation: 'RDC 216/04' },
      { id: 'r8', text: 'Instalar lixeiras com tampa e pedal', category: 'Higiene', legislation: 'RDC 216/04' },
      { id: 'r9', text: 'Instalar telas milimétricas em portas, janelas e aberturas para área externa', category: 'Controle de Pragas', legislation: 'RDC 216/04' },
      { id: 'r10', text: 'Comprovar capacitação periódica dos manipuladores de alimentos', category: 'Documentação', legislation: 'RDC 216/04' },
      { id: 'r11', text: 'Afixar Alvará Sanitário válido em local visível ao público', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 'r12', text: 'Reparar piso, paredes e teto mantendo em bom estado de conservação', category: 'Estrutura', legislation: 'RDC 216/04' },
      { id: 'r13', text: 'Apresentar laudos de potabilidade da água', category: 'Água', legislation: 'RDC 216/04' },
      { id: 'r14', text: 'Higienizar reservatório de água semestralmente com comprovação', category: 'Água', legislation: 'RDC 216/04' },
      { id: 'r15', text: 'Armazenar produtos de limpeza regularizados separadamente dos alimentos', category: 'Higiene', legislation: 'RDC 216/04' },
      { id: 'r16', text: 'Elaborar e implementar Manual de Boas Práticas de Fabricação', category: 'Documentação', legislation: 'RDC 216/04' },
      { id: 'r17', text: 'Elaborar e implementar Procedimentos Operacionais Padronizados (POPs)', category: 'Documentação', legislation: 'RDC 216/04' },
      { id: 'r18', text: 'Armazenar alimentos em estrados e prateleiras adequados, afastados do piso e parede', category: 'Alimentos', legislation: 'RDC 216/04' },
    ]
  },
  {
    id: 'supermercado',
    name: 'Supermercado',
    description: 'Comércio varejista de alimentos e produtos diversos',
    icon: 'ShoppingCart',
    legislationBase: 'RDC 216/04 e Lei Municipal nº 8.741/08',
    items: [
      { id: 's1', text: 'Contratar empresa especializada para controle integrado de pragas', category: 'Controle de Pragas', legislation: 'RDC 216/04' },
      { id: 's2', text: 'Retirar e inutilizar produtos fora do prazo de validade', category: 'Alimentos', legislation: 'Lei 8741/08' },
      { id: 's3', text: 'Manter temperatura das câmaras frias em níveis adequados', category: 'Equipamentos', legislation: 'RDC 216/04' },
      { id: 's4', text: 'Armazenar produtos perecíveis corretamente em temperatura controlada', category: 'Alimentos', legislation: 'RDC 216/04' },
      { id: 's5', text: 'Instalar termômetro visível nos balcões frigoríficos', category: 'Equipamentos', legislation: 'RDC 216/04' },
      { id: 's6', text: 'Limpar e organizar área de manipulação de alimentos', category: 'Higiene', legislation: 'RDC 216/04' },
      { id: 's7', text: 'Fornecer uniformes limpos aos funcionários', category: 'Pessoal', legislation: 'RDC 216/04' },
      { id: 's8', text: 'Manter rotulagem dos produtos conforme legislação vigente', category: 'Alimentos', legislation: 'RDC 259/02' },
      { id: 's9', text: 'Separar produtos de limpeza dos alimentos em gôndolas distintas', category: 'Armazenamento', legislation: 'RDC 216/04' },
      { id: 's10', text: 'Utilizar estrados e prateleiras adequados para armazenamento', category: 'Estrutura', legislation: 'RDC 216/04' },
      { id: 's11', text: 'Afixar Alvará Sanitário válido em local visível', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 's12', text: 'Retirar produtos com embalagens violadas ou danificadas', category: 'Alimentos', legislation: 'Lei 8741/08' },
      { id: 's13', text: 'Identificar e separar produtos aguardando troca em local apropriado', category: 'Alimentos', legislation: 'RDC 216/04' },
      { id: 's14', text: 'Remover entulhos e materiais alheios à atividade das áreas operacionais', category: 'Estrutura', legislation: 'RDC 216/04' },
      { id: 's15', text: 'Eliminar ferrugem de equipamentos ou mobiliário', category: 'Equipamentos', legislation: 'RDC 216/04' },
    ]
  },
  {
    id: 'industria_alimentos',
    name: 'Indústria de Alimentos (BPF)',
    description: 'Estabelecimentos industrializadores de alimentos - POPs e BPF',
    icon: 'Factory',
    legislationBase: 'RDC 275/2002 - ANVISA e Lei Estadual 16.140/2007',
    items: [
      { id: 'ind1', text: 'Elaborar e implementar Manual de Boas Práticas de Fabricação', category: 'Documentação', legislation: 'RDC 275/2002' },
      { id: 'ind2', text: 'Elaborar e implementar Procedimentos Operacionais Padronizados (POPs)', category: 'Documentação', legislation: 'RDC 275/2002' },
      { id: 'ind3', text: 'Manter instalações em adequado estado de higiene e conservação', category: 'Estrutura', legislation: 'RDC 275/2002' },
      { id: 'ind4', text: 'Implementar programa de manutenção preventiva de equipamentos', category: 'Equipamentos', legislation: 'RDC 275/2002' },
      { id: 'ind5', text: 'Manter equipamentos calibrados com registros de calibração', category: 'Equipamentos', legislation: 'RDC 275/2002' },
      { id: 'ind6', text: 'Implementar programa de controle integrado de pragas', category: 'Controle de Pragas', legislation: 'RDC 275/2002' },
      { id: 'ind7', text: 'Realizar higienização do reservatório de água semestralmente com comprovação', category: 'Água', legislation: 'RDC 275/2002' },
      { id: 'ind8', text: 'Manter laudos de análise da água atualizados', category: 'Água', legislation: 'RDC 275/2002' },
      { id: 'ind9', text: 'Capacitar manipuladores de alimentos periodicamente com registros', category: 'Pessoal', legislation: 'RDC 275/2002' },
      { id: 'ind10', text: 'Realizar exames de saúde periódicos dos funcionários', category: 'Pessoal', legislation: 'RDC 275/2002' },
      { id: 'ind11', text: 'Implementar rastreabilidade de matérias-primas e produtos', category: 'Alimentos', legislation: 'RDC 275/2002' },
      { id: 'ind12', text: 'Armazenar matérias-primas adequadamente, separadas de produtos acabados', category: 'Armazenamento', legislation: 'RDC 275/2002' },
      { id: 'ind13', text: 'Manter registros de controle de produção atualizados', category: 'Documentação', legislation: 'RDC 275/2002' },
      { id: 'ind14', text: 'Separar área de produção das áreas de vestiário e sanitário', category: 'Estrutura', legislation: 'Lei Estadual 16.140/2007' },
    ]
  },
  {
    id: 'gelados_comestiveis',
    name: 'Gelados Comestíveis',
    description: 'Fabricação de sorvetes, picolés e similares',
    icon: 'IceCream',
    legislationBase: 'RDC 267/2003 - ANVISA',
    items: [
      { id: 'gel1', text: 'Providenciar e afixar Alvará Sanitário válido', category: 'Documentação', legislation: 'Lei 8741/2008' },
      { id: 'gel2', text: 'Elaborar e implementar Manual de Boas Práticas de Fabricação', category: 'Documentação', legislation: 'RDC 267/2003' },
      { id: 'gel3', text: 'Elaborar e implementar Procedimentos Operacionais Padronizados (POPs)', category: 'Documentação', legislation: 'RDC 267/2003' },
      { id: 'gel4', text: 'Controlar e registrar temperatura de armazenamento dos produtos', category: 'Equipamentos', legislation: 'RDC 267/2003' },
      { id: 'gel5', text: 'Manter produtos em temperatura igual ou inferior a -18°C', category: 'Alimentos', legislation: 'RDC 267/2003' },
      { id: 'gel6', text: 'Utilizar matérias-primas de procedência comprovada e dentro do prazo de validade', category: 'Alimentos', legislation: 'RDC 267/2003' },
      { id: 'gel7', text: 'Higienizar equipamentos e utensílios adequadamente', category: 'Higiene', legislation: 'RDC 267/2003' },
      { id: 'gel8', text: 'Manter uniformes limpos e adequados para manipuladores', category: 'Pessoal', legislation: 'RDC 267/2003' },
      { id: 'gel9', text: 'Implementar programa de controle integrado de pragas', category: 'Controle de Pragas', legislation: 'RDC 267/2003' },
      { id: 'gel10', text: 'Manter rotulagem de produtos conforme legislação vigente', category: 'Rotulagem', legislation: 'RDC 727/2022' },
    ]
  },
  {
    id: 'rotulagem',
    name: 'Rotulagem de Alimentos',
    description: 'Verificação de rotulagem de alimentos embalados',
    icon: 'Tag',
    legislationBase: 'RDC 727/2022 e IN 75/2020 - ANVISA',
    items: [
      { id: 'rot1', text: 'Apresentar denominação de venda do alimento conforme regulamento técnico', category: 'Rotulagem', legislation: 'RDC 727/2022' },
      { id: 'rot2', text: 'Apresentar lista de ingredientes em ordem decrescente de quantidade', category: 'Rotulagem', legislation: 'RDC 727/2022' },
      { id: 'rot3', text: 'Destacar alergênicos conforme determinação da legislação', category: 'Rotulagem', legislation: 'RDC 727/2022' },
      { id: 'rot4', text: 'Apresentar tabela nutricional frontal conforme modelo estabelecido', category: 'Rotulagem', legislation: 'IN 75/2020' },
      { id: 'rot5', text: 'Informar conteúdo líquido do produto', category: 'Rotulagem', legislation: 'RDC 727/2022' },
      { id: 'rot6', text: 'Apresentar identificação de origem (fabricante/produtor)', category: 'Rotulagem', legislation: 'RDC 727/2022' },
      { id: 'rot7', text: 'Informar prazo de validade legível e visível', category: 'Rotulagem', legislation: 'RDC 727/2022' },
      { id: 'rot8', text: 'Apresentar lote de fabricação', category: 'Rotulagem', legislation: 'RDC 727/2022' },
      { id: 'rot9', text: 'Informar instruções de preparo quando aplicável', category: 'Rotulagem', legislation: 'RDC 727/2022' },
      { id: 'rot10', text: 'Apresentar registro ou dispensa de registro junto à ANVISA', category: 'Documentação', legislation: 'RDC 727/2022' },
    ]
  },
  {
    id: 'suplementos',
    name: 'Suplementos Alimentares',
    description: 'Fabricação e comercialização de suplementos alimentares',
    icon: 'Pill',
    legislationBase: 'RDC 843/2024 - ANVISA',
    items: [
      { id: 'sup1', text: 'Providenciar Comunicado de Início de Fabricação junto à ANVISA', category: 'Documentação', legislation: 'RDC 843/2024' },
      { id: 'sup2', text: 'Notificar suplementos alimentares conforme regulamentação', category: 'Documentação', legislation: 'RDC 843/2024' },
      { id: 'sup3', text: 'Manter rotulagem conforme regulamento técnico de suplementos', category: 'Rotulagem', legislation: 'RDC 843/2024' },
      { id: 'sup4', text: 'Apresentar informações nutricionais conforme legislação', category: 'Rotulagem', legislation: 'RDC 843/2024' },
      { id: 'sup5', text: 'Manter alegações de saúde somente as permitidas pela regulamentação', category: 'Rotulagem', legislation: 'RDC 843/2024' },
      { id: 'sup6', text: 'Apresentar documentação de conformidade dos ingredientes', category: 'Documentação', legislation: 'RDC 843/2024' },
      { id: 'sup7', text: 'Manter controle de qualidade dos produtos', category: 'Qualidade', legislation: 'RDC 843/2024' },
      { id: 'sup8', text: 'Armazenar produtos em condições adequadas de temperatura e umidade', category: 'Armazenamento', legislation: 'RDC 843/2024' },
    ]
  },
  {
    id: 'cozinha_industrial',
    name: 'Cozinha Industrial / Central de Produção',
    description: 'Cozinhas industriais, centrais de produção e UAN',
    icon: 'ChefHat',
    legislationBase: 'RDC 216/2004, LM 8741/08 Art. 81 Inc. XIX, Portaria SMS 64/2023',
    items: [
      // DOCUMENTAÇÃO
      { id: 'ci1', text: 'Apresentar Alvará de Autorização Sanitária para a atividade exercida', category: 'Documentação', legislation: 'Lei 8217/2008; Portaria MS 1.565/1994' },
      { id: 'ci2', text: 'Apresentar Projeto Arquitetônico e Memorial Descritivo Sanitários (PAS e MDS) para análise e aprovação, e executá-los conforme aprovação', category: 'Documentação', legislation: 'Portaria SMS 64/2023' },
      { id: 'ci3', text: 'Apresentar e implantar o Manual de Boas Práticas e os respectivos POPs', category: 'Documentação', legislation: 'RDC 216/2004 itens 4.1.1 e 4.11.1; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci4', text: 'Apresentar comprovante de treinamento dos manipuladores em Boas Práticas de Fabricação de Alimentos', category: 'Documentação', legislation: 'RDC 216/2004 item 4.6.7; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci5', text: 'Apresentar comprovante de higienização da caixa d\'água a cada seis meses', category: 'Documentação', legislation: 'RDC 216/2004 itens 4.4.4 e 4.11.7; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci6', text: 'Apresentar laudo laboratorial de potabilidade da água para fonte alternativa, incluindo outorga pela SEMAD para poço artesiano', category: 'Documentação', legislation: 'Portaria GM/MS 888/2021; Lei 14.026/2020; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci7', text: 'Apresentar comprovante de controle integrado de pragas e vetores', category: 'Documentação', legislation: 'RDC 216/2004 itens 4.3.2 e 4.11.6; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci8', text: 'Apresentar comprovante de manutenção e troca dos filtros dos equipamentos de climatização', category: 'Documentação', legislation: 'RDC 216/2004 item 4.1.17; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci9', text: 'Apresentar comprovante da troca das velas dos filtros de água e máquinas de gelo', category: 'Documentação', legislation: 'RDC 216/2004 item 4.1.16; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci10', text: 'Apresentar certificado do Corpo de Bombeiros', category: 'Documentação', legislation: 'Lei Estadual 20.498/2019; Portaria CBMGO 03/2023' },
      { id: 'ci11', text: 'Apresentar certificado de vistoria do veículo de transporte de matérias-primas e produtos', category: 'Documentação', legislation: 'Lei 14.026/2020 art. 81, inc. III' },
      { id: 'ci12', text: 'Apresentar nota fiscal das matérias-primas e plano com relação dos fornecedores', category: 'Documentação', legislation: 'RDC 216/2004 item 4.7; LM 8741/08 Art. 81 Inc. XIX' },
      
      // ESTRUTURA FÍSICA
      { id: 'ci13', text: 'Adequar edificação e instalações compatíveis com todas operações e separação entre atividades por meios físicos para evitar contaminação cruzada', category: 'Estrutura', legislation: 'RDC 216/2004 itens 4.1.2 e 4.1.1; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci14', text: 'Providenciar local adequado para armazenamento externo do lixo, protegido e livre de odores', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.5.3; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci15', text: 'Adequar piso, paredes e teto: lisos, impermeáveis, laváveis, íntegros e conservados', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.3; Portaria 1288/95 Art. 7º inc. I e II, Art. 10 inc. II e III; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci16', text: 'Adequar portas e janelas ajustadas, com fechamento automático; aberturas externas com telas milimétricas', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.4; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci17', text: 'Retirar móveis e utensílios estranhos à atividade', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.7; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci18', text: 'Adequar ralos/grelhas com dispositivo de fechamento; garantir água corrente e esgoto adequados', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.5; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci19', text: 'Adequar iluminação e proteger luminárias contra explosão e quedas', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.8; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci20', text: 'Proteger instalações elétricas; instalar espelhos em tomadas', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.9; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci21', text: 'Manter áreas internas livres de animais', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.7; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci22', text: 'Adequar caixas de gordura: compatíveis, limpas e conservadas', category: 'Estrutura', legislation: 'RDC 216/2004 itens 4.1.6 e 4.2.2; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci23', text: 'Adequar ventilação: sem incidência direta sobre alimentos', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.10; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci24', text: 'Adequar sanitários separados da produção, com portas e pias adequadas', category: 'Estrutura', legislation: 'Portaria 1288/95 Art. 7º inc. III; RDC 216/2004 item 4.1.12; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci25', text: 'Providenciar sala climatizada (≤18ºC) para fatiamento de frios e carnes', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.8.5; LM 8741/08 Art. 81 Inc. XIX' },
      
      // HIGIENE
      { id: 'ci26', text: 'Instalar pias exclusivas para higienização das mãos com sabonete líquido e papel toalha', category: 'Higiene', legislation: 'RDC 216/2004 item 4.1.14; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci27', text: 'Afixar cartazes orientativos sobre lavagem correta das mãos', category: 'Higiene', legislation: 'RDC 216/2004 item 4.6; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci28', text: 'Instalar pias com água corrente e sabão para lavagem de utensílios', category: 'Higiene', legislation: 'Portaria 1288/95 Art. 7º inc. IX; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci29', text: 'Substituir panos reutilizáveis por descartáveis', category: 'Higiene', legislation: 'RDC 216/2004 item 4.1.15; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci30', text: 'Providenciar lixeiras com tampa sem contato manual (pedal)', category: 'Higiene', legislation: 'RDC 216/2004 itens 4.5.1 e 4.5.3; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci31', text: 'Guardar produtos e utensílios de limpeza em DML (Depósito de Material de Limpeza)', category: 'Higiene', legislation: 'RDC 216/2004 itens 4.3.6 e 4.2.6; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci32', text: 'Realizar limpeza geral das estruturas, móveis e utensílios', category: 'Higiene', legislation: 'RDC 216/2004 item 4.2.1; LM 8741/08 Art. 81 Inc. XIX' },
      
      // EQUIPAMENTOS
      { id: 'ci33', text: 'Adequar equipamentos de material liso, impermeável e em bom estado de conservação', category: 'Equipamentos', legislation: 'RDC 216/2004 itens 4.1.17 e 4.1.15; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci34', text: 'Armazenar equipamentos em prateleiras lisas e adequadas', category: 'Equipamentos', legislation: 'RDC 216/2004 item 4.1.17; LM 8741/08 Art. 81 Inc. XIX' },
      
      // PESSOAL
      { id: 'ci35', text: 'Guardar objetos pessoais em armários específicos', category: 'Pessoal', legislation: 'RDC 216/2004 item 4.6.6; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci36', text: 'Exigir uso de uniforme claro e proteção de cabelo pelos manipuladores', category: 'Pessoal', legislation: 'RDC 216/2004 item 4.6.5; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci37', text: 'Assegurar que funcionários do caixa não manipulam alimentos', category: 'Pessoal', legislation: 'RDC 216/2004 item 4.10.7; LM 8741/08 Art. 81 Inc. XIX' },
      
      // ALIMENTOS E ARMAZENAMENTO
      { id: 'ci38', text: 'Realizar controle de validade dos produtos', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.7.4; LM 8741/08 Art. 81 Inc. IV' },
      { id: 'ci39', text: 'Armazenar produtos corretamente e identificados', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.7.5; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci40', text: 'Evitar contato entre alimentos crus e prontos para consumo', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.3; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci41', text: 'Manter produtos perecíveis fora de risco térmico', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.5; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci42', text: 'Trocar óleo de fritura sempre que alterado', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.11; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci43', text: 'Descongelar alimentos sob refrigeração ou micro-ondas', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.13; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci44', text: 'Manter alimentos quentes acima de 60ºC e frios abaixo de 5ºC', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.16; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci45', text: 'Observar prazo máximo de 5 dias sob refrigeração', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.17; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci46', text: 'Identificar produtos fracionados com data e validade', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.6; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci47', text: 'Identificar alimentos preparados com denominação, data e validade', category: 'Alimentos', legislation: 'RDC 216/2004 itens 4.8.18 e 4.9.1; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci48', text: 'Transportar alimentos em caixas térmicas adequadas', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.9.2; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci49', text: 'Manter produtos embalados com rótulo completo conforme legislação', category: 'Alimentos', legislation: 'RDC 727/2022; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci50', text: 'Proteger alimentos expostos contra contaminação', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.10.4; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci51', text: 'Sanitizar hortaliças com hipoclorito de sódio', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.9; LM 8741/08 Art. 81 Inc. XIX' },
      { id: 'ci52', text: 'Produzir gelo, água e vapor com água potável', category: 'Alimentos', legislation: 'RDC 216/2004; LM 8741/08 Art. 81 Inc. XIX' },
      
      // CONTROLE E REGISTROS
      { id: 'ci53', text: 'Manter planilhas de controle de temperatura atualizadas', category: 'Controle', legislation: 'RDC 216/2004 itens 4.7.3 e 4.8.18; LM 8741/08 Art. 81 Inc. XIX' },
      
      // PROIBIÇÕES CDC
      { id: 'ci54', text: 'Abster-se das proibições previstas na Lei 8.078/90 (CDC) art. 81 incisos I a VI', category: 'Consumidor', legislation: 'Lei 8078/1990 art. 81; LM 8741/08 Art. 81' },
    ]
  },
  {
    id: 'hipermercado',
    name: 'Hipermercado / Grande Varejo',
    description: 'Hipermercados, atacarejos e grandes redes varejistas de alimentos',
    icon: 'ShoppingCart',
    legislationBase: 'RDC 216/2004, Lei Municipal nº 8.741/08',
    items: [
      // GERAL (OBSERVAR EM TODO ESTABELECIMENTO)
      { id: 'hip1', text: 'Providenciar fluxo linear e sem cruzamentos em todas as etapas (recepção, depósito, manipulação e entrega)', category: 'Geral', legislation: 'RDC 216/2004' },
      { id: 'hip2', text: 'Impedir que áreas não afins sirvam de circulação entre elas (ex: entrada de sanitários passando pela manipulação)', category: 'Geral', legislation: 'RDC 216/2004' },
      { id: 'hip3', text: 'Adequar capacidade e tamanho das áreas ao volume de produção e armazenamento', category: 'Geral', legislation: 'RDC 216/2004' },
      { id: 'hip4', text: 'Identificar todas as áreas e salas do estabelecimento (exceto segurança)', category: 'Geral', legislation: 'RDC 216/2004' },
      { id: 'hip5', text: 'Retirar todo material, objetos e equipamentos em desuso de todas as áreas', category: 'Geral', legislation: 'RDC 216/2004' },
      { id: 'hip6', text: 'Suspender atividades quando o abastecimento de água for interrompido', category: 'Geral', legislation: 'RDC 216/2004' },
      { id: 'hip7', text: 'Utilizar gás apenas por meio de central de gás com aprovação do corpo de bombeiros', category: 'Geral', legislation: 'Lei Estadual 20.498/2019' },
      
      // EDIFICAÇÕES E INSTALAÇÕES
      { id: 'hip8', text: 'Reparar estrutura física (teto, piso e parede) com material liso, lavável, resistente e cor clara, sem buracos, descascamentos ou infiltrações', category: 'Edificações e Instalações', legislation: 'RDC 216/2004; LM 8741/08' },
      { id: 'hip9', text: 'Embutir ou proteger toda instalação elétrica; não utilizar T ou extensões', category: 'Edificações e Instalações', legislation: 'RDC 216/2004; LM 8741/08' },
      { id: 'hip10', text: 'Repor espelhos das tomadas faltando ou quebrados', category: 'Edificações e Instalações', legislation: 'RDC 216/2004' },
      { id: 'hip11', text: 'Adequar sistema de ventilação de todos os ambientes; não permitir exaustão para ambientes fechados', category: 'Edificações e Instalações', legislation: 'RDC 216/2004' },
      { id: 'hip12', text: 'Garantir conforto térmico com ventilação/exaustão/climatização adequados', category: 'Edificações e Instalações', legislation: 'RDC 216/2004' },
      { id: 'hip13', text: 'Vedar caixas de gordura e esgoto; revisar sistema de esgoto (sifões, ralos com fechamento, canos)', category: 'Edificações e Instalações', legislation: 'RDC 216/2004' },
      { id: 'hip14', text: 'Providenciar ralos com sistema de fechamento em todo o estabelecimento', category: 'Edificações e Instalações', legislation: 'RDC 216/2004' },
      { id: 'hip15', text: 'Providenciar vestiário para funcionários com armário específico para objetos pessoais', category: 'Edificações e Instalações', legislation: 'RDC 216/2004' },
      { id: 'hip16', text: 'Adequar iluminação em todos os ambientes; nas salas de manipulação simular luz do dia', category: 'Edificações e Instalações', legislation: 'RDC 216/2004' },
      { id: 'hip17', text: 'Providenciar DML Geral com tanque, armários e prateleiras para guarda de materiais de limpeza setorizados', category: 'Edificações e Instalações', legislation: 'RDC 216/2004' },
      
      // EQUIPAMENTOS, MÓVEIS E UTENSÍLIOS
      { id: 'hip18', text: 'Manter equipamentos, móveis e utensílios em perfeito estado de conservação (sem ferrugem, quebrados, borrachas com mofo)', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip19', text: 'Não utilizar caixas ou apoios inadequados; usar bancadas, estrados e prateleiras de material liso, lavável e impermeável', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip20', text: 'Providenciar local próprio para armazenar alimentos com prateleiras, armários e estrados, afastados de piso, paredes e fontes de calor', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip21', text: 'Providenciar local e suporte para utensílios (incluindo facas) e embalagens na sala de manipulação', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip22', text: 'Instalar lavatórios de mãos abastecidos com sabonete líquido e papel-toalha', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip23', text: 'Em áreas de manipulação, providenciar mínimo cuba para apoio e lavatório exclusivo para mãos com sabonete e papel toalha', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip24', text: 'Providenciar lixeiras com tampa acionada a pedal em quantidade adequada', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip25', text: 'Providenciar dispositivo frio para manter alimentos sob refrigeração', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip26', text: 'Providenciar bancadas de apoio em número suficiente', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip27', text: 'Instalar coifa e exaustor sobre chapa e fritadeira', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip28', text: 'Providenciar filtro de água que atenda a demanda', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip29', text: 'Utilizar equipamentos lisos, impermeáveis, laváveis e sem imperfeições que impossibilitem higienização', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip30', text: 'Não utilizar equipamentos e utensílios de madeira, porosos, esmaltados ou susceptíveis à oxidação', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip31', text: 'Organizar e identificar todos os ambientes estabelecendo suas funções', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip32', text: 'Realizar degelo e limpeza periódica em todos os equipamentos de refrigeração', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip33', text: 'Manter utensílios e materiais de limpeza dentro do DML, retirar apenas durante operações de limpeza', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip34', text: 'Providenciar portas de acesso à manipulação, depósitos e sanitários bem ajustadas com fechamento automático', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip35', text: 'Instalar telas milimétricas em todas as aberturas (exaustores e janelas) de manipulação e depósito', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip36', text: 'Identificar bancadas, cubas e lavatórios com Instrução de trabalho (como lavar mãos, higienização de hortifruti)', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip37', text: 'Providenciar termômetro calibrado para aferição de temperatura', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip38', text: 'Providenciar área específica de higienização de hortifruti com Instrução de trabalho', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      { id: 'hip39', text: 'Providenciar locais adequados para Instruções de Trabalhos e Planilhas nas áreas de manipulação e atendimento', category: 'Equipamentos, Móveis e Utensílios', legislation: 'RDC 216/2004' },
      
      // HIGIENIZAÇÃO DE INSTALAÇÕES, EQUIPAMENTOS, MÓVEIS E UTENSÍLIOS
      { id: 'hip40', text: 'Realizar limpeza rigorosa de todos os utensílios, móveis, equipamentos e estrutura física', category: 'Higienização', legislation: 'RDC 216/2004' },
      { id: 'hip41', text: 'Adequar periodicidade e métodos de higienização compatíveis com processos de produção', category: 'Higienização', legislation: 'RDC 216/2004' },
      { id: 'hip42', text: 'Desincrustar fogão, panelas e formas', category: 'Higienização', legislation: 'RDC 216/2004' },
      { id: 'hip43', text: 'Manter exaustores limpos periodicamente com tela milimétrica no acesso superior', category: 'Higienização', legislation: 'RDC 216/2004' },
      { id: 'hip44', text: 'Identificar e armazenar produtos de limpeza em local específico, separados da produção e alimentos', category: 'Higienização', legislation: 'RDC 216/2004' },
      { id: 'hip45', text: 'Utilizar produtos regularizados na ANVISA e adequados para superfícies em contato com alimentos', category: 'Higienização', legislation: 'RDC 216/2004' },
      { id: 'hip46', text: 'Não varrer a seco', category: 'Higienização', legislation: 'RDC 216/2004' },
      { id: 'hip47', text: 'Higienizar material de limpeza em local distinto da manipulação de alimentos', category: 'Higienização', legislation: 'RDC 216/2004' },
      { id: 'hip48', text: 'Não utilizar panos não descartáveis na higienização e secagem de utensílios que tenham contato com alimentos', category: 'Higienização', legislation: 'RDC 216/2004' },
      { id: 'hip49', text: 'Desmontar equipamentos sempre que possível para facilitar limpeza', category: 'Higienização', legislation: 'RDC 216/2004' },
      
      // RECEBIMENTO
      { id: 'hip50', text: 'Receber/descarregar alimentos em área protegida de chuva, sol, limpa, iluminada e livre de pragas', category: 'Recebimento', legislation: 'RDC 216/2004' },
      { id: 'hip51', text: 'Observar uniforme limpo do entregador', category: 'Recebimento', legislation: 'RDC 216/2004' },
      { id: 'hip52', text: 'Utilizar estrados de material lavável para suporte na chegada dos alimentos', category: 'Recebimento', legislation: 'RDC 216/2004' },
      { id: 'hip53', text: 'Verificar temperatura do alimento conforme recomendado no rótulo', category: 'Recebimento', legislation: 'RDC 216/2004' },
      { id: 'hip54', text: 'Rejeitar alimento com prazo de validade vencido, sinais de dano ou deterioração', category: 'Recebimento', legislation: 'RDC 216/2004; LM 8741/08' },
      { id: 'hip55', text: 'Exigir matérias-primas e ingredientes regularizados, com embalagem íntegra e sem sinais de deterioração', category: 'Recebimento', legislation: 'RDC 216/2004' },
      
      // ARMAZENAGEM - ESTOQUE SECO
      { id: 'hip56', text: 'Manter estoque seco arejado, sem umidade ou calor excessivo', category: 'Armazenagem - Estoque Seco', legislation: 'RDC 216/2004' },
      { id: 'hip57', text: 'Manter estoque limpo, livre de entulhos e materiais em desuso', category: 'Armazenagem - Estoque Seco', legislation: 'RDC 216/2004' },
      { id: 'hip58', text: 'Colocar alimentos nas prateleiras de forma organizada, separados por grupos, respeitando empilhamento máximo', category: 'Armazenagem - Estoque Seco', legislation: 'RDC 216/2004' },
      { id: 'hip59', text: 'Dispor alimentos sobre estrados afastados do piso e paredes', category: 'Armazenagem - Estoque Seco', legislation: 'RDC 216/2004' },
      { id: 'hip60', text: 'Utilizar prateleiras de material liso, resistente e de fácil limpeza', category: 'Armazenagem - Estoque Seco', legislation: 'RDC 216/2004' },
      
      // ARMAZENAGEM - REFRIGERAÇÃO/CONGELAMENTO
      { id: 'hip61', text: 'Dispor alimentos no equipamento permitindo circulação do ar, distantes entre si e das paredes, sem superlotação', category: 'Armazenagem - Refrigeração', legislation: 'RDC 216/2004' },
      { id: 'hip62', text: 'Utilizar plástico transparente de uso único para proteger alimentos; não utilizar sacola de supermercado ou material reciclado', category: 'Armazenagem - Refrigeração', legislation: 'RDC 216/2004' },
      { id: 'hip63', text: 'Distribuir alimentos evitando contaminação cruzada (superior: carnes; intermediário: leite, frios; inferior: frutas, verduras)', category: 'Armazenagem - Refrigeração', legislation: 'RDC 216/2004' },
      { id: 'hip64', text: 'Controlar periodicamente a temperatura dos alimentos armazenados, registrando em planilhas', category: 'Armazenagem - Refrigeração', legislation: 'RDC 216/2004' },
      { id: 'hip65', text: 'Não armazenar perecíveis em cubas ou gavetas sem controle de temperatura', category: 'Armazenagem - Refrigeração', legislation: 'RDC 216/2004' },
      
      // ARMAZENAGEM - GERAL
      { id: 'hip66', text: 'Separar e identificar produtos não conformes (vencidos, devolvidos, deteriorados) até destinação', category: 'Armazenagem - Geral', legislation: 'RDC 216/2004' },
      { id: 'hip67', text: 'Ao transferir alimento para outro recipiente, identificar com nome, marca, lote, data de abertura e nova validade', category: 'Armazenagem - Geral', legislation: 'RDC 216/2004' },
      { id: 'hip68', text: 'Identificar produtos após abertura com data e nova validade', category: 'Armazenagem - Geral', legislation: 'RDC 216/2004' },
      { id: 'hip69', text: 'Conservar industrializados conforme recomendação do fabricante', category: 'Armazenagem - Geral', legislation: 'RDC 216/2004' },
      { id: 'hip70', text: 'Fechar adequadamente alimentos não utilizados em sua totalidade, identificando após abertura', category: 'Armazenagem - Geral', legislation: 'RDC 216/2004' },
      { id: 'hip71', text: 'Identificar alimentos produzidos no local com data de produção e validade', category: 'Armazenagem - Geral', legislation: 'RDC 216/2004' },
      { id: 'hip72', text: 'Controlar validade dos produtos de acordo com legislação específica', category: 'Armazenagem - Geral', legislation: 'RDC 216/2004' },
      { id: 'hip73', text: 'Organizar armários e freezers; não deixar alimento desprovido de proteção', category: 'Armazenagem - Geral', legislation: 'RDC 216/2004' },
      { id: 'hip74', text: 'Manter rotulagem conforme legislação para alimentos produzidos e fracionados no local (RDC 727/2022)', category: 'Armazenagem - Geral', legislation: 'RDC 727/2022' },
      
      // PREPARAÇÃO
      { id: 'hip75', text: 'Descongelar produtos em geladeira (inferior a 5°C) quando necessário', category: 'Preparação', legislation: 'RDC 216/2004' },
      { id: 'hip76', text: 'Limpar embalagens impermeáveis antes de abrir, utilizando água corrente potável', category: 'Preparação', legislation: 'RDC 216/2004' },
      { id: 'hip77', text: 'Lavar e higienizar frutas, verduras e hortaliças com solução clorada específica e dosada para alimentos', category: 'Preparação', legislation: 'RDC 216/2004' },
      { id: 'hip78', text: 'Produzir suco com água e gelo potável', category: 'Preparação', legislation: 'RDC 216/2004' },
      { id: 'hip79', text: 'Manter descrição do procedimento de higienização de frutas e verduras disponível para autoridade sanitária', category: 'Preparação', legislation: 'RDC 216/2004' },
      { id: 'hip80', text: 'Seguir recomendações do fabricante para desinfecção de frutas, verduras e legumes', category: 'Preparação', legislation: 'RDC 216/2004' },
      { id: 'hip81', text: 'Disponibilizar molhos e condimentos em porções individuais (sachês ou bisnagas de uso único)', category: 'Preparação', legislation: 'RDC 216/2004' },
      { id: 'hip82', text: 'Identificar molhos produzidos no local com data de produção e validade em pequenos copos com tampa', category: 'Preparação', legislation: 'RDC 216/2004' },
      { id: 'hip83', text: 'Conservar molhos em temperatura de refrigeração (até 5°C) após fracionamento ou produção', category: 'Preparação', legislation: 'RDC 216/2004' },
      { id: 'hip84', text: 'Utilizar maionese com ovos liofilizados ou pasteurizados, nunca ovos crus', category: 'Preparação', legislation: 'RDC 216/2004' },
      { id: 'hip85', text: 'Comprovar procedência de todo alimento', category: 'Preparação', legislation: 'RDC 216/2004' },
      { id: 'hip86', text: 'Monitorar temperatura de perecíveis em todas as etapas de manipulação', category: 'Preparação', legislation: 'RDC 216/2004' },
      
      // OVOS
      { id: 'hip87', text: 'Armazenar ovos preferencialmente sob refrigeração ou afastados de fontes de calor', category: 'Ovos', legislation: 'RDC 216/2004' },
      { id: 'hip88', text: 'Etiquetar ovos retirados da embalagem original com data de produção, validade e procedência', category: 'Ovos', legislation: 'RDC 216/2004' },
      { id: 'hip89', text: 'Não utilizar ovos com casca rachada ou suja', category: 'Ovos', legislation: 'RDC 216/2004' },
      { id: 'hip90', text: 'Não lavar os ovos', category: 'Ovos', legislation: 'RDC 216/2004' },
      { id: 'hip91', text: 'Manipular ovos de forma que o conteúdo não entre em contato com a superfície externa da casca', category: 'Ovos', legislation: 'RDC 216/2004' },
      { id: 'hip92', text: 'Não utilizar ovos crus ou mal cozidos em preparações; usar ovos pasteurizados, desidratados ou cozidos', category: 'Ovos', legislation: 'RDC 216/2004' },
      { id: 'hip93', text: 'Preparar ovos fritos com gema dura', category: 'Ovos', legislation: 'RDC 216/2004' },
      { id: 'hip94', text: 'Verificar instrução de armazenamento para ovos líquidos e em pó industrializados', category: 'Ovos', legislation: 'RDC 216/2004' },
      
      // FINALIZAÇÃO
      { id: 'hip95', text: 'Realizar finalização após solicitação do cliente, entregando imediatamente após término', category: 'Finalização', legislation: 'RDC 216/2004' },
      { id: 'hip96', text: 'Cozinhar, assar, grelhar ou fritar todos os alimentos adequadamente (temperatura de cocção mínima 74°C)', category: 'Finalização', legislation: 'RDC 216/2004' },
      { id: 'hip97', text: 'Manter alimentos quentes acima de 60°C', category: 'Finalização', legislation: 'RDC 216/2004' },
      { id: 'hip98', text: 'Reutilizar óleo apenas quando não apresentar escurecimento, alteração de cheiro, espuma ou fumaça; não aquecer acima de 180°C', category: 'Finalização', legislation: 'RDC 216/2004' },
      
      // PESSOAL: HIGIENE, CONTROLE DE SAÚDE E CAPACITAÇÃO
      { id: 'hip99', text: 'Manter manipuladores com asseio pessoal (banho diário, unhas curtas, limpas, sem esmalte) e uniformizados', category: 'Pessoal', legislation: 'RDC 216/2004' },
      { id: 'hip100', text: 'Proibir uso de adornos pessoais durante manipulação (colares, pulseiras, brincos, piercing, relógio, anéis, alianças)', category: 'Pessoal', legislation: 'RDC 216/2004' },
      { id: 'hip101', text: 'Exigir lavagem frequente das mãos, especialmente antes do trabalho, após uso do sanitário e manipulação de material contaminado', category: 'Pessoal', legislation: 'RDC 216/2004' },
      { id: 'hip102', text: 'Proibir atos que originem contaminação nas áreas de manipulação (comer, fumar, tossir, uso de celular)', category: 'Pessoal', legislation: 'RDC 216/2004' },
      { id: 'hip103', text: 'Fornecer uniformes limpos, trocados diariamente (calça, camisa, avental sem bolsos acima da cintura, touca/rede, sapato fechado)', category: 'Pessoal', legislation: 'RDC 216/2004' },
      { id: 'hip104', text: 'Não utilizar avental plástico próximo a fontes de calor; não carregar objetos pessoais no uniforme', category: 'Pessoal', legislation: 'RDC 216/2004' },
      { id: 'hip105', text: 'Afastar funcionários com diarreia, infecções pulmonares ou faringites da manipulação de alimentos', category: 'Pessoal', legislation: 'RDC 216/2004' },
      { id: 'hip106', text: 'Impedir manipulador com cortes ou lesões de manipular alimentos, exceto se protegidos com curativo impermeável', category: 'Pessoal', legislation: 'RDC 216/2004' },
      { id: 'hip107', text: 'Adequar sanitários com tampa nos vasos, lixeiras com tampa e pedal, ventilação adequada', category: 'Pessoal', legislation: 'RDC 216/2004' },
      
      // LIXO E ÁREA EXTERNA
      { id: 'hip108', text: 'Providenciar containers com tampa em quantidade adequada, limpos, com lixo em sacos plásticos fechados', category: 'Lixo', legislation: 'RDC 216/2004' },
      { id: 'hip109', text: 'Armazenar lixo reciclado adequadamente', category: 'Lixo', legislation: 'RDC 216/2004' },
      { id: 'hip110', text: 'Manter área externa limpa, sem mato', category: 'Área Externa', legislation: 'RDC 216/2004' },
    ]
  },
  {
    id: 'restaurante_analise_risco',
    name: 'Restaurante por Análise de Risco',
    description: 'Restaurantes e similares com classificação por análise de risco (I-Imprescindível, N-Necessário, R-Recomendável)',
    icon: 'ClipboardCheck',
    legislationBase: 'Portaria SMS-G n°2619/11 (SP) adaptada à legislação municipal',
    items: [
      // RECEBIMENTO/COMPRA
      { id: 'rar1', text: '[R] Exigir matérias-primas e produtos industrializados de empresas licenciadas pelos órgãos de vigilância sanitária', category: 'Recebimento/Compra', legislation: 'Portaria SMS-G 2619/11 Subitem 5.7 IV' },
      { id: 'rar2', text: '[N] Verificar nos produtos adquiridos: validade, denominação de venda, lista de ingredientes, conteúdo líquido, lote, registro, características sensoriais e integridade das embalagens', category: 'Recebimento/Compra', legislation: 'Portaria SMS-G 2619/11 Subitem 5.7 I a IV, VIII e IX' },
      { id: 'rar3', text: '[N] Exigir que entregadores usem uniformes limpos', category: 'Recebimento/Compra', legislation: 'Portaria SMS-G 2619/11 Subitem 5.6' },
      { id: 'rar4', text: '[N] Exigir que carnes/pescados sejam transportados em veículos limpos, fechados e refrigerados', category: 'Recebimento/Compra', legislation: 'Portaria SMS-G 2619/11 Sub-itens 5.6, 10.5, 10.8' },
      { id: 'rar5', text: '[N] Exigir que demais alimentos sejam transportados em veículos limpos, fechados e/ou refrigerados quando necessário', category: 'Recebimento/Compra', legislation: 'Portaria SMS-G 2619/11 Subitem 5.6, 10.5, 10.8' },
      { id: 'rar6', text: '[I] Verificar temperaturas no recebimento: pescado +3ºC; carnes +7°C; refrigerados +10°C; congelados –12ºC', category: 'Recebimento/Compra', legislation: 'Portaria SMS-G 2619/11 Subitem 5.7 VI' },
      
      // ARMAZENAMENTO
      { id: 'rar7', text: '[N] Armazenar produtos sobre estrados/paletes, em local exclusivo, limpo, arejado, protegido de pragas e organizado (PEPS/PVPS)', category: 'Armazenamento', legislation: 'Portaria SMS-G 2619/11 Subitem 6.1 VII, IX' },
      { id: 'rar8', text: '[N] Manter embalagens de industrializados íntegras e com identificação/rótulo visível', category: 'Armazenamento', legislation: 'Portaria SMS-G 2619/11 Subitem 6.1 VIII' },
      { id: 'rar9', text: '[N] Armazenar produtos de limpeza separados dos alimentos', category: 'Armazenamento', legislation: 'Portaria SMS-G 2619/11 Subitem 6.1 III' },
      { id: 'rar10', text: '[I] Armazenar perecíveis em equipamento refrigerado (carnes: 4°C; pescados: 2°C; hortifruti: 10°C; congelados: -18°C ou conforme fabricante)', category: 'Armazenamento', legislation: 'Portaria SMS-G 2619/11 Subitem 6.29, 6.30' },
      
      // GELADEIRA/FREEZER
      { id: 'rar11', text: '[N] Instalar geladeira e freezer longe de fontes de calor (forno, fogão)', category: 'Geladeira/Freezer', legislation: 'Portaria SMS-G 2619/11 Subitem 3.18' },
      { id: 'rar12', text: '[N] Manter geladeira e freezer em bom estado de conservação', category: 'Geladeira/Freezer', legislation: 'Portaria SMS-G 2619/11 Subitens 3.1' },
      { id: 'rar13', text: '[N] Manter espessura do gelo inferior a 1 cm', category: 'Geladeira/Freezer', legislation: 'Portaria SMS-G 2619/11 Subitem 6.32' },
      { id: 'rar14', text: '[N] Manter geladeira e freezer limpos e organizados, com produtos separados por categorias', category: 'Geladeira/Freezer', legislation: 'Portaria SMS-G 2619/11 Subitens 6.14' },
      { id: 'rar15', text: '[I] Regular freezer para manter congelados a -18°C ou conforme fabricante', category: 'Geladeira/Freezer', legislation: 'Portaria SMS-G 2619/11 Subitem 6.29' },
      
      // CÂMARA FRIA
      { id: 'rar16', text: '[N] Revestir câmara fria com material liso, resistente e impermeável, livre de ralos, grelhas, gotejamento', category: 'Câmara Fria', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar17', text: '[N] Vedar porta da câmara fria e providenciar dispositivo de segurança para abertura interna', category: 'Câmara Fria', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar18', text: '[N] Instalar termômetro no lado externo indicando temperatura interna da câmara', category: 'Câmara Fria', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar19', text: '[I] Armazenar carnes/pescado em câmara fria adequadamente (carnes: +4°C; pescado: +2°C ou congelados a -18°C)', category: 'Câmara Fria', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar20', text: '[I] Armazenar hortifruti e outros produtos em temperatura adequada (até +10°C ou conforme fabricante), registrando em planilhas', category: 'Câmara Fria', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar21', text: '[N] Providenciar estrado de material de fácil limpeza, liso, resistente e impermeável', category: 'Câmara Fria', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar22', text: '[N] Adequar periodicidade e procedimentos de higienização', category: 'Câmara Fria', legislation: 'Portaria SMS-G 2619/11' },
      
      // CONTROLE DE QUALIDADE
      { id: 'rar23', text: '[N] Monitorar e registrar diariamente temperatura de equipamentos de frio e térmicos', category: 'Controle de Qualidade', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar24', text: '[N] Não utilizar alimentos com prazo de validade vencido', category: 'Controle de Qualidade', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar25', text: '[N] Identificar e separar produtos para devolução', category: 'Controle de Qualidade', legislation: 'Portaria SMS-G 2619/11' },
      
      // EQUIPAMENTOS
      { id: 'rar26', text: '[N] Providenciar número de equipamentos e mobiliário compatível com o volume de produção', category: 'Equipamentos', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar27', text: '[N] Limpar e desinfetar equipamentos/utensílios em contato com alimentos contaminados antes de contato com prontos para consumo', category: 'Equipamentos', legislation: 'Portaria SMS-G 2619/11 Subitem 4.9, 7.7, 7.8' },
      { id: 'rar28', text: '[N] Calibrar equipamentos de medição (balanças, termômetros) por empresa qualificada, mantendo registros', category: 'Equipamentos', legislation: 'Portaria SMS-G 2619/11 Subitem 3.4' },
      { id: 'rar29', text: '[N] Revestir equipamentos com material sanitário atóxico, mantendo conservados, limpos e desinfetados', category: 'Equipamentos', legislation: 'Portaria SMS-G 2619/11 Subitens 3.7 e 3.20' },
      { id: 'rar30', text: '[N] Manter mesas, bancadas, armários, pias, cubas e tanques revestidos de material sanitário, conservados e limpos', category: 'Equipamentos', legislation: 'Portaria SMS-G 2619/11 Subitem 3.5' },
      
      // LIMPEZA E DESINFECÇÃO
      { id: 'rar31', text: '[N] Adequar periodicidade e procedimentos de higienização', category: 'Limpeza e Desinfecção', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar32', text: '[N] Manter ambiente interno e externo, equipamentos e utensílios organizados, limpos e desinfetados', category: 'Limpeza e Desinfecção', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar33', text: '[N] Utilizar produtos de higienização registrados no Ministério da Saúde', category: 'Limpeza e Desinfecção', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar34', text: '[N] Realizar etapa de higienização em área própria ou de forma a evitar contaminação cruzada', category: 'Limpeza e Desinfecção', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar35', text: '[N] Manter utensílios limpos, sem pontos escuros ou amassamentos', category: 'Limpeza e Desinfecção', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar36', text: '[N] Limpar e desinfetar utensílios a cada uso', category: 'Limpeza e Desinfecção', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar37', text: '[N] Remover caixas de madeira ou papelão da área de manipulação', category: 'Limpeza e Desinfecção', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar38', text: '[N] Manter embalagens dos ingredientes fechadas, limpas e adequadamente armazenadas', category: 'Limpeza e Desinfecção', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar39', text: '[N] Não utilizar panos convencionais ou de prato para secagem de mãos e utensílios', category: 'Limpeza e Desinfecção', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar40', text: '[N] Não utilizar escovas de metal, lã de aço ou materiais abrasivos na limpeza de equipamentos', category: 'Limpeza e Desinfecção', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar41', text: '[N] Lavar uniformes e panos de limpeza fora da área de produção', category: 'Limpeza e Desinfecção', legislation: 'Portaria SMS-G 2619/11' },
      
      // MANIPULAÇÃO
      { id: 'rar42', text: '[N] Realizar manipulação sem cruzamento de atividades; separar área suja da área limpa por barreira física ou técnica', category: 'Manipulação', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar43', text: '[I] Manipular perecíveis em temperatura ambiente respeitando prazo máximo de 30 minutos', category: 'Manipulação', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar44', text: '[I] Atingir temperatura mínima de 70ºC no centro geométrico durante cocção', category: 'Manipulação', legislation: 'Portaria SMS-G 2619/11 Subitem 7.15, 7.16' },
      { id: 'rar45', text: '[N] Efetuar descongelamento em temperatura inferior a 5°C ou em micro-ondas quando for submetido imediatamente a cocção', category: 'Manipulação', legislation: 'Portaria SMS-G 2619/11 Subitem 7.17' },
      { id: 'rar46', text: '[N] Não recongelar alimentos descongelados', category: 'Manipulação', legislation: 'Portaria SMS-G 2619/11 Subitem 7.19' },
      { id: 'rar47', text: '[I] Manter óleo de fritura sem alteração de cor, odor ou espuma (160°C a 180°C, tolerância até 190°C); armazenar adequadamente', category: 'Manipulação', legislation: 'Portaria SMS-G 2619/11 Subitem 7.24' },
      { id: 'rar48', text: '[N] Acondicionar resíduos de óleo em recipientes rígidos, fechados, fora da produção', category: 'Manipulação', legislation: 'Portaria SMS-G 2619/11 Subitens 13.8, 13.9' },
      { id: 'rar49', text: '[N] Lavar e desinfetar frutas, legumes e verduras com produtos registrados no MS', category: 'Manipulação', legislation: 'Portaria SMS-G 2619/11 Subitem 7.11' },
      { id: 'rar50', text: '[N] Fechar adequadamente embalagens após uso e armazenar conforme fabricante', category: 'Manipulação', legislation: 'Portaria SMS-G 2619/11 Subitens 6.8, 6.9' },
      { id: 'rar51', text: '[N] Utilizar ovos pasteurizados, desidratados ou cozidos em preparações que necessitem de ovos', category: 'Manipulação', legislation: 'Portaria SMS-G 2619/11 Subitem 7.27 III' },
      { id: 'rar52', text: '[N] Descartar ou separar e identificar produtos vencidos para troca', category: 'Manipulação', legislation: 'Portaria SMS-G 2619/11 Subitens 6.1.2' },
      { id: 'rar53', text: '[I] Manter preparações quentes em distribuição à temperatura mínima de 60ºC por até 6 horas ou abaixo de 60ºC por até 1 hora', category: 'Manipulação', legislation: 'Portaria SMS-G 2619/11 Subitem 9.24 I' },
      { id: 'rar54', text: '[I] Manter alimentos frios no máximo a 10°C por 4 horas ou entre 10°C e 21°C por 2 horas', category: 'Manipulação', legislation: 'Portaria SMS-G 2619/11 Subitem 9.24 II' },
      { id: 'rar55', text: '[N] Reaquecer sobras aproveitadas à temperatura mínima de 70°C', category: 'Manipulação', legislation: 'Portaria SMS-G 2619/11 Subitem 7.28' },
      { id: 'rar56', text: '[N] Identificar produtos preparados/fracionados na presença do consumidor com nome, quantidade, ingredientes, preço e validade', category: 'Manipulação', legislation: 'Portaria SMS-G 2619/11 Subitem 8.2.2' },
      { id: 'rar57', text: '[N] Guardar amostras das preparações confeccionadas por 96 horas', category: 'Manipulação', legislation: 'Portaria SMS-G 2619/11 Subitem 14.5.2' },
      
      // ÁREA DE VENDA
      { id: 'rar58', text: '[N] Proteger alimentos expostos à venda contra poeira, pragas e contaminações externas', category: 'Área de Venda', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar59', text: '[N] Retirar diariamente produtos vencidos da área de venda', category: 'Área de Venda', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar60', text: '[N] Acondicionar sobras de produtos fracionados em embalagens adequadas com informações do rótulo original', category: 'Área de Venda', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar61', text: '[I] Manter balcão térmico limpo com água tratada, trocada diariamente, à temperatura de 80 a 90ºC', category: 'Área de Venda', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar62', text: '[N] Providenciar lacre ou selo nas embalagens de produtos para delivery garantindo inviolabilidade', category: 'Área de Venda', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar63', text: '[N] Afixar cartaz sobre proibição de venda de bebida alcoólica para menores de 18 anos', category: 'Área de Venda', legislation: 'Portaria SMS-G 2619/11' },
      
      // ÁGUA
      { id: 'rar64', text: '[N] Manter reservatório com superfície lisa, sem rachaduras, com tampa íntegra impedindo acesso de animais', category: 'Água', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar65', text: '[I] Lavar e desinfetar reservatórios no mínimo a cada 6 meses', category: 'Água', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar66', text: '[N] Providenciar licença de outorga para exploração de água de poço', category: 'Água', legislation: 'Portaria SMS-G 2619/11' },
      { id: 'rar67', text: '[N] Tratar água de fonte alternativa e apresentar laudo de análise laboratorial', category: 'Água', legislation: 'Portaria SMS-G 2619/11 Subitem 11.8.1' },
      { id: 'rar68', text: '[N] Apresentar cópia da análise de cloro residual livre de cada carga de água transportada por caminhão pipa e nota fiscal', category: 'Água', legislation: 'Portaria SMS-G 2619/11 Subitem 11.12' },
      { id: 'rar69', text: '[I] Produzir gelo com água potável ou utilizar gelo industrializado embalado e rotulado', category: 'Água', legislation: 'Portaria SMS-G 2619/11 Subitem 11.3, 11.4' },
      
      // RESÍDUOS
      { id: 'rar70', text: '[N] Acondicionar lixo em sacos plásticos separados (seco e orgânico) em recipientes com tampa acionada por pedal', category: 'Resíduos', legislation: 'Portaria SMS-G 2619/11 Subitem 13.2' },
      { id: 'rar71', text: '[N] Manter recipientes de fácil limpeza e lavá-los quando necessário', category: 'Resíduos', legislation: 'Portaria SMS-G 2619/11 Subitens 2.2.2' },
      { id: 'rar72', text: '[N] Retirar lixo da área de manipulação pelo menos 1 vez ao dia', category: 'Resíduos', legislation: 'Portaria SMS-G 2619/11 Subitem 13.2' },
      { id: 'rar73', text: '[N] Providenciar local próprio e adequado para armazenamento externo do lixo, protegido de chuva, sol, animais e pragas', category: 'Resíduos', legislation: 'Portaria SMS-G 2619/11 Subitem 2.2.1' },
      { id: 'rar74', text: '[N] Acondicionar lixo na via pública impedindo vazamentos e odores', category: 'Resíduos', legislation: 'Portaria SMS-G 2619/11 Subitem 13.1' },
      
      // CONTROLE INTEGRADO DE PRAGAS
      { id: 'rar75', text: '[N] Proteger janelas, portas e aberturas com telas milimétricas de 2mm', category: 'Controle de Pragas', legislation: 'Portaria SMS-G 2619/11 Subitem 24.9, 2.4.8' },
      { id: 'rar76', text: '[N] Sifonar e fechar ralos e grelhas', category: 'Controle de Pragas', legislation: 'Portaria SMS-G 2619/11 Subitem 2.3.3' },
      { id: 'rar77', text: '[N] Ajustar portas aos batentes com proteção inferior contra insetos e roedores e mola', category: 'Controle de Pragas', legislation: 'Portaria SMS-G 2619/11 Subitem 2.4.8' },
      { id: 'rar78', text: '[N] Contratar empresa credenciada para aplicação de desinfestantes', category: 'Controle de Pragas', legislation: 'Portaria SMS-G 2619/11 Subitem 12.4.2' },
      { id: 'rar79', text: '[N] Apresentar proposta da empresa contratada com medidas preventivas e relatório técnico', category: 'Controle de Pragas', legislation: 'Portaria SMS-G 2619/11 Subitem 12.4.1' },
      { id: 'rar80', text: '[N] Apresentar certificado de execução do serviço com produtos utilizados, métodos, registro MS e responsável técnico', category: 'Controle de Pragas', legislation: 'Portaria SMS-G 2619/11 Subitem 17.3 XXIII' },
      
      // INSTALAÇÕES/EDIFICAÇÃO
      { id: 'rar81', text: '[N] Manter acesso livre, independente e sem comunicação direta com dependências residenciais', category: 'Instalações/Edificação', legislation: 'Portaria SMS-G 2619/11 Subitem 2.3.2' },
      { id: 'rar82', text: '[N] Manter arredores livres de sucatas, lixo, animais e agentes contaminantes', category: 'Instalações/Edificação', legislation: 'Portaria SMS-G 2619/11 Subitem 2.1' },
      { id: 'rar83', text: '[N] Revestir paredes, tetos e pisos com material de fácil limpeza', category: 'Instalações/Edificação', legislation: 'Portaria SMS-G 2619/11' },
      
      // SANITÁRIOS E VESTIÁRIOS FUNCIONÁRIOS
      { id: 'rar84', text: '[N] Adequar sanitários com piso/paredes/teto lisos, ventilação, telas 2mm, porta com mola, em bom estado e higiene', category: 'Sanitários Funcionários', legislation: 'Portaria SMS-G 2619/11 Subitem 2.4.5-2.4.9' },
      { id: 'rar85', text: '[N] Providenciar vasos sanitários com assento e tampa', category: 'Sanitários Funcionários', legislation: 'Portaria SMS-G 2619/11 Subitem 2.4.20 II' },
      { id: 'rar86', text: '[N] Descartar papel higiênico em lixeira com pedal e tampa (mulheres) ou vaso sanitário se ligado à rede de esgoto', category: 'Sanitários Funcionários', legislation: 'Portaria SMS-G 2619/11 Subitem 2.4.20 IV' },
      { id: 'rar87', text: '[N] Providenciar pia, sabonete líquido antisséptico e toalha descartável para higienização das mãos', category: 'Sanitários Funcionários', legislation: 'Portaria SMS-G 2619/11 Subitem 15.21' },
      { id: 'rar88', text: '[N] Providenciar 1 chuveiro para cada 20 funcionários', category: 'Sanitários Funcionários', legislation: 'Portaria SMS-G 2619/11 Subitem 2.4.20' },
      { id: 'rar89', text: '[N] Providenciar armários em número suficiente e bom estado nos vestiários', category: 'Sanitários Funcionários', legislation: 'Portaria SMS-G 2619/11 Subitem 2.4.21' },
      
      // SANITÁRIOS PARA O PÚBLICO
      { id: 'rar90', text: '[N] Adequar sanitários públicos com material liso, ventilação, telas, porta com mola e proteção no rodapé', category: 'Sanitários Público', legislation: 'Portaria SMS-G 2619/11 Subitem 2.4.5-2.4.9' },
      { id: 'rar91', text: '[N] Providenciar pia, sabão líquido e toalha de papel ou outro método de secagem', category: 'Sanitários Público', legislation: 'Portaria SMS-G 2619/11 Subitem 15.23' },
      { id: 'rar92', text: '[N] Providenciar cestos de lixo com pedal e tampa para descarte de papéis', category: 'Sanitários Público', legislation: 'Portaria SMS-G 2619/11 Subitem 2.4.22 IV' },
      
      // HIGIENE DAS INSTALAÇÕES
      { id: 'rar93', text: '[N] Manter piso, rodapé, maçanetas, ralos, pias, mesas, equipamentos e sanitários em condições de higiene adequadas', category: 'Higiene das Instalações', legislation: 'Portaria SMS-G 2619/11 Subitem 2.3, 2.4.3.2' },
      { id: 'rar94', text: '[N] Manter luminárias, forros e caixa de gordura em condições de higiene adequadas', category: 'Higiene das Instalações', legislation: 'Portaria SMS-G 2619/11 Subitem 2.4.7, 2.4.27' },
      { id: 'rar95', text: '[N] Utilizar produtos desinfetantes registrados no Ministério da Saúde', category: 'Higiene das Instalações', legislation: 'Portaria SMS-G 2619/11 Subitem 4.7' },
      { id: 'rar96', text: '[N] Observar instruções de modo de uso que constam no rótulo do produto', category: 'Higiene das Instalações', legislation: 'Portaria SMS-G 2619/11 Subitem 4.7' },
      { id: 'rar97', text: '[N] Manter paredes, portas, prateleiras e janelas em condições de higiene adequadas, lavando e desinfetando quando necessário', category: 'Higiene das Instalações', legislation: 'Portaria SMS-G 2619/11 Subitens 2.4.6, 2.4.8, 2.4.9, 3.1' },
      
      // DOCUMENTAÇÃO
      { id: 'rar98', text: '[N] Elaborar e cumprir Manual de Boas Práticas específico para a empresa', category: 'Documentação', legislation: 'Portaria SMS-G 2619/11 Subitem 15.37, 17.2 VIII' },
      { id: 'rar99', text: '[N] Elaborar e cumprir procedimentos operacionais padronizados (POPs)', category: 'Documentação', legislation: 'Portaria SMS-G 2619/11 Subitem 17.2 VI' },
      { id: 'rar100', text: '[N] Apresentar comprovante de execução de treinamento de funcionários', category: 'Documentação', legislation: 'Portaria SMS-G 2619/11 Subitens 17.2 VII' },
      { id: 'rar101', text: '[N] Apresentar Programa de Saúde: PPRA, PCMSO, ASO', category: 'Documentação', legislation: 'Portaria SMS-G 2619/11 Subitens 17.2 II, III, IV' },
      { id: 'rar102', text: '[N] Apresentar comprovante de higienização do reservatório de água semestral', category: 'Documentação', legislation: 'Portaria SMS-G 2619/11 Subitem 17.2 V' },
      { id: 'rar103', text: '[N] Apresentar comprovante de controle integrado de vetores e pragas urbanas', category: 'Documentação', legislation: 'Portaria SMS-G 2619/11 Subitem 17.3 XXIII' },
      { id: 'rar104', text: '[N] Manter planilhas de controle de temperatura de câmaras, balcões, congeladores e equipamentos térmicos', category: 'Documentação', legislation: 'Portaria SMS-G 2619/11 Subitem 17.3 IV' },
      { id: 'rar105', text: '[N] Apresentar registros comprovando calibração dos instrumentos e equipamentos de medição', category: 'Documentação', legislation: 'Portaria SMS-G 2619/11 Subitem 17.3 XXIV' },
      { id: 'rar106', text: '[N] Apresentar registros que comprovem manutenção preventiva de equipamentos e maquinários', category: 'Documentação', legislation: 'Portaria SMS-G 2619/11 Subitem 17.3 XXV' },
      { id: 'rar107', text: '[N] Utilizar produtos de higienização de alimentos, equipamentos e antissépticos regularizados no MS', category: 'Documentação', legislation: 'Portaria SMS-G 2619/11 Subitens 4.7, 7.11' },
      
      // MANIPULADORES
      { id: 'rar108', text: '[N] Exercer responsabilidade técnica por profissional legalmente habilitado', category: 'Manipuladores', legislation: 'Portaria SMS-G 2619/11 Subitem 16.1' },
      { id: 'rar109', text: '[N] Para EPP ou ME: proprietário ou pessoa designada com certificado de curso de Boas Práticas', category: 'Manipuladores', legislation: 'Portaria SMS-G 2619/11 Subitem 16.1.2' },
      { id: 'rar110', text: '[N] Treinar manipuladores pelo proprietário ou pessoa que participou do Curso de Boas Práticas', category: 'Manipuladores', legislation: 'Portaria SMS-G 2619/11 Subitem 16.1.4' },
      { id: 'rar111', text: '[N] Manter cópias dos atestados ASO com exames clínicos semestrais disponíveis para fiscalização', category: 'Manipuladores', legislation: 'Portaria SMS-G 2619/11 Subitem 17.2 III' },
      { id: 'rar112', text: '[N] Elaborar e cumprir PPRA', category: 'Manipuladores', legislation: 'Portaria SMS-G 2619/11 Subitem 17.2 IV' },
      { id: 'rar113', text: '[N] Manter funcionários asseados, sem adornos, unhas curtas e limpas, sem esmalte, maquiagem ou piercing', category: 'Manipuladores', legislation: 'Portaria SMS-G 2619/11 Subitens 15.1, 15.2' },
      { id: 'rar114', text: '[I] Manter mãos limpas e livres de ferimentos; se existirem, proteger com cobertura impermeável', category: 'Manipuladores', legislation: 'Portaria SMS-G 2619/11 Subitem 15.33' },
      { id: 'rar115', text: '[R] Utilizar luvas descartáveis na manipulação de produtos prontos para consumo', category: 'Manipuladores', legislation: 'Portaria SMS-G 2619/11 Subitem 15.12' },
      { id: 'rar116', text: '[N] Exigir uniformes fechados, cor clara, limpos e bem conservados', category: 'Manipuladores', legislation: 'Portaria SMS-G 2619/11 Subitem 15.3' },
      { id: 'rar117', text: '[N] Exigir sapatos limpos, fechados, antiderrapantes ou botas de borracha de uso exclusivo', category: 'Manipuladores', legislation: 'Portaria SMS-G 2619/11 Subitem 15.3' },
      { id: 'rar118', text: '[N] Exigir cabelos protegidos por toucas ou redes', category: 'Manipuladores', legislation: 'Portaria SMS-G 2619/11 Subitem 15.1 II' },
      { id: 'rar119', text: '[N] Exigir barba feita e bigode aparado', category: 'Manipuladores', legislation: 'Portaria SMS-G 2619/11 Subitem 15.1 III' },
      { id: 'rar120', text: '[N] Providenciar pia exclusiva para lavagem das mãos com sabonete líquido antisséptico e papel toalha não reciclado', category: 'Manipuladores', legislation: 'Portaria SMS-G 2619/11 Subitem 15.21' },
      { id: 'rar121', text: '[R] Afixar cartazes orientando a lavagem e desinfecção das mãos', category: 'Manipuladores', legislation: 'Portaria SMS-G 2619/11 Subitem 15.24' },
      { id: 'rar122', text: '[N] Exigir uso de EPIs: uniforme, avental, botas, luvas, capas', category: 'Manipuladores', legislation: 'Portaria SMS-G 2619/11 Subitens 15.13-15.19' },
    ]
  },
  {
    id: 'dengue_arboviroses',
    name: 'Dengue e Arboviroses',
    description: 'Controle e combate ao Aedes aegypti',
    icon: 'Bug',
    legislationBase: 'LM 8887/2010, LM 9631/2015, LM 9731/2015 e LM 9904/2016',
    items: [
      { id: 'den1', text: 'Adotar medidas necessárias à manutenção do local isento de água parada', category: 'Controle de Vetores', legislation: 'LM 8887/2010' },
      { id: 'den2', text: 'Eliminar recipientes que possam acumular água e servir de criadouro', category: 'Controle de Vetores', legislation: 'LM 8887/2010' },
      { id: 'den3', text: 'Manter caixas d\'água, cisternas e reservatórios vedados', category: 'Controle de Vetores', legislation: 'LM 9631/2015' },
      { id: 'den4', text: 'Descartar adequadamente materiais que acumulam água (pneus, garrafas, vasos)', category: 'Controle de Vetores', legislation: 'LM 9631/2015' },
      { id: 'den5', text: 'Manter calhas, lajes e áreas descobertas sem acúmulo de água', category: 'Controle de Vetores', legislation: 'LM 9731/2015' },
      { id: 'den6', text: 'Permitir acesso dos agentes de saúde para inspeção', category: 'Controle de Vetores', legislation: 'LM 9731/2015' },
      { id: 'den7', text: 'Implementar rotina periódica de vistoria em áreas externas', category: 'Controle de Vetores', legislation: 'LM 9904/2016' },
      { id: 'den8', text: 'Manter ralos com tela ou tampa adequada', category: 'Controle de Vetores', legislation: 'LM 9904/2016' },
      { id: 'den9', text: 'Evitar acúmulo de lixo e materiais inservíveis nas dependências', category: 'Controle de Vetores', legislation: 'LM 9904/2016' },
      { id: 'den10', text: 'Manter piscinas e espelhos d\'água tratados ou cobertos', category: 'Controle de Vetores', legislation: 'LM 9904/2016' },
    ]
  },
  {
    id: 'checklist_basico',
    name: 'Checklist Básico - Alimentos',
    description: 'Checklist geral para inspeção de estabelecimentos alimentícios',
    icon: 'ClipboardList',
    legislationBase: 'RDC 216/2004, LM 8741/08, Portaria 1288/95',
    items: [
      { id: 'cb1', text: 'Regularizar documentos junto à Prefeitura (CNPJ/MEI, Inscrição Municipal, Alvará Sanitário, Certificado de Vistoria de Veículo, Projeto Arquitetônico Sanitário)', category: 'Documentação', legislation: 'LM 8741/08' },
      { id: 'cb2', text: 'Apresentar Certificado do Corpo de Bombeiros atual', category: 'Documentação', legislation: 'Lei Estadual 20.498/2019' },
      { id: 'cb3', text: 'Higienizar caixa d\'água de 6 em 6 meses (apresentar comprovante)', category: 'Documentação', legislation: 'RDC 216/2004 item 4.4.4' },
      { id: 'cb4', text: 'Realizar desinsetização periódica com empresa especializada (apresentar laudo). Deve estar sem pragas', category: 'Controle de Pragas', legislation: 'RDC 216/2004 item 4.3.2' },
      { id: 'cb5', text: 'Realizar manutenção de equipamentos, termômetro, ar-condicionado, filtro de água, freezer (comprovante)', category: 'Equipamentos', legislation: 'RDC 216/2004 item 4.1.17' },
      { id: 'cb6', text: 'Contratar Responsável Técnico (apresentar contrato)', category: 'Documentação', legislation: 'RDC 216/2004' },
      { id: 'cb7', text: 'Capacitar os manipuladores em Curso de Boas Práticas de Manipulação em Serviços de Alimentação (apresentar certificado). Sugestão: site ENAP (governo, online, gratuito)', category: 'Pessoal', legislation: 'RDC 216/2004 item 4.6.7' },
      { id: 'cb8', text: 'Providenciar Manual de Boas Práticas de Manipulação de Alimentos atualizado e implementar as ações', category: 'Documentação', legislation: 'RDC 216/2004 item 4.11.1' },
      { id: 'cb9', text: 'Apresentar planilhas de controle de temperatura', category: 'Documentação', legislation: 'RDC 216/2004 item 4.7.3' },
      { id: 'cb10', text: 'Isolar salas de manipulação', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.1' },
      { id: 'cb11', text: 'Manter piso, parede e teto lisos, impermeáveis e laváveis', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.3' },
      { id: 'cb12', text: 'Corrigir vidros das janelas (quebrados)', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.4' },
      { id: 'cb13', text: 'Manter instalações elétricas e hidráulicas íntegras', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.5' },
      { id: 'cb14', text: 'Higienizar e reparar caixas de gordura e de esgoto', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.2.2' },
      { id: 'cb15', text: 'Providenciar ralos abre-e-fecha e mantê-los fechados', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.5' },
      { id: 'cb16', text: 'Colocar porta nas salas de manipulação e depósito', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.4' },
      { id: 'cb17', text: 'Instalar dispositivo de fechamento automático (mola) nas portas das salas de manipulação, depósitos, sanitários e vestiários. Manter as portas fechadas', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.4' },
      { id: 'cb18', text: 'Telar todas as aberturas das salas de manipulação e depósito com tela milimétrica resistente e removível', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.4' },
      { id: 'cb19', text: 'Retirar ventilador das salas de manipulação e providenciar outro meio de exaustão', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.10' },
      { id: 'cb20', text: 'Climatizar sala de desossa / confeitaria / sala de fatiamento de frios (ar-condicionado)', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.5.4' },
      { id: 'cb21', text: 'Armazenar alimentos, bebidas, embalagens e utensílios em paletes ou prateleiras lisas, impermeáveis e laváveis, nunca diretamente no chão (20 cm de altura, no mínimo)', category: 'Armazenamento', legislation: 'RDC 216/2004 item 4.7.6' },
      { id: 'cb22', text: 'Respeitar o empilhamento máximo de caixas', category: 'Armazenamento', legislation: 'RDC 216/2004' },
      { id: 'cb23', text: 'Manter superfícies de móveis, equipamentos e utensílios lisas, impermeáveis, laváveis, retirando coberturas (tecido, plástico, papel alumínio, papelão) e contaminantes (ferrugem, mofo, crostas de gordura)', category: 'Equipamentos', legislation: 'RDC 216/2004 item 4.1.17' },
      { id: 'cb24', text: 'Não utilizar utensílios de madeira, vime e isopor', category: 'Equipamentos', legislation: 'RDC 216/2004 item 4.1.17' },
      { id: 'cb25', text: 'Trocar feltro da modeladora de pães', category: 'Equipamentos', legislation: 'RDC 216/2004' },
      { id: 'cb26', text: 'Substituir panos de prato de tecido por panos descartáveis (tipo Perfex)', category: 'Higiene', legislation: 'RDC 216/2004 item 4.1.14' },
      { id: 'cb27', text: 'Instalar lavatório exclusivo para higiene das mãos nas salas de manipulação, com sabonete líquido, papel-toalha e lixeira com tampa a pedal. Afixar cartaz de orientação', category: 'Higiene', legislation: 'RDC 216/2004 item 4.1.14' },
      { id: 'cb28', text: 'Manter sanitários com sabonete líquido, papel-toalha, papel higiênico, lixeira com tampa a pedal, tampa no vaso sanitário e acabamento da descarga. Manter limpo', category: 'Higiene', legislation: 'RDC 216/2004 item 4.1.13' },
      { id: 'cb29', text: 'Armazenar utensílios e produtos de limpeza em local específico (armário). Proibido utilizar sabão caseiro', category: 'Higiene', legislation: 'RDC 216/2004 item 4.2.5' },
      { id: 'cb30', text: 'Providenciar lixeiras com tampa acionada sem contato manual (pedal). Nunca deixar lixo no chão', category: 'Higiene', legislation: 'RDC 216/2004 item 4.5.2' },
      { id: 'cb31', text: 'Providenciar contêiner de lixo externo fechado e com tampa', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.5.3' },
      { id: 'cb32', text: 'Providenciar lixeira separada para reciclável', category: 'Estrutura', legislation: 'RDC 216/2004' },
      { id: 'cb33', text: 'Realizar higiene rigorosa e organização de todo o estabelecimento, retirando objetos alheios e inservíveis', category: 'Higiene', legislation: 'RDC 216/2004 item 4.1.7' },
      { id: 'cb34', text: 'Realizar limpeza da área externa do estabelecimento, retirando inclusive objetos que possam acumular água', category: 'Controle de Vetores', legislation: 'LM 8887/2010' },
      { id: 'cb35', text: 'Ordenar fluxo de preparação de alimentos', category: 'Produção', legislation: 'RDC 216/2004 item 4.1.1' },
      { id: 'cb36', text: 'Não comercializar produtos ou utilizar matérias-primas sem procedência (ter rótulo, apresentar nota fiscal, possuir SIF)', category: 'Alimentos', legislation: 'LM 8741/2008 Art. 81 inc. XVI' },
      { id: 'cb37', text: 'Proteger bem os alimentos (potes com tampa, sacos plásticos de primeiro uso, filme plástico ou amarrando bem as embalagens abertas)', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.6' },
      { id: 'cb38', text: 'Respeitar o prazo de validade dos produtos industrializados indicado no rótulo, inclusive depois de abertos', category: 'Alimentos', legislation: 'LM 8741/2008 Art. 81 inc. XII' },
      { id: 'cb39', text: 'Rotular as matérias-primas abertas com data de abertura e novo prazo de validade de acordo com o fabricante', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.6' },
      { id: 'cb40', text: 'Rotular todos os produtos preparados com designação, data de fabricação e data de validade', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.18' },
      { id: 'cb41', text: 'Rotular todos os produtos embalados fora da presença do consumidor com rótulo completo (RDC 727/2022: CNPJ, ingr.)', category: 'Alimentos', legislation: 'RDC 727/2022' },
      { id: 'cb42', text: 'Respeitar a validade de 5 dias para alimentos preparados, 48 horas para alimentos cárneos manipulados e de mesmo dia para carne moída e suco de frutas', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.18' },
      { id: 'cb43', text: 'Armazenar produtos impróprios para o consumo em local separado e identificado (impróprio/troca)', category: 'Alimentos', legislation: 'RDC 216/2004' },
      { id: 'cb44', text: 'Respeitar a temperatura de armazenamento indicada no rótulo dos produtos industrializados, principalmente depois de abertos (conservas, pimentas, molhos, coberturas etc.)', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.7.3' },
      { id: 'cb45', text: 'Manter alimentos preparados quentes acima de 60°C, frios abaixo de 5°C e congelados abaixo de -18°C', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.10.3' },
      { id: 'cb46', text: 'Manter em refrigeração (abaixo de 5°C) as tortas doces (cobertura e recheio) e os hortifrutis cortados', category: 'Alimentos', legislation: 'RDC 216/2004' },
      { id: 'cb47', text: 'Lavar e desinfetar (hipoclorito de sódio) os hortifrutis antes do preparo (folhosos, laranjas etc.)', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.19' },
      { id: 'cb48', text: 'Descongelar os alimentos sob refrigeração ou em micro-ondas, nunca em temperatura ambiente ou imersão', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.3' },
      { id: 'cb49', text: 'Trocar o óleo de fritura sempre que necessário (escuro, espesso, espuma, fumaça). Apresentar planilha de troca', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.1' },
      { id: 'cb50', text: 'Os manipuladores de alimentos devem utilizar uniforme de cor clara, proteção no cabelo, sapato fechado e equipamentos de proteção individual. Retirar adornos, maquiagem e barba', category: 'Pessoal', legislation: 'RDC 216/2004 itens 4.6.3, 4.6.5' },
      { id: 'cb51', text: 'Guardar objetos pessoais em local específico (armário)', category: 'Pessoal', legislation: 'RDC 216/2004 item 4.6.3' },
      { id: 'cb52', text: 'Manipuladores de alimentos não devem manipular dinheiro', category: 'Pessoal', legislation: 'RDC 216/2004 item 4.6.5' },
      { id: 'cb53', text: 'Afixar cartaz de proibição/permissão de pets. Adequar', category: 'Estrutura', legislation: 'RDC 216/2004' },
      { id: 'cb54', text: 'Manter todos os documentos acessíveis ao auditor fiscal', category: 'Documentação', legislation: 'LM 8741/08' },
      { id: 'cb55', text: 'Manter todos os ambientes acessíveis ao auditor fiscal por todo o período em que o comércio estiver aberto', category: 'Documentação', legislation: 'LM 8741/08' },
    ]
  }
];





export const getChecklistByType = (typeId: string): ChecklistTemplate | undefined => {
  return checklistTemplates.find(c => c.id === typeId);
};

export const getAllCategories = (checklist: ChecklistTemplate): string[] => {
  const categories = new Set(checklist.items.map(item => item.category));
  return Array.from(categories);
};

// Helper para converter itens marcados em texto de termo padrão
export const generateTermoFromItems = (items: ChecklistItem[], legislationBase?: string): string => {
  const groupedByLegislation: Record<string, ChecklistItem[]> = {};
  
  items.forEach(item => {
    const leg = item.legislation || 'Legislação';
    if (!groupedByLegislation[leg]) {
      groupedByLegislation[leg] = [];
    }
    groupedByLegislation[leg].push(item);
  });

  let text = legislationBase 
    ? `Providenciar as correções assinaladas, conforme determina ${legislationBase}. A desobediência constitui infração tipificada no Art. 81, Inc. XIX, da Lei Municipal nº 8.741/08.\n\n`
    : '';
  
  items.forEach((item, idx) => {
    text += `${idx + 1}. ${item.text};\n`;
  });

  return text.trim();
};

// ============= CHECKLIST PANIFICADORAS E CONFEITARIAS =============
// Fonte: Modelo oficial PREFEITURA DE GOIÂNIA - INSPEÇÃO DE PANIFICADORAS E CONFEITARIAS (60 itens)
export const checklistPanificadora: ChecklistTemplate = {
  id: 'panificadora',
  name: 'Panificadora / Confeitaria',
  description: 'Inspeção de panificadoras e confeitarias - 60 itens',
  icon: 'Croissant',
  legislationBase: 'RDC 216/2004, LM 8741/08 Art. 81, Portaria SMS nº 0322/2008',
  items: [
    { id: 'pan1', text: 'Apresentar Alvará de Autorização Sanitária', category: 'Documentação', legislation: 'LM 8741/2008 Art. 81, I' },
    { id: 'pan2', text: 'Apresentar caderneta de Inspeção Sanitária', category: 'Documentação', legislation: 'LM 8741/2008 Art. 81, §1º' },
    { id: 'pan3', text: 'Apresentar projeto Arquitetônico aprovado pela DVISAM (para aberturas, reforma, graves problemas de fluxo)', category: 'Documentação', legislation: 'Portaria Municipal SMS nº 0322/2008' },
    { id: 'pan4', text: 'Apresentar e implantar o Manual de Boas Práticas (BPF) e os respectivos POP\'S', category: 'Documentação', legislation: 'RDC 216/2004 itens 4.11.1 e 4.11.4' },
    { id: 'pan5', text: 'Apresentar comprovante de treinamento dos manipuladores em Boas Práticas de Fabricação de Alimentos', category: 'Documentação', legislation: 'RDC 216/2004 item 4.6.7' },
    { id: 'pan6', text: 'Apresentar comprovante de higienização da caixa de água a cada seis meses', category: 'Documentação', legislation: 'RDC 216/2004 itens 4.4.4 e 4.11.7; Proibida utilização de água proveniente de fonte alternativa' },
    { id: 'pan7', text: 'Apresentar comprovante do controle integrado de Pragas e vetores', category: 'Documentação', legislation: 'RDC 216/2004 itens 4.3.2 e 4.11.6' },
    { id: 'pan8', text: 'Apresentar comprovante de manutenção e troca dos filtros dos equipamentos de climatização', category: 'Documentação', legislation: 'RDC 216/2004 item 4.1.11' },
    { id: 'pan9', text: 'Apresentar certificado do Corpo de Bombeiros', category: 'Documentação', legislation: '' },
    { id: 'pan10', text: 'Apresentar certificado de vistoria do veículo platão (entrega)', category: 'Documentação', legislation: 'LM 8741/08 art. 81 inc. III' },
    { id: 'pan11', text: 'Apresentar planilhas diárias de controle de temperatura: dos alimentos recebidos, dos alimentos preparados, dos armazenados ou aguardando transporte e dos equipamentos de exposição ao consumo', category: 'Documentação', legislation: 'RDC 216/2004 itens 4.7.3, 4.9.2, 4.10.3' },
    { id: 'pan12', text: 'Possuir localização adequada, livre de lixo, roedores, insetos. Com acesso adequado, não comum a residência', category: 'Estrutura', legislation: 'LM 8741/2008 Art. 81 inc. XIX; RDC 216/04 item 4.1.1' },
    { id: 'pan13', text: 'Possuir local adequado para armazenamento externo do lixo, protegido de chuva, sol, pessoas estranhas, animais, livre de odores ou incômodos à vizinhança', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.5.3; Portaria Municipal SMS 0322/2008 Art. 5º "g"' },
    { id: 'pan14', text: 'Recipientes de coleta interna devem ser apropriados, de acordo com a quantidade de lixo produzido, providos de tampa acionada a pedal, com uso de sacos plásticos', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.5.2' },
    { id: 'pan15', text: 'PISO, PAREDES, DIVISÓRIAS, FORRO E TETO: lisos; impermeáveis; laváveis; íntegros; conservados; sem rachaduras, trincas; goteiras; vazamentos; infiltrações; bolores; descascamentos, dentre outros', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.3' },
    { id: 'pan16', text: 'Ralos e grelhas com sistema de fechamento (escamoteável) e ligados à rede de esgoto', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.5' },
    { id: 'pan17', text: 'Instalações elétricas embutidas, protegidas em tubulações limpas e íntegras', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.5' },
    { id: 'pan18', text: 'Retirar móveis, utensílios e outros objetos alheios à atividade e/ou em desuso', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.7' },
    { id: 'pan19', text: 'Depósito de alimentos de acordo com o ramo e volume de produção, sem comunicação direta com banheiro e vestiário. Limpo e organizado', category: 'Estrutura', legislation: 'RDC 216/2004 itens 4.1.1, 4.1.12, 4.2.1' },
    { id: 'pan20', text: 'Estrados, prateleiras e outros com superfícies limpas, impermeáveis e laváveis, com distanciamento de piso e paredes', category: 'Armazenamento', legislation: 'RDC 216/2004 item 4.7.6' },
    { id: 'pan21', text: 'Sala climatizada para manipulação/fabricação de tortas, doces, fatiamento de frios com planilha de controle de temperatura', category: 'Estrutura', legislation: 'RDC 216/04 item 4.5.4' },
    { id: 'pan22', text: 'Sanitários: organizados, conservados, portas dotadas de fechamento automático; com papel higiênico, papel toalha, sabão líquido, assento no vaso sanitário e lixeiras com tampa a pedal', category: 'Higiene', legislation: 'RDC 216/2004 item 4.1.13' },
    { id: 'pan23', text: 'Vestiários: com armários para guardar objetos pessoais e portas dotadas de fechamento automático', category: 'Higiene', legislation: 'RDC 216/2004 itens 4.6.3, 4.1.12' },
    { id: 'pan24', text: 'Caixa de gordura: localizada fora da área de manipulação, íntegra, com capacidade à demanda, tampas ajustadas. Na impossibilidade de ser fora da área produtiva, realizar perfeita vedação', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.2.2' },
    { id: 'pan25', text: 'Depósito de carvão ou lenha fora da área de manipulação', category: 'Estrutura', legislation: 'RDC 216/2004 item 4.1.2' },
    { id: 'pan26', text: 'Balcões expositores com barreiras de proteção que previnam a contaminação dos alimentos expostos em decorrência da proximidade ou da ação do consumidor e de outras fontes; mantidos em condições higiênico-sanitárias apropriadas', category: 'Equipamentos', legislation: 'RDC 216/2004 item 4.10.4' },
    { id: 'pan27', text: 'Estufas e/ou balcões expositores que garantam as temperaturas especificadas para a conservação dos alimentos: acima de 60°C para alimentos quentes e abaixo de 5°C para alimentos frios', category: 'Equipamentos', legislation: 'RDC 216/2004 item 4.10.3' },
    { id: 'pan28', text: 'Proibido o uso de cestas de vime, madeira, palha, telas de filó ou qualquer outro material que não seja liso, lavável e impermeável', category: 'Equipamentos', legislation: 'RDC 216/04 itens 4.10.4, 4.1.17' },
    { id: 'pan29', text: 'Área de produção: Fluxo deve ser linear (racional) evitando contaminação cruzada', category: 'Produção', legislation: 'RDC 216/2004 item 4.1.1' },
    { id: 'pan30', text: 'Área de produção: Sem comunicação direta com banheiros e vestiários', category: 'Produção', legislation: 'RDC 216/2004 item 4.1.12' },
    { id: 'pan31', text: 'Área de produção: Portas e janelas ajustadas aos batentes. Portas dotadas de fechamento automático e demais aberturas providas de telas milimétricas (produção e depósito)', category: 'Produção', legislation: 'RDC 216/2004 item 4.1.4' },
    { id: 'pan32', text: 'Área de produção: Iluminação adequada à atividade desenvolvida, com luminárias limpas e protegidas contra quedas e explosões', category: 'Produção', legislation: 'RDC 216/04 item 4.1.8' },
    { id: 'pan33', text: 'Área de produção: Ventilação adequada garantindo conforto térmico, ambiente livre de fungos, bolores, fumaças e condensação de vapores, com sistema de exaustão', category: 'Produção', legislation: 'RDC 216/2004 item 4.1.10' },
    { id: 'pan34', text: 'Área de produção: Pias: água corrente, material resistente, impermeável, bem conservadas, em posição estratégica em relação ao fluxo, com capacidade proporcional à demanda, providas de cartazes indicando a finalidade das mesmas', category: 'Produção', legislation: 'Portaria 1288/95 capítulo III art 7º item IX' },
    { id: 'pan35', text: 'Área de produção: Lavatórios exclusivos para a higienização das mãos, em adequado estado de conservação, em pontos estratégicos, dotados de papel toalha, sabonete líquido antisséptico e lixeira com tampa a pedal', category: 'Produção', legislation: 'RDC 216/2004 item 4.1.14' },
    { id: 'pan36', text: 'Equipamentos, móveis e utensílios: lisos, impermeáveis, resistentes aos procedimentos de higienização, não absorventes (proibido madeira), proporcionais à demanda, mantidos limpos', category: 'Equipamentos', legislation: 'RDC 216/2004 itens 4.1.15 e 4.1.17' },
    { id: 'pan37', text: 'Instalações, equipamentos, móveis e utensílios mantidos em condições higiênico-sanitárias apropriadas', category: 'Equipamentos', legislation: 'RDC 216/2004 item 4.2.1' },
    { id: 'pan38', text: 'Possuir filtro de água que atenda a demanda, sendo vedada a utilização de filtros de barro', category: 'Equipamentos', legislation: 'RDC 216/2004 item 4.4.1' },
    { id: 'pan39', text: 'Utensílios e equipamentos protegidos e ordenados em local próprio, em armários ou prateleiras impermeáveis', category: 'Equipamentos', legislation: 'RDC 216/04 item 4.2.1' },
    { id: 'pan40', text: 'Equipamentos de refrigeração: íntegros, capacidade compatível com a demanda, limpos, organizados, separados por tipo de produto e em perfeito funcionamento', category: 'Equipamentos', legislation: 'RDC 216/2004 itens 4.10.3 e 4.1.16; LM 8741/2008 Art. 81, XVI "b"' },
    { id: 'pan41', text: 'Alimentos preparados, armazenados, aguardando transporte, congelados, devem estar identificados e protegidos contra contaminantes (identificação mínima: designação do produto, data de preparo e validade)', category: 'Alimentos', legislation: 'RDC 216/2004 itens 4.8.18 e/ou 4.9.1' },
    { id: 'pan42', text: 'Os ingredientes e matérias primas usados nas preparações, após o uso devem ser adequadamente embalados, acondicionados, identificados e armazenados', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.6' },
    { id: 'pan43', text: 'Gelo que entra em contato com os alimentos: origem comprovada, fabricado com água potável, manipulado e armazenado de maneira protegida contra contaminantes', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.4.2' },
    { id: 'pan44', text: 'Descongelamento efetuado a 5°C ou em forno de micro-ondas. Vedado degelo de perecíveis à temperatura ambiente. Proibido recongelar', category: 'Alimentos', legislation: 'RDC 216/04 itens 4.8.3, 4.8.4' },
    { id: 'pan45', text: 'Não fornecer ao consumidor ou utilizar na preparação de outros produtos alimentícios restos de alimentos, bem como sobras não monitoradas e registradas', category: 'Alimentos', legislation: 'LM 8741/2008 Art. 81 inc. XII' },
    { id: 'pan46', text: 'Não preparar, transportar, armazenar, expor ao consumo, comercializar alimentos com micro-organismos patogênicos ou substâncias prejudiciais à saúde (*a), deteriorados ou alterados (*b), com aditivos proibidos ou nocivos à saúde (*c); com sujidade ou substâncias estranhas à sua composição natural (*d); de procedência clandestina ou sem comprovação de origem e qualidade (*e); sem o devido registro (*f); sem observação das condições necessárias à sua produção e/ou conservação (*g)', category: 'Alimentos', legislation: 'LM 8741/2008 Art. 81, inc. XVI' },
    { id: 'pan47', text: 'Todos os alimentos expostos à venda deverão estar devidamente rotulados (doces, tortas, entre outros)', category: 'Alimentos', legislation: 'LM 8741/2008 Art. 81, inc. X' },
    { id: 'pan48', text: 'Frutas, legumes e verduras: higienizadas com procedimentos e produtos validados pelo Ministério da Saúde', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.19' },
    { id: 'pan49', text: 'Não manipular ou armazenar alimentos em áreas externas ou adjacentes não destinadas a esse fim e nem reformar equipamentos ou área física juntamente com manipulação', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.1.2' },
    { id: 'pan50', text: 'Óleo de fritura: sem alteração de suas características (cor, odor, formação de espuma); não utilizar no preparo de outros alimentos. Após o uso: armazenar em recipientes rígidos; fora da área de manipulação, e ser vendido para empresas especializadas', category: 'Alimentos', legislation: 'RDC 216/2004 item 4.8.1' },
    { id: 'pan51', text: 'Escovas e esponjas devem estar em bom estado de conservação e higiene', category: 'Higiene', legislation: 'RDC 216/2004 item 4.2.6' },
    { id: 'pan52', text: 'Não utilizar panos convencionais, como panos de prato, para secagem das mãos e utensílios', category: 'Higiene', legislation: 'RDC 216/2004 item 4.1.14' },
    { id: 'pan53', text: 'Controlar rigorosamente a validade dos alimentos', category: 'Alimentos', legislation: 'LM 8741/2008 Art. 81, inc. XII' },
    { id: 'pan54', text: 'Produtos saneantes utilizados deverão estar regularizados pelo Ministério da Saúde', category: 'Higiene', legislation: 'RDC 216/2004 item 4.2.5' },
    { id: 'pan55', text: 'Armazenar os produtos de limpeza em local específico e longe dos alimentos', category: 'Armazenamento', legislation: 'RDC 216/2004 item 4.2.5' },
    { id: 'pan56', text: 'Manipuladores de alimentos: ausência de feridas, infecções cutâneas e outras doenças infecto contagiosas', category: 'Pessoal', legislation: 'RDC 216/2004 item 4.6.2' },
    { id: 'pan57', text: 'Manipuladores de alimentos: asseio pessoal; não praticar atos que possam contaminar os alimentos; não usar barba; unhas devem ser curtas e sem esmalte; não usar adornos, perfume, maquiagem', category: 'Pessoal', legislation: 'RDC 216/2004 itens 4.6.3, 4.6.5' },
    { id: 'pan58', text: 'Manipuladores: não realizar atividade de recebimento de dinheiro concomitantemente com manipulação de alimentos', category: 'Pessoal', legislation: 'RDC 216/2004 item 4.6.5' },
    { id: 'pan59', text: 'Uso de uniformes, cor clara, compatíveis à atividade, conservados e limpos; e protetor para cabelos. Uso obrigatório de Equipamentos de Proteção Individual (EPI)', category: 'Pessoal', legislation: 'Portaria SESGO 1288/95 art. 7º XVI; RDC 216/2004 item 4.6.3' },
    { id: 'pan60', text: 'Lavar cuidadosamente as mãos de maneira eficiente', category: 'Pessoal', legislation: 'RDC 216/2004 item 4.6.4' },
  ]
};

// Adicionar panificadora ao array de templates
checklistTemplates.push(checklistPanificadora);

// ============= CHECKLIST AÇOUGUE =============
export const checklistAcougue: ChecklistTemplate = {
  id: 'acougue',
  name: 'Açougue / Comércio de Cárneos',
  description: 'Comércio varejista de produtos cárneos com ou sem transformação',
  icon: 'Beef',
  legislationBase: 'Res. 20/GAB/SES/GO, Lei Municipal nº 8.741/08 e Port. 284/09',
  items: [
    // Documentação
    { id: 'ac1', text: 'Apresentar Alvará de Autorização Sanitária. Açougue tipo 1 - sem transformação; Açougue tipo 2 - com transformação', category: 'Documentação', legislation: 'LM 8741/2008 Art. 81 Inc. III; Res. 20/GAB/SES/GO Art. 1° Inc. IV' },
    { id: 'ac2', text: 'Apresentar Caderneta de Inspeção Sanitária', category: 'Documentação', legislation: 'LM 8741/2008 Art. 81 §1°' },
    { id: 'ac3', text: 'Apresentar comprovante de treinamento dos manipuladores em Boas Práticas de Manipulação de Alimentos', category: 'Documentação', legislation: 'Res. 20/GAB/SES/GO Art. 27 Inc. III' },
    { id: 'ac4', text: 'Apresentar certificado do Corpo de Bombeiros', category: 'Documentação', legislation: 'Port. 284/09 Art. 33 Parágrafo único' },
    { id: 'ac5', text: 'Apresentar comprovante de higienização da caixa de água a cada seis meses, realizada por empresa especializada e regularizada ou funcionário capacitado. A água deve ser proveniente de abastecimento público; caso não exista, é autorizada a utilização de água proveniente de fontes alternativas, desde que tratada e com qualidade controlada por análise laboratorial conforme legislação vigente', category: 'Água', legislation: 'Res. 20/GAB/SES/GO Art. 26 §1°; Art. 25; Port. 888/2021' },
    { id: 'ac6', text: 'Apresentar comprovante do controle integrado de pragas urbanas e vetores executado por empresa especializada e habilitada', category: 'Controle de Pragas', legislation: 'Res. 20/GAB/SES/GO Art. 41' },
    { id: 'ac7', text: 'Apresentar comprovante de procedência de todos os produtos cárneos através de notas fiscais e rotulagem que atenda a legislação vigente. Todos os produtos de origem animal devem possuir selo do órgão de inspeção competente', category: 'Documentação', legislation: 'Res. 20/GAB/SES/GO Art. 4° Parágrafo único; LM 8741/2008 Art. 81 Inc. XVI alíneas "e" e "f"' },
    { id: 'ac8', text: 'Apresentar comprovante de manutenção e troca dos filtros dos equipamentos de climatização, que devem ser mantidos conservados e higienizados', category: 'Equipamentos', legislation: 'Res. 20/GAB/SES/GO Art. 9°' },
    { id: 'ac9', text: 'Apresentar certificado de vistoria do veículo de transporte de matérias-primas e/ou produtos', category: 'Documentação', legislation: 'LM 8741/08 Art. 81 Inc. III' },

    // Estrutura e Instalações
    { id: 'ac10', text: 'Pisos, paredes e tetos devem possuir revestimento liso, resistente, impermeável, lavável e de cor clara, mantidos íntegros, conservados, livres de rachaduras, trincas, vazamentos, infiltrações, bolores, descascamentos e não devem transmitir contaminantes aos alimentos', category: 'Estrutura', legislation: 'Res. 20/GAB/SES/GO Art. 5°' },
    { id: 'ac11', text: 'Portas e janelas ajustadas aos batentes com superfície lisa, impermeável, de cor clara e em bom estado de conservação e higiene. Aberturas externas providas de telas milimétricas para impedir acesso de vetores e pragas urbanas', category: 'Estrutura', legislation: 'Res. 20/GAB/SES/GO Art. 6°' },
    { id: 'ac12', text: 'Ralos e grelhas do piso devem possuir sistema de fechamento escamoteável ou outro tipo que impeça acesso de pragas, ligados à fossa séptica ou rede de esgoto', category: 'Estrutura', legislation: 'Res. 20/GAB/SES/GO Art. 7°' },
    { id: 'ac13', text: 'Não é permitido uso de ventiladores nas salas de manipulação e fluxo de ar não deve incidir direto sobre os alimentos', category: 'Estrutura', legislation: 'Res. 20/GAB/SES/GO Art. 8°' },
    { id: 'ac14', text: 'Iluminação adequada da área de manipulação, com luminárias apropriadas, protegidas contra quedas acidentais e explosão, mantidas limpas e em bom estado de conservação', category: 'Estrutura', legislation: 'Res. 20/GAB/SES/GO Art. 10' },
    { id: 'ac15', text: 'Instalações elétricas embutidas ou protegidas por tubulações externas e íntegras permitindo a higienização', category: 'Estrutura', legislation: 'Res. 20/GAB/SES/GO Art. 11' },
    { id: 'ac16', text: 'Lavatório exclusivo para higiene das mãos na área de preparação dotado de dispensadores abastecidos de sabão líquido inodoro, toalhas de papel e lixeira com tampa acionada sem contato manual', category: 'Higiene', legislation: 'Res. 20/GAB/SES/GO Art. 12' },
    { id: 'ac17', text: 'Pia exclusiva para higiene de utensílios', category: 'Higiene', legislation: 'Res. 20/GAB/SES/GO Art. 13' },
    { id: 'ac18', text: 'Local para guardar objetos de uso pessoal dos funcionários', category: 'Estrutura', legislation: 'Res. 20/GAB/SES/GO Art. 14' },
    { id: 'ac19', text: 'Caixas de gordura fora da área de produção mantidas íntegras, limpas, com tampas ajustadas e vedadas e com capacidade proporcional à demanda', category: 'Estrutura', legislation: 'Res. 20/GAB/SES/GO Art. 15' },
    { id: 'ac20', text: 'Sanitários: não devem ter comunicação direta com área de manipulação, possuir dispensadores com sabonete líquido inodoro e toalhas de papel, papel higiênico, lixeira com tampa acionada sem contato manual e porta com fechamento automático', category: 'Estrutura', legislation: 'Res. 20/GAB/SES/GO Art. 16' },

    // Sala de Preparo e Equipamentos
    { id: 'ac21', text: 'Açougues Tipo 2: sala de preparo climatizada para transformação de produtos cárneos com temperatura mantida entre 16-18°C e porta de acesso com fechamento automático. Caso a desossa e manipulação sejam na mesma sala, devem ser realizadas em horários distintos e com higienização adequada entre as etapas', category: 'Equipamentos', legislation: 'Res. 20/GAB/SES/GO Art. 17; Art. 17 Parágrafo único' },
    { id: 'ac22', text: 'Equipamentos, móveis e utensílios devem possuir superfícies lisas, laváveis e impermeáveis, de material atóxico, resistente à corrosão e mantidos limpos e em bom estado de conservação', category: 'Equipamentos', legislation: 'Res. 20/GAB/SES/GO Art. 18' },
    { id: 'ac23', text: 'Câmaras frias, freezeres, geladeiras e balcões expositores em quantidade proporcional à demanda e em perfeito funcionamento para manutenção adequada da temperatura dos produtos', category: 'Equipamentos', legislation: 'Res. 20/GAB/SES/GO Art. 19' },
    { id: 'ac24', text: 'Máquina de moer carne e amaciador de bifes devem ser desmontados e lavados no encerramento das atividades do dia e permanecer protegidos de insetos e sujidades', category: 'Equipamentos', legislation: 'Res. 20/GAB/SES/GO Art. 21' },
    { id: 'ac25', text: 'Todas lixeiras dotadas de tampas sem acionamento manual, sacos plásticos e em tamanho/quantidade que atendam à demanda', category: 'Higiene', legislation: 'Res. 20/GAB/SES/GO Art. 22' },
    { id: 'ac26', text: 'Produtos de limpeza e utensílios devem possuir local adequado para seu armazenamento e saneantes devem ter registro no Ministério da Saúde', category: 'Higiene', legislation: 'Res. 20/GAB/SES/GO Art. 23' },
    { id: 'ac27', text: 'Produtos devem ser mantidos sobre paletes, estrados e/ou prateleiras de material liso, impermeável, lavável, resistente e mantidos limpos', category: 'Armazenamento', legislation: 'Res. 20/GAB/SES/GO Art. 24' },

    // Pessoal / Manipuladores
    { id: 'ac28', text: 'Uso de uniforme completo, de cor clara, sapatos fechados e gorro de proteção para os cabelos. Não fazer uso de adornos. Fazer uso de EPIs limpos e conservados. Obrigatório uso de luva de malha de aço no corte e desossa de carnes', category: 'Pessoal', legislation: 'Res. 20/GAB/SES/GO Art. 27 Inc. I e Inc. II' },
    { id: 'ac29', text: 'Cumprir rotina de higiene diária: banho; barba e bigode raspados; unhas curtas, limpas e sem esmalte. Higienização adequada das mãos', category: 'Pessoal', legislation: 'Res. 20/GAB/SES/GO Art. 27 Inc. IV e Inc. V' },

    // Armazenamento e Temperaturas
    { id: 'ac30', text: 'Produtos, matérias-primas e insumos devem ter embalagens íntegras, com identificação legível e armazenados em locais limpos e adequados. Em caso de fracionamento devem ser identificados com dados originais e data de validade de acordo com fabricante', category: 'Armazenamento', legislation: 'Res. 20/GAB/SES/GO Art. 29' },
    { id: 'ac31', text: 'Controle da data de validade de produtos comercializados e utilizados', category: 'Armazenamento', legislation: 'Res. 20/GAB/SES/GO Art. 30; LM 8741/2008 Art. 81 Inc. XII' },
    { id: 'ac32', text: 'Proibido armazenar produtos em caixas de papelão dentro de freezeres, geladeiras e/ou câmaras frias junto com produtos não embalados', category: 'Armazenamento', legislation: 'Res. 20/GAB/SES/GO Art. 31' },
    { id: 'ac33', text: 'Líquidos residuais de carnes suspensas não devem entrar em contato com as peças depositadas na parte inferior do expositor/ou equipamento de refrigeração', category: 'Armazenamento', legislation: 'Res. 20/GAB/SES/GO Art. 32' },
    { id: 'ac34', text: 'Separar carnes de diferentes espécies através de proteção eficiente para evitar contaminação cruzada', category: 'Armazenamento', legislation: 'Res. 20/GAB/SES/GO Art. 33' },
    { id: 'ac35', text: 'Balcões refrigerados, ilhas ou gôndolas dotados de termômetros, mantidos limpos e em perfeito funcionamento. Produtos devem ser dispostos de forma a não obstruir passagem do frio e respeitar a capacidade dos equipamentos. Produtos cárneos não devem ficar em contato direto com gelo, exceto pescados frescos', category: 'Equipamentos', legislation: 'Res. 20/GAB/SES/GO Art. 34; Art. 34 §1° e §2°' },
    { id: 'ac36', text: 'Pescados frescos inteiros/com ou sem vísceras: máx. 4°C e com no mín. 70% da superfície submersa em gelo com água potável. Pescados resfriados: entre 0-2°C. Pescados congelados: máx. -15°C ou conforme orientação do fabricante. Pescados secos/salgados: conforme recebidos pelo fabricante. Pescados fracionados na ausência do consumidor: embalados, identificados e máx. 4°C', category: 'Temperaturas', legislation: 'Res. 20/GAB/SES/GO Art. 35 Inc. I a V' },
    { id: 'ac37', text: 'Temperatura de armazenamento dos demais produtos cárneos: congelados temperatura máx. -12°C ou orientação do fabricante e refrigerados até 8°C ou orientação do frigorífico', category: 'Temperaturas', legislation: 'Res. 20/GAB/SES/GO Art. 36 Inc. I e II' },
    { id: 'ac38', text: 'Carnes salgadas mantidas em expositores fechados, de material liso e lavável, à prova de insetos e poeira', category: 'Armazenamento', legislation: 'Res. 20/GAB/SES/GO Art. 37' },

    // Carne Moída e Transformação
    { id: 'ac39', text: 'Carnes moídas ou com porcionamento prévio: em perfeitas condições de conservação e características organolépticas próprias; produzida e embalada em sala climatizada; embalada logo após a moagem com massa não ultrapassando 10 cm de espessura; rotulagem mínima com espécie do animal, tipo de carne, data da moagem, conservação e prazo para consumo; temperatura de até 8°C; comercializada no mesmo dia da moagem; consumidor tem direito de escolher a peça e moagem ser feita na sua presença', category: 'Alimentos', legislation: 'Res. 20/GAB/SES/GO Art. 38 Inc. I a VI; Art. 38 Parágrafo único' },
    { id: 'ac40', text: 'Proibido descongelar os produtos para fins de comercialização. Pode descongelar em temperatura de refrigeração apenas para fins de transformação', category: 'Alimentos', legislation: 'Res. 20/GAB/SES/GO Art. 39; Art. 39 Parágrafo único' },
    { id: 'ac41', text: 'Acondicionamento de alimentos em sacos plásticos transparentes de 1° uso e/ou caixas, bandejas e outros recipientes de material liso, lavável, impermeável e protegidos devidamente limpos e identificados com nome do produto, data de fabricação e validade', category: 'Alimentos', legislation: 'Res. 20/GAB/SES/GO Art. 40' },
    { id: 'ac42', text: 'Na transformação dos produtos cárneos não poderão ser utilizados aditivos ou conservantes químicos, apenas sal e condimentos naturais', category: 'Alimentos', legislation: 'LM 8741/2008 Art. 81 Inc. XVI alíneas "c" e "d"; Res. 20/GAB/SES/GO Art. 42' },
    { id: 'ac43', text: 'Todas as matérias-primas devem ser inspecionadas, estar em perfeitas condições de conservação e com características organolépticas próprias', category: 'Alimentos', legislation: 'Res. 20/GAB/SES/GO Art. 43; LM 8741/2008 Art. 81 Inc. XVI alínea "b"' },
    { id: 'ac44', text: 'Os produtos cárneos transformados devem ser embalados e expostos à venda com nome do produto, lote, data de fabricação e validade', category: 'Alimentos', legislation: 'Res. 20/GAB/SES/GO Art. 46' },
    { id: 'ac45', text: 'Prazo de validade dos produtos cárneos transformados não deve ultrapassar 48 horas', category: 'Alimentos', legislation: 'Res. 20/GAB/SES/GO Art. 47' },
    { id: 'ac46', text: 'Os ossos, sebos e demais resíduos devem ser armazenados sob refrigeração em recipientes fechados, de material liso, impermeável e resistente, mantidos conservados, limpos e identificados', category: 'Resíduos', legislation: 'Res. 20/GAB/SES/GO Art. 50' },

    // Proibições Gerais
    { id: 'ac47', text: 'Proibido o uso de cigarros, cigarrilhas, charutos, cachimbos ou qualquer outro produto fumígeno, derivado ou não do tabaco em recintos coletivos, total ou parcialmente fechados, privados ou públicos', category: 'Pessoal', legislation: 'Lei Federal 9294/1996 Art. 2°; Art. 2° §3°' },
  ]
};

// Adicionar açougue ao array de templates
checklistTemplates.push(checklistAcougue);

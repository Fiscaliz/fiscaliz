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
    id: 'industria',
    name: 'Indústria de Alimentos',
    description: 'Fabricação e processamento de alimentos',
    icon: 'Factory',
    legislationBase: 'RDC 216/04 e Lei Municipal nº 8.741/08',
    items: [
      { id: 'i1', text: 'Providenciar e afixar Alvará Sanitário válido', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 'i2', text: 'Manter Responsável Técnico com registro ativo no conselho profissional', category: 'Documentação', legislation: 'RDC 216/04' },
      { id: 'i3', text: 'Elaborar e implementar Manual de Boas Práticas de Fabricação', category: 'Documentação', legislation: 'RDC 216/04' },
      { id: 'i4', text: 'Elaborar e manter POPs implementados e disponíveis', category: 'Documentação', legislation: 'RDC 216/04' },
      { id: 'i5', text: 'Documentar e manter programa de controle de pragas atualizado', category: 'Controle de Pragas', legislation: 'RDC 216/04' },
      { id: 'i6', text: 'Implementar sistema de rastreabilidade de matérias-primas', category: 'Alimentos', legislation: 'RDC 216/04' },
      { id: 'i7', text: 'Realizar e manter laudos de análise de produtos', category: 'Documentação', legislation: 'RDC 216/04' },
      { id: 'i8', text: 'Separar área de produção dos sanitários e vestiários', category: 'Estrutura', legislation: 'RDC 216/04' },
      { id: 'i9', text: 'Instalar sistema de ventilação adequado com filtros', category: 'Estrutura', legislation: 'RDC 216/04' },
      { id: 'i10', text: 'Realizar e manter laudos de análise da água', category: 'Água', legislation: 'RDC 216/04' },
      { id: 'i11', text: 'Calibrar equipamentos e manter registros de manutenção', category: 'Equipamentos', legislation: 'RDC 216/04' },
      { id: 'i12', text: 'Realizar exames de saúde periódicos dos funcionários', category: 'Pessoal', legislation: 'RDC 216/04' },
    ]
  },
  {
    id: 'farmacia',
    name: 'Farmácia / Drogaria',
    description: 'Dispensação de medicamentos e produtos de saúde',
    icon: 'Pill',
    legislationBase: 'RDC 44/09 e Lei Municipal nº 8.741/08',
    items: [
      { id: 'f1', text: 'Afixar Alvará Sanitário válido em local visível ao público', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 'f2', text: 'Manter Responsável Técnico presente durante todo o horário de funcionamento', category: 'Documentação', legislation: 'RDC 44/09' },
      { id: 'f3', text: 'Retirar medicamentos fora do prazo de validade', category: 'Medicamentos', legislation: 'RDC 44/09' },
      { id: 'f4', text: 'Controlar e registrar temperatura ambiente diariamente', category: 'Equipamentos', legislation: 'RDC 44/09' },
      { id: 'f5', text: 'Armazenar medicamentos termolábeis sob refrigeração adequada', category: 'Medicamentos', legislation: 'RDC 44/09' },
      { id: 'f6', text: 'Armazenar medicamentos controlados em local seguro e com acesso restrito', category: 'Medicamentos', legislation: 'Portaria 344/98' },
      { id: 'f7', text: 'Manter livro de registros de controlados atualizado', category: 'Documentação', legislation: 'Portaria 344/98' },
      { id: 'f8', text: 'Adequar área de aplicação de injetáveis às normas sanitárias', category: 'Estrutura', legislation: 'RDC 44/09' },
      { id: 'f9', text: 'Documentar e implementar procedimentos de limpeza', category: 'Higiene', legislation: 'RDC 44/09' },
      { id: 'f10', text: 'Implementar sistema de descarte de medicamentos conforme RDC 222/18', category: 'Resíduos', legislation: 'RDC 222/18' },
    ]
  },
  {
    id: 'clinica',
    name: 'Clínica / Hospital',
    description: 'Estabelecimentos assistenciais de saúde',
    icon: 'Hospital',
    legislationBase: 'RDC 50/02, RDC 222/18 e Lei Municipal nº 8.741/08',
    items: [
      { id: 'c1', text: 'Providenciar e afixar Alvará Sanitário válido', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 'c2', text: 'Manter Responsável Técnico inscrito no conselho profissional', category: 'Documentação', legislation: 'RDC 50/02' },
      { id: 'c3', text: 'Elaborar e implementar PGRSS (Plano de Gerenciamento de Resíduos de Serviços de Saúde)', category: 'Resíduos', legislation: 'RDC 222/18' },
      { id: 'c4', text: 'Segregar resíduos corretamente conforme classificação', category: 'Resíduos', legislation: 'RDC 222/18' },
      { id: 'c5', text: 'Realizar manutenção preventiva dos equipamentos com registros', category: 'Equipamentos', legislation: 'RDC 50/02' },
      { id: 'c6', text: 'Esterilizar materiais corretamente com registros de controle', category: 'CME', legislation: 'RDC 15/12' },
      { id: 'c7', text: 'Organizar e arquivar prontuários conforme normas', category: 'Documentação', legislation: 'CFM' },
      { id: 'c8', text: 'Adequar área física conforme projeto aprovado', category: 'Estrutura', legislation: 'RDC 50/02' },
      { id: 'c9', text: 'Atualizar carteira de vacinação dos funcionários', category: 'Pessoal', legislation: 'NR 32' },
      { id: 'c10', text: 'Implementar procedimentos de biossegurança', category: 'Biossegurança', legislation: 'NR 32' },
    ]
  },
  {
    id: 'salao',
    name: 'Salão de Beleza',
    description: 'Serviços de estética e beleza',
    icon: 'Scissors',
    legislationBase: 'RDC 56/08 e Lei Municipal nº 8.741/08',
    items: [
      { id: 'b1', text: 'Providenciar e afixar Alvará Sanitário válido', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 'b2', text: 'Utilizar materiais esterilizados ou descartáveis', category: 'Equipamentos', legislation: 'RDC 56/08' },
      { id: 'b3', text: 'Manter autoclave ou estufa funcionando adequadamente', category: 'Equipamentos', legislation: 'RDC 56/08' },
      { id: 'b4', text: 'Utilizar apenas produtos cosméticos regularizados na ANVISA', category: 'Produtos', legislation: 'RDC 07/15' },
      { id: 'b5', text: 'Instalar lavatório exclusivo para lavagem de cabelos', category: 'Estrutura', legislation: 'RDC 56/08' },
      { id: 'b6', text: 'Fornecer toalhas individuais limpas para cada cliente', category: 'Higiene', legislation: 'RDC 56/08' },
      { id: 'b7', text: 'Instalar pia com sabonete líquido e papel toalha para higiene de mãos', category: 'Higiene', legislation: 'RDC 56/08' },
      { id: 'b8', text: 'Instalar lixeiras adequadas com tampa e pedal', category: 'Resíduos', legislation: 'RDC 56/08' },
      { id: 'b9', text: 'Manter ambiente ventilado naturalmente ou com climatização adequada', category: 'Estrutura', legislation: 'RDC 56/08' },
      { id: 'b10', text: 'Revestir piso e paredes com material lavável e impermeável', category: 'Estrutura', legislation: 'RDC 56/08' },
    ]
  },
  {
    id: 'academia',
    name: 'Academia',
    description: 'Estabelecimentos de condicionamento físico',
    icon: 'Dumbbell',
    legislationBase: 'Lei Municipal nº 8.741/08',
    items: [
      { id: 'a1', text: 'Providenciar e afixar Alvará Sanitário válido', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 'a2', text: 'Manter Profissional de Educação Física responsável técnico', category: 'Documentação', legislation: 'CREF' },
      { id: 'a3', text: 'Instalar bebedouros com água potável em quantidade suficiente', category: 'Água', legislation: 'Lei 8741/08' },
      { id: 'a4', text: 'Limpar e ventilar vestiários adequadamente', category: 'Estrutura', legislation: 'Lei 8741/08' },
      { id: 'a5', text: 'Manter equipamentos em bom estado de conservação e funcionamento', category: 'Equipamentos', legislation: 'Lei 8741/08' },
      { id: 'a6', text: 'Implementar rotina de limpeza periódica dos equipamentos', category: 'Higiene', legislation: 'Lei 8741/08' },
      { id: 'a7', text: 'Instalar piso antiderrapante nas áreas molhadas', category: 'Estrutura', legislation: 'Lei 8741/08' },
      { id: 'a8', text: 'Manter ventilação adequada natural ou artificial', category: 'Estrutura', legislation: 'Lei 8741/08' },
      { id: 'a9', text: 'Manter sanitários limpos com sabonete e papel toalha', category: 'Higiene', legislation: 'Lei 8741/08' },
      { id: 'a10', text: 'Disponibilizar kit de primeiros socorros completo e acessível', category: 'Segurança', legislation: 'Lei 8741/08' },
    ]
  },
  {
    id: 'piscina',
    name: 'Piscina',
    description: 'Piscinas de uso coletivo',
    icon: 'Waves',
    legislationBase: 'Portaria 888/21 e Lei Municipal nº 8.741/08',
    items: [
      { id: 'p1', text: 'Providenciar e afixar Alvará Sanitário válido', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 'p2', text: 'Manter cloro residual entre 1,0 e 3,0 mg/L', category: 'Água', legislation: 'Portaria 888/21' },
      { id: 'p3', text: 'Manter pH da água entre 7,0 e 7,8', category: 'Água', legislation: 'Portaria 888/21' },
      { id: 'p4', text: 'Registrar diariamente os parâmetros da água', category: 'Documentação', legislation: 'Portaria 888/21' },
      { id: 'p5', text: 'Instalar e manter lava-pés funcionando', category: 'Equipamentos', legislation: 'Lei 8741/08' },
      { id: 'p6', text: 'Limpar vestiários e sanitários diariamente', category: 'Estrutura', legislation: 'Lei 8741/08' },
      { id: 'p7', text: 'Revestir área ao redor da piscina com material antiderrapante', category: 'Estrutura', legislation: 'Lei 8741/08' },
      { id: 'p8', text: 'Contratar salva-vidas ou responsável técnico durante funcionamento', category: 'Segurança', legislation: 'Lei 8741/08' },
      { id: 'p9', text: 'Disponibilizar equipamentos de salvamento acessíveis', category: 'Segurança', legislation: 'Lei 8741/08' },
      { id: 'p10', text: 'Manter bomba de recirculação funcionando adequadamente', category: 'Equipamentos', legislation: 'Lei 8741/08' },
    ]
  },
  {
    id: 'comercio_geral',
    name: 'Comércio em Geral',
    description: 'Estabelecimentos comerciais diversos',
    icon: 'Store',
    legislationBase: 'Lei Municipal nº 8.887/2010 e Decreto 506/2016',
    items: [
      { id: 'cg1', text: 'Adotar medidas necessárias à manutenção do local isento de água parada', category: 'Controle de Vetores', legislation: 'Lei 8887/2010' },
      { id: 'cg2', text: 'Manter local limpo, sem acúmulo de lixo e materiais inservíveis', category: 'Controle de Vetores', legislation: 'Lei 8887/2010' },
      { id: 'cg3', text: 'Remover materiais que possam acumular água e propiciar proliferação do Aedes aegypti', category: 'Controle de Vetores', legislation: 'Lei 8887/2010' },
      { id: 'cg4', text: 'Evitar condições que propiciem a instalação e proliferação do Aedes aegypti', category: 'Controle de Vetores', legislation: 'LM 8887/2010' },
      { id: 'cg5', text: 'Permitir acesso dos agentes de saúde para inspeção e combate ao Aedes aegypti', category: 'Controle de Vetores', legislation: 'LM 9631/2015' },
      { id: 'cg6', text: 'Eliminar recipientes que possam acumular água parada', category: 'Controle de Vetores', legislation: 'LM 9731/2015' },
      { id: 'cg7', text: 'Implementar ações periódicas de vistoria e eliminação de criadouros do mosquito', category: 'Controle de Vetores', legislation: 'LM 9904/2016' },
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

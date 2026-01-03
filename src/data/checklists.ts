// Checklists pré-atestados por tipo de estabelecimento
// Baseado na legislação sanitária (Lei Municipal 8741/08, RDC 216/04 ANVISA)

export interface ChecklistItem {
  id: string;
  text: string;
  category: string;
  legislation?: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  items: ChecklistItem[];
}

export const checklistTemplates: ChecklistTemplate[] = [
  {
    id: 'restaurante',
    name: 'Restaurante / Lanchonete',
    description: 'Estabelecimentos de preparo e venda de alimentos prontos',
    icon: 'UtensilsCrossed',
    items: [
      { id: 'r1', text: 'Controle de pragas por empresa especializada', category: 'Controle de Pragas', legislation: 'RDC 216/04' },
      { id: 'r2', text: 'Lavatórios com sabonete líquido e papel toalha', category: 'Higiene', legislation: 'RDC 216/04' },
      { id: 'r3', text: 'Conservação dos alimentos dentro do prazo de validade', category: 'Alimentos', legislation: 'Lei 8741/08' },
      { id: 'r4', text: 'Tratamento térmico adequado (mínimo 70°C no centro)', category: 'Alimentos', legislation: 'RDC 216/04' },
      { id: 'r5', text: 'Equipamentos de refrigeração funcionando adequadamente', category: 'Equipamentos', legislation: 'RDC 216/04' },
      { id: 'r6', text: 'Manipuladores com uniformes limpos e adequados', category: 'Pessoal', legislation: 'RDC 216/04' },
      { id: 'r7', text: 'Área de manipulação livre de objetos estranhos', category: 'Estrutura', legislation: 'RDC 216/04' },
      { id: 'r8', text: 'Lixeiras com tampa e pedal', category: 'Higiene', legislation: 'RDC 216/04' },
      { id: 'r9', text: 'Telas milimétricas em portas e janelas', category: 'Controle de Pragas', legislation: 'RDC 216/04' },
      { id: 'r10', text: 'Certificado de capacitação dos manipuladores', category: 'Documentação', legislation: 'RDC 216/04' },
      { id: 'r11', text: 'Alvará sanitário válido e afixado', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 'r12', text: 'Piso, paredes e teto em bom estado de conservação', category: 'Estrutura', legislation: 'RDC 216/04' },
      { id: 'r13', text: 'Água potável com laudos de potabilidade', category: 'Água', legislation: 'RDC 216/04' },
      { id: 'r14', text: 'Reservatório de água com higienização semestral', category: 'Água', legislation: 'RDC 216/04' },
      { id: 'r15', text: 'Produtos de limpeza regularizados e armazenados separadamente', category: 'Higiene', legislation: 'RDC 216/04' },
    ]
  },
  {
    id: 'supermercado',
    name: 'Supermercado',
    description: 'Comércio varejista de alimentos e produtos diversos',
    icon: 'ShoppingCart',
    items: [
      { id: 's1', text: 'Controle de pragas por empresa especializada', category: 'Controle de Pragas', legislation: 'RDC 216/04' },
      { id: 's2', text: 'Produtos dentro do prazo de validade', category: 'Alimentos', legislation: 'Lei 8741/08' },
      { id: 's3', text: 'Temperatura das câmaras frias adequada', category: 'Equipamentos', legislation: 'RDC 216/04' },
      { id: 's4', text: 'Produtos perecíveis armazenados corretamente', category: 'Alimentos', legislation: 'RDC 216/04' },
      { id: 's5', text: 'Balcões frigoríficos com termômetro visível', category: 'Equipamentos', legislation: 'RDC 216/04' },
      { id: 's6', text: 'Área de manipulação limpa e organizada', category: 'Higiene', legislation: 'RDC 216/04' },
      { id: 's7', text: 'Funcionários com uniformes limpos', category: 'Pessoal', legislation: 'RDC 216/04' },
      { id: 's8', text: 'Rotulagem dos produtos conforme legislação', category: 'Alimentos', legislation: 'RDC 259/02' },
      { id: 's9', text: 'Separação adequada de produtos de limpeza e alimentos', category: 'Armazenamento', legislation: 'RDC 216/04' },
      { id: 's10', text: 'Estrados e prateleiras adequados', category: 'Estrutura', legislation: 'RDC 216/04' },
      { id: 's11', text: 'Alvará sanitário válido e afixado', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 's12', text: 'Ausência de produtos com embalagens violadas', category: 'Alimentos', legislation: 'Lei 8741/08' },
    ]
  },
  {
    id: 'industria',
    name: 'Indústria de Alimentos',
    description: 'Fabricação e processamento de alimentos',
    icon: 'Factory',
    items: [
      { id: 'i1', text: 'Alvará sanitário válido', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 'i2', text: 'Responsável técnico com registro no conselho', category: 'Documentação', legislation: 'RDC 216/04' },
      { id: 'i3', text: 'Manual de Boas Práticas de Fabricação', category: 'Documentação', legislation: 'RDC 216/04' },
      { id: 'i4', text: 'POPs implementados e disponíveis', category: 'Documentação', legislation: 'RDC 216/04' },
      { id: 'i5', text: 'Controle de pragas documentado', category: 'Controle de Pragas', legislation: 'RDC 216/04' },
      { id: 'i6', text: 'Rastreabilidade de matérias-primas', category: 'Alimentos', legislation: 'RDC 216/04' },
      { id: 'i7', text: 'Laudos de análise de produtos', category: 'Documentação', legislation: 'RDC 216/04' },
      { id: 'i8', text: 'Área de produção separada de sanitários', category: 'Estrutura', legislation: 'RDC 216/04' },
      { id: 'i9', text: 'Ventilação adequada com filtros', category: 'Estrutura', legislation: 'RDC 216/04' },
      { id: 'i10', text: 'Água potável com laudos de análise', category: 'Água', legislation: 'RDC 216/04' },
      { id: 'i11', text: 'Equipamentos calibrados e com manutenção', category: 'Equipamentos', legislation: 'RDC 216/04' },
      { id: 'i12', text: 'Funcionários com exames de saúde', category: 'Pessoal', legislation: 'RDC 216/04' },
    ]
  },
  {
    id: 'farmacia',
    name: 'Farmácia / Drogaria',
    description: 'Dispensação de medicamentos e produtos de saúde',
    icon: 'Pill',
    items: [
      { id: 'f1', text: 'Alvará sanitário válido e afixado', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 'f2', text: 'Responsável técnico presente durante funcionamento', category: 'Documentação', legislation: 'RDC 44/09' },
      { id: 'f3', text: 'Medicamentos dentro do prazo de validade', category: 'Medicamentos', legislation: 'RDC 44/09' },
      { id: 'f4', text: 'Temperatura ambiente controlada e registrada', category: 'Equipamentos', legislation: 'RDC 44/09' },
      { id: 'f5', text: 'Medicamentos termolábeis refrigerados', category: 'Medicamentos', legislation: 'RDC 44/09' },
      { id: 'f6', text: 'Controlados armazenados em local seguro', category: 'Medicamentos', legislation: 'Portaria 344/98' },
      { id: 'f7', text: 'Livro de registros atualizado', category: 'Documentação', legislation: 'Portaria 344/98' },
      { id: 'f8', text: 'Área de aplicação de injetáveis adequada', category: 'Estrutura', legislation: 'RDC 44/09' },
      { id: 'f9', text: 'Procedimentos de limpeza documentados', category: 'Higiene', legislation: 'RDC 44/09' },
      { id: 'f10', text: 'Descarte de medicamentos conforme RDC', category: 'Resíduos', legislation: 'RDC 222/18' },
    ]
  },
  {
    id: 'clinica',
    name: 'Clínica / Hospital',
    description: 'Estabelecimentos assistenciais de saúde',
    icon: 'Hospital',
    items: [
      { id: 'c1', text: 'Alvará sanitário válido', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 'c2', text: 'Responsável técnico inscrito no conselho', category: 'Documentação', legislation: 'RDC 50/02' },
      { id: 'c3', text: 'PGRSS implementado', category: 'Resíduos', legislation: 'RDC 222/18' },
      { id: 'c4', text: 'Resíduos segregados corretamente', category: 'Resíduos', legislation: 'RDC 222/18' },
      { id: 'c5', text: 'Equipamentos com manutenção preventiva', category: 'Equipamentos', legislation: 'RDC 50/02' },
      { id: 'c6', text: 'Materiais esterilizados corretamente', category: 'CME', legislation: 'RDC 15/12' },
      { id: 'c7', text: 'Prontuários organizados e arquivados', category: 'Documentação', legislation: 'CFM' },
      { id: 'c8', text: 'Área física conforme projeto aprovado', category: 'Estrutura', legislation: 'RDC 50/02' },
      { id: 'c9', text: 'Funcionários com vacinação em dia', category: 'Pessoal', legislation: 'NR 32' },
      { id: 'c10', text: 'Procedimentos de biossegurança', category: 'Biossegurança', legislation: 'NR 32' },
    ]
  },
  {
    id: 'salao',
    name: 'Salão de Beleza',
    description: 'Serviços de estética e beleza',
    icon: 'Scissors',
    items: [
      { id: 'b1', text: 'Alvará sanitário válido', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 'b2', text: 'Materiais esterilizados ou descartáveis', category: 'Equipamentos', legislation: 'RDC 56/08' },
      { id: 'b3', text: 'Autoclave ou estufa funcionando', category: 'Equipamentos', legislation: 'RDC 56/08' },
      { id: 'b4', text: 'Produtos cosméticos regularizados', category: 'Produtos', legislation: 'RDC 07/15' },
      { id: 'b5', text: 'Lavatório exclusivo para lavagem de cabelos', category: 'Estrutura', legislation: 'RDC 56/08' },
      { id: 'b6', text: 'Toalhas individuais e limpas', category: 'Higiene', legislation: 'RDC 56/08' },
      { id: 'b7', text: 'Pia com sabonete e papel toalha', category: 'Higiene', legislation: 'RDC 56/08' },
      { id: 'b8', text: 'Lixeiras adequadas', category: 'Resíduos', legislation: 'RDC 56/08' },
      { id: 'b9', text: 'Ambiente ventilado', category: 'Estrutura', legislation: 'RDC 56/08' },
      { id: 'b10', text: 'Piso e paredes laváveis', category: 'Estrutura', legislation: 'RDC 56/08' },
    ]
  },
  {
    id: 'academia',
    name: 'Academia',
    description: 'Estabelecimentos de condicionamento físico',
    icon: 'Dumbbell',
    items: [
      { id: 'a1', text: 'Alvará sanitário válido', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 'a2', text: 'Profissional de Educação Física responsável', category: 'Documentação', legislation: 'CREF' },
      { id: 'a3', text: 'Bebedouros com água potável', category: 'Água', legislation: 'Lei 8741/08' },
      { id: 'a4', text: 'Vestiários limpos e ventilados', category: 'Estrutura', legislation: 'Lei 8741/08' },
      { id: 'a5', text: 'Equipamentos em bom estado', category: 'Equipamentos', legislation: 'Lei 8741/08' },
      { id: 'a6', text: 'Limpeza periódica dos equipamentos', category: 'Higiene', legislation: 'Lei 8741/08' },
      { id: 'a7', text: 'Piso antiderrapante', category: 'Estrutura', legislation: 'Lei 8741/08' },
      { id: 'a8', text: 'Ventilação adequada', category: 'Estrutura', legislation: 'Lei 8741/08' },
      { id: 'a9', text: 'Sanitários limpos com sabonete', category: 'Higiene', legislation: 'Lei 8741/08' },
      { id: 'a10', text: 'Kit primeiros socorros disponível', category: 'Segurança', legislation: 'Lei 8741/08' },
    ]
  },
  {
    id: 'piscina',
    name: 'Piscina',
    description: 'Piscinas de uso coletivo',
    icon: 'Waves',
    items: [
      { id: 'p1', text: 'Alvará sanitário válido', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 'p2', text: 'Cloro residual entre 1,0 e 3,0 mg/L', category: 'Água', legislation: 'Portaria 888/21' },
      { id: 'p3', text: 'pH da água entre 7,0 e 7,8', category: 'Água', legislation: 'Portaria 888/21' },
      { id: 'p4', text: 'Registro diário dos parâmetros', category: 'Documentação', legislation: 'Portaria 888/21' },
      { id: 'p5', text: 'Lava-pés funcionando', category: 'Equipamentos', legislation: 'Lei 8741/08' },
      { id: 'p6', text: 'Vestiários e sanitários limpos', category: 'Estrutura', legislation: 'Lei 8741/08' },
      { id: 'p7', text: 'Área ao redor antiderrapante', category: 'Estrutura', legislation: 'Lei 8741/08' },
      { id: 'p8', text: 'Salva-vidas ou responsável técnico', category: 'Segurança', legislation: 'Lei 8741/08' },
      { id: 'p9', text: 'Equipamentos de salvamento disponíveis', category: 'Segurança', legislation: 'Lei 8741/08' },
      { id: 'p10', text: 'Bomba de recirculação funcionando', category: 'Equipamentos', legislation: 'Lei 8741/08' },
    ]
  },
  {
    id: 'eventos',
    name: 'Eventos Temporários',
    description: 'Feiras, festas e eventos com alimentação',
    icon: 'PartyPopper',
    items: [
      { id: 'e1', text: 'Autorização sanitária do evento', category: 'Documentação', legislation: 'Lei 8741/08' },
      { id: 'e2', text: 'Água potável disponível para manipuladores', category: 'Água', legislation: 'RDC 216/04' },
      { id: 'e3', text: 'Sistema de escoamento de água servida', category: 'Estrutura', legislation: 'Lei 8741/08' },
      { id: 'e4', text: 'Alimentos conservados corretamente', category: 'Alimentos', legislation: 'RDC 216/04' },
      { id: 'e5', text: 'Tratamento térmico adequado (70°C)', category: 'Alimentos', legislation: 'RDC 216/04' },
      { id: 'e6', text: 'Bebidas armazenadas sem contato com piso', category: 'Alimentos', legislation: 'RDC 216/04' },
      { id: 'e7', text: 'Utensílios em adequado estado e higiene', category: 'Equipamentos', legislation: 'RDC 216/04' },
      { id: 'e8', text: 'Manipuladores com higiene pessoal', category: 'Pessoal', legislation: 'RDC 216/04' },
      { id: 'e9', text: 'Lixeiras adequadas e suficientes', category: 'Resíduos', legislation: 'RDC 216/04' },
      { id: 'e10', text: 'Coleta de amostra realizada', category: 'Documentação', legislation: 'RDC 216/04' },
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

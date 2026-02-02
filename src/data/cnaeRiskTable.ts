// Tabela de Risco Sanitário CNAE - Baseada na IN nº 66/2020 da Anvisa
// Fonte: Tabela CNAE Alimentos Risco

export type SanitaryRiskLevel = 'I' | 'II' | 'III';

export interface CNAERiskEntry {
  cnae: string;
  description: string;
  riskLevel: SanitaryRiskLevel;
  justification: string;
}

// Pontuação por nível de risco sanitário (Tabela Anvisa)
export const RISK_POINTS: Record<SanitaryRiskLevel, number> = {
  'I': 2,    // Baixo risco
  'II': 3,   // Médio risco
  'III': 6,  // Alto risco
};

// Labels para exibição
export const RISK_LABELS: Record<SanitaryRiskLevel, string> = {
  'I': 'Baixo Risco',
  'II': 'Médio Risco',
  'III': 'Alto Risco',
};

// Grau de dificuldade (multiplicador)
export interface DifficultyGrade {
  grade: 1 | 2;
  justification?: string;
}

export const DIFFICULTY_GRADE_LABELS: Record<1 | 2, string> = {
  1: 'Grau 1 (Normal)',
  2: 'Grau 2 (Necessita justificativa)',
};

// Fatores que justificam grau 2
export const DIFFICULTY_JUSTIFICATIONS = [
  { id: 'local_distante', label: 'Local distante' },
  { id: 'muito_tempo', label: 'Muito tempo na ação fiscal' },
  { id: 'varios_documentos', label: 'Geração de vários documentos' },
  { id: 'acao_complexa', label: 'Ação complexa com muitas irregularidades' },
  { id: 'analise_documental', label: 'Análise documental extensa' },
];

// Tabela CNAE de Risco - Alto Risco (III)
export const HIGH_RISK_CNAES: CNAERiskEntry[] = [
  { cnae: '1031-7/00', description: 'Fabricação de conservas de frutas', riskLevel: 'III', justification: 'Processo térmico, controle de pH, risco de botulismo.' },
  { cnae: '1032-5/99', description: 'Fabricação de conservas de legumes e outros vegetais', riskLevel: 'III', justification: 'Similar às frutas, com alto risco microbiológico (botulismo).' },
  { cnae: '1043-1/00', description: 'Fabricação de margarina e outras gorduras vegetais e de óleos não comestíveis de animais', riskLevel: 'III', justification: 'Processos químicos e físicos complexos, controle de aditivos.' },
  { cnae: '1052-0/00', description: 'Fabricação de laticínios', riskLevel: 'III', justification: 'Produto altamente perecível, pasteurização, controle rigoroso de patógenos.' },
  { cnae: '1062-7/00', description: 'Moagem de trigo e fabricação de derivados', riskLevel: 'III', justification: 'Risco de contaminação por pragas e micotoxinas no armazenamento de grãos.' },
  { cnae: '1072-4/01', description: 'Fabricação de açúcar de cana, refinado e bruto', riskLevel: 'III', justification: 'Processo industrial complexo com múltiplas etapas de controle.' },
  { cnae: '1082-1/00', description: 'Fabricação de pós alimentícios', riskLevel: 'III', justification: 'Risco de contaminação no processo de moagem e mistura.' },
  { cnae: '1091-1/01', description: 'Fabricação de produtos de panificação INDUSTRIAL', riskLevel: 'III', justification: 'Produção em escala industrial é Risco III.' },
  { cnae: '1095-3/00', description: 'Fabricação de especiarias, molhos, temperos e condimentos', riskLevel: 'III', justification: 'Controle de matérias-primas diversas, risco de contaminação microbiológica e química.' },
  { cnae: '5611-2/01', description: 'Restaurantes e similares', riskLevel: 'III', justification: 'Manipulação intensa de alimentos crus e cozidos, alto risco de contaminação cruzada e surtos.' },
  { cnae: '5611-2/02', description: 'Bares com entretenimento', riskLevel: 'III', justification: 'Porções e petiscos com manipulação.' },
  { cnae: '5620-1/01', description: 'Fornecimento de alimentos preparados para empresas', riskLevel: 'III', justification: 'Volume altíssimo, risco de surtos.' },
  { cnae: '5620-1/02', description: 'Serviços de alimentação para eventos', riskLevel: 'III', justification: 'Risco no transporte e manutenção de temperatura.' },
];

// Tabela CNAE de Risco - Médio Risco (II)
export const MEDIUM_RISK_CNAES: CNAERiskEntry[] = [
  { cnae: '1033-3/01', description: 'Fabricação de sucos concentrados', riskLevel: 'II', justification: 'Processo industrial com pasteurização.' },
  { cnae: '1033-3/02', description: 'Fabricação de sucos não concentrados', riskLevel: 'II', justification: 'Risco focado na conservação e envase.' },
  { cnae: '1066-0/00', description: 'Fabricação de alimentos para animais', riskLevel: 'II', justification: 'Boas práticas para evitar contaminação.' },
  { cnae: '1091-1/02', description: 'Fabricação de padaria e confeitaria – produção própria', riskLevel: 'II', justification: 'Produção local, risco menor que industrial.' },
  { cnae: '1092-9/00', description: 'Fabricação de biscoitos', riskLevel: 'II', justification: 'Produto seco, menor risco.' },
  { cnae: '1093-7/01', description: 'Derivados do cacau e chocolates', riskLevel: 'II', justification: 'Controle de temperatura e armazenamento.' },
  { cnae: '1093-7/02', description: 'Frutas cristalizadas e balas', riskLevel: 'II', justification: 'Alto teor de açúcar → conservante.' },
  { cnae: '1094-5/00', description: 'Massas alimentícias', riskLevel: 'II', justification: 'Produto geralmente seco.' },
  { cnae: '1096-1/00', description: 'Alimentos e pratos prontos', riskLevel: 'II', justification: 'Risco no cozimento, resfriamento e conservação.' },
  { cnae: '1099-6/02', description: 'Pós para pudins e gelatinas', riskLevel: 'II', justification: 'Ingredientes secos, baixo risco.' },
  { cnae: '1099-6/07', description: 'Alimentos dietéticos', riskLevel: 'II', justification: 'Controle rigoroso de rótulos; baixo risco micro.' },
  { cnae: '1099-6/99', description: 'Outros alimentos', riskLevel: 'II', justification: 'Categoria ampla, risco médio.' },
  { cnae: '4721-1/03', description: 'Varejo de laticínios e frios', riskLevel: 'II', justification: 'Risco no fracionamento e temperatura.' },
  { cnae: '5611-2/03', description: 'Lanchonetes e similares', riskLevel: 'II', justification: 'Preparo mais simples que restaurantes.' },
  { cnae: '5611-2/04', description: 'Bares sem entretenimento', riskLevel: 'II', justification: 'Manipulação simples de alimentos.' },
  { cnae: '5620-1/04', description: 'Marmitex', riskLevel: 'II', justification: 'Risco no preparo e manutenção da temperatura.' },
];

// Tabela CNAE de Risco - Baixo Risco (I)
export const LOW_RISK_CNAES: CNAERiskEntry[] = [
  { cnae: '1099-6/04', description: 'Fabricação de gelo', riskLevel: 'I', justification: 'Risco na qualidade da água.' },
  { cnae: '4623-1/09', description: 'Atacado de alimentos para animais', riskLevel: 'I', justification: 'Produtos embalados, risco no armazenamento.' },
  { cnae: '4631-1/00', description: 'Atacado de laticínios', riskLevel: 'I', justification: 'Pré-embalados; risco no transporte.' },
  { cnae: '4635-4/03', description: 'Atacado de bebidas com fracionamento', riskLevel: 'I', justification: 'Higiene no envase.' },
  { cnae: '4637-1/99', description: 'Atacado de alimentos não especificados', riskLevel: 'I', justification: 'Produtos embalados.' },
  { cnae: '4712-1/00', description: 'Minimercados e mercearias', riskLevel: 'I', justification: 'Venda sem manipulação.' },
  { cnae: '4721-1/02', description: 'Padaria – predominância de revenda', riskLevel: 'I', justification: 'Revenda de pães.' },
  { cnae: '4721-1/04', description: 'Varejo de doces e balas', riskLevel: 'I', justification: 'Baixa perecibilidade.' },
  { cnae: '4723-7/00', description: 'Varejo de bebidas', riskLevel: 'I', justification: 'Engarrafados/enlatados.' },
  { cnae: '4729-6/99', description: 'Varejo de produtos alimentícios em geral', riskLevel: 'I', justification: 'Granel ainda classifica como baixo risco.' },
  { cnae: '5620-1/03', description: 'Cantinas – serviços privativos', riskLevel: 'I', justification: 'Cardápio simples.' },
];

// Tabela completa
export const ALL_CNAES: CNAERiskEntry[] = [
  ...HIGH_RISK_CNAES,
  ...MEDIUM_RISK_CNAES,
  ...LOW_RISK_CNAES,
];

// Função para buscar risco por CNAE
export function getRiskByCNAE(cnae: string): CNAERiskEntry | undefined {
  // Normaliza o CNAE removendo caracteres especiais
  const normalizedCnae = cnae.replace(/[^0-9]/g, '');
  return ALL_CNAES.find(entry => {
    const entryCnae = entry.cnae.replace(/[^0-9]/g, '');
    return entryCnae === normalizedCnae || entryCnae.startsWith(normalizedCnae) || normalizedCnae.startsWith(entryCnae);
  });
}

// Função para calcular pontos de uma ação fiscal
export function calculateActionPoints(
  riskLevel: SanitaryRiskLevel | null,
  difficultyGrade: 1 | 2 = 1
): number {
  if (!riskLevel) return 0;
  const basePoints = RISK_POINTS[riskLevel];
  return basePoints * difficultyGrade;
}

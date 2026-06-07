import type { BlockType, ReportBlock } from "./reportBuilder";

const BLOCK_TITLES: Record<BlockType, string> = {
  cover: "Capa",
  identification: "Identificação",
  introduction: "Introdução",
  methodology: "Metodologia",
  evidences: "Evidências",
  findings: "Achados",
  rationale: "Fundamentação",
  recommendations: "Recomendações",
  conclusion: "Conclusão",
  attachments: "Anexos",
};

function b(type: BlockType, title?: string, content = ""): ReportBlock {
  return {
    id: crypto.randomUUID(),
    type,
    title: title ?? BLOCK_TITLES[type],
    content,
    evidences: [],
  };
}

export interface StarterTemplate {
  id: string;
  name: string;
  area: string;
  description: string;
  icon: string;
  blocks: ReportBlock[];
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: "inspecao-predial",
    name: "Inspeção Predial",
    area: "Engenharia",
    icon: "🏢",
    description: "Vistoria técnica de edificações conforme NBR 16747.",
    blocks: [
      b("cover", "Capa", "Relatório de Inspeção Predial"),
      b("identification", "Identificação", "Edificação:\nEndereço:\nProprietário/Síndico:\nIdade aparente:\nÁrea construída:"),
      b("introduction", "Introdução", "Este relatório apresenta os resultados da inspeção predial realizada conforme NBR 16747, com objetivo de avaliar o estado de conservação, segurança e funcionalidade da edificação."),
      b("methodology", "Metodologia", "Inspeção visual sensorial dos sistemas construtivos: estrutura, vedações, cobertura, instalações elétricas e hidráulicas, áreas comuns e itens de segurança contra incêndio."),
      b("evidences", "Registros Fotográficos"),
      b("findings", "Anomalias e Falhas", "Classificação por grau de risco:\n- Crítico:\n- Regular:\n- Mínimo:"),
      b("recommendations", "Plano de Ação Recomendado", "Ações imediatas:\nManutenção corretiva:\nManutenção preventiva:"),
      b("conclusion", "Parecer Técnico"),
      b("attachments", "Anexos"),
    ],
  },
  {
    id: "fiscalizacao-sanitaria",
    name: "Fiscalização Sanitária",
    area: "Vigilância Sanitária",
    icon: "🛡️",
    description: "Inspeção de estabelecimentos conforme RDC 216/2004.",
    blocks: [
      b("cover", "Capa", "Relatório de Fiscalização Sanitária"),
      b("identification", "Identificação do Estabelecimento", "Razão social:\nCNPJ:\nEndereço:\nRamo de atividade:\nResponsável:"),
      b("introduction", "Objeto da Ação Fiscal", "Ação fiscal realizada com base na RDC nº 216/2004 e legislação sanitária municipal vigente."),
      b("methodology", "Metodologia", "Aplicação de checklist sanitário, inspeção visual de instalações, equipamentos, manipuladores e documentação obrigatória."),
      b("evidences", "Evidências Fotográficas"),
      b("findings", "Não Conformidades Constatadas", "Item / Descrição / Fundamentação legal"),
      b("rationale", "Fundamentação Legal", "RDC 216/2004 - Boas Práticas para Serviços de Alimentação\nLei municipal aplicável"),
      b("recommendations", "Medidas Determinadas", "Prazo para regularização: ___ dias"),
      b("conclusion", "Conclusão"),
    ],
  },
  {
    id: "vistoria-veicular",
    name: "Vistoria Veicular",
    area: "Perícia Veicular",
    icon: "🚗",
    description: "Laudo de inspeção e identificação veicular.",
    blocks: [
      b("cover", "Capa", "Laudo de Vistoria Veicular"),
      b("identification", "Dados do Veículo", "Placa:\nChassi:\nMarca/Modelo:\nAno/Modelo:\nCor:\nCombustível:\nKM:\nProprietário:"),
      b("introduction", "Objetivo", "Vistoria técnica para identificação veicular, verificação de originalidade e estado geral do veículo."),
      b("methodology", "Procedimentos", "Conferência de numeração de chassi, motor, etiquetas, vidros, lataria, pintura e itens de segurança."),
      b("evidences", "Registros Fotográficos"),
      b("findings", "Itens Verificados", "Chassi: ✓\nMotor: ✓\nEtiquetas: ✓\nVidros: ✓\nLataria/Pintura:\nPneus:\nSuspensão:\nFreios:"),
      b("conclusion", "Parecer Final", "Veículo APTO / INAPTO / APROVADO COM RESSALVAS."),
      b("attachments", "Documentos Anexos"),
    ],
  },
  {
    id: "seguranca-trabalho",
    name: "Segurança do Trabalho",
    area: "SST",
    icon: "⛑️",
    description: "Inspeção de SST conforme NRs aplicáveis.",
    blocks: [
      b("cover", "Capa", "Relatório de Inspeção de Segurança do Trabalho"),
      b("identification", "Identificação", "Empresa:\nCNPJ:\nSetor inspecionado:\nResponsável SESMT:\nNº de trabalhadores:"),
      b("introduction", "Objetivo", "Avaliar condições de segurança e saúde no ambiente de trabalho e o cumprimento das Normas Regulamentadoras."),
      b("methodology", "Metodologia", "Inspeção planejada com checklist baseado nas NRs aplicáveis e entrevistas com colaboradores."),
      b("evidences", "Registros Fotográficos"),
      b("findings", "Riscos e Não Conformidades", "Físicos:\nQuímicos:\nBiológicos:\nErgonômicos:\nAcidentes:"),
      b("rationale", "Fundamentação Normativa", "NR-01, NR-06, NR-10, NR-12, NR-35 (conforme aplicável)."),
      b("recommendations", "Plano de Ação", "Medida / Responsável / Prazo"),
      b("conclusion", "Conclusão"),
    ],
  },
  {
    id: "auditoria-franquias",
    name: "Auditoria de Franquias",
    area: "Auditoria",
    icon: "🏪",
    description: "Auditoria de padrão operacional em unidades franqueadas.",
    blocks: [
      b("cover", "Capa", "Relatório de Auditoria de Franquia"),
      b("identification", "Identificação da Unidade", "Marca:\nUnidade/Franqueado:\nCNPJ:\nEndereço:\nData da auditoria:"),
      b("introduction", "Escopo", "Verificação da aderência da unidade aos padrões da rede: fachada, layout, atendimento, produtos, processos, marketing e financeiro."),
      b("methodology", "Metodologia", "Aplicação de checklist de auditoria, mystery shopper, análise documental e entrevistas."),
      b("evidences", "Registros da Auditoria"),
      b("findings", "Conformidades e Desvios", "Pontuação por categoria:\n- Padrão visual:\n- Atendimento:\n- Operacional:\n- Financeiro:"),
      b("recommendations", "Plano de Adequação", "Ação / Responsável / Prazo"),
      b("conclusion", "Score Final e Parecer"),
    ],
  },
  {
    id: "paineis-solares",
    name: "Painéis Solares",
    area: "Energia Solar",
    icon: "☀️",
    description: "Inspeção e comissionamento de sistema fotovoltaico.",
    blocks: [
      b("cover", "Capa", "Laudo Técnico — Sistema Fotovoltaico"),
      b("identification", "Dados da Instalação", "Cliente:\nEndereço:\nPotência instalada (kWp):\nNº de módulos:\nInversor(es):\nData de comissionamento:"),
      b("introduction", "Objetivo", "Verificar a correta instalação, segurança elétrica e desempenho do sistema fotovoltaico conectado à rede."),
      b("methodology", "Metodologia", "Inspeção visual, medição de tensão/corrente em strings, termografia, verificação de aterramento e proteções (DPS, disjuntor CC/CA)."),
      b("evidences", "Registros Fotográficos e Termográficos"),
      b("findings", "Análise Técnica", "Estrutura de fixação:\nCabeamento CC/CA:\nString box:\nInversor:\nAterramento:\nGeração medida x estimada:"),
      b("rationale", "Normas Aplicáveis", "ABNT NBR 16690, NBR 5410, REN ANEEL 1.000/2021."),
      b("recommendations", "Recomendações"),
      b("conclusion", "Parecer Final"),
    ],
  },
  {
    id: "condominios",
    name: "Condomínios",
    area: "Gestão Predial",
    icon: "🏘️",
    description: "Vistoria geral de áreas comuns e sistemas do condomínio.",
    blocks: [
      b("cover", "Capa", "Relatório de Vistoria de Condomínio"),
      b("identification", "Identificação do Condomínio", "Nome:\nEndereço:\nCNPJ:\nSíndico(a):\nAdministradora:\nNº de unidades:"),
      b("introduction", "Objetivo", "Avaliar o estado de conservação das áreas comuns, equipamentos e sistemas de segurança do condomínio."),
      b("methodology", "Metodologia", "Vistoria visual acompanhada por representante do condomínio, abrangendo fachada, hall, garagem, áreas de lazer, casa de máquinas, reservatórios e itens de segurança contra incêndio."),
      b("evidences", "Registros Fotográficos"),
      b("findings", "Itens Vistoriados", "Fachada:\nÁreas de lazer:\nGaragem:\nElevadores:\nReservatórios:\nSPDA:\nExtintores/Hidrantes:\nGerador:"),
      b("recommendations", "Recomendações e Prioridades", "Imediato / Curto prazo / Longo prazo"),
      b("conclusion", "Conclusão"),
      b("attachments", "Anexos (AVCB, ART, etc.)"),
    ],
  },
];

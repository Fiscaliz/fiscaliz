import { STARTER_TEMPLATES, type StarterTemplate } from "./starterTemplates";
import { defaultBlock, type ReportBlock } from "./reportBuilder";

export type TemplateCategory =
  | "Fiscalização Sanitária"
  | "Inspeção Predial"
  | "Vistoria Veicular"
  | "Segurança do Trabalho"
  | "Auditoria de Franquias"
  | "Condomínios"
  | "Energia Solar"
  | "Agronegócio"
  | "Facilities"
  | "Template Personalizado";

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  "Fiscalização Sanitária",
  "Inspeção Predial",
  "Vistoria Veicular",
  "Segurança do Trabalho",
  "Auditoria de Franquias",
  "Condomínios",
  "Energia Solar",
  "Agronegócio",
  "Facilities",
  "Template Personalizado",
];

export interface LibraryTemplate extends StarterTemplate {
  category: TemplateCategory;
  cover: string; // tailwind gradient classes
  evidenceCategories: string[];
  checklist: string[];
  requiredFields: string[];
  conclusionTemplate: string;
}

const STARTER_MAP: Record<string, { category: TemplateCategory; cover: string; ev: string[]; chk: string[]; req: string[]; concl: string }> = {
  "fiscalizacao-sanitaria": {
    category: "Fiscalização Sanitária",
    cover: "from-emerald-500 via-teal-500 to-cyan-600",
    ev: ["Manipulação", "Estrutura", "Equipamentos", "Documentação", "Higiene"],
    chk: ["Higienização de superfícies", "Controle de temperatura", "Uso de EPI", "Validade dos produtos", "Documentação obrigatória"],
    req: ["Razão social", "CNPJ", "Endereço", "Responsável"],
    concl: "Estabelecimento avaliado conforme RDC 216/2004 e legislação sanitária municipal vigente.",
  },
  "inspecao-predial": {
    category: "Inspeção Predial",
    cover: "from-slate-600 via-blue-600 to-indigo-700",
    ev: ["Estrutura", "Cobertura", "Instalações elétricas", "Instalações hidráulicas", "Segurança contra incêndio"],
    chk: ["Fissuras estruturais", "Infiltrações", "Quadro elétrico", "Reservatórios", "Extintores e hidrantes"],
    req: ["Edificação", "Endereço", "Proprietário/Síndico", "Área construída"],
    concl: "Inspeção realizada conforme NBR 16747. Edificação apresenta estado de conservação conforme detalhado.",
  },
  "vistoria-veicular": {
    category: "Vistoria Veicular",
    cover: "from-zinc-700 via-red-600 to-orange-600",
    ev: ["Chassi", "Motor", "Lataria", "Documentação", "Interior"],
    chk: ["Numeração de chassi", "Numeração do motor", "Etiquetas de vidros", "Pneus", "Suspensão", "Freios"],
    req: ["Placa", "Chassi", "Marca/Modelo", "Proprietário"],
    concl: "Veículo APTO / INAPTO / APROVADO COM RESSALVAS, conforme análise técnica.",
  },
  "seguranca-trabalho": {
    category: "Segurança do Trabalho",
    cover: "from-amber-500 via-orange-600 to-red-600",
    ev: ["Riscos físicos", "Riscos químicos", "EPIs", "Sinalização", "Equipamentos"],
    chk: ["NR-06 (EPI)", "NR-10 (Elétrica)", "NR-12 (Máquinas)", "NR-35 (Altura)", "Treinamentos"],
    req: ["Empresa", "CNPJ", "Setor inspecionado", "Responsável SESMT"],
    concl: "Inspeção realizada conforme NRs aplicáveis. Plano de ação proposto.",
  },
  "auditoria-franquias": {
    category: "Auditoria de Franquias",
    cover: "from-fuchsia-600 via-purple-600 to-indigo-700",
    ev: ["Fachada", "Layout interno", "Atendimento", "Produtos", "Documentação"],
    chk: ["Padrão visual", "Atendimento ao cliente", "Operacional", "Estoque", "Financeiro"],
    req: ["Marca", "Unidade/Franqueado", "CNPJ", "Endereço"],
    concl: "Score final e plano de adequação conforme padrão da rede.",
  },
  "condominios": {
    category: "Condomínios",
    cover: "from-cyan-600 via-sky-600 to-blue-700",
    ev: ["Fachada", "Áreas comuns", "Garagem", "Casa de máquinas", "Segurança"],
    chk: ["Elevadores", "Reservatórios", "SPDA", "Extintores/Hidrantes", "Gerador", "AVCB"],
    req: ["Nome do condomínio", "Endereço", "Síndico", "Nº de unidades"],
    concl: "Vistoria geral realizada com identificação de prioridades imediatas, curto e longo prazo.",
  },
  "paineis-solares": {
    category: "Energia Solar",
    cover: "from-yellow-400 via-orange-500 to-rose-500",
    ev: ["Módulos", "Inversor", "String box", "Aterramento", "Termografia"],
    chk: ["Fixação estrutural", "Cabeamento CC/CA", "Proteções (DPS)", "Aterramento", "Geração x estimada"],
    req: ["Cliente", "Endereço", "Potência instalada (kWp)", "Nº de módulos"],
    concl: "Sistema fotovoltaico avaliado conforme NBR 16690, NBR 5410 e REN ANEEL 1.000/2021.",
  },
};

function emptyTemplate(id: string, name: string, category: TemplateCategory, area: string, icon: string, desc: string, cover: string): StarterTemplate {
  return {
    id,
    name,
    area,
    icon,
    description: desc,
    blocks: [
      defaultBlock("cover"),
      defaultBlock("identification"),
      defaultBlock("introduction"),
      defaultBlock("methodology"),
      defaultBlock("evidences"),
      defaultBlock("findings"),
      defaultBlock("recommendations"),
      defaultBlock("conclusion"),
    ],
  };
}

const EXTRA_TEMPLATES: Array<{ tpl: StarterTemplate; category: TemplateCategory; cover: string; ev: string[]; chk: string[]; req: string[]; concl: string }> = [
  {
    tpl: emptyTemplate("agronegocio", "Agronegócio", "Agronegócio", "Agronegócio", "🌾", "Vistoria técnica em propriedades rurais e produção agrícola.", "from-lime-500 via-green-600 to-emerald-700"),
    category: "Agronegócio",
    cover: "from-lime-500 via-green-600 to-emerald-700",
    ev: ["Lavoura", "Solo", "Maquinário", "Armazenagem", "Manejo"],
    chk: ["Análise de solo", "Pragas e doenças", "Aplicação de defensivos", "Irrigação", "Armazenagem de grãos"],
    req: ["Propriedade", "Produtor", "Área (ha)", "Cultura"],
    concl: "Vistoria rural concluída conforme boas práticas agronômicas.",
  },
  {
    tpl: emptyTemplate("facilities", "Facilities", "Facilities", "Facilities", "🏗️", "Inspeção de manutenção predial e gestão de facilities corporativas.", "from-violet-600 via-indigo-600 to-blue-700"),
    category: "Facilities",
    cover: "from-violet-600 via-indigo-600 to-blue-700",
    ev: ["HVAC", "Elétrica", "Hidráulica", "Limpeza", "Segurança patrimonial"],
    chk: ["Climatização", "Iluminação", "Sanitários", "Resíduos", "CFTV/Controle de acesso"],
    req: ["Edifício/Cliente", "Endereço", "Responsável", "Área (m²)"],
    concl: "Inspeção de facilities concluída com plano de manutenção preventiva e corretiva.",
  },
  {
    tpl: emptyTemplate("personalizado", "Template Personalizado", "Template Personalizado", "Geral", "✨", "Modelo em branco para você estruturar do seu jeito.", "from-slate-700 via-slate-800 to-zinc-900"),
    category: "Template Personalizado",
    cover: "from-slate-700 via-slate-800 to-zinc-900",
    ev: [],
    chk: [],
    req: [],
    concl: "",
  },
];

export const LIBRARY_TEMPLATES: LibraryTemplate[] = [
  ...STARTER_TEMPLATES.map((t) => {
    const meta = STARTER_MAP[t.id];
    return {
      ...t,
      category: meta.category,
      cover: meta.cover,
      evidenceCategories: meta.ev,
      checklist: meta.chk,
      requiredFields: meta.req,
      conclusionTemplate: meta.concl,
    } satisfies LibraryTemplate;
  }),
  ...EXTRA_TEMPLATES.map((e) => ({
    ...e.tpl,
    category: e.category,
    cover: e.cover,
    evidenceCategories: e.ev,
    checklist: e.chk,
    requiredFields: e.req,
    conclusionTemplate: e.concl,
  })),
];

// ---------- LocalStorage helpers ----------
const FAV_KEY = "if_template_favorites";
const RECENT_KEY = "if_template_recents";

export function getFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem(FAV_KEY) || "[]"); } catch { return []; }
}
export function toggleFavorite(id: string): string[] {
  const f = getFavorites();
  const n = f.includes(id) ? f.filter((x) => x !== id) : [...f, id];
  localStorage.setItem(FAV_KEY, JSON.stringify(n));
  return n;
}
export function getRecents(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
export function pushRecent(id: string) {
  const r = [id, ...getRecents().filter((x) => x !== id)].slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(r));
}

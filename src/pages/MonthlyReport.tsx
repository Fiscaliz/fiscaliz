import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  FileText, 
  Calendar as CalendarIcon, 
  Car, 
  Clock,
  Send,
  Lock,
  FileDown,
  Building2,
  Briefcase,
  Upload,
  AlertCircle,
  Edit2,
  Star,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BRASAO_GOIANIA_SVG, SUS_LOGO_SVG } from '@/lib/logos';
import { getRiskByCNAE } from '@/data/cnaeRiskTable';

interface DocumentSummary {
  termo_intimacao: number;
  visita_fiscal: number;
  auto_infracao: number;
  advertencia: number;
  inutilizacao: number;
  apreensao: number;
  interdicao: number;
  relatorio_tecnico: number;
  notificacao: number;
  replica: number;
  certidao: number;
  coleta_amostra: number;
}

// Interface para ações editáveis na tabela
interface EditableDailyAction {
  id: string;
  day: number;
  actionDate: string; // Data formatada para exibição (dd/MM)
  actionDateFull: string; // Data completa (YYYY-MM-DD) para ordenação cronológica
  transport: 'MPL' | 'CO' | '';
  actionType: string;
  establishment: string;
  establishmentId: string | null; // ID do estabelecimento para agrupamento
  document: string;
  documentNumber: string; // Número completo do documento (ex: TI-000001)
  documentId: string;
  documentType: string;
  isInternal: boolean;
  riskLevel: 'I' | 'II' | 'III' | null;
  difficultyGrade: 1 | 2;
  difficultyJustifications: string[];
  riskPoints: number;
  totalPoints: number;
  economicActivity: string; // Atividade Econômica/CNAE
  cnaeCode: string; // Código CNAE (A33, SA41, etc)
  scale: string; // Escala (Plantão Fiscal1, Plantão Fiscal2, etc)
}

// Interface para OS agrupada (múltiplas peças no mesmo estabelecimento/dia = 1 OS)
interface GroupedOS {
  key: string; // Chave única: establishmentId_date ou internalActivity_date
  day: number;
  actionDateFull: string;
  establishment: string;
  establishmentId: string | null;
  riskLevel: 'I' | 'II' | 'III' | null;
  riskPoints: number;
  difficultyGrade: 1 | 2;
  difficultyJustifications: string[];
  totalPoints: number;
  documents: string[]; // Lista de documentos emitidos
  isInternal: boolean;
  isCertidao: boolean; // Certidão = 1 ponto fixo
  isRelatorioAtividade: boolean; // Relatório de Atividade = 6 pontos fixos
}

// Tabela de pontos por risco sanitário (Tabela Anvisa)
// Baixo risco: 2 pts, Médio risco: 3 pts, Alto risco: 6 pts
const RISK_POINTS: Record<string, number> = {
  'I': 2,    // Baixo risco
  'II': 3,   // Médio risco
  'III': 6,  // Alto risco
};

const RISK_LABELS: Record<string, string> = {
  'I': 'Baixo',
  'II': 'Médio',
  'III': 'Alto',
};

// Fatores que justificam grau 2 de dificuldade
const DIFFICULTY_JUSTIFICATIONS = [
  { id: 'local_distante', label: 'Local distante' },
  { id: 'muito_tempo', label: 'Muito tempo na ação fiscal' },
  { id: 'varios_documentos', label: 'Geração de vários documentos' },
  { id: 'acao_complexa', label: 'Ação complexa com muitas irregularidades' },
  { id: 'analise_documental', label: 'Análise documental extensa' },
];
const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const documentTypeLabels: Record<string, string> = {
  termo_intimacao: 'Termo de Intimação',
  visita_fiscal: 'Visita Fiscal',
  auto_infracao: 'Auto de Infração',
  advertencia: 'Advertência',
  inutilizacao: 'Inutilização',
  apreensao: 'Apreensão',
  interdicao: 'Interdição',
  relatorio_tecnico: 'Parecer Técnico',
  notificacao: 'Notificação',
  replica: 'Réplica',
  certidao: 'Certidão Sanitária',
  coleta_amostra: 'Coleta de Amostra',
  relatorio_atividade: 'Relatório de Atividade',
};

const documentTypeAbbreviation: Record<string, string> = {
  termo_intimacao: 'TI',
  visita_fiscal: 'VF',
  auto_infracao: 'AI',
  advertencia: 'ADV',
  inutilizacao: 'INUT',
  apreensao: 'APR',
  interdicao: 'INT',
  relatorio_tecnico: 'PAR',
  notificacao: 'NOT',
  replica: 'REP',
  certidao: 'CERT',
  coleta_amostra: 'CA',
  relatorio_atividade: 'RA',
};

const licenseTypes = [
  { id: 'ferias', label: 'Férias', needsAttachment: false, needsCompensation: false },
  { id: 'licenca_premio', label: 'Licença Prêmio', needsAttachment: false, needsCompensation: false },
  { id: 'licenca_medica', label: 'Licença Médica', needsAttachment: false, needsCompensation: false },
  { id: 'atestado_medico', label: 'Atestado Médico', needsAttachment: true, needsCompensation: false },
  { id: 'compensacao_horas', label: 'Compensação de Horas', needsAttachment: false, needsCompensation: true },
];

export default function MonthlyReport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  const [report, setReport] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [editingPreview, setEditingPreview] = useState(false);
  const [dailyActions, setDailyActions] = useState<EditableDailyAction[]>([]);
  
  // Período - Licenças
  const [selectedLicenseType, setSelectedLicenseType] = useState<string | null>(null);
  const [licenseStartDate, setLicenseStartDate] = useState<Date | undefined>();
  const [licenseEndDate, setLicenseEndDate] = useState<Date | undefined>();
  const [licenseAttachment, setLicenseAttachment] = useState<string | null>(null);
  
  // Compensação de horas
  const [compensationOriginDate, setCompensationOriginDate] = useState<Date | undefined>();
  const [compensationEnjoyDate, setCompensationEnjoyDate] = useState<Date | undefined>();
  
  // OS (campos manuais que ainda são necessários)
  const [osNumber, setOsNumber] = useState('');
  const [daysToWork, setDaysToWork] = useState('');
  const [osProgramadas, setOsProgramadas] = useState(''); // OS a Cumprir (Pontos Programados) - campo separado
  const [pfeDays, setPfeDays] = useState('');
  
  // Campos editáveis na prévia (valores calculados que podem ser ajustados)
  const [editedMplDays, setEditedMplDays] = useState<number | null>(null);
  const [editedCoDays, setEditedCoDays] = useState<number | null>(null);
  const [editedFieldDays, setEditedFieldDays] = useState<number | null>(null);
  const [editedInternalDays, setEditedInternalDays] = useState<number | null>(null);
  
  // Edições de grau de dificuldade por OS agrupada (chave: osKey, valor: {grade, justifications})
  const [osGradeOverrides, setOsGradeOverrides] = useState<Map<string, { grade: 1 | 2; justifications: string[] }>>(new Map());
  
  const [documentSummary, setDocumentSummary] = useState<DocumentSummary>({
    termo_intimacao: 0,
    visita_fiscal: 0,
    auto_infracao: 0,
    advertencia: 0,
    inutilizacao: 0,
    apreensao: 0,
    interdicao: 0,
    relatorio_tecnico: 0,
    notificacao: 0,
    replica: 0,
    certidao: 0,
    coleta_amostra: 0,
  });

  // Calcula automaticamente MPL, CO, dias em campo e dias internos
  const calculatedStats = useMemo(() => {
    // Agrupar ações por DATA COMPLETA (YYYY-MM-DD) para contar dias únicos
    const dayMap = new Map<string, { hasMpl: boolean; hasCo: boolean; hasField: boolean; hasInternal: boolean }>();
    
    dailyActions.forEach(action => {
      // Usar actionDateFull (YYYY-MM-DD) como chave para agrupar por data completa
      const dateKey = action.actionDateFull;
      const existing = dayMap.get(dateKey) || { hasMpl: false, hasCo: false, hasField: false, hasInternal: false };
      
      // MPL/CO só conta para ações de campo (não internas)
      if (!action.isInternal && action.transport) {
        if (action.transport === 'MPL') {
          existing.hasMpl = true;
        } else if (action.transport === 'CO') {
          existing.hasCo = true;
        }
      }
      
      if (action.isInternal) {
        existing.hasInternal = true;
      } else {
        existing.hasField = true;
      }
      
      dayMap.set(dateKey, existing);
    });
    
    let mplDays = 0;
    let coDays = 0;
    let fieldDays = 0;
    let internalDays = 0;
    
    dayMap.forEach(day => {
      // 1 MPL por dia trabalhado com veículo próprio (não acumula)
      if (day.hasMpl) mplDays++;
      if (day.hasCo) coDays++;
      if (day.hasField) fieldDays++;
      if (day.hasInternal) internalDays++;
    });
    
    return { mplDays, coDays, fieldDays, internalDays };
  }, [dailyActions]);

  // Agrupar ações por estabelecimento+dia para calcular OS corretamente
  // Múltiplas peças no mesmo estabelecimento no mesmo dia = 1 OS
  const groupedOS = useMemo((): GroupedOS[] => {
    const osMap = new Map<string, GroupedOS>();
    
    dailyActions.forEach(action => {
      // Chave de agrupamento: estabelecimento_id + data ou establishment_name + data para atividades internas
      const groupKey = action.isInternal 
        ? `internal_${action.establishment}_${action.actionDateFull}`
        : `${action.establishmentId || action.establishment}_${action.actionDateFull}`;
      
      const existing = osMap.get(groupKey);
      
      if (existing) {
        // Adicionar documento à OS existente
        existing.documents.push(action.documentNumber);
        // Usar o maior grau de dificuldade do grupo (se não tiver override)
        if (!osGradeOverrides.has(groupKey) && action.difficultyGrade > existing.difficultyGrade) {
          existing.difficultyGrade = action.difficultyGrade;
          existing.difficultyJustifications = action.difficultyJustifications;
          existing.totalPoints = existing.riskPoints * action.difficultyGrade;
        }
        // Verificar se é certidão
        if (action.documentType === 'certidao') {
          existing.isCertidao = true;
        }
      } else {
        // Criar nova OS
        const isCertidao = action.documentType === 'certidao';
        const isRelatorioAtividade = action.documentType === 'relatorio_atividade';
        
        // Relatório de Atividade = 6 pts fixos, Certidão = 1 pt fixo
        const riskPoints = isRelatorioAtividade ? 6 : (isCertidao ? 1 : action.riskPoints);
        
        // Verificar se há override de grau (não aplicável para certidão e relatório de atividade)
        const override = osGradeOverrides.get(groupKey);
        const grade = override?.grade ?? (isCertidao || isRelatorioAtividade ? 1 : action.difficultyGrade);
        const justifications = override?.justifications ?? (isCertidao || isRelatorioAtividade ? [] : action.difficultyJustifications);
        
        // Calcular pontos totais
        const calculatedPoints = isRelatorioAtividade ? 6 : (isCertidao ? 1 : riskPoints * grade);
        
        osMap.set(groupKey, {
          key: groupKey,
          day: action.day,
          actionDateFull: action.actionDateFull,
          establishment: action.establishment,
          establishmentId: action.establishmentId,
          riskLevel: action.riskLevel,
          riskPoints,
          difficultyGrade: grade,
          difficultyJustifications: justifications,
          totalPoints: calculatedPoints,
          documents: [action.documentNumber],
          isInternal: action.isInternal,
          isCertidao,
          isRelatorioAtividade,
        });
      }
    });
    
    // Aplicar overrides às OS já criadas (não aplicável para certidão e relatório de atividade)
    osGradeOverrides.forEach((override, key) => {
      const os = osMap.get(key);
      if (os && !os.isCertidao && !os.isRelatorioAtividade) {
        os.difficultyGrade = override.grade;
        os.difficultyJustifications = override.justifications;
        os.totalPoints = os.riskPoints * override.grade;
      }
    });
    
    return Array.from(osMap.values()).sort((a, b) => 
      a.actionDateFull.localeCompare(b.actionDateFull)
    );
  }, [dailyActions, osGradeOverrides]);

  // Função para atualizar o grau de dificuldade de uma OS agrupada
  const updateOsGrade = (osKey: string, grade: 1 | 2, justifications: string[] = []) => {
    setOsGradeOverrides(prev => {
      const newMap = new Map(prev);
      newMap.set(osKey, { grade, justifications });
      return newMap;
    });
  };

  // Função para alternar justificativas de uma OS
  const toggleOsJustification = (osKey: string, justificationId: string) => {
    const current = osGradeOverrides.get(osKey);
    const currentJustifications = current?.justifications || [];
    const grade = current?.grade || 2;
    
    const newJustifications = currentJustifications.includes(justificationId)
      ? currentJustifications.filter(j => j !== justificationId)
      : [...currentJustifications, justificationId];
    
    updateOsGrade(osKey, grade, newJustifications);
  };

  // Calcular pontos totais baseado nas OS agrupadas (não nas peças individuais)
  // Certidão = 1 ponto fixo, Relatório de Atividade = 6 pontos fixos
  const totalPoints = useMemo(() => {
    let basePoints = 0;
    let totalWithGrade = 0;
    
    groupedOS.forEach(os => {
      if (os.isCertidao) {
        basePoints += 1;
        totalWithGrade += 1;
      } else if (os.isRelatorioAtividade) {
        basePoints += 6;
        totalWithGrade += 6;
      } else {
        basePoints += os.riskPoints;
        totalWithGrade += os.totalPoints;
      }
    });
    
    return { basePoints, totalWithGrade };
  }, [groupedOS]);

  // OS Cumprida é igual aos pontos gerados (totalWithGrade) baseado nas OS agrupadas
  const osCumprida = totalPoints.totalWithGrade;

  // Valores finais (editados ou calculados)
  const finalMplDays = editedMplDays ?? calculatedStats.mplDays;
  const finalCoDays = editedCoDays ?? calculatedStats.coDays;
  const finalFieldDays = editedFieldDays ?? calculatedStats.fieldDays;
  const finalInternalDays = editedInternalDays ?? calculatedStats.internalDays;

  useEffect(() => {
    if (user) {
      loadProfile();
      loadReport();
      loadDocumentStats();
      loadDailyActions();
    }
  }, [user, selectedMonth, selectedYear]);

  const loadProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }

    if (!data) {
      const fallbackFullName =
        (user.user_metadata as any)?.full_name ||
        user.email?.split('@')[0] ||
        'Usuário';

      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: fallbackFullName,
        })
        .select('*')
        .maybeSingle();

      if (!createError && created) setProfile(created);
      return;
    }

    setProfile(data);
  };

  const loadReport = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data } = await supabase
      .from('monthly_reports')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', selectedMonth)
      .eq('year', selectedYear)
      .maybeSingle();

    if (data) {
      setReport(data);
      setOsNumber(data.os_number || '');
      setDaysToWork(data.days_to_work?.toString() || '');
      setPfeDays(data.pfe_days?.toString() || '');
      setSelectedLicenseType(data.license_type || null);
      setLicenseStartDate(data.license_start_date ? new Date(data.license_start_date) : undefined);
      setLicenseEndDate(data.license_end_date ? new Date(data.license_end_date) : undefined);
      setLicenseAttachment(data.license_attachment_url || null);
      
      if (data.documents_summary) {
        setDocumentSummary(data.documents_summary as unknown as DocumentSummary);
      }
    } else {
      setReport(null);
      resetForm();
    }
    
    setLoading(false);
  };

  const resetForm = () => {
    setOsNumber('');
    setDaysToWork('');
    setPfeDays('');
    setSelectedLicenseType(null);
    setLicenseStartDate(undefined);
    setLicenseEndDate(undefined);
    setLicenseAttachment(null);
    setCompensationOriginDate(undefined);
    setCompensationEnjoyDate(undefined);
    setEditedMplDays(null);
    setEditedCoDays(null);
    setEditedFieldDays(null);
    setEditedInternalDays(null);
  };

  const loadDocumentStats = async () => {
    if (!user) return;
    
    const startDate = format(new Date(selectedYear, selectedMonth - 1, 1), 'yyyy-MM-dd');
    const endDate = format(new Date(selectedYear, selectedMonth, 0), 'yyyy-MM-dd');
    
    // Buscar todos os documentos e filtrar localmente pela data do documento (content.document_date)
    const { data } = await supabase
      .from('fiscal_documents')
      .select('document_type, status, content')
      .eq('user_id', user.id)
      .in('status', ['sent', 'draft']);

    if (data) {
      const summary: DocumentSummary = {
        termo_intimacao: 0,
        visita_fiscal: 0,
        auto_infracao: 0,
        advertencia: 0,
        inutilizacao: 0,
        apreensao: 0,
        interdicao: 0,
        relatorio_tecnico: 0,
        notificacao: 0,
        replica: 0,
        certidao: 0,
        coleta_amostra: 0,
      };
      
      // Filtrar pela data real da fiscalização (content.document_date)
      const filteredDocs = data.filter(doc => {
        const content = doc.content as any || {};
        const docDate = content.document_date;
        if (!docDate) return false;
        return docDate >= startDate && docDate <= endDate;
      });
      
      filteredDocs.forEach(doc => {
        const type = doc.document_type as keyof DocumentSummary;
        if (type in summary) {
          summary[type]++;
        }
      });
      
      setDocumentSummary(summary);
    }
  };

  const [fullDocuments, setFullDocuments] = useState<any[]>([]);

  const loadDailyActions = async () => {
    if (!user) return;
    
    const startDate = format(new Date(selectedYear, selectedMonth - 1, 1), 'yyyy-MM-dd');
    const endDate = format(new Date(selectedYear, selectedMonth, 0), 'yyyy-MM-dd');
    
    // Buscar todos os documentos e filtrar localmente pela data do documento (content.document_date)
    const { data } = await supabase
      .from('fiscal_documents')
      .select(`
        id,
        document_type,
        document_number,
        created_at,
        action_date,
        content,
        irregularities,
        attachments,
        deadline_days,
        deadline_date,
        establishment_id,
        fiscal_action_id,
        status,
        establishments(*),
        fiscal_actions(reason, reason_details)
      `)
      .eq('user_id', user.id)
      .in('status', ['sent', 'draft']);

    if (data) {
      // Filtrar pela data real da fiscalização (content.document_date)
      const filteredData = data.filter((doc: any) => {
        const content = doc.content || {};
        const docDate = content.document_date;
        if (!docDate) return false;
        return docDate >= startDate && docDate <= endDate;
      });
      
      // Store full documents for PDF attachment
      setFullDocuments(filteredData);
      
      let actions: EditableDailyAction[] = filteredData.map((doc: any) => {
        const content = doc.content || {};
        // Usar content.document_date como a data real da fiscalização
        let dayNumber: number;
        let actionDateFormatted: string;
        let actionDateFull: string; // Para ordenação cronológica
        const docDate = content.document_date;
        if (docDate) {
          const parts = docDate.split('-');
          dayNumber = parseInt(parts[2], 10);
          actionDateFormatted = `${parts[2]}/${parts[1]}`;
          actionDateFull = docDate; // YYYY-MM-DD para ordenação
        } else if (doc.action_date) {
          const parts = doc.action_date.split('-');
          dayNumber = parseInt(parts[2], 10);
          actionDateFormatted = `${parts[2]}/${parts[1]}`;
          actionDateFull = doc.action_date;
        } else {
          const createdDate = new Date(doc.created_at);
          dayNumber = createdDate.getDate();
          actionDateFormatted = format(createdDate, 'dd/MM');
          actionDateFull = format(createdDate, 'yyyy-MM-dd');
        }
        const isInternal = doc.document_type === 'relatorio_atividade' || !doc.establishment_id;
        const isRelatorioAtividade = doc.document_type === 'relatorio_atividade';
        
        // Determinar transporte baseado no conteúdo do documento - vazio para atividades internas
        const transport: 'MPL' | 'CO' | '' = isInternal ? '' : (content.transport_mode || 'MPL');
        
        // Obter nível de risco do estabelecimento
        // Relatório de Atividade (Elaboração de Relatório Mensal) = 6 pontos fixos
        const riskLevel = doc.establishments?.risk_level as 'I' | 'II' | 'III' | null;
        const riskPoints = isRelatorioAtividade ? 6 : (riskLevel ? RISK_POINTS[riskLevel] : 0);
        
        // Usar razão social como nome principal
        const establishmentName = doc.establishments?.razao_social || 
          content.atividade_descricao || 
          'Atividade Interna';
        
        // Grau de dificuldade (1 = normal, 2 = com justificativa)
        // Relatório de Atividade não usa grau de dificuldade (já é fixo em 6)
        const difficultyGrade: 1 | 2 = isRelatorioAtividade ? 1 : (content.difficulty_grade || 1);
        const difficultyJustifications = isRelatorioAtividade ? [] : (content.difficulty_justifications || []);
        const totalPoints = isRelatorioAtividade ? 6 : (riskPoints * difficultyGrade);
        
        // Determinar tipo de ação baseado no motivo da fiscal_action
        // Mapeamento: rotina->Inspeção, denuncia->Denúncia, relatorio_tecnico->RT, investigativa->Insp.Investigativa, etc.
        const fiscalActionReason = doc.fiscal_actions?.reason as string | undefined;
        const reasonLabels: Record<string, string> = {
          'rotina': 'Inspeção',
          'denuncia': 'Denúncia',
          'relatorio_tecnico': 'RT',
          'investigativa': 'Insp.Invest.',
          'demanda_chefia': 'Demanda',
          'surto': 'Surto',
          'operacao_conjunta': 'Op.Conjunta',
          'coleta': 'Coleta',
          'demanda_especifica': 'Demanda',
          'demanda_interna': 'Demanda',
          'pfe': 'PFE',
          'outros': 'Outros',
        };
        
        let actionType = 'Inspeção';
        if (isInternal) {
          actionType = 'Serviço Interno';
        } else if (content.is_reinspection || content.reinspcao) {
          actionType = 'Reinspeção';
        } else if (fiscalActionReason && reasonLabels[fiscalActionReason]) {
          actionType = reasonLabels[fiscalActionReason];
        } else if (content.action_type) {
          actionType = content.action_type;
        }
        
        // Obter atividade econômica/CNAE do estabelecimento (CNAE é a fonte de verdade para risco sanitário)
        const cnaeCode = doc.establishments?.cnae_principal || '';
        // Buscar descrição da atividade econômica pela tabela CNAE
        const cnaeEntry = cnaeCode ? getRiskByCNAE(cnaeCode) : null;
        // Atividade = CNAE descrição (não usar nome fantasia)
        const economicActivity = cnaeEntry?.description || 
          content.atividade_economica ||
          cnaeCode || // Usar o código CNAE se não tiver descrição
          '';
        
        // Escala (Plantão Fiscal1 como padrão)
        const scale = content.scale || 'Plantão Fiscal1';
        
        // Número do documento
        const docAbbrev = documentTypeAbbreviation[doc.document_type] || 'DOC';
        const documentNumber = doc.document_number || docAbbrev;
        
        return {
          id: doc.id,
          day: dayNumber,
          actionDate: actionDateFormatted,
          actionDateFull, // Nova propriedade para ordenação
          transport,
          actionType,
          establishment: establishmentName,
          establishmentId: doc.establishment_id || null, // ID para agrupamento de OS
          document: docAbbrev,
          documentNumber,
          documentId: doc.id,
          documentType: doc.document_type,
          isInternal,
          riskLevel,
          difficultyGrade,
          difficultyJustifications,
          riskPoints,
          totalPoints,
          economicActivity,
          cnaeCode,
          scale,
        };
      });
      
      setDailyActions(actions);
    }
  };

  // Função para atualizar uma ação na tabela
  const updateDailyAction = (id: string, field: keyof EditableDailyAction, value: any) => {
    setDailyActions(prev => prev.map(action => {
      if (action.id !== id) return action;
      
      const updated = { ...action, [field]: value };
      
      // Recalcular pontos se necessário
      if (field === 'riskLevel') {
        updated.riskPoints = value ? RISK_POINTS[value as 'I' | 'II' | 'III'] : 0;
        updated.totalPoints = updated.riskPoints * updated.difficultyGrade;
      }
      if (field === 'difficultyGrade') {
        updated.totalPoints = updated.riskPoints * (value as 1 | 2);
      }
      
      return updated;
    }));
  };

  const toggleDifficultyJustification = (actionId: string, justificationId: string) => {
    const action = dailyActions.find(a => a.id === actionId);
    if (!action) return;
    
    const newJustifications = action.difficultyJustifications.includes(justificationId)
      ? action.difficultyJustifications.filter(j => j !== justificationId)
      : [...action.difficultyJustifications, justificationId];
    
    updateDailyAction(actionId, 'difficultyJustifications', newJustifications);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    
    try {
      const reportData = {
        user_id: user.id,
        month: selectedMonth,
        year: selectedYear,
        os_number: osNumber,
        days_to_work: parseInt(daysToWork) || 0,
        pfe_days: parseInt(pfeDays) || 0,
        field_days: finalFieldDays,
        internal_days: finalInternalDays,
        duty_days: 0,
        transportation_mode: finalMplDays > 0 ? 'MPL' : 'CO',
        license_type: selectedLicenseType,
        license_start_date: licenseStartDate?.toISOString().split('T')[0] || null,
        license_end_date: licenseEndDate?.toISOString().split('T')[0] || null,
        license_attachment_url: licenseAttachment,
        documents_summary: JSON.parse(JSON.stringify(documentSummary)),
        total_fiscalizations: Object.values(documentSummary).reduce((a, b) => a + b, 0),
      };

      if (report?.id) {
        const { error } = await supabase
          .from('monthly_reports')
          .update(reportData)
          .eq('id', report.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('monthly_reports')
          .insert([reportData]);
        if (error) throw error;
      }

      toast({
        title: 'Relatório salvo!',
        description: 'As alterações foram salvas com sucesso.',
      });
      
      loadReport();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSendReport = async () => {
    if (!user) return;
    
    try {
      await handleSave();
      
      const { error } = await supabase
        .from('monthly_reports')
        .update({
          status: 'sent',
          is_locked: true,
          sent_at: new Date().toISOString()
        })
        .eq('id', report?.id);
      
      if (error) throw error;

      toast({
        title: 'Relatório enviado!',
        description: `Relatório de ${months[selectedMonth - 1]}/${selectedYear} enviado com sucesso.`,
      });
      
      loadReport();
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleGeneratePDF = () => {
    setShowPDFPreview(true);
  };

  const handleLicenseSelect = (licenseId: string) => {
    if (selectedLicenseType === licenseId) {
      setSelectedLicenseType(null);
      setLicenseStartDate(undefined);
      setLicenseEndDate(undefined);
    } else {
      setSelectedLicenseType(licenseId);
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const filePath = `attachments/${user.id}/${Date.now()}-${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('fiscal-photos')
      .upload(filePath, file);

    if (error) {
      toast({
        title: 'Erro ao anexar',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const { data: urlData } = supabase.storage
      .from('fiscal-photos')
      .getPublicUrl(filePath);

    setLicenseAttachment(urlData.publicUrl);
    toast({
      title: 'Anexo enviado!',
      description: 'O atestado foi anexado com sucesso.',
    });
  };

  const totalDocuments = Object.values(documentSummary).reduce((a, b) => a + b, 0);
  const isLocked = report?.is_locked;

  // PDF Preview com edição
  if (showPDFPreview) {
    return (
      <div className="min-h-screen bg-white text-black print:text-black" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
        <style>{`
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
            .page-break { page-break-after: always; }
          }
          .section-title { background: #003366; color: white; padding: 8px; font-weight: bold; margin-bottom: 10px; }
          .info-row { display: flex; margin: 5px 0; }
          .info-label { font-weight: bold; width: 40%; }
          .info-value { width: 60%; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #333; padding: 6px; text-align: left; font-size: 10pt; }
          th { background: #f0f0f0; font-weight: bold; }
          .editable-field { background: #fffbeb; }
          .editable-input { background: #fffbeb; border: 1px solid #f59e0b; padding: 2px 4px; font-size: 10pt; }
        `}</style>

        <div className="p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 border-b-2 border-blue-900 pb-4">
            <div className="flex justify-center items-center gap-4 mb-3">
              <img src={BRASAO_GOIANIA_SVG} alt="Brasão de Goiânia" className="h-16 w-auto" />
              <img src={SUS_LOGO_SVG} alt="SUS" className="h-10 w-auto" />
            </div>
            <h1 className="text-sm font-bold text-blue-900">PREFEITURA MUNICIPAL DE GOIÂNIA</h1>
            <h1 className="text-sm font-bold text-blue-900">SECRETARIA MUNICIPAL DE SAÚDE</h1>
            <h2 className="text-xs text-gray-600">DIRETORIA DE VIGILÂNCIA SANITÁRIA E AMBIENTAL</h2>
            <h2 className="text-xs text-gray-600 mt-2">
              RELATÓRIO MENSAL DE PRODUTIVIDADE - {months[selectedMonth - 1].toUpperCase()}/{selectedYear}
            </h2>
          </div>

          {/* Modo de edição */}
          {!isLocked && (
            <div className="no-print mb-4 flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <Edit2 className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700">
                {editingPreview 
                  ? 'Editando - Clique nos campos amarelos para modificar os valores'
                  : 'Todos os campos são editáveis antes de enviar'}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-auto"
                onClick={() => setEditingPreview(!editingPreview)}
              >
                {editingPreview ? 'Concluir Edição' : 'Editar Valores'}
              </Button>
            </div>
          )}

          {/* Identificação */}
          <div className="mb-6">
            <div className="section-title">IDENTIFICAÇÃO DO SERVIDOR</div>
            <div className="info-row"><span className="info-label">Nome:</span><span className="info-value">{profile?.full_name}</span></div>
            <div className="info-row"><span className="info-label">Matrícula:</span><span className="info-value">{profile?.registration_number || '-'}</span></div>
            <div className="info-row"><span className="info-label">Coordenação:</span><span className="info-value">{profile?.division || 'CFA'}</span></div>
            <div className="info-row"><span className="info-label">Nº OS:</span><span className="info-value">{osNumber || '-'}</span></div>
            <div className="info-row"><span className="info-label">Período:</span><span className="info-value">01 a {new Date(selectedYear, selectedMonth, 0).getDate()}/{selectedMonth.toString().padStart(2, '0')}/{selectedYear}</span></div>
          </div>

          {/* Licença (se houver) */}
          {selectedLicenseType && (
            <div className="mb-6">
              <div className="section-title">AFASTAMENTO NO PERÍODO</div>
              <div className="info-row">
                <span className="info-label">Tipo:</span>
                <span className="info-value">{licenseTypes.find(l => l.id === selectedLicenseType)?.label}</span>
              </div>
              {selectedLicenseType === 'compensacao_horas' ? (
                <>
                  <div className="info-row">
                    <span className="info-label">Data que Gerou Banco:</span>
                    <span className="info-value">
                      {compensationOriginDate ? format(compensationOriginDate, 'dd/MM/yyyy') : '-'}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Data de Gozo:</span>
                    <span className="info-value">
                      {compensationEnjoyDate ? format(compensationEnjoyDate, 'dd/MM/yyyy') : '-'}
                    </span>
                  </div>
                </>
              ) : (
                <div className="info-row">
                  <span className="info-label">Período de Gozo:</span>
                  <span className="info-value">
                    {licenseStartDate ? format(licenseStartDate, 'dd/MM/yyyy') : '-'} a {licenseEndDate ? format(licenseEndDate, 'dd/MM/yyyy') : '-'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Escala */}
          <div className="mb-6">
            <div className="section-title">ESCALA DE TRABALHO</div>
            <table>
              <thead>
                <tr><th>Tipo de Atividade</th><th>Dias/Pontos</th></tr>
              </thead>
              <tbody>
                <tr><td>Dias a Cumprir no Período</td><td>{daysToWork || 0}</td></tr>
                <tr>
                  <td>OS a Cumprir (Pontos Programados)</td>
                  <td className={editingPreview ? 'editable-field' : ''}>
                    {editingPreview ? (
                      <input
                        type="number"
                        value={osProgramadas}
                        onChange={(e) => setOsProgramadas(e.target.value)}
                        className="editable-input w-16"
                      />
                    ) : osProgramadas}
                  </td>
                </tr>
                <tr>
                  <td>OS Cumprida (Pontos Gerados)</td>
                  <td className="font-bold">{osCumprida}</td>
                </tr>
                <tr>
                  <td>Fiscalização em Área</td>
                  <td className={editingPreview ? 'editable-field' : ''}>
                    {editingPreview ? (
                      <input
                        type="number"
                        value={finalFieldDays}
                        onChange={(e) => setEditedFieldDays(parseInt(e.target.value) || 0)}
                        className="editable-input w-16"
                      />
                    ) : finalFieldDays}
                  </td>
                </tr>
                <tr>
                  <td>Ação Interna</td>
                  <td className={editingPreview ? 'editable-field' : ''}>
                    {editingPreview ? (
                      <input
                        type="number"
                        value={finalInternalDays}
                        onChange={(e) => setEditedInternalDays(parseInt(e.target.value) || 0)}
                        className="editable-input w-16"
                      />
                    ) : finalInternalDays}
                  </td>
                </tr>
                <tr><td>Plantão Fiscal Especial (PFE)</td><td>{pfeDays || 0}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Locomoção */}
          <div className="mb-6">
            <div className="section-title">MEIO DE LOCOMOÇÃO</div>
            <table>
              <thead>
                <tr><th>Tipo</th><th>Saídas (dias)</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>MPL - Meios Próprios de Locomoção</td>
                  <td className={editingPreview ? 'editable-field' : ''}>
                    {editingPreview ? (
                      <input
                        type="number"
                        value={editedMplDays ?? calculatedStats.mplDays}
                        onChange={(e) => setEditedMplDays(parseInt(e.target.value) || 0)}
                        className="editable-input w-16"
                      />
                    ) : finalMplDays}
                  </td>
                </tr>
                <tr>
                  <td>CO - Carro Oficial</td>
                  <td className={editingPreview ? 'editable-field' : ''}>
                    {editingPreview ? (
                      <input
                        type="number"
                        value={editedCoDays ?? calculatedStats.coDays}
                        onChange={(e) => setEditedCoDays(parseInt(e.target.value) || 0)}
                        className="editable-input w-16"
                      />
                    ) : finalCoDays}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Page Break */}
          <div className="page-break" />

          {/* Ações - Tabela no formato do modelo oficial DESCRIÇÃO DOS PROCEDIMENTOS */}
          <div className="mb-6">
            <div className="section-title">DESCRIÇÃO DOS PROCEDIMENTOS</div>
            <table style={{ fontSize: '8pt' }}>
              <thead>
                <tr>
                  <th style={{ width: '35px', textAlign: 'center' }}>Dia</th>
                  <th style={{ width: '40px', textAlign: 'center' }}>ML</th>
                  <th style={{ width: '80px' }}>Ação</th>
                  
                  <th style={{ width: '50px', textAlign: 'center' }}>Niv.Gr.</th>
                  <th>Estabelecimento/Descrição</th>
                  <th style={{ width: '45px', textAlign: 'center' }}>Cód.</th>
                  <th style={{ width: '100px' }}>Atividade Econômica/Tipo de Ação</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>Doc.Em.</th>
                  
                </tr>
              </thead>
              <tbody>
                {dailyActions
                  .slice() // Criar cópia para não mutar original
                  .sort((a, b) => a.actionDateFull.localeCompare(b.actionDateFull)) // Ordenação cronológica pela data da ação fiscal
                  .map((action) => (
                  <tr key={action.id}>
                    <td style={{ textAlign: 'center' }} className={editingPreview ? 'editable-field' : ''}>
                      {editingPreview ? (
                        <input
                          type="number"
                          min="1"
                          max="31"
                          value={action.day}
                          onChange={(e) => updateDailyAction(action.id, 'day', parseInt(e.target.value) || 1)}
                          className="editable-input w-10"
                        />
                      ) : action.day}
                    </td>
                    <td style={{ textAlign: 'center' }} className={editingPreview ? 'editable-field' : ''}>
                      {editingPreview ? (
                        <select
                          value={action.transport}
                          onChange={(e) => updateDailyAction(action.id, 'transport', e.target.value)}
                          className="editable-input w-12"
                        >
                          <option value="">-</option>
                          <option value="MPL">MPL</option>
                          <option value="CO">CO</option>
                        </select>
                      ) : action.transport || '-'}
                    </td>
                    <td className={editingPreview ? 'editable-field' : ''}>
                      {editingPreview ? (
                        <select
                          value={action.actionType}
                          onChange={(e) => updateDailyAction(action.id, 'actionType', e.target.value)}
                          className="editable-input w-full"
                        >
                          <option value="Inspeção">Inspeção</option>
                          <option value="Reinspeção">Reinspeção</option>
                          <option value="Denúncia">Denúncia</option>
                          <option value="Insp.Invest.">Insp.Invest.</option>
                          <option value="RT">RT</option>
                          <option value="Demanda">Demanda</option>
                          <option value="Surto">Surto</option>
                          <option value="Op.Conjunta">Op.Conjunta</option>
                          <option value="Coleta">Coleta</option>
                          <option value="PFE">PFE</option>
                          <option value="Serviço Interno">Serviço Interno</option>
                        </select>
                      ) : action.actionType}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {action.riskLevel ? (
                        <>x {action.difficultyGrade === 2 ? 'x' : ''}</>
                      ) : '-'}
                    </td>
                    <td className={editingPreview ? 'editable-field' : ''}>
                      {editingPreview ? (
                        <input
                          type="text"
                          value={action.establishment}
                          onChange={(e) => updateDailyAction(action.id, 'establishment', e.target.value)}
                          className="editable-input w-full"
                        />
                      ) : action.establishment}
                    </td>
                    <td style={{ textAlign: 'center' }} className={editingPreview ? 'editable-field' : ''}>
                      {editingPreview ? (
                        <input
                          type="text"
                          value={action.cnaeCode}
                          onChange={(e) => updateDailyAction(action.id, 'cnaeCode', e.target.value)}
                          className="editable-input w-12"
                          placeholder="-"
                        />
                      ) : (action.cnaeCode ? action.cnaeCode.replace(/[^0-9]/g, '').slice(0, 4) : '-')}
                    </td>
                    <td className={editingPreview ? 'editable-field' : ''}>
                      {editingPreview ? (
                        <input
                          type="text"
                          value={action.economicActivity}
                          onChange={(e) => updateDailyAction(action.id, 'economicActivity', e.target.value)}
                          className="editable-input w-full"
                        />
                      ) : (action.economicActivity || '-')}
                    </td>
                    <td style={{ textAlign: 'center' }} className={editingPreview ? 'editable-field' : ''}>
                      {editingPreview ? (
                        <input
                          type="text"
                          value={action.documentNumber}
                          onChange={(e) => updateDailyAction(action.id, 'documentNumber', e.target.value)}
                          className="editable-input w-16"
                        />
                      ) : action.documentNumber}
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Contagem de MPL e CO no rodapé da tabela */}
            <div className="mt-3 p-2 bg-gray-50 border border-gray-200 text-xs flex justify-between">
              <div>
                <strong>Total de Saídas:</strong> {dailyActions.filter(a => a.transport).length}
              </div>
              <div>
                <strong>MPL:</strong> {finalMplDays} | <strong>CO:</strong> {finalCoDays}
              </div>
            </div>
          </div>

          {/* Page Break */}
          <div className="page-break" />

          {/* TABELA DE PONTOS - NOVA SEÇÃO */}
          <div className="mb-6">
            <div className="section-title">TABELA DE PONTOS - CUMPRIMENTO DA OS MENSAL</div>
            
            {/* Resumo de OS */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-blue-900">OS a Cumprir (Programadas):</p>
                  <p className="text-lg font-bold text-blue-700">{osProgramadas} pontos</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-900">OS Cumprida (Geradas):</p>
                  <p className="text-lg font-bold text-green-700">{osCumprida} pontos</p>
                </div>
              </div>
            </div>

            {/* Legenda de Risco - Tabela Anvisa */}
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs">
              <p className="font-bold mb-2">Pontuação por Nível de Risco Sanitário (Tabela Anvisa IN nº 66/2020):</p>
              <div className="flex gap-6">
                <span><strong>Risco I (Baixo):</strong> 2 pontos</span>
                <span><strong>Risco II (Médio):</strong> 3 pontos</span>
                <span><strong>Risco III (Alto):</strong> 6 pontos</span>
              </div>
              <p className="mt-2 text-gray-600"><strong>Exceção:</strong> Certidão Sanitária = 1 ponto fixo</p>
            </div>

            {/* Legenda de Grau de Dificuldade */}
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded text-xs">
              <p className="font-bold mb-2">Grau de Dificuldade (Multiplicador):</p>
              <div className="flex gap-6 mb-2">
                <span><strong>Grau 1:</strong> Normal (×1)</span>
                <span><strong>Grau 2:</strong> Com justificativa (×2)</span>
              </div>
              <p className="text-gray-600 italic">Justificativas para Grau 2:</p>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {DIFFICULTY_JUSTIFICATIONS.map(j => (
                  <span key={j.id}>• {j.label}</span>
                ))}
              </div>
            </div>

            {/* Tabela de OS Agrupadas (estabelecimento+dia = 1 OS) */}
            <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
              <p className="text-blue-800">
                <strong>Nota:</strong> Múltiplas peças fiscais no mesmo estabelecimento e mesmo dia contam como <strong>1 OS</strong>.
                O grau de dificuldade pode ser alterado de 1 (normal) para 2 (com justificativa para chefia).
              </p>
            </div>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>Dia</th>
                  <th>Estabelecimento</th>
                  <th style={{ width: '80px' }}>Documentos</th>
                  <th style={{ width: '60px' }}>Risco</th>
                  <th style={{ width: '50px' }}>Pts Base</th>
                  <th style={{ width: '60px' }}>Grau</th>
                  <th style={{ width: '150px' }}>Justificativa (se Grau 2)</th>
                  <th style={{ width: '60px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {groupedOS.map((os) => (
                  <tr key={`os-${os.key}`}>
                    <td>{os.day}</td>
                    <td>{os.establishment}</td>
                    <td className="text-xs">{os.documents.join(', ')}</td>
                    <td>
                      {os.isCertidao ? (
                        <span className="text-xs text-gray-500">Certidão</span>
                      ) : (
                        os.riskLevel ? `${os.riskLevel} (${RISK_LABELS[os.riskLevel]})` : '-'
                      )}
                    </td>
                    <td className="text-center font-medium">{os.riskPoints}</td>
                    <td className={editingPreview && !os.isCertidao ? 'editable-field' : ''}>
                      {os.isCertidao ? (
                        <span className="text-xs text-gray-500">-</span>
                      ) : editingPreview ? (
                        <select
                          value={os.difficultyGrade}
                          onChange={(e) => updateOsGrade(os.key, parseInt(e.target.value) as 1 | 2, os.difficultyJustifications)}
                          className="editable-input w-full"
                        >
                          <option value={1}>×1</option>
                          <option value={2}>×2</option>
                        </select>
                      ) : (
                        `×${os.difficultyGrade}`
                      )}
                    </td>
                    <td className={editingPreview && os.difficultyGrade === 2 && !os.isCertidao ? 'editable-field text-xs' : 'text-xs'}>
                      {os.difficultyGrade === 2 && !os.isCertidao ? (
                        editingPreview ? (
                          <div className="space-y-1">
                            {DIFFICULTY_JUSTIFICATIONS.map(j => (
                              <label key={j.id} className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={os.difficultyJustifications.includes(j.id)}
                                  onChange={() => toggleOsJustification(os.key, j.id)}
                                  className="w-3 h-3"
                                />
                                <span className="text-[9px]">{j.label}</span>
                              </label>
                            ))}
                          </div>
                        ) : (
                          os.difficultyJustifications.length > 0 
                            ? os.difficultyJustifications.map(jId => {
                                const just = DIFFICULTY_JUSTIFICATIONS.find(dj => dj.id === jId);
                                return just?.label;
                              }).join(', ')
                            : 'Sem justificativa'
                        )
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="text-center font-bold bg-gray-100">{os.totalPoints}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#003366', color: 'white' }}>
                  <td colSpan={4} className="text-right">TOTAL DE PONTOS (OS):</td>
                  <td className="text-center">{totalPoints.basePoints}</td>
                  <td colSpan={2}></td>
                  <td className="text-center">{totalPoints.totalWithGrade}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Resumo */}
          <div className="mb-6">
            <div className="section-title">RESUMO DAS PEÇAS FISCAIS</div>
            <table>
              <thead>
                <tr><th>Tipo de Documento</th><th>Qtd</th></tr>
              </thead>
              <tbody>
                {Object.entries(documentSummary).map(([key, value]) => {
                  if (value === 0) return null;
                  return (
                    <tr key={key}>
                      <td>{documentTypeLabels[key] || key}</td>
                      <td>{value}</td>
                    </tr>
                  );
                })}
                <tr style={{ fontWeight: 'bold', backgroundColor: '#e0e0e0' }}>
                  <td>TOTAL</td>
                  <td>{totalDocuments}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Assinatura */}
          <div className="mt-16 text-center">
            <div className="w-72 mx-auto">
              <div className="border-t border-black mb-2 mt-12" />
              <p className="font-bold">{profile?.full_name}</p>
              <p className="text-sm">Matrícula: {profile?.registration_number}</p>
              <p className="text-xs text-gray-600">{profile?.division || 'Auditor Fiscal'}</p>
            </div>
          </div>

          <div className="mt-10 border-t pt-2 text-xs">
            <p>Gerado em: {format(new Date(), 'dd/MM/yyyy')} | <strong>fiscaliz.app</strong></p>
          </div>

          {/* ANEXOS - PEÇAS FISCAIS COMPLETAS */}
          {fullDocuments.length > 0 && (
            <>
              <div className="page-break" />
              <div className="mb-6">
                <div className="section-title">ANEXOS - PEÇAS FISCAIS EMITIDAS</div>
              </div>

              {fullDocuments.map((doc, docIndex) => (
                <div key={doc.id} className="mb-8">
                  {/* Page break entre documentos (não no primeiro) */}
                  {docIndex > 0 && <div className="page-break" />}
                  
                  {/* Cabeçalho do documento anexo */}
                  <div className="mb-4 border-b-2 border-gray-800 pb-3">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <img src={BRASAO_GOIANIA_SVG} alt="Brasão" className="h-12 w-auto" />
                        <img src={SUS_LOGO_SVG} alt="SUS" className="h-8 w-auto" />
                      </div>
                      <div className="text-right text-xs text-gray-600">
                        <p>Anexo {docIndex + 1} de {fullDocuments.length}</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-bold">PREFEITURA DE GOIÂNIA - SMS - VIGILÂNCIA SANITÁRIA</p>
                    </div>
                    <div className="mt-2 py-2 bg-gray-800 text-white text-center">
                      <h3 className="text-sm font-bold">
                        {documentTypeLabels[doc.document_type]?.toUpperCase() || doc.document_type}
                      </h3>
                      {doc.document_number && (
                        <p className="text-xs">Nº {doc.document_number}</p>
                      )}
                    </div>
                  </div>

                  {/* Dados do estabelecimento */}
                  {doc.establishments && (
                    <div className="border border-gray-300 p-3 mb-4 text-xs">
                      <h4 className="font-bold bg-gray-100 -m-3 mb-2 p-2 border-b border-gray-300">ESTABELECIMENTO</h4>
                      <div className="space-y-1">
                        <p><strong>Razão Social:</strong> {doc.establishments.razao_social}</p>
                        {doc.establishments.nome_fantasia && (
                          <p><strong>Nome Fantasia:</strong> {doc.establishments.nome_fantasia}</p>
                        )}
                        <p><strong>CNPJ:</strong> {doc.establishments.cnpj}</p>
                        <p><strong>Endereço:</strong> {doc.establishments.endereco}{doc.establishments.bairro ? ` - ${doc.establishments.bairro}` : ''}</p>
                        {doc.establishments.risk_level && (
                          <p><strong>Nível de Risco:</strong> {doc.establishments.risk_level}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Conteúdo do documento */}
                  <div className="border border-gray-300 p-3 mb-4 text-xs">
                    <h4 className="font-bold bg-gray-100 -m-3 mb-2 p-2 border-b border-gray-300">CONTEÚDO</h4>
                    <div className="whitespace-pre-wrap leading-relaxed min-h-[80px]">
                      {doc.content?.text || 'Sem conteúdo especificado.'}
                    </div>
                  </div>

                  {/* Observações adicionais */}
                  {doc.content?.observations && (
                    <div className="border border-gray-300 p-3 mb-4 text-xs">
                      <h4 className="font-bold bg-gray-100 -m-3 mb-2 p-2 border-b border-gray-300">OBSERVAÇÕES</h4>
                      <div className="whitespace-pre-wrap leading-relaxed">
                        {doc.content.observations}
                      </div>
                    </div>
                  )}

                  {/* Prazo (se aplicável) */}
                  {doc.deadline_date && (
                    <div className="border border-yellow-400 bg-yellow-50 p-3 mb-4 text-xs">
                      <h4 className="font-bold">PRAZO PARA ADEQUAÇÃO</h4>
                      <p className="mt-1">
                        <strong>{doc.deadline_days} dias</strong> - até {format(new Date(doc.deadline_date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  )}

                  {/* Registro fotográfico */}
                  {doc.attachments && Array.isArray(doc.attachments) && doc.attachments.length > 0 && (
                    <div className="border border-gray-300 p-3 mb-4">
                      <h4 className="font-bold bg-gray-100 -m-3 mb-2 p-2 border-b border-gray-300 text-xs">REGISTRO FOTOGRÁFICO</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {(doc.attachments as any[]).slice(0, 4).map((att: any, attIdx: number) => (
                          <div key={attIdx} className="aspect-[4/3] border border-gray-200 rounded overflow-hidden">
                            <img 
                              src={att.url} 
                              alt={`Foto ${attIdx + 1}`} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                      {doc.attachments.length > 4 && (
                        <p className="text-xs text-gray-500 text-center mt-2">
                          + {doc.attachments.length - 4} foto(s) adicionais
                        </p>
                      )}
                    </div>
                  )}

                  {/* Data e hora do documento */}
                  <div className="text-xs text-gray-600 text-right mt-2">
                    <p>
                      Data: {doc.content?.document_date 
                        ? format(new Date(doc.content.document_date + 'T12:00:00'), 'dd/MM/yyyy') 
                        : doc.action_date 
                          ? format(new Date(doc.action_date + 'T12:00:00'), 'dd/MM/yyyy') 
                          : format(new Date(doc.created_at), 'dd/MM/yyyy')}
                      {doc.content?.document_time && ` às ${doc.content.document_time}`}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Botões de ação */}
          <div className="no-print mt-6 flex gap-3">
            <Button variant="outline" onClick={() => setShowPDFPreview(false)}>
              Voltar
            </Button>
            <Button onClick={() => window.print()}>
              <FileDown className="h-4 w-4 mr-2" />
              Imprimir PDF
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <Header title="Relatório Mensal" showBack />
      
      <div className="p-4 pb-32 max-w-lg mx-auto">
        {/* Seletor de Mês/Ano */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CalendarIcon className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Período</Label>
                <div className="flex items-center gap-2 mt-1">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="flex-1 border rounded-md px-3 py-2 text-sm bg-background"
                    disabled={isLocked}
                  >
                    {months.map((month, idx) => (
                      <option key={idx} value={idx + 1}>{month}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-24 border rounded-md px-3 py-2 text-sm bg-background"
                    disabled={isLocked}
                  >
                    {[2024, 2025, 2026].map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status */}
        {report && (
          <div className={cn(
            'flex items-center gap-2 p-3 rounded-lg mb-4',
            isLocked ? 'bg-success/10' : 'bg-muted'
          )}>
            {isLocked ? (
              <>
                <Lock className="h-4 w-4 text-success" />
                <span className="text-sm text-success font-medium">
                  Relatório enviado em {report.sent_at ? format(new Date(report.sent_at), 'dd/MM/yyyy') : '-'}
                </span>
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Rascunho - não enviado
                </span>
              </>
            )}
          </div>
        )}

        {/* Abas */}
        <Tabs defaultValue="resumo" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="resumo" className="text-xs">Resumo</TabsTrigger>
            <TabsTrigger value="acoes" className="text-xs">Ações</TabsTrigger>
            <TabsTrigger value="pontos" className="text-xs">Pontos</TabsTrigger>
            <TabsTrigger value="periodo" className="text-xs">Período</TabsTrigger>
            <TabsTrigger value="os" className="text-xs">OS</TabsTrigger>
          </TabsList>

          {/* Período */}
          <TabsContent value="periodo" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Afastamentos no Período
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">
                  Selecione se houve algum afastamento durante o período:
                </p>
                
                {licenseTypes.map((license) => (
                  <div
                    key={license.id}
                    className={cn(
                      'p-4 rounded-lg border-2 cursor-pointer transition-all',
                      selectedLicenseType === license.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted hover:border-primary/50'
                    )}
                    onClick={() => !isLocked && handleLicenseSelect(license.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={selectedLicenseType === license.id}
                        disabled={isLocked}
                      />
                      <span className="font-medium">{license.label}</span>
                      {license.needsAttachment && (
                        <Badge variant="secondary" className="text-[10px]">
                          Anexar
                        </Badge>
                      )}
                    </div>
                    
                    {selectedLicenseType === license.id && (
                      <div className="mt-4 space-y-4 pl-7" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-xs">Data Início</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full justify-start text-left font-normal mt-1',
                                    !licenseStartDate && 'text-muted-foreground'
                                  )}
                                  disabled={isLocked}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {licenseStartDate ? format(licenseStartDate, 'dd/MM/yyyy') : 'Selecionar'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={licenseStartDate}
                                  onSelect={setLicenseStartDate}
                                  locale={ptBR}
                                  className="pointer-events-auto"
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                          <div>
                            <Label className="text-xs">Data Fim</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full justify-start text-left font-normal mt-1',
                                    !licenseEndDate && 'text-muted-foreground'
                                  )}
                                  disabled={isLocked}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {licenseEndDate ? format(licenseEndDate, 'dd/MM/yyyy') : 'Selecionar'}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={licenseEndDate}
                                  onSelect={setLicenseEndDate}
                                  locale={ptBR}
                                  className="pointer-events-auto"
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        
                        {license.needsCompensation && (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-xs">Data que Gerou Banco</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      'w-full justify-start text-left font-normal mt-1',
                                      !compensationOriginDate && 'text-muted-foreground'
                                    )}
                                    disabled={isLocked}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {compensationOriginDate ? format(compensationOriginDate, 'dd/MM/yyyy') : 'Selecionar'}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={compensationOriginDate}
                                    onSelect={setCompensationOriginDate}
                                    locale={ptBR}
                                    className={cn("p-3 pointer-events-auto")}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                            <div>
                              <Label className="text-xs">Data de Gozo</Label>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      'w-full justify-start text-left font-normal mt-1',
                                      !compensationEnjoyDate && 'text-muted-foreground'
                                    )}
                                    disabled={isLocked}
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {compensationEnjoyDate ? format(compensationEnjoyDate, 'dd/MM/yyyy') : 'Selecionar'}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                  <Calendar
                                    mode="single"
                                    selected={compensationEnjoyDate}
                                    onSelect={setCompensationEnjoyDate}
                                    locale={ptBR}
                                    className={cn("p-3 pointer-events-auto")}
                                  />
                                </PopoverContent>
                              </Popover>
                            </div>
                          </div>
                        )}
                        
                        {license.needsAttachment && (
                          <div>
                            <Label className="text-xs">Anexar Atestado</Label>
                            <div className="mt-1">
                              {licenseAttachment ? (
                                <div className="flex items-center gap-2 p-2 bg-success/10 rounded-lg">
                                  <FileText className="h-4 w-4 text-success" />
                                  <span className="text-xs text-success">Atestado anexado</span>
                                </div>
                              ) : (
                                <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50">
                                  <Upload className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    Clique para anexar
                                  </span>
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    className="hidden"
                                    onChange={handleAttachmentUpload}
                                    disabled={isLocked}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* OS */}
          <TabsContent value="os" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Ordem de Serviço</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="osNumber">Número da OS</Label>
                    <Input
                      id="osNumber"
                      value={osNumber}
                      onChange={(e) => setOsNumber(e.target.value)}
                      placeholder="Ex: 001/2026"
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="daysToWork">Dias a Cumprir</Label>
                    <Input
                      id="daysToWork"
                      type="number"
                      value={daysToWork}
                      onChange={(e) => setDaysToWork(e.target.value)}
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                {/* OS a Cumprir e OS Cumprida */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="osProgramadas">OS a Cumprir (Pontos)</Label>
                    <Input
                      id="osProgramadas"
                      type="number"
                      value={osProgramadas}
                      onChange={(e) => setOsProgramadas(e.target.value)}
                      placeholder="Pontos programados"
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>OS Cumprida (Pontos)</Label>
                    <div className="mt-1 p-2 bg-success/10 rounded-lg text-center">
                      <span className="text-lg font-bold text-success">{osCumprida}</span>
                      <p className="text-[10px] text-muted-foreground">Calculado automaticamente</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="pfeDays">Plantão Fiscal Especial (PFE)</Label>
                  <Input
                    id="pfeDays"
                    type="number"
                    value={pfeDays}
                    onChange={(e) => setPfeDays(e.target.value)}
                    disabled={isLocked}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Info automático */}
            <Card className="border-0 shadow-sm bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Como são calculados os pontos (OS):</p>
                    <ul className="space-y-1">
                      <li>• <strong>Risco I:</strong> 2pts | <strong>Risco II:</strong> 3pts | <strong>Risco III:</strong> 6pts</li>
                      <li>• <strong>Relatório de Atividade:</strong> 6 pontos fixos</li>
                      <li>• <strong>Certidão:</strong> 1 ponto fixo</li>
                      <li>• <strong>Grau 2:</strong> Multiplica pontos por 2 (com justificativa)</li>
                      <li>• Atividade = CNAE (base para cálculo de risco sanitário)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Resumo */}
          <TabsContent value="resumo" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalDocuments}</p>
                      <p className="text-xs text-muted-foreground">Peças Fiscais</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-info/10">
                      <CalendarIcon className="h-5 w-5 text-info" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{finalFieldDays}</p>
                      <p className="text-xs text-muted-foreground">Dias em Campo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-success/10">
                      <Car className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{finalMplDays}</p>
                      <p className="text-xs text-muted-foreground">Saídas MPL</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-warning/10">
                      <Star className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalPoints.totalWithGrade}</p>
                      <p className="text-xs text-muted-foreground">Pontos Total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Peças Fiscais Emitidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(documentSummary).map(([key, value]) => {
                  if (value === 0) return null;
                  return (
                    <div key={key} className="flex items-center justify-between py-1">
                      <span className="text-sm">{documentTypeLabels[key] || key}</span>
                      <Badge variant="secondary">{value}</Badge>
                    </div>
                  );
                })}
                {totalDocuments === 0 && (
                  <div className="flex flex-col items-center py-6 text-muted-foreground">
                    <AlertCircle className="h-8 w-8 mb-2" />
                    <p className="text-sm">Nenhuma peça fiscal enviada neste período</p>
                    <p className="text-xs mt-1">Apenas peças com status "Enviado" são contabilizadas</p>
                  </div>
                )}
                {totalDocuments > 0 && (
                  <div className="flex items-center justify-between py-2 border-t mt-2">
                    <span className="font-medium">Total</span>
                    <Badge>{totalDocuments}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Ações Diárias */}
          <TabsContent value="acoes" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Ações - {months[selectedMonth - 1]}/{selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyActions.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mb-3 opacity-40" />
                    <p className="text-sm">Nenhuma ação registrada</p>
                    <p className="text-xs mt-1">As ações aparecem ao criar documentos fiscais</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dailyActions.slice().sort((a, b) => a.actionDateFull.localeCompare(b.actionDateFull)).map((action) => (
                      <div 
                        key={action.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => {
                          // Só navegar se não for documento de prévia
                          if (!action.id.startsWith('preview-')) {
                            navigate(`/documentos/${action.documentId}`);
                          }
                        }}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{action.day}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{action.establishment}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px]">
                              {documentTypeLabels[action.documentType] || action.documentType}
                            </Badge>
                            <span>{action.transport}</span>
                            {action.riskLevel && (
                              <Badge variant="secondary" className="text-[10px]">
                                Risco {action.riskLevel}
                              </Badge>
                            )}
                            {action.id.startsWith('preview-') && (
                              <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning">
                                Prévia
                              </Badge>
                            )}
                          </div>
                        </div>
                        {!action.id.startsWith('preview-') && (
                          <Edit2 className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pontos */}
          <TabsContent value="pontos" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Tabela de Pontos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Resumo de Pontos */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-primary/10 text-center">
                    <p className="text-2xl font-bold text-primary">{totalPoints.basePoints}</p>
                    <p className="text-[10px] text-primary">Pts Base</p>
                  </div>
                  <div className="p-3 rounded-lg bg-success/10 text-center">
                    <p className="text-2xl font-bold text-success">{totalPoints.totalWithGrade}</p>
                    <p className="text-[10px] text-success">Total c/ Grau</p>
                  </div>
                </div>

                {/* Legenda */}
                <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-2">
                  <p className="font-medium">Nível de Risco Sanitário (Tabela Anvisa):</p>
                  <div className="flex gap-4">
                    <span>I (Baixo): 2pts</span>
                    <span>II (Médio): 3pts</span>
                    <span>III (Alto): 6pts</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-muted/50 text-xs space-y-2">
                  <p className="font-medium">Grau de Dificuldade (Multiplicador):</p>
                  <div className="space-y-1">
                    <p>• <strong>Grau 1:</strong> Normal (×1)</p>
                    <p>• <strong>Grau 2:</strong> Com justificativa (×2)</p>
                  </div>
                  <p className="text-muted-foreground italic mt-2">Justificativas para Grau 2:</p>
                  <div className="space-y-1">
                    {DIFFICULTY_JUSTIFICATIONS.map(j => (
                      <p key={j.id}>• {j.label}</p>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Edite os pontos na prévia do PDF clicando em "Editar Valores"
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botões de Ação */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t">
          <div className="max-w-lg mx-auto flex gap-3">
            {!isLocked && (
              <>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Salvando...' : 'Salvar Rascunho'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleGeneratePDF}
                >
                  <FileDown className="h-4 w-4" />
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleSendReport}
                  disabled={!report}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar
                </Button>
              </>
            )}
            {isLocked && (
              <Button 
                className="w-full"
                onClick={handleGeneratePDF}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Visualizar PDF
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

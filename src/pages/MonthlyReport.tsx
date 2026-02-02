import { useState, useEffect, useMemo } from 'react';
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
  Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BRASAO_GOIANIA_SVG, SUS_LOGO_SVG } from '@/lib/logos';

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

interface DailyAction {
  day: number;
  transport: 'MPL' | 'CO';
  actionType: string;
  establishment: string;
  document: string;
  documentId: string;
  documentType: string;
  isInternal: boolean;
}

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const documentTypeLabels: Record<string, string> = {
  termo_intimacao: 'Termo de Intimação',
  visita_fiscal: 'Termo de Reinspeção',
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
  visita_fiscal: 'TR',
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
  const [dailyActions, setDailyActions] = useState<DailyAction[]>([]);
  
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
  const [pfeDays, setPfeDays] = useState('');
  
  // Campos editáveis na prévia (valores calculados que podem ser ajustados)
  const [editedMplDays, setEditedMplDays] = useState<number | null>(null);
  const [editedCoDays, setEditedCoDays] = useState<number | null>(null);
  const [editedFieldDays, setEditedFieldDays] = useState<number | null>(null);
  const [editedInternalDays, setEditedInternalDays] = useState<number | null>(null);
  
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
    // Agrupar ações por dia para contar dias únicos
    const dayMap = new Map<number, { hasMpl: boolean; hasCo: boolean; hasField: boolean; hasInternal: boolean }>();
    
    dailyActions.forEach(action => {
      const existing = dayMap.get(action.day) || { hasMpl: false, hasCo: false, hasField: false, hasInternal: false };
      
      if (action.transport === 'MPL') {
        existing.hasMpl = true;
      } else {
        existing.hasCo = true;
      }
      
      if (action.isInternal) {
        existing.hasInternal = true;
      } else {
        existing.hasField = true;
      }
      
      dayMap.set(action.day, existing);
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
      
      // Carregar valores editados salvos anteriormente
      if (data.field_days !== null) setEditedFieldDays(data.field_days);
      if (data.internal_days !== null) setEditedInternalDays(data.internal_days);
      
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
    
    const { data } = await supabase
      .from('fiscal_documents')
      .select('document_type, status, action_date')
      .eq('user_id', user.id)
      .in('status', ['sent', 'draft'])
      .gte('action_date', startDate)
      .lte('action_date', endDate);

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
      
      data.forEach(doc => {
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
        status,
        establishments(*)
      `)
      .eq('user_id', user.id)
      .in('status', ['sent', 'draft'])
      .gte('action_date', startDate)
      .lte('action_date', endDate)
      .order('action_date', { ascending: true });

    if (data) {
      // Store full documents for PDF attachment
      setFullDocuments(data);
      
      const actions: DailyAction[] = data.map((doc: any) => {
        const content = doc.content || {};
        // Usar action_date para determinar o dia, com fallback para created_at
        const actionDateStr = doc.action_date || doc.created_at;
        const date = new Date(actionDateStr);
        const isInternal = doc.document_type === 'relatorio_atividade' || !doc.establishment_id;
        
        // Determinar transporte baseado no conteúdo do documento
        const transport: 'MPL' | 'CO' = content.transport_mode || 'MPL';
        
        return {
          day: date.getDate(),
          transport,
          actionType: content.action_type || 'Inspeção',
          establishment: doc.establishments?.nome_fantasia || content.atividade_descricao || 'Atividade Interna',
          document: doc.document_number || `${documentTypeAbbreviation[doc.document_type] || 'DOC'}`,
          documentId: doc.id,
          documentType: doc.document_type,
          isInternal,
        };
      });
      setDailyActions(actions);
    }
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
        duty_days: 0, // Será calculado se necessário
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
                  ? 'Clique nos campos amarelos para editar os valores calculados'
                  : 'Você pode revisar e editar os dados antes de enviar'}
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
                <tr><th>Tipo de Atividade</th><th>Dias</th></tr>
              </thead>
              <tbody>
                <tr><td>Dias a Cumprir no Período</td><td>{daysToWork || 0}</td></tr>
                <tr><td>OS Programadas</td><td>{totalDocuments}</td></tr>
                <tr>
                  <td>Fiscalização em Área</td>
                  <td className={editingPreview ? 'editable-field' : ''}>
                    {editingPreview ? (
                      <input
                        type="number"
                        value={finalFieldDays}
                        onChange={(e) => setEditedFieldDays(parseInt(e.target.value) || 0)}
                        className="w-16 px-1 border rounded"
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
                        className="w-16 px-1 border rounded"
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
                        className="w-16 px-1 border rounded"
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
                        className="w-16 px-1 border rounded"
                      />
                    ) : finalCoDays}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Page Break */}
          <div className="page-break" />

          {/* Ações */}
          <div className="mb-6">
            <div className="section-title">DESCRIÇÃO DAS AÇÕES DIÁRIAS</div>
            <table>
              <thead>
                <tr>
                  <th>Dia</th>
                  <th>ML</th>
                  <th>Descrição</th>
                  <th>Doc.</th>
                </tr>
              </thead>
              <tbody>
                {dailyActions.map((action, idx) => (
                  <tr key={idx}>
                    <td>{action.day}</td>
                    <td>{action.transport}</td>
                    <td>{action.establishment}</td>
                    <td>{action.document}</td>
                  </tr>
                ))}
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
                      Data: {doc.content?.document_date ? format(new Date(doc.content.document_date), 'dd/MM/yyyy') : format(new Date(doc.created_at), 'dd/MM/yyyy')}
                      {doc.content?.document_time && ` às ${doc.content.document_time}`}
                    </p>
                  </div>

                  {/* Assinatura do documento */}
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-between">
                      <div className="text-center w-40">
                        {profile?.signature_url && (
                          <img src={profile.signature_url} alt="Assinatura" className="h-10 mx-auto mb-1 object-contain" />
                        )}
                        <div className="border-t border-black w-full mb-1" />
                        <p className="text-xs font-bold">{profile?.full_name}</p>
                        <p className="text-[9px]">Auditor Fiscal</p>
                      </div>
                      <div className="text-center w-40">
                        <div className="h-10" />
                        <div className="border-t border-black w-full mb-1" />
                        <p className="text-xs font-bold">Ciência do Contribuinte</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="no-print fixed bottom-4 right-4 flex gap-2">
          <Button variant="outline" onClick={() => { setShowPDFPreview(false); setEditingPreview(false); }}>
            Voltar
          </Button>
          {!isLocked && (
            <Button variant="outline" onClick={handleSave}>
              Salvar Alterações
            </Button>
          )}
          <Button onClick={() => window.print()}>
            Imprimir PDF
          </Button>
          {!isLocked && (
            <Button onClick={handleSendReport}>
              <Send className="h-4 w-4 mr-2" />
              Enviar Relatório
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <Header 
        title="Relatório Mensal" 
        subtitle="Produtividade fiscal"
        showBack
      />
      
      <div className="p-4 space-y-4">
        {/* Month/Year Selection */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Label>Mês de Referência</Label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={isLocked}
                >
                  {months.map((month, idx) => (
                    <option key={month} value={idx + 1}>{month}</option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <Label>Ano</Label>
                <Input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  disabled={isLocked}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {isLocked && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning">
            <Lock className="h-4 w-4" />
            <span className="text-sm font-medium">Relatório enviado e bloqueado</span>
          </div>
        )}

        <Tabs defaultValue="periodo" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="periodo" className="text-xs">Período</TabsTrigger>
            <TabsTrigger value="os" className="text-xs">OS</TabsTrigger>
            <TabsTrigger value="resumo" className="text-xs">Resumo</TabsTrigger>
            <TabsTrigger value="acoes" className="text-xs">Ações</TabsTrigger>
          </TabsList>
          
          {/* PERÍODO - Licenças e Afastamentos */}
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
                    <p className="font-medium mb-1">Campos automáticos:</p>
                    <ul className="space-y-1">
                      <li>• <strong>MPL/CO</strong>: Calculado por dia trabalhado (1 por dia, não por estabelecimento)</li>
                      <li>• <strong>Escala de trabalho</strong>: Baseada nas peças fiscais enviadas</li>
                      <li>• Edite na prévia do PDF antes de enviar, se necessário</li>
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
                      <Clock className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{parseInt(pfeDays) || 0}</p>
                      <p className="text-xs text-muted-foreground">Dias PFE</p>
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
                    <p className="text-xs mt-1">Envie peças fiscais para popular este relatório</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dailyActions.map((action, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                          {action.day}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{action.establishment}</p>
                          <p className="text-xs text-muted-foreground">
                            {documentTypeLabels[action.documentType] || action.documentType}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {action.transport}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleGeneratePDF}
            disabled={loading}
          >
            <FileDown className="h-4 w-4 mr-2" />
            Prévia / PDF
          </Button>
          
          {!isLocked && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

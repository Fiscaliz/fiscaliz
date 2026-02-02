import { useState, useEffect } from 'react';
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
  AlertCircle
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
  transport: string;
  actionType: string;
  level: string;
  grade: number;
  establishment: string;
  document: string;
  documentId: string;
  documentType: string;
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
  { id: 'licenca_premio', label: 'Licença Prêmio', needsAttachment: false },
  { id: 'licenca_medica', label: 'Licença Médica', needsAttachment: false },
  { id: 'atestado_medico', label: 'Atestado Médico', needsAttachment: true },
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
  const [reportVersion, setReportVersion] = useState(1);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [dailyActions, setDailyActions] = useState<DailyAction[]>([]);
  
  // Período - Licenças
  const [selectedLicenseType, setSelectedLicenseType] = useState<string | null>(null);
  const [licenseStartDate, setLicenseStartDate] = useState<Date | undefined>();
  const [licenseEndDate, setLicenseEndDate] = useState<Date | undefined>();
  const [licenseAttachment, setLicenseAttachment] = useState<string | null>(null);
  
  // OS e Locomoção
  const [osNumber, setOsNumber] = useState('');
  const [daysToWork, setDaysToWork] = useState('');
  const [osProgrammed, setOsProgrammed] = useState('');
  const [pfeDays, setPfeDays] = useState('');
  const [transportMode, setTransportMode] = useState<'MPL' | 'CO'>('MPL');
  const [totalKm, setTotalKm] = useState('');
  
  // Escala
  const [fieldDays, setFieldDays] = useState('');
  const [internalDays, setInternalDays] = useState('');
  const [dutyDays, setDutyDays] = useState('');
  
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
      setFieldDays(data.field_days?.toString() || '');
      setInternalDays(data.internal_days?.toString() || '');
      setDutyDays(data.duty_days?.toString() || '');
      setTotalKm(data.total_km?.toString() || '');
      setTransportMode(data.transportation_mode === 'CO' ? 'CO' : 'MPL');
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
    setFieldDays('');
    setInternalDays('');
    setDutyDays('');
    setTotalKm('');
    setTransportMode('MPL');
    setSelectedLicenseType(null);
    setLicenseStartDate(undefined);
    setLicenseEndDate(undefined);
    setLicenseAttachment(null);
  };

  const loadDocumentStats = async () => {
    if (!user) return;
    
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0);
    
    const { data } = await supabase
      .from('fiscal_documents')
      .select('document_type')
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

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
      setOsProgrammed(data.length.toString());
    }
  };

  const loadDailyActions = async () => {
    if (!user) return;
    
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0);
    
    const { data } = await supabase
      .from('fiscal_documents')
      .select(`
        id,
        document_type,
        document_number,
        created_at,
        content,
        establishments(nome_fantasia)
      `)
      .eq('user_id', user.id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (data) {
      const actions: DailyAction[] = data.map((doc: any) => {
        const content = doc.content || {};
        const date = new Date(doc.created_at);
        return {
          day: date.getDate(),
          transport: transportMode,
          actionType: content.action_type || 'Inspeção',
          level: content.nivel || 'M',
          grade: content.grau || 2,
          establishment: doc.establishments?.nome_fantasia || content.atividade_descricao || 'Atividade Interna',
          document: doc.document_number || `${documentTypeAbbreviation[doc.document_type] || 'DOC'}`,
          documentId: doc.id,
          documentType: doc.document_type,
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
        field_days: parseInt(fieldDays) || 0,
        internal_days: parseInt(internalDays) || 0,
        duty_days: parseInt(dutyDays) || 0,
        total_km: parseFloat(totalKm) || 0,
        transportation_mode: transportMode,
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
    setTimeout(() => {
      window.print();
    }, 500);
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

  // PDF Preview
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
              <div className="info-row">
                <span className="info-label">Período de Gozo:</span>
                <span className="info-value">
                  {licenseStartDate ? format(licenseStartDate, 'dd/MM/yyyy') : '-'} a {licenseEndDate ? format(licenseEndDate, 'dd/MM/yyyy') : '-'}
                </span>
              </div>
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
                <tr><td>OS Programadas</td><td>{osProgrammed || totalDocuments}</td></tr>
                <tr><td>Fiscalização em Área</td><td>{fieldDays || 0}</td></tr>
                <tr><td>Ação Interna</td><td>{internalDays || 0}</td></tr>
                <tr><td>Plantão Fiscal</td><td>{dutyDays || 0}</td></tr>
                <tr><td>Plantão Fiscal Especial (PFE)</td><td>{pfeDays || 0}</td></tr>
              </tbody>
            </table>
          </div>

          {/* Locomoção */}
          <div className="mb-6">
            <div className="section-title">MEIO DE LOCOMOÇÃO</div>
            <table>
              <thead>
                <tr><th>Tipo</th><th>Utilizado</th><th>Km</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>MPL - Meios Próprios de Locomoção</td>
                  <td>{transportMode === 'MPL' ? '✓' : '-'}</td>
                  <td>{transportMode === 'MPL' ? `${totalKm || 0} km` : '-'}</td>
                </tr>
                <tr>
                  <td>CO - Carro Oficial</td>
                  <td>{transportMode === 'CO' ? '✓' : '-'}</td>
                  <td>{transportMode === 'CO' ? `${totalKm || 0} km` : '-'}</td>
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
                    <td>{transportMode}</td>
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
        </div>

        <div className="no-print fixed bottom-4 right-4 flex gap-2">
          <Button variant="outline" onClick={() => setShowPDFPreview(false)}>
            Voltar
          </Button>
          <Button onClick={() => window.print()}>
            Imprimir PDF
          </Button>
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
                      <div className="mt-4 space-y-4 pl-7">
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
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={licenseStartDate}
                                  onSelect={setLicenseStartDate}
                                  locale={ptBR}
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
                              <PopoverContent className="w-auto p-0">
                                <Calendar
                                  mode="single"
                                  selected={licenseEndDate}
                                  onSelect={setLicenseEndDate}
                                  locale={ptBR}
                                />
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                        
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

          {/* OS e Locomoção */}
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="osProgrammed">OS Programadas</Label>
                    <Input
                      id="osProgrammed"
                      type="number"
                      value={osProgrammed}
                      onChange={(e) => setOsProgrammed(e.target.value)}
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pfeDays">Plantão Fiscal Especial</Label>
                    <Input
                      id="pfeDays"
                      type="number"
                      value={pfeDays}
                      onChange={(e) => setPfeDays(e.target.value)}
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  Meio de Locomoção
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={cn(
                      'p-4 rounded-lg border-2 cursor-pointer transition-all text-center',
                      transportMode === 'MPL' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted hover:border-primary/50'
                    )}
                    onClick={() => !isLocked && setTransportMode('MPL')}
                  >
                    <Car className={cn(
                      'h-6 w-6 mx-auto mb-2',
                      transportMode === 'MPL' ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <p className="font-medium text-sm">MPL</p>
                    <p className="text-xs text-muted-foreground">Meios Próprios</p>
                  </div>
                  
                  <div
                    className={cn(
                      'p-4 rounded-lg border-2 cursor-pointer transition-all text-center',
                      transportMode === 'CO' 
                        ? 'border-primary bg-primary/10' 
                        : 'border-muted hover:border-primary/50'
                    )}
                    onClick={() => !isLocked && setTransportMode('CO')}
                  >
                    <Car className={cn(
                      'h-6 w-6 mx-auto mb-2',
                      transportMode === 'CO' ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <p className="font-medium text-sm">CO</p>
                    <p className="text-xs text-muted-foreground">Carro Oficial</p>
                  </div>
                </div>
                
                {transportMode === 'MPL' && (
                  <div>
                    <Label htmlFor="totalKm">Quilometragem Total</Label>
                    <Input
                      id="totalKm"
                      type="number"
                      value={totalKm}
                      onChange={(e) => setTotalKm(e.target.value)}
                      placeholder="Km rodados"
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Escala de Trabalho</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label htmlFor="fieldDays" className="text-xs">Área</Label>
                    <Input
                      id="fieldDays"
                      type="number"
                      value={fieldDays}
                      onChange={(e) => setFieldDays(e.target.value)}
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="internalDays" className="text-xs">Interna</Label>
                    <Input
                      id="internalDays"
                      type="number"
                      value={internalDays}
                      onChange={(e) => setInternalDays(e.target.value)}
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dutyDays" className="text-xs">Plantão</Label>
                    <Input
                      id="dutyDays"
                      type="number"
                      value={dutyDays}
                      onChange={(e) => setDutyDays(e.target.value)}
                      disabled={isLocked}
                      className="mt-1"
                    />
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
                      <p className="text-2xl font-bold">{fieldDays || 0}</p>
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
                      <p className="text-2xl font-bold">{totalKm || 0}</p>
                      <p className="text-xs text-muted-foreground">Km ({transportMode})</p>
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
                      <p className="text-2xl font-bold">{pfeDays || 0}</p>
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
                    <p className="text-sm">Nenhuma peça fiscal neste período</p>
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
                    <p className="text-xs mt-1">Crie peças fiscais para popular este relatório</p>
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
                          {transportMode}
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
            PDF
          </Button>
          
          {!isLocked && (
            <>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
              
              <Button
                className="flex-1"
                onClick={handleSendReport}
                disabled={!report?.id || saving}
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

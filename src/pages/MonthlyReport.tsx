import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Calendar, 
  Car, 
  Clock,
  Send,
  Edit3,
  Lock,
  FileDown,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import marcaDaguaFiscaliz from '@/assets/marca-dagua-fiscaliz.png';

// Logos oficiais para o PDF
const PREFEITURA_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Bras%C3%A3o_de_Goi%C3%A2nia.svg/200px-Bras%C3%A3o_de_Goi%C3%A2nia.svg.png';
const SUS_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/SUS_logo.svg/200px-SUS_logo.svg.png';

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
};

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
  
  // Editable fields - matching Bárbara's report structure
  const [workingDays, setWorkingDays] = useState('');
  const [fieldDays, setFieldDays] = useState('');
  const [internalDays, setInternalDays] = useState('');
  const [dutyDays, setDutyDays] = useState('');
  const [specialDutyDays, setSpecialDutyDays] = useState('');
  const [totalKm, setTotalKm] = useState('');
  const [transportMode, setTransportMode] = useState('CP'); // Carro Próprio
  const [osNumber, setOsNumber] = useState('');
  const [posProgrammed, setPosProgrammed] = useState('');
  const [posExecuted, setPosExecuted] = useState('');
  
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
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) setProfile(data);
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
      setWorkingDays(data.working_days?.toString() || '');
      setFieldDays(data.field_days?.toString() || '');
      setInternalDays(data.internal_days?.toString() || '');
      setDutyDays(data.duty_days?.toString() || '');
      setTotalKm(data.total_km?.toString() || '');
      setTransportMode(data.transportation_mode || 'CP');
      setOsNumber(data.os_number || '');
      if (data.documents_summary) {
        setDocumentSummary(data.documents_summary as unknown as DocumentSummary);
      }
    } else {
      setReport(null);
      setWorkingDays('');
      setFieldDays('');
      setInternalDays('');
      setDutyDays('');
      setTotalKm('');
      setTransportMode('CP');
      setOsNumber('');
    }
    
    setLoading(false);
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
      setPosExecuted(data.length.toString());
      setPosProgrammed(data.length.toString());
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
          transport: 'CP',
          actionType: content.action_type || 'Inspeção',
          level: content.nivel || 'M',
          grade: content.grau || 2,
          establishment: doc.establishments?.nome_fantasia || 'Estabelecimento',
          document: doc.document_number || `${documentTypeAbbreviation[doc.document_type] || 'DOC'} ${doc.id.slice(0,4)}`,
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
        working_days: parseInt(workingDays) || 0,
        field_days: parseInt(fieldDays) || 0,
        internal_days: parseInt(internalDays) || 0,
        duty_days: parseInt(dutyDays) || 0,
        total_km: parseFloat(totalKm) || 0,
        transportation_mode: transportMode,
        os_number: osNumber,
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
        description: `Relatório de ${months[selectedMonth - 1]}/${selectedYear} v${reportVersion} enviado com sucesso.`,
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

  const totalDocuments = Object.values(documentSummary).reduce((a, b) => a + b, 0);
  const isLocked = report?.is_locked;
  const completionRate = posProgrammed ? Math.round((parseInt(posExecuted) / parseInt(posProgrammed)) * 100) : 100;

  // PDF Preview Component - matching Bárbara's report layout exactly
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
          {/* CABEÇALHO - Logo oficial da prefeitura para PDF */}
          <div className="text-center mb-6 border-b-2 border-blue-900 pb-4">
            <div className="flex justify-center items-center gap-4 mb-3">
              <img src={PREFEITURA_LOGO_URL} alt="Brasão de Goiânia" className="h-16 w-auto" />
              <img src={SUS_LOGO_URL} alt="SUS" className="h-10 w-auto" />
            </div>
            <h1 className="text-sm font-bold text-blue-900">PREFEITURA MUNICIPAL DE GOIÂNIA</h1>
            <h1 className="text-sm font-bold text-blue-900">SECRETARIA MUNICIPAL DE SAÚDE</h1>
            <h2 className="text-xs text-gray-600">DIRETORIA DE VIGILÂNCIA SANITÁRIA E AMBIENTAL</h2>
            <h2 className="text-xs text-gray-600 mt-2">
              RELATÓRIO MENSAL DE PRODUTIVIDADE - {months[selectedMonth - 1].toUpperCase()}/{selectedYear}
            </h2>
          </div>

          {/* IDENTIFICAÇÃO DO SERVIDOR */}
          <div className="mb-6">
            <div className="section-title">IDENTIFICAÇÃO DO SERVIDOR</div>
            <div className="info-row"><span className="info-label">Nome:</span><span className="info-value">{profile?.full_name}</span></div>
            <div className="info-row"><span className="info-label">Matrícula:</span><span className="info-value">{profile?.registration_number || '-'}</span></div>
            <div className="info-row"><span className="info-label">Coordenação:</span><span className="info-value">{profile?.division || 'CFA - Coordenação de Fiscalização de Alimentos'}</span></div>
            <div className="info-row"><span className="info-label">Período:</span><span className="info-value">01 a {new Date(selectedYear, selectedMonth, 0).getDate()}/{selectedMonth.toString().padStart(2, '0')}/{selectedYear}</span></div>
            <div className="info-row"><span className="info-label">Data do Relatório:</span><span className="info-value">{format(new Date(), 'dd/MM/yyyy')}</span></div>
          </div>

          {/* PROGRAMAÇÃO DE ORDENS DE SERVIÇO */}
          <div className="mb-6">
            <div className="section-title">PROGRAMAÇÃO DE ORDENS DE SERVIÇO (POS)</div>
            <table>
              <thead>
                <tr><th>Descrição</th><th>Quantidade</th></tr>
              </thead>
              <tbody>
                <tr><td>POS Programadas</td><td>{posProgrammed || totalDocuments}</td></tr>
                <tr><td>POS Executadas</td><td>{posExecuted || totalDocuments}</td></tr>
                <tr><td>Taxa de Cumprimento</td><td>{completionRate}%</td></tr>
              </tbody>
            </table>
          </div>

          {/* ESCALA DE TRABALHO */}
          <div className="mb-6">
            <div className="section-title">ESCALA DE TRABALHO</div>
            <table>
              <thead>
                <tr><th>Tipo de Atividade</th><th>Quantidade</th></tr>
              </thead>
              <tbody>
                <tr><td>Fiscalização em Área</td><td>{fieldDays || 0}</td></tr>
                <tr><td>Ação Interna</td><td>{internalDays || 0}</td></tr>
                <tr><td>Plantão Fiscal</td><td>{dutyDays || 0}</td></tr>
                <tr><td>Plantão Fiscal Especial</td><td>{specialDutyDays || 0}</td></tr>
              </tbody>
            </table>
          </div>

          {/* MEIO DE LOCOMOÇÃO */}
          <div className="mb-6">
            <div className="section-title">MEIO DE LOCOMOÇÃO</div>
            <table>
              <thead>
                <tr><th>Tipo</th><th>Dias Utilizados</th><th>Quilometragem</th></tr>
              </thead>
              <tbody>
                <tr><td>Carro Oficial</td><td>{transportMode === 'CO' ? fieldDays : 0}</td><td>-</td></tr>
                <tr><td>Carro Próprio</td><td>{transportMode === 'CP' ? fieldDays : 0}</td><td>{totalKm || 0} km</td></tr>
              </tbody>
            </table>
          </div>

          {/* Page Break */}
          <div className="page-break" />

          {/* AÇÕES DIÁRIAS */}
          <div className="text-center mb-6">
            <div className="flex justify-center items-center gap-3 mb-2">
              <img src={PREFEITURA_LOGO_URL} alt="Brasão de Goiânia" className="h-12 w-auto" />
              <img src={SUS_LOGO_URL} alt="SUS" className="h-8 w-auto" />
            </div>
            <h2 className="text-xs text-gray-600">DESCRIÇÃO DETALHADA DAS AÇÕES DIÁRIAS</h2>
          </div>

          <div className="mb-6">
            <table>
              <thead>
                <tr>
                  <th>Dia</th>
                  <th>ML</th>
                  <th>Tipo Ação</th>
                  <th>Nível</th>
                  <th>Grau</th>
                  <th>Descrição</th>
                  <th>Doc. Emitido</th>
                </tr>
              </thead>
              <tbody>
                {dailyActions.map((action, idx) => (
                  <tr key={idx}>
                    <td>{action.day}</td>
                    <td>{action.transport}</td>
                    <td>{action.actionType}</td>
                    <td>{action.level}</td>
                    <td>{action.grade}</td>
                    <td>{action.establishment}</td>
                    <td>{action.document}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* DESCRIÇÃO DAS AÇÕES */}
          <div className="mb-6">
            <div className="section-title">DESCRIÇÃO RESUMIDA DAS AÇÕES REALIZADAS</div>
            <p className="text-justify text-sm p-2">
              Durante o mês de {months[selectedMonth - 1].toLowerCase()} de {selectedYear}, foram realizadas {totalDocuments} ordens de serviço conforme programação estabelecida pela coordenação. As atividades incluíram inspeções sanitárias em estabelecimentos, reinspecções para verificação de correções, emissão de certidões sanitárias, coletas de amostras para análise laboratorial, atendimentos a denúncias e orientações técnicas aos responsáveis. Todas as ações foram devidamente documentadas através de autos de infração, termos de reinspeção, pareceres técnicos e certidões, conforme anexos comprobatórios.
            </p>
          </div>

          {/* DOCUMENTOS ANEXADOS - Bloco de comprovação completo */}
          <div className="mb-6">
            <div className="section-title">DOCUMENTAÇÃO COMPROBATÓRIA ANEXADA</div>
            <p className="text-xs text-gray-600 mb-2 italic">
              As peças fiscais abaixo relacionadas estão anexadas a este relatório como comprovação das atividades realizadas.
            </p>
            <table>
              <thead>
                <tr>
                  <th style={{ width: '8%' }}>Nº</th>
                  <th style={{ width: '12%' }}>Data</th>
                  <th style={{ width: '25%' }}>Tipo de Documento</th>
                  <th style={{ width: '20%' }}>Número</th>
                  <th style={{ width: '35%' }}>Estabelecimento</th>
                </tr>
              </thead>
              <tbody>
                {dailyActions.map((action, idx) => (
                  <tr key={idx}>
                    <td>{idx + 1}</td>
                    <td>{action.day}/{selectedMonth.toString().padStart(2, '0')}</td>
                    <td>{documentTypeLabels[action.documentType] || action.documentType}</td>
                    <td>{action.document}</td>
                    <td>{action.establishment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-2 text-xs text-gray-600">
              <strong>Total de peças anexadas:</strong> {dailyActions.length} documentos
            </div>
          </div>

          {/* RESUMO POR TIPO DE DOCUMENTO */}
          <div className="mb-6">
            <div className="section-title">RESUMO POR TIPO DE PEÇA FISCAL</div>
            <table>
              <thead>
                <tr><th>Tipo de Documento</th><th>Quantidade</th></tr>
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

          {/* ASSINATURA */}
          <div className="mt-16 text-center">
            <div className="w-72 mx-auto">
              <div className="border-t border-black mb-2 mt-12" />
              <p className="font-bold">{profile?.full_name}</p>
              <p className="text-sm">Matrícula: {profile?.registration_number}</p>
              <p className="text-xs text-gray-600">{profile?.division || 'Auditor Fiscal de Vigilância Sanitária'}</p>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-10 border-t pt-2 text-xs">
            <p><strong>NOTA:</strong> Eventualmente o número de OS executado poderá exceder o número de OS programado para fechamento de produção.</p>
            <p><strong>1ª VIA:</strong> CAAIF | <strong>2ª VIA:</strong> DIVISÃO DE FISCALIZAÇÃO</p>
            <p className="mt-2">Gerado em: {format(new Date(), 'dd/MM/yyyy')} | <strong>fiscaliz.app</strong> © {new Date().getFullYear()}</p>
          </div>
        </div>

        {/* Back button (hidden in print) */}
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
                <Label>Mês</Label>
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
              <div className="w-16">
                <Label>Versão</Label>
                <Input
                  type="number"
                  min="1"
                  value={reportVersion}
                  onChange={(e) => setReportVersion(parseInt(e.target.value) || 1)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Badge */}
        {isLocked && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 text-warning">
            <Lock className="h-4 w-4" />
            <span className="text-sm font-medium">Relatório enviado e bloqueado para edição</span>
          </div>
        )}

        <Tabs defaultValue="resumo" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="acoes">Ações</TabsTrigger>
            <TabsTrigger value="documentos">Docs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="resumo" className="space-y-4">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{totalDocuments}</p>
                      <p className="text-xs text-muted-foreground">POS Executadas</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-info/10">
                      <Calendar className="h-5 w-5 text-info" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{fieldDays || 0}</p>
                      <p className="text-xs text-muted-foreground">Dias em campo</p>
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
                      <p className="text-xs text-muted-foreground">Km rodados</p>
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
                      <p className="text-2xl font-bold">{dutyDays || 0}</p>
                      <p className="text-xs text-muted-foreground">Dias plantão</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Document Breakdown */}
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
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum documento gerado neste período
                  </p>
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
          
          <TabsContent value="dados" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Escala de Trabalho</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fieldDays">Fiscalização em Área</Label>
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
                    <Label htmlFor="internalDays">Ação Interna</Label>
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
                    <Label htmlFor="dutyDays">Plantão Fiscal</Label>
                    <Input
                      id="dutyDays"
                      type="number"
                      value={dutyDays}
                      onChange={(e) => setDutyDays(e.target.value)}
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="specialDutyDays">Plantão Especial</Label>
                    <Input
                      id="specialDutyDays"
                      type="number"
                      value={specialDutyDays}
                      onChange={(e) => setSpecialDutyDays(e.target.value)}
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">POS e Locomoção</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="posProgrammed">POS Programadas</Label>
                    <Input
                      id="posProgrammed"
                      type="number"
                      value={posProgrammed}
                      onChange={(e) => setPosProgrammed(e.target.value)}
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="posExecuted">POS Executadas</Label>
                    <Input
                      id="posExecuted"
                      type="number"
                      value={posExecuted}
                      disabled
                      className="mt-1 bg-muted"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transport">Locomoção</Label>
                    <select
                      id="transport"
                      value={transportMode}
                      onChange={(e) => setTransportMode(e.target.value)}
                      disabled={isLocked}
                      className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="CP">Carro Próprio</option>
                      <option value="CO">Carro Oficial</option>
                      <option value="MPL">Moto Própria</option>
                      <option value="TP">Transporte Público</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="totalKm">Km Rodados</Label>
                    <Input
                      id="totalKm"
                      type="number"
                      value={totalKm}
                      onChange={(e) => setTotalKm(e.target.value)}
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="acoes" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Ações Diárias - {months[selectedMonth - 1]}/{selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyActions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma ação registrada neste período
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dailyActions.map((action, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                          {action.day}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{action.establishment}</p>
                          <p className="text-xs text-muted-foreground">{action.actionType} • {action.document}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {action.level}{action.grade}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documentos" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Documentos - {months[selectedMonth - 1]}/{selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(documentSummary).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">
                      {documentTypeLabels[key] || key.replace(/_/g, ' ')}
                    </span>
                    <span className={cn(
                      'font-semibold',
                      value > 0 ? 'text-primary' : 'text-muted-foreground'
                    )}>{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isLocked && (
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={handleSave}
                disabled={saving}
              >
                <Edit3 className="mr-2 h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar Rascunho'}
              </Button>
              <Button 
                className="flex-1"
                onClick={handleSendReport}
                disabled={saving}
              >
                <Send className="mr-2 h-4 w-4" />
                Enviar
              </Button>
            </div>
          )}
          
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={handleGeneratePDF}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Gerar PDF - {months[selectedMonth - 1]} v{reportVersion}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}

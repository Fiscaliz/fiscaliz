import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Calendar, 
  Car, 
  Clock,
  Download,
  Send,
  Edit3,
  Lock,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function MonthlyReport() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Editable fields
  const [workingDays, setWorkingDays] = useState('');
  const [fieldDays, setFieldDays] = useState('');
  const [internalDays, setInternalDays] = useState('');
  const [dutyDays, setDutyDays] = useState('');
  const [totalKm, setTotalKm] = useState('');
  const [transportMode, setTransportMode] = useState('');
  const [osNumber, setOsNumber] = useState('');
  
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
      loadReport();
      loadDocumentStats();
    }
  }, [user, selectedMonth, selectedYear]);

  const loadReport = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('monthly_reports')
      .select('*')
      .eq('user_id', user.id)
      .eq('month', selectedMonth)
      .eq('year', selectedYear)
      .single();

    if (data) {
      setReport(data);
      setWorkingDays(data.working_days?.toString() || '');
      setFieldDays(data.field_days?.toString() || '');
      setInternalDays(data.internal_days?.toString() || '');
      setDutyDays(data.duty_days?.toString() || '');
      setTotalKm(data.total_km?.toString() || '');
      setTransportMode(data.transportation_mode || '');
      setOsNumber(data.os_number || '');
      if (data.documents_summary) {
        setDocumentSummary(data.documents_summary as unknown as DocumentSummary);
      }
    } else {
      setReport(null);
      // Reset fields
      setWorkingDays('');
      setFieldDays('');
      setInternalDays('');
      setDutyDays('');
      setTotalKm('');
      setTransportMode('');
      setOsNumber('');
    }
    
    setLoading(false);
  };

  const loadDocumentStats = async () => {
    if (!user) return;
    
    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0);
    
    const { data, error } = await supabase
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

  const totalDocuments = Object.values(documentSummary).reduce((a, b) => a + b, 0);
  const isLocked = report?.is_locked;

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="resumo">Resumo</TabsTrigger>
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
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
                      <p className="text-xs text-muted-foreground">Documentos</p>
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
                <CardTitle className="text-sm font-medium">Peças Fiscais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { key: 'termo_intimacao', label: 'Termos de Intimação' },
                  { key: 'visita_fiscal', label: 'Visitas Fiscais' },
                  { key: 'auto_infracao', label: 'Autos de Infração' },
                  { key: 'advertencia', label: 'Advertências' },
                  { key: 'inutilizacao', label: 'Inutilizações' },
                  { key: 'apreensao', label: 'Apreensões' },
                  { key: 'interdicao', label: 'Interdições' },
                ].map(({ key, label }) => {
                  const value = documentSummary[key as keyof DocumentSummary];
                  if (value === 0) return null;
                  return (
                    <div key={key} className="flex items-center justify-between py-1">
                      <span className="text-sm">{label}</span>
                      <span className="font-semibold">{value}</span>
                    </div>
                  );
                })}
                {totalDocuments === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum documento gerado neste período
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="dados" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="workingDays">Dias Úteis</Label>
                    <Input
                      id="workingDays"
                      type="number"
                      value={workingDays}
                      onChange={(e) => setWorkingDays(e.target.value)}
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fieldDays">Dias em Campo</Label>
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
                    <Label htmlFor="internalDays">Dias Internos</Label>
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
                    <Label htmlFor="dutyDays">Dias de Plantão</Label>
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

                <div>
                  <Label htmlFor="osNumber">Número da POS</Label>
                  <Input
                    id="osNumber"
                    value={osNumber}
                    onChange={(e) => setOsNumber(e.target.value)}
                    placeholder="Ex: 19/12"
                    disabled={isLocked}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalKm">Km Rodados (MPL)</Label>
                    <Input
                      id="totalKm"
                      type="number"
                      value={totalKm}
                      onChange={(e) => setTotalKm(e.target.value)}
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="transport">Locomoção</Label>
                    <Input
                      id="transport"
                      value={transportMode}
                      onChange={(e) => setTransportMode(e.target.value)}
                      placeholder="MPL, CO, etc"
                      disabled={isLocked}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documentos" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Documentos Gerados - {months[selectedMonth - 1]}/{selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(documentSummary).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm capitalize">
                      {key.replace(/_/g, ' ')}
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
            <Button className="flex-1">
              <Send className="mr-2 h-4 w-4" />
              Enviar
            </Button>
          </div>
        )}

        <Button variant="outline" className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>
    </AppLayout>
  );
}

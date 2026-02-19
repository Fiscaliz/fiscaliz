import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BrandHeader } from '@/components/layout/BrandHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  FileText, 
  MapPin,
  AlertTriangle,
  Clock,
  Package,
  Trash2,
  Activity,
  Target,
  TableIcon,
  ChevronLeft,
  ChevronRight,
  Calendar,
  ShieldAlert,
  TrendingUp,
  Building2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RISK_LABELS } from '@/data/cnaeRiskTable';

const COLORS = ['#0F4C5C', '#14B8A6', '#2E8B57', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
const RISK_COLORS: Record<string, string> = {
  'III': '#EF4444',
  'II': '#F59E0B',
  'I': '#2E8B57',
  'null': '#94a3b8',
};

const documentTypeLabels: Record<string, string> = {
  termo_intimacao: 'Termo Intimação',
  visita_fiscal: 'Visita Fiscal',
  auto_infracao: 'Auto Infração',
  advertencia: 'Advertência',
  inutilizacao: 'Inutilização',
  apreensao: 'Apreensão',
  interdicao: 'Interdição',
  relatorio_tecnico: 'Rel. Técnico',
  notificacao: 'Notificação',
  replica: 'Réplica',
  certidao: 'Certidão',
  coleta_amostra: 'Col. Amostra',
};

// Abreviações para a tabela estatística (ordem do template)
const docTypeShortLabels: { key: string; label: string }[] = [
  { key: 'termo_intimacao', label: 'TI' },
  { key: 'visita_fiscal', label: 'VF' },
  { key: 'apreensao', label: 'APR' },
  { key: 'interdicao', label: 'INTERD' },
  { key: 'inutilizacao', label: 'INUT' },
  { key: 'advertencia', label: 'ADV' },
  { key: 'auto_infracao', label: 'AI' },
  { key: 'certidao', label: 'CERT' },
  { key: 'relatorio_tecnico', label: 'R. TÉC' },
  { key: 'replica', label: 'RÉPL' },
  { key: 'coleta_amostra', label: 'COLETA' },
  { key: 'notificacao', label: 'NOTIF' },
];

const actionReasonLabels: Record<string, string> = {
  denuncia: 'Denúncia',
  rotina: 'Rotina',
  relatorio_tecnico: 'Rel. Técnico',
  investigativa: 'Investigativa',
  demanda_chefia: 'Demanda Chefia',
  surto: 'Surto',
  operacao_conjunta: 'Op. Conjunta',
  coleta: 'Coleta',
  demanda_especifica: 'Demanda Esp.',
  outros: 'Outros',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('individual');
  
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  
  const [myDocuments, setMyDocuments] = useState<any[]>([]);
  const [myActions, setMyActions] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [divisionDocuments, setDivisionDocuments] = useState<any[]>([]);
  const [divisionActions, setDivisionActions] = useState<any[]>([]);

  const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();

  const goToPrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (isCurrentMonth) return;
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const getMonthRange = () => {
    const start = new Date(selectedYear, selectedMonth, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedYear, selectedMonth + 1, 1);
    end.setHours(0, 0, 0, 0);
    return { start, end };
  };

  useEffect(() => {
    if (user) {
      loadMyStats();
    }
  }, [user, selectedMonth, selectedYear]);

  useEffect(() => {
    if (activeTab === 'division') {
      loadDivisionStats();
    }
  }, [activeTab, selectedMonth, selectedYear]);

  const loadMyStats = async () => {
    if (!user) return;
    setLoading(true);

    const { start, end } = getMonthRange();

    const [docsRes, actionsRes, tasksRes] = await Promise.all([
      supabase
        .from('fiscal_documents')
        .select('*, establishments(*)')
        .eq('user_id', user.id)
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
        .order('created_at', { ascending: false }),
      supabase
        .from('fiscal_actions')
        .select('*, establishments(*)')
        .eq('user_id', user.id)
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString())
        .order('created_at', { ascending: false }),
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'completed')
        .order('due_date', { ascending: true })
        .limit(5),
    ]);

    if (docsRes.data) setMyDocuments(docsRes.data);
    if (actionsRes.data) setMyActions(actionsRes.data);
    if (tasksRes.data) setMyTasks(tasksRes.data);
    
    setLoading(false);
  };

  const loadDivisionStats = async () => {
    const { start, end } = getMonthRange();

    const [docsRes, actionsRes] = await Promise.all([
      supabase
        .from('fiscal_documents')
        .select('document_type, created_at, total_weight_kg, irregularities, establishments(bairro, risk_level, cnae_principal, nome_fantasia, razao_social)')
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString()),
      supabase
        .from('fiscal_actions')
        .select('reason, created_at, establishments(bairro, risk_level, cnae_principal)')
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString()),
    ]);

    if (docsRes.data) setDivisionDocuments(docsRes.data);
    if (actionsRes.data) setDivisionActions(docsRes.data ? actionsRes.data : []);
  };

  const myStats = useMemo(() => {
    const docsByType: Record<string, number> = {};
    myDocuments.forEach(doc => {
      docsByType[doc.document_type] = (docsByType[doc.document_type] || 0) + 1;
    });

    const actionsByReason: Record<string, number> = {};
    myActions.forEach(action => {
      actionsByReason[action.reason] = (actionsByReason[action.reason] || 0) + 1;
    });

    const pendingTasks = myTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
    const urgentTasks = myTasks.filter(t => {
      if (!t.due_date) return false;
      const daysUntilDue = Math.ceil((new Date(t.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 7;
    }).length;

    const totalInutilizadoKg = myDocuments
      .filter(doc => doc.document_type === 'inutilizacao')
      .reduce((sum, doc) => sum + (doc.total_weight_kg || 0), 0);

    const totalApreensoes = myDocuments.filter(doc => doc.document_type === 'apreensao').length;

    return {
      totalDocuments: myDocuments.length,
      totalActions: myActions.length,
      pendingTasks,
      urgentTasks,
      docsByType,
      actionsByReason,
      totalInutilizadoKg,
      totalApreensoes,
    };
  }, [myDocuments, myActions, myTasks]);

  const divisionStats = useMemo(() => {
    const docsByType: Record<string, number> = {};
    divisionDocuments.forEach(doc => {
      docsByType[doc.document_type] = (docsByType[doc.document_type] || 0) + 1;
    });

    // Ações por bairro
    const byBairro: Record<string, number> = {};
    divisionActions.forEach(action => {
      const bairro = action.establishments?.bairro || 'Não informado';
      byBairro[bairro] = (byBairro[bairro] || 0) + 1;
    });
    const topBairros = Object.entries(byBairro)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const totalInutilizadoKg = divisionDocuments
      .filter((doc: any) => doc.document_type === 'inutilizacao')
      .reduce((sum: number, doc: any) => sum + (doc.total_weight_kg || 0), 0);

    const totalApreensoes = divisionDocuments.filter((doc: any) => doc.document_type === 'apreensao').length;

    // ===== INDICADORES ESTRATÉGICOS =====

    // % de fiscalizações por nível de risco
    const byRiskLevel: Record<string, number> = { 'III': 0, 'II': 0, 'I': 0, 'Não informado': 0 };
    divisionActions.forEach((action: any) => {
      const risk = action.establishments?.risk_level;
      if (risk === 'III') byRiskLevel['III']++;
      else if (risk === 'II') byRiskLevel['II']++;
      else if (risk === 'I') byRiskLevel['I']++;
      else byRiskLevel['Não informado']++;
    });
    const totalActionsForRisk = divisionActions.length || 1;
    const riskDistribution = Object.entries(byRiskLevel)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        name: key === 'III' ? 'Alto (III)' : key === 'II' ? 'Médio (II)' : key === 'I' ? 'Baixo (I)' : 'Sem risco',
        value,
        pct: Math.round((value / totalActionsForRisk) * 100),
        fill: key === 'III' ? '#EF4444' : key === 'II' ? '#F59E0B' : key === 'I' ? '#2E8B57' : '#94a3b8',
      }));

    // Top irregularidades reais (extraindo do campo irregularities dos documentos)
    const irregularityCount: Record<string, number> = {};
    divisionDocuments.forEach((doc: any) => {
      const irregs = doc.irregularities;
      if (Array.isArray(irregs)) {
        irregs.forEach((irr: any) => {
          const desc = typeof irr === 'string' ? irr : irr?.description || irr?.text || '';
          if (desc && desc.trim().length > 3) {
            const key = desc.trim().slice(0, 60);
            irregularityCount[key] = (irregularityCount[key] || 0) + 1;
          }
        });
      }
    });
    const topIrregularities = Object.entries(irregularityCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Ranking por tipo de estabelecimento (baseado no CNAE / nome)
    const byEstabType: Record<string, number> = {};
    divisionDocuments.forEach((doc: any) => {
      const name = doc.establishments?.nome_fantasia || doc.establishments?.razao_social || 'Outros';
      // Agrupar pela primeira palavra como categoria aproximada
      const category = name.split(' ')[0].toUpperCase();
      byEstabType[category] = (byEstabType[category] || 0) + 1;
    });
    const topEstabTypes = Object.entries(byEstabType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Motivos das ações da divisão
    const byReason: Record<string, number> = {};
    divisionActions.forEach((action: any) => {
      byReason[action.reason] = (byReason[action.reason] || 0) + 1;
    });
    const reasonDistribution = Object.entries(byReason)
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => ({
        name: actionReasonLabels[key] || key,
        value,
      }));

    // Documentos de alto impacto (apreensão + interdição + auto infração)
    const highImpactDocs = (docsByType['apreensao'] || 0) + (docsByType['interdicao'] || 0) + (docsByType['auto_infracao'] || 0);
    const highImpactPct = divisionDocuments.length > 0
      ? Math.round((highImpactDocs / divisionDocuments.length) * 100)
      : 0;

    return {
      totalDocuments: divisionDocuments.length,
      totalActions: divisionActions.length,
      docsByType,
      topBairros,
      totalInutilizadoKg,
      totalApreensoes,
      riskDistribution,
      topIrregularities,
      topEstabTypes,
      reasonDistribution,
      highImpactDocs,
      highImpactPct,
    };
  }, [divisionDocuments, divisionActions]);

  const pieChartData = useMemo(() => {
    return Object.entries(myStats.docsByType).map(([key, value]) => ({
      name: documentTypeLabels[key] || key,
      value,
    }));
  }, [myStats.docsByType]);

  const barChartData = useMemo(() => {
    return Object.entries(myStats.actionsByReason).map(([key, value]) => ({
      name: actionReasonLabels[key] || key,
      quantidade: value,
    }));
  }, [myStats.actionsByReason]);

  const divisionBarData = useMemo(() => {
    return divisionStats.topBairros.map(([bairro, count]) => ({
      name: bairro.length > 15 ? bairro.substring(0, 15) + '...' : bairro,
      ações: count,
    }));
  }, [divisionStats.topBairros]);

  return (
    <AppLayout>
      <BrandHeader />
      
      <div className="-mt-5 rounded-t-[2rem] bg-background px-5 pt-6 space-y-5">
        {/* Month Selector */}
        <div className="flex items-center justify-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-[180px] justify-center">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold text-sm capitalize">
              {format(new Date(selectedYear, selectedMonth, 1), 'MMMM yyyy', { locale: ptBR })}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextMonth} disabled={isCurrentMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="individual" className="text-body font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-premium-sm">
              Meu Dashboard
            </TabsTrigger>
            <TabsTrigger value="division" className="text-body font-semibold rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-premium-sm">
              Divisão
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="individual" className="space-y-5 mt-5">
            {/* Tabela Estatística de Documentos Emitidos */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2 bg-warning/20">
                <CardTitle className="text-body font-bold flex items-center gap-2">
                  <TableIcon className="h-5 w-5 text-warning" />
                  DOCUMENTOS EMITIDOS - {format(new Date(selectedYear, selectedMonth, 1), 'MMMM yyyy', { locale: ptBR }).toUpperCase()}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-warning/30 hover:bg-warning/30">
                        <TableHead className="font-bold text-foreground text-center min-w-[60px]">TOTAL</TableHead>
                        {docTypeShortLabels.map(({ label }) => (
                          <TableHead key={label} className="font-bold text-foreground text-center min-w-[50px] text-xs">
                            {label}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-bold text-center text-lg bg-warning/10">
                          {myStats.totalDocuments}
                        </TableCell>
                        {docTypeShortLabels.map(({ key }) => (
                          <TableCell key={key} className="text-center font-medium">
                            {myStats.docsByType[key] || 0}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard 
                icon={FileText}
                label="Documentos"
                value={myStats.totalDocuments.toString()}
                subtitle="este mês"
                color="bg-primary/15 text-primary"
              />
              <StatCard 
                icon={Activity}
                label="Fiscalizações"
                value={myStats.totalActions.toString()}
                subtitle="este mês"
                color="bg-info/15 text-info"
              />
              <StatCard 
                icon={Trash2}
                label="Inutilizados"
                value={`${myStats.totalInutilizadoKg.toFixed(1)} kg`}
                subtitle="este mês"
                color="bg-destructive/15 text-destructive"
              />
              <StatCard 
                icon={Package}
                label="Apreensões"
                value={myStats.totalApreensoes.toString()}
                subtitle="este mês"
                color="bg-warning/15 text-warning"
              />
              <StatCard 
                icon={Clock}
                label="Pendentes"
                value={myStats.pendingTasks.toString()}
                subtitle="tarefas"
                color="bg-muted text-muted-foreground"
              />
              <StatCard 
                icon={AlertTriangle}
                label="Urgentes"
                value={myStats.urgentTasks.toString()}
                subtitle="< 7 dias"
                color="bg-destructive/15 text-destructive"
              />
            </div>
            
            {/* Documents by Type Chart - Horizontal Bar */}
            {pieChartData.length > 0 ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-body font-semibold flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    Documentos por Tipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[260px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={pieChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" name="Quantidade" radius={[0, 6, 6, 0]}>
                          {pieChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Actions by Reason Chart */}
            {barChartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-body font-semibold flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-secondary/10">
                      <Target className="h-4 w-4 text-secondary" />
                    </div>
                    Motivos das Ações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={85} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* ===== ABA DIVISÃO - DASHBOARD ESTRATÉGICO ===== */}
          <TabsContent value="division" className="space-y-5 mt-5">

            {/* Cabeçalho estratégico */}
            <div className="rounded-xl bg-primary/10 border border-primary/20 px-4 py-3 flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-primary">Dashboard Estratégico</p>
                <p className="text-xs text-muted-foreground">Análise de risco sanitário — {format(new Date(selectedYear, selectedMonth, 1), 'MMMM/yyyy', { locale: ptBR })}</p>
              </div>
            </div>

            {/* KPIs principais */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard 
                icon={FileText}
                label="Documentos"
                value={divisionStats.totalDocuments.toString()}
                subtitle="divisão"
                color="bg-secondary/15 text-secondary"
              />
              <StatCard 
                icon={Activity}
                label="Fiscalizações"
                value={divisionStats.totalActions.toString()}
                subtitle="divisão"
                color="bg-info/15 text-info"
              />
              <StatCard 
                icon={Trash2}
                label="Inutilizados"
                value={`${divisionStats.totalInutilizadoKg.toFixed(1)} kg`}
                subtitle="este mês"
                color="bg-destructive/15 text-destructive"
              />
              <StatCard 
                icon={ShieldAlert}
                label="Alto Impacto"
                value={`${divisionStats.highImpactDocs}`}
                subtitle={`${divisionStats.highImpactPct}% do total`}
                color="bg-warning/15 text-warning"
              />
            </div>

            {/* % Fiscalizações por Nível de Risco */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-body font-semibold flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-destructive/10">
                    <ShieldAlert className="h-4 w-4 text-destructive" />
                  </div>
                  Fiscalizações por Nível de Risco
                </CardTitle>
              </CardHeader>
              <CardContent>
                {divisionStats.riskDistribution.length > 0 ? (
                  <div className="space-y-3">
                    {divisionStats.riskDistribution.map(item => (
                      <div key={item.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                            <span className="font-medium">{item.name}</span>
                          </div>
                          <span className="font-bold">{item.value} <span className="text-muted-foreground font-normal text-xs">({item.pct}%)</span></span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${item.pct}%`, backgroundColor: item.fill }}
                          />
                        </div>
                      </div>
                    ))}
                    {divisionStats.riskDistribution.some(r => r.name.includes('Alto')) && (
                      <p className="text-xs text-muted-foreground italic mt-2">
                        ✅ Fiscalizações em estabelecimentos de alto risco (III) indicam foco estratégico correto.
                      </p>
                    )}
                  </div>
                ) : (
                  <EmptyState icon={ShieldAlert} text="Sem dados de risco para este período" />
                )}
              </CardContent>
            </Card>

            {/* Top Bairros */}
            {divisionBarData.length > 0 ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-body font-semibold flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-info/10">
                      <MapPin className="h-4 w-4 text-info" />
                    </div>
                    Top 5 Bairros Fiscalizados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={divisionBarData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="ações" fill="hsl(var(--info))" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-body font-semibold flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-info/10">
                      <MapPin className="h-4 w-4 text-info" />
                    </div>
                    Mapa de Risco por Bairro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EmptyState icon={MapPin} text="Requer mais dados de fiscalização" subtitle="Os bairros aparecerão conforme ações forem registradas" />
                </CardContent>
              </Card>
            )}

            {/* Motivos das Ações - Divisão */}
            {divisionStats.reasonDistribution.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-body font-semibold flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-secondary/10">
                      <Target className="h-4 w-4 text-secondary" />
                    </div>
                    Motivos das Ações — Divisão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {divisionStats.reasonDistribution.map((item, idx) => (
                      <div key={item.name} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                          <span className="text-sm">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 rounded-full bg-primary/20 w-16 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${Math.round((item.value / (divisionStats.totalActions || 1)) * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold w-6 text-right">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Irregularidades Reais */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-body font-semibold flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-warning/10">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  </div>
                  Top Irregularidades Registradas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {divisionStats.topIrregularities.length > 0 ? (
                  <div className="space-y-1">
                    {divisionStats.topIrregularities.map(([label, count], idx) => (
                      <div key={idx} className="flex items-start justify-between py-2.5 border-b border-border/40 last:border-0 gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <Badge variant="outline" className="text-[10px] flex-shrink-0 mt-0.5">#{idx + 1}</Badge>
                          <span className="text-sm leading-snug">{label}</span>
                        </div>
                        <span className="text-sm font-bold text-destructive flex-shrink-0">{count}×</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    icon={AlertTriangle} 
                    text="Sem irregularidades estruturadas registradas" 
                    subtitle="As irregularidades aparecem quando documentos com campos estruturados são emitidos"
                  />
                )}
              </CardContent>
            </Card>

            {/* Ranking por Tipo de Estabelecimento */}
            {divisionStats.topEstabTypes.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-body font-semibold flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    Tipos de Estabelecimentos Mais Fiscalizados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {divisionStats.topEstabTypes.map(([type, count], idx) => {
                      const total = divisionStats.totalDocuments || 1;
                      const pct = Math.round((count / total) * 100);
                      return (
                        <div key={type} className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground w-4">{idx + 1}.</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between mb-1">
                              <span className="text-xs font-medium truncate">{type}</span>
                              <span className="text-xs text-muted-foreground">{count} ({pct}%)</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-secondary"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="pb-4" />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle: string;
  color: string;
}

function StatCard({ icon: Icon, label, value, subtitle, color }: StatCardProps) {
  return (
    <Card className="transition-all duration-200 hover:shadow-premium">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-micro font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className="mt-1.5 text-h1 font-bold">{value}</p>
            <p className="text-caption text-muted-foreground">{subtitle}</p>
          </div>
          <div className={`rounded-xl p-2.5 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, text, subtitle }: { icon: React.ElementType; text: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-center rounded-xl bg-muted/30">
      <div>
        <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center">
          <Icon className="h-6 w-6 text-muted-foreground/40" />
        </div>
        <p className="text-body text-muted-foreground">{text}</p>
        {subtitle && <p className="text-caption text-muted-foreground/70 mt-1 max-w-[220px]">{subtitle}</p>}
      </div>
    </div>
  );
}

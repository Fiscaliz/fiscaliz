import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { BrandHeader } from '@/components/layout/BrandHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  FileText, 
  MapPin,
  AlertTriangle,
  Clock,
  Package,
  Trash2,
  Activity,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const COLORS = ['#0F4C5C', '#14B8A6', '#2E8B57', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

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
  
  const [myDocuments, setMyDocuments] = useState<any[]>([]);
  const [myActions, setMyActions] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [divisionDocuments, setDivisionDocuments] = useState<any[]>([]);
  const [divisionActions, setDivisionActions] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      loadMyStats();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'division') {
      loadDivisionStats();
    }
  }, [activeTab]);

  const loadMyStats = async () => {
    if (!user) return;
    setLoading(true);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [docsRes, actionsRes, tasksRes] = await Promise.all([
      supabase
        .from('fiscal_documents')
        .select('*, establishments(*)')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())
        .order('created_at', { ascending: false }),
      supabase
        .from('fiscal_actions')
        .select('*, establishments(*)')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())
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
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [docsRes, actionsRes] = await Promise.all([
      supabase
        .from('fiscal_documents')
        .select('document_type, created_at, total_weight_kg, establishments(bairro)')
        .gte('created_at', startOfMonth.toISOString()),
      supabase
        .from('fiscal_actions')
        .select('reason, created_at, establishments(bairro)')
        .gte('created_at', startOfMonth.toISOString()),
    ]);

    if (docsRes.data) setDivisionDocuments(docsRes.data);
    if (actionsRes.data) setDivisionActions(actionsRes.data);
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

    return {
      totalDocuments: divisionDocuments.length,
      totalActions: divisionActions.length,
      docsByType,
      topBairros,
      totalInutilizadoKg,
      totalApreensoes,
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
            
            {/* Documents by Type Chart */}
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
                  <div className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={85}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ value }) => `${value}`}
                        >
                          {pieChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-body font-semibold flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    Produtividade Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-14 text-center">
                    <div>
                      <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <BarChart3 className="h-7 w-7 text-muted-foreground/40" />
                      </div>
                      <p className="text-body text-muted-foreground">
                        Dados de produtividade
                      </p>
                      <p className="text-caption text-muted-foreground/70">
                        Aparecerão conforme você fiscalizar
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
          
          <TabsContent value="division" className="space-y-5 mt-5">
            {/* Division Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard 
                icon={FileText}
                label="Total Divisão"
                value={divisionStats.totalDocuments.toString()}
                subtitle="documentos"
                color="bg-secondary/15 text-secondary"
              />
              <StatCard 
                icon={MapPin}
                label="Fiscalizações"
                value={divisionStats.totalActions.toString()}
                subtitle="este mês"
                color="bg-info/15 text-info"
              />
            </div>
            
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
                    Mapa de Risco - Goiânia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-14 text-center rounded-xl bg-muted/30">
                    <div>
                      <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                        <MapPin className="h-7 w-7 text-muted-foreground/40" />
                      </div>
                      <p className="text-body text-muted-foreground">
                        Mapa de calor
                      </p>
                      <p className="text-caption text-muted-foreground/70">
                        Requer mais dados de fiscalização
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Irregularities */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-body font-semibold flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-warning/10">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                  </div>
                  Top 5 Irregularidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {[
                    { label: 'Falta de alvará sanitário', count: 0 },
                    { label: 'Produtos vencidos', count: 0 },
                    { label: 'Higiene inadequada', count: 0 },
                    { label: 'Falta de controle de pragas', count: 0 },
                    { label: 'Estrutura física irregular', count: 0 },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                      <span className="text-body">{item.label}</span>
                      <span className="text-body font-semibold text-muted-foreground">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Additional Metrics */}
            <div className="grid grid-cols-2 gap-3 pb-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl p-2.5 bg-destructive/15">
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-h2 font-bold">{divisionStats.totalInutilizadoKg.toFixed(1)} kg</p>
                      <p className="text-caption text-muted-foreground">Inutilizados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl p-2.5 bg-warning/15">
                      <Package className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-h2 font-bold">{divisionStats.totalApreensoes}</p>
                      <p className="text-caption text-muted-foreground">Apreensões</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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

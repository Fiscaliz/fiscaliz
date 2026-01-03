import { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Package,
  Trash2,
  Activity,
  Target
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  AreaChart,
  Area,
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

const COLORS = ['#003366', '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

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
  
  // Individual stats
  const [myDocuments, setMyDocuments] = useState<any[]>([]);
  const [myActions, setMyActions] = useState<any[]>([]);
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Division stats
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
        .select('document_type, created_at, establishments(bairro)')
        .gte('created_at', startOfMonth.toISOString()),
      supabase
        .from('fiscal_actions')
        .select('reason, created_at, establishments(bairro)')
        .gte('created_at', startOfMonth.toISOString()),
    ]);

    if (docsRes.data) setDivisionDocuments(docsRes.data);
    if (actionsRes.data) setDivisionActions(actionsRes.data);
  };

  // Individual metrics
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

    return {
      totalDocuments: myDocuments.length,
      totalActions: myActions.length,
      pendingTasks,
      urgentTasks,
      docsByType,
      actionsByReason,
    };
  }, [myDocuments, myActions, myTasks]);

  // Division metrics
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

    return {
      totalDocuments: divisionDocuments.length,
      totalActions: divisionActions.length,
      docsByType,
      topBairros,
    };
  }, [divisionDocuments, divisionActions]);

  // Chart data
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
      <Header title="Dashboard" subtitle="Métricas e estatísticas" />
      
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="individual">Meu Dashboard</TabsTrigger>
            <TabsTrigger value="division">Divisão</TabsTrigger>
          </TabsList>
          
          <TabsContent value="individual" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard 
                icon={FileText}
                label="Documentos"
                value={myStats.totalDocuments.toString()}
                subtitle="este mês"
                color="bg-primary"
              />
              <StatCard 
                icon={Activity}
                label="Fiscalizações"
                value={myStats.totalActions.toString()}
                subtitle="este mês"
                color="bg-info"
              />
              <StatCard 
                icon={Clock}
                label="Pendentes"
                value={myStats.pendingTasks.toString()}
                subtitle="tarefas"
                color="bg-warning"
              />
              <StatCard 
                icon={AlertTriangle}
                label="Urgentes"
                value={myStats.urgentTasks.toString()}
                subtitle="< 7 dias"
                color="bg-destructive"
              />
            </div>
            
            {/* Documents by Type Chart */}
            {pieChartData.length > 0 ? (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Documentos por Tipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${value}`}
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
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Produtividade Mensal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-12 text-center">
                    <div>
                      <BarChart3 className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Dados de produtividade
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        Aparecerão conforme você fiscalizar
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions by Reason Chart */}
            {barChartData.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    Motivos das Ações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="quantidade" fill="#003366" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="division" className="space-y-4">
            {/* Division Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard 
                icon={FileText}
                label="Total Divisão"
                value={divisionStats.totalDocuments.toString()}
                subtitle="documentos"
                color="bg-secondary"
              />
              <StatCard 
                icon={MapPin}
                label="Fiscalizações"
                value={divisionStats.totalActions.toString()}
                subtitle="este mês"
                color="bg-info"
              />
            </div>
            
            {/* Top Bairros */}
            {divisionBarData.length > 0 ? (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Top 5 Bairros Fiscalizados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={divisionBarData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="ações" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Mapa de Risco - Goiânia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-12 text-center rounded-lg bg-muted/50">
                    <div>
                      <MapPin className="mx-auto mb-2 h-10 w-10 text-muted-foreground/40" />
                      <p className="text-sm text-muted-foreground">
                        Mapa de calor
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        Requer mais dados de fiscalização
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Top Irregularities placeholder */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Top 5 Irregularidades
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: 'Falta de alvará sanitário', count: 0 },
                    { label: 'Produtos vencidos', count: 0 },
                    { label: 'Higiene inadequada', count: 0 },
                    { label: 'Falta de controle de pragas', count: 0 },
                    { label: 'Estrutura física irregular', count: 0 },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                      <span className="text-sm">{item.label}</span>
                      <span className="text-sm font-medium text-muted-foreground">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-destructive/10">
                      <Trash2 className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">0 kg</p>
                      <p className="text-xs text-muted-foreground">Inutilizados</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-warning/10">
                      <Package className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-xs text-muted-foreground">Apreensões</p>
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
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className={`rounded-lg p-2 ${color} text-primary-foreground`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

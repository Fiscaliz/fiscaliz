import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  ClipboardList, 
  BarChart3, 
  Bell,
  Plus,
  Calendar,
  ChevronRight,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import fiscalizLogo from '@/assets/fiscaliz-logo.png';

const documentTypeLabels: Record<string, string> = {
  termo_intimacao: 'Termo de Intimação',
  visita_fiscal: 'Visita Fiscal',
  auto_infracao: 'Auto de Infração',
  advertencia: 'Advertência',
  inutilizacao: 'Inutilização',
  apreensao: 'Apreensão',
  interdicao: 'Interdição',
  relatorio_tecnico: 'Relatório Técnico',
  notificacao: 'Notificação',
  replica: 'Réplica',
  certidao: 'Certidão',
  coleta_amostra: 'Coleta de Amostra',
};

interface RecentDocument {
  id: string;
  document_type: string;
  status: string;
  created_at: string;
  establishment?: {
    nome_fantasia?: string;
    razao_social: string;
  };
}

interface PendingTask {
  id: string;
  title: string;
  due_date?: string;
  priority: string;
  status: string;
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get first name from email or full_name
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] 
    || user?.email?.split('@')[0] 
    || 'Fiscal';

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    
    // Load recent documents
    const { data: docs } = await supabase
      .from('fiscal_documents')
      .select(`
        id, document_type, status, created_at,
        establishment:establishments(nome_fantasia, razao_social)
      `)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (docs) {
      setRecentDocs(docs.map(d => ({
        ...d,
        establishment: Array.isArray(d.establishment) ? d.establishment[0] : d.establishment
      })));
    }

    // Load pending tasks
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, due_date, priority, status')
      .in('status', ['pending', 'in_progress'])
      .order('due_date', { ascending: true })
      .limit(5);
    
    if (tasks) {
      setPendingTasks(tasks);
    }

    setLoading(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    });
  };

  const isUrgent = (dueDate?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const daysUntil = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7;
  };

  const quickActions = [
    {
      icon: FileText,
      label: 'Termo de Intimação',
      description: 'Gerar novo termo',
      color: 'bg-primary',
      href: '/nova-acao?tipo=termo_intimacao',
    },
    {
      icon: ClipboardList,
      label: 'Visita Fiscal',
      description: 'Registrar visita',
      color: 'bg-secondary',
      href: '/nova-acao?tipo=visita_fiscal',
    },
    {
      icon: BarChart3,
      label: 'Dashboard',
      description: 'Ver métricas',
      color: 'bg-info',
      href: '/dashboard',
    },
  ];

  return (
    <AppLayout>
      {/* Header with brand gradient */}
      <div className="fiscaliz-gradient px-4 pb-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary-foreground/10 p-2 backdrop-blur-sm">
              <img src={fiscalizLogo} alt="Fiscaliz" className="h-full w-full object-contain" />
            </div>
            <div>
              <p className="text-sm text-primary-foreground/80">Olá,</p>
              <h1 className="text-xl font-bold text-primary-foreground">{firstName}</h1>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="-mt-4 rounded-t-3xl bg-background px-4 pt-6">
        {/* New Action Button */}
        <Button 
          size="lg" 
          className="mb-6 w-full h-14 text-base font-semibold shadow-lg"
          onClick={() => navigate('/nova-acao')}
        >
          <Plus className="mr-2 h-5 w-5" />
          Nova Ação Fiscal
        </Button>

        {/* Quick Actions */}
        <section className="mb-6">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Link 
                key={action.label} 
                to={action.href}
                className="group"
              >
                <Card className="h-full border-0 shadow-sm transition-all hover:shadow-md group-active:scale-95">
                  <CardContent className="flex flex-col items-center p-4 text-center">
                    <div className={`mb-2 rounded-xl p-2.5 ${action.color} text-primary-foreground`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-medium leading-tight">{action.label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Monthly Report Link */}
        <section className="mb-6">
          <Link to="/relatorio-mensal">
            <Card className="border-0 shadow-sm hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl p-2.5 bg-success/10">
                      <Calendar className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-semibold">Relatório Mensal</p>
                      <p className="text-sm text-muted-foreground">Produtividade e estatísticas</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </section>

        {/* Pending Tasks Preview */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Tarefas Pendentes
            </h2>
            <Link to="/tarefas" className="text-sm text-primary hover:underline">
              Ver todas
            </Link>
          </div>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              {pendingTasks.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <div>
                    <ClipboardList className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Nenhuma tarefa pendente
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Suas tarefas aparecerão aqui
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <Link 
                      key={task.id} 
                      to="/tarefas"
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className={`p-2 rounded-lg ${isUrgent(task.due_date) ? 'bg-warning/10' : 'bg-primary/10'}`}>
                        {isUrgent(task.due_date) ? (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        ) : (
                          <Clock className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        {task.due_date && (
                          <p className="text-xs text-muted-foreground">
                            Prazo: {formatDate(task.due_date)}
                          </p>
                        )}
                      </div>
                      <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                        {task.priority === 'high' ? 'Urgente' : 'Normal'}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Recent Documents */}
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Documentos Recentes
            </h2>
            <Link to="/documentos" className="text-sm text-primary hover:underline">
              Ver todos
            </Link>
          </div>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              {recentDocs.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-center">
                  <div>
                    <FileText className="mx-auto mb-2 h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum documento ainda
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Comece uma nova ação fiscal
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentDocs.map((doc) => (
                    <Link 
                      key={doc.id} 
                      to={`/documento/${doc.id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {documentTypeLabels[doc.document_type] || doc.document_type}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {doc.establishment?.nome_fantasia || doc.establishment?.razao_social || 'Estabelecimento'}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={doc.status === 'sent' ? 'default' : 'outline'} className="text-xs">
                          {doc.status === 'sent' ? 'Enviado' : 'Rascunho'}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(doc.created_at)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}

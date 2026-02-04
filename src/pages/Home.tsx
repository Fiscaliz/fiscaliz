import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { BrandHeader } from '@/components/layout/BrandHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  ClipboardList, 
  BarChart3, 
  Plus,
  Calendar,
  ChevronRight,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

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
      {/* Brand Header */}
      <BrandHeader />

      {/* Main Content */}
      <div className="-mt-5 rounded-t-[2rem] bg-background px-5 pt-6 space-y-6">
        {/* New Action Button */}
        <Button 
          size="lg" 
          variant="premium"
          className="w-full shadow-premium-lg"
          onClick={() => navigate('/nova-acao')}
        >
          <Plus className="mr-2 h-5 w-5" />
          Nova Ação Fiscal
        </Button>

        {/* Quick Actions */}
        <section>
          <h2 className="mb-4 text-micro font-semibold text-muted-foreground uppercase tracking-widest">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action) => (
              <Link 
                key={action.label} 
                to={action.href}
                className="group"
              >
                <Card className="h-full transition-all duration-200 hover:shadow-premium group-active:scale-[0.98]">
                  <CardContent className="flex flex-col items-center p-4 text-center">
                    <div className={`mb-3 rounded-2xl p-3 ${action.color} text-primary-foreground shadow-premium-sm`}>
                      <action.icon className="h-5 w-5" />
                    </div>
                    <p className="text-caption font-semibold leading-tight">{action.label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Monthly Report Link */}
        <section>
          <Link to="/relatorio-mensal">
            <Card className="transition-all duration-200 hover:shadow-premium">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-2xl p-3 bg-success/15">
                      <Calendar className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-h3">Relatório Mensal</p>
                      <p className="text-caption text-muted-foreground">Produtividade e estatísticas</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </section>

        {/* Pending Tasks Preview */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-micro font-semibold text-muted-foreground uppercase tracking-widest">
              Tarefas Pendentes
            </h2>
            <Link to="/tarefas" className="text-caption text-primary font-semibold hover:underline">
              Ver todas
            </Link>
          </div>
          
          <Card>
            <CardContent className="p-4">
              {pendingTasks.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-center">
                  <div>
                    <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <ClipboardList className="h-7 w-7 text-muted-foreground/50" />
                    </div>
                    <p className="text-body text-muted-foreground">
                      Nenhuma tarefa pendente
                    </p>
                    <p className="text-caption text-muted-foreground/70">
                      Suas tarefas aparecerão aqui
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingTasks.map((task) => (
                    <Link 
                      key={task.id} 
                      to="/tarefas"
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200"
                    >
                      <div className={`p-2.5 rounded-xl ${isUrgent(task.due_date) ? 'bg-warning/15' : 'bg-primary/10'}`}>
                        {isUrgent(task.due_date) ? (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        ) : (
                          <Clock className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body font-medium truncate">{task.title}</p>
                        {task.due_date && (
                          <p className="text-caption text-muted-foreground">
                            Prazo: {formatDate(task.due_date)}
                          </p>
                        )}
                      </div>
                      <Badge variant={task.priority === 'high' ? 'destructive' : 'muted'}>
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
        <section className="pb-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-micro font-semibold text-muted-foreground uppercase tracking-widest">
              Documentos Recentes
            </h2>
            <Link to="/documentos" className="text-caption text-primary font-semibold hover:underline">
              Ver todos
            </Link>
          </div>
          
          <Card>
            <CardContent className="p-4">
              {recentDocs.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-center">
                  <div>
                    <div className="mx-auto mb-3 h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center">
                      <FileText className="h-7 w-7 text-muted-foreground/50" />
                    </div>
                    <p className="text-body text-muted-foreground">
                      Nenhum documento ainda
                    </p>
                    <p className="text-caption text-muted-foreground/70">
                      Comece uma nova ação fiscal
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentDocs.map((doc) => (
                    <Link 
                      key={doc.id} 
                      to={`/documento/${doc.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-all duration-200"
                    >
                      <div className="p-2.5 rounded-xl bg-primary/10">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body font-medium truncate">
                          {documentTypeLabels[doc.document_type] || doc.document_type}
                        </p>
                        <p className="text-caption text-muted-foreground truncate">
                          {doc.establishment?.nome_fantasia || doc.establishment?.razao_social || 'Estabelecimento'}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={doc.status === 'sent' ? 'default' : 'outline'}>
                          {doc.status === 'sent' ? 'Enviado' : 'Rascunho'}
                        </Badge>
                        <p className="text-caption text-muted-foreground mt-1">
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

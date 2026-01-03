import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  ChevronRight,
  Calendar,
  Building
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { format, differenceInDays, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: string;
  status: string;
  due_date?: string;
  document_id?: string;
  establishment_id?: string;
  created_at: string;
  completed_at?: string;
  establishment?: {
    nome_fantasia?: string;
    razao_social: string;
    endereco: string;
  };
  document?: {
    document_type: string;
    document_number?: string;
  };
}

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

export default function Tasks() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  const loadTasks = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        establishment:establishments(nome_fantasia, razao_social, endereco),
        document:fiscal_documents(document_type, document_number)
      `)
      .eq('user_id', user.id)
      .order('due_date', { ascending: true });

    if (error) {
      console.error('Error loading tasks:', error);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const handleTaskClick = (task: Task) => {
    if (task.document_id) {
      navigate(`/documento/${task.document_id}`);
    }
  };

  const handleCompleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId);

    if (!error) {
      loadTasks();
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const urgentTasks = tasks.filter(t => {
    if (t.status === 'completed') return false;
    if (!t.due_date) return false;
    const dueDate = new Date(t.due_date);
    const daysUntilDue = differenceInDays(dueDate, new Date());
    return daysUntilDue <= 7 || isPast(dueDate);
  });
  const completedTasks = tasks.filter(t => t.status === 'completed');

  const getUrgencyBadge = (task: Task) => {
    if (!task.due_date) return null;
    const dueDate = new Date(task.due_date);
    const daysUntilDue = differenceInDays(dueDate, new Date());
    
    if (isPast(dueDate) && !isToday(dueDate)) {
      return <Badge variant="destructive" className="text-[10px]">Vencido</Badge>;
    }
    if (isToday(dueDate)) {
      return <Badge variant="destructive" className="text-[10px]">Hoje</Badge>;
    }
    if (daysUntilDue <= 7) {
      return <Badge className="bg-warning text-warning-foreground text-[10px]">{daysUntilDue} dias</Badge>;
    }
    if (daysUntilDue <= 30) {
      return <Badge variant="secondary" className="text-[10px]">{daysUntilDue} dias</Badge>;
    }
    return null;
  };

  const TaskCard = ({ task }: { task: Task }) => (
    <Card 
      className={cn(
        'border-0 shadow-sm cursor-pointer transition-all hover:shadow-md',
        task.status === 'completed' && 'opacity-60'
      )}
      onClick={() => handleTaskClick(task)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            'rounded-lg p-2 mt-0.5',
            task.priority === 'high' ? 'bg-destructive/10' : 
            task.priority === 'medium' ? 'bg-warning/10' : 'bg-muted'
          )}>
            <FileText className={cn(
              'h-4 w-4',
              task.priority === 'high' ? 'text-destructive' : 
              task.priority === 'medium' ? 'text-warning' : 'text-muted-foreground'
            )} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className={cn(
                'font-medium text-sm truncate',
                task.status === 'completed' && 'line-through'
              )}>
                {task.title}
              </p>
              {getUrgencyBadge(task)}
            </div>
            
            {task.establishment && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Building className="h-3 w-3" />
                <span className="truncate">
                  {task.establishment.nome_fantasia || task.establishment.razao_social}
                </span>
              </div>
            )}
            
            {task.document && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {documentTypeLabels[task.document.document_type]} 
                {task.document.document_number && ` #${task.document.document_number}`}
              </p>
            )}
            
            {task.due_date && (
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Prazo: {format(new Date(task.due_date), "dd 'de' MMMM", { locale: ptBR })}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {task.status !== 'completed' && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={(e) => handleCompleteTask(task.id, e)}
              >
                <CheckCircle2 className="h-5 w-5 text-success" />
              </Button>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const EmptyState = ({ type }: { type: 'pending' | 'urgent' | 'completed' }) => {
    const messages = {
      pending: {
        title: 'Nenhuma tarefa pendente',
        description: 'Documentos enviados com prazo aparecerão aqui',
        icon: Clock
      },
      urgent: {
        title: 'Nenhuma tarefa urgente',
        description: 'Tarefas próximas do vencimento aparecerão aqui',
        icon: AlertTriangle
      },
      completed: {
        title: 'Nenhuma tarefa concluída',
        description: 'Tarefas finalizadas serão arquivadas aqui',
        icon: CheckCircle2
      }
    };

    const Icon = messages[type].icon;

    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Icon className="mb-3 h-12 w-12 text-muted-foreground/40" />
          <h3 className="font-medium text-muted-foreground">{messages[type].title}</h3>
          <p className="mt-1 text-sm text-muted-foreground/70">{messages[type].description}</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <Header 
        title="Pasta de Tarefas" 
        subtitle={`${pendingTasks.length} pendentes · ${urgentTasks.length} urgentes`} 
      />
      
      <div className="p-4">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              Pendentes
              {pendingTasks.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                  {pendingTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="urgent" className="text-xs gap-1">
              <AlertTriangle className="h-3 w-3" />
              Urgentes
              {urgentTasks.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 justify-center">
                  {urgentTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Concluídas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-3">
            {loading ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Carregando...
                </CardContent>
              </Card>
            ) : pendingTasks.length > 0 ? (
              pendingTasks.map(task => <TaskCard key={task.id} task={task} />)
            ) : (
              <EmptyState type="pending" />
            )}
          </TabsContent>
          
          <TabsContent value="urgent" className="space-y-3">
            {urgentTasks.length > 0 ? (
              urgentTasks.map(task => <TaskCard key={task.id} task={task} />)
            ) : (
              <EmptyState type="urgent" />
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="space-y-3">
            {completedTasks.length > 0 ? (
              completedTasks.map(task => <TaskCard key={task.id} task={task} />)
            ) : (
              <EmptyState type="completed" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FolderOpen, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function Tasks() {
  return (
    <AppLayout>
      <Header title="Pasta de Tarefas" subtitle="Documentos pendentes" />
      
      <div className="p-4">
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="pending" className="text-xs">
              <Clock className="mr-1 h-3 w-3" />
              Pendentes
            </TabsTrigger>
            <TabsTrigger value="urgent" className="text-xs">
              <AlertTriangle className="mr-1 h-3 w-3" />
              Urgentes
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-xs">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Concluídas
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <EmptyState />
          </TabsContent>
          
          <TabsContent value="urgent">
            <EmptyState type="urgent" />
          </TabsContent>
          
          <TabsContent value="completed">
            <EmptyState type="completed" />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function EmptyState({ type = 'pending' }: { type?: 'pending' | 'urgent' | 'completed' }) {
  const messages = {
    pending: {
      title: 'Nenhuma tarefa pendente',
      description: 'Suas tarefas com prazo aparecerão aqui',
    },
    urgent: {
      title: 'Nenhuma tarefa urgente',
      description: 'Tarefas próximas do vencimento aparecerão aqui',
    },
    completed: {
      title: 'Nenhuma tarefa concluída',
      description: 'Tarefas finalizadas serão arquivadas aqui',
    },
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <FolderOpen className="mb-3 h-12 w-12 text-muted-foreground/40" />
        <h3 className="font-medium text-muted-foreground">{messages[type].title}</h3>
        <p className="mt-1 text-sm text-muted-foreground/70">{messages[type].description}</p>
      </CardContent>
    </Card>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, 
  Send, 
  Clock, 
  ChevronRight, 
  Plus,
  Calendar,
  Target,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface MonthlyReportItem {
  id: string;
  month: number;
  year: number;
  status: string;
  is_locked: boolean | null;
  created_at: string;
  sent_at: string | null;
  os_number: string | null;
  total_fiscalizations: number | null;
  days_to_work: number | null;
}

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'muted'; icon: React.ReactNode }> = {
  draft: { 
    label: 'Rascunho', 
    variant: 'warning',
    icon: <Clock className="h-3 w-3" />
  },
  sent: { 
    label: 'Enviado', 
    variant: 'success',
    icon: <Send className="h-3 w-3" />
  },
  archived: { 
    label: 'Arquivado', 
    variant: 'muted',
    icon: <CheckCircle2 className="h-3 w-3" />
  },
};

export default function MonthlyReports() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reports, setReports] = useState<MonthlyReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadReports();
    }
  }, [user]);

  const loadReports = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('monthly_reports')
      .select(`
        id,
        month,
        year,
        status,
        is_locked,
        created_at,
        sent_at,
        os_number,
        total_fiscalizations,
        days_to_work
      `)
      .eq('user_id', user?.id)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) {
      console.error('Error loading reports:', error);
    } else {
      setReports(data || []);
    }
    
    setLoading(false);
  };

  const handleOpenReport = (report: MonthlyReportItem) => {
    navigate(`/relatorio-mensal?month=${report.month}&year=${report.year}`);
  };

  const handleCreateNew = () => {
    navigate('/relatorio-mensal');
  };

  const getStatusCounts = () => {
    return {
      total: reports.length,
      draft: reports.filter(r => r.status === 'draft').length,
      sent: reports.filter(r => r.status === 'sent').length,
    };
  };

  const counts = getStatusCounts();

  return (
    <AppLayout>
      <Header 
        title="Relatórios Mensais" 
        showBack 
        rightAction={
          <Button size="sm" onClick={handleCreateNew} className="gap-1.5 rounded-xl">
            <Plus className="h-4 w-4" />
            Novo
          </Button>
        }
      />
      
      <div className="p-5 space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-display text-foreground">{counts.total}</div>
              <div className="text-micro text-muted-foreground uppercase tracking-wider">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-display text-warning">{counts.draft}</div>
              <div className="text-micro text-muted-foreground uppercase tracking-wider">Rascunhos</div>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-4 text-center">
              <div className="text-display text-success">{counts.sent}</div>
              <div className="text-micro text-muted-foreground uppercase tracking-wider">Enviados</div>
            </CardContent>
          </Card>
        </div>

        {/* Reports List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-body text-muted-foreground mb-5">
                Nenhum relatório mensal encontrado
              </p>
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Criar Relatório
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <Card 
                key={report.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-premium active:scale-[0.99]"
                onClick={() => handleOpenReport(report)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 rounded-xl bg-primary/10">
                          <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-body font-semibold">
                          {months[report.month - 1]} {report.year}
                        </span>
                        {report.is_locked && (
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      
                      {report.os_number && (
                        <p className="text-caption text-muted-foreground mb-2 ml-10">
                          OS: {report.os_number}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-4 text-micro text-muted-foreground ml-10">
                        {report.total_fiscalizations !== null && (
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {report.total_fiscalizations} fiscalizações
                          </span>
                        )}
                        {report.sent_at && (
                          <span className="flex items-center gap-1 text-success">
                            <Send className="h-3 w-3" />
                            Enviado: {format(new Date(report.sent_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                        {!report.sent_at && (
                          <span>
                            Criado: {format(new Date(report.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={statusConfig[report.status]?.variant || 'muted'} className="gap-1">
                        {statusConfig[report.status]?.icon}
                        {statusConfig[report.status]?.label || report.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

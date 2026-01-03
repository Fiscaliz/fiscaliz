import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  ClipboardList, 
  BarChart3, 
  Bell,
  Plus,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import fiscalizLogo from '@/assets/fiscaliz-logo.png';

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Get first name from email or full_name
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] 
    || user?.email?.split('@')[0] 
    || 'Fiscal';

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
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}

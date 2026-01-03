import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  FileText, 
  TrendingUp, 
  MapPin,
  Calendar
} from 'lucide-react';

export default function Dashboard() {
  return (
    <AppLayout>
      <Header title="Dashboard" subtitle="Métricas e estatísticas" />
      
      <div className="p-4">
        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="individual">Meu Dashboard</TabsTrigger>
            <TabsTrigger value="division">Divisão</TabsTrigger>
          </TabsList>
          
          <TabsContent value="individual" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard 
                icon={FileText}
                label="Fiscalizações"
                value="0"
                subtitle="este mês"
                color="bg-primary"
              />
              <StatCard 
                icon={Calendar}
                label="Pendentes"
                value="0"
                subtitle="com prazo"
                color="bg-warning"
              />
            </div>
            
            {/* Charts placeholder */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
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
          </TabsContent>
          
          <TabsContent value="division" className="space-y-4">
            {/* Division Stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard 
                icon={FileText}
                label="Total Divisão"
                value="0"
                subtitle="fiscalizações"
                color="bg-secondary"
              />
              <StatCard 
                icon={MapPin}
                label="Regiões"
                value="0"
                subtitle="fiscalizadas"
                color="bg-info"
              />
            </div>
            
            {/* Map placeholder */}
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

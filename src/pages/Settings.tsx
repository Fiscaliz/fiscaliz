import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Smartphone, Shield } from 'lucide-react';

export default function Settings() {
  return (
    <AppLayout>
      <Header title="Configurações" showBack />
      
      <div className="p-5 space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-body flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-tasks" className="flex-1 text-body">Alertas de tarefas</Label>
              <Switch id="notify-tasks" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-deadlines" className="flex-1 text-body">Lembrete de prazos</Label>
              <Switch id="notify-deadlines" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-body flex items-center gap-3">
              <div className="p-2 rounded-xl bg-info/10">
                <Smartphone className="h-5 w-5 text-info" />
              </div>
              Aplicativo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="offline-mode" className="flex-1 text-body">Modo offline</Label>
              <Switch id="offline-mode" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-sync" className="flex-1 text-body">Sincronização automática</Label>
              <Switch id="auto-sync" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-body flex items-center gap-3">
              <div className="p-2 rounded-xl bg-secondary/10">
                <Shield className="h-5 w-5 text-secondary" />
              </div>
              Privacidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="biometric" className="flex-1 text-body">Autenticação biométrica</Label>
              <Switch id="biometric" />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

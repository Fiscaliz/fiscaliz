import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, Moon, Smartphone, Shield } from 'lucide-react';

export default function Settings() {
  return (
    <AppLayout>
      <Header title="Configurações" showBack />
      
      <div className="p-4 space-y-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-tasks" className="flex-1">Alertas de tarefas</Label>
              <Switch id="notify-tasks" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notify-deadlines" className="flex-1">Lembrete de prazos</Label>
              <Switch id="notify-deadlines" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              Aplicativo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="offline-mode" className="flex-1">Modo offline</Label>
              <Switch id="offline-mode" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-sync" className="flex-1">Sincronização automática</Label>
              <Switch id="auto-sync" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Privacidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="biometric" className="flex-1">Autenticação biométrica</Label>
              <Switch id="biometric" />
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User, 
  LogOut, 
  Settings, 
  FileText, 
  HelpCircle,
  ChevronRight,
  Shield,
  Calendar,
  Users,
  ClipboardList
} from 'lucide-react';
import { Link } from 'react-router-dom';
import fiscalizLogo from '@/assets/logo-fiscaliz.png';

export default function Profile() {
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  useEffect(() => {
    if (user) {
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle()
        .then(({ data }) => setIsAdmin(!!data));
    }
  }, [user]);

  const menuItems = [
    { icon: User, label: 'Editar Perfil', href: '/perfil/editar', color: 'bg-primary/10 text-primary' },
    { icon: FileText, label: 'Meus Documentos', href: '/documentos', color: 'bg-info/10 text-info' },
    { icon: ClipboardList, label: 'Meus Checklists', href: '/checklists', color: 'bg-accent/50 text-accent-foreground' },
    { icon: Calendar, label: 'Relatório Mensal', href: '/relatorio-mensal', color: 'bg-success/10 text-success' },
    ...(isAdmin ? [{ icon: Users, label: 'Gestão de Usuários', href: '/admin/usuarios', color: 'bg-destructive/10 text-destructive' }] : []),
    { icon: Settings, label: 'Configurações', href: '/configuracoes', color: 'bg-muted text-muted-foreground' },
    { icon: HelpCircle, label: 'Ajuda', href: '/ajuda', color: 'bg-warning/10 text-warning' },
  ];

  return (
    <AppLayout>
      <Header title="Perfil" />
      
      <div className="p-5 space-y-6">
        {/* Profile Card with Logo */}
        <Card className="overflow-hidden">
          <div className="fiscaliz-gradient px-5 py-8">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-2xl bg-primary-foreground/10 p-2 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <img src={fiscalizLogo} alt="Fiscaliz" className="h-full w-full object-contain" />
              </div>
              <div className="text-primary-foreground">
                <h2 className="text-h2 font-bold">{fullName}</h2>
                <p className="text-body text-primary-foreground/85">Matrícula: {user?.user_metadata?.registration_number || 'Não informada'}</p>
                <div className="mt-2 flex items-center gap-1.5 text-caption text-primary-foreground/70">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Auditor Fiscal de Saúde Pública</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Menu Items */}
        <Card>
          <CardContent className="p-0">
            {menuItems.map((item, index) => (
              <Link
                key={item.label}
                to={item.href}
                className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-all duration-200"
                style={{ borderBottom: index < menuItems.length - 1 ? '1px solid hsl(var(--border) / 0.5)' : 'none' }}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2.5 rounded-xl ${item.color}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-body font-medium">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Sign Out Button */}
        <Button 
          variant="outline" 
          className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Sair da Conta
        </Button>

        {/* App Info */}
        <div className="mt-10 text-center pb-4">
          <img src={fiscalizLogo} alt="Fiscaliz" className="mx-auto mb-3 h-12 w-12 opacity-40" />
          <p className="text-caption text-muted-foreground">Fiscaliz v1.0.0</p>
          <p className="text-micro text-muted-foreground/70 uppercase tracking-wider mt-1">© 2026 Prefeitura de Goiânia</p>
        </div>
      </div>
    </AppLayout>
  );
}

import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  User, 
  LogOut, 
  Settings, 
  FileText, 
  HelpCircle,
  ChevronRight,
  Shield
} from 'lucide-react';
import fiscalizLogo from '@/assets/fiscaliz-logo.png';

export default function Profile() {
  const { user, signOut } = useAuth();
  
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const menuItems = [
    { icon: User, label: 'Editar Perfil', href: '/perfil/editar' },
    { icon: FileText, label: 'Meus Documentos', href: '/documentos' },
    { icon: Settings, label: 'Configurações', href: '/configuracoes' },
    { icon: HelpCircle, label: 'Ajuda', href: '/ajuda' },
  ];

  return (
    <AppLayout>
      <Header title="Perfil" />
      
      <div className="p-4">
        {/* Profile Card */}
        <Card className="mb-6 border-0 shadow-sm overflow-hidden">
          <div className="fiscaliz-gradient px-4 py-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary-foreground/20">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-primary-foreground/10 text-primary-foreground text-lg font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-primary-foreground">
                <h2 className="text-lg font-bold">{fullName}</h2>
                <p className="text-sm text-primary-foreground/80">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-primary-foreground/70">
                  <Shield className="h-3 w-3" />
                  <span>Fiscal Sanitário</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Menu Items */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="p-0">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                className="flex w-full items-center justify-between px-4 py-4 text-left hover:bg-muted/50 transition-colors"
                style={{ borderBottom: index < menuItems.length - 1 ? '1px solid hsl(var(--border))' : 'none' }}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Sign Out Button */}
        <Button 
          variant="outline" 
          className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10"
          onClick={signOut}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Sair da Conta
        </Button>

        {/* App Info */}
        <div className="mt-8 text-center">
          <img src={fiscalizLogo} alt="Fiscaliz" className="mx-auto mb-2 h-10 w-10 opacity-50" />
          <p className="text-xs text-muted-foreground">Fiscaliz v1.0.0</p>
          <p className="text-xs text-muted-foreground">© 2026 Prefeitura de Goiânia</p>
        </div>
      </div>
    </AppLayout>
  );
}

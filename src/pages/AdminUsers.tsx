import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Search,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Building,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  user_type: string | null;
  institutional_link: string | null;
  institution_name: string | null;
  areas_of_practice: string[] | null;
  registration_number: string | null;
  division: string | null;
  is_active: boolean;
  created_at: string;
  role?: string;
}

const userTypeLabels: Record<string, string> = {
  auditor_fiscal: 'Auditor Fiscal / Servidor',
  consultor_privado: 'Consultor Privado',
};

const institutionalLinkLabels: Record<string, string> = {
  municipio: 'Município',
  estado: 'Estado',
  empresa_privada: 'Empresa Privada / Consultoria',
};

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  fiscal: 'Fiscal',
};

const roleBadgeColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  gestor: 'bg-amber-100 text-amber-800 border-amber-200',
  fiscal: 'bg-blue-100 text-blue-800 border-blue-200',
};

export default function AdminUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    userId: string;
    action: 'remove';
    userName: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      checkAdminAndLoad();
    }
  }, [user]);

  const checkAdminAndLoad = async () => {
    if (!user) return;

    // Check if current user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(true);
    await loadUsers();
  };

  const loadUsers = async () => {
    setLoading(true);

    // Fetch all profiles (admin RLS policy allows this)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      console.error('Error loading profiles:', profilesError);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os usuários.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Fetch all user roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role');

    // Merge roles into profiles
    const rolesMap = new Map<string, string>();
    roles?.forEach((r) => rolesMap.set(r.user_id, r.role));

    const mergedUsers: UserProfile[] = (profiles || []).map((p) => ({
      id: p.id,
      full_name: p.full_name,
      email: p.email,
      phone: p.phone,
      user_type: p.user_type,
      institutional_link: p.institutional_link,
      institution_name: p.institution_name,
      areas_of_practice: p.areas_of_practice,
      registration_number: p.registration_number,
      division: p.division,
      is_active: (p as any).is_active ?? true,
      created_at: p.created_at,
      role: rolesMap.get(p.id) || 'fiscal',
    }));

    setUsers(mergedUsers);
    setLoading(false);
  };

  const handleRemoveUser = async (userId: string) => {
    // Delete user roles first, then profile
    const { error: rolesError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (rolesError) {
      toast({
        title: 'Erro',
        description: 'Não foi possível remover os papéis do usuário.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Usuário removido',
      description: 'O usuário foi removido do sistema com sucesso.',
    });

    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setConfirmAction(null);
  };

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.institution_name?.toLowerCase().includes(q) ||
      u.registration_number?.toLowerCase().includes(q)
    );
  });

  const activeCount = users.filter((u) => u.is_active).length;
  const inactiveCount = users.filter((u) => !u.is_active).length;

  if (loading) {
    return (
      <AppLayout>
        <Header title="Gestão de Usuários" showBack />
        <div className="p-5 space-y-4">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AppLayout>
        <Header title="Acesso Negado" showBack />
        <div className="p-5 text-center space-y-4">
          <Shield className="h-16 w-16 mx-auto text-destructive/50" />
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header title="Gestão de Usuários" showBack />

      <div className="p-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-primary/20">
            <CardContent className="p-3 text-center">
              <Users className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="p-3 text-center">
              <UserCheck className="h-5 w-5 mx-auto text-green-600 mb-1" />
              <p className="text-2xl font-bold text-foreground">{activeCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ativos</p>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="p-3 text-center">
              <UserX className="h-5 w-5 mx-auto text-red-500 mb-1" />
              <p className="text-2xl font-bold text-foreground">{inactiveCount}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bloqueados</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou matrícula..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* User List */}
        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum usuário encontrado.
            </p>
          ) : (
            filteredUsers.map((u) => {
              const isExpanded = expandedUser === u.id;
              const isCurrentUser = u.id === user?.id;

              return (
                <Card
                  key={u.id}
                  className={cn(
                    'transition-all',
                    !u.is_active && 'opacity-60 border-destructive/30'
                  )}
                >
                  <CardContent className="p-4">
                    {/* Header row */}
                    <div
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => setExpandedUser(isExpanded ? null : u.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm truncate">
                            {u.full_name}
                          </p>
                          {isCurrentUser && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0">
                              Você
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] px-1.5 py-0',
                              roleBadgeColors[u.role || 'fiscal']
                            )}
                          >
                            <Shield className="h-2.5 w-2.5 mr-0.5" />
                            {roleLabels[u.role || 'fiscal']}
                          </Badge>
                          {u.user_type && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              {userTypeLabels[u.user_type] || u.user_type}
                            </Badge>
                          )}
                          {!u.is_active && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              Bloqueado
                            </Badge>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 pt-3 border-t space-y-3">
                        {u.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{u.email}</span>
                          </div>
                        )}
                        {u.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{u.phone}</span>
                          </div>
                        )}
                        {u.institutional_link && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {institutionalLinkLabels[u.institutional_link] || u.institutional_link}
                            </span>
                          </div>
                        )}
                        {u.institution_name && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">{u.institution_name}</span>
                          </div>
                        )}
                        {u.registration_number && (
                          <div className="flex items-center gap-2 text-sm">
                            <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              Matrícula: {u.registration_number}
                            </span>
                          </div>
                        )}
                        {u.areas_of_practice && u.areas_of_practice.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {u.areas_of_practice.map((area) => (
                              <Badge key={area} variant="outline" className="text-[10px]">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <p className="text-[10px] text-muted-foreground">
                          Cadastrado em{' '}
                          {new Date(u.created_at).toLocaleDateString('pt-BR')}
                        </p>

                        {/* Actions */}
                        {!isCurrentUser && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1 gap-1"
                              onClick={() =>
                                setConfirmAction({
                                  userId: u.id,
                                  action: 'remove',
                                  userName: u.full_name,
                                })
                              }
                            >
                              <UserX className="h-3.5 w-3.5" />
                              Remover
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              O usuário "{confirmAction?.userName}" será removido permanentemente do sistema. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                confirmAction && handleRemoveUser(confirmAction.userId)
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

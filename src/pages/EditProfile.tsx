import { useEffect, useMemo, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function EditProfile() {
  const { user } = useAuth();
  const { toast } = useToast();

  const defaultFullName = useMemo(
    () => (user?.user_metadata as any)?.full_name || user?.email?.split('@')[0] || '',
    [user]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState(defaultFullName);
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [division, setDivision] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, registration_number, division, phone')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
      }

      if (data) {
        setFullName(data.full_name || defaultFullName);
        setRegistrationNumber(data.registration_number || '');
        setDivision(data.division || '');
        setPhone(data.phone || '');
      }

      setLoading(false);
    };

    load();
  }, [user, defaultFullName]);

  const handleSave = async () => {
    if (!user) return;

    if (!fullName.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Informe seu nome para constar na assinatura dos documentos.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // 1) Atualiza perfil (usado para assinatura nos PDFs)
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName.trim(),
          registration_number: registrationNumber.trim() || null,
          division: division.trim() || null,
          phone: phone.trim() || null,
        });

      if (upsertError) throw upsertError;

      // 2) Atualiza metadata do usuário (usado como fallback rápido no app)
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName.trim(),
          registration_number: registrationNumber.trim() || undefined,
          division: division.trim() || undefined,
        },
      });

      if (authError) {
        // Não bloqueia se o metadata falhar; o PDF já usa profiles.
        console.warn('Could not update user metadata:', authError);
      }

      toast({
        title: 'Perfil atualizado',
        description: 'Sua assinatura passará a constar corretamente nos documentos.',
      });
    } catch (e: any) {
      toast({
        title: 'Erro ao salvar',
        description: e?.message || 'Não foi possível salvar o perfil.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <Header title="Editar Perfil" showBack />
      <div className="p-4">
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Dados para assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nome completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex.: Fulano de Tal"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="registration">Matrícula</Label>
                <Input
                  id="registration"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="Ex.: 123456"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(62) 9...."
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="division">Coordenação / Lotação</Label>
              <Input
                id="division"
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                placeholder="Ex.: Coordenação de Fiscalização de Alimentos"
                disabled={loading}
              />
            </div>

            <Button className="w-full" onClick={handleSave} disabled={loading || saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

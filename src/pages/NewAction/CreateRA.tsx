import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { FiscalizWatermark } from '@/components/layout/FiscalizWatermark';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Save, FileText, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function CreateRA() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const motivo = searchParams.get('motivo') || 'demanda_interna';
  const atividadeId = searchParams.get('atividade') || '';
  const atividadeDescricao = decodeURIComponent(searchParams.get('atividade_descricao') || '');

  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    documentDate: new Date().toISOString().split('T')[0],
    documentTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    duration: '',
    description: '',
    observations: '',
  });
  const [profile, setProfile] = useState<{ full_name: string; registration_number: string | null } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, registration_number')
        .eq('id', user.id)
        .maybeSingle();
      if (data) setProfile(data);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) {
      toast({ title: 'Erro', description: 'Usuário não autenticado', variant: 'destructive' });
      return;
    }

    if (!formData.description.trim()) {
      toast({ title: 'Atenção', description: 'Preencha a descrição da atividade', variant: 'destructive' });
      return;
    }

    setSaving(true);

    try {
      // Criar fiscal_action para RA
      const { data: action, error: actionError } = await supabase
        .from('fiscal_actions')
        .insert({
          user_id: user.id,
          establishment_id: null, // RA não tem estabelecimento
          reason: 'demanda_interna' as any,
          reason_details: `${atividadeId} - ${atividadeDescricao}`,
        })
        .select()
        .single();

      if (actionError) throw actionError;

      // Montar conteúdo do RA
      const contentObj = {
        atividade_id: atividadeId,
        atividade_descricao: atividadeDescricao,
        document_date: formData.documentDate,
        document_time: formData.documentTime,
        duration: formData.duration,
        description: formData.description,
        observations: formData.observations,
        auditor: profile?.full_name || '',
        matricula: profile?.registration_number || '',
      };

      // Criar documento RA
      const { data: newDoc, error: docError } = await supabase
        .from('fiscal_documents')
        .insert({
          user_id: user.id,
          fiscal_action_id: action.id,
          document_type: 'relatorio_atividade' as any,
          content: contentObj,
          title: `RA - ${atividadeId}: ${atividadeDescricao}`,
          priority: 'low',
        })
        .select()
        .single();

      if (docError) throw docError;

      toast({
        title: 'RA salvo!',
        description: 'Relatório de Atividade criado com sucesso.',
      });

      navigate(`/documento/${newDoc.id}`);
    } catch (error: any) {
      console.error('Error saving RA:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <Header title="Relatório de Atividade" showBack />
      <FiscalizWatermark />

      <div className="p-4 pb-32">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate(`/nova-acao/atividade-interna?motivo=${motivo}`)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>

        {/* Atividade selecionada */}
        <Card className="mb-4 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-bold text-primary bg-primary/20 px-2 py-1 rounded">
                {atividadeId}
              </span>
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-medium">{atividadeDescricao}</p>
          </CardContent>
        </Card>

        {/* Auditor */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Auditor Fiscal</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm font-medium">{profile?.full_name || 'Carregando...'}</p>
            {profile?.registration_number && (
              <p className="text-xs text-muted-foreground">Matrícula: {profile.registration_number}</p>
            )}
          </CardContent>
        </Card>

        {/* Data e Hora */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4" />
                  Data
                </Label>
                <Input
                  type="date"
                  value={formData.documentDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  Horário
                </Label>
                <Input
                  type="time"
                  value={formData.documentTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentTime: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Duração */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label className="text-sm">Duração (horas)</Label>
              <Input
                type="text"
                placeholder="Ex: 2h, 4h30min"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Descrição */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label className="text-sm">Descrição da Atividade *</Label>
              <Textarea
                placeholder="Descreva detalhadamente a atividade realizada..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label className="text-sm">Observações</Label>
              <Textarea
                placeholder="Observações adicionais (opcional)"
                value={formData.observations}
                onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botão Salvar */}
        <Button
          className="w-full"
          size="lg"
          onClick={handleSave}
          disabled={saving}
        >
          <Save className="h-5 w-5 mr-2" />
          {saving ? 'Salvando...' : 'Salvar RA'}
        </Button>
      </div>
    </AppLayout>
  );
}

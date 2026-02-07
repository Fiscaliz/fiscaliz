import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { FiscalizWatermark } from '@/components/layout/FiscalizWatermark';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, FileText, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { MobilePhotoUpload, UploadedPhoto } from '@/components/documents/MobilePhotoUpload';

export default function CreateRA() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const motivo = searchParams.get('motivo') || 'demanda_interna';
  const atividadeId = searchParams.get('atividade') || '';
  const atividadeDescricao = decodeURIComponent(searchParams.get('atividade_descricao') || '');

  const [saving, setSaving] = useState(false);
  const [observations, setObservations] = useState('');
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
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

  const uploadPhotos = async (docId: string): Promise<string[]> => {
    if (!user || photos.length === 0) return [];
    
    const uploadedUrls: string[] = [];
    
    for (const photo of photos) {
      try {
        const fileExt = photo.file.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/${docId}_ra_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('fiscal-photos')
          .upload(fileName, photo.file, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data: signedData } = await supabase.storage
          .from('fiscal-photos')
          .createSignedUrl(fileName, 3600);
        
        if (signedData?.signedUrl) {
          uploadedUrls.push(signedData.signedUrl);
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
      }
    }
    
    return uploadedUrls;
  };

  const handleSave = async () => {
    if (!user) {
      toast({ title: 'Erro', description: 'Usuário não autenticado', variant: 'destructive' });
      return;
    }

    setSaving(true);

    try {
      // Garantir sessão ativa antes de operações de banco
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

      // Criar fiscal_action para RA
      const { data: action, error: actionError } = await supabase
        .from('fiscal_actions')
        .insert({
          user_id: currentUser.id,
          establishment_id: null,
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
        observations: observations,
        auditor: profile?.full_name || '',
        matricula: profile?.registration_number || '',
      };

      // Criar documento RA
      const { data: newDoc, error: docError } = await supabase
        .from('fiscal_documents')
        .insert({
          user_id: currentUser.id,
          fiscal_action_id: action.id,
          document_type: 'relatorio_atividade' as any,
          content: contentObj,
          title: `RA - ${atividadeId}: ${atividadeDescricao}`,
          priority: 'low',
        })
        .select()
        .single();

      if (docError) throw docError;

      // Upload das fotos e atualizar documento
      const photoUrls = await uploadPhotos(newDoc.id);
      if (photoUrls.length > 0) {
        await supabase
          .from('fiscal_documents')
          .update({ attachments: photoUrls })
          .eq('id', newDoc.id);
      }

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
              {atividadeId !== 'O20' && atividadeId !== 'PFE' && (
                <span className="text-sm font-bold text-primary bg-primary/20 px-2 py-1 rounded">
                  {atividadeId}
                </span>
              )}
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

        {/* Observações */}
        <Card className="mb-4 border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="space-y-2">
              <Label className="text-sm">Observações</Label>
              <Textarea
                placeholder="Observações adicionais (opcional)"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Upload de Fotos/Documentos */}
        <div className="mb-4">
          <MobilePhotoUpload
            photos={photos}
            onChange={setPhotos}
            maxPhotos={10}
            required={false}
            label="Anexos"
            description="Certificados de cursos, listas de frequência, comprovantes, etc."
          />
        </div>

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

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { DocumentViewer } from '@/components/documents/DocumentViewer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const documentTypeLabels: Record<string, string> = {
  termo_intimacao: 'Termo de Intimação',
  visita_fiscal: 'Visita Fiscal',
  auto_infracao: 'Auto de Infração',
  advertencia: 'Advertência',
  inutilizacao: 'Inutilização',
  apreensao: 'Apreensão',
  interdicao: 'Interdição',
  relatorio_tecnico: 'Relatório Técnico',
  notificacao: 'Notificação',
  replica: 'Réplica',
  certidao: 'Certidão',
  coleta_amostra: 'Coleta de Amostra',
};

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      loadDocument();
    }
  }, [id, user]);

  const loadDocument = async () => {
    if (!id) return;
    
    setLoading(true);
    
    // First get the document with establishment
    const { data: docData, error: docError } = await supabase
      .from('fiscal_documents')
      .select(`
        *,
        establishment:establishments(*)
      `)
      .eq('id', id)
      .maybeSingle();

    if (docError || !docData) {
      console.error('Error loading document:', docError);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o documento',
        variant: 'destructive'
      });
      navigate(-1);
      return;
    }

    // Then get the profile separately
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, registration_number, division')
      .eq('id', docData.user_id)
      .maybeSingle();

    if (profileError) {
      console.error('Error loading profile:', profileError);
    }

    const fallbackProfile =
      user?.id === docData.user_id
        ? {
            full_name:
              (user.user_metadata as any)?.full_name ||
              user.email?.split('@')[0] ||
              'Autoridade Fiscal',
            registration_number: (user.user_metadata as any)?.registration_number,
            division: (user.user_metadata as any)?.division,
          }
        : null;

    // Se for o usuário logado, preferir o nome do metadata (evita “assinatura antiga”)
    const normalizedProfile =
      user?.id === docData.user_id
        ? {
            ...profileData,
            full_name:
              (user.user_metadata as any)?.full_name ||
              profileData?.full_name,
            registration_number:
              (user.user_metadata as any)?.registration_number ||
              profileData?.registration_number,
            division:
              (user.user_metadata as any)?.division || profileData?.division,
          }
        : profileData;

    // Format document for viewer
    const formattedDoc = {
      ...docData,
      establishment: Array.isArray(docData.establishment) ? docData.establishment[0] : docData.establishment,
      profile: normalizedProfile || fallbackProfile
    };
    
    setDocument(formattedDoc);
    setLoading(false);
  };

  const handleSave = async (updateData: any) => {
    if (!id || !user) return;

    const { error } = await supabase
      .from('fiscal_documents')
      .update(updateData)
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Documento salvo',
      description: 'As alterações foram salvas com sucesso'
    });
    
    loadDocument();
  };

  const handleSend = async (sendData: { email?: string; whatsapp?: string }) => {
    if (!id || !user || !document) return;

    try {
      // Update document status to sent
      const { error: updateError } = await supabase
        .from('fiscal_documents')
        .update({
          status: 'sent',
          is_locked: true,
          sent_at: new Date().toISOString(),
          sent_to: sendData.email || sendData.whatsapp
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Create task for follow-up if it's a termo_intimacao
      if (document.document_type === 'termo_intimacao' && document.deadline_date) {
        const { error: taskError } = await supabase
          .from('tasks')
          .insert({
            user_id: user.id,
            document_id: id,
            establishment_id: document.establishment_id,
            title: `Retorno: ${document.establishment?.nome_fantasia || document.establishment?.razao_social || 'Estabelecimento'}`,
            description: `Verificar cumprimento do Termo de Intimação`,
            priority: 'high',
            due_date: document.deadline_date,
            status: 'pending'
          });

        if (taskError) {
          console.error('Error creating task:', taskError);
        }
      }

      toast({
        title: 'Documento enviado!',
        description: `Enviado para ${sendData.email || sendData.whatsapp}. Uma tarefa foi criada para acompanhamento.`
      });

      loadDocument();
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleGeneratePDF = () => {
    // For now, open print dialog which can save as PDF
    toast({
      title: 'Gerando PDF...',
      description: 'Use Ctrl+P ou Cmd+P para salvar como PDF'
    });
    window.print();
  };

  if (loading) {
    return (
      <AppLayout>
        <Header title="Carregando..." showBack />
        <div className="p-4 space-y-4">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!document) {
    return (
      <AppLayout>
        <Header title="Documento não encontrado" showBack />
        <div className="p-4 text-center text-muted-foreground">
          O documento solicitado não foi encontrado.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Header 
        title={documentTypeLabels[document.document_type] || 'Documento'} 
        subtitle={document.establishment?.nome_fantasia || document.establishment?.razao_social}
        showBack 
      />
      
      <div className="p-4">
        <DocumentViewer
          document={document}
          onSave={handleSave}
          onSend={handleSend}
          onGeneratePDF={handleGeneratePDF}
          editable={!document.is_locked}
        />
      </div>
    </AppLayout>
  );
}

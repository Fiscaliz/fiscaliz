import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FileText, Send, Clock, Archive, ChevronRight } from 'lucide-react';

type DocumentStatus = 'all' | 'draft' | 'sent' | 'archived';

interface DocumentItem {
  id: string;
  document_type: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  deadline_date: string | null;
  establishment: {
    nome_fantasia: string | null;
    razao_social: string;
  } | null;
}

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

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'muted' | 'success' | 'warning'; icon: React.ReactNode }> = {
  draft: { 
    label: 'Rascunho', 
    variant: 'warning',
    icon: <Clock className="h-3 w-3" />
  },
  sent: { 
    label: 'Enviado', 
    variant: 'success',
    icon: <Send className="h-3 w-3" />
  },
  archived: { 
    label: 'Concluído', 
    variant: 'muted',
    icon: <Archive className="h-3 w-3" />
  },
};

export default function Documents() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<DocumentStatus>('all');

  useEffect(() => {
    if (user) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('fiscal_documents')
      .select(`
        id,
        document_type,
        status,
        created_at,
        sent_at,
        deadline_date,
        establishment:establishments(nome_fantasia, razao_social)
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading documents:', error);
    } else {
      const formattedData = (data || []).map(doc => ({
        ...doc,
        establishment: Array.isArray(doc.establishment) ? doc.establishment[0] : doc.establishment
      }));
      setDocuments(formattedData);
    }
    
    setLoading(false);
  };

  const filteredDocuments = documents.filter(doc => {
    if (statusFilter === 'all') return true;
    return doc.status === statusFilter;
  });

  const getStatusCounts = () => {
    return {
      all: documents.length,
      draft: documents.filter(d => d.status === 'draft').length,
      sent: documents.filter(d => d.status === 'sent').length,
      archived: documents.filter(d => d.status === 'archived').length,
    };
  };

  const counts = getStatusCounts();

  return (
    <AppLayout>
      <Header title="Documentos" showBack />
      
      <div className="p-5 space-y-5">
        {/* Status Filter Tabs */}
        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as DocumentStatus)}>
          <TabsList className="w-full grid grid-cols-4 h-12 p-1 bg-muted/50">
            <TabsTrigger value="all" className="text-caption rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-premium-sm">
              Todos ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="draft" className="text-caption rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-premium-sm">
              Rascunho ({counts.draft})
            </TabsTrigger>
            <TabsTrigger value="sent" className="text-caption rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-premium-sm">
              Enviado ({counts.sent})
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-caption rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-premium-sm">
              Concluído ({counts.archived})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Documents List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-body text-muted-foreground">
                {statusFilter === 'all' 
                  ? 'Nenhum documento encontrado'
                  : `Nenhum documento com status "${statusConfig[statusFilter]?.label || statusFilter}"`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map((doc) => (
              <Card 
                key={doc.id}
                className="cursor-pointer transition-all duration-200 hover:shadow-premium active:scale-[0.99]"
                onClick={() => navigate(`/documento/${doc.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="p-2 rounded-xl bg-primary/10">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-body font-semibold truncate">
                          {documentTypeLabels[doc.document_type] || doc.document_type}
                        </span>
                      </div>
                      
                      <p className="text-caption text-muted-foreground truncate mb-3 ml-10">
                        {doc.establishment?.nome_fantasia || doc.establishment?.razao_social || 'Estabelecimento não informado'}
                      </p>
                      
                      <div className="flex items-center gap-4 text-micro text-muted-foreground ml-10">
                        <span>
                          Criado: {format(new Date(doc.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                        {doc.sent_at && (
                          <span className="text-success">
                            Enviado: {format(new Date(doc.sent_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                        {doc.deadline_date && (
                          <span className="text-warning">
                            Prazo: {format(new Date(doc.deadline_date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={statusConfig[doc.status]?.variant || 'muted'} className="gap-1">
                        {statusConfig[doc.status]?.icon}
                        {statusConfig[doc.status]?.label || doc.status}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

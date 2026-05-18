import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search as SearchIcon,
  Building2,
  MapPin,
  FileText,
  Calendar,
  ChevronRight,
  ArrowLeft,
  Phone,
  User,
} from 'lucide-react';

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

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
};

interface Establishment {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  endereco: string;
  bairro: string | null;
  cnae_principal: string | null;
  risk_level: 'I' | 'II' | 'III' | null;
  responsavel_nome: string | null;
  responsavel_telefone: string | null;
}

interface HistoryDoc {
  id: string;
  document_type: string;
  document_number: string | null;
  status: string;
  created_at: string;
  action_date: string | null;
}

export default function Search() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Establishment | null>(null);
  const [history, setHistory] = useState<HistoryDoc[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('establishments')
      .select('id, razao_social, nome_fantasia, cnpj, endereco, bairro, cnae_principal, risk_level, responsavel_nome, responsavel_telefone')
      .order('razao_social');
    setEstablishments(data || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return establishments;
    return establishments.filter((e) =>
      [
        e.razao_social,
        e.nome_fantasia,
        e.cnpj,
        e.endereco,
        e.bairro,
        e.cnae_principal,
        e.responsavel_nome,
        e.responsavel_telefone,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [search, establishments]);

  const openHistory = async (est: Establishment) => {
    setSelected(est);
    setLoadingHistory(true);
    const { data } = await supabase
      .from('fiscal_documents')
      .select('id, document_type, document_number, status, created_at, action_date')
      .eq('establishment_id', est.id)
      .order('action_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });
    setHistory(data || []);
    setLoadingHistory(false);
  };

  const getRiskColor = (level: string | null) => {
    switch (level) {
      case 'I': return 'bg-green-100 text-green-800';
      case 'II': return 'bg-yellow-100 text-yellow-800';
      case 'III': return 'bg-red-100 text-red-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    const [y, m, day] = d.split('T')[0].split('-');
    return `${day}/${m}/${y}`;
  };

  // Detail view
  if (selected) {
    return (
      <AppLayout>
        <div className="p-4 pb-24 max-w-md mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setSelected(null); setHistory([]); }}
            className="mb-3 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar à pesquisa
          </Button>

          <Card className="mb-4">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold text-base leading-tight">
                  {selected.nome_fantasia || selected.razao_social}
                </h2>
                {selected.risk_level && (
                  <Badge className={`text-xs ${getRiskColor(selected.risk_level)}`}>
                    Risco {selected.risk_level}
                  </Badge>
                )}
              </div>
              {selected.nome_fantasia && (
                <p className="text-xs text-muted-foreground">{selected.razao_social}</p>
              )}
              <p className="text-xs"><span className="font-semibold">CNPJ:</span> {selected.cnpj}</p>
              {selected.cnae_principal && (
                <p className="text-xs"><span className="font-semibold">CNAE:</span> {selected.cnae_principal}</p>
              )}
              <p className="text-xs flex items-start gap-1">
                <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{selected.endereco}{selected.bairro ? `, ${selected.bairro}` : ''}</span>
              </p>
              {selected.responsavel_nome && (
                <p className="text-xs flex items-center gap-1">
                  <User className="w-3 h-3" /> {selected.responsavel_nome}
                </p>
              )}
              {selected.responsavel_telefone && (
                <p className="text-xs flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {selected.responsavel_telefone}
                </p>
              )}
            </CardContent>
          </Card>

          <h3 className="text-sm font-bold mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Histórico ({history.length})
          </h3>

          {loadingHistory ? (
            <p className="text-center text-muted-foreground py-4 text-sm">Carregando...</p>
          ) : history.length === 0 ? (
            <Card>
              <CardContent className="p-4 text-center text-sm text-muted-foreground">
                Nenhum documento encontrado para este estabelecimento.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {history.map((doc) => (
                <Card
                  key={doc.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/documento/${doc.id}`)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">
                          {documentTypeLabels[doc.document_type] || doc.document_type}
                        </p>
                        {doc.document_number && (
                          <p className="text-xs text-muted-foreground font-mono">{doc.document_number}</p>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(doc.action_date || doc.created_at)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={`text-[10px] ${statusColors[doc.status] || ''}`}>
                          {doc.status}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
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

  // Search list view
  return (
    <AppLayout>
      <div className="p-4 pb-24 max-w-md mx-auto">
        <h1 className="text-xl font-bold text-foreground mb-1 flex items-center gap-2">
          <SearchIcon className="w-5 h-5 text-primary" />
          Pesquisar Estabelecimentos
        </h1>
        <p className="text-xs text-muted-foreground mb-4">
          Busque por nome, CNPJ, endereço, CNAE ou responsável.
        </p>

        <div className="relative mb-4 sticky top-0 z-10 bg-background pb-2">
          <SearchIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Digite qualquer informação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              {search ? 'Nenhum estabelecimento corresponde à busca.' : 'Nenhum estabelecimento cadastrado.'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{filtered.length} resultado(s)</p>
            {filtered.map((est) => (
              <Card
                key={est.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openHistory(est)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {est.nome_fantasia || est.razao_social}
                      </p>
                      {est.nome_fantasia && (
                        <p className="text-xs text-muted-foreground truncate">{est.razao_social}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">CNPJ: {est.cnpj}</p>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        {est.bairro || est.endereco}
                      </p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {est.cnae_principal && (
                          <Badge variant="outline" className="text-[10px]">{est.cnae_principal}</Badge>
                        )}
                        {est.risk_level && (
                          <Badge className={`text-[10px] ${getRiskColor(est.risk_level)}`}>
                            Risco {est.risk_level}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Building2, Edit2, MapPin, ChevronRight, X, Check } from 'lucide-react';
import { ALL_CNAES, getRiskByCNAE, RISK_LABELS, type CNAERiskEntry } from '@/data/cnaeRiskTable';

interface Establishment {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  endereco: string;
  bairro: string | null;
  cnae_principal: string | null;
  risk_level: 'I' | 'II' | 'III' | null;
}

export default function Establishments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cnaeSearch, setCnaeSearch] = useState('');
  const [selectedCnae, setSelectedCnae] = useState<CNAERiskEntry | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchEstablishments();
  }, [user]);

  const fetchEstablishments = async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('establishments')
      .select('id, razao_social, nome_fantasia, cnpj, endereco, bairro, cnae_principal, risk_level')
      .order('razao_social');

    if (!error && data) {
      setEstablishments(data);
    }
    setLoading(false);
  };

  const filtered = establishments.filter(e => {
    const q = search.toLowerCase();
    return !q || 
      e.razao_social.toLowerCase().includes(q) ||
      (e.nome_fantasia || '').toLowerCase().includes(q) ||
      e.cnpj.includes(q) ||
      (e.cnae_principal || '').includes(q);
  });

  const filteredCnaes = ALL_CNAES.filter(c => {
    const q = cnaeSearch.toLowerCase();
    return !q || c.cnae.includes(q) || c.description.toLowerCase().includes(q);
  });

  const openEdit = (est: Establishment) => {
    setEditingId(est.id);
    setCnaeSearch('');
    if (est.cnae_principal) {
      const found = getRiskByCNAE(est.cnae_principal);
      setSelectedCnae(found || null);
    } else {
      setSelectedCnae(null);
    }
  };

  const handleSave = async () => {
    if (!editingId || !selectedCnae) return;
    setSaving(true);

    const cnaeCode = selectedCnae.cnae.replace(/[^0-9]/g, '');
    const { error } = await supabase
      .from('establishments')
      .update({
        cnae_principal: cnaeCode,
        risk_level: selectedCnae.riskLevel,
      })
      .eq('id', editingId);

    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
    } else {
      toast.success('CNAE atualizado com sucesso!');
      setEstablishments(prev =>
        prev.map(e => e.id === editingId
          ? { ...e, cnae_principal: cnaeCode, risk_level: selectedCnae.riskLevel }
          : e
        )
      );
      setEditingId(null);
    }
    setSaving(false);
  };

  const getRiskColor = (level: string | null) => {
    switch (level) {
      case 'I': return 'bg-green-100 text-green-800';
      case 'II': return 'bg-yellow-100 text-yellow-800';
      case 'III': return 'bg-red-100 text-red-800';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const editingEst = establishments.find(e => e.id === editingId);

  return (
    <AppLayout>
      <div className="p-4 pb-24 max-w-md mx-auto">
        <h1 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          Estabelecimentos
        </h1>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, CNPJ ou CNAE..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum estabelecimento encontrado.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(est => (
              <Card key={est.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(est)}>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{est.nome_fantasia || est.razao_social}</p>
                      {est.nome_fantasia && (
                        <p className="text-xs text-muted-foreground truncate">{est.razao_social}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">CNPJ: {est.cnpj}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {est.cnae_principal ? (
                          <>
                            <Badge variant="outline" className="text-xs">{est.cnae_principal}</Badge>
                            <Badge className={`text-xs ${getRiskColor(est.risk_level)}`}>
                              {est.risk_level ? RISK_LABELS[est.risk_level] : '—'}
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="destructive" className="text-xs">Sem CNAE</Badge>
                        )}
                      </div>
                    </div>
                    <Edit2 className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!editingId} onOpenChange={open => !open && setEditingId(null)}>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle className="text-base">Editar CNAE</DialogTitle>
            </DialogHeader>

            {editingEst && (
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="font-semibold text-sm">{editingEst.nome_fantasia || editingEst.razao_social}</p>
                  <p className="text-xs text-muted-foreground">{editingEst.razao_social}</p>
                  <p className="text-xs text-muted-foreground">CNPJ: {editingEst.cnpj}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Buscar CNAE</Label>
                  <div className="relative mt-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Digite código ou descrição..."
                      value={cnaeSearch}
                      onChange={e => setCnaeSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {selectedCnae && (
                  <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">{selectedCnae.cnae}</p>
                      <p className="text-xs">{selectedCnae.description}</p>
                      <Badge className={`text-xs mt-1 ${getRiskColor(selectedCnae.riskLevel)}`}>
                        Risco {selectedCnae.riskLevel} - {RISK_LABELS[selectedCnae.riskLevel]}
                      </Badge>
                    </div>
                    <button onClick={() => setSelectedCnae(null)} className="ml-auto">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                )}

                <ScrollArea className="h-[200px] border rounded-lg">
                  <div className="p-1">
                    {filteredCnaes.map(c => (
                      <button
                        key={c.cnae}
                        onClick={() => setSelectedCnae(c)}
                        className={`w-full text-left p-2 rounded-md text-sm hover:bg-accent transition-colors ${
                          selectedCnae?.cnae === c.cnae ? 'bg-primary/10 border border-primary/20' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold">{c.cnae}</span>
                          <Badge className={`text-[10px] ${getRiskColor(c.riskLevel)}`}>{c.riskLevel}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.description}</p>
                      </button>
                    ))}
                    {filteredCnaes.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-4">Nenhum CNAE encontrado</p>
                    )}
                  </div>
                </ScrollArea>

                <Button onClick={handleSave} disabled={!selectedCnae || saving} className="w-full">
                  {saving ? 'Salvando...' : 'Salvar CNAE'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

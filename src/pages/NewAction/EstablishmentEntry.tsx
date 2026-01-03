import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Camera, 
  Edit3, 
  Loader2,
  Building2,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type EntryMethod = 'cnpj' | 'ocr' | 'manual';

export default function EstablishmentEntry() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const motivo = searchParams.get('motivo') || '';
  
  const [method, setMethod] = useState<EntryMethod | null>(null);
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [establishment, setEstablishment] = useState<any>(null);

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const handleCNPJSearch = async () => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) {
      toast({
        title: 'CNPJ inválido',
        description: 'Digite um CNPJ válido com 14 dígitos',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    
    // First check local database
    const { data: localData } = await supabase
      .from('establishments')
      .select('*')
      .eq('cnpj', cleanCNPJ)
      .single();

    if (localData) {
      setEstablishment(localData);
      setLoading(false);
      return;
    }

    // TODO: Integrate with ReceitaWS API for CNPJ lookup
    // For now, show empty form for manual entry
    setEstablishment({
      cnpj: cleanCNPJ,
      razao_social: '',
      nome_fantasia: '',
      endereco: '',
      bairro: '',
      cep: '',
    });
    
    setLoading(false);
    toast({
      title: 'CNPJ não encontrado',
      description: 'Preencha os dados manualmente',
    });
  };

  const handleProceed = () => {
    if (establishment) {
      // Navigate to document type selection
      navigate(`/nova-acao/tipo-documento?motivo=${motivo}&establishment=${encodeURIComponent(JSON.stringify(establishment))}`);
    }
  };

  const entryMethods = [
    { id: 'cnpj' as EntryMethod, icon: Search, label: 'Buscar por CNPJ', description: 'Consulta automática' },
    { id: 'ocr' as EntryMethod, icon: Camera, label: 'Foto do Alvará', description: 'OCR automático' },
    { id: 'manual' as EntryMethod, icon: Edit3, label: 'Manual', description: 'Preencher dados' },
  ];

  return (
    <AppLayout>
      <Header 
        title="Estabelecimento" 
        subtitle="Identificar o estabelecimento"
        showBack 
      />
      
      <div className="p-4 space-y-4">
        {/* Entry Method Selection */}
        {!method && (
          <>
            <p className="text-sm text-muted-foreground">
              Como deseja identificar o estabelecimento?
            </p>
            
            <div className="grid gap-3">
              {entryMethods.map((entry) => (
                <Card 
                  key={entry.id}
                  className={cn(
                    'border-0 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]',
                  )}
                  onClick={() => setMethod(entry.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl p-3 bg-primary/10">
                        <entry.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{entry.label}</p>
                        <p className="text-sm text-muted-foreground">{entry.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* CNPJ Search */}
        {method === 'cnpj' && !establishment && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div>
                <Label htmlFor="cnpj">CNPJ do Estabelecimento</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="cnpj"
                    placeholder="00.000.000/0000-00"
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                    className="flex-1"
                  />
                  <Button onClick={handleCNPJSearch} disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              <Button variant="outline" className="w-full" onClick={() => setMethod(null)}>
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* OCR Upload */}
        {method === 'ocr' && !establishment && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center">
                <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="font-medium">Tire uma foto do Alvará Sanitário</p>
                <p className="text-sm text-muted-foreground mb-4">
                  O sistema extrairá os dados automaticamente
                </p>
                <Button>
                  <Camera className="mr-2 h-4 w-4" />
                  Abrir Câmera
                </Button>
              </div>
              
              <Button variant="outline" className="w-full" onClick={() => setMethod(null)}>
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Manual Entry / Edit Establishment Data */}
        {(method === 'manual' || establishment) && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Dados do Estabelecimento</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="razao">Razão Social *</Label>
                  <Input
                    id="razao"
                    placeholder="Razão Social"
                    value={establishment?.razao_social || ''}
                    onChange={(e) => setEstablishment({...establishment, razao_social: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="fantasia">Nome Fantasia</Label>
                  <Input
                    id="fantasia"
                    placeholder="Nome Fantasia"
                    value={establishment?.nome_fantasia || ''}
                    onChange={(e) => setEstablishment({...establishment, nome_fantasia: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="cnpjField">CNPJ *</Label>
                  <Input
                    id="cnpjField"
                    placeholder="00.000.000/0000-00"
                    value={formatCNPJ(establishment?.cnpj || '')}
                    onChange={(e) => setEstablishment({...establishment, cnpj: e.target.value.replace(/\D/g, '')})}
                  />
                </div>
                
                <div className="flex items-center gap-2 pt-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h4 className="font-medium">Endereço</h4>
                </div>
                
                <div>
                  <Label htmlFor="endereco">Endereço Completo *</Label>
                  <Input
                    id="endereco"
                    placeholder="Rua, número, quadra, lote"
                    value={establishment?.endereco || ''}
                    onChange={(e) => setEstablishment({...establishment, endereco: e.target.value})}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="bairro">Bairro</Label>
                    <Input
                      id="bairro"
                      placeholder="Bairro"
                      value={establishment?.bairro || ''}
                      onChange={(e) => setEstablishment({...establishment, bairro: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={establishment?.cep || ''}
                      onChange={(e) => setEstablishment({...establishment, cep: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => {
                  setMethod(null);
                  setEstablishment(null);
                }}>
                  Voltar
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={handleProceed}
                  disabled={!establishment?.razao_social || !establishment?.cnpj || !establishment?.endereco}
                >
                  Continuar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

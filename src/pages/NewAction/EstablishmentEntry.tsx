import { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { FiscalizWatermark } from '@/components/layout/FiscalizWatermark';
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
  MapPin,
  Navigation,
  Locate,
  AlertTriangle,
  CheckCircle2,
  Upload,
  FileText,
  X,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type EntryMethod = 'cnpj' | 'ocr' | 'manual' | 'geo' | 'documento_anterior';

const DRAFT_STORAGE_KEY = 'fiscaliz_draft_establishment';

export default function EstablishmentEntry() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const motivo = searchParams.get('motivo') || '';
  
  const [method, setMethod] = useState<EntryMethod | null>(null);
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [docAnteriorLoading, setDocAnteriorLoading] = useState(false);
  const [establishment, setEstablishment] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [alvaraImage, setAlvaraImage] = useState<string | null>(null);
  const [documentoAnteriorImage, setDocumentoAnteriorImage] = useState<string | null>(null);
  const [previousDocuments, setPreviousDocuments] = useState<any[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [docType, setDocType] = useState<'cnpj' | 'cpf'>('cnpj');
  
  const alvaraInputRef = useRef<HTMLInputElement>(null);
  const alvaraCameraRef = useRef<HTMLInputElement>(null);
  const docAnteriorInputRef = useRef<HTMLInputElement>(null);
  const docAnteriorCameraRef = useRef<HTMLInputElement>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.motivo === motivo) {
          if (parsed.method) setMethod(parsed.method);
          if (parsed.cnpj) setCnpj(parsed.cnpj);
          if (parsed.establishment) setEstablishment(parsed.establishment);
          toast({
            title: 'Rascunho restaurado',
            description: 'Dados anteriores foram recuperados',
          });
        }
      }
    } catch (error) {
      console.error('[AutoSave] Error loading draft:', error);
    }
    setDraftLoaded(true);
  }, [motivo, toast]);

  // Save draft to localStorage when data changes
  useEffect(() => {
    if (!draftLoaded) return; // Don't save before loading
    
    try {
      const draftData = {
        savedAt: new Date().toISOString(),
        motivo,
        method,
        cnpj,
        establishment,
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftData));
    } catch (error) {
      console.error('[AutoSave] Error saving draft:', error);
    }
  }, [motivo, method, cnpj, establishment, draftLoaded]);

  // Clear draft when navigating to next step
  const clearEstablishmentDraft = () => {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (error) {
      console.error('[AutoSave] Error clearing draft:', error);
    }
  };

  // Load previous documents when selecting that method
  useEffect(() => {
    if (method === 'documento_anterior' && previousDocuments.length === 0) {
      loadPreviousDocuments();
    }
  }, [method]);

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>, 
    setImage: (url: string | null) => void,
    extractType: 'none' | 'alvara' | 'documento_anterior' = 'none'
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setImage(base64);
        toast({
          title: 'Imagem carregada',
          description: extractType !== 'none' ? 'Processando com IA...' : 'Arquivo selecionado com sucesso',
        });
        
        // Auto-extract data based on type
        if (extractType === 'alvara') {
          extractAlvaraData(base64);
        } else if (extractType === 'documento_anterior') {
          extractFiscalDocumentData(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const extractFiscalDocumentData = async (imageBase64: string) => {
    setDocAnteriorLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-fiscal-document-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageBase64 }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar imagem');
      }

      const result = await response.json();
      
      if (result.data) {
        const extractedData = result.data;
        const extractedCnpj = extractedData.cnpj || '';
        
        // Se tiver CNPJ mas não tiver CNAE, buscar do banco
        let cnaeFromDb = '';
        if (extractedCnpj && !extractedData.cnaePrincipal) {
          const { data: existingEstablishment } = await supabase
            .from('establishments')
            .select('cnae_principal')
            .eq('cnpj', extractedCnpj)
            .not('cnae_principal', 'is', null)
            .limit(1)
            .maybeSingle();
          
          if (existingEstablishment?.cnae_principal) {
            cnaeFromDb = existingEstablishment.cnae_principal;
          }
        }
        
        // Populate establishment data with extracted values
        setEstablishment({
          cnpj: extractedCnpj,
          razao_social: extractedData.razaoSocial || '',
          nome_fantasia: extractedData.nomeFantasia || '',
          endereco: extractedData.endereco || '',
          bairro: extractedData.bairro || '',
          cep: extractedData.cep || '',
          cnae_principal: extractedData.cnaePrincipal || cnaeFromDb || '',
          responsavel_nome: extractedData.responsavelNome || '',
        });

        toast({
          title: 'Dados extraídos com sucesso!',
          description: cnaeFromDb ? 'CNAE recuperado do banco de dados.' : 'Verifique e complete as informações se necessário.',
        });
      }
    } catch (error) {
      console.error('Fiscal Document OCR Error:', error);
      toast({
        title: 'Erro na extração automática',
        description: error instanceof Error ? error.message : 'Tente novamente ou preencha manualmente',
        variant: 'destructive',
      });
      
      // Still allow manual entry
      setEstablishment({
        razao_social: '',
        nome_fantasia: '',
        cnpj: '',
        endereco: '',
        bairro: '',
        cep: '',
      });
    } finally {
      setDocAnteriorLoading(false);
    }
  };

  const extractAlvaraData = async (imageBase64: string) => {
    setOcrLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-alvara-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ imageBase64 }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar imagem');
      }

      const result = await response.json();
      
      if (result.data) {
        const extractedData = result.data;
        
        // Populate establishment data with extracted values
        setEstablishment({
          cnpj: extractedData.cnpj?.replace(/\D/g, '') || '',
          razao_social: extractedData.razaoSocial || '',
          nome_fantasia: extractedData.nomeFantasia || '',
          endereco: extractedData.endereco || '',
          bairro: extractedData.bairro || '',
          cep: extractedData.cep?.replace(/\D/g, '') || '',
          alvara_numero: extractedData.alvaraNumero || '',
          alvara_validade: extractedData.alvaraValidade || '',
          cnae_principal: extractedData.cnaePrincipal || '',
          responsavel_nome: extractedData.responsavelNome || '',
        });

        toast({
          title: 'Dados extraídos com sucesso!',
          description: 'Verifique e complete as informações se necessário.',
        });
      }
    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: 'Erro na extração automática',
        description: error instanceof Error ? error.message : 'Tente novamente ou preencha manualmente',
        variant: 'destructive',
      });
      
      // Still allow manual entry
      setEstablishment({
        razao_social: '',
        nome_fantasia: '',
        cnpj: '',
        endereco: '',
        bairro: '',
        cep: '',
      });
    } finally {
      setOcrLoading(false);
    }
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .slice(0, 18);
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2')
      .slice(0, 14);
  };

  const formatDocument = (value: string) => {
    return docType === 'cpf' ? formatCPF(value) : formatCNPJ(value);
  };

  const handleCNPJSearch = async () => {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (docType === 'cpf') {
      if (cleanCNPJ.length !== 11) {
        toast({
          title: 'CPF inválido',
          description: 'Digite um CPF válido com 11 dígitos',
          variant: 'destructive',
        });
        return;
      }
      // CPF: skip API lookup, go straight to manual form with CPF
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
        title: 'CPF informado',
        description: 'Preencha os dados do responsável',
      });
      return;
    }

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
    const { data: localData, error: localError } = await supabase
      .from('establishments')
      .select('*')
      .eq('cnpj', cleanCNPJ)
      .limit(1)
      .maybeSingle();

    // maybeSingle() should avoid throwing when 0 rows; still handle unexpected errors
    if (localError) {
      console.warn('[CNPJ] Erro ao buscar no banco local:', localError);
    }

    if (localData) {
      setEstablishment(localData);
      setLoading(false);
      toast({
        title: 'Estabelecimento encontrado',
        description: 'Dados carregados do banco local',
      });
      return;
    }

    // Query Brasil API (free, no API key required)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        // Build address from API response
        const endereco = [
          data.descricao_tipo_de_logradouro,
          data.logradouro,
          data.numero,
          data.complemento
        ].filter(Boolean).join(' ').trim();
        
        setEstablishment({
          cnpj: cleanCNPJ,
          razao_social: data.razao_social || '',
          nome_fantasia: data.nome_fantasia || '',
          endereco: endereco || '',
          bairro: data.bairro || '',
          cep: data.cep?.replace(/\D/g, '') || '',
          cnae_principal: data.cnae_fiscal?.toString() || '',
          cnae_descricao: data.cnae_fiscal_descricao || '',
          situacao_cadastral: data.descricao_situacao_cadastral || '',
          responsavel_nome: data.qsa?.[0]?.nome_socio || '',
        });
        
        setLoading(false);
        toast({
          title: 'CNPJ encontrado!',
          description: `${data.razao_social}`,
        });
        return;
      }
      
      // API returned error (CNPJ not found or invalid)
      if (response.status === 404) {
        toast({
          title: 'CNPJ não encontrado na Receita Federal',
          description: 'Verifique o número ou preencha manualmente',
          variant: 'destructive',
        });
      } else {
        throw new Error('API error');
      }
    } catch (error) {
      console.error('Error fetching CNPJ:', error);
      toast({
        title: 'Erro ao consultar CNPJ',
        description: 'Tente novamente ou preencha manualmente',
        variant: 'destructive',
      });
    }
    
    // Fallback: show empty form for manual entry
    setEstablishment({
      cnpj: cleanCNPJ,
      razao_social: '',
      nome_fantasia: '',
      endereco: '',
      bairro: '',
      cep: '',
    });
    
    setLoading(false);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: 'Geolocalização não suportada',
        description: 'Seu navegador não suporta geolocalização',
        variant: 'destructive',
      });
      return;
    }

    setGeoLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });
        
        // Validate coordinates
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
          toast({ title: 'Coordenadas inválidas', variant: 'destructive' });
          setGeoLoading(false);
          return;
        }
        // Try to get address from coordinates using reverse geocoding
        try {
          const geoController = new AbortController();
          const geoTimeoutId = setTimeout(() => geoController.abort(), 8000);
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { signal: geoController.signal }
          );
          clearTimeout(geoTimeoutId);
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            const street = addr.road || addr.street || '';
            const number = addr.house_number || '';
            const neighborhood = addr.suburb || addr.neighbourhood || addr.district || '';
            const postcode = addr.postcode || '';
            
            setEstablishment({
              razao_social: '',
              nome_fantasia: '',
              cnpj: '',
              endereco: number ? `${street}, ${number}` : street,
              bairro: neighborhood,
              cep: postcode.replace(/\D/g, ''),
              latitude,
              longitude,
            });
            
            toast({
              title: 'Localização obtida',
              description: 'Endereço preenchido automaticamente. Complete os dados do estabelecimento.',
            });
          } else {
            setEstablishment({
              razao_social: '',
              nome_fantasia: '',
              cnpj: '',
              endereco: '',
              bairro: '',
              cep: '',
              latitude,
              longitude,
            });
            
            toast({
              title: 'Localização obtida',
              description: 'Coordenadas capturadas. Preencha o endereço manualmente.',
            });
          }
        } catch (error) {
          // Even if geocoding fails, we have the coordinates
          setEstablishment({
            razao_social: '',
            nome_fantasia: '',
            cnpj: '',
            endereco: '',
            bairro: '',
            cep: '',
            latitude,
            longitude,
          });
          
          toast({
            title: 'Localização obtida',
            description: 'Coordenadas capturadas. Preencha o endereço manualmente.',
          });
        }
        
        setGeoLoading(false);
      },
      (error) => {
        setGeoLoading(false);
        let message = 'Erro ao obter localização';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Permissão de localização negada. Habilite nas configurações.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Localização indisponível no momento';
            break;
          case error.TIMEOUT:
            message = 'Tempo esgotado ao obter localização';
            break;
        }
        
        toast({
          title: 'Erro de geolocalização',
          description: message,
          variant: 'destructive',
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // Load previous documents when selecting "documento_anterior" method
  const loadPreviousDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const { data, error } = await supabase
        .from('fiscal_documents')
        .select(`
          id,
          document_type,
          created_at,
          establishment:establishments(
            id,
            razao_social,
            nome_fantasia,
            cnpj,
            endereco,
            bairro,
            cep,
            responsavel_nome,
            responsavel_telefone,
            cnae_principal,
            alvara_numero,
            latitude,
            longitude
          )
        `)
        .not('establishment_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Filter to unique establishments
      const uniqueEstablishments = new Map();
      data?.forEach((doc: any) => {
        const est = Array.isArray(doc.establishment) ? doc.establishment[0] : doc.establishment;
        if (est && !uniqueEstablishments.has(est.id)) {
          uniqueEstablishments.set(est.id, {
            ...doc,
            establishment: est,
          });
        }
      });

      setPreviousDocuments(Array.from(uniqueEstablishments.values()));
    } catch (error) {
      console.error('Error loading previous documents:', error);
      toast({
        title: 'Erro ao carregar documentos',
        description: 'Não foi possível carregar documentos anteriores',
        variant: 'destructive',
      });
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleSelectPreviousDocument = async (doc: any) => {
    const est = doc.establishment;
    
    // Se não tem CNPJ mas tem razão social, tentar buscar o CNPJ na base local
    if (!est.cnpj && est.razao_social) {
      toast({
        title: 'Buscando dados completos...',
        description: 'Procurando CNPJ pelo nome do estabelecimento',
      });
      
      // Buscar por razão social similar na base local
      const { data: foundEst } = await supabase
        .from('establishments')
        .select('*')
        .or(`razao_social.ilike.%${est.razao_social}%,nome_fantasia.ilike.%${est.razao_social}%`)
        .not('cnpj', 'is', null)
        .limit(1)
        .maybeSingle();
      
      if (foundEst && foundEst.cnpj) {
        setEstablishment({
          id: foundEst.id,
          cnpj: foundEst.cnpj,
          razao_social: foundEst.razao_social,
          nome_fantasia: foundEst.nome_fantasia,
          endereco: foundEst.endereco || est.endereco,
          bairro: foundEst.bairro || est.bairro,
          cep: foundEst.cep || est.cep,
          responsavel_nome: foundEst.responsavel_nome || est.responsavel_nome,
          responsavel_telefone: foundEst.responsavel_telefone || est.responsavel_telefone,
          cnae_principal: foundEst.cnae_principal || est.cnae_principal,
          alvara_numero: foundEst.alvara_numero || est.alvara_numero,
          latitude: foundEst.latitude || est.latitude,
          longitude: foundEst.longitude || est.longitude,
        });
        
        toast({
          title: 'CNPJ encontrado!',
          description: `Dados completos carregados para ${foundEst.nome_fantasia || foundEst.razao_social}`,
        });
        return;
      }
    }
    
    // Usar dados originais se não encontrou CNPJ
    setEstablishment({
      id: est.id,
      cnpj: est.cnpj || '',
      razao_social: est.razao_social,
      nome_fantasia: est.nome_fantasia,
      endereco: est.endereco,
      bairro: est.bairro,
      cep: est.cep,
      responsavel_nome: est.responsavel_nome,
      responsavel_telefone: est.responsavel_telefone,
      cnae_principal: est.cnae_principal,
      alvara_numero: est.alvara_numero,
      latitude: est.latitude,
      longitude: est.longitude,
    });
    
    toast({
      title: 'Estabelecimento selecionado',
      description: `${est.nome_fantasia || est.razao_social}`,
    });
  };

  const handleProceed = () => {
    if (establishment) {
      // Clear draft before navigating to next step
      clearEstablishmentDraft();
      // Navigate to document type selection
      navigate(`/nova-acao/tipo-documento?motivo=${motivo}&establishment=${encodeURIComponent(JSON.stringify(establishment))}`);
    }
  };

  const entryMethods = [
    { id: 'cnpj' as EntryMethod, icon: Search, label: 'Buscar por CNPJ/CPF', description: 'Consulta automática' },
    { id: 'geo' as EntryMethod, icon: Navigation, label: 'Georreferenciamento', description: 'Usar GPS do dispositivo' },
    { id: 'ocr' as EntryMethod, icon: Camera, label: 'Foto do Alvará', description: 'Foto ou upload do alvará' },
    { id: 'documento_anterior' as EntryMethod, icon: FileText, label: 'Peça Fiscal Anterior', description: 'Selecionar de documentos anteriores' },
    { id: 'manual' as EntryMethod, icon: Edit3, label: 'Manual', description: 'Preencher dados' },
  ];

  return (
    <AppLayout>
      <FiscalizWatermark />
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
              {/* CPF/CNPJ Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={cn(
                    'p-2.5 rounded-lg border-2 text-center transition-all text-sm font-medium',
                    docType === 'cnpj'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted text-muted-foreground hover:border-primary/50'
                  )}
                  onClick={() => { setDocType('cnpj'); setCnpj(''); }}
                >
                  CNPJ
                </button>
                <button
                  type="button"
                  className={cn(
                    'p-2.5 rounded-lg border-2 text-center transition-all text-sm font-medium',
                    docType === 'cpf'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted text-muted-foreground hover:border-primary/50'
                  )}
                  onClick={() => { setDocType('cpf'); setCnpj(''); }}
                >
                  CPF <span className="text-xs font-normal">(irregular)</span>
                </button>
              </div>

              <div>
                <Label htmlFor="cnpj">{docType === 'cpf' ? 'CPF do Responsável' : 'CNPJ do Estabelecimento'}</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="cnpj"
                    placeholder={docType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                    value={formatDocument(cnpj)}
                    onChange={(e) => setCnpj(e.target.value.replace(/\D/g, ''))}
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

        {/* Geolocation */}
        {method === 'geo' && !establishment && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-4">
              <div className="border-2 border-dashed border-muted rounded-xl p-8 text-center">
                <Locate className="mx-auto h-12 w-12 text-primary mb-4" />
                <p className="font-medium">Georreferenciamento</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Capture a localização GPS atual para preencher o endereço automaticamente
                </p>
                <Button onClick={handleGetLocation} disabled={geoLoading}>
                  {geoLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Obtendo localização...
                    </>
                  ) : (
                    <>
                      <Navigation className="mr-2 h-4 w-4" />
                      Obter Localização
                    </>
                  )}
                </Button>
              </div>
              
              <Button variant="outline" className="w-full" onClick={() => setMethod(null)}>
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* OCR Upload - Alvará */}
        {method === 'ocr' && !establishment && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-4">
              {/* Hidden file inputs */}
              <input
                type="file"
                ref={alvaraInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, setAlvaraImage, 'alvara')}
              />
              <input
                type="file"
                ref={alvaraCameraRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileSelect(e, setAlvaraImage, 'alvara')}
              />
              
              {ocrLoading ? (
                <div className="border-2 border-dashed border-primary/50 rounded-xl p-8 text-center bg-primary/5">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-primary animate-pulse" />
                    </div>
                    <div>
                      <p className="font-medium text-primary">Extraindo dados com IA...</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Analisando CNPJ, Razão Social, endereço e mais
                      </p>
                    </div>
                  </div>
                </div>
              ) : !alvaraImage ? (
                <div className="border-2 border-dashed border-muted rounded-xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Camera className="h-10 w-10 text-primary" />
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-medium">Foto do Alvará Sanitário</p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Tire uma foto ou faça upload do alvará
                  </p>
                  <p className="text-xs text-primary font-medium mb-4">
                    ✨ Extração automática com IA
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button onClick={() => alvaraCameraRef.current?.click()}>
                      <Camera className="mr-2 h-4 w-4" />
                      Tirar Foto
                    </Button>
                    <Button variant="outline" onClick={() => alvaraInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <img 
                      src={alvaraImage} 
                      alt="Alvará" 
                      className="w-full rounded-lg border"
                    />
                    <Button 
                      variant="destructive" 
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setAlvaraImage(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 justify-center text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium">Clique em "Extrair com IA" para preencher os dados</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      className="flex-1" 
                      onClick={() => setEstablishment({ razao_social: '', nome_fantasia: '', cnpj: '', endereco: '', bairro: '', cep: '' })}
                    >
                      Preencher Manual
                    </Button>
                    <Button 
                      className="flex-1" 
                      onClick={() => extractAlvaraData(alvaraImage)}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Extrair com IA
                    </Button>
                  </div>
                </div>
              )}
              
              <Button variant="outline" className="w-full" onClick={() => { setMethod(null); setAlvaraImage(null); }}>
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Documento Anterior - Foto/Upload ou Lista */}
        {method === 'documento_anterior' && !establishment && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-4">
              {/* Hidden file inputs for documento anterior */}
              <input
                type="file"
                ref={docAnteriorInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e, setDocumentoAnteriorImage, 'documento_anterior')}
              />
              <input
                type="file"
                ref={docAnteriorCameraRef}
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileSelect(e, setDocumentoAnteriorImage, 'documento_anterior')}
              />

              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Peça Fiscal Anterior</h3>
              </div>
              
              {/* Loading State */}
              {docAnteriorLoading ? (
                <div className="border-2 border-dashed border-primary/50 rounded-xl p-8 text-center bg-primary/5">
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <Loader2 className="h-12 w-12 text-primary animate-spin" />
                      <Sparkles className="absolute -top-1 -right-1 h-5 w-5 text-primary animate-pulse" />
                    </div>
                    <div>
                      <p className="font-medium text-primary">Extraindo dados com IA...</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Analisando CNPJ, Razão Social, endereço e mais
                      </p>
                    </div>
                  </div>
                </div>
              ) : !documentoAnteriorImage ? (
                /* Photo/Upload Section */
                <div className="border-2 border-dashed border-muted rounded-xl p-6 text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Camera className="h-10 w-10 text-primary" />
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-medium">Foto de Peça Fiscal Anterior</p>
                  <p className="text-sm text-muted-foreground mb-1">
                    Tire uma foto ou faça upload de um documento fiscal anterior
                  </p>
                  <p className="text-xs text-primary font-medium mb-4">
                    ✨ Extração automática com IA
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button onClick={() => docAnteriorCameraRef.current?.click()}>
                      <Camera className="mr-2 h-4 w-4" />
                      Tirar Foto
                    </Button>
                    <Button variant="outline" onClick={() => docAnteriorInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                  </div>
                </div>
              ) : (
                /* Image Preview with Extract Button */
                <div className="space-y-3">
                  <div className="relative">
                    <img 
                      src={documentoAnteriorImage} 
                      alt="Documento Anterior" 
                      className="w-full rounded-lg border max-h-64 object-contain"
                    />
                    <Button 
                      variant="destructive" 
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setDocumentoAnteriorImage(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 justify-center text-primary">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium">Clique em "Extrair com IA" para preencher os dados</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      className="flex-1" 
                      onClick={() => setEstablishment({ razao_social: '', nome_fantasia: '', cnpj: '', endereco: '', bairro: '', cep: '' })}
                    >
                      Preencher Manual
                    </Button>
                    <Button 
                      className="flex-1" 
                      onClick={() => extractFiscalDocumentData(documentoAnteriorImage)}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Extrair com IA
                    </Button>
                  </div>
                </div>
              )}

              {/* Divider */}
              {!documentoAnteriorImage && !docAnteriorLoading && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-muted" />
                  <span className="text-xs text-muted-foreground">ou selecione do histórico</span>
                  <div className="flex-1 border-t border-muted" />
                </div>
              )}

              {/* Previous Documents List */}
              {!documentoAnteriorImage && !docAnteriorLoading && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Selecione um estabelecimento de documentos já criados:
                  </p>

                  {loadingDocuments ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : previousDocuments.length === 0 ? (
                    <div className="border-2 border-dashed border-muted rounded-xl p-6 text-center">
                      <FileText className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                      <p className="font-medium text-muted-foreground">Nenhum documento encontrado</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Você ainda não criou documentos fiscais com estabelecimentos
                      </p>
                      <Button variant="outline" onClick={() => setMethod('manual')}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Preencher manualmente
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {previousDocuments.map((doc) => {
                        const est = doc.establishment;
                        const docTypeLabels: Record<string, string> = {
                          termo_intimacao: 'T.I.',
                          visita_fiscal: 'V.F.',
                          auto_infracao: 'A.I.',
                          certidao: 'Cert.',
                          interdicao: 'Int.',
                          apreensao: 'Apr.',
                          inutilizacao: 'Inut.',
                          advertencia: 'Adv.',
                          notificacao: 'Not.',
                          relatorio_tecnico: 'R.T.',
                        };
                        
                        return (
                          <Card 
                            key={doc.id}
                            className="border cursor-pointer transition-all hover:shadow-md hover:border-primary/50 active:scale-[0.98]"
                            onClick={() => handleSelectPreviousDocument(doc)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-start gap-3">
                                <div className="rounded-lg p-2 bg-primary/10 flex-shrink-0">
                                  <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">
                                    {est.nome_fantasia || est.razao_social}
                                  </p>
                                  {est.nome_fantasia && est.razao_social !== est.nome_fantasia && (
                                    <p className="text-xs text-muted-foreground truncate">
                                      {est.razao_social}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground">
                                      CNPJ: {est.cnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') || 'N/A'}
                                    </span>
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                      {docTypeLabels[doc.document_type] || doc.document_type}
                                    </span>
                                  </div>
                                  {est.endereco && (
                                    <p className="text-xs text-muted-foreground mt-1 truncate flex items-center gap-1">
                                      <MapPin className="h-3 w-3 flex-shrink-0" />
                                      {est.endereco}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
              
              <Button variant="outline" className="w-full" onClick={() => { setMethod(null); setPreviousDocuments([]); setDocumentoAnteriorImage(null); }}>
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
                
                {/* CPF/CNPJ Toggle in manual form */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={cn(
                      'p-2 rounded-lg border-2 text-center transition-all text-sm font-medium',
                      docType === 'cnpj'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted text-muted-foreground hover:border-primary/50'
                    )}
                    onClick={() => { setDocType('cnpj'); setEstablishment({...establishment, cnpj: ''}); }}
                  >
                    CNPJ
                  </button>
                  <button
                    type="button"
                    className={cn(
                      'p-2 rounded-lg border-2 text-center transition-all text-sm font-medium',
                      docType === 'cpf'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-muted text-muted-foreground hover:border-primary/50'
                    )}
                    onClick={() => { setDocType('cpf'); setEstablishment({...establishment, cnpj: ''}); }}
                  >
                    CPF <span className="text-xs font-normal">(irregular)</span>
                  </button>
                </div>

                <div>
                  <Label htmlFor="cnpjField">{docType === 'cpf' ? 'CPF *' : 'CNPJ *'}</Label>
                  <Input
                    id="cnpjField"
                    placeholder={docType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'}
                    value={formatDocument(establishment?.cnpj || '')}
                    onChange={(e) => setEstablishment({...establishment, cnpj: e.target.value.replace(/\D/g, '')})}
                  />
                </div>

                {/* Situação Cadastral Badge */}
                {establishment?.situacao_cadastral && (
                  <div className={`rounded-lg p-3 flex items-center gap-2 ${
                    establishment.situacao_cadastral === 'ATIVA' 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-amber-50 border border-amber-200'
                  }`}>
                    {establishment.situacao_cadastral === 'ATIVA' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    )}
                    <div>
                      <span className={`text-sm font-medium ${
                        establishment.situacao_cadastral === 'ATIVA' 
                          ? 'text-green-700' 
                          : 'text-amber-700'
                      }`}>
                        Situação Cadastral: {establishment.situacao_cadastral}
                      </span>
                      {establishment.situacao_cadastral !== 'ATIVA' && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          Atenção: CNPJ não está ativo na Receita Federal
                        </p>
                      )}
                    </div>
                  </div>
                )}
                
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

                <div className="pt-2">
                  <Label htmlFor="cnae">CNAE - Atividade Econômica</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="cnae"
                      placeholder="0000-0/00"
                      value={establishment?.cnae_principal || ''}
                      onChange={(e) => setEstablishment({...establishment, cnae_principal: e.target.value})}
                      className="w-32"
                    />
                    <Input
                      placeholder="Descrição da atividade"
                      value={establishment?.cnae_descricao || ''}
                      onChange={(e) => setEstablishment({...establishment, cnae_descricao: e.target.value})}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* GPS Coordinates Display */}
                {(establishment?.latitude && establishment?.longitude) && (
                  <div className="bg-primary/5 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <Locate className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Coordenadas GPS</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Latitude:</span>
                        <span className="ml-1 font-mono">{establishment.latitude.toFixed(6)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Longitude:</span>
                        <span className="ml-1 font-mono">{establishment.longitude.toFixed(6)}</span>
                      </div>
                    </div>
                  </div>
                )}
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

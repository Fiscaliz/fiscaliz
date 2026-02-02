import { useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { FiscalizWatermark } from '@/components/layout/FiscalizWatermark';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  CheckSquare, 
  Edit3, 
  Sparkles,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar,
  Camera,
  X,
  Image as ImageIcon,
  Clock,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { checklistTemplates, getAllCategories, type ChecklistItem } from '@/data/checklists';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CertidaoForm, formatCertidaoContent } from '@/components/documents/CertidaoForm';
import { DocumentCommonFields } from '@/components/documents/DocumentCommonFields';
import { VisitaFiscalForm, formatVisitaFiscalContent, type VisitaFiscalData } from '@/components/documents/VisitaFiscalForm';
import { AutoInfracaoForm, formatAutoInfracaoContent, type AutoInfracaoData } from '@/components/documents/AutoInfracaoForm';
import { RelatorioTecnicoForm, formatRelatorioTecnicoContent, type RelatorioTecnicoData } from '@/components/documents/RelatorioTecnicoForm';

type UploadedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

// Métodos de criação para Certidão - simplificado
const certidaoMethods = [
  { id: 'certidao', icon: FileText, label: 'Preenchimento Padrão', description: 'Formulário com opções de certidão' },
];

// Métodos de criação para outros documentos
const creationMethods = [
  { id: 'manual', icon: Edit3, label: 'Preenchimento Manual', description: 'Editor de texto' },
  { id: 'ai', icon: Sparkles, label: 'Fiscalização por IA', description: 'Upload de até 50 fotos' },
  { id: 'checklist', icon: CheckSquare, label: 'Checklist Pré-Atestado', description: 'Por tipo de estabelecimento' },
  { id: 'upload', icon: Upload, label: 'Upload de Documento', description: 'Foto do documento em papel' },
  { id: 'outros', icon: MoreHorizontal, label: 'Outros', description: 'Campo livre' },
];

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

export default function CreateDocument() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const motivo = searchParams.get('motivo') || '';
  const tipo = searchParams.get('tipo') || 'termo_intimacao';
  const establishmentData = searchParams.get('establishment');
  const establishment = establishmentData ? JSON.parse(decodeURIComponent(establishmentData)) : null;

  const [method, setMethod] = useState<string | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [manualContent, setManualContent] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('15');
  const [saving, setSaving] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [otrosContent, setOtrosContent] = useState('');
  const [observations, setObservations] = useState('');
  const [dengueInspection, setDengueInspection] = useState(false);
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentTime, setDocumentTime] = useState(new Date().toTimeString().slice(0, 5));
  const [certidaoData, setCertidaoData] = useState({
    selectedOptions: [] as string[],
    observations: {} as Record<string, string>,
    otherText: '',
  });
  const [visitaFiscalData, setVisitaFiscalData] = useState<VisitaFiscalData>({
    purpose: [],
    anotacoes: '',
    areasVistoriadas: [],
    orientacoesImediatas: '',
    documentoPosterior: false,
    reinspeçaoTipo: '',
    reinspeçaoNumero: '',
    intimacaoResolucao: '',
    documentoEntregue: '',
    orientacoes: '',
    semIrregularidadesTexto: 'No momento da ação fiscal não foram encontradas irregularidades.',
    dengueInspection: false,
    documentDate: new Date().toISOString().split('T')[0],
    documentTime: new Date().toTimeString().slice(0, 5),
  });
  const [autoInfracaoData, setAutoInfracaoData] = useState<AutoInfracaoData>({
    infracoes: [],
    valorMulta: '',
    prazoDefesa: 15,
    documentDate: new Date().toISOString().split('T')[0],
    documentTime: new Date().toTimeString().slice(0, 5),
  });
  const [relatorioTecnicoData, setRelatorioTecnicoData] = useState<RelatorioTecnicoData>({
    method: null,
    equipe: [{ nome: '', cargo: 'Auditor(a) Fiscal de Saúde Pública', matricula: '' }],
    objetivos: [],
    outroObjetivo: '',
    baseLegal: ['Lei Federal 6437/77', 'RDC 216/04 ANVISA'],
    outraBaseLegal: '',
    descricao: '',
    medidasLegais: '',
    conclusao: '',
    documentDate: new Date().toISOString().split('T')[0],
    documentTime: new Date().toTimeString().slice(0, 5),
    irregularidades: [],
    aiAnalysisResult: '',
    isAnalyzing: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const aiCameraInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const attachmentCameraRef = useRef<HTMLInputElement>(null);
  const autoInfracaoFileInputRef = useRef<HTMLInputElement>(null);
  const relatorioTecnicoFileInputRef = useRef<HTMLInputElement>(null);
  const relatorioTecnicoCameraRef = useRef<HTMLInputElement>(null);

  // Auto-select certidao method for certidao type
  const isCertidao = tipo === 'certidao';
  const isVisitaFiscal = tipo === 'visita_fiscal';
  const isAutoInfracao = tipo === 'auto_infracao';
  const isRelatorioTecnico = tipo === 'relatorio_tecnico';
  const availableMethods = isCertidao ? certidaoMethods : creationMethods;
  const currentChecklist = useMemo(() => {
    return checklistTemplates.find(c => c.id === selectedChecklist);
  }, [selectedChecklist]);

  const categories = useMemo(() => {
    if (!currentChecklist) return [];
    return getAllCategories(currentChecklist);
  }, [currentChecklist]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getItemsByCategory = (category: string): ChecklistItem[] => {
    return currentChecklist?.items.filter(item => item.category === category) || [];
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, isAI: boolean = false) => {
    const files = e.target.files;
    if (!files) return;

    const maxFiles = isAI ? 50 : 10;
    const currentCount = uploadedImages.length;
    const remainingSlots = maxFiles - currentCount;
    
    if (files.length > remainingSlots) {
      toast({
        title: 'Limite de fotos',
        description: `Você pode adicionar no máximo ${maxFiles} fotos. Slots disponíveis: ${remainingSlots}`,
        variant: 'destructive',
      });
      return;
    }

    const toAdd: UploadedImage[] = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setUploadedImages((prev) => [...prev, ...toAdd]);

    // Reset input
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return next;
    });
  };

  const generateDocumentContent = () => {
    if (method === 'certidao' || (isCertidao && method === null)) {
      return formatCertidaoContent(certidaoData);
    }
    if (isVisitaFiscal) {
      return formatVisitaFiscalContent(visitaFiscalData);
    }
    if (isAutoInfracao) {
      return formatAutoInfracaoContent(autoInfracaoData);
    }
    if (isRelatorioTecnico) {
      return formatRelatorioTecnicoContent(relatorioTecnicoData);
    }
    if (method === 'checklist' && currentChecklist) {
      const selectedItemsData = currentChecklist.items.filter(item => selectedItems.includes(item.id));
      return selectedItemsData.map((item, idx) => `${idx + 1}. ${item.text}`).join('\n');
    }
    if (method === 'outros') {
      return otrosContent;
    }
    return manualContent;
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    
    try {
      // Create establishment if new
      let establishmentId = establishment?.id;
      
      if (!establishmentId && establishment) {
        const { data: newEstablishment, error: estError } = await supabase
          .from('establishments')
          .insert({
            cnpj: establishment.cnpj,
            razao_social: establishment.razao_social,
            nome_fantasia: establishment.nome_fantasia,
            endereco: establishment.endereco,
            bairro: establishment.bairro,
            cep: establishment.cep,
            created_by: user.id,
          })
          .select()
          .single();
        
        if (estError) throw estError;
        establishmentId = newEstablishment.id;
      }

      // Create fiscal action
      const { data: action, error: actionError } = await supabase
        .from('fiscal_actions')
        .insert({
          user_id: user.id,
          establishment_id: establishmentId,
          reason: motivo as any,
        })
        .select()
        .single();

      if (actionError) throw actionError;

      // Calculate deadline date
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + parseInt(deadlineDays));

      // Upload photos (if any) to storage, and keep only URLs in DB
      const plannedDocId = crypto.randomUUID();
      const uploadedUrls: string[] = [];

      if (uploadedImages.length > 0) {
        for (const img of uploadedImages) {
          const fileExt = img.file.name.split('.').pop() || 'jpg';
          const fileName = `${user.id}/${plannedDocId}_${img.id}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('fiscal-photos')
            .upload(fileName, img.file, { upsert: true });
          if (uploadError) throw uploadError;

          const { data: urlData } = supabase.storage.from('fiscal-photos').getPublicUrl(fileName);
          if (urlData?.publicUrl) uploadedUrls.push(urlData.publicUrl);
        }
      }

      // Create document
      let content = generateDocumentContent();

      // If AI method, call backend to analyze uploaded photos
      if (method === 'ai') {
        if (uploadedUrls.length === 0) {
          throw new Error('Adicione pelo menos 1 foto para análise.');
        }

        const { data: aiData, error: aiError } = await supabase.functions.invoke('analyze-photos', {
          body: {
            documentType: tipo,
            photos: uploadedUrls,
          },
        });

        if (aiError) throw aiError;
        const aiText = (aiData as any)?.text as string | undefined;
        if (!aiText?.trim()) {
          throw new Error('A IA não retornou texto. Tente novamente com fotos mais nítidas.');
        }
        content = aiText;
      }
      const irregularities = method === 'checklist' && currentChecklist
        ? currentChecklist.items.filter(item => selectedItems.includes(item.id)).map(item => ({
            id: item.id,
            text: item.text,
            category: item.category,
            legislation: item.legislation,
          }))
        : [];

      // Prepare attachments (URLs only)
      const attachments = uploadedUrls.length > 0
        ? uploadedUrls.map((url, idx) => ({
            id: `img_${idx}`,
            url,
            type: 'image',
          }))
        : null;

      // Prepare content object based on document type
      let contentObj;
      if (isVisitaFiscal) {
        contentObj = {
          text: content,
          method: 'visita_fiscal',
          visita_fiscal_data: visitaFiscalData,
          dengue_inspection: visitaFiscalData.dengueInspection,
          document_date: visitaFiscalData.documentDate,
          document_time: visitaFiscalData.documentTime,
        };
      } else if (isAutoInfracao) {
        contentObj = {
          text: content,
          method: 'auto_infracao',
          auto_infracao_data: autoInfracaoData,
          document_date: autoInfracaoData.documentDate,
          document_time: autoInfracaoData.documentTime,
          prazo_defesa: autoInfracaoData.prazoDefesa,
        };
      } else if (isRelatorioTecnico) {
        contentObj = {
          text: content,
          method: relatorioTecnicoData.method || 'manual',
          relatorio_tecnico_data: relatorioTecnicoData,
          document_date: relatorioTecnicoData.documentDate,
          document_time: relatorioTecnicoData.documentTime,
          equipe: relatorioTecnicoData.equipe,
        };
      } else {
        contentObj = {
          text: content,
          method,
          observations: observations.trim() || null,
          dengue_inspection: dengueInspection,
          document_date: documentDate,
          document_time: documentTime,
        };
      }

      // Para auto de infração, as irregularidades vêm do formulário específico
      let finalIrregularities = irregularities;
      if (isAutoInfracao) {
        finalIrregularities = autoInfracaoData.infracoes.map(inf => ({
          id: inf.id,
          text: inf.descricao,
          category: 'Infração',
          legislation: inf.dispositivo,
        }));
      } else if (isRelatorioTecnico) {
        finalIrregularities = relatorioTecnicoData.irregularidades.map(irr => ({
          id: irr.id,
          text: irr.descricao,
          category: 'Irregularidade',
          legislation: irr.dispositivo,
        }));
      }

      const insertData: any = {
        id: plannedDocId,
        user_id: user.id,
        establishment_id: establishmentId,
        fiscal_action_id: action.id,
        document_type: tipo,
        content: contentObj,
        irregularities: finalIrregularities,
        attachments,
        deadline_days: tipo === 'termo_intimacao' ? parseInt(deadlineDays) : null,
        deadline_date: tipo === 'termo_intimacao' ? deadlineDate.toISOString().split('T')[0] : null,
        priority: motivo === 'denuncia' || motivo === 'surto' || isAutoInfracao ? 'high' : 'medium',
      };

      const { data: newDoc, error: docError } = await supabase
        .from('fiscal_documents')
        .insert(insertData)
        .select()
        .single();

      if (docError) throw docError;

      toast({
        title: 'Documento salvo!',
        description: `${documentTypeLabels[tipo]} criado com sucesso. Clique para visualizar.`,
      });

      // Navigate to document detail to view/edit/send
      navigate(`/documento/${newDoc.id}`);
    } catch (error: any) {
      console.error('Error saving document:', error);
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
      <FiscalizWatermark />
      <Header 
        title={documentTypeLabels[tipo] || 'Novo Documento'} 
        subtitle={establishment?.nome_fantasia || establishment?.razao_social || 'Criar documento'}
        showBack 
      />
      
      <div className="p-4 space-y-4">
        {/* Certidão Form - auto-shown for certidao type */}
        {isCertidao && (
          <>
            <Card className="border-0 shadow-sm bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{establishment?.nome_fantasia || establishment?.razao_social}</p>
                    <p className="text-sm text-muted-foreground">{establishment?.endereco}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <CertidaoForm
              value={certidaoData}
              onChange={setCertidaoData}
            />

            {/* Photo Attachment Section */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Anexar Fotos (opcional)</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{uploadedImages.length}/10</span>
                </div>
                
                <input
                  ref={attachmentCameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, false)}
                />
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, false)}
                />

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                        <img src={img.previewUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadedImages.length < 10 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => attachmentCameraRef.current?.click()}
                      className="flex-1 h-12"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Capturar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => attachmentInputRef.current?.click()}
                      className="flex-1 h-12"
                    >
                      <FolderOpen className="h-5 w-5 mr-2" />
                      Galeria
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data e Hora para Certidão */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="certidaoDate" className="text-xs flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Data
                    </Label>
                    <Input
                      id="certidaoDate"
                      type="date"
                      value={documentDate}
                      onChange={(e) => setDocumentDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certidaoTime" className="text-xs flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Horário
                    </Label>
                    <Input
                      id="certidaoTime"
                      type="time"
                      value={documentTime}
                      onChange={(e) => setDocumentTime(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full" 
              onClick={handleSave}
              disabled={certidaoData.selectedOptions.length === 0 || saving}
            >
              {saving ? 'Salvando...' : 'Salvar Certidão'}
            </Button>
          </>
        )}

        {/* Visita Fiscal Form - auto-shown for visita_fiscal type */}
        {isVisitaFiscal && (
          <>
            <Card className="border-0 shadow-sm bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{establishment?.nome_fantasia || establishment?.razao_social}</p>
                    <p className="text-sm text-muted-foreground">{establishment?.endereco}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <VisitaFiscalForm
              value={visitaFiscalData}
              onChange={setVisitaFiscalData}
            />

            {/* Photo Attachment Section */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Anexar Fotos (opcional)</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{uploadedImages.length}/10</span>
                </div>
                
                <input
                  ref={attachmentCameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, false)}
                />
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, false)}
                />

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                        <img src={img.previewUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadedImages.length < 10 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => attachmentCameraRef.current?.click()}
                      className="flex-1 h-12"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Capturar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => attachmentInputRef.current?.click()}
                      className="flex-1 h-12"
                    >
                      <FolderOpen className="h-5 w-5 mr-2" />
                      Galeria
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Button 
              className="w-full" 
              onClick={handleSave}
              disabled={visitaFiscalData.purpose.length === 0 || !visitaFiscalData.dengueInspection || saving}
            >
              {saving ? 'Salvando...' : 'Salvar Visita Fiscal'}
            </Button>
          </>
        )}

        {/* Auto de Infração - Formulário específico */}
        {isAutoInfracao && (
          <>
            <Card className="border-0 shadow-sm bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-destructive" />
                  <div>
                    <p className="font-medium">{establishment?.nome_fantasia || establishment?.razao_social}</p>
                    <p className="text-sm text-muted-foreground">{establishment?.endereco}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <input
              ref={autoInfracaoFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e, false)}
            />
            <input
              id="autoInfracaoCameraInput"
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleImageUpload(e, false)}
            />

            <AutoInfracaoForm
              value={autoInfracaoData}
              onChange={setAutoInfracaoData}
              photos={uploadedImages.map(img => ({ id: img.id, previewUrl: img.previewUrl }))}
              onAddPhoto={() => autoInfracaoFileInputRef.current?.click()}
              onCapturePhoto={() => document.getElementById('autoInfracaoCameraInput')?.click()}
              onRemovePhoto={removeImage}
              photosRequired={true}
            />

            <Button 
              className="w-full" 
              onClick={handleSave}
              disabled={
                autoInfracaoData.infracoes.length === 0 || 
                uploadedImages.length === 0 || 
                saving
              }
            >
              {saving ? 'Salvando...' : 'Salvar Auto de Infração'}
            </Button>
          </>
        )}

        {/* Relatório Técnico Form - with method selection built-in */}
        {isRelatorioTecnico && (
          <>
            <Card className="border-0 shadow-sm bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{establishment?.nome_fantasia || establishment?.razao_social}</p>
                    <p className="text-sm text-muted-foreground">{establishment?.endereco}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <input
              ref={relatorioTecnicoFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageUpload(e, true)}
            />
            <input
              ref={relatorioTecnicoCameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleImageUpload(e, true)}
            />

            <RelatorioTecnicoForm
              value={relatorioTecnicoData}
              onChange={setRelatorioTecnicoData}
              photos={uploadedImages.map(img => ({ id: img.id, file: img.file, previewUrl: img.previewUrl }))}
              onAddPhoto={() => relatorioTecnicoFileInputRef.current?.click()}
              onCapturePhoto={() => relatorioTecnicoCameraRef.current?.click()}
              onRemovePhoto={removeImage}
              establishmentType={establishment?.cnae_principal}
            />

            {/* Photo Attachment Section (for both methods) */}
            {relatorioTecnicoData.method !== null && relatorioTecnicoData.method !== 'ai' && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Anexar Fotos (opcional)</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{uploadedImages.length}/10</span>
                  </div>
                  
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                          <img src={img.previewUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadedImages.length < 10 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => relatorioTecnicoCameraRef.current?.click()}
                        className="flex-1 h-12"
                      >
                        <Camera className="h-5 w-5 mr-2" />
                        Capturar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => relatorioTecnicoFileInputRef.current?.click()}
                        className="flex-1 h-12"
                      >
                        <FolderOpen className="h-5 w-5 mr-2" />
                        Galeria
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {relatorioTecnicoData.method !== null && (
              <Button 
                className="w-full" 
                onClick={handleSave}
                disabled={
                  !relatorioTecnicoData.descricao.trim() && 
                  relatorioTecnicoData.irregularidades.length === 0 || 
                  saving ||
                  relatorioTecnicoData.isAnalyzing
                }
              >
                {saving ? 'Salvando...' : 'Salvar Relatório Técnico'}
              </Button>
            )}
          </>
        )}

        {/* Method Selection - for non-certidao, non-visita_fiscal, non-auto_infracao and non-relatorio_tecnico types */}
        {!method && !isCertidao && !isVisitaFiscal && !isAutoInfracao && !isRelatorioTecnico && (
          <>
            <Card className="border-0 shadow-sm bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{establishment?.nome_fantasia || establishment?.razao_social}</p>
                    <p className="text-sm text-muted-foreground">{establishment?.endereco}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground">
              Como deseja criar o {documentTypeLabels[tipo].toLowerCase()}?
            </p>
            
            <div className="grid gap-3">
              {availableMethods.map((m) => (
                <Card 
                  key={m.id}
                  className="border-0 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
                  onClick={() => setMethod(m.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'rounded-xl p-3',
                        m.id === 'ai' ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground' : 'bg-primary/10'
                      )}>
                        <m.icon className={cn('h-6 w-6', m.id !== 'ai' && 'text-primary')} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{m.label}</p>
                        <p className="text-sm text-muted-foreground">{m.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Checklist Selection */}
        {method === 'checklist' && !selectedChecklist && (
          <>
            <p className="text-sm text-muted-foreground">
              Selecione o tipo de estabelecimento:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {checklistTemplates.map((checklist) => (
                <Card 
                  key={checklist.id}
                  className="border-0 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-95"
                  onClick={() => {
                    setSelectedChecklist(checklist.id);
                    // Expand all categories by default
                    const cats = getAllCategories(checklist);
                    setExpandedCategories(cats);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-2">
                      <div className="rounded-lg p-2 bg-primary/10 w-fit">
                        <CheckSquare className="h-5 w-5 text-primary" />
                      </div>
                      <p className="font-medium text-sm">{checklist.name}</p>
                      <p className="text-[11px] text-muted-foreground">{checklist.items.length} itens</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={() => setMethod(null)}>
              Voltar
            </Button>
          </>
        )}

        {/* Checklist Items */}
        {method === 'checklist' && selectedChecklist && currentChecklist && (
          <>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{currentChecklist.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {selectedItems.length}/{currentChecklist.items.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.map((category) => (
                  <div key={category} className="border rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-3 bg-muted/50 text-left"
                      onClick={() => toggleCategory(category)}
                    >
                      <span className="font-medium text-sm">{category}</span>
                      {expandedCategories.includes(category) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {expandedCategories.includes(category) && (
                      <div className="p-3 space-y-2">
                        {getItemsByCategory(category).map((item) => (
                          <label
                            key={item.id}
                            className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={selectedItems.includes(item.id)}
                              onCheckedChange={() => toggleItem(item.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <p className="text-sm">{item.text}</p>
                              {item.legislation && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.legislation}
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <DocumentCommonFields
              documentType={tipo}
              documentDate={documentDate}
              documentTime={documentTime}
              observations={observations}
              dengueInspection={dengueInspection}
              onDateChange={setDocumentDate}
              onTimeChange={setDocumentTime}
              onObservationsChange={setObservations}
              onDengueChange={setDengueInspection}
              showDeadline={tipo === 'termo_intimacao'}
              deadlineDays={deadlineDays}
              onDeadlineChange={setDeadlineDays}
            />

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedChecklist(null)}>
                Voltar
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSave}
                disabled={selectedItems.length === 0 || saving || (tipo === 'termo_intimacao' && !dengueInspection)}
              >
                {saving ? 'Salvando...' : 'Salvar Documento'}
              </Button>
            </div>
          </>
        )}

        {/* Manual Entry */}
        {method === 'manual' && (
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label htmlFor="content">Conteúdo do Documento</Label>
                  <Textarea
                    id="content"
                    placeholder="Digite o conteúdo do documento..."
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    className="min-h-[200px] mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <DocumentCommonFields
              documentType={tipo}
              documentDate={documentDate}
              documentTime={documentTime}
              observations={observations}
              dengueInspection={dengueInspection}
              onDateChange={setDocumentDate}
              onTimeChange={setDocumentTime}
              onObservationsChange={setObservations}
              onDengueChange={setDengueInspection}
              showDeadline={tipo === 'termo_intimacao'}
              deadlineDays={deadlineDays}
              onDeadlineChange={setDeadlineDays}
            />

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setMethod(null)}>
                Voltar
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSave}
                disabled={!manualContent.trim() || saving || (tipo === 'termo_intimacao' && !dengueInspection)}
              >
                {saving ? 'Salvando...' : 'Salvar Documento'}
              </Button>
            </div>
          </>
        )}

        {/* AI Method - Photo Upload */}
        {method === 'ai' && (
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">Fiscalização por IA</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload de até 50 fotos para análise automática
                    </p>
                  </div>
                </div>

                <input
                  ref={aiCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, true)}
                />
                <input
                  ref={aiFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, true)}
                />

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                        <img src={img.previewUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  {uploadedImages.length}/50 fotos
                </p>

                {uploadedImages.length < 50 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => aiCameraInputRef.current?.click()}
                      className="flex-1 h-12"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Capturar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => aiFileInputRef.current?.click()}
                      className="flex-1 h-12"
                    >
                      <FolderOpen className="h-5 w-5 mr-2" />
                      Galeria
                    </Button>
                  </div>
                )}

              </CardContent>
            </Card>

            <DocumentCommonFields
              documentType={tipo}
              documentDate={documentDate}
              documentTime={documentTime}
              observations={observations}
              dengueInspection={dengueInspection}
              onDateChange={setDocumentDate}
              onTimeChange={setDocumentTime}
              onObservationsChange={setObservations}
              onDengueChange={setDengueInspection}
              showDeadline={tipo === 'termo_intimacao'}
              deadlineDays={deadlineDays}
              onDeadlineChange={setDeadlineDays}
            />

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setMethod(null); setUploadedImages([]); }}>
                Voltar
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSave}
                disabled={uploadedImages.length === 0 || saving || (tipo === 'termo_intimacao' && !dengueInspection)}
              >
                {saving ? 'Salvando...' : 'Analisar com IA'}
              </Button>
            </div>
          </>
        )}

        {/* Upload de Documento - Photo of paper document */}
        {method === 'upload' && (
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <Upload className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">Upload de Documento</h3>
                    <p className="text-sm text-muted-foreground">
                      Tire foto do documento em papel
                    </p>
                  </div>
                </div>

                <input
                  id="uploadCameraInput"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, false)}
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleImageUpload(e, false)}
                />

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-[3/4] rounded-lg overflow-hidden">
                        <img src={img.previewUrl} alt={`Documento ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadedImages.length < 10 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById('uploadCameraInput')?.click()}
                      className="flex-1 h-12"
                    >
                      <Camera className="h-5 w-5 mr-2" />
                      Capturar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 h-12"
                    >
                      <FolderOpen className="h-5 w-5 mr-2" />
                      Galeria
                    </Button>
                  </div>
                )}

                {tipo === 'termo_intimacao' && uploadedImages.length > 0 && (
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <Label htmlFor="prazoUpload">Prazo</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="prazoUpload"
                          type="number"
                          min="1"
                          max="90"
                          value={deadlineDays}
                          onChange={(e) => setDeadlineDays(e.target.value)}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">dias</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setMethod(null); setUploadedImages([]); }}>
                Voltar
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSave}
                disabled={uploadedImages.length === 0 || saving}
              >
                {saving ? 'Salvando...' : 'Salvar Documento'}
              </Button>
            </div>
          </>
        )}

        {/* Outros - Campo Livre */}
        {method === 'outros' && (
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <MoreHorizontal className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-semibold">Campo Livre</h3>
                    <p className="text-sm text-muted-foreground">
                      Descreva as observações ou irregularidades
                    </p>
                  </div>
                </div>

                <Textarea
                  placeholder="Digite aqui suas observações, irregularidades encontradas ou qualquer outra informação relevante..."
                  value={otrosContent}
                  onChange={(e) => setOtrosContent(e.target.value)}
                  className="min-h-[200px]"
                />

                {/* Optional photo upload for "outros" */}
                <div>
                  <Label className="text-sm">Fotos (opcional)</Label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    className="hidden"
                    id="otros-photos"
                    onChange={(e) => handleImageUpload(e, false)}
                  />
                  
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                        <img src={img.previewUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    
                    {uploadedImages.length < 10 && (
                      <label
                        htmlFor="otros-photos"
                        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                      >
                        <ImageIcon className="h-5 w-5 text-muted-foreground" />
                      </label>
                    )}
                  </div>
                </div>

                {tipo === 'termo_intimacao' && (
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <Label htmlFor="prazoOtros">Prazo</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="prazoOtros"
                          type="number"
                          min="1"
                          max="90"
                          value={deadlineDays}
                          onChange={(e) => setDeadlineDays(e.target.value)}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">dias</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => { setMethod(null); setUploadedImages([]); setOtrosContent(''); }}>
                Voltar
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSave}
                disabled={!otrosContent.trim() || saving}
              >
                {saving ? 'Salvando...' : 'Salvar Documento'}
              </Button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

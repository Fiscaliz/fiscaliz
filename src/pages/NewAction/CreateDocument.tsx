import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { FiscalizWatermark } from '@/components/layout/FiscalizWatermark';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  FolderOpen,
  CloudOff,
  Check,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { checklistTemplates, getAllCategories, type ChecklistItem } from '@/data/checklists';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getNextDocumentNumber } from '@/hooks/useDocumentNumber';
import { CertidaoForm, formatCertidaoContent } from '@/components/documents/CertidaoForm';
import { DocumentCommonFields } from '@/components/documents/DocumentCommonFields';
import { VisitaFiscalForm, formatVisitaFiscalContent, type VisitaFiscalData } from '@/components/documents/VisitaFiscalForm';
import { AutoInfracaoForm, formatAutoInfracaoContent, type AutoInfracaoData } from '@/components/documents/AutoInfracaoForm';
import { RelatorioTecnicoForm, formatRelatorioTecnicoContent, type RelatorioTecnicoData } from '@/components/documents/RelatorioTecnicoForm';
import { RelatorioTecnicoAmpliadoForm, formatRelatorioAmpliadoContent, type RelatorioAmpliadoData, type ContentBlock } from '@/components/documents/RelatorioTecnicoAmpliadoForm';
import { ColetaAmostraForm, formatColetaAmostraContent, createEmptyProduto, type ColetaAmostraData } from '@/components/documents/ColetaAmostraForm';
import { InutilizacaoForm, formatInutilizacaoContent, type InutilizacaoData } from '@/components/documents/InutilizacaoForm';
import { ApreensaoForm, formatApreensaoContent, type ApreensaoData } from '@/components/documents/ApreensaoForm';
import { InterdicaoForm, formatInterdicaoContent, type InterdicaoData } from '@/components/documents/InterdicaoForm';
import { AdvertenciaForm, formatAdvertenciaContent, type AdvertenciaData } from '@/components/documents/AdvertenciaForm';
import { NotificacaoForm, formatNotificacaoContent, type NotificacaoData } from '@/components/documents/NotificacaoForm';
import { ReplicaForm, formatReplicaContent, type ReplicaData } from '@/components/documents/ReplicaForm';
import { TransportModeSelector } from '@/components/documents/TransportModeSelector';
import { clearDraftByKey } from '@/hooks/useAutoSaveDraft';
import { DenunciaResponseForm } from '@/components/documents/DenunciaResponseForm';

type UploadedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type AIPhotoLegend = {
  photoIndex: number;
  legenda: string;
  item_rdc: string;
  previewUrl?: string;
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
  const [categoryObservations, setCategoryObservations] = useState<Record<string, string>>({});
  const [manualContent, setManualContent] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [otrosContent, setOtrosContent] = useState('');
  const [observations, setObservations] = useState('');
  const [dengueInspection, setDengueInspection] = useState(false);
  const [documentDate, setDocumentDate] = useState(new Date().toISOString().split('T')[0]);
  const [documentTime, setDocumentTime] = useState(new Date().toTimeString().slice(0, 5));
  
  // AI analysis state
  const [aiPhotoLegends, setAiPhotoLegends] = useState<AIPhotoLegend[]>([]);
  const [aiAnalysisComplete, setAiAnalysisComplete] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const [aiUploadedPhotoUrls, setAiUploadedPhotoUrls] = useState<string[]>([]); // URLs from AI analysis upload
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false);
  const [showDenunciaResponse, setShowDenunciaResponse] = useState(false);
  const [denunciaContext, setDenunciaContext] = useState('');
  const denunciaFileInputRef = useRef<HTMLInputElement>(null);
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);
  const [savedDocumentNumber, setSavedDocumentNumber] = useState<string | null>(null);
  const [transportMode, setTransportMode] = useState<'MPL' | 'CO'>('MPL');
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
  const [rtSubType, setRtSubType] = useState<'padrao' | 'ampliado' | null>(null);
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
    photoLegends: [],
    aiAnalysisResult: '',
    isAnalyzing: false,
  });
  const [relatorioAmpliadoData, setRelatorioAmpliadoData] = useState<RelatorioAmpliadoData>({
    objetivo: '',
    blocks: [],
    legislacaoAplicada: [],
    outraLegislacao: '',
    consideracoesFinais: '',
    documentDate: new Date().toISOString().split('T')[0],
    documentTime: new Date().toTimeString().slice(0, 5),
  });
  const [coletaAmostraData, setColetaAmostraData] = useState<ColetaAmostraData>({
    categoriaProduto: 'ALIMENTO',
    produtos: [],
    amostras: [],
    laboratorio: '',
    motivoColeta: '',
    procedimentoColeta: '',
    condicaoArmazenamento: '',
    responsavelEntrega: '',
    documentDate: new Date().toISOString().split('T')[0],
    documentTime: new Date().toTimeString().slice(0, 5),
  });
  const [inutilizacaoData, setInutilizacaoData] = useState<InutilizacaoData>({
    produtos: [],
    metodoInutilizacao: '',
    localInutilizacao: '',
    testemunhas: '',
    justificativa: '',
    documentDate: new Date().toISOString().split('T')[0],
    documentTime: new Date().toTimeString().slice(0, 5),
  });
  const [apreensaoData, setApreensaoData] = useState<ApreensaoData>({
    produtos: [],
    lacreNumeros: [''],
    destinacao: 'Os produtos lacrados serão enviados para sede da Vigilância Sanitária de Goiânia para posterior Inutilização.',
    fielDepositario: true,
    observacoes: '',
    documentDate: new Date().toISOString().split('T')[0],
    documentTime: new Date().toTimeString().slice(0, 5),
  });
  const [interdicaoData, setInterdicaoData] = useState<InterdicaoData>({
    tipoInterdicao: '',
    areasInterditadas: '',
    motivoInterdicao: '',
    fundamentacaoLegal: '',
    condicoesDesinterdicao: '',
    usarChecklistDesinterdicao: false,
    checklistDesinterdicaoId: '',
    osNumero: '',
    observacoes: '',
    documentDate: new Date().toISOString().split('T')[0],
    documentTime: new Date().toTimeString().slice(0, 5),
  });
  const [advertenciaData, setAdvertenciaData] = useState<AdvertenciaData>({
    irregularidades: [],
    prazo: '',
    fundamentacaoLegal: '',
    orientacoes: '',
    documentDate: new Date().toISOString().split('T')[0],
    documentTime: new Date().toTimeString().slice(0, 5),
  });
  const [notificacaoData, setNotificacaoData] = useState<NotificacaoData>({
    assunto: '',
    conteudo: '',
    fundamentacaoLegal: '',
    prazoResposta: '',
    documentDate: new Date().toISOString().split('T')[0],
    documentTime: new Date().toTimeString().slice(0, 5),
  });
  const [replicaData, setReplicaData] = useState<ReplicaData>({
    documentoOrigem: '',
    numeroProcesso: '',
    folhasDefesa: '',
    descricaoInfracao: '',
    capitulacaoLegal: '',
    resumoDefesa: '',
    pontosDefesa: [],
    analiseDefesa: '',
    conclusao: '',
    fundamentacaoLegal: '',
    documentDate: new Date().toISOString().split('T')[0],
    documentTime: new Date().toTimeString().slice(0, 5),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiFileInputRef = useRef<HTMLInputElement>(null);
  const aiCameraInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const attachmentCameraRef = useRef<HTMLInputElement>(null);
  const autoInfracaoFileInputRef = useRef<HTMLInputElement>(null);
  const relatorioTecnicoFileInputRef = useRef<HTMLInputElement>(null);
  const relatorioTecnicoCameraRef = useRef<HTMLInputElement>(null);
  const coletaFileInputRef = useRef<HTMLInputElement>(null);
  const coletaCameraRef = useRef<HTMLInputElement>(null);
  const inutilizacaoFileInputRef = useRef<HTMLInputElement>(null);
  const inutilizacaoCameraRef = useRef<HTMLInputElement>(null);
  const apreensaoFileInputRef = useRef<HTMLInputElement>(null);
  const apreensaoCameraRef = useRef<HTMLInputElement>(null);
  const interdicaoFileInputRef = useRef<HTMLInputElement>(null);
  const interdicaoCameraRef = useRef<HTMLInputElement>(null);
  const replicaDefesaFileInputRef = useRef<HTMLInputElement>(null);
  const replicaDefesaCameraRef = useRef<HTMLInputElement>(null);
  const [defesaPhotos, setDefesaPhotos] = useState<{ id: string; file: File; previewUrl: string }[]>([]);
  const [extractingColetaData, setExtractingColetaData] = useState(false);
  const [extractingUploadData, setExtractingUploadData] = useState(false);
  const [surtoNumber, setSurtoNumber] = useState('');

  // Auto-save state
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const draftKey = `document_${tipo}_${establishment?.cnpj || 'new'}`;

  // Collect all form data for auto-save
  const collectFormData = useCallback(() => {
    return {
      method,
      selectedChecklist,
      selectedItems,
      categoryObservations,
      manualContent,
      deadlineDays,
      otrosContent,
      observations,
      dengueInspection,
      documentDate,
      documentTime,
      transportMode,
      certidaoData,
      visitaFiscalData,
      autoInfracaoData,
      relatorioTecnicoData,
      rtSubType,
      relatorioAmpliadoData,
      aiAnalysisText,
      aiPhotoLegends,
      aiAnalysisComplete,
      aiUploadedPhotoUrls,
      establishment,
      motivo,
      tipo,
    };
  }, [
    method, selectedChecklist, selectedItems, categoryObservations, manualContent, deadlineDays,
    otrosContent, observations, dengueInspection, documentDate, documentTime,
    transportMode, certidaoData, visitaFiscalData, autoInfracaoData,
    relatorioTecnicoData, rtSubType, relatorioAmpliadoData, aiAnalysisText, aiPhotoLegends, aiAnalysisComplete,
    aiUploadedPhotoUrls, establishment, motivo, tipo
  ]);

  // Auto-save to localStorage
  const saveToLocalStorage = useCallback(() => {
    try {
      setAutoSaveStatus('saving');
      const data = collectFormData();
      const draftData = {
        savedAt: new Date().toISOString(),
        data,
      };
      localStorage.setItem(`fiscaliz_draft_${draftKey}`, JSON.stringify(draftData));
      setLastAutoSave(new Date());
      setAutoSaveStatus('saved');
      
      // Reset status after 2 seconds
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('[AutoSave] Error:', error);
      setAutoSaveStatus('error');
    }
  }, [collectFormData, draftKey]);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(`fiscaliz_draft_${draftKey}`);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        const data = parsed.data;
        
        // Restore form data
        if (data.method) setMethod(data.method);
        if (data.selectedChecklist) setSelectedChecklist(data.selectedChecklist);
        if (data.selectedItems) setSelectedItems(data.selectedItems);
        if (data.categoryObservations) setCategoryObservations(data.categoryObservations);
        if (data.manualContent) setManualContent(data.manualContent);
        if (data.deadlineDays) setDeadlineDays(data.deadlineDays);
        if (data.otrosContent) setOtrosContent(data.otrosContent);
        if (data.observations) setObservations(data.observations);
        if (data.dengueInspection !== undefined) setDengueInspection(data.dengueInspection);
        if (data.documentDate) setDocumentDate(data.documentDate);
        if (data.documentTime) setDocumentTime(data.documentTime);
        if (data.transportMode) setTransportMode(data.transportMode);
        if (data.certidaoData) setCertidaoData(data.certidaoData);
        if (data.visitaFiscalData) setVisitaFiscalData(data.visitaFiscalData);
        if (data.autoInfracaoData) setAutoInfracaoData(data.autoInfracaoData);
        if (data.relatorioTecnicoData) setRelatorioTecnicoData(data.relatorioTecnicoData);
        if (data.aiAnalysisText) setAiAnalysisText(data.aiAnalysisText);
        if (data.aiUploadedPhotoUrls) setAiUploadedPhotoUrls(data.aiUploadedPhotoUrls);
        if (data.aiAnalysisComplete) setAiAnalysisComplete(data.aiAnalysisComplete);
        
        // Restore aiPhotoLegends with storage URLs as previewUrl (since blob URLs don't persist)
        if (data.aiPhotoLegends && data.aiUploadedPhotoUrls) {
          const restoredLegends = data.aiPhotoLegends.map((legend: AIPhotoLegend, idx: number) => ({
            ...legend,
            previewUrl: data.aiUploadedPhotoUrls[idx] || legend.previewUrl,
          }));
          setAiPhotoLegends(restoredLegends);
          console.log('[AutoSave] Restored legends with storage URLs:', restoredLegends.length);
        } else if (data.aiPhotoLegends) {
          setAiPhotoLegends(data.aiPhotoLegends);
        }
        
        setLastAutoSave(new Date(parsed.savedAt));
        
        toast({
          title: 'Rascunho recuperado',
          description: 'Seu trabalho anterior foi restaurado automaticamente.',
        });
      }
    } catch (error) {
      console.error('[AutoSave] Error loading draft:', error);
    }
  }, [draftKey]);

  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Mark as having unsaved changes when form data changes
  useEffect(() => {
    if (method || manualContent || selectedItems.length > 0 || aiPhotoLegends.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [method, manualContent, selectedItems, aiPhotoLegends, certidaoData, visitaFiscalData, autoInfracaoData, relatorioTecnicoData]);

  // Set up auto-save interval (every 5 seconds)
  useEffect(() => {
    autoSaveIntervalRef.current = setInterval(() => {
      saveToLocalStorage();
    }, 5000);

    // Warn user before leaving with unsaved changes
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      saveToLocalStorage();
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja sair mesmo assim?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveToLocalStorage, hasUnsavedChanges]);


  // Clear draft after successful save
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(`fiscaliz_draft_${draftKey}`);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('[AutoSave] Error clearing draft:', error);
    }
  }, [draftKey]);

  // Auto-select certidao method for certidao type
  const isCertidao = tipo === 'certidao';
  const isVisitaFiscal = tipo === 'visita_fiscal';
  const isAutoInfracao = tipo === 'auto_infracao';
  const isRelatorioTecnico = tipo === 'relatorio_tecnico';
  const isColetaAmostra = tipo === 'coleta_amostra';
  const isInutilizacao = tipo === 'inutilizacao';
  const isApreensao = tipo === 'apreensao';
  const isInterdicao = tipo === 'interdicao';
  const isAdvertencia = tipo === 'advertencia';
  const isNotificacao = tipo === 'notificacao';
  const isReplica = tipo === 'replica';
  const hasSpecificForm = isCertidao || isVisitaFiscal || isAutoInfracao || isRelatorioTecnico || isColetaAmostra || isInutilizacao || isApreensao || isInterdicao || isAdvertencia || isNotificacao || isReplica;
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

    const maxFiles = 50; // Todos os tipos de documentos suportam até 50 fotos
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
      if (rtSubType === 'ampliado') {
        return formatRelatorioAmpliadoContent(relatorioAmpliadoData);
      }
      return formatRelatorioTecnicoContent(relatorioTecnicoData);
    }
    if (isColetaAmostra) {
      return formatColetaAmostraContent(coletaAmostraData);
    }
    if (isInutilizacao) {
      return formatInutilizacaoContent(inutilizacaoData);
    }
    if (isApreensao) {
      return formatApreensaoContent(apreensaoData);
    }
    if (isInterdicao) {
      return formatInterdicaoContent(interdicaoData);
    }
    if (isAdvertencia) {
      return formatAdvertenciaContent(advertenciaData);
    }
    if (isNotificacao) {
      return formatNotificacaoContent(notificacaoData);
    }
    if (isReplica) {
      return formatReplicaContent(replicaData);
    }
    if (method === 'checklist' && currentChecklist) {
      const isRoteiro = currentChecklist.id === 'hipermercado';
      if (isRoteiro) {
        // Group by category with observations
        const cats = getAllCategories(currentChecklist);
        const lines: string[] = [];
        let idx = 1;
        cats.forEach(cat => {
          const catItems = currentChecklist.items.filter(i => i.category === cat && selectedItems.includes(i.id));
          if (catItems.length > 0) {
            lines.push(`\n[${cat}]`);
            catItems.forEach(item => {
              lines.push(`${idx}. ${item.text}`);
              idx++;
            });
            const obs = categoryObservations[cat];
            if (obs?.trim()) {
              lines.push(`Observações: ${obs.trim()}`);
            }
          }
        });
        return lines.join('\n');
      }
      const selectedItemsData = currentChecklist.items.filter(item => selectedItems.includes(item.id));
      return selectedItemsData.map((item, idx) => `${idx + 1}. ${item.text}`).join('\n');
    }
    if (method === 'outros') {
      return otrosContent;
    }
    return manualContent;
  };

  // Handle AI analysis - separate from save to allow editing legends
  const handleAIAnalysis = async () => {
    if (!user) return;
    if (uploadedImages.length === 0) {
      toast({
        title: 'Fotos necessárias',
        description: 'Adicione pelo menos 1 foto para análise por IA.',
        variant: 'destructive',
      });
      return;
    }

    setAiAnalyzing(true);
    
    try {
      // Upload photos in PARALLEL for faster processing
      const uploadedUrls: string[] = [];
      const tempDocId = crypto.randomUUID();
      
      toast({
        title: 'Enviando fotos...',
        description: `Fazendo upload de ${uploadedImages.length} foto(s)`,
      });

      const uploadPromises = uploadedImages.map(async (img) => {
        const fileExt = img.file.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/temp_${tempDocId}_${img.id}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('fiscal-photos')
          .upload(fileName, img.file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: signedData } = await supabase.storage.from('fiscal-photos').createSignedUrl(fileName, 3600);
        return signedData?.signedUrl;
      });

      const uploadResults = await Promise.all(uploadPromises);
      const validUrls = uploadResults.filter((url): url is string => Boolean(url));

      if (validUrls.length === 0) throw new Error('Nenhuma foto foi enviada com sucesso');

      toast({
        title: 'Analisando com IA...',
        description: 'Identificando irregularidades nas fotos',
      });

      const { data: aiData, error: aiError } = await supabase.functions.invoke('analyze-photos', {
        body: {
          documentType: tipo,
          photos: validUrls,
          establishmentType: establishment?.nome_fantasia || establishment?.razao_social || 'Estabelecimento de Alimentos',
          targetLegislation: 'RDC 216/2004 + Lei Municipal 8741/2008',
          observation: observations || undefined,
        },
      });

      if (aiError) throw aiError;
      
      const aiText = (aiData as any)?.text as string | undefined;
      
      // Handle new analysisResult.nonConformities format
      const nonConformities = (aiData as any)?.analysisResult?.nonConformities as Array<{
        foto: number; description: string; severity: string; legalBasis: string; recommendation: string; deadline: string;
      }> | undefined;

      // Also check legacy photoAnalysis format
      const legacyPhotoAnalysis = (aiData as any)?.photoAnalysis as Array<{
        foto: number; legenda: string; item_rdc: string; severity?: string; recommendation?: string; deadline?: string;
      }> | undefined;

      const legends: AIPhotoLegend[] = [];
      
      if (nonConformities && nonConformities.length > 0) {
        // New format: group by photo number
        for (let i = 0; i < uploadedImages.length; i++) {
          const photoNumber = i + 1;
          const photoNCs = nonConformities.filter(nc => nc.foto === photoNumber);
          legends.push({
            photoIndex: i,
            legenda: photoNCs.map(nc => nc.description).join('; ') || '',
            item_rdc: photoNCs.map(nc => (nc.legalBasis || '').replace('RDC 216/2004 - Item ', '')).filter(Boolean).join(', '),
            previewUrl: uploadedImages[i].previewUrl,
          });
        }
      } else if (legacyPhotoAnalysis && legacyPhotoAnalysis.length > 0) {
        // Legacy format
        for (let i = 0; i < uploadedImages.length; i++) {
          const aiLegend = legacyPhotoAnalysis.find(pa => pa.foto - 1 === i);
          legends.push({
            photoIndex: i,
            legenda: aiLegend?.legenda || '',
            item_rdc: aiLegend?.item_rdc || '',
            previewUrl: uploadedImages[i].previewUrl,
          });
        }
      } else {
        // Empty legends for manual editing
        for (let i = 0; i < uploadedImages.length; i++) {
          legends.push({ photoIndex: i, legenda: '', item_rdc: '', previewUrl: uploadedImages[i].previewUrl });
        }
      }
      
      if (aiText?.trim()) setAiAnalysisText(aiText);
      setAiPhotoLegends(legends);
      setAiUploadedPhotoUrls(validUrls);
      setAiAnalysisComplete(true);

      // Count photos with identified irregularities
      const identifiedCount = legends.filter(l => l.legenda.trim()).length;
      const pendingCount = legends.length - identifiedCount;

      const timedOut = (aiData as any)?.timedOut === true;
      if (timedOut) {
        toast({
          title: 'Tempo limite excedido',
          description: `Preencha as ${uploadedImages.length} irregularidade(s) manualmente.`,
          variant: 'destructive',
        });
      } else if (identifiedCount === 0) {
        toast({
          title: 'Nenhuma irregularidade identificada',
          description: `Preencha manualmente as ${uploadedImages.length} foto(s).`,
        });
      } else {
        toast({
          title: 'Análise concluída!',
          description: `${identifiedCount} identificada(s)${pendingCount > 0 ? `, ${pendingCount} para preencher` : ''}. Revise antes de salvar.`,
        });
      }

    } catch (error: any) {
      console.error('AI analysis error:', error);
      
      // On error, create empty legends for manual filling
      const fallbackLegends: AIPhotoLegend[] = uploadedImages.map((img, i) => ({
        photoIndex: i,
        legenda: '',
        item_rdc: '',
        previewUrl: img.previewUrl,
      }));
      setAiPhotoLegends(fallbackLegends);
      setAiAnalysisComplete(true);
      
      toast({
        title: 'Análise falhou',
        description: 'Preencha as irregularidades manualmente.',
        variant: 'destructive',
      });
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Update a specific photo legend
  const updatePhotoLegend = (photoIndex: number, field: 'legenda' | 'item_rdc', value: string) => {
    setAiPhotoLegends(prev => prev.map(legend => 
      legend.photoIndex === photoIndex 
        ? { ...legend, [field]: value }
        : legend
    ));
  };

  // State para controlar qual foto está sendo re-analisada
  const [reanalyzingPhoto, setReanalyzingPhoto] = useState<number | null>(null);

  // Re-analisar foto individual com a descrição editada
  const handleReanalyzePhoto = async (photoIndex: number, description: string, photoUrl: string) => {
    if (!description.trim()) return;
    
    setReanalyzingPhoto(photoIndex);
    
    try {
      const response = await supabase.functions.invoke('analyze-photos', {
        body: {
          documentType: 'suggest_legal_basis',
          photos: [photoUrl],
          description: description,
        },
      });

      if (response.error) throw response.error;
      
      const { photoAnalysis } = response.data || {};
      if (photoAnalysis && photoAnalysis.length > 0 && photoAnalysis[0].item_rdc) {
        updatePhotoLegend(photoIndex, 'item_rdc', photoAnalysis[0].item_rdc);
        toast({
          title: 'Dispositivo atualizado',
          description: `Item ${photoAnalysis[0].item_rdc} sugerido pela IA`,
        });
      } else {
        toast({
          title: 'Não foi possível identificar',
          description: 'Preencha o dispositivo legal manualmente',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error re-analyzing photo:', error);
      toast({
        title: 'Erro na análise',
        description: error.message || 'Não foi possível re-analisar a foto',
        variant: 'destructive',
      });
    } finally {
      setReanalyzingPhoto(null);
    }
  };

  // Handler que pede confirmação antes de salvar no modo AI
  const handleSaveWithConfirmation = () => {
    if (method === 'ai' && aiAnalysisComplete) {
      setShowSaveConfirmDialog(true);
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    if (!user) return;

    if (isAutoInfracao) {
      const hasNoInfracoes = autoInfracaoData.infracoes.length === 0;
      const hasInfracaoIncompleta = autoInfracaoData.infracoes.some(
        (inf) => !inf.descricao?.trim() || !inf.dispositivo?.trim()
      );

      if (hasNoInfracoes || hasInfracaoIncompleta) {
        toast({
          title: 'Auto de Infração incompleto',
          description: 'Adicione ao menos 1 infração com descrição e dispositivo legal antes de salvar.',
          variant: 'destructive',
        });
        return;
      }
    }

    setSaving(true);
    
    try {
      // Garantir sessão ativa antes de operações de banco
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !currentUser) {
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
      }

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
            cnae_principal: establishment.cnae_principal || null,
            alvara_numero: establishment.alvara_numero || null,
            responsavel_nome: establishment.responsavel_nome || null,
            created_by: currentUser.id,
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
          user_id: currentUser.id,
          establishment_id: establishmentId,
          reason: motivo as any,
          ...(motivo === 'surto' && surtoNumber.trim() ? { reason_details: `Surto nº ${surtoNumber.trim()}` } : {}),
        })
        .select()
        .single();

      if (actionError) throw actionError;

      // Deadline (apenas para Termo de Intimação)
      const parsedDeadlineDays = deadlineDays ? parseInt(deadlineDays, 10) : NaN;
      if (tipo === 'termo_intimacao') {
        if (!deadlineDays || Number.isNaN(parsedDeadlineDays)) {
          toast({
            title: 'Prazo obrigatório',
            description: 'Informe o prazo para adequação (1 a 45 dias) antes de salvar o Termo de Intimação.',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }
        if (parsedDeadlineDays < 1 || parsedDeadlineDays > 45) {
          toast({
            title: 'Prazo inválido',
            description: 'O prazo deve estar entre 1 e 45 dias.',
            variant: 'destructive',
          });
          setSaving(false);
          return;
        }
      }

      // Calculate deadline date (quando houver)
      const deadlineDate = new Date();
      if (!Number.isNaN(parsedDeadlineDays)) {
        deadlineDate.setDate(deadlineDate.getDate() + parsedDeadlineDays);
      }

      // Upload photos (if any) to storage, and keep only URLs in DB
      const plannedDocId = crypto.randomUUID();
      const uploadedUrls: string[] = [];

      if (uploadedImages.length > 0) {
        for (const img of uploadedImages) {
          const fileExt = img.file.name.split('.').pop() || 'jpg';
          const fileName = `${currentUser.id}/${plannedDocId}_${img.id}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('fiscal-photos')
            .upload(fileName, img.file, { upsert: true });
          if (uploadError) throw uploadError;

          const { data: signedData } = await supabase.storage.from('fiscal-photos').createSignedUrl(fileName, 3600);
          if (signedData?.signedUrl) uploadedUrls.push(signedData.signedUrl);
        }
      }

      // Create document
      let content = generateDocumentContent();

      // For AI method, use the already analyzed and edited legends
      // (analysis was done in handleAIAnalysis, user may have edited legends)
      let finalAiPhotoLegends: Array<{ photoIndex: number; legenda: string; item_rdc: string; }> = [];
      
      if (method === 'ai') {
        // Check for photos: uploaded URLs, pending images, or already analyzed photos in legends
        const hasPhotos = uploadedUrls.length > 0 || uploadedImages.length > 0 || aiPhotoLegends.length > 0;
        if (!hasPhotos) {
          throw new Error('Adicione pelo menos 1 foto para análise.');
        }
        
        // Use the pre-analyzed text and edited legends
        if (!aiAnalysisComplete || !aiAnalysisText) {
          throw new Error('Execute a análise por IA antes de salvar.');
        }
        
        content = aiAnalysisText;
        
        // Use edited legends (filter out empty ones)
        finalAiPhotoLegends = aiPhotoLegends
          .filter(l => l.legenda?.trim())
          .map(l => ({
            photoIndex: l.photoIndex,
            legenda: l.legenda,
            item_rdc: l.item_rdc,
          }));
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
      // Priority: newly uploaded URLs > AI analysis URLs > extract from legends previewUrl
      let photoUrlsForAttachments = uploadedUrls.length > 0 ? uploadedUrls : aiUploadedPhotoUrls;
      
      // Fallback: if neither has URLs but legends have previewUrls that are storage URLs (not blob:)
      if (photoUrlsForAttachments.length === 0 && aiPhotoLegends.length > 0) {
        const storageUrls = aiPhotoLegends
          .map(l => l.previewUrl)
          .filter((url): url is string => !!url && !url.startsWith('blob:'));
        if (storageUrls.length > 0) {
          photoUrlsForAttachments = storageUrls;
          console.log('[Save] Using URLs from legends previewUrl:', storageUrls.length);
        }
      }
      
      console.log('[Save] Photo URLs for attachments:', photoUrlsForAttachments.length, 
        'uploadedUrls:', uploadedUrls.length, 
        'aiUploadedPhotoUrls:', aiUploadedPhotoUrls.length,
        'aiPhotoLegends:', aiPhotoLegends.length);
      
      const attachments = photoUrlsForAttachments.length > 0
        ? photoUrlsForAttachments.map((url, idx) => ({
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
          transport_mode: transportMode,
        };
      } else if (isAutoInfracao) {
        contentObj = {
          text: content,
          method: 'auto_infracao',
          auto_infracao_data: autoInfracaoData,
          document_date: autoInfracaoData.documentDate,
          document_time: autoInfracaoData.documentTime,
          prazo_defesa: autoInfracaoData.prazoDefesa,
          transport_mode: transportMode,
        };
      } else if (isRelatorioTecnico) {
        if (rtSubType === 'ampliado') {
          // Upload block photos to storage
          const blockPhotoUrls: Record<string, string> = {};
          for (const block of relatorioAmpliadoData.blocks) {
            if (block.type === 'photo' && block.photoFile) {
              const fileExt = block.photoFile.name.split('.').pop() || 'jpg';
              const fileName = `${currentUser.id}/${plannedDocId}_block_${block.id}.${fileExt}`;
              const { error: uploadError } = await supabase.storage
                .from('fiscal-photos')
                .upload(fileName, block.photoFile, { upsert: true });
              if (uploadError) throw uploadError;
              const { data: signedData } = await supabase.storage.from('fiscal-photos').createSignedUrl(fileName, 3600);
              if (signedData?.signedUrl) {
                blockPhotoUrls[block.id] = signedData.signedUrl;
                uploadedUrls.push(signedData.signedUrl);
              }
            }
          }

          // Serialize blocks with storage URLs instead of blob URLs
          const serializedBlocks = relatorioAmpliadoData.blocks.map(b => ({
            id: b.id,
            type: b.type,
            text: b.text,
            photoUrl: blockPhotoUrls[b.id] || b.photoPreviewUrl,
            photoLegend: b.photoLegend,
          }));

          contentObj = {
            text: content,
            method: 'ampliado',
            rt_sub_type: 'ampliado',
            relatorio_ampliado_data: {
              ...relatorioAmpliadoData,
              blocks: serializedBlocks,
            },
            document_date: relatorioAmpliadoData.documentDate,
            document_time: relatorioAmpliadoData.documentTime,
            transport_mode: transportMode,
          };
        } else {
          // Include photoLegends from RT form data when available
          const rtPhotoLegends = relatorioTecnicoData.photoLegends
            .filter(l => l.legenda?.trim())
            .map(l => ({ photoIndex: l.photoIndex, legenda: l.legenda, item_rdc: l.item_rdc, previewUrl: l.previewUrl }));
          
          // If upload method, add the uploaded file as an attachment
          if (relatorioTecnicoData.method === 'upload' && relatorioTecnicoData.uploadedFileUrl) {
            const uploadAttachment = {
              id: 'uploaded_report',
              url: relatorioTecnicoData.uploadedFileUrl,
              type: 'document',
              name: relatorioTecnicoData.uploadedFileName || 'relatorio_importado',
            };
            if (attachments) {
              attachments.push(uploadAttachment);
            } else {
              photoUrlsForAttachments = [relatorioTecnicoData.uploadedFileUrl];
            }
          }

          contentObj = {
            text: content,
            method: relatorioTecnicoData.method || 'manual',
            relatorio_tecnico_data: relatorioTecnicoData,
            document_date: relatorioTecnicoData.documentDate,
            document_time: relatorioTecnicoData.documentTime,
            equipe: relatorioTecnicoData.equipe,
            transport_mode: transportMode,
            ...(relatorioTecnicoData.uploadedFileUrl && { uploaded_file_url: relatorioTecnicoData.uploadedFileUrl }),
            ...(relatorioTecnicoData.uploadedFileName && { uploaded_file_name: relatorioTecnicoData.uploadedFileName }),
            ...(rtPhotoLegends.length > 0 && { photoLegends: rtPhotoLegends }),
          };
        }
      } else if (isColetaAmostra) {
        contentObj = {
          text: content,
          method: 'coleta_amostra',
          coleta_amostra_data: coletaAmostraData,
          document_date: coletaAmostraData.documentDate,
          document_time: coletaAmostraData.documentTime,
          transport_mode: transportMode,
        };
      } else if (isInutilizacao) {
        contentObj = {
          text: content,
          method: 'inutilizacao',
          inutilizacao_data: inutilizacaoData,
          document_date: inutilizacaoData.documentDate,
          document_time: inutilizacaoData.documentTime,
          transport_mode: transportMode,
          total_weight_kg: inutilizacaoData.produtos.reduce((sum, p) => sum + (parseFloat(p.pesoKg) || 0), 0),
        };
      } else if (isApreensao) {
        contentObj = {
          text: content,
          method: 'apreensao',
          apreensao_data: apreensaoData,
          document_date: apreensaoData.documentDate,
          document_time: apreensaoData.documentTime,
          transport_mode: transportMode,
        };
      } else if (isInterdicao) {
        contentObj = {
          text: content,
          method: 'interdicao',
          interdicao_data: interdicaoData,
          document_date: interdicaoData.documentDate,
          document_time: interdicaoData.documentTime,
          transport_mode: transportMode,
          is_partial: interdicaoData.tipoInterdicao === 'parcial',
        };
      } else if (isAdvertencia) {
        contentObj = {
          text: content,
          method: 'advertencia',
          advertencia_data: advertenciaData,
          document_date: advertenciaData.documentDate,
          document_time: advertenciaData.documentTime,
          transport_mode: transportMode,
        };
      } else if (isNotificacao) {
        contentObj = {
          text: content,
          method: 'notificacao',
          notificacao_data: notificacaoData,
          document_date: notificacaoData.documentDate,
          document_time: notificacaoData.documentTime,
          transport_mode: transportMode,
        };
      } else if (isReplica) {
        contentObj = {
          text: content,
          method: 'replica',
          replica_data: replicaData,
          document_date: replicaData.documentDate,
          document_time: replicaData.documentTime,
          transport_mode: transportMode,
        };
      } else {
        contentObj = {
          text: content,
          method,
          observations: observations.trim() || null,
          dengue_inspection: dengueInspection,
          document_date: documentDate,
          document_time: documentTime,
          transport_mode: transportMode,
          ...(denunciaContext.trim() && {
            denuncia_context: denunciaContext.trim(),
          }),
          ...(method === 'checklist' && Object.keys(categoryObservations).some(k => categoryObservations[k]?.trim()) && {
            category_observations: categoryObservations,
          }),
          ...(method === 'ai' && finalAiPhotoLegends.length > 0 && {
            photoLegends: finalAiPhotoLegends,
          }),
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
        if (rtSubType === 'ampliado') {
          // Extract irregularities from text blocks that mention legal references
          finalIrregularities = relatorioAmpliadoData.blocks
            .filter(b => b.type === 'photo' && b.photoLegend?.trim())
            .map((b, idx) => ({
              id: `ampliado_${idx}`,
              text: b.photoLegend || '',
              category: 'Irregularidade',
              legislation: '',
            }));
        } else {
          // Use manual irregularidades if available, otherwise auto-map from photoLegends
          if (relatorioTecnicoData.irregularidades.length > 0) {
            finalIrregularities = relatorioTecnicoData.irregularidades.map(irr => ({
              id: irr.id,
              text: irr.descricao,
              category: 'Irregularidade',
              legislation: irr.dispositivo,
            }));
          } else if (relatorioTecnicoData.photoLegends.filter(l => l.legenda?.trim()).length > 0) {
            // Auto-map from AI photo legends
            finalIrregularities = relatorioTecnicoData.photoLegends
              .filter(l => l.legenda?.trim())
              .map((l, idx) => ({
                id: `ai_${idx}`,
                text: l.legenda,
                category: 'Irregularidade',
                legislation: l.item_rdc || '',
              }));
          }
        }
      } else if (isAdvertencia) {
        finalIrregularities = advertenciaData.irregularidades.map(item => ({
          id: item.id,
          text: item.descricao,
          category: 'Advertência',
          legislation: item.dispositivo,
        }));
      }

      // Obter número sequencial do documento (se aplicável)
      let documentNumber: string | null = null;
      try {
        documentNumber = await getNextDocumentNumber(tipo);
      } catch (numError) {
        console.error('Error getting document number:', numError);
        // Continuar sem número - não é crítico
      }

      const insertData: any = {
        id: plannedDocId,
        user_id: currentUser.id,
        establishment_id: establishmentId,
        fiscal_action_id: action.id,
        document_type: tipo,
        document_number: documentNumber,
        content: contentObj,
        irregularities: finalIrregularities,
        attachments,
        deadline_days: tipo === 'termo_intimacao' ? parsedDeadlineDays : (isAdvertencia && advertenciaData.prazo ? parseInt(advertenciaData.prazo) : null),
        deadline_date: tipo === 'termo_intimacao' ? deadlineDate.toISOString().split('T')[0] : null,
        priority: motivo === 'denuncia' || motivo === 'surto' || isAutoInfracao || isInterdicao ? 'high' : 'medium',
        action_date: documentDate || new Date().toISOString().split('T')[0],
        total_weight_kg: isInutilizacao ? inutilizacaoData.produtos.reduce((sum, p) => sum + (parseFloat(p.pesoKg) || 0), 0) : null,
        is_partial_interdiction: isInterdicao ? interdicaoData.tipoInterdicao === 'parcial' : null,
        seal_number: isApreensao ? apreensaoData.lacreNumeros.filter(l => l.trim()).join(', ') : null,
      };

      const { data: newDoc, error: docError } = await supabase
        .from('fiscal_documents')
        .insert(insertData)
        .select()
        .single();

      if (docError) throw docError;

      // Clear auto-saved draft after successful save
      clearDraft();

      toast({
        title: 'Documento salvo!',
        description: `${documentTypeLabels[tipo]} criado com sucesso.`,
      });

      // Se motivo é denúncia, abre formulário de resposta antes de navegar
      if (motivo === 'investigativa' || motivo === 'denuncia') {
        setSavedDocumentId(newDoc.id);
        setSavedDocumentNumber(documentNumber);
        setShowDenunciaResponse(true);
      } else {
        navigate(`/documento/${newDoc.id}`);
      }
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
      
      {/* Auto-save indicator */}
      <div className="fixed top-16 right-4 z-40">
        {autoSaveStatus === 'saving' && (
          <Badge variant="secondary" className="gap-1 animate-pulse">
            <Loader2 className="h-3 w-3 animate-spin" />
            Salvando...
          </Badge>
        )}
        {autoSaveStatus === 'saved' && (
          <Badge variant="outline" className="gap-1 bg-background text-primary border-primary/50">
            <Check className="h-3 w-3" />
            Salvo localmente
          </Badge>
        )}
        {autoSaveStatus === 'error' && (
          <Badge variant="destructive" className="gap-1">
            <CloudOff className="h-3 w-3" />
            Erro ao salvar
          </Badge>
        )}
        {lastAutoSave && autoSaveStatus === 'idle' && (
          <Badge variant="outline" className="gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            Último: {lastAutoSave.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </Badge>
        )}
      </div>
      
      <div className="p-4 space-y-4">
        {/* Número do Surto - quando motivo é surto */}
        {motivo === 'surto' && (
          <Card className="border-0 shadow-sm bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Badge variant="destructive" className="text-xs">SURTO</Badge>
                <div className="flex-1">
                  <Label htmlFor="surtoNumber" className="text-xs font-medium text-muted-foreground">Nº do Surto</Label>
                  <Input
                    id="surtoNumber"
                    value={surtoNumber}
                    onChange={(e) => setSurtoNumber(e.target.value)}
                    placeholder="Ex: 2/2026"
                    className="h-8 mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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

            <TransportModeSelector
              value={transportMode}
              onChange={setTransportMode}
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
              photos={uploadedImages.map(img => ({ id: img.id, previewUrl: img.previewUrl, file: img.file }))}
              onAddPhoto={() => autoInfracaoFileInputRef.current?.click()}
              onCapturePhoto={() => document.getElementById('autoInfracaoCameraInput')?.click()}
              onRemovePhoto={removeImage}
              photosRequired={false}
            />

            <TransportModeSelector
              value={transportMode}
              onChange={setTransportMode}
            />

            <Button 
              className="w-full" 
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar Auto de Infração'}
            </Button>
          </>
        )}

        {/* Relatório Técnico Form - with sub-type and method selection */}
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

            {/* Sub-type selection */}
            {rtSubType === null && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-semibold text-center">Tipo de Relatório Técnico</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRtSubType('padrao')}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <div className="rounded-lg p-2 bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <span className="text-sm font-medium">RT Padrão</span>
                      <span className="text-[10px] text-muted-foreground text-center">Seções estruturadas com IA ou manual</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRtSubType('ampliado')}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <div className="rounded-lg p-2 bg-warning/10">
                        <FileText className="h-6 w-6 text-warning" />
                      </div>
                      <span className="text-sm font-medium">RT Ampliado</span>
                      <span className="text-[10px] text-muted-foreground text-center">Narrativa livre com fotos intercaladas</span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* RT Padrão */}
            {rtSubType === 'padrao' && (
              <>
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
                  checklistItems={selectedChecklist ? checklistTemplates.find(c => c.id === selectedChecklist)?.items
                    .filter(item => selectedItems.length === 0 || selectedItems.includes(item.id))
                    .map(item => `${item.text} (${item.legislation || ''})`) : undefined}
                />

                <TransportModeSelector
                  value={transportMode}
                  onChange={setTransportMode}
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
                      (
                        !relatorioTecnicoData.descricao.trim() && 
                        relatorioTecnicoData.irregularidades.length === 0 &&
                        relatorioTecnicoData.photoLegends.filter(l => l.legenda.trim()).length === 0
                      ) || 
                      saving ||
                      relatorioTecnicoData.isAnalyzing
                    }
                  >
                    {saving ? 'Salvando...' : 'Salvar Relatório Técnico'}
                  </Button>
                )}
              </>
            )}

            {/* RT Ampliado */}
            {rtSubType === 'ampliado' && (
              <>
                <RelatorioTecnicoAmpliadoForm
                  value={relatorioAmpliadoData}
                  onChange={setRelatorioAmpliadoData}
                  photos={uploadedImages.map(img => ({ id: img.id, file: img.file, previewUrl: img.previewUrl }))}
                  onAddPhoto={() => relatorioTecnicoFileInputRef.current?.click()}
                  onCapturePhoto={() => relatorioTecnicoCameraRef.current?.click()}
                  onRemovePhoto={removeImage}
                />

                <TransportModeSelector
                  value={transportMode}
                  onChange={setTransportMode}
                />

                <Button 
                  className="w-full" 
                  onClick={handleSave}
                  disabled={
                    (!relatorioAmpliadoData.objetivo.trim() && relatorioAmpliadoData.blocks.length === 0) || 
                    saving
                  }
                >
                  {saving ? 'Salvando...' : 'Salvar Relatório Técnico Ampliado'}
                </Button>
              </>
            )}
          </>
        )}

        {/* Coleta de Amostra Form */}
        {isColetaAmostra && (
          <>
            <Card className="border-0 shadow-sm bg-secondary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-secondary" />
                  <div>
                    <p className="font-medium">{establishment?.nome_fantasia || establishment?.razao_social}</p>
                    <p className="text-sm text-muted-foreground">{establishment?.endereco}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <input ref={coletaFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, false)} />
            <input ref={coletaCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e, false)} />
            {/* Upload de documento em papel */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3 mb-1">
                  <Upload className="h-5 w-5 text-secondary" />
                  <div>
                    <h3 className="font-semibold text-sm">Upload de Documento em Papel</h3>
                    <p className="text-xs text-muted-foreground">Tire foto do formulário preenchido à mão</p>
                  </div>
                </div>

                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border">
                        <img src={img.previewUrl} alt={`Documento ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadedImages.length < 10 && (
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => coletaCameraRef.current?.click()} className="flex-1 h-12">
                      <Camera className="h-5 w-5 mr-2" />
                      Capturar
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => coletaFileInputRef.current?.click()} className="flex-1 h-12">
                      <FolderOpen className="h-5 w-5 mr-2" />
                      Galeria
                    </Button>
                  </div>
                )}

                {/* Action buttons after upload */}
                {uploadedImages.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground font-medium">O que deseja fazer com o documento?</p>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="premium"
                        size="sm"
                        className="w-full h-12"
                        disabled={extractingColetaData}
                        onClick={async () => {
                          setExtractingColetaData(true);
                          try {
                            const imagesBase64: string[] = [];
                            for (const img of uploadedImages) {
                              const reader = new FileReader();
                              const base64 = await new Promise<string>((resolve) => {
                                reader.onload = () => resolve(reader.result as string);
                                reader.readAsDataURL(img.file);
                              });
                              imagesBase64.push(base64);
                            }

                            const { data: fnData, error: fnError } = await supabase.functions.invoke('extract-coleta-data', {
                              body: { imagesBase64 },
                            });

                            if (fnError) throw fnError;
                            if (fnData?.error) throw new Error(fnData.error);

                            const extracted = fnData?.data;
                            if (extracted?.produtos && extracted.produtos.length > 0) {
                              const produtos = extracted.produtos.map((p: any, idx: number) => ({
                                ...createEmptyProduto(),
                                ...Object.fromEntries(
                                  Object.entries(p).filter(([_, v]) => v !== null && v !== undefined && v !== '')
                                ),
                                id: `prod_${Date.now()}_${idx}`,
                                involucros: p.involucros?.length > 0 ? p.involucros : createEmptyProduto().involucros,
                              }));

                              setColetaAmostraData(prev => ({
                                ...prev,
                                categoriaProduto: extracted.categoriaProduto || prev.categoriaProduto,
                                produtos,
                              }));

                              toast({
                                title: 'Dados extraídos com sucesso!',
                                description: `${produtos.length} produto(s) identificado(s). Revise os dados no formulário abaixo.`,
                              });
                            } else {
                              toast({
                                title: 'Nenhum produto encontrado',
                                description: 'Não foi possível identificar produtos na imagem. Preencha manualmente.',
                                variant: 'destructive',
                              });
                            }
                          } catch (err: any) {
                            console.error('Extract coleta data error:', err);
                            toast({
                              title: 'Erro na extração',
                              description: err.message || 'Não foi possível extrair os dados. Tente com uma foto mais clara.',
                              variant: 'destructive',
                            });
                          } finally {
                            setExtractingColetaData(false);
                          }
                        }}
                      >
                        {extractingColetaData ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Extraindo dados...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5 mr-2" />
                            Preencher formulário por IA
                          </>
                        )}
                      </Button>
                      <p className="text-[10px] text-muted-foreground text-center">
                        A IA vai ler o documento e preencher o formulário automaticamente
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <ColetaAmostraForm
              value={coletaAmostraData}
              onChange={setColetaAmostraData}
              photos={uploadedImages.map(img => ({ id: img.id, previewUrl: img.previewUrl }))}
              onAddPhoto={() => coletaFileInputRef.current?.click()}
              onCapturePhoto={() => coletaCameraRef.current?.click()}
              onRemovePhoto={removeImage}
            />
            <TransportModeSelector value={transportMode} onChange={setTransportMode} />
            <Button className="w-full" onClick={handleSave} disabled={coletaAmostraData.produtos.length === 0 || saving}>
              {saving ? 'Salvando...' : 'Salvar Coleta de Amostra'}
            </Button>
          </>
        )}

        {/* Inutilização Form */}
        {isInutilizacao && (
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
            <input ref={inutilizacaoFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, false)} />
            <input ref={inutilizacaoCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e, false)} />
            <InutilizacaoForm
              value={inutilizacaoData}
              onChange={setInutilizacaoData}
              photos={uploadedImages.map(img => ({ id: img.id, previewUrl: img.previewUrl }))}
              onAddPhoto={() => inutilizacaoFileInputRef.current?.click()}
              onCapturePhoto={() => inutilizacaoCameraRef.current?.click()}
              onRemovePhoto={removeImage}
            />
            <TransportModeSelector value={transportMode} onChange={setTransportMode} />
            <Button className="w-full" onClick={handleSave} disabled={inutilizacaoData.produtos.length === 0 || saving}>
              {saving ? 'Salvando...' : 'Salvar Inutilização'}
            </Button>
          </>
        )}

        {/* Apreensão Form */}
        {isApreensao && (
          <>
            <Card className="border-0 shadow-sm bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-warning" />
                  <div>
                    <p className="font-medium">{establishment?.nome_fantasia || establishment?.razao_social}</p>
                    <p className="text-sm text-muted-foreground">{establishment?.endereco}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <input ref={apreensaoFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, false)} />
            <input ref={apreensaoCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e, false)} />
            <ApreensaoForm
              value={apreensaoData}
              onChange={setApreensaoData}
              photos={uploadedImages.map(img => ({ id: img.id, previewUrl: img.previewUrl }))}
              onAddPhoto={() => apreensaoFileInputRef.current?.click()}
              onCapturePhoto={() => apreensaoCameraRef.current?.click()}
              onRemovePhoto={removeImage}
            />
            <TransportModeSelector value={transportMode} onChange={setTransportMode} />
            <Button className="w-full" onClick={handleSave} disabled={apreensaoData.produtos.length === 0 || saving}>
              {saving ? 'Salvando...' : 'Salvar Apreensão'}
            </Button>
          </>
        )}

        {/* Interdição Form */}
        {isInterdicao && (
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
            <input ref={interdicaoFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, false)} />
            <input ref={interdicaoCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleImageUpload(e, false)} />
            <InterdicaoForm
              value={interdicaoData}
              onChange={setInterdicaoData}
              photos={uploadedImages.map(img => ({ id: img.id, previewUrl: img.previewUrl }))}
              onAddPhoto={() => interdicaoFileInputRef.current?.click()}
              onCapturePhoto={() => interdicaoCameraRef.current?.click()}
              onRemovePhoto={removeImage}
            />
            <TransportModeSelector value={transportMode} onChange={setTransportMode} />
            <Button className="w-full" onClick={handleSave} disabled={!interdicaoData.tipoInterdicao || !interdicaoData.motivoInterdicao || uploadedImages.length === 0 || saving}>
              {saving ? 'Salvando...' : 'Salvar Interdição'}
            </Button>
          </>
        )}

        {/* Advertência Form */}
        {isAdvertencia && (
          <>
            <Card className="border-0 shadow-sm bg-warning/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-warning" />
                  <div>
                    <p className="font-medium">{establishment?.nome_fantasia || establishment?.razao_social}</p>
                    <p className="text-sm text-muted-foreground">{establishment?.endereco}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <AdvertenciaForm value={advertenciaData} onChange={setAdvertenciaData} />
            <TransportModeSelector value={transportMode} onChange={setTransportMode} />
            <Button className="w-full" onClick={handleSave} disabled={advertenciaData.irregularidades.length === 0 || saving}>
              {saving ? 'Salvando...' : 'Salvar Advertência'}
            </Button>
          </>
        )}

        {/* Notificação Form */}
        {isNotificacao && (
          <>
            <Card className="border-0 shadow-sm bg-info/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-info" />
                  <div>
                    <p className="font-medium">{establishment?.nome_fantasia || establishment?.razao_social}</p>
                    <p className="text-sm text-muted-foreground">{establishment?.endereco}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <NotificacaoForm value={notificacaoData} onChange={setNotificacaoData} />
            <TransportModeSelector value={transportMode} onChange={setTransportMode} />
            <Button className="w-full" onClick={handleSave} disabled={!notificacaoData.assunto.trim() || !notificacaoData.conteudo.trim() || saving}>
              {saving ? 'Salvando...' : 'Salvar Notificação'}
            </Button>
          </>
        )}

        {/* Réplica Form */}
        {isReplica && (
          <>
            <Card className="border-0 shadow-sm bg-muted">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{establishment?.nome_fantasia || establishment?.razao_social}</p>
                    <p className="text-sm text-muted-foreground">{establishment?.endereco}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <input ref={replicaDefesaFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => {
              if (e.target.files) {
                const newPhotos = Array.from(e.target.files).map(file => ({
                  id: `defesa_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  file,
                  previewUrl: URL.createObjectURL(file),
                }));
                setDefesaPhotos(prev => [...prev, ...newPhotos]);
              }
              e.target.value = '';
            }} />
            <input ref={replicaDefesaCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => {
              if (e.target.files) {
                const newPhotos = Array.from(e.target.files).map(file => ({
                  id: `defesa_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                  file,
                  previewUrl: URL.createObjectURL(file),
                }));
                setDefesaPhotos(prev => [...prev, ...newPhotos]);
              }
              e.target.value = '';
            }} />
            <ReplicaForm 
              value={replicaData} 
              onChange={setReplicaData}
              defesaPhotos={defesaPhotos.map(p => ({ id: p.id, previewUrl: p.previewUrl }))}
              onAddDefesaPhoto={() => replicaDefesaFileInputRef.current?.click()}
              onCaptureDefesaPhoto={() => replicaDefesaCameraRef.current?.click()}
              onRemoveDefesaPhoto={(idx) => {
                setDefesaPhotos(prev => {
                  const updated = [...prev];
                  URL.revokeObjectURL(updated[idx].previewUrl);
                  updated.splice(idx, 1);
                  return updated;
                });
              }}
            />
            <Button className="w-full" onClick={handleSave} disabled={!replicaData.analiseDefesa.trim() || saving}>
              {saving ? 'Salvando...' : 'Salvar Réplica'}
            </Button>
          </>
        )}

        {/* Contexto da Denúncia - para Inspeção Investigativa */}
        {motivo === 'investigativa' && (
          <Card className="border-0 shadow-sm border-l-4 border-l-warning">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-semibold text-sm">Contexto da Denúncia / Demanda</p>
                  <p className="text-xs text-muted-foreground">Cole o texto ou faça upload da denúncia que originou esta inspeção</p>
                </div>
              </div>
              <Textarea
                value={denunciaContext}
                onChange={(e) => setDenunciaContext(e.target.value)}
                placeholder="Cole aqui o texto da denúncia, ofício ou demanda que motivou esta inspeção investigativa..."
                className="min-h-[120px] text-sm"
              />
              <div className="flex gap-2">
                <input
                  ref={denunciaFileInputRef}
                  type="file"
                  accept=".txt,.pdf,.doc,.docx,image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.type.startsWith('image/')) {
                      toast({ title: 'Imagem selecionada', description: 'Para imagens, use a captura de fotos na seção de evidências.' });
                      return;
                    }
                    try {
                      const text = await file.text();
                      setDenunciaContext(prev => prev ? prev + '\n\n---\n\n' + text : text);
                      toast({ title: 'Arquivo importado', description: `Conteúdo de "${file.name}" adicionado ao contexto.` });
                    } catch {
                      toast({ title: 'Erro ao ler arquivo', description: 'Não foi possível extrair o texto do arquivo.', variant: 'destructive' });
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => denunciaFileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Importar arquivo
                </Button>
                {denunciaContext && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDenunciaContext('')}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
              {denunciaContext && (
                <p className="text-xs text-muted-foreground">
                  ✓ {denunciaContext.length} caracteres · Este texto será incluído no documento final
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Method Selection - for types without specific forms (termo_intimacao only now) */}
        {!method && !hasSpecificForm && (
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
                        {currentChecklist.id === 'hipermercado' && (
                          <div className="mt-3 pt-3 border-t">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Observações — {category}
                            </label>
                            <textarea
                              className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              placeholder="Anotações do fiscal para este bloco..."
                              value={categoryObservations[category] || ''}
                              onChange={(e) => setCategoryObservations(prev => ({ ...prev, [category]: e.target.value }))}
                            />
                          </div>
                        )}
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
              transportMode={transportMode}
              onTransportChange={setTransportMode}
              showTransport={true}
            />

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedChecklist(null)}>
                Voltar
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSave}
                disabled={(selectedItems.length === 0 && relatorioTecnicoData.photoLegends.filter(l => l.legenda.trim()).length === 0) || saving || (tipo === 'termo_intimacao' && !dengueInspection)}
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

            {/* Photo Upload for inutilização, apreensão, interdicao */}
            {(tipo === 'inutilizacao' || tipo === 'apreensao' || tipo === 'interdicao') && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Registro Fotográfico</span>
                      <Badge variant="outline" className="text-xs">Opcional</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{uploadedImages.length}/10</span>
                  </div>
                  
                  <input
                    ref={attachmentInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, false)}
                  />
                  <input
                    ref={attachmentCameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, false)}
                  />

                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                          <img src={img.previewUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
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
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => attachmentCameraRef.current?.click()}
                        className="flex-1 h-12"
                      >
                        <Camera className="h-5 w-5 mr-2" />
                        Capturar
                      </Button>
                      <Button
                        type="button"
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
            )}

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
              transportMode={transportMode}
              onTransportChange={setTransportMode}
              showTransport={true}
            />

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setMethod(null)}>
                Voltar
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSave}
                disabled={
                  !manualContent.trim() || 
                  saving || 
                  (tipo === 'termo_intimacao' && !dengueInspection)
                }
              >
                {saving ? 'Salvando...' : 'Salvar Documento'}
              </Button>
            </div>
          </>
        )}

        {/* AI Method - Photo Upload and Legend Editing */}
        {method === 'ai' && (
          <>
            {/* Step 1: Photo Upload (before analysis) */}
            {!aiAnalysisComplete && (
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
                            disabled={aiAnalyzing}
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

                  {uploadedImages.length < 50 && !aiAnalyzing && (
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
            )}

            {/* Step 2: Legend Editing (after analysis) */}
            {aiAnalysisComplete && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-semibold text-primary">Análise Concluída</h3>
                        <p className="text-sm text-muted-foreground">
                          Revise e edite as legendas antes de salvar
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setAiAnalysisComplete(false);
                        setAiPhotoLegends([]);
                        setAiAnalysisText('');
                        setAiUploadedPhotoUrls([]);
                      }}
                    >
                      Refazer análise
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {aiPhotoLegends.map((legend, idx) => (
                      <div key={idx} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                        <div className="flex gap-3">
                          <div className="w-20 h-20 flex-shrink-0">
                            <img 
                              src={legend.previewUrl || uploadedImages[legend.photoIndex]?.previewUrl} 
                              alt={`Foto ${legend.photoIndex + 1}`} 
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={legend.legenda ? "default" : "secondary"} className="text-xs">
                                Foto {legend.photoIndex + 1}
                              </Badge>
                              {legend.legenda && (
                                <Badge variant="outline" className="text-xs text-destructive border-destructive/50">
                                  Irregularidade
                                </Badge>
                              )}
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Descrição da irregularidade</Label>
                              <Textarea
                                value={legend.legenda}
                                onChange={(e) => updatePhotoLegend(legend.photoIndex, 'legenda', e.target.value)}
                                placeholder="Descreva a irregularidade visível na foto (deixe vazio se não houver)"
                                className="text-sm min-h-[60px]"
                                maxLength={150}
                              />
                            </div>
                            <div className="flex gap-2 items-end">
                              <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">Item RDC 216/2004</Label>
                                <Input
                                  value={legend.item_rdc}
                                  onChange={(e) => updatePhotoLegend(legend.photoIndex, 'item_rdc', e.target.value)}
                                  placeholder="Ex: 4.1.3"
                                  className="text-sm"
                                />
                              </div>
                              {legend.legenda?.trim() && (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="flex-shrink-0 gap-1 text-xs"
                                  disabled={reanalyzingPhoto === legend.photoIndex}
                                  onClick={() => {
                                    const photoUrl = legend.previewUrl || uploadedImages[legend.photoIndex]?.previewUrl;
                                    if (photoUrl) {
                                      handleReanalyzePhoto(legend.photoIndex, legend.legenda, photoUrl);
                                    }
                                  }}
                                >
                                  {reanalyzingPhoto === legend.photoIndex ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Sparkles className="h-3 w-3" />
                                  )}
                                  Sugerir
                                </Button>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground italic">
                              Edite a descrição e clique em "Sugerir" para a IA recomendar o dispositivo legal correto
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    {aiPhotoLegends.filter(l => l.legenda?.trim()).length} de {aiPhotoLegends.length} fotos com irregularidades
                  </p>
                </CardContent>
              </Card>
            )}

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
              transportMode={transportMode}
              onTransportChange={setTransportMode}
              showTransport={true}
            />

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => { 
                  setMethod(null); 
                  setUploadedImages([]); 
                  setAiAnalysisComplete(false);
                  setAiPhotoLegends([]);
                  setAiAnalysisText('');
                  setAiUploadedPhotoUrls([]);
                }}
              >
                Voltar
              </Button>
              
              {!aiAnalysisComplete ? (
                <Button 
                  className="flex-1" 
                  onClick={handleAIAnalysis}
                  disabled={uploadedImages.length === 0 || aiAnalyzing || (tipo === 'termo_intimacao' && !dengueInspection)}
                >
                  {aiAnalyzing ? (
                    <>
                      <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analisar com IA
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  className="flex-1" 
                  onClick={handleSaveWithConfirmation}
                  disabled={saving || (tipo === 'termo_intimacao' && !dengueInspection)}
                >
                  {saving ? 'Salvando...' : 'Salvar Documento'}
                </Button>
              )}
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

                {/* AI extraction for all document types with specific forms */}
                {uploadedImages.length > 0 && (hasSpecificForm || tipo === 'termo_intimacao') && !isCertidao && !isRelatorioTecnico && !isColetaAmostra && (
                  <div className="space-y-2 pt-2 border-t border-border/50">
                    <p className="text-xs text-muted-foreground font-medium">O que deseja fazer com o documento?</p>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="premium"
                        size="sm"
                        className="w-full h-12"
                        disabled={extractingUploadData}
                        onClick={async () => {
                          setExtractingUploadData(true);
                          try {
                            const imagesBase64: string[] = [];
                            for (const img of uploadedImages) {
                              const reader = new FileReader();
                              const base64 = await new Promise<string>((resolve) => {
                                reader.onload = () => resolve(reader.result as string);
                                reader.readAsDataURL(img.file);
                              });
                              imagesBase64.push(base64);
                            }

                            const { data: fnData, error: fnError } = await supabase.functions.invoke('extract-fiscal-document-content', {
                              body: { imagesBase64, documentType: tipo },
                            });

                            if (fnError) throw fnError;
                            if (fnData?.error) throw new Error(fnData.error);

                            const extracted = fnData?.data;
                            if (!extracted) throw new Error('Nenhum dado extraído');

                            // Map extracted data to specific form state
                            if (isAutoInfracao && extracted.infracoes) {
                              setAutoInfracaoData(prev => ({
                                ...prev,
                                infracoes: extracted.infracoes.map((inf: any, idx: number) => ({
                                  id: `inf_${Date.now()}_${idx}`,
                                  descricao: inf.descricao || '',
                                  dispositivo: inf.dispositivo || '',
                                })),
                                valorMulta: extracted.valorMulta || prev.valorMulta,
                                prazoDefesa: extracted.prazoDefesa || prev.prazoDefesa,
                                documentDate: extracted.documentDate || prev.documentDate,
                                documentTime: extracted.documentTime || prev.documentTime,
                              }));
                              setMethod('auto_infracao');
                            } else if (isAdvertencia && extracted.irregularidades) {
                              setAdvertenciaData(prev => ({
                                ...prev,
                                irregularidades: extracted.irregularidades.map((irr: any, idx: number) => ({
                                  id: `adv_${Date.now()}_${idx}`,
                                  descricao: irr.descricao || '',
                                  dispositivo: irr.dispositivo || '',
                                })),
                                prazo: extracted.prazo || prev.prazo,
                                fundamentacaoLegal: extracted.fundamentacaoLegal || prev.fundamentacaoLegal,
                                orientacoes: extracted.orientacoes || prev.orientacoes,
                                documentDate: extracted.documentDate || prev.documentDate,
                                documentTime: extracted.documentTime || prev.documentTime,
                              }));
                              setMethod('advertencia');
                            } else if (isInutilizacao && extracted.produtos) {
                              setInutilizacaoData(prev => ({
                                ...prev,
                                produtos: extracted.produtos.map((p: any, idx: number) => ({
                                  id: `prod_${Date.now()}_${idx}`,
                                  produto: p.produto || '',
                                  marca: p.marca || '',
                                  lote: p.lote || '',
                                  quantidade: p.quantidade || '',
                                  unidade: p.unidade || 'UN',
                                  pesoKg: p.pesoKg || '',
                                  motivoInutilizacao: p.motivoInutilizacao || '',
                                })),
                                metodoInutilizacao: extracted.metodoInutilizacao || prev.metodoInutilizacao,
                                localInutilizacao: extracted.localInutilizacao || prev.localInutilizacao,
                                testemunhas: extracted.testemunhas || prev.testemunhas,
                                justificativa: extracted.justificativa || prev.justificativa,
                                documentDate: extracted.documentDate || prev.documentDate,
                                documentTime: extracted.documentTime || prev.documentTime,
                              }));
                              setMethod('inutilizacao');
                            } else if (isApreensao && extracted.produtos) {
                              setApreensaoData(prev => ({
                                ...prev,
                                produtos: extracted.produtos.map((p: any, idx: number) => ({
                                  id: `prod_${Date.now()}_${idx}`,
                                  produto: p.produto || '',
                                  marca: p.marca || '',
                                  lote: p.lote || '',
                                  quantidade: p.quantidade || '',
                                  unidade: p.unidade || 'UN',
                                  pesoKg: p.pesoKg || '',
                                  naoConformidade: p.naoConformidade || '',
                                  dispositivoLegal: p.dispositivoLegal || '',
                                })),
                                lacreNumeros: extracted.lacreNumeros?.length > 0 ? extracted.lacreNumeros : prev.lacreNumeros,
                                destinacao: extracted.destinacao || prev.destinacao,
                                fielDepositario: extracted.fielDepositario ?? prev.fielDepositario,
                                observacoes: extracted.observacoes || prev.observacoes,
                                documentDate: extracted.documentDate || prev.documentDate,
                                documentTime: extracted.documentTime || prev.documentTime,
                              }));
                              setMethod('apreensao');
                            } else if (isInterdicao) {
                              setInterdicaoData(prev => ({
                                ...prev,
                                tipoInterdicao: extracted.tipoInterdicao || prev.tipoInterdicao,
                                areasInterditadas: extracted.areasInterditadas || prev.areasInterditadas,
                                motivoInterdicao: extracted.motivoInterdicao || prev.motivoInterdicao,
                                fundamentacaoLegal: extracted.fundamentacaoLegal || prev.fundamentacaoLegal,
                                condicoesDesinterdicao: extracted.condicoesDesinterdicao || prev.condicoesDesinterdicao,
                                observacoes: extracted.observacoes || prev.observacoes,
                                documentDate: extracted.documentDate || prev.documentDate,
                                documentTime: extracted.documentTime || prev.documentTime,
                              }));
                              setMethod('interdicao');
                            } else if (isNotificacao) {
                              setNotificacaoData(prev => ({
                                ...prev,
                                assunto: extracted.assunto || prev.assunto,
                                conteudo: extracted.conteudo || prev.conteudo,
                                fundamentacaoLegal: extracted.fundamentacaoLegal || prev.fundamentacaoLegal,
                                prazoResposta: extracted.prazoResposta || prev.prazoResposta,
                                documentDate: extracted.documentDate || prev.documentDate,
                                documentTime: extracted.documentTime || prev.documentTime,
                              }));
                              setMethod('notificacao');
                            } else if (isVisitaFiscal) {
                              setVisitaFiscalData(prev => ({
                                ...prev,
                                purpose: extracted.purpose?.length > 0 ? extracted.purpose : prev.purpose,
                                anotacoes: extracted.anotacoes || prev.anotacoes,
                                orientacoes: extracted.orientacoes || prev.orientacoes,
                                documentDate: extracted.documentDate || prev.documentDate,
                                documentTime: extracted.documentTime || prev.documentTime,
                              }));
                              setMethod('visita_fiscal');
                            } else if (isReplica) {
                              setReplicaData(prev => ({
                                ...prev,
                                documentoOrigem: extracted.documentoOrigem || prev.documentoOrigem,
                                numeroProcesso: extracted.numeroProcesso || prev.numeroProcesso,
                                folhasDefesa: extracted.folhasDefesa || prev.folhasDefesa,
                                descricaoInfracao: extracted.descricaoInfracao || prev.descricaoInfracao,
                                capitulacaoLegal: extracted.capitulacaoLegal || prev.capitulacaoLegal,
                                resumoDefesa: extracted.resumoDefesa || prev.resumoDefesa,
                                analiseDefesa: extracted.analiseDefesa || prev.analiseDefesa,
                                conclusao: extracted.conclusao || prev.conclusao,
                                fundamentacaoLegal: extracted.fundamentacaoLegal || prev.fundamentacaoLegal,
                                documentDate: extracted.documentDate || prev.documentDate,
                                documentTime: extracted.documentTime || prev.documentTime,
                              }));
                              setMethod('replica');
                            } else if (tipo === 'termo_intimacao') {
                              setManualContent(extracted.content || '');
                              if (extracted.deadlineDays) setDeadlineDays(String(extracted.deadlineDays));
                              if (extracted.observations) setObservations(extracted.observations);
                              if (extracted.documentDate) setDocumentDate(extracted.documentDate);
                              if (extracted.documentTime) setDocumentTime(extracted.documentTime);
                              setMethod('manual');
                            }

                            toast({
                              title: 'Dados extraídos com sucesso!',
                              description: 'O formulário foi preenchido automaticamente. Revise os dados.',
                            });
                          } catch (err: any) {
                            console.error('Extract document data error:', err);
                            toast({
                              title: 'Erro na extração',
                              description: err.message || 'Não foi possível extrair os dados. Tente com uma foto mais clara.',
                              variant: 'destructive',
                            });
                          } finally {
                            setExtractingUploadData(false);
                          }
                        }}
                      >
                        {extractingUploadData ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Extraindo dados...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-5 w-5 mr-2" />
                            Preencher formulário por IA
                          </>
                        )}
                      </Button>
                      <p className="text-[10px] text-muted-foreground text-center">
                        A IA vai ler o documento e preencher o formulário automaticamente
                      </p>
                    </div>
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
                          max="45"
                          value={deadlineDays}
                          onChange={(e) => {
                            let days = parseInt(e.target.value) || 15;
                            days = Math.max(1, Math.min(45, days));
                            setDeadlineDays(days.toString());
                          }}
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
                          max="45"
                          value={deadlineDays}
                          onChange={(e) => {
                            let days = parseInt(e.target.value) || 15;
                            days = Math.max(1, Math.min(45, days));
                            setDeadlineDays(days.toString());
                          }}
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

      {/* Diálogo de confirmação antes de salvar no modo AI */}
      <AlertDialog open={showSaveConfirmDialog} onOpenChange={setShowSaveConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Você revisou todas as {aiPhotoLegends.filter(l => l.legenda?.trim()).length} irregularidade(s) identificadas? 
              Após salvar, você será direcionado para a visualização do documento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowSaveConfirmDialog(false); handleSave(); }}>
              Salvar agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Formulário de resposta de denúncia */}
      <DenunciaResponseForm
        open={showDenunciaResponse}
        onClose={() => {
          setShowDenunciaResponse(false);
          if (savedDocumentId) {
            navigate(`/documento/${savedDocumentId}`);
          }
        }}
        documentId={savedDocumentId || ''}
        establishmentName={establishment?.nome_fantasia || establishment?.razao_social}
        documentNumber={savedDocumentNumber || undefined}
      />
    </AppLayout>
  );
}

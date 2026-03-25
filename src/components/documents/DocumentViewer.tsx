import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Edit3,
  Save,
  Download,
  Send,
  Lock,
  Mail,
  MessageCircle,
  Calendar,
  MapPin,
  Building,
  User,
  Camera,
  Upload,
  X,
  ArrowLeft,
  Printer,
  Clock,
  Trash2,
  Loader2,
  ExternalLink,
  QrCode,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { getSignedUrl, extractStoragePath } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';
import marcaDaguaFiscaliz from '@/assets/marca-dagua-fiscaliz.png';
import logoFiscaliz from '@/assets/logo-fiscaliz.png';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BRASAO_GOIANIA_SVG, SUS_LOGO_SVG, FISCALIZ_LOGO } from '@/lib/logos';
import { SignatureCanvas } from './SignatureCanvas';
import { FullScreenSignature } from './FullScreenSignature';
import { ColetaAmostraPDF } from './ColetaAmostraPDF';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { LegislationSelectDialog, DEFAULT_LEGISLATION } from './LegislationSelectDialog';
import { TeamMembersSection, TeamMembersSignatures, type TeamMember } from './TeamMembersSection';

interface AttachmentPhoto {
  id?: string;
  url: string;
  type?: string;
}

interface DocumentViewerProps {
  document: {
    id: string;
    document_type: string;
    document_number?: string;
    content: any;
    irregularities?: any[];
    attachments?: AttachmentPhoto[] | null;
    deadline_days?: number;
    deadline_date?: string;
    status: string;
    is_locked?: boolean;
    sent_at?: string;
    sent_to?: string;
    establishment?: {
      razao_social: string;
      nome_fantasia?: string;
      cnpj: string;
      endereco: string;
      bairro?: string;
      responsavel_nome?: string;
      responsavel_cpf?: string;
      responsavel_telefone?: string;
    };
    profile?: {
      full_name: string;
      registration_number?: string;
      division?: string;
      signature_url?: string;
    };
    created_at: string;
  };
  onSave?: (data: any) => void;
  onSend?: (data: { email?: string; whatsapp?: string }) => void;
  onSendDocument?: (method: 'sefiz' | 'email' | 'whatsapp', destination?: string, pdfStoragePath?: string) => void;
  onGeneratePDF?: () => void;
  onDelete?: () => void;
  editable?: boolean;
}

const documentTypeLabels: Record<string, string> = {
  termo_intimacao: 'TERMO DE INTIMAÇÃO',
  visita_fiscal: 'VISITA FISCAL',
  auto_infracao: 'AUTO DE INFRAÇÃO',
  advertencia: 'ADVERTÊNCIA',
  inutilizacao: 'TERMO DE INUTILIZAÇÃO',
  apreensao: 'TERMO DE APREENSÃO',
  interdicao: 'TERMO DE INTERDIÇÃO',
  relatorio_tecnico: 'RELATÓRIO TÉCNICO DE INSPEÇÃO SANITÁRIA',
  notificacao: 'NOTIFICAÇÃO',
  replica: 'RÉPLICA',
  certidao: 'CERTIDÃO SANITÁRIA',
  coleta_amostra: 'TERMO DE COLETA DE AMOSTRA',
  relatorio_atividade: 'RELATÓRIO DE ATIVIDADE',
};

interface PhotoLegend {
  photoIndex: number;
  legenda: string;
  item_rdc: string;
  previewUrl?: string;
}

export function DocumentViewer({ 
  document, 
  onSave, 
  onSend,
  onSendDocument,
  onGeneratePDF,
  onDelete,
  editable = true 
}: DocumentViewerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(document.content?.text || '');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const [contributorPhoto, setContributorPhoto] = useState<string | null>(document.content?.contributor_photo || null);
  const [prepostoPhoto, setPrepostoPhoto] = useState<string | null>(document.content?.preposto_photo || null);
  const [prepostoName, setPrepostoName] = useState(document.content?.preposto_name || '');
  const [prepostoCpf, setPrepostoCpf] = useState(document.content?.preposto_cpf || '');
  const [deadlineDays, setDeadlineDays] = useState<number | undefined>(document.deadline_days);
  const [deadlineDate, setDeadlineDate] = useState<string | undefined>(document.deadline_date);
  const [isUploading, setIsUploading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);
  const pdfPreviewRef = useRef<HTMLDivElement>(null);
  const [contributorSignatureUrl, setContributorSignatureUrl] = useState<string | null>(document.content?.contributor_signature || null);
  const [documentDate, setDocumentDate] = useState(document.content?.document_date || (document as any).action_date || new Date(document.created_at).toISOString().split('T')[0]);
  const [documentTime, setDocumentTime] = useState(document.content?.document_time || new Date(document.created_at).toTimeString().slice(0, 5));
  const [observations, setObservations] = useState(document.content?.observations || '');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(document.content?.team_members || []);
  const documentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFullScreenSignature, setShowFullScreenSignature] = useState(false);
  const prepostoFileInputRef = useRef<HTMLInputElement>(null);
  const evidenceFileInputRef = useRef<HTMLInputElement>(null);
  // Convert any storage URL (public, signed, or raw path) to a fresh signed URL
  const toSignedUrl = useCallback(async (url: string): Promise<string> => {
    if (!url) return url;
    // Already a data URL (base64), skip
    if (url.startsWith('data:')) return url;
    // Always generate a fresh signed URL (handles expired signed URLs, public URLs, and raw paths)
    return getSignedUrl(url);
  }, []);

  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);

  // Resolve attachment URLs on mount (convert public→signed)
  useEffect(() => {
    const resolveUrls = async () => {
      if (!document.attachments) return;
      const attachments = (document.attachments as AttachmentPhoto[]).filter(a => a.url);
      const resolved = await Promise.all(attachments.map(a => toSignedUrl(a.url)));
      setEvidencePhotos(resolved);
    };
    resolveUrls();
  }, [document.attachments, toSignedUrl]);

  // Resolve contributor signature URL
  useEffect(() => {
    const resolveSignature = async () => {
      const sig = document.content?.contributor_signature;
      if (sig && sig.includes('/object/public/')) {
        const signed = await getSignedUrl(sig);
        setContributorSignatureUrl(signed);
      }
    };
    resolveSignature();
  }, [document.content?.contributor_signature]);

  // Resolve auditor signature URL (may be expired signed URL or storage path)
  const [resolvedAuditorSignature, setResolvedAuditorSignature] = useState<string | null>(null);
  useEffect(() => {
    const resolveAuditorSig = async () => {
      const sig = document.profile?.signature_url;
      if (!sig) return;
      if (sig.startsWith('data:')) {
        setResolvedAuditorSignature(sig);
        return;
      }
      try {
        const signed = await getSignedUrl(sig);
        setResolvedAuditorSignature(signed);
      } catch {
        setResolvedAuditorSignature(sig);
      }
    };
    resolveAuditorSig();
  }, [document.profile?.signature_url]);

  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [showLegislationDialog, setShowLegislationDialog] = useState(false);
  const [isEditingLegends, setIsEditingLegends] = useState(false);
  const [editablePhotoLegends, setEditablePhotoLegends] = useState<PhotoLegend[]>([]);
  const { toast } = useToast();

  // Get attached photos - use state (evidencePhotos) for live updates when editing
  const attachedPhotos: string[] = useMemo(() => {
    return evidencePhotos;
  }, [evidencePhotos]);

   // Check if this is a Relatório Técnico with photo legends
  const isRelatorioTecnico = document.document_type === 'relatorio_tecnico';
  const relatorioTecnicoData = document.content?.relatorio_tecnico_data;
  const isRelatorioAtividade = document.document_type === 'relatorio_atividade';
  const isRelatorioAmpliado = isRelatorioTecnico && document.content?.rt_sub_type === 'ampliado';
  const relatorioAmpliadoData = document.content?.relatorio_ampliado_data;
  
  // Check if this is a Termo de Intimação with AI-generated photo legends
  const isTermoIntimacaoWithAI = document.document_type === 'termo_intimacao' && 
    document.content?.method === 'ai' && 
    Array.isArray(document.content?.photoLegends);
  
  const photoLegends: PhotoLegend[] = useMemo(() => {
    // For Relatório Técnico - check nested and top-level photoLegends
    if (isRelatorioTecnico) {
      if (relatorioTecnicoData?.photoLegends) {
        return relatorioTecnicoData.photoLegends;
      }
    }
    // For any document type with AI-generated photoLegends
    if (Array.isArray(document.content?.photoLegends) && document.content.photoLegends.length > 0) {
      return document.content.photoLegends;
    }
    return [];
  }, [isRelatorioTecnico, relatorioTecnicoData, document.content?.photoLegends]);
  
  // Flag to show photo analysis section
  const hasPhotoLegends = photoLegends.length > 0;

  // Auto-initialize editable legends when photoLegends are available
  useEffect(() => {
    if (hasPhotoLegends && editablePhotoLegends.length === 0) {
      setEditablePhotoLegends([...photoLegends]);
    }
  }, [hasPhotoLegends, photoLegends]);

  const isLocked = document.is_locked || document.status === 'sent';
  const canEdit = editable && !isLocked;

  const handleSave = () => {
    if (onSave) {
      onSave({ 
        content: { 
          ...document.content, 
          text: content, 
          contributor_photo: contributorPhoto,
          contributor_signature: contributorSignatureUrl,
          preposto_photo: prepostoPhoto,
          preposto_name: prepostoName,
          preposto_cpf: prepostoCpf,
          document_date: documentDate,
          document_time: documentTime,
           observations: observations,
           team_members: teamMembers,
        } 
      });
    }
    setIsEditing(false);
  };

  const isTermoIntimacao = document.document_type === 'termo_intimacao';
  const hasDeadline = Boolean(deadlineDays && deadlineDate);

  const handleOpenSendModal = () => {
    if (isTermoIntimacao && !hasDeadline) {
      toast({
        title: "Prazo obrigatório",
        description: "O Termo de Intimação requer um prazo definido antes do envio. Por favor, defina o prazo para adequação.",
        variant: "destructive"
      });
      return;
    }
    setShowSendModal(true);
  };

  // Função auxiliar para aguardar a ref do PDF estar disponível
  const waitForPdfPreviewRef = (): Promise<HTMLDivElement> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 50; // 5 segundos máximo (50 * 100ms)
      
      const checkRef = () => {
        attempts++;
        
        // Tentar ref primeiro, depois querySelector como fallback
        const element = pdfPreviewRef.current || window.document.querySelector('.pdf-preview-container') as HTMLDivElement;
        
        if (element) {
          console.log('[PDF Generation] Found preview container after', attempts, 'attempts');
          resolve(element);
          return;
        }
        
        if (attempts >= maxAttempts) {
          reject(new Error('Timeout: container de preview não encontrado após 5 segundos'));
          return;
        }
        
        setTimeout(checkRef, 100);
      };
      
      checkRef();
    });
  };

  // Função reutilizável para gerar PDF e fazer upload ao storage
  const generateAndUploadPDF = async (): Promise<string | null> => {
    toast({
      title: 'Gerando PDF profissional...',
      description: 'Aguarde enquanto o documento é preparado com template oficial.'
    });

    // Mostrar a preview para captura
    setShowPDFPreview(true);

    // Aguardar a ref estar disponível (polling robusto)
    const previewElement = await waitForPdfPreviewRef();

    // Aguardar imagens carregarem
    const images = previewElement.querySelectorAll('img');
    const imagePromises = Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    });
    await Promise.all(imagePromises);

    // Pequeno delay extra para garantir renderização completa
    await new Promise((resolve) => setTimeout(resolve, 500));

    console.log('[PDF Generation] Found preview container, generating canvas...');

    // Helper: converte imagem para base64 data URL
    const imgToBase64 = (imgEl: HTMLImageElement): Promise<string | null> => {
      return new Promise((resolve) => {
        try {
          const tempImg = new Image();
          tempImg.crossOrigin = 'anonymous';
          tempImg.onload = () => {
            try {
              const c = window.document.createElement('canvas');
              c.width = tempImg.naturalWidth;
              c.height = tempImg.naturalHeight;
              const ctx = c.getContext('2d');
              if (ctx) {
                ctx.drawImage(tempImg, 0, 0);
                resolve(c.toDataURL('image/png'));
              } else {
                resolve(null);
              }
            } catch {
              resolve(null);
            }
          };
          tempImg.onerror = () => resolve(null);
          // Adicionar cache-buster para evitar CORS de cache
          const src = imgEl.src;
          tempImg.src = src.includes('?') ? `${src}&_cb=${Date.now()}` : `${src}?_cb=${Date.now()}`;
        } catch {
          resolve(null);
        }
      });
    };

    const canvas = await html2canvas(previewElement, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: true,
      windowWidth: previewElement.scrollWidth,
      windowHeight: previewElement.scrollHeight,
      onclone: async (clonedDoc) => {
        const clonedPreview = clonedDoc.querySelector('.pdf-preview-container') as HTMLElement;
        if (clonedPreview) {
          clonedPreview.style.position = 'relative';
          clonedPreview.style.display = 'block';
        }
        // Converter todas as imagens para base64 no clone para evitar CORS/taint
        const clonedImages = clonedDoc.querySelectorAll('img');
        const conversionPromises = Array.from(clonedImages).map(async (clonedImg) => {
          if (clonedImg.src.startsWith('data:')) return; // já é base64
          const base64 = await imgToBase64(clonedImg);
          if (base64) {
            clonedImg.src = base64;
          }
        });
        await Promise.all(conversionPromises);
      }
    });

    console.log('[PDF Generation] Canvas created:', canvas.width, 'x', canvas.height);

    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;
    const scaledHeight = imgHeight * ratio;

    if (scaledHeight > pdfHeight) {
      let remainingHeight = imgHeight;
      let currentY = 0;
      const pageHeightInPixels = pdfHeight / ratio;

      while (remainingHeight > 0) {
        if (currentY > 0) {
          pdf.addPage();
        }

        const pageCanvas = window.document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = Math.min(pageHeightInPixels, remainingHeight);
        const ctx = pageCanvas.getContext('2d');

        if (ctx) {
          ctx.drawImage(
            canvas,
            0, currentY,
            canvas.width, pageCanvas.height,
            0, 0,
            pageCanvas.width, pageCanvas.height
          );

          const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.92);
          pdf.addImage(pageImgData, 'JPEG', imgX, 0, imgWidth * ratio, pageCanvas.height * ratio);
        }

        currentY += pageHeightInPixels;
        remainingHeight -= pageHeightInPixels;
      }
    } else {
      pdf.addImage(imgData, 'JPEG', imgX, imgY, imgWidth * ratio, scaledHeight);
    }

    console.log('[PDF Generation] PDF created, uploading to storage...');

    const pdfBlob = pdf.output('blob');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }

    const timestamp = Date.now();
    const pdfFileName = `${document.id}_${timestamp}.pdf`;
    const fullPath = `${user.id}/${pdfFileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('fiscal-photos')
      .upload(fullPath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('[PDF Generation] Upload error:', uploadError);
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    setShowPDFPreview(false);

    if (uploadData) {
      console.log('[PDF Generation] PDF uploaded successfully, path:', fullPath);
      return fullPath; // Retorna o path do storage (não URL)
    }

    return null;
  };

  const prepareWhatsAppSend = async (): Promise<{
    phoneWithCountry: string;
    whatsappUrl: string;
    pdfUrl: string | null;
    pdfStoragePath: string | null;
  }> => {
    // Limpar número de telefone (no reenvio pode vir de document.sent_to)
    const phoneSource = whatsapp || (typeof document.sent_to === 'string' ? document.sent_to : '');
    const cleanPhone = phoneSource ? phoneSource.replace(/\D/g, '') : '';
    const phoneWithCountry = cleanPhone
      ? (cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`)
      : '';

    const docType = documentTypeLabels[document.document_type] || document.document_type;
    const establishment = document.establishment?.nome_fantasia || document.establishment?.razao_social || 'Estabelecimento';
    const documentNumber = document.document_number || '';
    const fiscalName = document.profile?.full_name || 'Auditor Fiscal';

    // Gerar PDF usando função reutilizável
    const pdfStoragePath = await generateAndUploadPDF();
    
    // Construir URL amigável para o WhatsApp
    let pdfUrl: string | null = null;
    if (pdfStoragePath) {
      const userId = pdfStoragePath.split('/')[0];
      const fileName = pdfStoragePath.split('/').slice(1).join('/');
      const baseUrl = window.location.hostname.includes('localhost')
        ? window.location.origin
        : 'https://fiscaliz.app';
      pdfUrl = `${baseUrl}/pdf/${fileName}?u=${userId}`;
    }

    // Montar mensagem com link do PDF
    let message = `━━━━━━━━━━━━━━━━━━━━
📋 *${docType}*${documentNumber ? ` Nº ${documentNumber}` : ''}
━━━━━━━━━━━━━━━━━━━━

📅 *Data:* ${formatDate(documentDate)}
🏢 *Estabelecimento:* ${establishment}

👤 *Fiscal:* ${fiscalName}

⚠️ *DOCUMENTO OFICIAL*
Vigilância Sanitária de Goiânia`;

    if (pdfUrl) {
      message += `

📎 Documento PDF completo:
${pdfUrl}`;
    }

    message += `

_Enviado via FISCALIZ®_`;

    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
    return { phoneWithCountry, whatsappUrl, pdfUrl, pdfStoragePath };
  };

  // Estado para guardar a URL do WhatsApp pronta para abertura manual (fallback)
  const [pendingWhatsAppUrl, setPendingWhatsAppUrl] = useState<string | null>(null);
  const [showQRCodeModal, setShowQRCodeModal] = useState(false);

  const handleSendViaWhatsApp = async () => {
    setIsGeneratingPDF(true);
    setPendingWhatsAppUrl(null);

    // Em iOS/Safari, abrir janela com blank e depois tentar navegar após async longo
    // frequentemente falha. Vamos tentar abrir, mas ter um fallback robusto.
    let waWindow: Window | null = null;
    
    // Apenas tentar abrir popup imediato em desktop ou Android
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) {
      waWindow = window.open('about:blank', '_blank', 'noopener,noreferrer');
      try {
        if (waWindow) waWindow.opener = null;
      } catch {
        // ignore
      }
    }

    try {
      const isResend = isLocked;
      const { phoneWithCountry, whatsappUrl, pdfUrl, pdfStoragePath } = await prepareWhatsAppSend();

      if (!phoneWithCountry) {
        throw new Error('Informe um número de WhatsApp válido para reenviar.');
      }

      // No mobile, abrir o WhatsApp pode cancelar fetch pendente (gerando "Load failed").
      // Então, no envio (não reenvio), primeiro atualizamos o status no backend.
      if (!isResend && onSendDocument) {
        await onSendDocument('whatsapp', phoneWithCountry || whatsapp, pdfStoragePath || undefined);
      }

      // Tentar navegação automática
      let navigationSucceeded = false;

      if (waWindow && !waWindow.closed) {
        try {
          waWindow.location.assign(whatsappUrl);
          navigationSucceeded = true;
        } catch {
          // Se falhar, fechar a janela órfã
          try { waWindow.close(); } catch { /* ignore */ }
        }
      }

      // Em iOS ou se a navegação automática falhou, mostrar toast com ação
      if (!navigationSucceeded) {
        // Guardar URL para o botão de fallback
        setPendingWhatsAppUrl(whatsappUrl);
        
        toast({
          title: pdfUrl ? '✅ PDF gerado com sucesso!' : '✅ Mensagem pronta!',
          description: 'Toque no botão abaixo para abrir o WhatsApp.',
          duration: 15000, // Manter visível por mais tempo
        });
      } else {
        toast({
          title: pdfUrl ? '✅ PDF gerado com sucesso!' : 'WhatsApp aberto',
          description: pdfUrl
            ? 'O documento PDF profissional está pronto. Envie a mensagem no WhatsApp.'
            : 'Documento preparado como mensagem. Confirme o envio.'
        });
      }
    } catch (error: any) {
      console.error('[PDF Generation] Error:', error);
      setShowPDFPreview(false);
      // Se abriu uma aba em branco e deu erro, tentar fechar
      try {
        waWindow?.close();
      } catch {
        // ignore
      }
      toast({
        title: 'Erro ao gerar PDF',
        description: error?.message || 'Tente novamente ou use a opção de impressão.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Função para abrir WhatsApp manualmente (fallback iOS)
  const handleOpenWhatsAppManually = () => {
    if (pendingWhatsAppUrl) {
      window.location.href = pendingWhatsAppUrl;
      setPendingWhatsAppUrl(null);
    }
  };

  const handleSendViaEmail = async () => {
    if (!email) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('send-fiscal-document', {
        body: {
          email,
          documentId: document.id,
          documentType: documentTypeLabels[document.document_type] || document.document_type,
          establishmentName: document.establishment?.nome_fantasia || document.establishment?.razao_social || 'Estabelecimento',
          fiscalName: document.profile?.full_name || 'Auditor Fiscal',
        }
      });
      
      if (error) throw error;
      
      toast({
        title: "Email enviado!",
        description: `Documento enviado para ${email}`
      });
      
      return true;
    } catch (error: any) {
      console.error('Email send error:', error);
      toast({
        title: "Erro ao enviar email",
        description: error.message || "Verifique se o serviço de email está configurado",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleSend = async () => {
    if (isTermoIntimacao && !hasDeadline) {
      toast({
        title: "Prazo obrigatório",
        description: "O Termo de Intimação requer um prazo definido antes do envio.",
        variant: "destructive"
      });
      return;
    }
    
    // Enviar via WhatsApp se preenchido
    // (sequencial para evitar cancelamento de requisições quando o WhatsApp abre no mobile)
    if (whatsapp) {
      await handleSendViaWhatsApp();
    }
    
    // Enviar via Email se preenchido
    if (email) {
      await handleSendViaEmail();
    }
    
    // Atualizar status do documento
    // Se o WhatsApp foi usado, o status já foi atualizado via onSendDocument dentro do fluxo do WhatsApp.
    if (!whatsapp && onSend) {
      onSend({ email, whatsapp });
    }
    setShowSendModal(false);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${document.id}_contributor_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('fiscal-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: signedData } = await supabase.storage
        .from('fiscal-photos')
        .createSignedUrl(fileName, 3600);

      setContributorPhoto(signedData?.signedUrl || fileName);
      
      // Auto-save when photo is uploaded
      if (onSave) {
        onSave({ content: { ...document.content, text: content, contributor_photo: signedData?.signedUrl || fileName, preposto_photo: prepostoPhoto, preposto_name: prepostoName, preposto_cpf: prepostoCpf } });
      }

      toast({
        title: "Foto enviada",
        description: "Foto do contribuinte adicionada com sucesso"
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível enviar a foto",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCapturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      
      const video = window.document.createElement('video');
      video.srcObject = stream;
      await video.play();
      
      const canvas = window.document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      
      stream.getTracks().forEach(track => track.stop());
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const event = { target: { files: [file] } } as any;
          await handlePhotoUpload(event);
        }
      }, 'image/jpeg', 0.8);
    } catch (error) {
      // Fallback to file input if camera not available
      fileInputRef.current?.click();
    }
  };

  const removePhoto = () => {
    setContributorPhoto(null);
    if (onSave) {
      onSave({ content: { ...document.content, text: content, contributor_photo: null, preposto_photo: prepostoPhoto, preposto_name: prepostoName, preposto_cpf: prepostoCpf } });
    }
  };

  const handlePrepostoPhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${document.id}_preposto_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('fiscal-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: signedData } = await supabase.storage
        .from('fiscal-photos')
        .createSignedUrl(fileName, 3600);

      setPrepostoPhoto(signedData?.signedUrl || fileName);
      
      if (onSave) {
        onSave({ content: { ...document.content, text: content, contributor_photo: contributorPhoto, preposto_photo: signedData?.signedUrl || fileName, preposto_name: prepostoName, preposto_cpf: prepostoCpf } });
      }

      toast({
        title: "Foto enviada",
        description: "Foto do preposto adicionada com sucesso"
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível enviar a foto",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCapturePrepostoPhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      
      const video = window.document.createElement('video');
      video.srcObject = stream;
      await video.play();
      
      const canvas = window.document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d')?.drawImage(video, 0, 0);
      
      stream.getTracks().forEach(track => track.stop());
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], `preposto_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const event = { target: { files: [file] } } as any;
          await handlePrepostoPhotoUpload(event);
        }
      }, 'image/jpeg', 0.8);
    } catch (error) {
      prepostoFileInputRef.current?.click();
    }
  };

  const removePrepostoPhoto = () => {
    setPrepostoPhoto(null);
    if (onSave) {
      onSave({ content: { ...document.content, text: content, contributor_photo: contributorPhoto, preposto_photo: null, preposto_name: prepostoName, preposto_cpf: prepostoCpf } });
    }
  };

  // Evidence photos upload (multiple)
  const handleEvidencePhotosUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setIsUploadingEvidence(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive"
        });
        return;
      }

      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${document.id}_evidence_${Date.now()}_${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('fiscal-photos')
          .upload(fileName, file, { upsert: true });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        // Store the raw storage path (NOT signed URL) so it never expires
        uploadedUrls.push(fileName);
      }

      // Generate signed URLs for display
      const signedForDisplay = await Promise.all(
        uploadedUrls.map(path => getSignedUrl(path))
      );

      const newDisplayPhotos = [...evidencePhotos, ...signedForDisplay];
      setEvidencePhotos(newDisplayPhotos);

      // Save RAW PATHS to database (not signed URLs)
      const existingPaths = (document.attachments as AttachmentPhoto[] || [])
        .filter(a => a.url)
        .map(a => extractStoragePath(a.url));
      const allPaths = [...existingPaths, ...uploadedUrls];
      const attachments = allPaths.map((path, idx) => ({
        id: `img_${idx}`,
        url: path,
        type: 'image'
      }));

      if (onSave) {
        onSave({ attachments });
      }

      toast({
        title: "Fotos adicionadas",
        description: `${uploadedUrls.length} foto(s) adicionada(s) com sucesso`
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Erro no upload",
        description: error.message || "Não foi possível enviar as fotos",
        variant: "destructive"
      });
    } finally {
      setIsUploadingEvidence(false);
      // Reset input
      if (evidenceFileInputRef.current) {
        evidenceFileInputRef.current.value = '';
      }
    }
  };

  const removeEvidencePhoto = (index: number) => {
    const newPhotos = evidencePhotos.filter((_, idx) => idx !== index);
    setEvidencePhotos(newPhotos);

    // Save RAW PATHS to database (extract from signed URLs)
    const attachments = newPhotos.map((url, idx) => ({
      id: `img_${idx}`,
      url: extractStoragePath(url),
      type: 'image'
    }));

    if (onSave) {
      onSave({ attachments });
    }

    toast({
      title: "Foto removida",
      description: "A foto foi removida do documento"
    });
  };

  // AI Photo Analysis for draft documents
  const handleAIAnalysis = async (targetLeg?: string, obs?: string) => {
    if (evidencePhotos.length === 0) {
      toast({
        title: "Sem fotos",
        description: "Adicione fotos de evidência antes de analisar com IA",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsAnalyzingAI(true);
      setShowLegislationDialog(false);
      
      // Generate fresh signed URLs for the edge function (bucket is private)
      const photoPaths = evidencePhotos.map(url => {
        // Extract storage path from signed or public URLs
        const signedMarker = '/storage/v1/object/sign/fiscal-photos/';
        const publicMarker = '/storage/v1/object/public/fiscal-photos/';
        for (const marker of [signedMarker, publicMarker]) {
          const idx = url.indexOf(marker);
          if (idx !== -1) {
            const pathWithQuery = url.substring(idx + marker.length);
            return pathWithQuery.split('?')[0];
          }
        }
        return url;
      });

      const { data: signedUrlsData, error: signedUrlsError } = await supabase.storage
        .from('fiscal-photos')
        .createSignedUrls(photoPaths, 3600);

      if (signedUrlsError || !signedUrlsData) {
        throw new Error('Falha ao gerar URLs assinadas para as fotos');
      }

      const signedPhotoUrls = signedUrlsData.map((d, i) => d.signedUrl || evidencePhotos[i]);

      const { data, error } = await supabase.functions.invoke('analyze-photos', {
        body: {
          documentType: document.document_type,
          photos: signedPhotoUrls,
          establishmentType: document.establishment?.nome_fantasia || document.establishment?.razao_social || '',
          targetLegislation: targetLeg || DEFAULT_LEGISLATION,
          observation: obs || undefined,
        }
      });

      if (error) throw error;

      if (data?.analysisResult?.nonConformities && data.analysisResult.nonConformities.length > 0) {
        // New format: group non-conformities by photo number
        const nonConformities = data.analysisResult.nonConformities;
        const newLegends = evidencePhotos.map((_: string, idx: number) => {
          const photoNumber = idx + 1;
          const photoNCs = nonConformities.filter((nc: any) => nc.foto === photoNumber);
          return {
            photoIndex: idx,
            legenda: photoNCs.map((nc: any) => nc.description).join('; ') || '',
            item_rdc: photoNCs.map((nc: any) => (nc.legalBasis || '').replace('RDC 216/2004 - Item ', '')).filter(Boolean).join(', '),
            previewUrl: signedPhotoUrls[idx] || '',
          };
        });

        const newIrregularities = nonConformities.map((nc: any, idx: number) => ({
          id: `ai_${idx}`,
          descricao: nc.description,
          dispositivo: nc.legalBasis || '',
          severity: nc.severity,
          recommendation: nc.recommendation,
          deadline: nc.deadline,
        }));

        if (onSave) {
          onSave({
            content: {
              ...document.content,
              text: content,
              photoLegends: newLegends,
              method: 'ai',
              observations: observations,
              team_members: teamMembers,
              document_date: documentDate,
              document_time: documentTime,
              ...(document.document_type === 'relatorio_tecnico' ? {
                relatorio_tecnico_data: {
                  ...document.content?.relatorio_tecnico_data,
                  photoLegends: newLegends,
                  aiAnalysisResult: JSON.stringify(data.analysisResult),
                }
              } : {}),
            },
            irregularities: newIrregularities,
          });
        }

        toast({
          title: "Análise concluída",
          description: `${nonConformities.length} não conformidade(s) identificada(s) pela IA`,
        });
      } else if (data?.photoAnalysis && data.photoAnalysis.length > 0) {
        // Legacy format fallback
        const newLegends = data.photoAnalysis.map((item: any) => ({
          photoIndex: item.foto - 1,
          legenda: item.legenda || '',
          item_rdc: item.item_rdc || '',
          previewUrl: signedPhotoUrls[item.foto - 1] || '',
        }));

        const newIrregularities = data.photoAnalysis.map((item: any, idx: number) => ({
          id: `ai_${idx}`,
          descricao: item.legenda || '',
          dispositivo: item.item_rdc || '',
        }));

        if (onSave) {
          onSave({
            content: {
              ...document.content,
              text: content,
              photoLegends: newLegends,
              method: 'ai',
              observations: observations,
              team_members: teamMembers,
              document_date: documentDate,
              document_time: documentTime,
              ...(document.document_type === 'relatorio_tecnico' ? {
                relatorio_tecnico_data: {
                  ...document.content?.relatorio_tecnico_data,
                  photoLegends: newLegends,
                }
              } : {}),
            },
            irregularities: newIrregularities,
          });
        }

        toast({
          title: "Análise concluída",
          description: `${data.photoAnalysis.length} não conformidade(s) identificada(s) pela IA`,
        });
      } else {
        toast({
          title: "Análise concluída",
          description: "Nenhuma não conformidade identificada nas fotos",
        });
      }
    } catch (error: any) {
      console.error('AI analysis error:', error);
      toast({
        title: "Erro na análise",
        description: error.message || "Não foi possível analisar as fotos com IA",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  const startEditingLegends = () => {
    setEditablePhotoLegends([...photoLegends]);
    setIsEditingLegends(true);
  };

  const updateLegend = (idx: number, field: 'legenda' | 'item_rdc', value: string) => {
    setEditablePhotoLegends(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const saveLegends = () => {
    if (onSave) {
      const legendsToSave = editablePhotoLegends;
      const saveData: any = {
        content: {
          ...document.content,
          text: content,
          photoLegends: legendsToSave,
          observations,
          document_date: documentDate,
          document_time: documentTime,
          team_members: teamMembers,
        }
      };
      if (isRelatorioTecnico) {
        saveData.content.relatorio_tecnico_data = {
          ...document.content?.relatorio_tecnico_data,
          photoLegends: legendsToSave,
        };
      }
      onSave(saveData);
    }
    setIsEditingLegends(false);
    toast({ title: "Legendas salvas", description: "As legendas das fotos foram atualizadas." });
  };

  const savePrepostoData = () => {
    if (onSave) {
      onSave({ 
        content: { 
          ...document.content, 
          text: content, 
          contributor_photo: contributorPhoto, 
          contributor_signature: contributorSignatureUrl,
          preposto_photo: prepostoPhoto, 
          preposto_name: prepostoName, 
          preposto_cpf: prepostoCpf,
          document_date: documentDate,
          document_time: documentTime,
           observations: observations,
           team_members: teamMembers,
        } 
      });
    }
    toast({
      title: "Dados salvos",
      description: "Dados do contribuinte salvos com sucesso"
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleGeneratePDF = () => {
    setShowPDFPreview(true);
    setTimeout(() => {
      // Call the parent's onGeneratePDF if provided (print dialog - permite imprimir/salvar)
      if (onGeneratePDF) {
        onGeneratePDF();
      } else {
        window.print();
      }
    }, 500);
  };

  const formatDateFull = (dateStr: string) => {
    return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // PDF Preview - Layout específico para Coleta de Amostra
  const isColetaAmostra = document.document_type === 'coleta_amostra';

  if (showPDFPreview && isColetaAmostra) {
    return (
      <div ref={pdfPreviewRef} className="min-h-screen bg-white text-black print:text-black pdf-preview-container" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
        <style>{`
          @page {
            margin: 0;
            size: A4;
          }
          @media print {
            html, body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .pdf-preview-container { position: static !important; }
          }
          @media screen {
            .pdf-preview-container { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; overflow: auto; }
          }
        `}</style>
        <ColetaAmostraPDF
          document={document}
          documentDate={documentDate}
          documentTime={documentTime}
          contributorSignatureUrl={contributorSignatureUrl}
          prepostoName={prepostoName}
          prepostoCpf={prepostoCpf}
        />
        {/* Botões (ocultos na impressão) */}
        <div className="no-print fixed bottom-0 left-0 right-0 z-[10000] bg-white border-t shadow-lg p-4 flex gap-3 justify-center">
          <Button variant="outline" size="lg" onClick={() => setShowPDFPreview(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button size="lg" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>
    );
  }

  // PDF Preview - Layout oficial igual ao modelo de Certidão
  if (showPDFPreview) {
    return (
      <div ref={pdfPreviewRef} className="min-h-screen bg-white text-black print:text-black pdf-preview-container" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
        <style>{`
          @page {
            margin: 0;
            size: A4;
          }
          @media print {
            html, body { margin: 0; padding: 0; }
            .no-print, nav, .bottom-nav, [class*="bottom-"], [class*="BottomNav"], footer:not(.doc-footer), header:not(.doc-header) { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; overflow: hidden !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .pdf-preview-container { position: static !important; }
            .pdf-preview-container * { display: revert; visibility: visible !important; opacity: 1 !important; }
            .pdf-print-content { padding: 12mm !important; }
            .break-before-page { break-before: page; page-break-before: always; }
            .folha-fotos-wrapper { break-inside: avoid; page-break-inside: avoid; }
          }
          @media screen {
            .pdf-preview-container { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; overflow: auto; }
          }
          .folha-fotos { width: 100%; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 8mm; box-sizing: border-box; break-inside: avoid; page-break-inside: avoid; }
          @media print { .folha-fotos { height: calc(297mm - 24mm); break-inside: avoid; page-break-inside: avoid; page-break-after: always; } .folha-fotos:last-child { page-break-after: auto; } }
          .folha-fotos .foto-cell { display: flex; flex-direction: column; overflow: hidden; min-height: 0; break-inside: avoid; page-break-inside: avoid; }
          .folha-fotos .foto-cell .foto-img-wrap { flex: 1; min-height: 0; border: 1px solid #ccc; border-radius: 4px; overflow: hidden; position: relative; }
          .folha-fotos .foto-cell .foto-img-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .folha-fotos .foto-cell .foto-img-wrap .foto-badge { position: absolute; top: 4px; left: 4px; background: #1f2937; color: #fff; font-size: 7pt; font-weight: bold; padding: 2px 6px; border-radius: 3px; font-family: Arial, sans-serif; }
          .folha-fotos .foto-cell .foto-legend { font-family: Arial, sans-serif; font-size: 9pt; color: #374151; line-height: 1.3; margin-top: 3px; text-align: center; break-inside: avoid; page-break-inside: avoid; overflow-wrap: break-word; word-wrap: break-word; max-height: 4.5em; overflow: hidden; }
          .doc-section { margin: 15px 0; }
          .doc-field { margin: 4px 0; text-align: left; }
          .doc-label { font-weight: bold; font-size: 10pt; display: inline; }
          .doc-value { font-size: 10pt; display: inline; }
          .signature-line { border-top: 1px solid #333; width: 220px; margin: 0 auto; }
        `}</style>

        <div className="p-8 max-w-4xl mx-auto bg-white pdf-print-content">
          {/* CABEÇALHO OFICIAL - 3 colunas: Brasão | Textos | SUS */}
          <div className="mb-6 border-b-2 border-gray-800 pb-4">
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '65px' }} />
                <col />
                <col style={{ width: '65px' }} />
              </colgroup>
              <tbody>
                <tr>
                  {/* Brasão à esquerda */}
                  <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '0' }}>
                    <img src={BRASAO_GOIANIA_SVG} alt="Prefeitura de Goiânia" style={{ height: '55px', width: 'auto', display: 'inline-block' }} />
                  </td>
                  
                  {/* Textos centralizados */}
                  <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '0 8px' }}>
                    <div style={{ fontSize: '10pt', fontWeight: 'bold', color: '#111', lineHeight: '1.25' }}>PREFEITURA DE GOIÂNIA</div>
                    <div style={{ fontSize: '9pt', fontWeight: 'bold', color: '#111', lineHeight: '1.25' }}>SECRETARIA MUNICIPAL DE SAÚDE</div>
                    <div style={{ fontSize: '7.5pt', fontWeight: '600', color: '#222', lineHeight: '1.25' }}>DIRETORIA DE VIGILÂNCIA SANITÁRIA E AMBIENTAL</div>
                    <div style={{ fontSize: '6.5pt', color: '#555', marginTop: '2px', lineHeight: '1.3' }}>Av. Universitária esq. c/ 1ª Avenida, s/nº - Setor Universitário - CEP: 74605-010</div>
                    <div style={{ fontSize: '6.5pt', color: '#555', lineHeight: '1.3' }}>Email: visagoianiaalimentos@gmail.com</div>
                  </td>
                  
                  {/* Logo SUS à direita */}
                  <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '0' }}>
                    <img src={SUS_LOGO_SVG} alt="SUS" style={{ height: '50px', width: 'auto', display: 'inline-block' }} />
                  </td>
                </tr>
              </tbody>
            </table>
            
            {/* Título do documento */}
            <div className="mt-4 py-2 bg-gray-800 text-white text-center">
              <h2 className="text-base font-bold tracking-wide">
                {documentTypeLabels[document.document_type]?.toUpperCase() || document.document_type}
              </h2>
              {document.document_number && (
                <p className="text-sm">Nº {document.document_number}</p>
              )}
            </div>
            
            {/* Data e hora no cabeçalho - somente para Relatório Técnico e RA */}
            {(isRelatorioTecnico || isRelatorioAtividade) && (
              <div className="mt-3 mb-1 text-center">
                <p className="text-sm font-bold">
                  Goiânia, {formatDateFull(documentDate)}
                  {!isRelatorioAtividade && documentTime && ` — ${documentTime}h`}
                </p>
              </div>
            )}
          </div>

          {/* DADOS DO ESTABELECIMENTO - somente campos com valor, layout simétrico alinhado à esquerda */}
          {document.establishment && !isRelatorioAtividade && (
            <div className="doc-section border border-gray-300 p-4 mb-6">
              <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">
                {isRelatorioTecnico ? '1. IDENTIFICAÇÃO' : 'IDENTIFICAÇÃO DO ESTABELECIMENTO'}
              </h3>
              <div className="space-y-1 text-left">
                {/* Razão Social - sempre aparece */}
                <div className="doc-field">
                  <span className="doc-label">Razão Social: </span>
                  <span className="doc-value">{document.establishment.razao_social}</span>
                </div>
                
                {/* Nome Fantasia - só se preenchido */}
                {document.establishment.nome_fantasia && (
                  <div className="doc-field">
                    <span className="doc-label">Nome Fantasia: </span>
                    <span className="doc-value">{document.establishment.nome_fantasia}</span>
                  </div>
                )}
                
                {/* Inscrição Municipal - só se preenchido */}
                {(document.establishment as any).inscricao_municipal && (
                  <div className="doc-field">
                    <span className="doc-label">Inscrição Municipal: </span>
                    <span className="doc-value">{(document.establishment as any).inscricao_municipal}</span>
                  </div>
                )}
                
                {/* CNPJ - sempre aparece */}
                <div className="doc-field">
                  <span className="doc-label">CNPJ: </span>
                  <span className="doc-value">{document.establishment.cnpj}</span>
                </div>
                
                {/* Telefone - só se preenchido */}
                {document.establishment.responsavel_telefone && (
                  <div className="doc-field">
                    <span className="doc-label">Telefone: </span>
                    <span className="doc-value">{document.establishment.responsavel_telefone}</span>
                  </div>
                )}
                
                {/* Email - só se preenchido */}
                {(document.establishment as any).email && (
                  <div className="doc-field">
                    <span className="doc-label">Email: </span>
                    <span className="doc-value">{(document.establishment as any).email}</span>
                  </div>
                )}
                
                {/* Atividade/CNAE - só se preenchido */}
                {(document.establishment as any).cnae_principal && (
                  <div className="doc-field">
                    <span className="doc-label">Atividade: </span>
                    <span className="doc-value">{(document.establishment as any).cnae_principal}</span>
                  </div>
                )}
                
                {/* Responsável Técnico - só se preenchido */}
                {(document.establishment as any).responsavel_tecnico && (
                  <div className="doc-field">
                    <span className="doc-label">Responsável Técnico: </span>
                    <span className="doc-value">
                      {(document.establishment as any).responsavel_tecnico}
                      {(document.establishment as any).inscricao_conselho && ` (${(document.establishment as any).inscricao_conselho})`}
                    </span>
                  </div>
                )}
                
                {/* Responsável - só se preenchido */}
                {document.establishment.responsavel_nome && (
                  <div className="doc-field">
                    <span className="doc-label">Responsável: </span>
                    <span className="doc-value">
                      {document.establishment.responsavel_nome}
                      {document.establishment.responsavel_cpf && ` - CPF: ${document.establishment.responsavel_cpf}`}
                    </span>
                  </div>
                )}
                
                {/* Endereço - sempre aparece */}
                <div className="doc-field">
                  <span className="doc-label">Endereço: </span>
                  <span className="doc-value">{document.establishment.endereco}{document.establishment.bairro ? ` - ${document.establishment.bairro}` : ''}</span>
                </div>
              </div>
            </div>
          )}

          {/* RT PADRÃO - Seções 2, 3, 4 conforme template oficial */}
          {isRelatorioTecnico && !isRelatorioAmpliado && (
            <>
              {/* 2. DATA DA VISITA FISCAL */}
              <div className="doc-section border border-gray-300 p-4 mb-6">
                <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">2. DATA DA VISITA FISCAL</h3>
                <p className="text-sm font-bold">{formatDateFull(documentDate)}</p>
              </div>

              {/* 3. AUDITOR FISCAL */}
              <div className="doc-section border border-gray-300 p-4 mb-6">
                <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">3. AUDITOR FISCAL</h3>
                <p className="text-sm">
                  <strong>{document.profile?.full_name || document.content?.auditor || 'Auditor Fiscal'}</strong>
                  {(document.profile?.registration_number || document.content?.matricula) && 
                    ` — Matrícula: ${document.profile?.registration_number || document.content?.matricula}`
                  }
                </p>
                {/* Equipe adicional */}
                {relatorioTecnicoData?.equipe && relatorioTecnicoData.equipe.length > 0 && 
                  relatorioTecnicoData.equipe.some((m: any) => m.nome?.trim()) && (
                  <div className="mt-2 space-y-1">
                    {relatorioTecnicoData.equipe
                      .filter((m: any) => m.nome?.trim())
                      .map((m: any, i: number) => (
                        <p key={i} className="text-sm">
                          <strong>{m.nome}</strong>
                          {m.matricula && ` — Matrícula: ${m.matricula}`}
                        </p>
                      ))
                    }
                  </div>
                )}
              </div>

              {/* 4. OBJETIVO */}
              {relatorioTecnicoData?.objetivos && (
                <div className="doc-section border border-gray-300 p-4 mb-6">
                  <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">4. OBJETIVO</h3>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-justify">
                    {Array.isArray(relatorioTecnicoData.objetivos) 
                      ? relatorioTecnicoData.objetivos.filter((o: string) => o?.trim()).join('; ') + '.'
                      : relatorioTecnicoData.objetivos
                    }
                    {relatorioTecnicoData.outroObjetivo?.trim() && (
                      <span> {relatorioTecnicoData.outroObjetivo}</span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}


          {/* DADOS DO RELATÓRIO DE ATIVIDADE */}
          {isRelatorioAtividade && (
            <div className="doc-section border border-gray-300 p-4 mb-6">
              <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">DADOS DA ATIVIDADE</h3>
              <div className="space-y-1 text-left">
                {document.content?.atividade_id && (
                  <div className="doc-field">
                    <span className="doc-label">Atividade: </span>
                    <span className="doc-value">{document.content.atividade_id} — {document.content.atividade_descricao}</span>
                  </div>
                )}
                <div className="doc-field">
                  <span className="doc-label">Auditor: </span>
                  <span className="doc-value">{document.content?.auditor || document.profile?.full_name}</span>
                </div>
                {(document.content?.matricula || document.profile?.registration_number) && (
                  <div className="doc-field">
                    <span className="doc-label">Matrícula: </span>
                    <span className="doc-value">{document.content?.matricula || document.profile?.registration_number}</span>
                  </div>
                )}
                {(document.content?.hora_inicio || document.content?.hora_fim) && (
                  <div className="doc-field">
                    <span className="doc-label">Horário: </span>
                    <span className="doc-value">{document.content.hora_inicio || '—'} às {document.content.hora_fim || '—'}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CONTEXTO DA DENÚNCIA - Apenas para ações investigativas/denúncia */}
          {document.content?.denuncia_context && (
            <div className="doc-section border border-gray-300 p-4 mb-6">
              <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">CONTEXTO DA DENÚNCIA</h3>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                <p>Em resposta à denúncia a respeito de: <em>{document.content.denuncia_context}</em></p>
                <p className="mt-2">Segue a ação fiscal realizada:</p>
              </div>
            </div>
          )}

          {/* RT AMPLIADO - Narrative rendering */}
          {isRelatorioAmpliado && relatorioAmpliadoData && (
            <>
              {/* Objetivo */}
              <div className="doc-section border border-gray-300 p-4 mb-6">
                <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">5) OBJETIVO</h3>
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-justify">
                  {relatorioAmpliadoData.objetivo || 'Não informado.'}
                </div>
              </div>

              {/* Ação Fiscal - narrative blocks */}
              <div className="doc-section border border-gray-300 p-4 mb-6">
                <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">6) AÇÃO FISCAL</h3>
                <div className="space-y-4">
                  {relatorioAmpliadoData.blocks?.map((block: any, idx: number) => (
                    <div key={block.id || idx}>
                      {block.type === 'text' && block.text?.trim() && (
                        <div className="text-sm leading-relaxed whitespace-pre-wrap text-justify">
                          {block.text}
                        </div>
                      )}
                      {block.type === 'photo' && (
                        <div className="space-y-2">
                          {block.photoUrl && (
                            <div className="flex justify-center">
                              <img
                                src={block.photoUrl}
                                alt={`Foto ${idx + 1}`}
                                className="max-w-full max-h-[400px] object-contain rounded border border-gray-200"
                              />
                            </div>
                          )}
                          {block.photoLegend?.trim() && (
                            <p className="text-xs text-gray-600 italic text-center">
                              {block.photoLegend}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legislação Aplicada */}
              {(relatorioAmpliadoData.legislacaoAplicada?.length > 0 || relatorioAmpliadoData.outraLegislacao?.trim()) && (
                <div className="doc-section border border-gray-300 p-4 mb-6">
                  <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">LEGISLAÇÃO APLICADA</h3>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    {relatorioAmpliadoData.legislacaoAplicada?.map((leg: string, i: number) => (
                      <li key={i}>{leg}</li>
                    ))}
                    {relatorioAmpliadoData.outraLegislacao?.trim() && (
                      <li>{relatorioAmpliadoData.outraLegislacao}</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Considerações Finais */}
              {relatorioAmpliadoData.consideracoesFinais?.trim() && (
                <div className="doc-section border border-gray-300 p-4 mb-6">
                  <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">CONSIDERAÇÕES FINAIS / MEDIDAS TOMADAS</h3>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap text-justify">
                    {relatorioAmpliadoData.consideracoesFinais}
                  </div>
                </div>
              )}
            </>
          )}

          {/* ESPECIFICAÇÃO DAS IRREGULARIDADES - Não exibir para RA nem RT Ampliado */}
          {!isRelatorioAtividade && !isRelatorioAmpliado && <div className="doc-section border border-gray-300 p-4 mb-6">
            <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">
              {isRelatorioTecnico ? '5. AÇÃO FISCAL' : 'ESPECIFICAÇÃO DAS IRREGULARIDADES / OBSERVAÇÕES'}
            </h3>
            {isRelatorioTecnico && (
              <p className="text-sm mb-3 text-justify">
                Na data de {formatDateFull(documentDate)}, a equipe de fiscalização da Vigilância Sanitária Municipal compareceu ao local e, durante a inspeção, detectou as seguintes situações:
              </p>
            )}
            <div className="text-sm leading-relaxed whitespace-pre-wrap min-h-[150px]">
              {/* Se tiver legendas de fotos (IA), gerar texto automaticamente com referência cruzada */}
              {hasPhotoLegends && photoLegends.length > 0 ? (
                <div className="space-y-3">
                  <p className="mb-2">Durante a inspeção sanitária foram constatadas as seguintes irregularidades:</p>
                  <div className="space-y-3">
                    {photoLegends
                      .filter(legend => legend.legenda && legend.legenda.trim())
                      .map((legend, idx) => {
                        const itemNumber = idx + 1;
                        return (
                          <div key={idx} className="flex gap-2">
                            <span className="font-bold text-gray-700 shrink-0">{itemNumber}.</span>
                            <div className="text-justify">
                              <span>{legend.legenda}</span>
                              {legend.item_rdc && (
                                <span className="font-semibold"> (Item {legend.item_rdc} - RDC 216/2004)</span>
                              )}
                              <span className="text-gray-500 italic text-xs ml-1">[ver Foto {itemNumber}]</span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                (() => {
                  const textContent = content || '';
                  // Helper to render parsed irregularity items
                  const renderItems = (items: any[]) => (
                    <div className="space-y-3">
                      <p className="mb-2">Durante a inspeção sanitária foram constatadas as seguintes irregularidades:</p>
                      {items.map((nc: any, idx: number) => (
                        <div key={idx} className="flex gap-2">
                          <span className="font-bold text-gray-700 shrink-0">{idx + 1}.</span>
                          <div className="text-justify">
                            <span>{nc.descricao || nc.description || ''}</span>
                            {(nc.dispositivo || nc.legalBasis) && <span className="font-semibold"> ({nc.dispositivo || nc.legalBasis})</span>}
                            {nc.recommendation && <span className="text-gray-600 block text-xs mt-0.5">→ {nc.recommendation}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  );

                  // 1) Try document.irregularities array
                  if (document.irregularities && Array.isArray(document.irregularities) && document.irregularities.length > 0) {
                    return renderItems(document.irregularities as any[]);
                  }

                  // 2) Try parsing content as {nonConformities: [...]}
                  try {
                    if (typeof textContent === 'string' && textContent.trim().startsWith('{')) {
                      const parsed = JSON.parse(textContent);
                      if (parsed?.nonConformities && Array.isArray(parsed.nonConformities)) {
                        return renderItems(parsed.nonConformities);
                      }
                    }
                  } catch {}

                  // 3) Try parsing content as array of JSON objects (e.g. numbered lines with JSON)
                  try {
                    if (typeof textContent === 'string' && textContent.includes('"id"')) {
                      const jsonObjects: any[] = [];
                      const matches = textContent.match(/\{[^{}]*\}/g);
                      if (matches && matches.length > 0) {
                        for (const m of matches) {
                          try { jsonObjects.push(JSON.parse(m)); } catch {}
                        }
                        if (jsonObjects.length > 0 && jsonObjects[0].descricao) {
                          return renderItems(jsonObjects);
                        }
                      }
                    }
                  } catch {}

                  return textContent || 'Sem irregularidades especificadas.';
                })()
              )}
            </div>
          </div>}

          {/* OBSERVAÇÕES DO RA */}
          {isRelatorioAtividade && document.content?.observations && (
            <div className="doc-section border border-gray-300 p-4 mb-6">
              <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">OBSERVAÇÕES</h3>
              <div className="text-sm leading-relaxed whitespace-pre-wrap min-h-[80px]">
                {document.content.observations}
              </div>
            </div>
          )}

          {observations && !observations.includes('"nonConformities"') && !observations.startsWith('{') && (
            <div className="doc-section border border-gray-300 p-4 mb-6">
              <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">OBSERVAÇÕES ADICIONAIS</h3>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {observations}
              </div>
            </div>
          )}

          {/* 6. LEGISLAÇÃO APLICADA - Relatório Técnico Padrão */}
          {isRelatorioTecnico && !isRelatorioAmpliado && relatorioTecnicoData?.baseLegal && (
            <div className="doc-section border border-gray-300 p-4 mb-6">
              <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">
                6. LEGISLAÇÃO APLICADA
              </h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                {(Array.isArray(relatorioTecnicoData.baseLegal) ? relatorioTecnicoData.baseLegal : [relatorioTecnicoData.baseLegal])
                  .filter((b: string) => b?.trim())
                  .map((b: string, i: number) => (
                    <li key={i}>{b}</li>
                  ))
                }
                {relatorioTecnicoData.outraBaseLegal?.trim() && (
                  <li>{relatorioTecnicoData.outraBaseLegal}</li>
                )}
              </ul>
            </div>
          )}

          {/* 7. CONSIDERAÇÕES FINAIS E MEDIDAS TOMADAS - Relatório Técnico Padrão */}
          {isRelatorioTecnico && !isRelatorioAmpliado && (relatorioTecnicoData?.medidasLegais || relatorioTecnicoData?.conclusao) && (
            <div className="doc-section border border-gray-300 p-4 mb-6">
              <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">
                7. CONSIDERAÇÕES FINAIS E MEDIDAS TOMADAS
              </h3>
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-justify space-y-3">
                {relatorioTecnicoData.conclusao && <p>{relatorioTecnicoData.conclusao}</p>}
                {relatorioTecnicoData.medidasLegais && <p>{relatorioTecnicoData.medidasLegais}</p>}
              </div>
            </div>
          )}

          {/* PRAZO PARA ADEQUAÇÃO - Apenas para Termo de Intimação */}
          {isTermoIntimacao && (deadlineDate || document.deadline_date) && (
            <div className="doc-section border border-yellow-400 bg-yellow-50 p-4 mb-6">
              <h3 className="font-bold text-sm">PRAZO PARA ADEQUAÇÃO</h3>
              <p className="text-sm mt-1">
                Fica o responsável legal pelo estabelecimento intimado a sanar as irregularidades acima descritas no prazo de <strong>{deadlineDays || document.deadline_days} ({(deadlineDays || document.deadline_days) === 1 ? 'um' : (deadlineDays || document.deadline_days)}) dias</strong>, contados a partir do recebimento deste documento.
              </p>
              <p className="text-sm mt-1">
                <strong>Data limite:</strong> {formatDateFull(deadlineDate || document.deadline_date!)}
              </p>
            </div>
          )}

          {/* ANEXOS: ANÁLISE FOTOGRÁFICA DAS IRREGULARIDADES - Para documentos com legendas (Relatório Técnico ou Termo de Intimação com IA) */}
          {hasPhotoLegends && attachedPhotos.length > 0 && (
            <div className="doc-section border border-gray-300 p-4 mb-6">
              <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">
                {isRelatorioTecnico ? '8. ANEXOS - REGISTRO FOTOGRÁFICO' : 'ANEXOS - REGISTRO FOTOGRÁFICO'}
              </h3>
              <p className="text-xs text-gray-600 mb-4">
                As irregularidades descritas acima são comprovadas pelas evidências fotográficas a seguir, numeradas conforme o texto:
              </p>
              {/* 4 fotos por página — layout preciso A4 com CSS puro */}
              {(() => {
                const filteredLegends = photoLegends.filter(legend => legend.legenda && legend.legenda.trim());
                const pages: typeof filteredLegends[] = [];
                for (let i = 0; i < filteredLegends.length; i += 4) {
                  pages.push(filteredLegends.slice(i, i + 4));
                }
                return pages.map((page, pageIdx) => (
                  <div key={pageIdx} className={`folha-fotos break-before-page`}>
                    {page.map((legend, idx) => {
                      const globalIdx = pageIdx * 4 + idx;
                      const photoUrl = attachedPhotos[legend.photoIndex] || legend.previewUrl;
                      if (!photoUrl) return null;
                      const itemNumber = globalIdx + 1;
                      return (
                        <div key={globalIdx} className="foto-cell">
                          <div className="foto-img-wrap">
                            <span className="foto-badge">{itemNumber}</span>
                            <img src={photoUrl} alt={`Foto ${itemNumber}`} />
                          </div>
                          <p className="foto-legend">
                            <strong>FOTO {String(itemNumber).padStart(2, '0')}</strong>
                            {legend.item_rdc && <> — <strong>ITEM: {legend.item_rdc}</strong></>}
                            <br />
                            {legend.legenda}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          )}

          {/* REGISTRO FOTOGRÁFICO - Layout padrão para documentos sem legendas */}
          {!hasPhotoLegends && attachedPhotos.length > 0 && (
            <div className="doc-section border border-gray-300 p-4 mb-6">
              <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">REGISTRO FOTOGRÁFICO</h3>
              {(() => {
                const pages: string[][] = [];
                for (let i = 0; i < attachedPhotos.length; i += 4) {
                  pages.push(attachedPhotos.slice(i, i + 4));
                }
                return pages.map((page, pageIdx) => (
                  <div key={pageIdx} className={`folha-fotos ${pageIdx > 0 ? 'break-before-page' : ''}`}>
                    {page.map((photoUrl, idx) => {
                      const globalIdx = pageIdx * 4 + idx;
                      return (
                        <div key={globalIdx} className="foto-cell">
                          <div className="foto-img-wrap">
                            <span className="foto-badge">{globalIdx + 1}</span>
                            <img src={photoUrl} alt={`Foto ${globalIdx + 1}`} />
                          </div>
                          <p className="foto-legend">
                            <strong>FOTO {String(globalIdx + 1).padStart(2, '0')}</strong>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          )}

          {/* FOTO DO CONTRIBUINTE/PREPOSTO - se houver separadamente */}
          {contributorPhoto && document.document_type !== 'relatorio_tecnico' && !isRelatorioAtividade && (
            <div className="doc-section border border-gray-300 p-4 mb-6">
              <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">IDENTIFICAÇÃO DO RESPONSÁVEL PRESENTE</h3>
              <img 
                src={contributorPhoto} 
                alt="Responsável presente" 
                className="w-24 h-24 object-cover rounded border"
              />
            </div>
          )}

          {/* QR Code para acesso ao PDF - ACIMA das assinaturas */}
          <div className="doc-section mt-10 flex flex-col items-center gap-1">
            <QRCodeSVG
              value={`https://fiscaliz.lovable.app/doc/${document.id}`}
              size={72}
              level="M"
              includeMargin={false}
            />
            <span className="text-[7px] text-gray-400 leading-tight text-center">
              {document.status === 'draft' ? 'Prévia — link ativo após envio' : 'Escaneie para abrir o documento'}
            </span>
          </div>

          {/* ASSINATURAS - Rubricas acima dos nomes, simétricas */}
          <div className="doc-section mt-6">
            {/* Relatório Técnico ou Relatório de Atividade: apenas auditor(es) */}
            {(document.document_type === 'relatorio_tecnico' || isRelatorioAtividade) ? (
              <div>
                {/* Main auditor + equipe members */}
                {(() => {
                  const equipe = relatorioTecnicoData?.equipe as Array<{ nome: string; cargo: string; matricula: string }> | undefined;
                  const hasEquipe = equipe && equipe.length > 0 && equipe.some(m => m.nome?.trim());
                  const mainName = (document.profile?.full_name || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                  const mainMatricula = (document.profile?.registration_number || '').trim();
                  // De-duplicate: exclude equipe members matching main auditor by name OR matrícula
                  const isDuplicate = (m: { nome: string; matricula?: string }) => {
                    const mName = (m.nome || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                    const mMatricula = (m.matricula || '').trim();
                    return mName === mainName || (mainMatricula && mMatricula === mainMatricula);
                  };
                  // All signers: main auditor first, then equipe members (excluding duplicates)
                  const allSigners = [
                    {
                      nome: document.profile?.full_name || 'Auditor Fiscal',
                      cargo: 'Auditor Fiscal de Saúde Pública',
                      matricula: document.profile?.registration_number || '',
                      signatureUrl: document.profile?.signature_url,
                      isMain: true,
                    },
                    ...(hasEquipe
                      ? equipe!.filter(m => m.nome?.trim() && !isDuplicate(m)).map(m => ({
                          nome: m.nome,
                          cargo: m.cargo || 'Auditor Fiscal de Saúde Pública',
                          matricula: m.matricula || '',
                          signatureUrl: undefined as string | undefined,
                          isMain: false,
                        }))
                      : []),
                  ];
                  const cols = allSigners.length === 1 ? 'grid-cols-1 max-w-[50%] mx-auto' : allSigners.length === 2 ? 'grid-cols-2' : 'grid-cols-2 lg:grid-cols-3';
                  return (
                    <div className={`grid ${cols} gap-8`}>
                      {allSigners.map((signer, idx) => (
                        <div key={idx} className="text-center flex flex-col items-center">
                          <div className="min-h-[50px] flex items-end justify-center mb-1">
                            {(signer.isMain ? resolvedAuditorSignature : signer.signatureUrl) ? (
                              <img
                                src={(signer.isMain ? resolvedAuditorSignature : signer.signatureUrl)!}
                                alt={`Rubrica de ${signer.nome}`}
                                className="h-12 max-w-[180px] object-contain"
                              />
                            ) : (
                              <div className="signature-line" style={{ visibility: 'hidden' }} />
                            )}
                          </div>
                          <div className="signature-line mb-1" />
                          <p className="font-bold text-sm">{signer.nome}</p>
                          {signer.matricula && (
                            <p className="text-xs">Matrícula: {signer.matricula}</p>
                          )}
                          <p className="text-xs text-gray-600">{signer.cargo}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-12">
                {/* Coluna do Auditor Fiscal */}
                <div className="text-center flex flex-col items-center">
                  {/* Rubrica do Auditor - ACIMA do nome */}
                  <div className="min-h-[50px] flex items-end justify-center mb-1">
                    {resolvedAuditorSignature ? (
                      <img 
                        src={resolvedAuditorSignature} 
                        alt="Rubrica do Auditor" 
                        className="h-12 max-w-[180px] object-contain"
                      />
                    ) : (
                      <div className="signature-line" />
                    )}
                  </div>
                  {/* Linha de assinatura */}
                  <div className="signature-line mb-1" />
                  {/* Dados do Auditor */}
                  <p className="font-bold text-sm">{document.profile?.full_name || 'Auditor Fiscal'}</p>
                  {document.profile?.registration_number && (
                    <p className="text-xs">Matrícula: {document.profile.registration_number}</p>
                  )}
                  <p className="text-xs text-gray-600">Auditor Fiscal de Saúde Pública</p>
                </div>
                
                {/* Coluna do Contribuinte/Preposto */}
                <div className="text-center flex flex-col items-center">
                  {/* Rubrica/Foto do Contribuinte - ACIMA do nome */}
                  <div className="min-h-[50px] flex items-end justify-center mb-1">
                    {prepostoPhoto ? (
                      <img 
                        src={prepostoPhoto} 
                        alt="Preposto" 
                        className="w-12 h-12 object-cover rounded-full border"
                      />
                    ) : contributorSignatureUrl ? (
                      <img 
                        src={contributorSignatureUrl} 
                        alt="Assinatura" 
                        className="h-12 max-w-[180px] object-contain"
                      />
                    ) : (
                      <div className="signature-line" style={{ visibility: 'hidden' }} />
                    )}
                  </div>
                  {/* Linha de assinatura */}
                  <div className="signature-line mb-1" />
                  {/* Dados do Contribuinte */}
                  <p className="font-bold text-sm">Ciência do Contribuinte ou Preposto</p>
                  {prepostoName && (
                    <p className="text-xs">{prepostoName}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RODAPÉ OFICIAL - Data e horário em destaque para peças fiscais */}
          <div className="mt-10 pt-6 border-t-2 border-gray-400 text-gray-700">
            <div className="text-center">
              <p className="text-base font-bold tracking-wide" style={{ fontSize: '13pt' }}>
                Goiânia, {formatDateFull(documentDate)}
                {!isRelatorioAtividade && documentTime && ` — ${documentTime}h`}
              </p>
              <p className="mt-3 text-xs">Este documento foi gerado eletronicamente e possui validade legal conforme legislação vigente.</p>
              <p className="mt-1 text-xs font-semibold">Lei Municipal 8.741/08</p>
              <p className="mt-1 text-[10px]">1ª Via: Estabelecimento | 2ª Via: Fiscalização</p>
              <p className="mt-3 text-[9px] font-semibold text-gray-500">
                Criado por FISCALIZ<sup>®</sup>
              </p>
            </div>
          </div>
        </div>

        {/* Botões (ocultos na impressão) */}
        <div className="no-print fixed bottom-0 left-0 right-0 z-[10000] bg-white border-t shadow-lg p-4 flex gap-3 justify-center">
          <Button variant="outline" size="lg" onClick={() => setShowPDFPreview(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button size="lg" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* App Watermark - visible only in app, not in PDF */}
      <img 
        src={marcaDaguaFiscaliz} 
        alt="" 
        className="app-watermark print:hidden"
        aria-hidden="true"
      />
      
      {/* Document Preview */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div 
          ref={documentRef}
          className="relative bg-white text-black min-h-[600px] print:min-h-0"
          style={{ '--watermark-image': `url(${marcaDaguaFiscaliz})` } as React.CSSProperties}
        >
          {/* Watermark for document */}
          <div className="watermark print:hidden" />
          
          {/* Header - Official with Prefeitura Logo for PDF */}
          <CardHeader className="border-b-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-6 print:bg-white print:border-b print:border-gray-300">
            <div className="flex items-start gap-4">
              {/* Logo area - shows Fiscaliz in app, Prefeitura in print */}
              <div className="flex flex-col items-center gap-1">
                {/* Prefeitura logo - only visible in print */}
                <img 
                  src={BRASAO_GOIANIA_SVG} 
                  alt="Prefeitura de Goiânia" 
                  className="hidden print:block h-14 w-auto object-contain"
                />
                <img 
                  src={SUS_LOGO_SVG} 
                  alt="SUS" 
                  className="hidden print:block h-8 w-auto object-contain"
                />
                {/* Fiscaliz logo - only visible in app - TAMANHO MAIOR para rascunho */}
                <img 
                  src={logoFiscaliz}
                  alt="Fiscaliz" 
                  className="block print:hidden h-20 w-auto object-contain"
                />
              </div>
              <div className="flex-1 text-center">
                <p className="text-xs font-bold text-muted-foreground print:text-black">PREFEITURA DE GOIÂNIA</p>
                <p className="text-xs font-semibold text-muted-foreground print:text-black">SECRETARIA MUNICIPAL DE SAÚDE</p>
                <p className="text-xs text-muted-foreground print:text-black">DIRETORIA DE VIGILÂNCIA SANITÁRIA E AMBIENTAL</p>
                <div className="mt-3">
                  <h1 className="text-lg font-bold text-primary print:text-black">
                    {documentTypeLabels[document.document_type] || document.document_type}
                  </h1>
                  {document.document_number && (
                    <p className="text-sm font-semibold">Nº {document.document_number}</p>
                  )}
                </div>
              </div>
              <div className="text-right print:hidden">
                <Badge variant={isLocked ? 'secondary' : 'outline'} className="gap-1">
                  {isLocked ? <Lock className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                  {isLocked ? 'Enviado' : 'Rascunho'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6 print:p-4">
            {/* Coleta de Amostra - Renderiza o template oficial diretamente */}
            {isColetaAmostra && (
              <div className="border rounded-lg overflow-hidden bg-white">
                <ColetaAmostraPDF
                  document={document}
                  documentDate={documentDate}
                  documentTime={documentTime}
                  contributorSignatureUrl={contributorSignatureUrl}
                  prepostoName={prepostoName}
                  prepostoCpf={prepostoCpf}
                />
              </div>
            )}
            {/* Relatório de Atividade - Info específica */}
            {isRelatorioAtividade && (
              <div className="p-4 bg-muted/30 rounded-lg text-sm space-y-3">
                {document.content?.atividade_id && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary bg-primary/20 px-2 py-1 rounded">
                      {document.content.atividade_id}
                    </span>
                    <span className="font-medium">{document.content.atividade_descricao}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Auditor</p>
                    <p className="font-medium">{document.content?.auditor || document.profile?.full_name}</p>
                    {(document.content?.matricula || document.profile?.registration_number) && (
                      <p className="text-xs text-muted-foreground">Matrícula: {document.content?.matricula || document.profile?.registration_number}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Data</p>
                    {canEdit ? (
                      <Input
                        type="date"
                        value={documentDate}
                        onChange={(e) => setDocumentDate(e.target.value)}
                        className="text-sm h-8 print:hidden"
                      />
                    ) : (
                      <p className="font-medium">{formatDate(documentDate)}</p>
                    )}
                  </div>
                </div>
                {(document.content?.hora_inicio || document.content?.hora_fim) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Horário Início</p>
                      <p className="font-medium">{document.content.hora_inicio || '—'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Horário Fim</p>
                      <p className="font-medium">{document.content.hora_fim || '—'}</p>
                    </div>
                  </div>
                )}
                {document.content?.observations && (
                  <div>
                    <p className="text-xs text-muted-foreground">Observações</p>
                    <p className="text-sm whitespace-pre-wrap">{document.content.observations}</p>
                  </div>
                )}
              </div>
            )}

            {/* Establishment Info - Reorganized - Não exibir para Coleta de Amostra (já renderizado no template) */}
            {!isColetaAmostra && !isRelatorioAtividade && document.establishment && (
              <div className="p-4 bg-muted/30 rounded-lg text-sm print:bg-gray-50 print:border print:border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Coluna esquerda - dados do estabelecimento */}
                  <div className="space-y-2">
                    {/* Razão Social */}
                    <div className="flex items-start gap-2">
                      <Building className="h-4 w-4 mt-0.5 text-muted-foreground print:text-gray-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground print:text-gray-500">Razão Social</p>
                        <p className="font-semibold">{document.establishment.razao_social}</p>
                      </div>
                    </div>
                    
                    {/* Nome Fantasia */}
                    {document.establishment.nome_fantasia && (
                      <div className="pl-6">
                        <p className="text-xs text-muted-foreground print:text-gray-500">Nome Fantasia</p>
                        <p className="text-sm font-medium">{document.establishment.nome_fantasia}</p>
                      </div>
                    )}
                    
                    {/* Inscrição Municipal - placeholder */}
                    {(document.establishment as any).inscricao_municipal && (
                      <div className="pl-6">
                        <p className="text-xs"><span className="font-medium">Inscrição Municipal:</span> {(document.establishment as any).inscricao_municipal}</p>
                      </div>
                    )}
                    
                    {/* CNPJ */}
                    <div className="pl-6">
                      <p className="text-xs"><span className="font-medium">CNPJ:</span> {document.establishment.cnpj}</p>
                    </div>
                    
                    {/* Telefone */}
                    {document.establishment.responsavel_telefone && (
                      <div className="pl-6">
                        <p className="text-xs"><span className="font-medium">Telefone:</span> {document.establishment.responsavel_telefone}</p>
                      </div>
                    )}
                    
                    {/* Email - placeholder */}
                    {(document.establishment as any).email && (
                      <div className="pl-6">
                        <p className="text-xs"><span className="font-medium">Email:</span> {(document.establishment as any).email}</p>
                      </div>
                    )}
                    
                    {/* Atividade/CNAE */}
                    {(document.establishment as any).cnae_principal && (
                      <div className="pl-6">
                        <p className="text-xs"><span className="font-medium">Atividade:</span> {(document.establishment as any).cnae_principal}</p>
                      </div>
                    )}
                    
                    {/* Responsável Técnico - placeholder */}
                    {(document.establishment as any).responsavel_tecnico && (
                      <div className="pl-6">
                        <p className="text-xs">
                          <span className="font-medium">Responsável Técnico:</span> {(document.establishment as any).responsavel_tecnico}
                          {(document.establishment as any).inscricao_conselho && (
                            <span className="ml-1">({(document.establishment as any).inscricao_conselho})</span>
                          )}
                        </p>
                      </div>
                    )}
                    
                    {/* Responsável */}
                    {document.establishment.responsavel_nome && (
                      <div className="flex items-start gap-2 pt-2 border-t border-muted/50">
                        <User className="h-4 w-4 mt-0.5 text-muted-foreground print:text-gray-600 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground print:text-gray-500">Responsável</p>
                          <p className="text-sm font-medium">{document.establishment.responsavel_nome}</p>
                          {document.establishment.responsavel_cpf && (
                            <p className="text-xs text-muted-foreground">CPF: {document.establishment.responsavel_cpf}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Coluna direita - endereço */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground print:text-gray-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground print:text-gray-500">Endereço</p>
                        <p className="text-sm">{document.establishment.endereco}</p>
                        {document.establishment.bairro && (
                          <p className="text-xs text-muted-foreground">{document.establishment.bairro}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data/Hora e Observações - Editável no rascunho (RA já tem data inline) */}
            {canEdit && !isRelatorioAtividade && (
              <div className="p-4 bg-muted/30 rounded-lg space-y-4 print:hidden">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {isRelatorioAtividade ? 'Data da Atividade' : 'Data e Horário do Documento'}
                </p>
                
                <div className={isRelatorioAtividade ? '' : 'grid grid-cols-2 gap-4'}>
                  <div className="space-y-2">
                    <Label htmlFor="docDate" className="text-xs">Data</Label>
                    <Input
                      id="docDate"
                      type="date"
                      value={documentDate}
                      onChange={(e) => setDocumentDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  {!isRelatorioAtividade && (
                    <div className="space-y-2">
                      <Label htmlFor="docTime" className="text-xs">Horário</Label>
                      <Input
                        id="docTime"
                        type="time"
                        value={documentTime}
                        onChange={(e) => setDocumentTime(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Observações Adicionais - esconder se for JSON da análise por IA */}
                {(!observations || (!observations.includes('"nonConformities"') && !observations.startsWith('{'))) && (
                  <div className="space-y-2 pt-2 border-t">
                    <Label htmlFor="observations" className="text-xs flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Observações Adicionais
                    </Label>
                    <Textarea
                      id="observations"
                      placeholder="Irregularidades ou observações não contempladas no checklist ou análise por IA..."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      className="min-h-[80px] text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Campo para registrar informações adicionais não cobertas pelos métodos automáticos
                    </p>
                  </div>
                )}

              </div>
            )}

            {/* Document Content - Não exibir para Coleta de Amostra nem RA */}
            {!isColetaAmostra && !isRelatorioAtividade && <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Especificação das Irregularidades:</Label>
                {canEdit && !isEditing && !hasPhotoLegends && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="print:hidden">
                    <Edit3 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
                
              </div>
              
              {/* Se tem legendas de fotos (IA), exibir texto formatado com referência cruzada */}
              {hasPhotoLegends && photoLegends.length > 0 ? (
                canEdit ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground print:hidden">Clique nas legendas para editar diretamente:</p>
                    {editablePhotoLegends.map((legend, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <span className="font-bold text-sm text-muted-foreground shrink-0 mt-2">{idx + 1}.</span>
                        <div className="flex-1 space-y-1">
                          <Textarea
                            value={legend.legenda}
                            onChange={(e) => updateLegend(idx, 'legenda', e.target.value)}
                            onBlur={() => saveLegends()}
                            className="text-sm min-h-[50px] resize-none print:hidden"
                            placeholder="Descrição da não conformidade..."
                          />
                          <Input
                            value={legend.item_rdc}
                            onChange={(e) => updateLegend(idx, 'item_rdc', e.target.value)}
                            onBlur={() => saveLegends()}
                            className="text-sm h-8 print:hidden"
                            placeholder="Base legal (ex: 4.1.3)"
                          />
                          {/* Print version */}
                          <div className="hidden print:block text-sm text-justify">
                            <span>{legend.legenda}</span>
                            {legend.item_rdc && <span className="font-semibold"> (Item {legend.item_rdc})</span>}
                            <span className="text-muted-foreground italic text-xs ml-1">[ver Foto {idx + 1}]</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                <div className="bg-muted/20 rounded-lg p-4 min-h-[200px] print:bg-transparent print:border print:border-gray-200">
                  <div className="text-sm leading-relaxed space-y-3">
                    <p className="mb-2">Durante a inspeção sanitária foram constatadas as seguintes irregularidades:</p>
                    <div className="space-y-3">
                      {photoLegends
                        .filter(legend => legend.legenda && legend.legenda.trim())
                        .map((legend, idx) => {
                          const itemNumber = idx + 1;
                          return (
                            <div key={idx} className="flex gap-2">
                              <span className="font-bold text-muted-foreground shrink-0">{itemNumber}.</span>
                              <div className="text-justify">
                                <span>{legend.legenda}</span>
                                {legend.item_rdc && (
                                  <span className="font-semibold text-primary"> (Item {legend.item_rdc} - RDC 216/2004)</span>
                                )}
                                <span className="text-muted-foreground italic text-xs ml-1">[ver Foto {itemNumber}]</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    {/* Descrição livre removida - evita duplicar legendas */}
                  </div>
                </div>
                )
              ) : isEditing ? (
                <div className="space-y-2 print:hidden">
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                    placeholder="Digite as irregularidades..."
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      <Save className="h-4 w-4 mr-1" />
                      Salvar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-muted/20 rounded-lg p-4 min-h-[200px] print:bg-transparent print:border print:border-gray-200">
                  {(() => {
                    // Try rendering irregularities array first
                    if (document.irregularities && Array.isArray(document.irregularities) && document.irregularities.length > 0) {
                      return (
                        <div className="text-sm leading-relaxed space-y-3">
                          <p className="mb-2">Durante a inspeção sanitária foram constatadas as seguintes irregularidades:</p>
                          {(document.irregularities as any[]).map((nc: any, idx: number) => (
                            <div key={idx} className="flex gap-2">
                              <span className="font-bold text-muted-foreground shrink-0">{idx + 1}.</span>
                              <div className="text-justify">
                                <span>{nc.descricao || nc.description || ''}</span>
                                {(nc.dispositivo || nc.legalBasis) && <span className="font-semibold"> ({nc.dispositivo || nc.legalBasis})</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    // Try parsing JSON from content
                    try {
                      if (typeof content === 'string' && content.includes('"id"')) {
                        const jsonObjects: any[] = [];
                        const matches = content.match(/\{[^{}]*\}/g);
                        if (matches && matches.length > 0) {
                          for (const m of matches) {
                            try { jsonObjects.push(JSON.parse(m)); } catch {}
                          }
                          if (jsonObjects.length > 0 && jsonObjects[0].descricao) {
                            return (
                              <div className="text-sm leading-relaxed space-y-3">
                                <p className="mb-2">Durante a inspeção sanitária foram constatadas as seguintes irregularidades:</p>
                                {jsonObjects.map((nc: any, idx: number) => (
                                  <div key={idx} className="flex gap-2">
                                    <span className="font-bold text-muted-foreground shrink-0">{idx + 1}.</span>
                                    <div className="text-justify">
                                      <span>{nc.descricao || ''}</span>
                                      {nc.dispositivo && <span className="font-semibold"> ({nc.dispositivo})</span>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                        }
                      }
                    } catch {}
                    return (
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed print:text-black">
                        {content || 'Sem conteúdo'}
                      </pre>
                    );
                  })()}
                </div>
              )}

              {/* Anexos - Fotos legendadas no corpo do documento */}
              {hasPhotoLegends && attachedPhotos.length > 0 && (
                <div className="mt-6 pt-4 border-t">
                  <Label className="text-sm font-semibold mb-3 block">Anexos - Registro Fotográfico:</Label>
                  <p className="text-xs text-muted-foreground mb-3">
                    Fotos numeradas conforme as irregularidades acima:
                  </p>
                  {/* 2 fotos por página com quebra automática na impressão */}
                  {(() => {
                    const legends = (canEdit ? editablePhotoLegends.length > 0 ? editablePhotoLegends : photoLegends : photoLegends)
                      .filter(legend => canEdit || (legend.legenda && legend.legenda.trim()));
                    const pages: typeof legends[] = [];
                    for (let i = 0; i < legends.length; i += 2) {
                      pages.push(legends.slice(i, i + 2));
                    }
                    return pages.map((page, pageIdx) => (
                      <div key={pageIdx} className={`grid grid-cols-2 gap-3 ${pageIdx > 0 ? 'print:break-before-page print:pt-4' : ''}`}>
                        {page.map((legend, idx) => {
                          const globalIdx = pageIdx * 2 + idx;
                          const photoUrl = attachedPhotos[legend.photoIndex] || legend.previewUrl;
                          if (!photoUrl) return null;
                          const itemNumber = globalIdx + 1;
                          return (
                          <div key={globalIdx} className="flex flex-col rounded-lg border overflow-hidden">
                            <div className="relative aspect-[4/3] overflow-hidden">
                              <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded z-10">
                                {itemNumber}
                              </div>
                              <img 
                                src={photoUrl} 
                                alt={`Foto ${itemNumber}`} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            {canEdit ? (
                              <div className="p-2 space-y-1.5 print:hidden">
                                <Textarea
                                  value={legend.legenda}
                                  onChange={(e) => {
                                    if (editablePhotoLegends.length === 0) {
                                      setEditablePhotoLegends([...photoLegends]);
                                    }
                                    updateLegend(globalIdx, 'legenda', e.target.value);
                                  }}
                                  onBlur={() => {
                                    if (editablePhotoLegends.length > 0) saveLegends();
                                  }}
                                  className="text-xs min-h-[50px] resize-none"
                                  placeholder="Legenda..."
                                />
                                <Input
                                  value={legend.item_rdc}
                                  onChange={(e) => {
                                    if (editablePhotoLegends.length === 0) {
                                      setEditablePhotoLegends([...photoLegends]);
                                    }
                                    updateLegend(globalIdx, 'item_rdc', e.target.value);
                                  }}
                                  onBlur={() => {
                                    if (editablePhotoLegends.length > 0) saveLegends();
                                  }}
                                  className="text-xs h-7"
                                  placeholder="Base legal (ex: 4.1.3)"
                                />
                              </div>
                            ) : (
                              <div className="p-2 bg-muted/30 text-xs">
                                <span className="font-bold">Foto {itemNumber}:</span>{' '}
                                {legend.legenda}
                                {legend.item_rdc && (
                                  <span className="font-semibold text-primary ml-1">(Item {legend.item_rdc})</span>
                                )}
                              </div>
                            )}
                          </div>
                          );
                        })}
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>}

            {/* Deadline Section - Apenas para Termo de Intimação */}
            {isTermoIntimacao && (
              <div className="p-4 bg-warning/10 rounded-lg print:bg-yellow-50 print:border print:border-yellow-200">
                <p className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-warning print:text-yellow-600" />
                  Prazo para adequação
                </p>
                
                {canEdit ? (
                  <div className="space-y-3 print:hidden">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="deadlineDays" className="text-xs">Prazo (1-45 dias)</Label>
                        <Input
                          id="deadlineDays"
                          type="number"
                          min="1"
                          max="45"
                          value={deadlineDays || ''}
                          onChange={(e) => {
                            let days = parseInt(e.target.value) || undefined;
                            // Limitar entre 1 e 45 dias
                            if (days !== undefined) {
                              days = Math.max(1, Math.min(45, days));
                            }
                            setDeadlineDays(days);
                            if (days) {
                              const date = new Date();
                              date.setDate(date.getDate() + days);
                              setDeadlineDate(date.toISOString().split('T')[0]);
                            } else {
                              setDeadlineDate(undefined);
                            }
                          }}
                          placeholder="Ex: 15"
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deadlineDate" className="text-xs">Data limite</Label>
                        <Input
                          id="deadlineDate"
                          type="date"
                          value={deadlineDate || ''}
                          onChange={(e) => {
                            const dateStr = e.target.value;
                            if (dateStr) {
                              const today = new Date();
                              const target = new Date(dateStr);
                              const diffTime = target.getTime() - today.getTime();
                              let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              // Limitar entre 1 e 45 dias
                              if (diffDays > 45) {
                                diffDays = 45;
                                const maxDate = new Date();
                                maxDate.setDate(maxDate.getDate() + 45);
                                setDeadlineDate(maxDate.toISOString().split('T')[0]);
                              } else {
                                setDeadlineDate(dateStr);
                              }
                              setDeadlineDays(diffDays > 0 ? Math.min(45, diffDays) : undefined);
                            } else {
                              setDeadlineDate(undefined);
                              setDeadlineDays(undefined);
                            }
                          }}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Display deadline (visible in print and when locked) */}
                {(deadlineDate || document.deadline_date) && (
                  <div className={cn("text-sm", canEdit && "mt-3 pt-3 border-t border-warning/20")}>
                    <p>
                      <strong>{deadlineDays || document.deadline_days} dias</strong> - até {formatDate(deadlineDate || document.deadline_date!)}
                    </p>
                  </div>
                )}
                
                {!deadlineDate && !document.deadline_date && !canEdit && (
                  <p className="text-sm text-muted-foreground">Sem prazo definido</p>
                )}
              </div>
            )}

            {/* Contributor Photo Section - Não exibir para RA */}
            {!isRelatorioAtividade && <div className="p-4 bg-muted/20 rounded-lg print:bg-transparent">
              <p className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Registro Fotográfico (Estabelecimento)
              </p>
              {contributorPhoto ? (
                <div className="relative inline-block">
                  <img 
                    src={contributorPhoto} 
                    alt="Registro fotográfico" 
                    className="max-w-xs rounded-lg border shadow-sm"
                  />
                  {canEdit && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 print:hidden"
                      onClick={removePhoto}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ) : canEdit ? (
                <div className="flex gap-2 print:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCapturePhoto}
                    disabled={isUploading}
                  >
                    <Camera className="h-4 w-4 mr-1" />
                    Tirar foto
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma foto adicionada</p>
              )}
            </div>}

            {/* Evidence Photos Section - Upload/Edit Attachments */}
            {canEdit && (
              <div className="p-4 bg-muted/30 rounded-lg space-y-4 print:hidden">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Fotos de Evidência (Anexos)
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {evidencePhotos.length} foto(s)
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Adicione fotos das irregularidades ou evidências da fiscalização
                </p>

                {/* Grid of existing photos */}
                {evidencePhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {evidencePhotos.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg border overflow-hidden group">
                        <img 
                          src={url} 
                          alt={`Evidência ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeEvidencePhoto(idx)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs font-bold px-1.5 py-0.5 rounded">
                          {idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => evidenceFileInputRef.current?.click()}
                    disabled={isUploadingEvidence}
                    className="flex-1"
                  >
                    {isUploadingEvidence ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-1" />
                        Adicionar Fotos
                      </>
                    )}
                  </Button>
                  <input
                    ref={evidenceFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleEvidencePhotosUpload}
                  />
                </div>

                {/* AI Analysis Button */}
                {evidencePhotos.length > 0 && (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setShowLegislationDialog(true)}
                      disabled={isAnalyzingAI}
                      className="w-full"
                    >
                      {isAnalyzingAI ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          Analisando {evidencePhotos.length} foto(s)...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          Analisar com IA ({evidencePhotos.length} fotos)
                        </>
                      )}
                    </Button>
                    <LegislationSelectDialog
                      open={showLegislationDialog}
                      onOpenChange={setShowLegislationDialog}
                      onConfirm={(leg, obs) => handleAIAnalysis(leg, obs)}
                      isLoading={isAnalyzingAI}
                    />
                  </>
                )}
              </div>
            )}

            {/* Equipe da Ação Fiscal - Auditores e Testemunhas adicionais */}
            {canEdit && document.document_type !== 'relatorio_atividade' && (
              <TeamMembersSection
                members={teamMembers}
                onChange={setTeamMembers}
                documentId={document.id}
                editable={canEdit}
              />
            )}

            {/* Preposto/Responsável Section - Não exibir para certidão, relatório técnico ou RA */}
            {canEdit && document.document_type !== 'certidao' && document.document_type !== 'relatorio_tecnico' && !isRelatorioAtividade && (
              <div className="p-4 bg-muted/30 rounded-lg space-y-4 print:hidden">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Ciência do Contribuinte ou Preposto
                </p>
                
                {/* Opção de Foto OU Rubrica */}

                {/* Opção de Foto OU Rubrica */}
                <div className="space-y-3">
                  <Label className="text-xs">Identificação (escolha uma opção)</Label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Foto do Preposto */}
                    <div className="border rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-center">Foto</p>
                      {prepostoPhoto ? (
                        <div className="relative inline-block mx-auto">
                          <img 
                            src={prepostoPhoto} 
                            alt="Preposto" 
                            className="w-20 h-20 object-cover rounded-lg border mx-auto"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-5 w-5"
                            onClick={removePrepostoPhoto}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCapturePrepostoPhoto}
                            disabled={isUploading}
                            className="w-full text-xs"
                          >
                            <Camera className="h-3 w-3 mr-1" />
                            Capturar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => prepostoFileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full text-xs"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Galeria
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Rubrica/Assinatura */}
                    <div className="border rounded-lg p-3 space-y-2">
                      <p className="text-xs font-medium text-center">Rubrica</p>
                      {contributorSignatureUrl ? (
                        <div className="relative inline-block mx-auto">
                          <img 
                            src={contributorSignatureUrl} 
                            alt="Assinatura" 
                            className="h-16 border rounded mx-auto"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-5 w-5"
                            onClick={() => {
                              setContributorSignatureUrl(null);
                              // Auto-save quando remover assinatura
                              if (onSave) {
                                onSave({ 
                                  content: { 
                                    ...document.content, 
                                    text: content, 
                                    contributor_photo: contributorPhoto, 
                                    contributor_signature: null,
                                    preposto_photo: prepostoPhoto, 
                                    preposto_name: prepostoName, 
                                    preposto_cpf: prepostoCpf,
                                    document_date: documentDate,
                                    document_time: documentTime,
                                     observations: observations,
                                     team_members: teamMembers,
                                  } 
                                });
                              }
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowFullScreenSignature(true)}
                          className="w-full h-16 border-dashed flex flex-col gap-1"
                        >
                          <Edit3 className="h-5 w-5" />
                          <span className="text-xs">Assinar em tela cheia</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  <input
                    ref={prepostoFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePrepostoPhotoUpload}
                  />
                </div>

                <Button size="sm" onClick={savePrepostoData} className="w-full">
                  <Save className="h-4 w-4 mr-1" />
                  Salvar dados do contribuinte
                </Button>
              </div>
            )}

            {/* Seção simplificada para Certidão - apenas foto comprobatória */}
            {canEdit && document.document_type === 'certidao' && (
              <div className="p-4 bg-muted/30 rounded-lg space-y-4 print:hidden">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Foto Comprobatória (opcional)
                </p>
                <p className="text-xs text-muted-foreground">
                  Anexe uma foto para comprovar a ação realizada
                </p>
                
                {contributorPhoto ? (
                  <div className="relative inline-block">
                    <img 
                      src={contributorPhoto} 
                      alt="Foto comprobatória" 
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={removePhoto}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCapturePhoto}
                      disabled={isUploading}
                    >
                      <Camera className="h-4 w-4 mr-1" />
                      Capturar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Galeria
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Signatures Area */}
            <div className={`grid ${
              (document.document_type === 'relatorio_tecnico' || isRelatorioAtividade) && teamMembers.length === 0
                ? 'grid-cols-1 max-w-[50%] mx-auto' 
                : teamMembers.length > 0 
                  ? `grid-cols-2 md:grid-cols-${Math.min(2 + teamMembers.length, 4)}`
                  : 'grid-cols-2'
            } gap-8 pt-8 border-t print:pt-6`}>
              <div className="text-center space-y-2">
                {document.profile?.signature_url ? (
                  <img 
                    src={document.profile.signature_url} 
                    alt="Rubrica do Auditor" 
                    className="h-14 mx-auto"
                  />
                ) : (
                  <div className="h-16 border-b border-dashed border-muted-foreground print:border-gray-400" />
                )}
                <p className="text-sm font-semibold">Auditor Fiscal de Saúde Pública</p>
                {document.profile && (
                  <div className="text-xs text-muted-foreground print:text-gray-600">
                    <p>{document.profile.full_name}</p>
                    {document.profile.registration_number && (
                      <p>Mat. {document.profile.registration_number}</p>
                    )}
                  </div>
                )}
              </div>
              {document.document_type !== 'relatorio_tecnico' && !isRelatorioAtividade && (
                <div className="text-center space-y-2">
                  {prepostoPhoto ? (
                    <img 
                      src={prepostoPhoto} 
                      alt="Preposto" 
                      className="w-16 h-16 object-cover rounded-full border mx-auto"
                    />
                  ) : contributorSignatureUrl ? (
                    <img 
                      src={contributorSignatureUrl} 
                      alt="Assinatura" 
                      className="h-12 mx-auto border-b border-muted-foreground"
                    />
                  ) : (
                    <div className="h-16 border-b border-dashed border-muted-foreground print:border-gray-400" />
                  )}
                  <p className="text-sm font-semibold">Ciência do Contribuinte ou Preposto</p>
                  {prepostoName && (
                    <p className="text-xs text-muted-foreground print:text-gray-600">{prepostoName}</p>
                  )}
                </div>
              )}
              {/* Team Members Signatures */}
              <TeamMembersSignatures members={teamMembers} />
            </div>

            {/* Footer */}
            <div className="pt-4 border-t text-center text-xs text-muted-foreground print:text-gray-600">
              <p>Goiânia, {formatDate(documentDate)}</p>
              <p className="mt-1 font-semibold">Lei Municipal 8.741/08</p>
              <p className="mt-2 font-medium print:hidden">
                Documento gerado por{' '}
                <span className="text-primary font-bold">fiscaliz.app</span>
              </p>
              {/* Print-only footer */}
              <p className="hidden print:block mt-2 text-gray-500 text-[10px]">
                Este documento foi gerado eletronicamente e possui validade legal conforme legislação vigente.
              </p>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Action Buttons */}
      {!isLocked && (
        <div className="space-y-3 print:hidden">
          {/* Contact for sending */}
          {showSendModal && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <p className="text-sm font-medium">Dados para envio:</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="text-xs">Email do Contribuinte</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="email@empresa.com"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="whatsapp" className="text-xs">WhatsApp</Label>
                    <div className="relative mt-1">
                      <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="whatsapp"
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="(62) 99999-9999"
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowSendModal(false)}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={handleSend} disabled={!email && !whatsapp}>
                    <Send className="h-4 w-4 mr-2" />
                    Enviar Documento
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!showSendModal && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground text-center">
                O documento pode ser salvo e editado. Só será bloqueado após o envio.
              </p>
              
              {/* Salvar PDF - Não bloqueia */}
              <Button 
                onClick={handleGeneratePDF}
                variant="outline"
                className="w-full gap-2"
                size="lg"
              >
                <Download className="h-5 w-5" />
                Salvar PDF
              </Button>

              {/* Enviar - Bloqueia o documento */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-center text-muted-foreground">
                  Enviar e finalizar documento:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="default" 
                    onClick={() => {
                      if (onSendDocument) {
                        onSendDocument('sefiz');
                      } else {
                        toast({
                          title: "SIFIZ",
                          description: "Integração com SIFIZ em desenvolvimento",
                        });
                      }
                    }}
                    className="gap-1 text-xs h-auto py-3 flex-col"
                  >
                    <FileText className="h-4 w-4" />
                    Via SIFIZ
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={() => {
                      setShowSendModal(true);
                      setWhatsapp('');
                    }}
                    className="gap-1 text-xs h-auto py-3 flex-col"
                  >
                    <Mail className="h-4 w-4" />
                    Via Email
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={() => {
                      setShowSendModal(true);
                      setEmail('');
                    }}
                    className="gap-1 text-xs h-auto py-3 flex-col"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Via WhatsApp
                  </Button>
                  <Button 
                    variant="default" 
                    onClick={() => setShowQRCodeModal(true)}
                    className="gap-1 text-xs h-auto py-3 flex-col"
                  >
                    <QrCode className="h-4 w-4" />
                    Via QR Code
                  </Button>
                </div>
              </div>

              {/* Botão de fallback para iOS quando a abertura automática falha */}
              {pendingWhatsAppUrl && (
                <Button 
                  onClick={handleOpenWhatsAppManually}
                  variant="default"
                  className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white animate-pulse"
                  size="lg"
                >
                  <ExternalLink className="h-5 w-5" />
                  Abrir WhatsApp Agora
                </Button>
              )}

              {/* Apagar documento - Só para rascunhos */}
              {canEdit && onDelete && (
                <Button 
                  variant="destructive"
                  onClick={onDelete}
                  className="w-full gap-2"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                  Apagar Documento
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Botões para documentos já enviados (bloqueados) */}
      {isLocked && (
        <div className="space-y-3 print:hidden">
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Documento finalizado em {document.sent_at ? format(new Date(document.sent_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'data não registrada'}.
            </p>
          </div>
          
          <Button 
            onClick={handleSendViaWhatsApp}
            variant="premium"
            className="w-full gap-2"
            size="lg"
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <MessageCircle className="h-5 w-5" />
                Reenviar via WhatsApp
              </>
            )}
          </Button>

          {/* Botão de fallback para iOS quando a abertura automática falha */}
          {pendingWhatsAppUrl && (
            <Button 
              onClick={handleOpenWhatsAppManually}
              variant="default"
              className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white animate-pulse"
              size="lg"
            >
              <ExternalLink className="h-5 w-5" />
              Abrir WhatsApp Agora
            </Button>
          )}
          
          <Button 
            onClick={handleGeneratePDF}
            variant="outline"
            className="w-full gap-2"
          >
            <Download className="h-5 w-5" />
            Baixar PDF
          </Button>
        </div>
      )}

      {/* Full Screen Signature Modal */}
      <FullScreenSignature
        isOpen={showFullScreenSignature}
        onClose={() => setShowFullScreenSignature(false)}
        documentId={document.id}
        title="Ciência do Contribuinte ou Preposto"
        onSave={(url) => {
          setContributorSignatureUrl(url);
          // Auto-save imediato quando assinatura é capturada
          if (onSave) {
            onSave({ 
              content: { 
                ...document.content, 
                text: content, 
                contributor_photo: contributorPhoto, 
                contributor_signature: url,
                preposto_photo: prepostoPhoto, 
                preposto_name: prepostoName, 
                preposto_cpf: prepostoCpf,
                document_date: documentDate,
                document_time: documentTime,
                 observations: observations,
                 team_members: teamMembers,
              } 
            });
          }
        }}
      />

      {/* QR Code Modal for document delivery */}
      {showQRCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowQRCodeModal(false)}>
          <div className="bg-card rounded-2xl shadow-xl p-6 max-w-sm w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-foreground">QR Code do Documento</h3>
              <p className="text-xs text-muted-foreground">
                Mostre este QR Code para o contribuinte escanear e acessar o documento.
              </p>
            </div>
            <div className="flex justify-center p-4 bg-white rounded-xl">
              <QRCodeSVG
                value={`https://fiscaliz.lovable.app/doc/${document.id}`}
                size={200}
                level="H"
                includeMargin
              />
            </div>
            <p className="text-[10px] text-center text-muted-foreground break-all">
              fiscaliz.lovable.app/doc/{document.id.slice(0, 8)}...
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowQRCodeModal(false)}>
                Fechar
              </Button>
              <Button 
                className="flex-1 gap-1" 
                disabled={isGeneratingPDF}
                onClick={async () => {
                  if (onSendDocument) {
                    setIsGeneratingPDF(true);
                    try {
                      const pdfStoragePath = await generateAndUploadPDF();
                      await onSendDocument('sefiz', undefined, pdfStoragePath || undefined);
                    } catch (error: any) {
                      console.error('Error generating PDF for QR:', error);
                      toast({
                        title: 'Erro ao gerar PDF',
                        description: error?.message || 'Tente novamente.',
                        variant: 'destructive'
                      });
                    } finally {
                      setIsGeneratingPDF(false);
                    }
                    setShowQRCodeModal(false);
                  }
                }}
              >
                {isGeneratingPDF ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                {isGeneratingPDF ? 'Gerando PDF...' : 'Enviar e Bloquear'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

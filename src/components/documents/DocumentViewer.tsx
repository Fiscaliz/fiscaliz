import { useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import marcaDaguaFiscaliz from '@/assets/marca-dagua-fiscaliz.png';
import logoFiscaliz from '@/assets/logo-fiscaliz.png';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BRASAO_GOIANIA_SVG, SUS_LOGO_SVG, FISCALIZ_LOGO } from '@/lib/logos';
import { SignatureCanvas } from './SignatureCanvas';

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
  onGeneratePDF?: () => void;
  editable?: boolean;
}

const documentTypeLabels: Record<string, string> = {
  termo_intimacao: 'TERMO DE INTIMAÇÃO',
  visita_fiscal: 'TERMO DE REINSPEÇÃO',
  auto_infracao: 'AUTO DE INFRAÇÃO',
  advertencia: 'ADVERTÊNCIA',
  inutilizacao: 'TERMO DE INUTILIZAÇÃO',
  apreensao: 'TERMO DE APREENSÃO',
  interdicao: 'TERMO DE INTERDIÇÃO',
  relatorio_tecnico: 'PARECER TÉCNICO',
  notificacao: 'NOTIFICAÇÃO',
  replica: 'RÉPLICA',
  certidao: 'CERTIDÃO SANITÁRIA',
  coleta_amostra: 'TERMO DE COLETA DE AMOSTRA',
};

export function DocumentViewer({ 
  document, 
  onSave, 
  onSend, 
  onGeneratePDF,
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
  const [contributorSignatureUrl, setContributorSignatureUrl] = useState<string | null>(document.content?.contributor_signature || null);
  const [documentDate, setDocumentDate] = useState(document.content?.document_date || new Date(document.created_at).toISOString().split('T')[0]);
  const [documentTime, setDocumentTime] = useState(document.content?.document_time || new Date(document.created_at).toTimeString().slice(0, 5));
  const [observations, setObservations] = useState(document.content?.observations || '');
  const documentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prepostoFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get attached photos from document
  const attachedPhotos: string[] = useMemo(() => {
    if (!document.attachments) return [];
    return (document.attachments as AttachmentPhoto[])
      .filter(a => a.url)
      .map(a => a.url);
  }, [document.attachments]);

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

  const handleSend = () => {
    if (isTermoIntimacao && !hasDeadline) {
      toast({
        title: "Prazo obrigatório",
        description: "O Termo de Intimação requer um prazo definido antes do envio.",
        variant: "destructive"
      });
      return;
    }
    if (onSend) {
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

      const { data: urlData } = supabase.storage
        .from('fiscal-photos')
        .getPublicUrl(fileName);

      setContributorPhoto(urlData.publicUrl);
      
      // Auto-save when photo is uploaded
      if (onSave) {
        onSave({ content: { ...document.content, text: content, contributor_photo: urlData.publicUrl, preposto_photo: prepostoPhoto, preposto_name: prepostoName, preposto_cpf: prepostoCpf } });
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

      const { data: urlData } = supabase.storage
        .from('fiscal-photos')
        .getPublicUrl(fileName);

      setPrepostoPhoto(urlData.publicUrl);
      
      if (onSave) {
        onSave({ content: { ...document.content, text: content, contributor_photo: contributorPhoto, preposto_photo: urlData.publicUrl, preposto_name: prepostoName, preposto_cpf: prepostoCpf } });
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
      window.print();
    }, 500);
  };

  const formatDateFull = (dateStr: string) => {
    return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  // PDF Preview - Layout oficial igual ao modelo de Certidão
  if (showPDFPreview) {
    return (
      <div className="min-h-screen bg-white text-black print:text-black pdf-preview-container" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt' }}>
        <style>{`
          @media print {
            body { margin: 0; padding: 0; }
            .no-print, nav, .bottom-nav, [class*="bottom-"], [class*="BottomNav"], footer:not(.doc-footer), header:not(.doc-header) { display: none !important; visibility: hidden !important; opacity: 0 !important; height: 0 !important; overflow: hidden !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .pdf-preview-container * { display: revert; visibility: visible !important; opacity: 1 !important; }
          }
          @media screen {
            .pdf-preview-container { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999; overflow: auto; }
          }
          .doc-section { margin: 15px 0; }
          .doc-field { margin: 4px 0; text-align: left; }
          .doc-label { font-weight: bold; font-size: 10pt; display: inline; }
          .doc-value { font-size: 10pt; display: inline; }
          .signature-line { border-top: 1px solid #333; width: 220px; margin: 0 auto; }
        `}</style>

        <div className="p-8 max-w-4xl mx-auto bg-white">
          {/* CABEÇALHO OFICIAL - 3 colunas: Brasão | Textos | SUS */}
          <div className="mb-6 border-b-2 border-gray-800 pb-4">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  {/* Brasão à esquerda - largura fixa */}
                  <td style={{ width: '90px', verticalAlign: 'middle', textAlign: 'left' }}>
                    <img src={BRASAO_GOIANIA_SVG} alt="Prefeitura de Goiânia" style={{ height: '80px', width: 'auto' }} />
                  </td>
                  
                  {/* Textos centralizados */}
                  <td style={{ verticalAlign: 'middle', textAlign: 'center', padding: '0 16px' }}>
                    <div style={{ fontSize: '14pt', fontWeight: 'bold', color: '#111' }}>PREFEITURA DE GOIÂNIA</div>
                    <div style={{ fontSize: '12pt', fontWeight: 'bold', color: '#111' }}>SECRETARIA MUNICIPAL DE SAÚDE</div>
                    <div style={{ fontSize: '10pt', color: '#333' }}>DIRETORIA DE VIGILÂNCIA SANITÁRIA E AMBIENTAL</div>
                    <div style={{ fontSize: '8pt', color: '#555', marginTop: '4px' }}>Av. Universitária esq. c/ 1ª Avenida, s/nº - Setor Universitário - CEP: 74605-010</div>
                    <div style={{ fontSize: '8pt', color: '#555' }}>Email: visagoianiaalimentos@gmail.com</div>
                  </td>
                  
                  {/* Logo SUS à direita - largura fixa */}
                  <td style={{ width: '70px', verticalAlign: 'middle', textAlign: 'right' }}>
                    <img src={SUS_LOGO_SVG} alt="SUS" style={{ height: '50px', width: 'auto' }} />
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
          </div>

          {/* DADOS DO ESTABELECIMENTO - somente campos com valor, layout simétrico alinhado à esquerda */}
          {document.establishment && (
            <div className="doc-section border border-gray-300 p-4 mb-6">
              <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">IDENTIFICAÇÃO DO ESTABELECIMENTO</h3>
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

          {/* ESPECIFICAÇÃO DAS IRREGULARIDADES */}
          <div className="doc-section border border-gray-300 p-4 mb-6">
            <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">ESPECIFICAÇÃO DAS IRREGULARIDADES / OBSERVAÇÕES</h3>
            <div className="text-sm leading-relaxed whitespace-pre-wrap min-h-[150px]">
              {content || 'Sem irregularidades especificadas.'}
            </div>
          </div>

          {/* OBSERVAÇÕES ADICIONAIS */}
          {observations && (
            <div className="doc-section border border-gray-300 p-4 mb-6">
              <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">OBSERVAÇÕES ADICIONAIS</h3>
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {observations}
              </div>
            </div>
          )}

          {/* PRAZO PARA ADEQUAÇÃO */}
          {(deadlineDate || document.deadline_date) && (
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

          {/* REGISTRO FOTOGRÁFICO - Layout 2x4 (8 fotos por página) */}
          {attachedPhotos.length > 0 && (
            <div className="doc-section border border-gray-300 p-4 mb-6">
              <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">REGISTRO FOTOGRÁFICO</h3>
              <div className="grid grid-cols-2 gap-3">
                {attachedPhotos.map((photoUrl, idx) => (
                  <div key={idx} className="aspect-[4/3] border border-gray-200 rounded overflow-hidden">
                    <img 
                      src={photoUrl} 
                      alt={`Foto ${idx + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              {attachedPhotos.length > 8 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Página 1 de {Math.ceil(attachedPhotos.length / 8)}
                </p>
              )}
            </div>
          )}

          {/* FOTO DO CONTRIBUINTE/PREPOSTO - se houver separadamente */}
          {contributorPhoto && (
            <div className="doc-section border border-gray-300 p-4 mb-6">
              <h3 className="font-bold text-sm bg-gray-100 -m-4 mb-3 p-2 border-b border-gray-300">IDENTIFICAÇÃO DO RESPONSÁVEL PRESENTE</h3>
              <img 
                src={contributorPhoto} 
                alt="Responsável presente" 
                className="w-24 h-24 object-cover rounded border"
              />
            </div>
          )}

          {/* ASSINATURAS - Rubricas acima dos nomes, simétricas */}
          <div className="doc-section mt-10">
            <div className="grid grid-cols-2 gap-12">
              {/* Coluna do Auditor Fiscal */}
              <div className="text-center flex flex-col items-center">
                {/* Rubrica do Auditor - ACIMA do nome */}
                <div className="min-h-[50px] flex items-end justify-center mb-1">
                  {document.profile?.signature_url ? (
                    <img 
                      src={document.profile.signature_url} 
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
          </div>

          {/* RODAPÉ OFICIAL */}
          <div className="mt-10 pt-4 border-t text-xs text-center text-gray-600">
            <p>Goiânia, {formatDateFull(document.created_at)}</p>
            <p className="mt-2">Este documento foi gerado eletronicamente e possui validade legal conforme legislação vigente.</p>
            <p className="mt-1 font-semibold">Lei Municipal 8.741/08</p>
            <p className="mt-1 text-[10px]">1ª Via: Estabelecimento | 2ª Via: Fiscalização</p>
            <p className="mt-3 text-[9px] font-semibold text-gray-500">
              Criado por FISCALIZ<sup>®</sup>
            </p>
          </div>
        </div>

        {/* Botões (ocultos na impressão) */}
        <div className="no-print fixed bottom-4 right-4 flex gap-2">
          <Button variant="outline" onClick={() => setShowPDFPreview(false)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir PDF
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
                {/* Fiscaliz logo - only visible in app - TAMANHO PADRÃO h-12 */}
                <img 
                  src={logoFiscaliz}
                  alt="Fiscaliz" 
                  className="block print:hidden h-12 w-auto object-contain"
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
            {/* Establishment Info - Reorganized: Razão Social, Nome Fantasia, Inscrição Municipal, CNPJ, Telefone, Email, Atividade, Resp Técnico, Responsável. Endereço à direita */}
            {document.establishment && (
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

            {/* Data/Hora e Observações - Editável no rascunho */}
            {canEdit && (
              <div className="p-4 bg-muted/30 rounded-lg space-y-4 print:hidden">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Data e Horário do Documento
                </p>
                
                <div className="grid grid-cols-2 gap-4">
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
                </div>

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

              </div>
            )}

            {/* Document Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Especificação das Irregularidades:</Label>
                {canEdit && !isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="print:hidden">
                    <Edit3 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
              
              {isEditing ? (
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
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed print:text-black">
                    {content || 'Sem conteúdo'}
                  </pre>
                </div>
              )}
            </div>

            {/* Deadline Section - Editable */}
            <div className="p-4 bg-warning/10 rounded-lg print:bg-yellow-50 print:border print:border-yellow-200">
              <p className="font-semibold text-sm flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-warning print:text-yellow-600" />
                Prazo para adequação
              </p>
              
              {canEdit ? (
                <div className="space-y-3 print:hidden">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="deadlineDays" className="text-xs">Prazo (dias)</Label>
                      <Input
                        id="deadlineDays"
                        type="number"
                        min="1"
                        max="365"
                        value={deadlineDays || ''}
                        onChange={(e) => {
                          const days = parseInt(e.target.value) || undefined;
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
                          setDeadlineDate(dateStr);
                          if (dateStr) {
                            const today = new Date();
                            const target = new Date(dateStr);
                            const diffTime = target.getTime() - today.getTime();
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            setDeadlineDays(diffDays > 0 ? diffDays : undefined);
                          } else {
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

            {/* Contributor Photo Section */}
            <div className="p-4 bg-muted/20 rounded-lg print:bg-transparent">
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
            </div>

            {/* Preposto/Responsável Section - Editable (apenas para documentos que não sejam certidão) */}
            {canEdit && document.document_type !== 'certidao' && (
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
                            onClick={() => setContributorSignatureUrl(null)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <SignatureCanvas
                          documentId={document.id}
                          onSave={(url) => setContributorSignatureUrl(url)}
                        />
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
            <div className="grid grid-cols-2 gap-8 pt-8 border-t print:pt-6">
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
            </div>

            {/* Footer */}
            <div className="pt-4 border-t text-center text-xs text-muted-foreground print:text-gray-600">
              <p>Goiânia, {formatDate(document.created_at)}</p>
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
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={handleGeneratePDF}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Gerar PDF
              </Button>
              <Button 
                onClick={handleOpenSendModal}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

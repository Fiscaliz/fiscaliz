import { useState, useRef } from 'react';
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
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import marcaDaguaFiscaliz from '@/assets/marca-dagua-fiscaliz.png';

// Logo da prefeitura para uso no PDF
const PREFEITURA_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Bras%C3%A3o_de_Goi%C3%A2nia.svg/200px-Bras%C3%A3o_de_Goi%C3%A2nia.svg.png';
const SUS_LOGO_URL = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/SUS_logo.svg/200px-SUS_logo.svg.png';

interface DocumentViewerProps {
  document: {
    id: string;
    document_type: string;
    document_number?: string;
    content: any;
    irregularities?: any[];
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
  visita_fiscal: 'VISITA FISCAL',
  auto_infracao: 'AUTO DE INFRAÇÃO',
  advertencia: 'ADVERTÊNCIA',
  inutilizacao: 'INUTILIZAÇÃO',
  apreensao: 'APREENSÃO',
  interdicao: 'INTERDIÇÃO',
  relatorio_tecnico: 'RELATÓRIO TÉCNICO',
  notificacao: 'NOTIFICAÇÃO',
  replica: 'RÉPLICA',
  certidao: 'CERTIDÃO',
  coleta_amostra: 'COLETA DE AMOSTRA',
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
  const [contributorPhoto, setContributorPhoto] = useState<string | null>(document.content?.contributor_photo || null);
  const [isUploading, setIsUploading] = useState(false);
  const documentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isLocked = document.is_locked || document.status === 'sent';
  const canEdit = editable && !isLocked;

  const handleSave = () => {
    if (onSave) {
      onSave({ content: { ...document.content, text: content, contributor_photo: contributorPhoto } });
    }
    setIsEditing(false);
  };

  const handleSend = () => {
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
        onSave({ content: { ...document.content, text: content, contributor_photo: urlData.publicUrl } });
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
      onSave({ content: { ...document.content, text: content, contributor_photo: null } });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleGeneratePDF = () => {
    // When generating PDF, we use the print dialog which will show the official header
    if (onGeneratePDF) {
      onGeneratePDF();
    }
  };

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
                  src={PREFEITURA_LOGO_URL} 
                  alt="Prefeitura de Goiânia" 
                  className="hidden print:block h-14 w-auto object-contain"
                />
                <img 
                  src={SUS_LOGO_URL} 
                  alt="SUS" 
                  className="hidden print:block h-8 w-auto object-contain"
                />
                {/* Fiscaliz logo - only visible in app */}
                <img 
                  src={marcaDaguaFiscaliz} 
                  alt="Fiscaliz" 
                  className="block print:hidden h-16 w-16 object-contain opacity-80"
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
            {/* Establishment Info - Complete data */}
            {document.establishment && (
              <div className="p-4 bg-muted/30 rounded-lg text-sm print:bg-gray-50 print:border print:border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <Building className="h-4 w-4 mt-0.5 text-muted-foreground print:text-gray-600" />
                      <div>
                        <p className="text-xs text-muted-foreground print:text-gray-500">Estabelecimento</p>
                        <p className="font-semibold">{document.establishment.nome_fantasia || document.establishment.razao_social}</p>
                        <p className="text-xs text-muted-foreground">{document.establishment.razao_social}</p>
                      </div>
                    </div>
                    <div className="pl-6">
                      <p className="text-xs"><span className="font-medium">CNPJ:</span> {document.establishment.cnpj}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground print:text-gray-600" />
                      <div>
                        <p className="text-xs text-muted-foreground print:text-gray-500">Endereço</p>
                        <p className="text-sm">{document.establishment.endereco}</p>
                        {document.establishment.bairro && (
                          <p className="text-xs text-muted-foreground">{document.establishment.bairro}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  {document.establishment.responsavel_nome && (
                    <div className="col-span-full">
                      <div className="flex items-start gap-2">
                        <User className="h-4 w-4 mt-0.5 text-muted-foreground print:text-gray-600" />
                        <div>
                          <p className="text-xs text-muted-foreground print:text-gray-500">Responsável</p>
                          <p className="text-sm font-medium">{document.establishment.responsavel_nome}</p>
                          <div className="flex gap-4 text-xs text-muted-foreground">
                            {document.establishment.responsavel_cpf && (
                              <span>CPF: {document.establishment.responsavel_cpf}</span>
                            )}
                            {document.establishment.responsavel_telefone && (
                              <span>Tel: {document.establishment.responsavel_telefone}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
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

            {/* Deadline */}
            {document.deadline_date && (
              <div className="flex items-center gap-3 p-4 bg-warning/10 rounded-lg print:bg-yellow-50 print:border print:border-yellow-200">
                <Calendar className="h-5 w-5 text-warning print:text-yellow-600" />
                <div>
                  <p className="font-semibold text-sm">Prazo para adequação</p>
                  <p className="text-sm">
                    {document.deadline_days} dias - até {formatDate(document.deadline_date)}
                  </p>
                </div>
              </div>
            )}

            {/* Contributor Photo - if exists */}
            {contributorPhoto && (
              <div className="p-4 bg-muted/20 rounded-lg print:bg-transparent">
                <p className="text-sm font-semibold mb-2">Foto do Contribuinte:</p>
                <img 
                  src={contributorPhoto} 
                  alt="Contribuinte" 
                  className="max-w-xs rounded-lg border shadow-sm"
                />
              </div>
            )}

            {/* Signatures Area */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t print:pt-6">
              <div className="text-center space-y-2">
                <div className="h-16 border-b border-dashed border-muted-foreground print:border-gray-400" />
                <p className="text-sm font-semibold">Autoridade Fiscal</p>
                {document.profile && (
                  <div className="text-xs text-muted-foreground print:text-gray-600">
                    <p>{document.profile.full_name}</p>
                    {document.profile.registration_number && (
                      <p>Mat. {document.profile.registration_number}</p>
                    )}
                    {document.profile.division && (
                      <p>{document.profile.division}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="text-center space-y-2">
                <div className="h-16 border-b border-dashed border-muted-foreground print:border-gray-400" />
                <p className="text-sm font-semibold">Ciência do Responsável</p>
                <p className="text-xs text-muted-foreground print:text-gray-600">Assinatura / Data</p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t text-center text-xs text-muted-foreground print:text-gray-600">
              <p>Goiânia, {formatDate(document.created_at)}</p>
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
                onClick={() => setShowSendModal(true)}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Enviar
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Contributor Photo Area - Upload functional */}
      {!isLocked && (
        <Card className="border-0 shadow-sm print:hidden">
          <CardContent className="p-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              className="hidden"
            />
            
            {contributorPhoto ? (
              <div className="flex items-start gap-4">
                <div className="relative">
                  <img 
                    src={contributorPhoto} 
                    alt="Contribuinte" 
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  {canEdit && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                      onClick={removePhoto}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Foto do Contribuinte</p>
                  <p className="text-xs text-muted-foreground">
                    Foto adicionada com sucesso
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-muted/50 p-6 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Foto do Contribuinte</p>
                  <p className="text-xs text-muted-foreground">
                    Adicione foto do responsável presente na inspeção
                  </p>
                </div>
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
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

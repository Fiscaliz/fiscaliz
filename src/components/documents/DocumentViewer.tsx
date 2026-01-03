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
  Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';
import fiscalizLogo from '@/assets/fiscaliz-logo.png';

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
    };
    profile?: {
      full_name: string;
      registration_number?: string;
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
  const documentRef = useRef<HTMLDivElement>(null);

  const isLocked = document.is_locked || document.status === 'sent';
  const canEdit = editable && !isLocked;

  const handleSave = () => {
    if (onSave) {
      onSave({ content: { ...document.content, text: content } });
    }
    setIsEditing(false);
  };

  const handleSend = () => {
    if (onSend) {
      onSend({ email, whatsapp });
    }
    setShowSendModal(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-4">
      {/* Document Preview */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <div 
          ref={documentRef}
          className="relative bg-white text-black min-h-[600px]"
        >
          {/* Watermark */}
          <div className="watermark" />
          
          {/* Header - Official */}
          <CardHeader className="border-b-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-6">
            <div className="flex items-start gap-4">
              <img 
                src={fiscalizLogo} 
                alt="Fiscaliz" 
                className="h-16 w-16 object-contain"
              />
              <div className="flex-1 text-center">
                <p className="text-xs font-bold text-muted-foreground">PREFEITURA DE GOIÂNIA</p>
                <p className="text-xs font-semibold text-muted-foreground">SECRETARIA MUNICIPAL DE SAÚDE</p>
                <p className="text-xs text-muted-foreground">DIRETORIA DE VIGILÂNCIA SANITÁRIA E AMBIENTAL</p>
                <div className="mt-3">
                  <h1 className="text-lg font-bold text-primary">
                    {documentTypeLabels[document.document_type] || document.document_type}
                  </h1>
                  {document.document_number && (
                    <p className="text-sm font-semibold">Nº {document.document_number}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Badge variant={isLocked ? 'secondary' : 'outline'} className="gap-1">
                  {isLocked ? <Lock className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                  {isLocked ? 'Enviado' : 'Rascunho'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-6">
            {/* Establishment Info */}
            {document.establishment && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <Building className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{document.establishment.nome_fantasia || document.establishment.razao_social}</p>
                    <p className="text-xs text-muted-foreground">{document.establishment.razao_social}</p>
                    <p className="text-xs text-muted-foreground">CNPJ: {document.establishment.cnpj}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{document.establishment.endereco}</p>
                    {document.establishment.bairro && (
                      <p className="text-xs text-muted-foreground">{document.establishment.bairro}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Document Content */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Especificação das Irregularidades:</Label>
                {canEdit && !isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
              
              {isEditing ? (
                <div className="space-y-2">
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
                <div className="bg-muted/20 rounded-lg p-4 min-h-[200px]">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                    {content || 'Sem conteúdo'}
                  </pre>
                </div>
              )}
            </div>

            {/* Deadline */}
            {document.deadline_date && (
              <div className="flex items-center gap-3 p-4 bg-warning/10 rounded-lg">
                <Calendar className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-semibold text-sm">Prazo para adequação</p>
                  <p className="text-sm">
                    {document.deadline_days} dias - até {formatDate(document.deadline_date)}
                  </p>
                </div>
              </div>
            )}

            {/* Signatures Area */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t">
              <div className="text-center space-y-2">
                <div className="h-16 border-b border-dashed border-muted-foreground" />
                <p className="text-sm font-semibold">Autoridade Fiscal</p>
                {document.profile && (
                  <div className="text-xs text-muted-foreground">
                    <p>{document.profile.full_name}</p>
                    {document.profile.registration_number && (
                      <p>Mat. {document.profile.registration_number}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="text-center space-y-2">
                <div className="h-16 border-b border-dashed border-muted-foreground" />
                <p className="text-sm font-semibold">Ciência do Responsável</p>
                <p className="text-xs text-muted-foreground">Assinatura / Data</p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t text-center text-xs text-muted-foreground">
              <p>Goiânia, {formatDate(document.created_at)}</p>
              <p className="mt-2 font-medium">
                Documento gerado por{' '}
                <span className="text-primary font-bold">fiscaliz.app</span>
              </p>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Action Buttons */}
      {!isLocked && (
        <div className="space-y-3">
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
                onClick={onGeneratePDF}
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

      {/* Contributor Photo Area */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
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
            <Button variant="outline" size="sm">
              <Camera className="h-4 w-4 mr-1" />
              Capturar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

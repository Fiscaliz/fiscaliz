import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Upload, X, Image as ImageIcon, FileText, Building, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AnexoImage {
  id: string;
  url: string;
  legend: string;
}

export interface AnexoImagensConfig {
  images: AnexoImage[];
  showLegends: boolean;
  showHeader: boolean;
}

interface AnexoImagensSheetProps {
  config: AnexoImagensConfig;
  onChange: (config: AnexoImagensConfig) => void;
  documentId: string;
  editable?: boolean;
}

export function AnexoImagensSheet({ config, onChange, documentId, editable = true }: AnexoImagensSheetProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const updateConfig = (partial: Partial<AnexoImagensConfig>) => {
    onChange({ ...config, ...partial });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);
    const newImages: AnexoImage[] = [];

    for (const file of Array.from(files)) {
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/${documentId}_anexo_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

        const { error } = await supabase.storage
          .from('fiscal-photos')
          .upload(fileName, file, { upsert: true });
        if (error) throw error;

        const { data: signedData } = await supabase.storage
          .from('fiscal-photos')
          .createSignedUrl(fileName, 3600);

        if (signedData?.signedUrl) {
          newImages.push({
            id: crypto.randomUUID(),
            url: signedData.signedUrl,
            legend: '',
          });
        }
      } catch (err: any) {
        console.error('Upload error:', err);
        toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
      }
    }

    if (newImages.length > 0) {
      updateConfig({ images: [...config.images, ...newImages] });
      toast({ title: `${newImages.length} imagem(ns) adicionada(s)` });
    }

    setUploading(false);
    e.target.value = '';
  };

  const removeImage = (id: string) => {
    updateConfig({ images: config.images.filter(img => img.id !== id) });
  };

  const updateLegend = (id: string, legend: string) => {
    updateConfig({
      images: config.images.map(img => img.id === id ? { ...img, legend } : img),
    });
  };

  if (!editable) return null;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Anexo de Imagens</span>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5" />
              Legendas editáveis
            </Label>
            <Switch
              checked={config.showLegends}
              onCheckedChange={(v) => updateConfig({ showLegends: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5" />
              Cabeçalho com dados da empresa
            </Label>
            <Switch
              checked={config.showHeader}
              onCheckedChange={(v) => updateConfig({ showHeader: v })}
            />
          </div>
        </div>

        {/* Image grid preview */}
        {config.images.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">{config.images.length} imagem(ns) — {Math.ceil(config.images.length / 6)} página(s)</p>
            <div className="grid grid-cols-3 gap-2">
              {config.images.map((img) => (
                <div key={img.id} className="space-y-1">
                  <div className="relative aspect-square rounded-lg overflow-hidden border">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(img.id)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  {config.showLegends && (
                    <Input
                      placeholder="Legenda..."
                      value={img.legend}
                      onChange={(e) => updateLegend(img.id, e.target.value)}
                      className="text-[10px] h-6 px-1"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload buttons */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-1" />
            {uploading ? 'Enviando...' : 'Adicionar Imagens'}
          </Button>
        </div>

        {config.images.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => updateConfig({ images: [] })}
            className="w-full text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Limpar todas
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Renders the printable Anexo de Imagens pages for PDF preview.
 * Layout: 2 columns x 3 rows = 6 images per page.
 */
interface AnexoImagensPDFProps {
  config: AnexoImagensConfig;
  establishment?: {
    razao_social: string;
    nome_fantasia?: string;
    cnpj: string;
    endereco: string;
    bairro?: string;
  };
  documentNumber?: string;
  documentType?: string;
}

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

export function AnexoImagensPDF({ config, establishment, documentNumber, documentType }: AnexoImagensPDFProps) {
  if (!config.images.length) return null;

  // Split images into pages of 6
  const pages: AnexoImage[][] = [];
  for (let i = 0; i < config.images.length; i += 6) {
    pages.push(config.images.slice(i, i + 6));
  }

  return (
    <>
      {pages.map((pageImages, pageIdx) => (
        <div
          key={pageIdx}
          className="anexo-page"
          style={{
            width: '210mm',
            minHeight: '297mm',
            padding: '12mm',
            boxSizing: 'border-box',
            pageBreakBefore: 'always',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          {/* Optional header */}
          {config.showHeader && establishment && (
            <div style={{ 
              borderBottom: '2px solid #333',
              paddingBottom: '8px',
              marginBottom: '12px',
              fontSize: '9pt',
            }}>
              <p style={{ fontWeight: 'bold', fontSize: '10pt' }}>
                {establishment.nome_fantasia || establishment.razao_social}
              </p>
              <p>{establishment.razao_social}</p>
              <p>CNPJ: {establishment.cnpj}</p>
              <p>{establishment.endereco}{establishment.bairro ? ` — ${establishment.bairro}` : ''}</p>
            </div>
          )}

          {/* Page title */}
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <p style={{ fontWeight: 'bold', fontSize: '11pt' }}>
              ANEXO FOTOGRÁFICO
              {documentNumber ? ` — Nº ${documentNumber}` : ''}
            </p>
            {documentType && (
              <p style={{ fontSize: '9pt', color: '#555' }}>
                {documentTypeLabels[documentType] || documentType}
              </p>
            )}
            {pages.length > 1 && (
              <p style={{ fontSize: '8pt', color: '#888' }}>
                Página {pageIdx + 1} de {pages.length}
              </p>
            )}
          </div>

          {/* 2 columns x 3 rows grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: 'repeat(3, auto)',
            gap: '5mm 6mm',
            alignContent: 'start',
          }}>
            {pageImages.map((img, imgIdx) => {
              const globalIdx = pageIdx * 6 + imgIdx;
              return (
                <div key={img.id} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  breakInside: 'avoid',
                  pageBreakInside: 'avoid' as any,
                }}>
                  <div style={{
                    width: '100%',
                    height: '72mm',
                    overflow: 'hidden',
                    border: '1px solid #ccc',
                    borderRadius: '3px',
                    position: 'relative',
                  }}>
                    <img
                      src={img.url}
                      alt={`Foto ${globalIdx + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </div>
                  <p style={{
                    fontSize: '8pt',
                    textAlign: 'center',
                    fontStyle: config.showLegends && img.legend ? 'italic' : 'normal',
                    fontWeight: !config.showLegends || !img.legend ? 'bold' : 'normal',
                    color: '#333',
                    margin: '1px 0 0 0',
                    lineHeight: '1.2',
                  }}>
                    {config.showLegends && img.legend
                      ? `Foto ${String(globalIdx + 1).padStart(2, '0')}: ${img.legend}`
                      : `FOTO ${String(globalIdx + 1).padStart(2, '0')}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

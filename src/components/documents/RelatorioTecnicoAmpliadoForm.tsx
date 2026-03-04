import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  Calendar,
  Clock,
  Camera,
  X,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Type,
  Image as ImageIcon,
  FolderOpen,
  Scale,
  Target,
  Gavel,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ContentBlock = {
  id: string;
  type: 'text' | 'photo';
  text?: string;
  photoFile?: File;
  photoPreviewUrl?: string;
  photoLegend?: string;
};

export type RelatorioAmpliadoData = {
  objetivo: string;
  blocks: ContentBlock[];
  legislacaoAplicada: string[];
  outraLegislacao: string;
  consideracoesFinais: string;
  documentDate: string;
  documentTime: string;
};

type UploadedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

interface RelatorioTecnicoAmpliadoFormProps {
  value: RelatorioAmpliadoData;
  onChange: (data: RelatorioAmpliadoData) => void;
  photos: UploadedImage[];
  onAddPhoto: () => void;
  onCapturePhoto?: () => void;
  onRemovePhoto: (index: number) => void;
}

const legislacaoOptions = [
  'Resolução RDC nº 275/2002 - ANVISA',
  'Resolução RDC nº 216/2004 - ANVISA',
  'Lei Federal nº 6.437/1977',
  'Lei Municipal nº 8.741/2008 - Código Sanitário de Goiânia',
  'Lei Municipal nº 8.217/2008',
  'Portaria SMS 64/2023',
  'Portaria MS 888/2021',
  'Lei nº 8.078/1990 - CDC',
  'Resolução 20/2017 - DIVISA/SES-GO',
  'RDC nº 44/2009 - ANVISA',
];

function createBlock(type: 'text' | 'photo'): ContentBlock {
  return {
    id: crypto.randomUUID(),
    type,
    text: type === 'text' ? '' : undefined,
    photoLegend: type === 'photo' ? '' : undefined,
  };
}

export function RelatorioTecnicoAmpliadoForm({
  value,
  onChange,
  photos,
  onAddPhoto,
  onCapturePhoto,
  onRemovePhoto,
}: RelatorioTecnicoAmpliadoFormProps) {
  const photoInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const cameraInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const updateField = <K extends keyof RelatorioAmpliadoData>(field: K, val: RelatorioAmpliadoData[K]) => {
    onChange({ ...value, [field]: val });
  };

  const updateBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    updateField('blocks', value.blocks.map(b => b.id === blockId ? { ...b, ...updates } : b));
  };

  const addBlock = (type: 'text' | 'photo', afterId?: string) => {
    const newBlock = createBlock(type);
    if (afterId) {
      const idx = value.blocks.findIndex(b => b.id === afterId);
      const newBlocks = [...value.blocks];
      newBlocks.splice(idx + 1, 0, newBlock);
      updateField('blocks', newBlocks);
    } else {
      updateField('blocks', [...value.blocks, newBlock]);
    }
  };

  const removeBlock = (blockId: string) => {
    const block = value.blocks.find(b => b.id === blockId);
    if (block?.photoPreviewUrl) URL.revokeObjectURL(block.photoPreviewUrl);
    updateField('blocks', value.blocks.filter(b => b.id !== blockId));
  };

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    const idx = value.blocks.findIndex(b => b.id === blockId);
    if (direction === 'up' && idx > 0) {
      const newBlocks = [...value.blocks];
      [newBlocks[idx - 1], newBlocks[idx]] = [newBlocks[idx], newBlocks[idx - 1]];
      updateField('blocks', newBlocks);
    } else if (direction === 'down' && idx < value.blocks.length - 1) {
      const newBlocks = [...value.blocks];
      [newBlocks[idx], newBlocks[idx + 1]] = [newBlocks[idx + 1], newBlocks[idx]];
      updateField('blocks', newBlocks);
    }
  };

  const handlePhotoForBlock = (blockId: string, file: File) => {
    const previewUrl = URL.createObjectURL(file);
    updateBlock(blockId, { photoFile: file, photoPreviewUrl: previewUrl });
  };

  const toggleLegislacao = (leg: string) => {
    const current = value.legislacaoAplicada;
    if (current.includes(leg)) {
      updateField('legislacaoAplicada', current.filter(l => l !== leg));
    } else {
      updateField('legislacaoAplicada', [...current, leg]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Data e Hora */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Data e Hora da Inspeção</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Data</Label>
              <Input
                type="date"
                value={value.documentDate}
                onChange={e => updateField('documentDate', e.target.value)}
                className="h-10"
              />
            </div>
            <div>
              <Label className="text-xs">Hora</Label>
              <Input
                type="time"
                value={value.documentTime}
                onChange={e => updateField('documentTime', e.target.value)}
                className="h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Objetivo */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">5) Objetivo</span>
          </div>
          <Textarea
            value={value.objetivo}
            onChange={e => updateField('objetivo', e.target.value)}
            placeholder="Descreva o objetivo da inspeção sanitária. Ex.: Nesta ação fiscal foi realizada visita ao estabelecimento supracitado por solicitação da chefia imediata..."
            className="min-h-[100px] text-sm"
          />
        </CardContent>
      </Card>

      {/* Ação Fiscal - Content Blocks */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">6) Ação Fiscal</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {value.blocks.length} bloco(s)
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Monte o relatório com blocos de texto narrativo e fotos com legendas. Cada irregularidade pode ter uma foto associada com a referência legal.
          </p>

          {value.blocks.length === 0 && (
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">Nenhum bloco adicionado</p>
              <div className="flex gap-2 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addBlock('text')}
                >
                  <Type className="h-4 w-4 mr-1" />
                  Texto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addBlock('photo')}
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  Foto
                </Button>
              </div>
            </div>
          )}

          {value.blocks.map((block, idx) => (
            <div key={block.id} className="relative border border-border/60 rounded-xl overflow-hidden">
              {/* Block header */}
              <div className="flex items-center justify-between bg-muted/30 px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {block.type === 'text' ? 'Texto' : 'Foto'} #{idx + 1}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveBlock(block.id, 'up')}
                    disabled={idx === 0}
                    className="p-1 hover:bg-muted rounded disabled:opacity-30"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBlock(block.id, 'down')}
                    disabled={idx === value.blocks.length - 1}
                    className="p-1 hover:bg-muted rounded disabled:opacity-30"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeBlock(block.id)}
                    className="p-1 hover:bg-destructive/10 text-destructive rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Block content */}
              <div className="p-3">
                {block.type === 'text' ? (
                  <Textarea
                    value={block.text || ''}
                    onChange={e => updateBlock(block.id, { text: e.target.value })}
                    placeholder="Descreva a irregularidade encontrada, citando o dispositivo legal infringido. Ex.: Foram encontrados ralos de escoamento abertos... Desconformidade com a Resolução RDC nº 275/2002, item 1.16.1."
                    className="min-h-[100px] text-sm border-0 p-0 focus-visible:ring-0 resize-none"
                  />
                ) : (
                  <div className="space-y-3">
                    {block.photoPreviewUrl ? (
                      <div className="relative">
                        <img
                          src={block.photoPreviewUrl}
                          alt={`Foto ${idx + 1}`}
                          className="w-full max-h-[300px] object-contain rounded-lg bg-muted/20"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (block.photoPreviewUrl) URL.revokeObjectURL(block.photoPreviewUrl);
                            updateBlock(block.id, { photoFile: undefined, photoPreviewUrl: undefined });
                          }}
                          className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 shadow-md"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          ref={el => { photoInputRefs.current[block.id] = el; }}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoForBlock(block.id, file);
                            e.target.value = '';
                          }}
                        />
                        <input
                          ref={el => { cameraInputRefs.current[block.id] = el; }}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) handlePhotoForBlock(block.id, file);
                            e.target.value = '';
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => cameraInputRefs.current[block.id]?.click()}
                          className="flex-1 h-12"
                        >
                          <Camera className="h-5 w-5 mr-2" />
                          Capturar
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => photoInputRefs.current[block.id]?.click()}
                          className="flex-1 h-12"
                        >
                          <FolderOpen className="h-5 w-5 mr-2" />
                          Galeria
                        </Button>
                      </div>
                    )}
                    <Textarea
                      value={block.photoLegend || ''}
                      onChange={e => updateBlock(block.id, { photoLegend: e.target.value })}
                      placeholder="Legenda da foto. Ex.: Ralos escamoteáveis mantidos constantemente abertos propiciando o abrigo de pragas urbanas;"
                      className="min-h-[60px] text-sm"
                    />
                  </div>
                )}
              </div>

              {/* Add block buttons after each block */}
              <div className="flex items-center justify-center gap-2 py-2 bg-muted/10 border-t border-border/30">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => addBlock('text', block.id)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Texto
                </Button>
                <span className="text-muted-foreground/30">|</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => addBlock('photo', block.id)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Foto
                </Button>
              </div>
            </div>
          ))}

          {value.blocks.length > 0 && (
            <div className="flex gap-2 justify-center pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addBlock('text')}
              >
                <Type className="h-4 w-4 mr-1" />
                Adicionar Texto
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addBlock('photo')}
              >
                <ImageIcon className="h-4 w-4 mr-1" />
                Adicionar Foto
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legislação Aplicada */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Scale className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Legislação Aplicada</span>
          </div>
          <div className="space-y-2">
            {legislacaoOptions.map(leg => (
              <label key={leg} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.legislacaoAplicada.includes(leg)}
                  onChange={() => toggleLegislacao(leg)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-sm">{leg}</span>
              </label>
            ))}
          </div>
          <div className="pt-2">
            <Label className="text-xs text-muted-foreground">Outra legislação</Label>
            <Input
              value={value.outraLegislacao}
              onChange={e => updateField('outraLegislacao', e.target.value)}
              placeholder="Ex.: Resolução específica..."
              className="h-9 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Considerações Finais */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Gavel className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Considerações Finais / Medidas Tomadas</span>
          </div>
          <Textarea
            value={value.consideracoesFinais}
            onChange={e => updateField('consideracoesFinais', e.target.value)}
            placeholder="Descreva as considerações finais e medidas tomadas. Ex.: O estabelecimento apresenta inconformidades com relação às Boas Práticas de Fabricação que constituem pontos críticos..."
            className="min-h-[120px] text-sm"
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function formatRelatorioAmpliadoContent(data: RelatorioAmpliadoData): string {
  const lines: string[] = [];

  lines.push('5) Objetivo:');
  lines.push(data.objetivo || '(não informado)');
  lines.push('');

  lines.push('6) Ação fiscal:');
  for (const block of data.blocks) {
    if (block.type === 'text' && block.text?.trim()) {
      lines.push(block.text.trim());
      lines.push('');
    } else if (block.type === 'photo') {
      if (block.photoLegend?.trim()) {
        lines.push(`[FOTO] ${block.photoLegend.trim()}`);
        lines.push('');
      }
    }
  }

  if (data.legislacaoAplicada.length > 0 || data.outraLegislacao?.trim()) {
    lines.push('Legislação aplicada:');
    data.legislacaoAplicada.forEach(leg => lines.push(`- ${leg}`));
    if (data.outraLegislacao?.trim()) lines.push(`- ${data.outraLegislacao.trim()}`);
    lines.push('');
  }

  lines.push('Considerações Finais/medidas tomadas:');
  lines.push(data.consideracoesFinais || '(não informado)');

  return lines.join('\n');
}

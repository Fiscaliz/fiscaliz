import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Ban, Camera, X, FolderOpen, Calendar, Clock, ClipboardList, ChevronDown, ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { checklistTemplates } from '@/data/checklists';

export interface InterdicaoData {
  tipoInterdicao: 'total' | 'parcial' | '';
  areasInterditadas: string;
  motivoInterdicao: string;
  fundamentacaoLegal: string;
  condicoesDesinterdicao: string;
  usarChecklistDesinterdicao: boolean;
  checklistDesinterdicaoId: string;
  osNumero: string;
  observacoes: string;
  documentDate: string;
  documentTime: string;
}

interface InterdicaoFormProps {
  value: InterdicaoData;
  onChange: (data: InterdicaoData) => void;
  photos: { id: string; previewUrl: string }[];
  onAddPhoto: () => void;
  onCapturePhoto?: () => void;
  onRemovePhoto: (index: number) => void;
}

const motivosInterdicao = [
  'Risco iminente à saúde pública',
  'Condições higiênico-sanitárias precárias',
  'Funcionamento sem alvará sanitário',
  'Descumprimento de intimação anterior',
  'Surto alimentar relacionado ao estabelecimento',
  'Infestação de pragas',
  'Falta de água potável',
  'Estrutura física comprometida',
];

export function InterdicaoForm({
  value, onChange, photos, onAddPhoto, onCapturePhoto, onRemovePhoto,
}: InterdicaoFormProps) {
  const [showChecklistPicker, setShowChecklistPicker] = useState(false);

  const updateField = <K extends keyof InterdicaoData>(field: K, val: InterdicaoData[K]) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm border-l-4 border-l-destructive">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Ban className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-destructive">Termo de Interdição</p>
              <p className="text-xs text-muted-foreground mt-1">
                Documento que determina a interdição total ou parcial do estabelecimento por risco sanitário.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tipo de Interdição */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Label className="text-sm font-medium">Tipo de Interdição</Label>
          <div className="grid grid-cols-2 gap-3">
            <div
              className={cn(
                'p-4 rounded-xl border-2 cursor-pointer transition-all text-center',
                value.tipoInterdicao === 'total' ? 'border-destructive bg-destructive/10' : 'border-muted hover:border-destructive/50'
              )}
              onClick={() => updateField('tipoInterdicao', 'total')}
            >
              <Ban className={cn('h-6 w-6 mx-auto mb-2', value.tipoInterdicao === 'total' ? 'text-destructive' : 'text-muted-foreground')} />
              <p className="font-semibold text-sm">Total</p>
              <p className="text-xs text-muted-foreground">Todo o estabelecimento</p>
            </div>
            <div
              className={cn(
                'p-4 rounded-xl border-2 cursor-pointer transition-all text-center',
                value.tipoInterdicao === 'parcial' ? 'border-warning bg-warning/10' : 'border-muted hover:border-warning/50'
              )}
              onClick={() => updateField('tipoInterdicao', 'parcial')}
            >
              <Ban className={cn('h-6 w-6 mx-auto mb-2', value.tipoInterdicao === 'parcial' ? 'text-warning' : 'text-muted-foreground')} />
              <p className="font-semibold text-sm">Parcial</p>
              <p className="text-xs text-muted-foreground">Áreas específicas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nº de O.S. (para interdição total) */}
      {value.tipoInterdicao === 'total' && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-2">
            <Label className="text-sm font-medium">Nº da O.S. (Ordem de Serviço)</Label>
            <Input
              placeholder="Número da Ordem de Serviço"
              value={value.osNumero}
              onChange={(e) => updateField('osNumero', e.target.value)}
              className="text-sm"
            />
          </CardContent>
        </Card>
      )}

      {/* Áreas Interditadas (se parcial) */}
      {value.tipoInterdicao === 'parcial' && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-2">
            <Label className="text-sm font-medium">Áreas Interditadas</Label>
            <Textarea
              placeholder="Descreva as áreas específicas que foram interditadas..."
              value={value.areasInterditadas}
              onChange={(e) => updateField('areasInterditadas', e.target.value)}
              className="min-h-[80px] text-sm"
            />
          </CardContent>
        </Card>
      )}

      {/* Motivo */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Label className="text-sm font-medium">Motivo da Interdição</Label>
          <div className="space-y-2">
            {motivosInterdicao.map((motivo) => (
              <label
                key={motivo}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all text-sm',
                  value.motivoInterdicao === motivo ? 'bg-destructive/10 border border-destructive/30' : 'hover:bg-muted/50'
                )}
              >
                <input type="radio" name="motivoInterdicao" checked={value.motivoInterdicao === motivo} onChange={() => updateField('motivoInterdicao', motivo)} className="accent-destructive" />
                <span>{motivo}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fundamentação e condições */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Fundamentação Legal</Label>
            <Input placeholder="Ex: LM 8741/08 Art. 81 Inc. XVI" value={value.fundamentacaoLegal} onChange={(e) => updateField('fundamentacaoLegal', e.target.value)} className="text-sm" />
          </div>

          {/* Condições para Desinterdição */}
          <div className="space-y-2">
            <Label className="text-xs">Condições para Desinterdição</Label>
            
            {/* Opção: usar checklist */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={value.usarChecklistDesinterdicao}
                  onCheckedChange={(checked) => {
                    updateField('usarChecklistDesinterdicao', checked as boolean);
                    if (!checked) updateField('checklistDesinterdicaoId', '');
                  }}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Usar Checklist como condição</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vincular um checklist sanitário como requisito para desinterdição
                  </p>
                </div>
              </label>
            </div>

            {value.usarChecklistDesinterdicao && (
              <div className="space-y-2 pl-2">
                <button
                  type="button"
                  onClick={() => setShowChecklistPicker(!showChecklistPicker)}
                  className="w-full flex items-center justify-between p-3 rounded-lg border text-sm"
                >
                  <span>{value.checklistDesinterdicaoId ? checklistTemplates.find(c => c.id === value.checklistDesinterdicaoId)?.name || 'Selecionar...' : 'Selecionar checklist...'}</span>
                  {showChecklistPicker ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showChecklistPicker && (
                  <div className="space-y-1">
                    {checklistTemplates.map(template => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => {
                          updateField('checklistDesinterdicaoId', template.id);
                          setShowChecklistPicker(false);
                        }}
                        className={cn(
                          'w-full text-left p-3 rounded-lg border text-sm transition-colors',
                          value.checklistDesinterdicaoId === template.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                        )}
                      >
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.items.length} itens</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!value.usarChecklistDesinterdicao && (
              <Textarea 
                placeholder="Descreva as condições necessárias para a desinterdição..." 
                value={value.condicoesDesinterdicao} 
                onChange={(e) => updateField('condicoesDesinterdicao', e.target.value)} 
                className="min-h-[80px] text-sm" 
              />
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Observações</Label>
            <Textarea placeholder="Observações adicionais..." value={value.observacoes} onChange={(e) => updateField('observacoes', e.target.value)} className="min-h-[60px] text-sm" />
          </div>
        </CardContent>
      </Card>

      {/* Fotos */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Registro Fotográfico</Label>
              <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">Obrigatório</span>
            </div>
            <span className="text-xs text-muted-foreground">{photos.length} foto(s)</span>
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {photos.map((photo, idx) => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={photo.previewUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => onRemovePhoto(idx)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCapturePhoto || onAddPhoto} className="flex-1 h-12"><Camera className="h-5 w-5 mr-2" /> Capturar</Button>
            <Button variant="outline" size="sm" onClick={onAddPhoto} className="flex-1 h-12"><FolderOpen className="h-5 w-5 mr-2" /> Galeria</Button>
          </div>
          {photos.length === 0 && <p className="text-xs text-destructive">⚠️ Registro fotográfico obrigatório para interdição</p>}
        </CardContent>
      </Card>

      {/* Data/Hora */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> Data</Label>
              <Input type="date" value={value.documentDate} onChange={(e) => updateField('documentDate', e.target.value)} className="text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> Horário</Label>
              <Input type="time" value={value.documentTime} onChange={(e) => updateField('documentTime', e.target.value)} className="text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function formatInterdicaoContent(data: InterdicaoData): string {
  const lines: string[] = ['TERMO DE INTERDIÇÃO', ''];
  lines.push(`Tipo: Interdição ${data.tipoInterdicao === 'total' ? 'TOTAL' : 'PARCIAL'}`);
  if (data.tipoInterdicao === 'total' && data.osNumero) lines.push(`O.S. nº: ${data.osNumero}`);
  if (data.tipoInterdicao === 'parcial' && data.areasInterditadas) lines.push(`Áreas: ${data.areasInterditadas}`);
  if (data.motivoInterdicao) lines.push(`Motivo: ${data.motivoInterdicao}`);
  if (data.fundamentacaoLegal) lines.push(`Fundamentação Legal: ${data.fundamentacaoLegal}`);
  if (data.usarChecklistDesinterdicao && data.checklistDesinterdicaoId) {
    const checklist = checklistTemplates.find(c => c.id === data.checklistDesinterdicaoId);
    lines.push(`Condições para Desinterdição: Atendimento integral ao ${checklist?.name || 'checklist'}`);
  } else if (data.condicoesDesinterdicao) {
    lines.push(`Condições para Desinterdição: ${data.condicoesDesinterdicao}`);
  }
  if (data.observacoes) lines.push(`Observações: ${data.observacoes}`);
  return lines.join('\n');
}

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Scale, 
  Camera,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { legislationDatabase, type LegislationReference } from '@/data/checklists';

export interface InfracaoItem {
  id: string;
  descricao: string;
  dispositivo: string;
  dispositivoCompleto?: LegislationReference;
}

export interface AutoInfracaoData {
  infracoes: InfracaoItem[];
  valorMulta: string;
  prazoDefesa: number;
  documentDate: string;
  documentTime: string;
}

interface AutoInfracaoFormProps {
  value: AutoInfracaoData;
  onChange: (data: AutoInfracaoData) => void;
  photos: { id: string; previewUrl: string }[];
  onAddPhoto: () => void;
  onRemovePhoto: (index: number) => void;
  photosRequired?: boolean;
}

// Legislações mais comuns para Auto de Infração
const commonLegislations = [
  'RDC 216/2004',
  'Lei 8741/2008',
  'RDC 275/2002',
  'RDC 727/2022',
  'Lei Estadual 16.140/2007',
];

export function AutoInfracaoForm({ 
  value, 
  onChange, 
  photos, 
  onAddPhoto, 
  onRemovePhoto,
  photosRequired = true 
}: AutoInfracaoFormProps) {
  const [novaInfracao, setNovaInfracao] = useState('');
  const [novoDispositivo, setNovoDispositivo] = useState('');

  const addInfracao = () => {
    if (!novaInfracao.trim() || !novoDispositivo.trim()) return;
    
    const legislacaoRef = legislationDatabase.find(l => 
      l.code.toLowerCase().includes(novoDispositivo.toLowerCase()) ||
      novoDispositivo.toLowerCase().includes(l.code.toLowerCase())
    );

    const newItem: InfracaoItem = {
      id: `inf_${Date.now()}`,
      descricao: novaInfracao.trim(),
      dispositivo: novoDispositivo.trim(),
      dispositivoCompleto: legislacaoRef,
    };

    onChange({
      ...value,
      infracoes: [...value.infracoes, newItem],
    });

    setNovaInfracao('');
    setNovoDispositivo('');
  };

  const removeInfracao = (id: string) => {
    onChange({
      ...value,
      infracoes: value.infracoes.filter(i => i.id !== id),
    });
  };

  const updateField = <K extends keyof AutoInfracaoData>(field: K, fieldValue: AutoInfracaoData[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-4">
      {/* Aviso sobre Auto de Infração */}
      <Card className="border-0 shadow-sm border-l-4 border-l-destructive">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-destructive">Auto de Infração</p>
              <p className="text-xs text-muted-foreground mt-1">
                Documento punitivo que exige fundamentação legal obrigatória para cada infração 
                e registro fotográfico como prova documental.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registro Fotográfico Obrigatório */}
      <Card className={cn(
        "border-0 shadow-sm",
        photosRequired && photos.length === 0 && "border-2 border-destructive"
      )}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Registro Fotográfico</Label>
              <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">Obrigatório</span>
            </div>
            <span className="text-xs text-muted-foreground">{photos.length} foto(s)</span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Anexe fotos das irregularidades como prova documental para fundamentar o auto.
          </p>

          <div className="grid grid-cols-4 gap-2">
            {photos.map((photo, idx) => (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                <img src={photo.previewUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => onRemovePhoto(idx)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            
            <button
              onClick={onAddPhoto}
              className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Camera className="h-5 w-5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Adicionar</span>
            </button>
          </div>

          {photosRequired && photos.length === 0 && (
            <p className="text-xs text-destructive">
              ⚠️ É obrigatório anexar pelo menos uma foto das irregularidades
            </p>
          )}
        </CardContent>
      </Card>

      {/* Lista de Infrações */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Infrações com Dispositivo Legal</Label>
          </div>

          {/* Infrações cadastradas */}
          {value.infracoes.length > 0 && (
            <div className="space-y-2">
              {value.infracoes.map((infracao, idx) => (
                <div 
                  key={infracao.id}
                  className="p-3 rounded-lg border bg-muted/30 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{idx + 1}. {infracao.descricao}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-medium">
                          {infracao.dispositivo}
                        </span>
                        {infracao.dispositivoCompleto && (
                          <span className="text-xs text-muted-foreground">
                            - {infracao.dispositivoCompleto.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeInfracao(infracao.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Adicionar nova infração */}
          <div className="space-y-3 p-3 rounded-lg border border-dashed">
            <p className="text-xs text-muted-foreground font-medium">Adicionar Infração:</p>
            
            <div className="space-y-2">
              <Textarea
                placeholder="Descreva a infração encontrada..."
                value={novaInfracao}
                onChange={(e) => setNovaInfracao(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              
              <div className="space-y-1">
                <Label className="text-xs">Dispositivo Legal Infringido</Label>
                <Input
                  placeholder="Ex: RDC 216/2004, Art. 5º, inciso II"
                  value={novoDispositivo}
                  onChange={(e) => setNovoDispositivo(e.target.value)}
                  className="text-sm"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {commonLegislations.map(leg => (
                    <button
                      key={leg}
                      type="button"
                      className="text-xs bg-muted px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
                      onClick={() => setNovoDispositivo(leg)}
                    >
                      {leg}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={addInfracao}
              disabled={!novaInfracao.trim() || !novoDispositivo.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Infração
            </Button>
          </div>

          {value.infracoes.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Nenhuma infração adicionada. Adicione ao menos uma infração com o respectivo dispositivo legal.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Prazo para Defesa */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <Label className="text-sm font-medium">Prazo para Defesa</Label>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Conforme legislação vigente, o autuado tem direito a apresentar defesa.
          </p>

          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="10"
              max="30"
              value={value.prazoDefesa}
              onChange={(e) => updateField('prazoDefesa', parseInt(e.target.value) || 15)}
              className="w-20 text-sm"
            />
            <span className="text-sm text-muted-foreground">dias para apresentação de defesa</span>
          </div>
        </CardContent>
      </Card>

      {/* Data e Hora */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="autoDate" className="text-xs">Data da Autuação</Label>
              <Input
                id="autoDate"
                type="date"
                value={value.documentDate}
                onChange={(e) => updateField('documentDate', e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="autoTime" className="text-xs">Horário</Label>
              <Input
                id="autoTime"
                type="time"
                value={value.documentTime}
                onChange={(e) => updateField('documentTime', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function formatAutoInfracaoContent(data: AutoInfracaoData): string {
  const parts: string[] = [];

  if (data.infracoes.length > 0) {
    const infracaoTexts = data.infracoes.map((inf, idx) => {
      let text = `${idx + 1}. ${inf.descricao}`;
      text += `\n   Dispositivo Legal: ${inf.dispositivo}`;
      if (inf.dispositivoCompleto) {
        text += ` - ${inf.dispositivoCompleto.name}`;
      }
      return text;
    });
    parts.push(`INFRAÇÕES SANITÁRIAS:\n\n${infracaoTexts.join('\n\n')}`);
  }

  parts.push(`\nPRAZO PARA DEFESA: ${data.prazoDefesa} dias contados a partir da ciência deste auto.`);
  parts.push('\nO autuado poderá apresentar defesa por escrito à Diretoria de Vigilância Sanitária e Ambiental no prazo acima estabelecido.');

  return parts.join('\n');
}

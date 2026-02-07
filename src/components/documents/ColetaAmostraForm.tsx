import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Beaker, 
  Plus, 
  Trash2, 
  Camera, 
  X, 
  FolderOpen,
  Calendar,
  Clock,
  FlaskConical,
  Tag,
  Hash,
  Thermometer,
  Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AmostraItem {
  id: string;
  produto: string;
  marca: string;
  lote: string;
  fabricacao: string;
  validade: string;
  quantidade: string;
  unidade: string;
  temperatura: string;
  lacre: string;
  observacoes: string;
}

export interface ColetaAmostraData {
  amostras: AmostraItem[];
  laboratorio: string;
  motivoColeta: string;
  procedimentoColeta: string;
  condicaoArmazenamento: string;
  responsavelEntrega: string;
  documentDate: string;
  documentTime: string;
}

interface ColetaAmostraFormProps {
  value: ColetaAmostraData;
  onChange: (data: ColetaAmostraData) => void;
  photos: { id: string; previewUrl: string }[];
  onAddPhoto: () => void;
  onCapturePhoto?: () => void;
  onRemovePhoto: (index: number) => void;
}

const motivosColeta = [
  'Programação rotineira de monitoramento',
  'Denúncia de consumidor',
  'Investigação de surto alimentar',
  'Suspeita de irregularidade na composição',
  'Verificação de rotulagem',
  'Recoleta após resultado insatisfatório',
  'Operação conjunta',
];

const laboratorios = [
  'LACEN-GO (Laboratório Central de Saúde Pública)',
  'INCQS/FIOCRUZ',
  'Laboratório Municipal',
  'Laboratório credenciado - outro',
];

const unidades = ['g', 'kg', 'mL', 'L', 'unidade(s)'];

const createEmptyAmostra = (): AmostraItem => ({
  id: `amostra_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  produto: '',
  marca: '',
  lote: '',
  fabricacao: '',
  validade: '',
  quantidade: '',
  unidade: 'g',
  temperatura: '',
  lacre: '',
  observacoes: '',
});

export function ColetaAmostraForm({
  value,
  onChange,
  photos,
  onAddPhoto,
  onCapturePhoto,
  onRemovePhoto,
}: ColetaAmostraFormProps) {
  const [expandedAmostra, setExpandedAmostra] = useState<string | null>(
    value.amostras.length > 0 ? value.amostras[0].id : null
  );

  const updateField = <K extends keyof ColetaAmostraData>(field: K, fieldValue: ColetaAmostraData[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const addAmostra = () => {
    const nova = createEmptyAmostra();
    updateField('amostras', [...value.amostras, nova]);
    setExpandedAmostra(nova.id);
  };

  const removeAmostra = (id: string) => {
    updateField('amostras', value.amostras.filter(a => a.id !== id));
    if (expandedAmostra === id) setExpandedAmostra(null);
  };

  const updateAmostra = (id: string, field: keyof AmostraItem, val: string) => {
    updateField('amostras', value.amostras.map(a =>
      a.id === id ? { ...a, [field]: val } : a
    ));
  };

  return (
    <div className="space-y-4">
      {/* Informações do documento */}
      <Card className="border-0 shadow-sm border-l-4 border-l-secondary">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Beaker className="h-5 w-5 text-secondary mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-secondary">Termo de Coleta de Amostra</p>
              <p className="text-xs text-muted-foreground mt-1">
                Documento para coleta oficial de amostras para análise laboratorial. 
                Preencha os dados de cada produto coletado.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Motivo da Coleta */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Motivo da Coleta</Label>
          </div>
          <div className="space-y-2">
            {motivosColeta.map((motivo) => (
              <label
                key={motivo}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all text-sm',
                  value.motivoColeta === motivo
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-muted/50'
                )}
              >
                <input
                  type="radio"
                  name="motivoColeta"
                  checked={value.motivoColeta === motivo}
                  onChange={() => updateField('motivoColeta', motivo)}
                  className="accent-primary"
                />
                <span>{motivo}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Laboratório Destino */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Laboratório de Destino</Label>
          </div>
          <div className="space-y-2">
            {laboratorios.map((lab) => (
              <label
                key={lab}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all text-sm',
                  value.laboratorio === lab
                    ? 'bg-primary/10 border border-primary/30'
                    : 'hover:bg-muted/50'
                )}
              >
                <input
                  type="radio"
                  name="laboratorio"
                  checked={value.laboratorio === lab}
                  onChange={() => updateField('laboratorio', lab)}
                  className="accent-primary"
                />
                <span>{lab}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Amostras */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Amostras Coletadas</Label>
            </div>
            <span className="text-xs text-muted-foreground">{value.amostras.length} amostra(s)</span>
          </div>

          {value.amostras.map((amostra, idx) => (
            <Card
              key={amostra.id}
              className={cn(
                'border shadow-none transition-all',
                expandedAmostra === amostra.id ? 'border-primary/50' : 'border-border'
              )}
            >
              <CardContent className="p-3 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm font-medium"
                    onClick={() => setExpandedAmostra(expandedAmostra === amostra.id ? null : amostra.id)}
                  >
                    <Beaker className="h-4 w-4 text-secondary" />
                    <span>Amostra {idx + 1}</span>
                    {amostra.produto && (
                      <span className="text-xs text-muted-foreground">- {amostra.produto}</span>
                    )}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeAmostra(amostra.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {expandedAmostra === amostra.id && (
                  <div className="space-y-3 pt-2 border-t">
                    {/* Produto */}
                    <div className="space-y-1">
                      <Label className="text-xs">Produto / Descrição *</Label>
                      <Input
                        placeholder="Ex: Leite integral UHT, Linguiça toscana..."
                        value={amostra.produto}
                        onChange={(e) => updateAmostra(amostra.id, 'produto', e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    {/* Marca e Lote */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Marca</Label>
                        <Input
                          placeholder="Marca do produto"
                          value={amostra.marca}
                          onChange={(e) => updateAmostra(amostra.id, 'marca', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Lote</Label>
                        <Input
                          placeholder="Nº do lote"
                          value={amostra.lote}
                          onChange={(e) => updateAmostra(amostra.id, 'lote', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Fabricação e Validade */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Data Fabricação</Label>
                        <Input
                          type="date"
                          value={amostra.fabricacao}
                          onChange={(e) => updateAmostra(amostra.id, 'fabricacao', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Data Validade</Label>
                        <Input
                          type="date"
                          value={amostra.validade}
                          onChange={(e) => updateAmostra(amostra.id, 'validade', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Quantidade e Unidade */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Quantidade</Label>
                        <Input
                          type="number"
                          placeholder="Qtd"
                          value={amostra.quantidade}
                          onChange={(e) => updateAmostra(amostra.id, 'quantidade', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Unidade</Label>
                        <select
                          value={amostra.unidade}
                          onChange={(e) => updateAmostra(amostra.id, 'unidade', e.target.value)}
                          className="flex h-12 w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm"
                        >
                          {unidades.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Temperatura e Lacre */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          <Thermometer className="h-3 w-3" />
                          Temperatura (°C)
                        </Label>
                        <Input
                          placeholder="Ex: 5.2"
                          value={amostra.temperatura}
                          onChange={(e) => updateAmostra(amostra.id, 'temperatura', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          Nº do Lacre
                        </Label>
                        <Input
                          placeholder="Nº lacre"
                          value={amostra.lacre}
                          onChange={(e) => updateAmostra(amostra.id, 'lacre', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Observações da amostra */}
                    <div className="space-y-1">
                      <Label className="text-xs">Observações da Amostra</Label>
                      <Textarea
                        placeholder="Condições do produto, aparência, embalagem..."
                        value={amostra.observacoes}
                        onChange={(e) => updateAmostra(amostra.id, 'observacoes', e.target.value)}
                        className="min-h-[60px] text-sm"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Button
            variant="outline"
            className="w-full"
            onClick={addAmostra}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Amostra
          </Button>
        </CardContent>
      </Card>

      {/* Procedimento de Coleta */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Label className="text-sm font-medium">Procedimento de Coleta</Label>
          <Textarea
            placeholder="Descreva o procedimento de coleta utilizado (método, equipamentos, acondicionamento)..."
            value={value.procedimentoColeta}
            onChange={(e) => updateField('procedimentoColeta', e.target.value)}
            className="min-h-[80px] text-sm"
          />
        </CardContent>
      </Card>

      {/* Condição de Armazenamento */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Label className="text-sm font-medium">Condição de Armazenamento no Local</Label>
          <Textarea
            placeholder="Descreva as condições de armazenamento encontradas (temperatura, higiene, organização)..."
            value={value.condicaoArmazenamento}
            onChange={(e) => updateField('condicaoArmazenamento', e.target.value)}
            className="min-h-[60px] text-sm"
          />
        </CardContent>
      </Card>

      {/* Responsável pela Entrega */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Label className="text-sm font-medium">Responsável pela Entrega das Amostras</Label>
          <Input
            placeholder="Nome do responsável que entregou as amostras"
            value={value.responsavelEntrega}
            onChange={(e) => updateField('responsavelEntrega', e.target.value)}
            className="text-sm"
          />
        </CardContent>
      </Card>

      {/* Registro Fotográfico */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Registro Fotográfico</Label>
              <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded">Recomendado</span>
            </div>
            <span className="text-xs text-muted-foreground">{photos.length} foto(s)</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Fotografe os produtos coletados, rótulos, lacres e condições de armazenamento.
          </p>

          {photos.length > 0 && (
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
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCapturePhoto || onAddPhoto}
              className="flex-1 h-12"
            >
              <Camera className="h-5 w-5 mr-2" />
              Capturar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddPhoto}
              className="flex-1 h-12"
            >
              <FolderOpen className="h-5 w-5 mr-2" />
              Galeria
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data e Hora */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Data da Coleta
              </Label>
              <Input
                type="date"
                value={value.documentDate}
                onChange={(e) => updateField('documentDate', e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Horário
              </Label>
              <Input
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

export function formatColetaAmostraContent(data: ColetaAmostraData): string {
  const lines: string[] = [];
  
  lines.push('TERMO DE COLETA DE AMOSTRA');
  lines.push('');
  
  if (data.motivoColeta) {
    lines.push(`Motivo da Coleta: ${data.motivoColeta}`);
  }
  if (data.laboratorio) {
    lines.push(`Laboratório de Destino: ${data.laboratorio}`);
  }
  lines.push('');

  data.amostras.forEach((amostra, idx) => {
    lines.push(`--- AMOSTRA ${idx + 1} ---`);
    if (amostra.produto) lines.push(`Produto: ${amostra.produto}`);
    if (amostra.marca) lines.push(`Marca: ${amostra.marca}`);
    if (amostra.lote) lines.push(`Lote: ${amostra.lote}`);
    if (amostra.fabricacao) lines.push(`Fabricação: ${amostra.fabricacao}`);
    if (amostra.validade) lines.push(`Validade: ${amostra.validade}`);
    if (amostra.quantidade) lines.push(`Quantidade: ${amostra.quantidade} ${amostra.unidade}`);
    if (amostra.temperatura) lines.push(`Temperatura: ${amostra.temperatura}°C`);
    if (amostra.lacre) lines.push(`Lacre nº: ${amostra.lacre}`);
    if (amostra.observacoes) lines.push(`Observações: ${amostra.observacoes}`);
    lines.push('');
  });

  if (data.procedimentoColeta) {
    lines.push(`Procedimento de Coleta: ${data.procedimentoColeta}`);
  }
  if (data.condicaoArmazenamento) {
    lines.push(`Condição de Armazenamento: ${data.condicaoArmazenamento}`);
  }
  if (data.responsavelEntrega) {
    lines.push(`Responsável pela Entrega: ${data.responsavelEntrega}`);
  }

  return lines.join('\n');
}

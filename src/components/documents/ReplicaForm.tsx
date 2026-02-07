import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MessageSquare, Calendar, Clock, Camera, FolderOpen, X, Plus, Trash2 } from 'lucide-react';

export interface ReplicaData {
  documentoOrigem: string;
  numeroProcesso: string;
  folhasDefesa: string;
  descricaoInfracao: string;
  capitulacaoLegal: string;
  resumoDefesa: string;
  pontosDefesa: { argumento: string; resposta: string }[];
  analiseDefesa: string;
  conclusao: string;
  fundamentacaoLegal: string;
  documentDate: string;
  documentTime: string;
}

interface ReplicaFormProps {
  value: ReplicaData;
  onChange: (data: ReplicaData) => void;
  defesaPhotos?: { id: string; previewUrl: string }[];
  onAddDefesaPhoto?: () => void;
  onCaptureDefesaPhoto?: () => void;
  onRemoveDefesaPhoto?: (index: number) => void;
}

const conclusaoOptions = [
  { id: 'improcedente', label: 'Defesa IMPROCEDENTE - Manutenção da penalidade' },
  { id: 'parcial', label: 'Defesa PARCIALMENTE PROCEDENTE - Redução da penalidade' },
  { id: 'procedente', label: 'Defesa PROCEDENTE - Cancelamento da penalidade' },
];

export function ReplicaForm({ value, onChange, defesaPhotos = [], onAddDefesaPhoto, onCaptureDefesaPhoto, onRemoveDefesaPhoto }: ReplicaFormProps) {
  const updateField = <K extends keyof ReplicaData>(field: K, val: ReplicaData[K]) => {
    onChange({ ...value, [field]: val });
  };

  const addPonto = () => {
    updateField('pontosDefesa', [...value.pontosDefesa, { argumento: '', resposta: '' }]);
  };

  const removePonto = (idx: number) => {
    updateField('pontosDefesa', value.pontosDefesa.filter((_, i) => i !== idx));
  };

  const updatePonto = (idx: number, field: 'argumento' | 'resposta', val: string) => {
    const updated = [...value.pontosDefesa];
    updated[idx] = { ...updated[idx], [field]: val };
    updateField('pontosDefesa', updated);
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm border-l-4 border-l-muted-foreground">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Réplica Fiscal</p>
              <p className="text-xs text-muted-foreground mt-1">
                Resposta técnica à defesa apresentada pelo autuado. Descreva a infração original, analise ponto a ponto os argumentos e fundamente a decisão.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Processo */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Label className="text-sm font-medium">Dados do Processo</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Documento de Origem (Auto de Infração)</Label>
              <Input placeholder="Ex: AI-2024/001234" value={value.documentoOrigem} onChange={(e) => updateField('documentoOrigem', e.target.value)} className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nº do Processo</Label>
              <Input placeholder="Ex: 2024.0001.001" value={value.numeroProcesso} onChange={(e) => updateField('numeroProcesso', e.target.value)} className="text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Folhas da defesa no processo</Label>
            <Input placeholder="Ex: fls. 05 a 27" value={value.folhasDefesa} onChange={(e) => updateField('folhasDefesa', e.target.value)} className="text-sm" />
          </div>
        </CardContent>
      </Card>

      {/* Descrição da Infração Original */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Label className="text-sm font-medium">Descrição da Infração Original</Label>
          <p className="text-xs text-muted-foreground">
            Descreva as infrações pelas quais o autuado foi notificado/autuado.
          </p>
          <Textarea
            placeholder="Ex: A empresa foi autuada por expor à venda produtos alimentícios fora da temperatura adequada de conservação..."
            value={value.descricaoInfracao}
            onChange={(e) => updateField('descricaoInfracao', e.target.value)}
            className="min-h-[80px] text-sm"
          />
          <div className="space-y-1">
            <Label className="text-xs">Capitulação Legal da Infração</Label>
            <Input
              placeholder="Ex: Lei Municipal 8741/08 art. 81, incisos XVI, alínea 'h'"
              value={value.capitulacaoLegal}
              onChange={(e) => updateField('capitulacaoLegal', e.target.value)}
              className="text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Resumo da Defesa com Upload de Foto */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Peça de Defesa</Label>
            {defesaPhotos.length > 0 && (
              <span className="text-xs text-muted-foreground">{defesaPhotos.length} foto(s)</span>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Fotografe ou anexe a peça de defesa para consulta rápida e resuma os argumentos abaixo.
          </p>

          {defesaPhotos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {defesaPhotos.map((photo, idx) => (
                <div key={photo.id} className="relative aspect-[3/4] rounded-lg overflow-hidden border border-border">
                  <img src={photo.previewUrl} alt={`Defesa ${idx + 1}`} className="w-full h-full object-cover" />
                  {onRemoveDefesaPhoto && (
                    <button
                      onClick={() => onRemoveDefesaPhoto(idx)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {(onAddDefesaPhoto || onCaptureDefesaPhoto) && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCaptureDefesaPhoto || onAddDefesaPhoto} className="flex-1 h-10" type="button">
                <Camera className="h-4 w-4 mr-2" />
                Fotografar Defesa
              </Button>
              <Button variant="outline" size="sm" onClick={onAddDefesaPhoto} className="flex-1 h-10" type="button">
                <FolderOpen className="h-4 w-4 mr-2" />
                Anexar Arquivo
              </Button>
            </div>
          )}

          <Textarea
            placeholder="Resuma os principais argumentos apresentados pelo autuado em sua defesa..."
            value={value.resumoDefesa}
            onChange={(e) => updateField('resumoDefesa', e.target.value)}
            className="min-h-[100px] text-sm"
          />
        </CardContent>
      </Card>

      {/* Análise Ponto a Ponto */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Análise Ponto a Ponto</Label>
            <span className="text-xs text-muted-foreground">{value.pontosDefesa.length} ponto(s)</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Responda individualmente cada argumento da defesa com fundamentação técnica.
          </p>

          {value.pontosDefesa.map((ponto, idx) => (
            <Card key={idx} className="border border-border/60 shadow-none">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Ponto {idx + 1}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removePonto(idx)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Argumento do autuado</Label>
                  <Textarea
                    placeholder="O que o autuado alega..."
                    value={ponto.argumento}
                    onChange={(e) => updatePonto(idx, 'argumento', e.target.value)}
                    className="min-h-[60px] text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Resposta/fundamentação fiscal</Label>
                  <Textarea
                    placeholder="Análise técnica e fundamentação legal..."
                    value={ponto.resposta}
                    onChange={(e) => updatePonto(idx, 'resposta', e.target.value)}
                    className="min-h-[60px] text-sm"
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" size="sm" className="w-full" onClick={addPonto} type="button">
            <Plus className="h-4 w-4 mr-2" /> Adicionar Ponto de Análise
          </Button>
        </CardContent>
      </Card>

      {/* Análise Geral (opcional, complementar) */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Considerações Finais / Análise Complementar</Label>
            <p className="text-xs text-muted-foreground">Observações gerais que complementem a análise ponto a ponto (opcional).</p>
            <Textarea placeholder="Considerações adicionais..." value={value.analiseDefesa} onChange={(e) => updateField('analiseDefesa', e.target.value)} className="min-h-[100px] text-sm" />
          </div>
        </CardContent>
      </Card>

      {/* Conclusão */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Label className="text-sm font-medium">Conclusão</Label>
          <div className="space-y-2">
            {conclusaoOptions.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all text-sm ${
                  value.conclusao === opt.id ? 'bg-primary/10 border border-primary/30' : 'border border-border hover:border-primary/50'
                }`}
              >
                <input type="radio" name="conclusao" checked={value.conclusao === opt.id} onChange={() => updateField('conclusao', opt.id)} className="accent-primary" />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Fundamentação Legal</Label>
            <Input placeholder="Base legal para a decisão" value={value.fundamentacaoLegal} onChange={(e) => updateField('fundamentacaoLegal', e.target.value)} className="text-sm" />
          </div>
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

export function formatReplicaContent(data: ReplicaData): string {
  const lines: string[] = ['RÉPLICA FISCAL', ''];
  if (data.documentoOrigem) lines.push(`Documento de Origem: ${data.documentoOrigem}`);
  if (data.numeroProcesso) lines.push(`Processo nº: ${data.numeroProcesso}`);
  if (data.folhasDefesa) lines.push(`Defesa apresentada às ${data.folhasDefesa}`);
  lines.push('');
  if (data.descricaoInfracao) {
    lines.push('INFRAÇÃO ORIGINAL:');
    lines.push(data.descricaoInfracao);
    if (data.capitulacaoLegal) lines.push(`Capitulação: ${data.capitulacaoLegal}`);
    lines.push('');
  }
  if (data.resumoDefesa) { lines.push('RESUMO DA DEFESA:'); lines.push(data.resumoDefesa); lines.push(''); }
  
  const pontosPreenchidos = data.pontosDefesa.filter(p => p.argumento.trim() || p.resposta.trim());
  if (pontosPreenchidos.length > 0) {
    lines.push('ANÁLISE PONTO A PONTO:');
    pontosPreenchidos.forEach((p, i) => {
      lines.push(`\n${i + 1}) Argumento: ${p.argumento}`);
      lines.push(`   Resposta: ${p.resposta}`);
    });
    lines.push('');
  }

  if (data.analiseDefesa) { lines.push('CONSIDERAÇÕES FINAIS:'); lines.push(data.analiseDefesa); lines.push(''); }
  const conclusaoLabel = data.conclusao === 'improcedente' ? 'IMPROCEDENTE' : data.conclusao === 'parcial' ? 'PARCIALMENTE PROCEDENTE' : data.conclusao === 'procedente' ? 'PROCEDENTE' : '';
  if (conclusaoLabel) lines.push(`CONCLUSÃO: Defesa ${conclusaoLabel}`);
  if (data.fundamentacaoLegal) lines.push(`Fundamentação Legal: ${data.fundamentacaoLegal}`);
  return lines.join('\n');
}

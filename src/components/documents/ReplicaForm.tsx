import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Calendar, Clock } from 'lucide-react';

export interface ReplicaData {
  documentoOrigem: string;
  numeroProcesso: string;
  resumoDefesa: string;
  analiseDefesa: string;
  conclusao: string;
  fundamentacaoLegal: string;
  documentDate: string;
  documentTime: string;
}

interface ReplicaFormProps {
  value: ReplicaData;
  onChange: (data: ReplicaData) => void;
}

const conclusaoOptions = [
  { id: 'improcedente', label: 'Defesa IMPROCEDENTE - Manutenção da penalidade' },
  { id: 'parcial', label: 'Defesa PARCIALMENTE PROCEDENTE - Redução da penalidade' },
  { id: 'procedente', label: 'Defesa PROCEDENTE - Cancelamento da penalidade' },
];

export function ReplicaForm({ value, onChange }: ReplicaFormProps) {
  const updateField = <K extends keyof ReplicaData>(field: K, val: ReplicaData[K]) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm border-l-4 border-l-muted-foreground">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Réplica</p>
              <p className="text-xs text-muted-foreground mt-1">
                Resposta técnica à defesa apresentada pelo autuado. Analise os argumentos e fundamente a decisão.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dados do Documento Original */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Label className="text-sm font-medium">Referência do Documento</Label>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Documento de Origem</Label>
              <Input placeholder="Ex: AI-2024/001234" value={value.documentoOrigem} onChange={(e) => updateField('documentoOrigem', e.target.value)} className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nº do Processo</Label>
              <Input placeholder="Ex: 2024.0001.001" value={value.numeroProcesso} onChange={(e) => updateField('numeroProcesso', e.target.value)} className="text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo e Análise da Defesa */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Resumo da Defesa Apresentada</Label>
            <Textarea placeholder="Resuma os argumentos apresentados pelo autuado em sua defesa..." value={value.resumoDefesa} onChange={(e) => updateField('resumoDefesa', e.target.value)} className="min-h-[100px] text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Análise Técnica da Defesa *</Label>
            <Textarea placeholder="Analise ponto a ponto os argumentos da defesa, fundamentando tecnicamente cada resposta..." value={value.analiseDefesa} onChange={(e) => updateField('analiseDefesa', e.target.value)} className="min-h-[150px] text-sm" />
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
  const lines: string[] = ['RÉPLICA', ''];
  if (data.documentoOrigem) lines.push(`Documento de Origem: ${data.documentoOrigem}`);
  if (data.numeroProcesso) lines.push(`Processo nº: ${data.numeroProcesso}`);
  lines.push('');
  if (data.resumoDefesa) { lines.push('RESUMO DA DEFESA:'); lines.push(data.resumoDefesa); lines.push(''); }
  if (data.analiseDefesa) { lines.push('ANÁLISE TÉCNICA:'); lines.push(data.analiseDefesa); lines.push(''); }
  const conclusaoLabel = data.conclusao === 'improcedente' ? 'IMPROCEDENTE' : data.conclusao === 'parcial' ? 'PARCIALMENTE PROCEDENTE' : data.conclusao === 'procedente' ? 'PROCEDENTE' : '';
  if (conclusaoLabel) lines.push(`CONCLUSÃO: Defesa ${conclusaoLabel}`);
  if (data.fundamentacaoLegal) lines.push(`Fundamentação Legal: ${data.fundamentacaoLegal}`);
  return lines.join('\n');
}

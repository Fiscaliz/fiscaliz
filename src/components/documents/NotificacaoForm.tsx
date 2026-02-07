import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Bell, Calendar, Clock } from 'lucide-react';

export interface NotificacaoData {
  assunto: string;
  conteudo: string;
  fundamentacaoLegal: string;
  prazoResposta: string;
  documentDate: string;
  documentTime: string;
}

interface NotificacaoFormProps {
  value: NotificacaoData;
  onChange: (data: NotificacaoData) => void;
}

export function NotificacaoForm({ value, onChange }: NotificacaoFormProps) {
  const updateField = <K extends keyof NotificacaoData>(field: K, val: NotificacaoData[K]) => {
    onChange({ ...value, [field]: val });
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm border-l-4 border-l-info">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Bell className="h-5 w-5 text-info mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-info">Notificação</p>
              <p className="text-xs text-muted-foreground mt-1">
                Aviso formal ao responsável do estabelecimento sobre obrigações sanitárias ou pendências.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Assunto *</Label>
            <Input placeholder="Assunto da notificação" value={value.assunto} onChange={(e) => updateField('assunto', e.target.value)} className="text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-sm font-medium">Conteúdo *</Label>
            <Textarea placeholder="Descreva o conteúdo da notificação..." value={value.conteudo} onChange={(e) => updateField('conteudo', e.target.value)} className="min-h-[150px] text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Fundamentação Legal</Label>
              <Input placeholder="Base legal" value={value.fundamentacaoLegal} onChange={(e) => updateField('fundamentacaoLegal', e.target.value)} className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Prazo Resposta (dias)</Label>
              <Input type="number" placeholder="Ex: 10" value={value.prazoResposta} onChange={(e) => updateField('prazoResposta', e.target.value)} className="text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

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

export function formatNotificacaoContent(data: NotificacaoData): string {
  const lines: string[] = ['NOTIFICAÇÃO', ''];
  if (data.assunto) lines.push(`Assunto: ${data.assunto}`);
  lines.push('');
  if (data.conteudo) lines.push(data.conteudo);
  lines.push('');
  if (data.fundamentacaoLegal) lines.push(`Fundamentação Legal: ${data.fundamentacaoLegal}`);
  if (data.prazoResposta) lines.push(`Prazo para Resposta: ${data.prazoResposta} dias`);
  return lines.join('\n');
}

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { 
  FileCheck, 
  ClipboardList, 
  CheckCircle, 
  FileText, 
  MessageCircle,
  Calendar,
  Clock,
  Camera,
  X,
  Image as ImageIcon,
  Bug
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VisitaFiscalData {
  purpose: string[];
  anotacoes: string;
  intimacaoAnteriorId: string;
  intimacaoAnteriorNumero: string;
  intimacaoResolucao: 'adequado' | 'parcial' | 'nao_adequado' | '';
  documentoEntregue: string;
  orientacoes: string;
  dengueInspection: boolean;
  documentDate: string;
  documentTime: string;
}

interface VisitaFiscalFormProps {
  value: VisitaFiscalData;
  onChange: (data: VisitaFiscalData) => void;
}

const purposeOptions = [
  { 
    id: 'anotacoes', 
    icon: ClipboardList, 
    label: 'Registrar Anotações', 
    description: 'Observações gerais da visita',
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  },
  { 
    id: 'baixa_intimacao', 
    icon: FileCheck, 
    label: 'Baixa de Intimação Anterior', 
    description: 'Verificar adequação de prazo anterior',
    color: 'text-success',
    bgColor: 'bg-success/10'
  },
  { 
    id: 'sem_irregularidades', 
    icon: CheckCircle, 
    label: 'Sem Não Conformidades', 
    description: 'Estabelecimento em conformidade',
    color: 'text-success',
    bgColor: 'bg-success/10'
  },
  { 
    id: 'entrega_documento', 
    icon: FileText, 
    label: 'Entrega de Documento', 
    description: 'Entrega de outro documento oficial',
    color: 'text-info',
    bgColor: 'bg-info/10'
  },
  { 
    id: 'orientacao', 
    icon: MessageCircle, 
    label: 'Notificar / Orientar', 
    description: 'Orientações ao responsável',
    color: 'text-warning',
    bgColor: 'bg-warning/10'
  },
];

const intimacaoResolucaoOptions = [
  { id: 'adequado', label: 'Adequado', description: 'Todas as irregularidades foram sanadas' },
  { id: 'parcial', label: 'Parcialmente Adequado', description: 'Algumas irregularidades sanadas' },
  { id: 'nao_adequado', label: 'Não Adequado', description: 'Irregularidades persistem' },
];

export function VisitaFiscalForm({ value, onChange }: VisitaFiscalFormProps) {
  const togglePurpose = (purposeId: string) => {
    const newPurposes = value.purpose.includes(purposeId)
      ? value.purpose.filter(p => p !== purposeId)
      : [...value.purpose, purposeId];
    onChange({ ...value, purpose: newPurposes });
  };

  const updateField = <K extends keyof VisitaFiscalData>(field: K, fieldValue: VisitaFiscalData[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-4">
      {/* Propósito da Visita */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Label className="text-sm font-medium">Finalidade da Visita</Label>
          <p className="text-xs text-muted-foreground">
            Selecione uma ou mais finalidades para esta visita fiscal
          </p>
          
          <div className="grid gap-2">
            {purposeOptions.map((option) => (
              <label
                key={option.id}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                  value.purpose.includes(option.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <Checkbox
                  checked={value.purpose.includes(option.id)}
                  onCheckedChange={() => togglePurpose(option.id)}
                  className="mt-0.5"
                />
                <div className={cn('rounded-lg p-2', option.bgColor)}>
                  <option.icon className={cn('h-4 w-4', option.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs text-muted-foreground">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Anotações - sempre visível se selecionado */}
      {value.purpose.includes('anotacoes') && (
        <Card className="border-0 shadow-sm border-l-4 border-l-primary">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Anotações da Visita</Label>
            </div>
            <Textarea
              placeholder="Descreva observações gerais, condições encontradas, pessoas contactadas..."
              value={value.anotacoes}
              onChange={(e) => updateField('anotacoes', e.target.value)}
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>
      )}

      {/* Baixa de Intimação Anterior */}
      {value.purpose.includes('baixa_intimacao') && (
        <Card className="border-0 shadow-sm border-l-4 border-l-success">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-success" />
              <Label className="text-sm font-medium">Baixa de Intimação Anterior</Label>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="intimacaoNumero" className="text-xs">Número do Termo de Intimação</Label>
                <Input
                  id="intimacaoNumero"
                  placeholder="Ex: TI-2024/001234"
                  value={value.intimacaoAnteriorNumero}
                  onChange={(e) => updateField('intimacaoAnteriorNumero', e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs">Situação da Adequação</Label>
                <div className="grid gap-2 mt-2">
                  {intimacaoResolucaoOptions.map((option) => (
                    <label
                      key={option.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                        value.intimacaoResolucao === option.id
                          ? 'border-success bg-success/5'
                          : 'border-border hover:border-success/50'
                      )}
                    >
                      <Checkbox
                        checked={value.intimacaoResolucao === option.id}
                        onCheckedChange={() => updateField('intimacaoResolucao', option.id as any)}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sem Não Conformidades */}
      {value.purpose.includes('sem_irregularidades') && (
        <Card className="border-0 shadow-sm border-l-4 border-l-success">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-success">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-medium text-sm">Estabelecimento em Conformidade</p>
                <p className="text-xs text-muted-foreground">
                  Nenhuma irregularidade sanitária identificada durante a inspeção
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entrega de Documento */}
      {value.purpose.includes('entrega_documento') && (
        <Card className="border-0 shadow-sm border-l-4 border-l-info">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-info" />
              <Label className="text-sm font-medium">Entrega de Documento</Label>
            </div>
            <Textarea
              placeholder="Descreva o documento entregue (ex: Alvará de Funcionamento, Licença Sanitária, Notificação, etc.)"
              value={value.documentoEntregue}
              onChange={(e) => updateField('documentoEntregue', e.target.value)}
              className="min-h-[80px]"
            />
          </CardContent>
        </Card>
      )}

      {/* Orientação */}
      {value.purpose.includes('orientacao') && (
        <Card className="border-0 shadow-sm border-l-4 border-l-warning">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-warning" />
              <Label className="text-sm font-medium">Orientações / Notificações</Label>
            </div>
            <Textarea
              placeholder="Descreva as orientações fornecidas ao responsável do estabelecimento..."
              value={value.orientacoes}
              onChange={(e) => updateField('orientacoes', e.target.value)}
              className="min-h-[120px]"
            />
          </CardContent>
        </Card>
      )}

      {/* Vistoria de Dengue - Obrigatória */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={value.dengueInspection}
                onCheckedChange={(checked) => updateField('dengueInspection', checked as boolean)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-warning" />
                  <span className="font-medium text-sm">Vistoria de Dengue/Arboviroses</span>
                  <span className="text-xs bg-warning/20 text-warning px-2 py-0.5 rounded">Obrigatório</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Verificação de focos de Aedes aegypti conforme legislação municipal
                </p>
              </div>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Data e Hora */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="visitaDate" className="text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Data da Visita
              </Label>
              <Input
                id="visitaDate"
                type="date"
                value={value.documentDate}
                onChange={(e) => updateField('documentDate', e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visitaTime" className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Horário
              </Label>
              <Input
                id="visitaTime"
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

export function formatVisitaFiscalContent(data: VisitaFiscalData): string {
  const parts: string[] = [];

  if (data.purpose.includes('anotacoes') && data.anotacoes.trim()) {
    parts.push(`ANOTAÇÕES DA VISITA:\n${data.anotacoes}`);
  }

  if (data.purpose.includes('baixa_intimacao')) {
    const resolucaoLabels: Record<string, string> = {
      adequado: 'ADEQUADO - Todas as irregularidades foram sanadas',
      parcial: 'PARCIALMENTE ADEQUADO - Algumas irregularidades foram sanadas',
      nao_adequado: 'NÃO ADEQUADO - As irregularidades persistem',
    };
    parts.push(
      `BAIXA DE INTIMAÇÃO ANTERIOR:\n` +
      `Termo de Intimação nº: ${data.intimacaoAnteriorNumero || 'Não informado'}\n` +
      `Situação: ${resolucaoLabels[data.intimacaoResolucao] || 'Não informada'}`
    );
  }

  if (data.purpose.includes('sem_irregularidades')) {
    parts.push('SITUAÇÃO DO ESTABELECIMENTO:\nNenhuma irregularidade sanitária identificada durante a inspeção. Estabelecimento em conformidade com a legislação vigente.');
  }

  if (data.purpose.includes('entrega_documento') && data.documentoEntregue.trim()) {
    parts.push(`ENTREGA DE DOCUMENTO:\n${data.documentoEntregue}`);
  }

  if (data.purpose.includes('orientacao') && data.orientacoes.trim()) {
    parts.push(`ORIENTAÇÕES FORNECIDAS:\n${data.orientacoes}`);
  }

  if (data.dengueInspection) {
    parts.push('VISTORIA DE DENGUE/ARBOVIROSES:\nRealizada verificação de focos de Aedes aegypti conforme legislação municipal.');
  }

  return parts.join('\n\n');
}

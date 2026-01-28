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
  areasVistoriadas: string[];
  orientacoesImediatas: string;
  documentoPosterior: boolean;
  reinspeçaoTipo: 'ti' | 'processo' | 'denuncia' | '';
  reinspeçaoNumero: string;
  intimacaoResolucao: 'adequado' | 'parcial' | 'nao_adequado' | '';
  documentoEntregue: string;
  orientacoes: string;
  semIrregularidadesTexto: string;
  dengueInspection: boolean;
  documentDate: string;
  documentTime: string;
}

const reinspeçaoTipoOptions = [
  { id: 'ti', label: 'Termo de Intimação', placeholder: 'Ex: TI-2024/001234' },
  { id: 'processo', label: 'Número do Processo', placeholder: 'Ex: 2024.0001.001234' },
  { id: 'denuncia', label: 'Denúncia', placeholder: 'Ex: DEN-2024/001234' },
];

const areasInspecao = [
  { id: 'area_producao', label: 'Área de produção/manipulação' },
  { id: 'area_armazenamento', label: 'Área de armazenamento' },
  { id: 'area_atendimento', label: 'Área de atendimento ao público' },
  { id: 'instalacoes_sanitarias', label: 'Instalações sanitárias' },
  { id: 'vestiarios', label: 'Vestiários' },
  { id: 'equipamentos', label: 'Equipamentos e utensílios' },
  { id: 'documentacao', label: 'Documentação sanitária' },
  { id: 'manipuladores', label: 'Higiene dos manipuladores' },
  { id: 'controle_pragas', label: 'Controle de pragas' },
  { id: 'agua_potavel', label: 'Água potável e reservatórios' },
  { id: 'residuos', label: 'Gestão de resíduos' },
  { id: 'materia_prima', label: 'Matérias-primas e insumos' },
];

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
    label: 'Reinspeção', 
    description: 'Verificar adequação de documento/prazo anterior',
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
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Anotações da Visita</Label>
            </div>

            {/* Áreas Vistoriadas */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Áreas vistoriadas durante a ação fiscal:</Label>
              <div className="grid grid-cols-2 gap-2">
                {areasInspecao.map((area) => (
                  <label
                    key={area.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded-md border cursor-pointer text-xs transition-all',
                      value.areasVistoriadas.includes(area.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Checkbox
                      checked={value.areasVistoriadas.includes(area.id)}
                      onCheckedChange={(checked) => {
                        const newAreas = checked
                          ? [...value.areasVistoriadas, area.id]
                          : value.areasVistoriadas.filter(a => a !== area.id);
                        updateField('areasVistoriadas', newAreas);
                      }}
                    />
                    <span>{area.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Orientações Imediatas */}
            <div className="space-y-2">
              <Label htmlFor="orientacoesImediatas" className="text-xs text-muted-foreground">
                Correções imediatas orientadas ao contribuinte:
              </Label>
              <Textarea
                id="orientacoesImediatas"
                placeholder="Descreva as correções imediatas solicitadas ao contribuinte durante a visita..."
                value={value.orientacoesImediatas}
                onChange={(e) => updateField('orientacoesImediatas', e.target.value)}
                className="min-h-[80px]"
              />
            </div>

            {/* Documento Posterior */}
            <label className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer">
              <Checkbox
                checked={value.documentoPosterior}
                onCheckedChange={(checked) => updateField('documentoPosterior', checked as boolean)}
              />
              <div>
                <p className="text-sm font-medium">Documento será lavrado em momento posterior</p>
                <p className="text-xs text-muted-foreground">
                  Marque se um Termo de Intimação ou outro documento será emitido após análise
                </p>
              </div>
            </label>

            {/* Anotações Livres */}
            <div className="space-y-2">
              <Label htmlFor="anotacoesLivres" className="text-xs text-muted-foreground">
                Observações adicionais:
              </Label>
              <Textarea
                id="anotacoesLivres"
                placeholder="Outras observações gerais da visita, pessoas contactadas, condições encontradas..."
                value={value.anotacoes}
                onChange={(e) => updateField('anotacoes', e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reinspeção */}
      {value.purpose.includes('baixa_intimacao') && (
        <Card className="border-0 shadow-sm border-l-4 border-l-success">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <FileCheck className="h-4 w-4 text-success" />
              <Label className="text-sm font-medium">Reinspeção</Label>
            </div>
            
            <div className="space-y-3">
              {/* Tipo de Documento */}
              <div>
                <Label className="text-xs">Tipo de Documento/Referência</Label>
                <div className="grid gap-2 mt-2">
                  {reinspeçaoTipoOptions.map((option) => (
                    <label
                      key={option.id}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all',
                        value.reinspeçaoTipo === option.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Checkbox
                        checked={value.reinspeçaoTipo === option.id}
                        onCheckedChange={() => updateField('reinspeçaoTipo', option.id as any)}
                      />
                      <span className="text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Número do Documento */}
              {value.reinspeçaoTipo && (
                <div>
                  <Label htmlFor="reinspeçaoNumero" className="text-xs">
                    Número do {reinspeçaoTipoOptions.find(o => o.id === value.reinspeçaoTipo)?.label}
                  </Label>
                  <Input
                    id="reinspeçaoNumero"
                    placeholder={reinspeçaoTipoOptions.find(o => o.id === value.reinspeçaoTipo)?.placeholder}
                    value={value.reinspeçaoNumero}
                    onChange={(e) => updateField('reinspeçaoNumero', e.target.value)}
                    className="mt-1"
                  />
                </div>
              )}

              {/* Situação da Adequação */}
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
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3 text-success">
              <CheckCircle className="h-5 w-5" />
              <div>
                <p className="font-medium text-sm">Ausência de Não Conformidades</p>
                <p className="text-xs text-muted-foreground">
                  Edite o texto abaixo conforme necessário
                </p>
              </div>
            </div>
            <Textarea
              placeholder="Descreva a situação de conformidade..."
              value={value.semIrregularidadesTexto}
              onChange={(e) => updateField('semIrregularidadesTexto', e.target.value)}
              className="min-h-[80px]"
            />
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

  if (data.purpose.includes('anotacoes')) {
    const areasLabels = areasInspecao
      .filter(a => data.areasVistoriadas.includes(a.id))
      .map(a => a.label);
    
    let anotacoesText = 'ANOTAÇÕES DA VISITA:';
    
    if (areasLabels.length > 0) {
      anotacoesText += `\n\nNo momento da ação fiscal foram vistoriados: ${areasLabels.join(', ')}.`;
    }
    
    if (data.orientacoesImediatas?.trim()) {
      anotacoesText += `\n\nO contribuinte foi orientado a realizar as seguintes correções imediatas: ${data.orientacoesImediatas.trim()}.`;
    }
    
    if (data.documentoPosterior) {
      anotacoesText += '\n\nDocumento fiscal será lavrado em momento posterior após análise detalhada.';
    }
    
    if (data.anotacoes?.trim()) {
      anotacoesText += `\n\nObservações adicionais: ${data.anotacoes.trim()}`;
    }
    
    parts.push(anotacoesText);
  }

  if (data.purpose.includes('baixa_intimacao')) {
    const resolucaoLabels: Record<string, string> = {
      adequado: 'ADEQUADO - Todas as irregularidades foram sanadas',
      parcial: 'PARCIALMENTE ADEQUADO - Algumas irregularidades foram sanadas',
      nao_adequado: 'NÃO ADEQUADO - As irregularidades persistem',
    };
    const tipoLabels: Record<string, string> = {
      ti: 'Termo de Intimação',
      processo: 'Processo',
      denuncia: 'Denúncia',
    };
    const tipoLabel = tipoLabels[data.reinspeçaoTipo] || 'Documento';
    parts.push(
      `REINSPEÇÃO:\n` +
      `${tipoLabel} nº: ${data.reinspeçaoNumero || 'Não informado'}\n` +
      `Situação: ${resolucaoLabels[data.intimacaoResolucao] || 'Não informada'}`
    );
  }

  if (data.purpose.includes('sem_irregularidades')) {
    const texto = data.semIrregularidadesTexto?.trim() || 'No momento da ação fiscal não foram encontradas irregularidades.';
    parts.push(`AUSÊNCIA DE NÃO CONFORMIDADES:\n${texto}`);
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

import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Clock, Bug, FileText, Car } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentCommonFieldsProps {
  documentType: string;
  documentDate: string;
  documentTime: string;
  observations: string;
  dengueInspection: boolean;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onObservationsChange: (obs: string) => void;
  onDengueChange: (checked: boolean) => void;
  showDeadline?: boolean;
  deadlineDays?: string;
  onDeadlineChange?: (days: string) => void;
  // Transporte
  transportMode?: 'MPL' | 'CO';
  onTransportChange?: (mode: 'MPL' | 'CO') => void;
  showTransport?: boolean;
}

export function DocumentCommonFields({
  documentType,
  documentDate,
  documentTime,
  observations,
  dengueInspection,
  onDateChange,
  onTimeChange,
  onObservationsChange,
  onDengueChange,
  showDeadline = false,
  deadlineDays,
  onDeadlineChange,
  transportMode = 'MPL',
  onTransportChange,
  showTransport = true,
}: DocumentCommonFieldsProps) {
  // Vistoria de Dengue é obrigatória para Termo de Intimação e Visita Fiscal
  const requiresDengue = documentType === 'termo_intimacao' || documentType === 'visita_fiscal';

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 space-y-4">
        {/* Data e Hora do Documento */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="docDate" className="text-xs flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Data do Documento
            </Label>
            <Input
              id="docDate"
              type="date"
              value={documentDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="docTime" className="text-xs flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Horário
            </Label>
            <Input
              id="docTime"
              type="time"
              value={documentTime}
              onChange={(e) => onTimeChange(e.target.value)}
              className="text-sm"
            />
          </div>
        </div>

        {/* Meio de Locomoção */}
        {showTransport && onTransportChange && (
          <div className="space-y-2">
            <Label className="text-xs flex items-center gap-1">
              <Car className="h-3 w-3" />
              Meio de Locomoção
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <div
                className={cn(
                  'p-3 rounded-lg border-2 cursor-pointer transition-all text-center',
                  transportMode === 'MPL' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted hover:border-primary/50'
                )}
                onClick={() => onTransportChange('MPL')}
              >
                <Car className={cn(
                  'h-5 w-5 mx-auto mb-1',
                  transportMode === 'MPL' ? 'text-primary' : 'text-muted-foreground'
                )} />
                <p className="font-medium text-xs">MPL</p>
                <p className="text-[10px] text-muted-foreground">Meios Próprios</p>
              </div>
              
              <div
                className={cn(
                  'p-3 rounded-lg border-2 cursor-pointer transition-all text-center',
                  transportMode === 'CO' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted hover:border-primary/50'
                )}
                onClick={() => onTransportChange('CO')}
              >
                <Car className={cn(
                  'h-5 w-5 mx-auto mb-1',
                  transportMode === 'CO' ? 'text-primary' : 'text-muted-foreground'
                )} />
                <p className="font-medium text-xs">CO</p>
                <p className="text-[10px] text-muted-foreground">Carro Oficial</p>
              </div>
            </div>
          </div>
        )}

        {/* Prazo (se aplicável) */}
        {showDeadline && (
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <Label htmlFor="prazo">Prazo para adequação</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input
                  id="prazo"
                  type="number"
                  min="1"
                  max="45"
                  value={deadlineDays || '15'}
                  onChange={(e) => {
                    let days = parseInt(e.target.value) || 15;
                    // Limitar entre 1 e 45 dias
                    days = Math.max(1, Math.min(45, days));
                    onDeadlineChange?.(days.toString());
                  }}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">dias</span>
              </div>
            </div>
          </div>
        )}

        {/* Vistoria de Dengue - Obrigatória para Termo e Visita */}
        {requiresDengue && (
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={dengueInspection}
                onCheckedChange={(checked) => onDengueChange(checked as boolean)}
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
        )}

        {/* Observações Adicionais */}
        <div className="space-y-2">
          <Label htmlFor="observations" className="text-xs flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Observações Adicionais
          </Label>
          <Textarea
            id="observations"
            placeholder="Irregularidades ou observações não contempladas no checklist ou análise por IA..."
            value={observations}
            onChange={(e) => onObservationsChange(e.target.value)}
            className="min-h-[80px] text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Campo para registrar irregularidades ou informações adicionais não cobertas pelos métodos automáticos
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

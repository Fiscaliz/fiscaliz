import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEFAULT_LEGISLATION = 'RDC 216/2004 + Lei Municipal 8741/2008';

const legislationOptions = [
  { label: 'RDC 216/04 + LM 8741/08 (Padrão)', value: DEFAULT_LEGISLATION },
  { label: 'Resolução 20/GAB/SES/2019', value: 'Resolução 20/GAB/SES/2019' },
  { label: 'RDC 275/2002 – BPF Indústria', value: 'RDC 275/2002' },
  { label: 'RDC 44/2009 – Farmácias', value: 'RDC 44/2009' },
  { label: 'RDC 222/2018 – RSS', value: 'RDC 222/2018' },
  { label: 'Portaria MS 888/2021 – Água', value: 'Portaria MS 888/2021' },
  { label: 'Outra (digitar)…', value: 'custom' },
];

interface LegislationSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (legislation: string, observation: string) => void;
  isLoading?: boolean;
}

export function LegislationSelectDialog({ open, onOpenChange, onConfirm, isLoading }: LegislationSelectDialogProps) {
  const [selected, setSelected] = useState(DEFAULT_LEGISLATION);
  const [customLeg, setCustomLeg] = useState('');
  const [observation, setObservation] = useState('');

  const effectiveLegislation = selected === 'custom' ? customLeg.trim() : selected;

  const handleConfirm = () => {
    if (!effectiveLegislation) return;
    onConfirm(effectiveLegislation, observation.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Foco da Análise por IA
          </DialogTitle>
          <DialogDescription>
            Selecione a legislação base para a análise. Por padrão, a IA utiliza a RDC 216/04 e a Lei Municipal 8741/08.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Legislação base</Label>
            <div className="flex flex-wrap gap-1.5">
              {legislationOptions.map(leg => (
                <button
                  key={leg.value}
                  type="button"
                  onClick={() => setSelected(leg.value)}
                  className={cn(
                    "text-xs px-2.5 py-1.5 rounded-lg border transition-colors",
                    selected === leg.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted hover:bg-primary/10 border-border"
                  )}
                >
                  {leg.label}
                </button>
              ))}
            </div>
            {selected === 'custom' && (
              <Input
                placeholder="Digite a legislação (ex: Resolução ANVISA nº 50/2002)"
                value={customLeg}
                onChange={e => setCustomLeg(e.target.value)}
                className="text-sm mt-1"
                autoFocus
              />
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Observação para a IA (opcional)</Label>
            <Textarea
              placeholder="Ex: Foque em temperatura de conservação, higiene dos manipuladores, validade dos produtos…"
              value={observation}
              onChange={e => setObservation(e.target.value)}
              className="text-sm min-h-[60px] resize-none"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!effectiveLegislation || isLoading}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Iniciar Análise
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DEFAULT_LEGISLATION };

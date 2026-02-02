import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Car } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TransportModeSelectorProps {
  value: 'MPL' | 'CO';
  onChange: (mode: 'MPL' | 'CO') => void;
  disabled?: boolean;
}

export function TransportModeSelector({ value, onChange, disabled = false }: TransportModeSelectorProps) {
  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <Label className="text-xs flex items-center gap-1 mb-3">
          <Car className="h-3 w-3" />
          Meio de Locomoção
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <div
            className={cn(
              'p-3 rounded-lg border-2 cursor-pointer transition-all text-center',
              value === 'MPL' 
                ? 'border-primary bg-primary/10' 
                : 'border-muted hover:border-primary/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => !disabled && onChange('MPL')}
          >
            <Car className={cn(
              'h-5 w-5 mx-auto mb-1',
              value === 'MPL' ? 'text-primary' : 'text-muted-foreground'
            )} />
            <p className="font-medium text-xs">MPL</p>
            <p className="text-[10px] text-muted-foreground">Meios Próprios</p>
          </div>
          
          <div
            className={cn(
              'p-3 rounded-lg border-2 cursor-pointer transition-all text-center',
              value === 'CO' 
                ? 'border-primary bg-primary/10' 
                : 'border-muted hover:border-primary/50',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onClick={() => !disabled && onChange('CO')}
          >
            <Car className={cn(
              'h-5 w-5 mx-auto mb-1',
              value === 'CO' ? 'text-primary' : 'text-muted-foreground'
            )} />
            <p className="font-medium text-xs">CO</p>
            <p className="text-[10px] text-muted-foreground">Carro Oficial</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

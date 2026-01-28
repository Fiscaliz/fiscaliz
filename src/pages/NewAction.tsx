import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BrandHeader } from '@/components/layout/BrandHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  MapPin, 
  FileText, 
  AlertTriangle,
  Beaker,
  Handshake,
  Flag,
  MoreHorizontal,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

const actionReasons = [
  { id: 'investigativa', icon: Search, label: 'Inspeção Investigativa', color: 'text-warning', priority: 'high' },
  { id: 'rotina', icon: MapPin, label: 'Rotina', color: 'text-primary', priority: 'low' },
  { id: 'relatorio_tecnico', icon: FileText, label: 'Relatório Técnico', color: 'text-primary', priority: 'medium' },
  { id: 'demanda_chefia', icon: Flag, label: 'Demanda Chefia', color: 'text-warning', priority: 'medium' },
  { id: 'surto', icon: AlertTriangle, label: 'Surto', color: 'text-destructive', priority: 'high' },
  { id: 'operacao_conjunta', icon: Handshake, label: 'Operação Conjunta', color: 'text-info', priority: 'medium' },
  { id: 'coleta', icon: Beaker, label: 'Coleta de Amostra', color: 'text-secondary', priority: 'medium' },
  { id: 'outros', icon: MoreHorizontal, label: 'Outros', color: 'text-muted-foreground', priority: 'low' },
];

export default function NewAction() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const handleReasonSelect = (reasonId: string) => {
    setSelectedReason(reasonId);
    // Navigate to establishment selection/entry
    navigate(`/nova-acao/estabelecimento?motivo=${reasonId}`);
  };

  return (
    <AppLayout>
      <BrandHeader />
      
      <div className="p-4">
        <Card className="mb-4 border-0 shadow-sm bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Escolha o motivo que melhor descreve esta ação fiscal. 
              Isso ajuda a priorizar e organizar suas tarefas.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          {actionReasons.map((reason) => (
            <Card 
              key={reason.id}
              className={cn(
                'border-0 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-95',
                selectedReason === reason.id && 'ring-2 ring-primary'
              )}
              onClick={() => handleReasonSelect(reason.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'rounded-lg p-2',
                    reason.priority === 'high' && 'bg-destructive/10',
                    reason.priority === 'medium' && 'bg-warning/10',
                    reason.priority === 'low' && 'bg-muted'
                  )}>
                    <reason.icon className={cn('h-5 w-5', reason.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm leading-tight">{reason.label}</p>
                    {reason.priority === 'high' && (
                      <span className="text-[10px] text-destructive font-medium uppercase">
                        Alta prioridade
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

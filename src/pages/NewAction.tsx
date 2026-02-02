import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BrandHeader } from '@/components/layout/BrandHeader';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Search, 
  MapPin, 
  AlertTriangle,
  Beaker,
  Handshake,
  Flag,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

const actionReasons = [
  { id: 'rotina', icon: MapPin, label: 'Rotina', color: 'text-primary', priority: 'low' },
  { id: 'investigativa', icon: Search, label: 'Inspeção Investigativa', color: 'text-warning', priority: 'high' },
  { id: 'demanda_interna', icon: Flag, label: 'Demanda Interna', sublabel: 'Atividades administrativas internas', color: 'text-warning', priority: 'medium' },
  { id: 'pfe', icon: Clock, label: 'PFE', sublabel: 'Plantão Fiscal Especial', color: 'text-info', priority: 'medium' },
  { id: 'operacao_conjunta', icon: Handshake, label: 'Operação Conjunta', color: 'text-info', priority: 'medium' },
  { id: 'coleta', icon: Beaker, label: 'Coleta de Amostra', color: 'text-secondary', priority: 'medium' },
  { id: 'surto', icon: AlertTriangle, label: 'Surto', color: 'text-destructive', priority: 'high' },
];

export default function NewAction() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);

  const handleReasonSelect = (reasonId: string) => {
    setSelectedReason(reasonId);
    
    // Demanda Interna vai para seleção de atividade interna (RA)
    if (reasonId === 'demanda_interna') {
      navigate(`/nova-acao/atividade-interna?motivo=${reasonId}`);
      return;
    }
    
    // PFE vai para seleção entre "À disposição da chefia" ou "Ação fiscal"
    if (reasonId === 'pfe') {
      navigate('/nova-acao/pfe');
      return;
    }
    
    // Outros motivos vão para seleção de estabelecimento
    navigate(`/nova-acao/estabelecimento?motivo=${reasonId}`);
  };

  return (
    <AppLayout>
      <BrandHeader />
      
      <div className="p-4">
        <h1 className="text-xl font-bold text-center mb-4 text-primary">
          MOTIVO DA AÇÃO FISCAL
        </h1>
        
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
                    {reason.sublabel && (
                      <span className="text-[10px] text-muted-foreground block">
                        {reason.sublabel}
                      </span>
                    )}
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

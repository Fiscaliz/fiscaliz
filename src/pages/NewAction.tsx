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
  { id: 'demanda_interna', icon: Flag, label: 'Demanda', color: 'text-warning', priority: 'medium' },
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
      
      <div className="p-5 space-y-6">
        <div className="text-center">
          <h1 className="text-h2 text-primary font-bold">
            Motivo da Ação Fiscal
          </h1>
          <p className="text-caption text-muted-foreground mt-1">
            Selecione o motivo que melhor descreve esta ação
          </p>
        </div>
        
        <Card className="bg-accent/30 border-accent">
          <CardContent className="p-4">
            <p className="text-body text-accent-foreground">
              Isso ajuda a priorizar e organizar suas tarefas e relatórios mensais.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {actionReasons.map((reason) => (
            <Card 
              key={reason.id}
              className={cn(
                'cursor-pointer card-hover',
                selectedReason === reason.id && 'ring-2 ring-primary bg-primary/5'
              )}
              onClick={() => handleReasonSelect(reason.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'rounded-xl p-3 shrink-0',
                    reason.priority === 'high' && 'bg-destructive/10',
                    reason.priority === 'medium' && 'bg-warning/10',
                    reason.priority === 'low' && 'bg-muted'
                  )}>
                    <reason.icon className={cn('h-6 w-6', reason.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-body">{reason.label}</p>
                    {reason.sublabel && (
                      <span className="text-caption text-muted-foreground">
                        {reason.sublabel}
                      </span>
                    )}
                  </div>
                  {reason.priority === 'high' && (
                    <span className="text-micro text-destructive font-semibold uppercase px-2 py-1 bg-destructive/10 rounded-full">
                      Alta
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

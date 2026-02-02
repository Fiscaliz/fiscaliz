import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BrandHeader } from '@/components/layout/BrandHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Clock, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const pfeOptions = [
  { 
    id: 'disposicao_chefia', 
    icon: Clock, 
    label: 'À disposição da chefia', 
    description: 'Não gera peça fiscal. Apenas para cumprir OS.',
    color: 'text-muted-foreground'
  },
  { 
    id: 'acao_fiscal', 
    icon: FileText, 
    label: 'Ação Fiscal', 
    description: 'Gera peças fiscais (Visita, Termo, Auto, etc.)',
    color: 'text-primary'
  },
];

export default function PFESelection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const handleOptionSelect = (optionId: string) => {
    if (optionId === 'disposicao_chefia') {
      // Vai para criar RA com atividade "À disposição da chefia"
      navigate(`/nova-acao/criar-ra?motivo=pfe&atividade=PFE&atividade_descricao=${encodeURIComponent('À disposição da chefia')}`);
    } else {
      // Vai para seleção de estabelecimento para ação fiscal
      navigate('/nova-acao/estabelecimento?motivo=pfe');
    }
  };

  return (
    <AppLayout>
      <BrandHeader />
      
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-4"
          onClick={() => navigate('/nova-acao')}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>

        <h1 className="text-xl font-bold text-center mb-4 text-primary">
          PFE - PLANTÃO FISCAL ESPECIAL
        </h1>
        
        <Card className="mb-4 border-0 shadow-sm bg-primary/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              Selecione o tipo de atividade realizada durante o PFE.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {pfeOptions.map((option) => (
            <Card 
              key={option.id}
              className={cn(
                'border-0 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]'
              )}
              onClick={() => handleOptionSelect(option.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'rounded-lg p-3',
                    option.id === 'acao_fiscal' ? 'bg-primary/10' : 'bg-muted'
                  )}>
                    <option.icon className={cn('h-6 w-6', option.color)} />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-base">{option.label}</p>
                    <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
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

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { BrandHeader } from '@/components/layout/BrandHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

// Atividades internas (O1-O20) conforme planilha
const internalActivities = [
  { id: 'O1', label: 'Assessoria à chefia imediata' },
  { id: 'O2', label: 'Atendimento ao público' },
  { id: 'O3', label: 'Atendimento/Reunião empresas insp./fiscalizadas' },
  { id: 'O4', label: 'Análise, despacho, distrib. processos/procedimentos' },
  { id: 'O5', label: 'Consolidação de informações estatísticas da Divisão' },
  { id: 'O6', label: 'Elaboração peças fiscais de estabelecimentos' },
  { id: 'O7', label: 'Análise de documentos apresentados por empresas' },
  { id: 'O8', label: 'Elab. proposta legislação sanitária e normas técnicas' },
  { id: 'O9', label: 'Estudo de legislações sanitárias, normas técnicas e outras' },
  { id: 'O10', label: 'Avaliação e agrupamento desvio de qualidade' },
  { id: 'O11', label: 'Elab., análise, rev. roteiros de inspeção, anexos e outras' },
  { id: 'O12', label: 'Partic. em eventos/cursos/treinamentos (Discente)' },
  { id: 'O13', label: 'Partic. em eventos/cursos/treinamentos (Docente)' },
  { id: 'O14', label: 'Organização de eventos/cursos/reuniões/treinamentos' },
  { id: 'O15', label: 'Participação em reunião interna' },
  { id: 'O16', label: 'Elaboração de escalas fiscais' },
  { id: 'O17', label: 'Desenvolvimento de ações educativas' },
  { id: 'O18', label: 'Avaliação de Risco a Saúde' },
  { id: 'O19', label: 'Apoio técnico/Suporte a fiscalização' },
  { id: 'O20', label: 'Outras atividades determinadas pela Chefia' },
];

export default function InternalActivitySelection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);

  const motivo = searchParams.get('motivo') || 'demanda_interna';

  const handleActivitySelect = (activityId: string) => {
    setSelectedActivity(activityId);
    const activity = internalActivities.find(a => a.id === activityId);
    // Navegar para criar o RA com a atividade selecionada
    navigate(`/nova-acao/criar-ra?motivo=${motivo}&atividade=${activityId}&atividade_descricao=${encodeURIComponent(activity?.label || '')}`);
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
          ATIVIDADE INTERNA
        </h1>
        
        <Card className="mb-4 border-0 shadow-sm bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium">Relatório de Atividade (RA)</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Selecione a atividade interna realizada. Será gerado um RA para registro.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-2">
          {internalActivities.map((activity) => (
            <Card 
              key={activity.id}
              className={cn(
                'border-0 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]',
                selectedActivity === activity.id && 'ring-2 ring-primary'
              )}
              onClick={() => handleActivitySelect(activity.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded">
                    {activity.id}
                  </span>
                  <p className="text-sm flex-1">{activity.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

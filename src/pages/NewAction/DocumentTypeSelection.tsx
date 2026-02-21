import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { FiscalizWatermark } from '@/components/layout/FiscalizWatermark';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText, 
  ClipboardCheck, 
  AlertTriangle, 
  Ban,
  Package,
  Trash2,
  FileWarning,
  Bell,
  MessageSquare,
  Award,
  Beaker,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';

const documentTypes = [
  { 
    id: 'termo_intimacao', 
    icon: FileText, 
    label: 'Termo de Intimação', 
    description: 'Prazo para adequação',
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  },
  { 
    id: 'visita_fiscal', 
    icon: Eye, 
    label: 'Visita Fiscal', 
    description: 'Registro de visita sem prazo',
    color: 'text-info',
    bgColor: 'bg-info/10'
  },
  { 
    id: 'auto_infracao', 
    icon: AlertTriangle, 
    label: 'Auto de Infração', 
    description: 'Multa com 14 dias defesa',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10'
  },
  { 
    id: 'advertencia', 
    icon: FileWarning, 
    label: 'Advertência', 
    description: 'Sem multa, com prazo',
    color: 'text-warning',
    bgColor: 'bg-warning/10'
  },
  { 
    id: 'inutilizacao', 
    icon: Trash2, 
    label: 'Inutilização', 
    description: 'Descarte de produtos',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10'
  },
  { 
    id: 'apreensao', 
    icon: Package, 
    label: 'Apreensão', 
    description: 'Lacre e retenção',
    color: 'text-warning',
    bgColor: 'bg-warning/10'
  },
  { 
    id: 'interdicao', 
    icon: Ban, 
    label: 'Interdição', 
    description: 'Parcial ou total',
    color: 'text-destructive',
    bgColor: 'bg-destructive/10'
  },
  { 
    id: 'relatorio_tecnico', 
    icon: ClipboardCheck, 
    label: 'Relatório Técnico', 
    description: 'Documento detalhado',
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  },
  { 
    id: 'notificacao', 
    icon: Bell, 
    label: 'Notificação', 
    description: 'Aviso formal',
    color: 'text-info',
    bgColor: 'bg-info/10'
  },
  { 
    id: 'replica', 
    icon: MessageSquare, 
    label: 'Réplica', 
    description: 'Resposta à defesa',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted'
  },
  { 
    id: 'certidao', 
    icon: Award, 
    label: 'Certidão', 
    description: 'Atesta presença',
    color: 'text-success',
    bgColor: 'bg-success/10'
  },
  { 
    id: 'coleta_amostra', 
    icon: Beaker, 
    label: 'Coleta de Amostra', 
    description: 'Lacre de produto',
    color: 'text-secondary',
    bgColor: 'bg-secondary/10'
  },
];

export default function DocumentTypeSelection() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const motivo = searchParams.get('motivo') || '';
  const establishment = searchParams.get('establishment');

  const handleSelect = (docType: string) => {
    const params = new URLSearchParams();
    params.set('motivo', motivo);
    if (establishment) params.set('establishment', establishment);
    params.set('tipo', docType);
    
    // Clear any existing draft for this document type to avoid restoring stale data
    try {
      const estData = establishment ? JSON.parse(establishment) : null;
      const cnpj = estData?.cnpj || 'new';
      const draftKey = `fiscaliz_draft_document_${docType}_${cnpj}`;
      localStorage.removeItem(draftKey);
    } catch (e) {
      // ignore parse errors
    }
    
    // Navigate to document creation
    navigate(`/nova-acao/criar-documento?${params.toString()}`);
  };

  return (
    <AppLayout>
      <FiscalizWatermark />
      <Header 
        title="Tipo de Documento" 
        subtitle="Selecione o tipo de documento"
        showBack 
      />
      
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {documentTypes.map((doc) => (
            <Card 
              key={doc.id}
              className="border-0 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-95"
              onClick={() => handleSelect(doc.id)}
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-start gap-2">
                  <div className={cn('rounded-lg p-2', doc.bgColor)}>
                    <doc.icon className={cn('h-5 w-5', doc.color)} />
                  </div>
                  <div>
                    <p className="font-medium text-sm leading-tight">{doc.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{doc.description}</p>
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

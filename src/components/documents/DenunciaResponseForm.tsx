import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Copy, Send, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// ─── Respostas padrão extraídas dos modelos oficiais ──────────────────

interface RespostaPadrao {
  id: string;
  situacao: string;
  categoria: 'em_andamento' | 'finalizada';
  fraseTransferencia?: string;
  respostaFechamento?: string;
}

const respostasPadrao: RespostaPadrao[] = [
  // ── OS sem finalização (em andamento) ──
  {
    id: 'avaliacao_visa',
    situacao: 'Denúncia de competência da VISA (em avaliação)',
    categoria: 'em_andamento',
    fraseTransferencia: 'Em avaliação.',
  },
  {
    id: 'encaminhado_fiscalizacao',
    situacao: 'Denúncia da VISA (encaminhar para fiscalização)',
    categoria: 'em_andamento',
    fraseTransferencia: 'Encaminhado para a fiscalização.',
  },
  {
    id: 'em_atendimento',
    situacao: 'Competência da área que recebeu',
    categoria: 'em_andamento',
    fraseTransferencia: 'Em atendimento pela fiscalização.',
  },
  {
    id: 'transferido_avaliacao',
    situacao: 'NÃO é competência da área (Denúncia triagem)',
    categoria: 'em_andamento',
    fraseTransferencia: 'Transferido para avaliação.',
  },
  {
    id: 'outro_servico',
    situacao: 'Responsabilidade de outro serviço dentro do APP',
    categoria: 'em_andamento',
    fraseTransferencia: 'Sua solicitação não é de responsabilidade da Vigilância Sanitária, será encaminhada para (nome do serviço).',
  },
  {
    id: 'residencia_judicial',
    situacao: 'Denúncia em residência, aguardando liberação judicial',
    categoria: 'em_andamento',
    fraseTransferencia: 'Por se tratar de residência, a vigilância sanitária está aguardando a liberação judicial para a ação conjunta com a Decon (ou outros órgãos).',
  },
  {
    id: 'dilacao_prazo',
    situacao: 'Dilação de Prazo',
    categoria: 'em_andamento',
    fraseTransferencia: 'Sua denúncia encontra-se em processo de atendimento e o prazo para resposta será estendido em até 15 dias.',
  },

  // ── OS a serem finalizadas ──
  {
    id: 'info_insuficiente',
    situacao: 'Denúncia sem informações suficientes',
    categoria: 'finalizada',
    respostaFechamento: 'Não foi possível o atendimento por insuficiência de informações quanto (a descrição da denúncia e/ou endereço e/ou identificação do estabelecimento ou se trata de residência). Favor abrir nova solicitação com informações completas.',
  },
  {
    id: 'nao_irregularidade',
    situacao: 'Fato denunciado não é irregularidade sanitária',
    categoria: 'finalizada',
    respostaFechamento: 'O fato denunciado não constitui irregularidade sanitária, estando previsto conforme legislação pertinente (descrever legislação).',
  },
  {
    id: 'nao_proibicao',
    situacao: 'Fato denunciado não tem proibição legal',
    categoria: 'finalizada',
    respostaFechamento: 'O fato denunciado não constitui irregularidade sanitária, não havendo proibição legal para realização do mesmo.',
  },
  {
    id: 'baixo_risco',
    situacao: 'Falta de alvará em estabelecimento de baixo risco',
    categoria: 'finalizada',
    respostaFechamento: 'Conforme Lei Federal 13.874/2019 os estabelecimentos de baixo risco estão isentos de alvará sanitário, no entanto estão sujeitos ao cumprimento das demais legislações sanitárias pertinentes a atividade.',
  },
  {
    id: 'improcedente',
    situacao: 'Denúncia julgada improcedente',
    categoria: 'finalizada',
    respostaFechamento: 'Foi realizada ação investigativa em atendimento a denúncia e ficou constatado que, no dia.....às ......horas, não foi observada a situação denunciada.',
  },
  {
    id: 'parcial_procedente',
    situacao: 'Denúncia julgada parcialmente procedente',
    categoria: 'finalizada',
    respostaFechamento: 'A ação investigativa da denúcia ocorreu no dia.... às.....horas, com tomada de medidas sanitárias legais cabíveis quanto ao fato X. Não foi constatada a situação Y.',
  },
  {
    id: 'procedente',
    situacao: 'Denúncia julgada procedente',
    categoria: 'finalizada',
    respostaFechamento: 'A ação investigativa da denúcia ocorreu no dia.... às.....horas, com tomada de medidas sanitárias legais cabíveis para correção das irregularidades.',
  },
  {
    id: 'mista_visa_outros',
    situacao: 'Denúncia com fatos da Visa e de outros órgãos',
    categoria: 'finalizada',
    respostaFechamento: 'A ação investigativa da denúcia ocorreu no dia.... às.....horas, com tomada de medidas sanitárias legais cabíveis quanto ao fato X, cuja apuração é de responsabilidade da VISA. Para os demais fatos da denúncia, favor registrar no órgão competente.',
  },
  {
    id: 'endereco_residencial',
    situacao: 'Endereço residencial informado',
    categoria: 'finalizada',
    respostaFechamento: 'O endereço informado é residencial, não sendo possível o livre acesso da fiscalização sem ordem judicial.',
  },
  {
    id: 'local_fechado',
    situacao: 'Duas tentativas e local estava fechado',
    categoria: 'finalizada',
    respostaFechamento: 'Foram realizadas duas tentativas de inspeção no local denunciado, nos dias X, às xx horas e Y às yy horas, e o mesmo estava fechado. Caso o fato denunciado persista, favor abrir nova solicitação, informando, se for o caso, dia da semana e horário de funcionamento.',
  },
  {
    id: 'varias_denuncias',
    situacao: 'Várias denúncias do mesmo denunciante e local',
    categoria: 'finalizada',
    respostaFechamento: 'O fato denunciado foi registrado em solicitação anterior (registrar os números das outras solicitações, caso pertinente) e atendido conforme ação investigativa realizada no dia .... às................horas, com tomada de medidas sanitárias legais cabíveis no momento da inspeção.',
  },
  {
    id: 'poluicao_amma',
    situacao: 'Denúncia de poluição no município',
    categoria: 'finalizada',
    respostaFechamento: 'Esta demanda não faz parte das atribuições de fiscalização da Diretoria de Vigilância Sanitária e Ambiental e sim da Agência Municipal do Meio Ambiente – AMMA, conforme o Artigo 4o Inciso XV e Artigo 35 Inciso I, ambos do Decreto Municipal 359/2021 e ainda o Artigo 6o Inciso VI da Lei Complementar Municipal 014/92. Favor realizar a denúncia na AMMA por meio dos telefones 3524-1441, 3524-1440 e pelo Telefone Verde da AMMA, de número 161.',
  },
  {
    id: 'maus_tratos_amma',
    situacao: 'Denúncia de maus tratos a animais / mau cheiro',
    categoria: 'finalizada',
    respostaFechamento: 'Esta demanda não faz parte das atribuições da Diretoria de Vigilância Sanitária e Ambiental, e sim da Agência Municipal do Meio Ambiente – AMMA, conforme o Artigo 1o, Artigo 2o, Inciso VII, Artigo 2-A, Parágrafo 4o, Inciso V e ainda o Artigo 10 da Lei Municipal 9843/2016. Favor realizar a denúncia na AMMA por meio do telefone 3524-1441 e pelo Telefone Verde da AMMA, de número 161.',
  },
  {
    id: 'competencia_amma',
    situacao: 'Denúncia de competência da AMMA',
    categoria: 'finalizada',
    respostaFechamento: 'A investigação da denúncia apresentada não é competência da Vigilância Sanitária, podendo ser registrada pelo Telefone 161 ou 3524-1413 para avaliação da AMMA.',
  },
  {
    id: 'competencia_seplanh',
    situacao: 'Denúncia de competência da SEPLANH',
    categoria: 'finalizada',
    respostaFechamento: 'A investigação da denúncia apresentada não é de competência da Vigilância Sanitária, podendo ser registrada através do ícone "sistema de atendimento @156" no site da Prefeitura (www.goiania.go.gov.br) para avaliação pela SEPLANH.',
  },
  {
    id: 'cancelamento',
    situacao: 'Solicitação de cancelamento de denúncia',
    categoria: 'finalizada',
    respostaFechamento: 'Informamos ao solicitante que a denúncia após ser aberta, somente poderá ser cancelada por quem à fez no sistema.',
  },
  {
    id: 'outro_app_aedes',
    situacao: 'Solicitação atendida por outro App (Aedes)',
    categoria: 'finalizada',
    respostaFechamento: 'Sua solicitação já é atendida pelo aplicativo "GOIÂNIA CONTRA O AEDES" que foi desenvolvido especificamente para atender solicitações relacionadas ao combate da dengue na cidade de Goiânia. Este aplicativo pode ser baixado gratuitamente nas lojas de aplicativos dos celulares. Para acionar o órgão responsável por verificar possíveis focos do mosquito Aedes Aegypti, baixe o aplicativo e abra sua solicitação através dele.',
  },
  {
    id: 'alimentacao_animais',
    situacao: 'Alimentação de animais domésticos em ambientes',
    categoria: 'finalizada',
    respostaFechamento: 'A fato denunciado não constitui irregularidade sanitária, estando previsto conforme legislação pertinente: Lei Complementar nº 014, de 29 de dezembro de 1992 - Código de Posturas do Município de Goiânia. Art 100-A É assegurado a qualquer cidadão o direito de fornecer, nos espaços públicos e/ou de uso comum, na forma e na quantidade adequada ao bem-estar animal, alimento e água aos animais errantes, em situação de rua, inclusive aos comunitários. (Incluído pela Lei Complementar nº 365, de 2023.)',
  },
  {
    id: 'reabertura_os',
    situacao: 'Reabertura de OS por insatisfação com resposta',
    categoria: 'finalizada',
    respostaFechamento: 'Para maiores informações sobre sua denúncia, favor entrar em contato por e-mail (visagoianiaXXXXX@gmail.com) ou telefone (3524-XXXX). Caso prefira, reabra a denúncia informando um telefone para que possamos entrar em contato e prestar maiores esclarecimentos.',
  },
  {
    id: 'competencia_mapa',
    situacao: 'Responsabilidade do MAPA',
    categoria: 'finalizada',
    respostaFechamento: 'A investigação da denúncia apresentada não é competência da Vigilância Sanitária. Favor realizar a denúncia no órgão competente: Agrodefesa (08006461122) e/ou MAPA - Ministério da Agricultura Pecuária e Abastecimento (3221-7200).',
  },
  {
    id: 'fora_municipio',
    situacao: 'Denúncias fora do Município de Goiânia',
    categoria: 'finalizada',
    respostaFechamento: 'Informamos ao solicitante que esse canal de denúncia abrangente somente locais/endereços localizados no Município de Goiânia.',
  },
  {
    id: 'conselho_tutelar',
    situacao: 'Competência do Conselho Tutelar',
    categoria: 'finalizada',
    respostaFechamento: 'A investigação da denúncia apresentada não é competência da Vigilância Sanitária. Favor realizar a denúncia no órgão competente: Disque 100.',
  },
  {
    id: 'encerrou_atividades',
    situacao: 'Estabelecimento encerrou atividades',
    categoria: 'finalizada',
    respostaFechamento: 'Em atendimento à denúncia, foi realizada visita fiscal no dia xxx às xx horas, e verificou-se que o estabelecimento encerrou as suas atividades no referido endereço.',
  },
  {
    id: 'lixo_condominio',
    situacao: 'Não recolhimento de lixo pelo condomínio',
    categoria: 'finalizada',
    respostaFechamento: 'A investigação da denúncia apresentada não é competência da Vigilância Sanitária. A determinação sobre o procedimento estabelecido é inteiramente do condomínio, através da convenção do mesmo.',
  },
];

interface DenunciaResponseFormProps {
  open: boolean;
  onClose: () => void;
  documentId: string;
  establishmentName?: string;
  documentNumber?: string;
}

export function DenunciaResponseForm({ 
  open, onClose, documentId, establishmentName, documentNumber 
}: DenunciaResponseFormProps) {
  const { toast } = useToast();
  const [selectedResposta, setSelectedResposta] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [tab, setTab] = useState<string>('finalizada');
  const [osNumber, setOsNumber] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSelect = (resposta: RespostaPadrao) => {
    setSelectedResposta(resposta.id);
    const text = resposta.respostaFechamento || resposta.fraseTransferencia || '';
    setEditedText(text);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editedText);
    setCopied(true);
    toast({ title: 'Copiado!', description: 'Resposta copiada para a área de transferência.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFinish = () => {
    if (!editedText.trim()) {
      toast({ title: 'Selecione uma resposta', variant: 'destructive' });
      return;
    }
    // Copy to clipboard and close
    navigator.clipboard.writeText(editedText);
    toast({ 
      title: 'Resposta copiada!', 
      description: 'Cole a resposta no sistema de atendimento (App 24h).' 
    });
    onClose();
  };

  const filteredRespostas = respostasPadrao.filter(r => r.categoria === tab);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="text-lg">Resposta da Denúncia</DialogTitle>
          <DialogDescription className="text-sm">
            {establishmentName && <span className="font-medium">{establishmentName}</span>}
            {documentNumber && <span className="text-muted-foreground"> • {documentNumber}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="px-4">
          <div className="space-y-1">
            <Label className="text-xs">Nº da OS (opcional)</Label>
            <Input 
              placeholder="Ex: 2025-00001" 
              value={osNumber} 
              onChange={(e) => setOsNumber(e.target.value)} 
              className="text-sm h-8"
            />
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 grid grid-cols-2">
            <TabsTrigger value="em_andamento" className="text-xs gap-1">
              <Clock className="h-3 w-3" /> Em Andamento
            </TabsTrigger>
            <TabsTrigger value="finalizada" className="text-xs gap-1">
              <CheckCircle2 className="h-3 w-3" /> Finalizar
            </TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="flex-1 min-h-0 mt-2">
            <ScrollArea className="h-[280px] px-4">
              <div className="space-y-2 pb-2">
                {filteredRespostas.map((resp) => (
                  <Card
                    key={resp.id}
                    className={cn(
                      'cursor-pointer transition-all border',
                      selectedResposta === resp.id 
                        ? 'ring-2 ring-primary bg-primary/5 border-primary/30' 
                        : 'border-border hover:border-primary/20'
                    )}
                    onClick={() => handleSelect(resp)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        {selectedResposta === resp.id && (
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        )}
                        <p className="text-xs leading-relaxed">{resp.situacao}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {selectedResposta && (
          <div className="px-4 space-y-2">
            <Label className="text-xs font-medium">Texto da resposta (editável)</Label>
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="min-h-[100px] text-xs"
              placeholder="Selecione uma situação acima..."
            />
          </div>
        )}

        <div className="p-4 pt-2 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
            Pular
          </Button>
          {selectedResposta && (
            <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
              <Copy className="h-3 w-3" />
              {copied ? 'Copiado!' : 'Copiar'}
            </Button>
          )}
          <Button size="sm" className="flex-1 gap-1" onClick={handleFinish}>
            <Send className="h-3 w-3" />
            Copiar e Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

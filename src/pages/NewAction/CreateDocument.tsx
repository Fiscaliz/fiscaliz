import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  CheckSquare, 
  Edit3, 
  Sparkles,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  FileText,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { checklistTemplates, getAllCategories, type ChecklistItem } from '@/data/checklists';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

const creationMethods = [
  { id: 'upload', icon: Upload, label: 'Upload de Documento', description: 'Foto do documento em papel' },
  { id: 'checklist', icon: CheckSquare, label: 'Checklist Pré-Atestado', description: 'Por tipo de estabelecimento' },
  { id: 'manual', icon: Edit3, label: 'Preenchimento Manual', description: 'Editor de texto' },
  { id: 'ai', icon: Sparkles, label: 'Fiscalização por IA', description: 'Upload de até 50 fotos' },
  { id: 'outros', icon: MoreHorizontal, label: 'Outros', description: 'Campo livre' },
];

const documentTypeLabels: Record<string, string> = {
  termo_intimacao: 'Termo de Intimação',
  visita_fiscal: 'Visita Fiscal',
  auto_infracao: 'Auto de Infração',
  advertencia: 'Advertência',
  inutilizacao: 'Inutilização',
  apreensao: 'Apreensão',
  interdicao: 'Interdição',
  relatorio_tecnico: 'Relatório Técnico',
  notificacao: 'Notificação',
  replica: 'Réplica',
  certidao: 'Certidão',
  coleta_amostra: 'Coleta de Amostra',
};

export default function CreateDocument() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const motivo = searchParams.get('motivo') || '';
  const tipo = searchParams.get('tipo') || 'termo_intimacao';
  const establishmentData = searchParams.get('establishment');
  const establishment = establishmentData ? JSON.parse(decodeURIComponent(establishmentData)) : null;

  const [method, setMethod] = useState<string | null>(null);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [manualContent, setManualContent] = useState('');
  const [deadlineDays, setDeadlineDays] = useState('15');
  const [saving, setSaving] = useState(false);

  const currentChecklist = useMemo(() => {
    return checklistTemplates.find(c => c.id === selectedChecklist);
  }, [selectedChecklist]);

  const categories = useMemo(() => {
    if (!currentChecklist) return [];
    return getAllCategories(currentChecklist);
  }, [currentChecklist]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const toggleItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const getItemsByCategory = (category: string): ChecklistItem[] => {
    return currentChecklist?.items.filter(item => item.category === category) || [];
  };

  const generateDocumentContent = () => {
    if (method === 'checklist' && currentChecklist) {
      const selectedItemsData = currentChecklist.items.filter(item => selectedItems.includes(item.id));
      return selectedItemsData.map((item, idx) => `${idx + 1}. ${item.text}`).join('\n');
    }
    return manualContent;
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    
    try {
      // Create establishment if new
      let establishmentId = establishment?.id;
      
      if (!establishmentId && establishment) {
        const { data: newEstablishment, error: estError } = await supabase
          .from('establishments')
          .insert({
            cnpj: establishment.cnpj,
            razao_social: establishment.razao_social,
            nome_fantasia: establishment.nome_fantasia,
            endereco: establishment.endereco,
            bairro: establishment.bairro,
            cep: establishment.cep,
            created_by: user.id,
          })
          .select()
          .single();
        
        if (estError) throw estError;
        establishmentId = newEstablishment.id;
      }

      // Create fiscal action
      const { data: action, error: actionError } = await supabase
        .from('fiscal_actions')
        .insert({
          user_id: user.id,
          establishment_id: establishmentId,
          reason: motivo as any,
        })
        .select()
        .single();

      if (actionError) throw actionError;

      // Calculate deadline date
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + parseInt(deadlineDays));

      // Create document
      const content = generateDocumentContent();
      const irregularities = method === 'checklist' && currentChecklist
        ? currentChecklist.items.filter(item => selectedItems.includes(item.id)).map(item => ({
            id: item.id,
            text: item.text,
            category: item.category,
            legislation: item.legislation,
          }))
        : [];

      const { error: docError } = await supabase
        .from('fiscal_documents')
        .insert({
          user_id: user.id,
          establishment_id: establishmentId,
          fiscal_action_id: action.id,
          document_type: tipo as any,
          content: { text: content, method },
          irregularities,
          deadline_days: tipo === 'termo_intimacao' ? parseInt(deadlineDays) : null,
          deadline_date: tipo === 'termo_intimacao' ? deadlineDate.toISOString().split('T')[0] : null,
          priority: motivo === 'denuncia' || motivo === 'surto' ? 'high' : 'medium',
        });

      if (docError) throw docError;

      toast({
        title: 'Documento salvo!',
        description: `${documentTypeLabels[tipo]} criado com sucesso`,
      });

      navigate('/');
    } catch (error: any) {
      console.error('Error saving document:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <Header 
        title={documentTypeLabels[tipo] || 'Novo Documento'} 
        subtitle={establishment?.nome_fantasia || establishment?.razao_social || 'Criar documento'}
        showBack 
      />
      
      <div className="p-4 space-y-4">
        {/* Method Selection */}
        {!method && (
          <>
            <Card className="border-0 shadow-sm bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{establishment?.nome_fantasia || establishment?.razao_social}</p>
                    <p className="text-sm text-muted-foreground">{establishment?.endereco}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground">
              Como deseja criar o {documentTypeLabels[tipo].toLowerCase()}?
            </p>
            
            <div className="grid gap-3">
              {creationMethods.map((m) => (
                <Card 
                  key={m.id}
                  className="border-0 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
                  onClick={() => setMethod(m.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        'rounded-xl p-3',
                        m.id === 'ai' ? 'bg-gradient-to-br from-primary to-secondary text-primary-foreground' : 'bg-primary/10'
                      )}>
                        <m.icon className={cn('h-6 w-6', m.id !== 'ai' && 'text-primary')} />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{m.label}</p>
                        <p className="text-sm text-muted-foreground">{m.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Checklist Selection */}
        {method === 'checklist' && !selectedChecklist && (
          <>
            <p className="text-sm text-muted-foreground">
              Selecione o tipo de estabelecimento:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {checklistTemplates.map((checklist) => (
                <Card 
                  key={checklist.id}
                  className="border-0 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-95"
                  onClick={() => {
                    setSelectedChecklist(checklist.id);
                    // Expand all categories by default
                    const cats = getAllCategories(checklist);
                    setExpandedCategories(cats);
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-2">
                      <div className="rounded-lg p-2 bg-primary/10 w-fit">
                        <CheckSquare className="h-5 w-5 text-primary" />
                      </div>
                      <p className="font-medium text-sm">{checklist.name}</p>
                      <p className="text-[11px] text-muted-foreground">{checklist.items.length} itens</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Button variant="outline" className="w-full" onClick={() => setMethod(null)}>
              Voltar
            </Button>
          </>
        )}

        {/* Checklist Items */}
        {method === 'checklist' && selectedChecklist && currentChecklist && (
          <>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{currentChecklist.name}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {selectedItems.length}/{currentChecklist.items.length}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {categories.map((category) => (
                  <div key={category} className="border rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between p-3 bg-muted/50 text-left"
                      onClick={() => toggleCategory(category)}
                    >
                      <span className="font-medium text-sm">{category}</span>
                      {expandedCategories.includes(category) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {expandedCategories.includes(category) && (
                      <div className="p-3 space-y-2">
                        {getItemsByCategory(category).map((item) => (
                          <label
                            key={item.id}
                            className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50"
                          >
                            <Checkbox
                              checked={selectedItems.includes(item.id)}
                              onCheckedChange={() => toggleItem(item.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <p className="text-sm">{item.text}</p>
                              {item.legislation && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.legislation}
                                </p>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Deadline for Termo de Intimação */}
            {tipo === 'termo_intimacao' && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <Label htmlFor="prazo">Prazo para adequação</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="prazo"
                          type="number"
                          min="1"
                          max="90"
                          value={deadlineDays}
                          onChange={(e) => setDeadlineDays(e.target.value)}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">dias</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedChecklist(null)}>
                Voltar
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSave}
                disabled={selectedItems.length === 0 || saving}
              >
                {saving ? 'Salvando...' : 'Salvar Documento'}
              </Button>
            </div>
          </>
        )}

        {/* Manual Entry */}
        {method === 'manual' && (
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div>
                  <Label htmlFor="content">Conteúdo do Documento</Label>
                  <Textarea
                    id="content"
                    placeholder="Digite o conteúdo do documento..."
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    className="min-h-[200px] mt-2"
                  />
                </div>

                {tipo === 'termo_intimacao' && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <Label htmlFor="prazoManual">Prazo</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Input
                          id="prazoManual"
                          type="number"
                          min="1"
                          max="90"
                          value={deadlineDays}
                          onChange={(e) => setDeadlineDays(e.target.value)}
                          className="w-20"
                        />
                        <span className="text-sm text-muted-foreground">dias</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setMethod(null)}>
                Voltar
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSave}
                disabled={!manualContent.trim() || saving}
              >
                {saving ? 'Salvando...' : 'Salvar Documento'}
              </Button>
            </div>
          </>
        )}

        {/* AI Method Placeholder */}
        {method === 'ai' && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Sparkles className="mx-auto h-12 w-12 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Fiscalização por IA</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Faça upload de até 50 fotos e a IA analisará as irregularidades automaticamente.
              </p>
              <Button variant="outline" onClick={() => setMethod(null)}>
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Upload and Others placeholders */}
        {(method === 'upload' || method === 'outros') && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">
                {method === 'upload' ? 'Upload de Documento' : 'Outros'}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Funcionalidade em desenvolvimento.
              </p>
              <Button variant="outline" onClick={() => setMethod(null)}>
                Voltar
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

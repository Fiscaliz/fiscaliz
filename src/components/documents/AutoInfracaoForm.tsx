import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Scale, 
  Camera,
  X,
  Plus,
  Trash2,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Search,
  FolderOpen,
  Sparkles,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  checklistTemplates, 
  legislationDatabase, 
  type LegislationReference,
  type ChecklistItem 
} from '@/data/checklists';

export interface InfracaoItem {
  id: string;
  descricao: string;
  dispositivo: string;
  dispositivoCompleto?: LegislationReference;
}

export interface AutoInfracaoData {
  infracoes: InfracaoItem[];
  valorMulta: string;
  prazoDefesa: number;
  documentDate: string;
  documentTime: string;
}

interface AutoInfracaoFormProps {
  value: AutoInfracaoData;
  onChange: (data: AutoInfracaoData) => void;
  photos: { id: string; previewUrl: string; file?: File }[];
  onAddPhoto: () => void;
  onCapturePhoto?: () => void;
  onRemovePhoto: (index: number) => void;
  photosRequired?: boolean;
}

// Legislações mais comuns para Auto de Infração
const commonLegislations = [
  'RDC 216/2004; LM 8741/08 Art. 81 Inc. XIX',
  'LM 8741/08 Art. 81 Inc. IV c/c Art. 82',
  'RDC 275/2002',
  'RDC 727/2022',
  'Lei Estadual 16.140/2007',
];

export function AutoInfracaoForm({ 
  value, 
  onChange, 
  photos, 
  onAddPhoto,
  onCapturePhoto,
  onRemovePhoto,
  photosRequired = true 
}: AutoInfracaoFormProps) {
  const { toast } = useToast();
  const [novaInfracao, setNovaInfracao] = useState('');
  const [novoDispositivo, setNovoDispositivo] = useState('');
  const [showChecklist, setShowChecklist] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null);
  const [checklistSearch, setChecklistSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const addInfracao = () => {
    if (!novaInfracao.trim() || !novoDispositivo.trim()) return;
    
    const legislacaoRef = legislationDatabase.find(l => 
      l.code.toLowerCase().includes(novoDispositivo.toLowerCase()) ||
      novoDispositivo.toLowerCase().includes(l.code.toLowerCase())
    );

    const newItem: InfracaoItem = {
      id: `inf_${Date.now()}`,
      descricao: novaInfracao.trim(),
      dispositivo: novoDispositivo.trim(),
      dispositivoCompleto: legislacaoRef,
    };

    onChange({
      ...value,
      infracoes: [...value.infracoes, newItem],
    });

    setNovaInfracao('');
    setNovoDispositivo('');
  };

  const removeInfracao = (id: string) => {
    onChange({
      ...value,
      infracoes: value.infracoes.filter(i => i.id !== id),
    });
  };

  const updateField = <K extends keyof AutoInfracaoData>(field: K, fieldValue: AutoInfracaoData[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  // AI analysis of photos to auto-generate infractions
  const handleAIAnalysis = async () => {
    if (photos.length === 0) {
      toast({ title: 'Adicione fotos primeiro', variant: 'destructive' });
      return;
    }
    setAiAnalyzing(true);
    try {
      // Upload photos to storage for AI analysis
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const uploadedUrls: string[] = [];
      const tempId = crypto.randomUUID();
      
      for (const photo of photos) {
        if (photo.file) {
          const fileExt = photo.file.name?.split('.').pop() || 'jpg';
          const fileName = `${user.id}/ai_auto_${tempId}_${photo.id}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('fiscal-photos')
            .upload(fileName, photo.file, { upsert: true });
          if (uploadError) throw uploadError;
          const { data: signedData } = await supabase.storage.from('fiscal-photos').createSignedUrl(fileName, 3600);
          if (signedData?.signedUrl) uploadedUrls.push(signedData.signedUrl);
        } else if (photo.previewUrl && !photo.previewUrl.startsWith('blob:')) {
          uploadedUrls.push(photo.previewUrl);
        }
      }

      if (uploadedUrls.length === 0) {
        throw new Error('Nenhuma foto pôde ser enviada para análise');
      }

      const { data, error } = await supabase.functions.invoke('analyze-photos', {
        body: { documentType: 'auto_infracao', photos: uploadedUrls },
      });
      if (error) throw error;

      const photoAnalysis = data?.photoAnalysis as Array<{
        foto: number; legenda: string; item_rdc: string;
      }> | undefined;

      if (photoAnalysis && photoAnalysis.length > 0) {
        const newInfracoes: InfracaoItem[] = photoAnalysis
          .filter(pa => pa.legenda?.trim())
          .map((pa, idx) => {
            const legislacaoRef = pa.item_rdc 
              ? legislationDatabase.find(l => l.code.toLowerCase().includes(pa.item_rdc.toLowerCase()))
              : undefined;
            return {
              id: `ai_inf_${Date.now()}_${idx}`,
              descricao: pa.legenda,
              dispositivo: pa.item_rdc || 'Legislação não identificada',
              dispositivoCompleto: legislacaoRef,
            };
          });

        if (newInfracoes.length > 0) {
          onChange({ ...value, infracoes: [...value.infracoes, ...newInfracoes] });
          toast({ title: 'Análise concluída', description: `${newInfracoes.length} infração(ões) identificada(s) pela IA. Revise antes de salvar.` });
        } else {
          toast({ title: 'Nenhuma infração identificada', description: 'Adicione manualmente.' });
        }
      } else {
        toast({ title: 'Análise sem resultados', description: 'Adicione infrações manualmente.', variant: 'destructive' });
      }
    } catch (error: any) {
      console.error('AI analysis error:', error);
      toast({ title: 'Erro na análise', description: error.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Toggle item selection from checklist
  const toggleChecklistItem = (item: ChecklistItem) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id);
    } else {
      newSelected.add(item.id);
    }
    setSelectedItems(newSelected);
  };

  // Add selected checklist items as infractions
  const addSelectedChecklistItems = () => {
    if (!selectedChecklist) return;
    
    const template = checklistTemplates.find(c => c.id === selectedChecklist);
    if (!template) return;

    const newInfracoes: InfracaoItem[] = [];
    
    template.items
      .filter(item => selectedItems.has(item.id))
      .forEach(item => {
        // Check if already added
        const alreadyExists = value.infracoes.some(
          inf => inf.descricao.toLowerCase() === item.text.toLowerCase()
        );
        
        if (!alreadyExists) {
          const legislacaoRef = item.legislation 
            ? legislationDatabase.find(l => 
                l.code.toLowerCase().includes(item.legislation!.toLowerCase()) ||
                item.legislation!.toLowerCase().includes(l.code.toLowerCase())
              )
            : undefined;

          newInfracoes.push({
            id: `inf_${Date.now()}_${item.id}`,
            descricao: item.text,
            dispositivo: item.legislation || 'Legislação não especificada',
            dispositivoCompleto: legislacaoRef,
          });
        }
      });

    if (newInfracoes.length > 0) {
      onChange({
        ...value,
        infracoes: [...value.infracoes, ...newInfracoes],
      });
    }

    // Reset selection
    setSelectedItems(new Set());
    setShowChecklist(false);
    setSelectedChecklist(null);
  };

  // Get filtered items from selected checklist
  const getFilteredChecklistItems = () => {
    if (!selectedChecklist) return [];
    
    const template = checklistTemplates.find(c => c.id === selectedChecklist);
    if (!template) return [];

    if (!checklistSearch.trim()) return template.items;

    const search = checklistSearch.toLowerCase();
    return template.items.filter(item => 
      item.text.toLowerCase().includes(search) ||
      item.category.toLowerCase().includes(search) ||
      (item.legislation && item.legislation.toLowerCase().includes(search))
    );
  };

  // Get categories from filtered items
  const getCategoriesFromItems = (items: ChecklistItem[]) => {
    const categories = new Set(items.map(item => item.category));
    return Array.from(categories);
  };

  const filteredItems = getFilteredChecklistItems();
  const categories = getCategoriesFromItems(filteredItems);

  return (
    <div className="space-y-4">
      {/* Aviso sobre Auto de Infração */}
      <Card className="border-0 shadow-sm border-l-4 border-l-destructive">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-destructive">Auto de Infração</p>
              <p className="text-xs text-muted-foreground mt-1">
                Documento punitivo que exige fundamentação legal obrigatória para cada infração 
                e registro fotográfico como prova documental.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Registro Fotográfico Obrigatório */}
      <Card className={cn(
        "border-0 shadow-sm",
        photosRequired && photos.length === 0 && "border-2 border-destructive"
      )}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Registro Fotográfico</Label>
              <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">Obrigatório</span>
            </div>
            <span className="text-xs text-muted-foreground">{photos.length} foto(s)</span>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Anexe fotos das irregularidades como prova documental para fundamentar o auto.
          </p>

          {photos.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {photos.map((photo, idx) => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={photo.previewUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => onRemovePhoto(idx)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onCapturePhoto || onAddPhoto}
              className="flex-1 h-12"
            >
              <Camera className="h-5 w-5 mr-2" />
              Capturar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onAddPhoto}
              className="flex-1 h-12"
            >
              <FolderOpen className="h-5 w-5 mr-2" />
              Galeria
            </Button>
          </div>

          {/* Botão Análise por IA */}
          {photos.length > 0 && (
            <Button
              variant="default"
              size="sm"
              className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-primary-foreground"
              onClick={handleAIAnalysis}
              disabled={aiAnalyzing}
            >
              {aiAnalyzing ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Analisando...</>
              ) : (
                <><Sparkles className="h-5 w-5 mr-2" /> Identificar Infrações por IA</>
              )}
            </Button>
          )}

          {photosRequired && photos.length === 0 && (
            <p className="text-xs text-destructive">
              ⚠️ É obrigatório anexar pelo menos uma foto das irregularidades
            </p>
          )}
        </CardContent>
      </Card>

      {/* Importar do Checklist */}
      <Card className="border-0 shadow-sm border-primary/50">
        <CardContent className="p-4 space-y-3">
          <button
            type="button"
            onClick={() => setShowChecklist(!showChecklist)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium cursor-pointer">Importar do Checklist</Label>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Recomendado</span>
            </div>
            {showChecklist ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          {showChecklist && (
            <div className="space-y-3 pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Selecione itens do checklist pré-definido com as legislações já associadas.
              </p>

              {/* Seletor de tipo de checklist */}
              {!selectedChecklist ? (
                <div className="grid grid-cols-2 gap-2">
                  {checklistTemplates.map(template => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => setSelectedChecklist(template.id)}
                      className="p-3 text-left rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <p className="text-sm font-medium">{template.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{template.items.length} itens</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Header with back button */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChecklist(null);
                        setSelectedItems(new Set());
                        setChecklistSearch('');
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      ← Voltar aos checklists
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {selectedItems.size} selecionado(s)
                    </span>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar no checklist..."
                      value={checklistSearch}
                      onChange={(e) => setChecklistSearch(e.target.value)}
                      className="pl-9 text-sm"
                    />
                  </div>

                  {/* Items list */}
                  <ScrollArea className="h-[300px] rounded-md border p-2">
                    {categories.map(category => {
                      const categoryItems = filteredItems.filter(item => item.category === category);
                      if (categoryItems.length === 0) return null;

                      return (
                        <div key={category} className="mb-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                            {category}
                          </p>
                          <div className="space-y-2">
                            {categoryItems.map(item => (
                              <label
                                key={item.id}
                                className={cn(
                                  "flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                                  selectedItems.has(item.id) 
                                    ? "bg-primary/10 border border-primary/30" 
                                    : "hover:bg-muted/50"
                                )}
                              >
                                <Checkbox
                                  checked={selectedItems.has(item.id)}
                                  onCheckedChange={() => toggleChecklistItem(item)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1">
                                  <p className="text-sm">{item.text}</p>
                                  {item.legislation && (
                                    <p className="text-xs text-primary/80 mt-1 font-medium">
                                      📜 {item.legislation}
                                    </p>
                                  )}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </ScrollArea>

                  {/* Add selected button */}
                  <Button
                    onClick={addSelectedChecklistItems}
                    disabled={selectedItems.size === 0}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar {selectedItems.size} infração(ões) selecionada(s)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Infrações */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Infrações com Dispositivo Legal</Label>
          </div>

          {/* Infrações cadastradas */}
          {value.infracoes.length > 0 && (
            <div className="space-y-2">
              {value.infracoes.map((infracao, idx) => (
                <div 
                  key={infracao.id}
                  className="p-3 rounded-lg border bg-muted/30 space-y-1"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{idx + 1}. {infracao.descricao}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-medium">
                          {infracao.dispositivo}
                        </span>
                        {infracao.dispositivoCompleto && (
                          <span className="text-xs text-muted-foreground">
                            - {infracao.dispositivoCompleto.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => removeInfracao(infracao.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Adicionar nova infração manualmente */}
          <div className="space-y-3 p-3 rounded-lg border border-dashed">
            <p className="text-xs text-muted-foreground font-medium">Adicionar Infração Manualmente:</p>
            
            <div className="space-y-2">
              <Textarea
                placeholder="Descreva a infração encontrada..."
                value={novaInfracao}
                onChange={(e) => setNovaInfracao(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              
              <div className="space-y-1">
                <Label className="text-xs">Dispositivo Legal Infringido</Label>
                <Input
                  placeholder="Ex: RDC 216/2004, Art. 5º; LM 8741/08 Art. 81 Inc. XIX"
                  value={novoDispositivo}
                  onChange={(e) => setNovoDispositivo(e.target.value)}
                  className="text-sm"
                />
                <div className="flex flex-wrap gap-1 mt-1">
                  {commonLegislations.map(leg => (
                    <button
                      key={leg}
                      type="button"
                      className="text-xs bg-muted px-2 py-0.5 rounded hover:bg-primary/20 transition-colors"
                      onClick={() => setNovoDispositivo(leg)}
                    >
                      {leg.length > 30 ? leg.substring(0, 30) + '...' : leg}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={addInfracao}
              disabled={!novaInfracao.trim() || !novoDispositivo.trim()}
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Infração
            </Button>
          </div>

          {value.infracoes.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Nenhuma infração adicionada. Use o checklist acima ou adicione manualmente.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Prazo para Defesa */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <Label className="text-sm font-medium">Prazo para Defesa</Label>
          </div>
          
          <p className="text-xs text-muted-foreground">
            Conforme legislação vigente, o autuado tem direito a apresentar defesa.
          </p>

          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="10"
              max="30"
              value={value.prazoDefesa}
              onChange={(e) => updateField('prazoDefesa', parseInt(e.target.value) || 15)}
              className="w-20 text-sm"
            />
            <span className="text-sm text-muted-foreground">dias para apresentação de defesa</span>
          </div>
        </CardContent>
      </Card>

      {/* Data e Hora */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="autoDate" className="text-xs">Data da Autuação</Label>
              <Input
                id="autoDate"
                type="date"
                value={value.documentDate}
                onChange={(e) => updateField('documentDate', e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="autoTime" className="text-xs">Horário</Label>
              <Input
                id="autoTime"
                type="time"
                value={value.documentTime}
                onChange={(e) => updateField('documentTime', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function formatAutoInfracaoContent(data: AutoInfracaoData): string {
  const parts: string[] = [];

  if (data.infracoes.length > 0) {
    const infracaoTexts = data.infracoes.map((inf, idx) => {
      let text = `${idx + 1}. ${inf.descricao}`;
      text += `\n   Dispositivo Legal: ${inf.dispositivo}`;
      if (inf.dispositivoCompleto) {
        text += ` - ${inf.dispositivoCompleto.name}`;
      }
      return text;
    });
    parts.push(`INFRAÇÕES SANITÁRIAS:\n\n${infracaoTexts.join('\n\n')}`);
  }

  parts.push(`\nPRAZO PARA DEFESA: ${data.prazoDefesa} dias contados a partir da ciência deste auto.`);
  parts.push('\nO autuado poderá apresentar defesa por escrito à Diretoria de Vigilância Sanitária e Ambiental no prazo acima estabelecido.');

  return parts.join('\n');
}

import { useState, useCallback } from 'react';
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
  Loader2,
  RefreshCw,
  CheckCircle2,
  MessageSquare,
  Edit3,
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
import { LegislationSelectDialog, DEFAULT_LEGISLATION } from '@/components/documents/LegislationSelectDialog';

function convertToNegativeNarration(text: string): string {
  const trimmed = text.trim();
  if (trimmed.toLowerCase().startsWith('por não ') || trimmed.toLowerCase().startsWith('por nao ')) {
    return trimmed;
  }
  const firstChar = trimmed.charAt(0).toLowerCase();
  return `Por não ${firstChar}${trimmed.slice(1)}`;
}

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

interface PhotoLegend {
  photoIndex: number;
  legenda: string;
  item_rdc: string;
  signedUrl?: string;
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

const commonLegislations = [
  'RDC 216/2004; LM 8741/08 Art. 81 Inc. XIX',
  'LM 8741/08 Art. 81 Inc. IV c/c Art. 82',
  'RDC 275/2002',
  'RDC 727/2022',
  'Lei Estadual 16.140/2007',
  'Resolução 20 DIVISA',
];

const specificLegislations = [
  { label: 'RDC 216/2004 – Alimentos', value: 'RDC 216/2004' },
  { label: 'Resolução 20 – DIVISA GO', value: 'Resolução 20 DIVISA' },
  { label: 'RDC 275/2002 – BPF Indústria', value: 'RDC 275/2002' },
  { label: 'Código Sanitário Municipal (Lei 8741/08)', value: 'Lei 8741/2008' },
  { label: 'RDC 44/2009 – Farmácias', value: 'RDC 44/2009' },
  { label: 'RDC 222/2018 – RSS', value: 'RDC 222/2018' },
  { label: 'Outra (digitar)…', value: 'custom' },
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

  // Manual infraction fields
  const [novaInfracao, setNovaInfracao] = useState('');
  const [novoDispositivo, setNovoDispositivo] = useState('');

  // Checklist import
  const [showChecklist, setShowChecklist] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null);
  const [checklistSearch, setChecklistSearch] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // AI analysis state
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [photoLegends, setPhotoLegends] = useState<PhotoLegend[]>([]);
  const [signedUrls, setSignedUrls] = useState<string[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [reanalyzingPhoto, setReanalyzingPhoto] = useState<number | null>(null);
  const [showLegislationDialog, setShowLegislationDialog] = useState(false);

  // Re-analysis panel state
  const [showReanalysisPanel, setShowReanalysisPanel] = useState(false);
  const [reanalysisLegislation, setReanalysisLegislation] = useState(DEFAULT_LEGISLATION);
  const [reanalysisCustomLeg, setReanalysisCustomLeg] = useState('');
  const [reanalysisObservation, setReanalysisObservation] = useState('');

  // ── helpers ──────────────────────────────────────────────────────────────

  const updateLegend = (photoIndex: number, field: 'legenda' | 'item_rdc', val: string) => {
    setPhotoLegends(prev => prev.map(l => l.photoIndex === photoIndex ? { ...l, [field]: val } : l));
  };

  const applyLegendsAsInfracoes = () => {
    const filled = photoLegends.filter(l => l.legenda.trim());
    if (filled.length === 0) {
      toast({ title: 'Nenhuma legenda preenchida', description: 'Preencha as descrições das fotos primeiro.', variant: 'destructive' });
      return;
    }
    const newInfracoes: InfracaoItem[] = filled.map((l, idx) => {
      const legislacaoRef = l.item_rdc
        ? legislationDatabase.find(leg => leg.code.toLowerCase().includes(l.item_rdc.toLowerCase()))
        : undefined;
      return {
        id: `ai_inf_${Date.now()}_${idx}`,
        descricao: convertToNegativeNarration(l.legenda),
        dispositivo: l.item_rdc || 'Legislação não identificada',
        dispositivoCompleto: legislacaoRef,
      };
    });
    onChange({ ...value, infracoes: [...value.infracoes, ...newInfracoes] });
    toast({ title: `${newInfracoes.length} infração(ões) adicionada(s)`, description: 'Revise a lista e salve o documento.' });
    setAnalysisComplete(false);
    setPhotoLegends([]);
    setSignedUrls([]);
  };

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
    onChange({ ...value, infracoes: [...value.infracoes, newItem] });
    setNovaInfracao('');
    setNovoDispositivo('');
  };

  const removeInfracao = (id: string) => {
    onChange({ ...value, infracoes: value.infracoes.filter(i => i.id !== id) });
  };

  const updateField = <K extends keyof AutoInfracaoData>(field: K, fieldValue: AutoInfracaoData[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  // ── AI analysis ──────────────────────────────────────────────────────────

  const handleAIAnalysis = async (overrideLeg?: string, overrideObs?: string) => {
    if (photos.length === 0) {
      toast({ title: 'Adicione fotos primeiro', variant: 'destructive' });
      return;
    }
    setAiAnalyzing(true);
    setShowLegislationDialog(false);
    const targetLegislation = overrideLeg || DEFAULT_LEGISLATION;
    const observation = overrideObs || '';

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const uploadedUrls: string[] = [];
      const tempId = crypto.randomUUID();

      toast({ title: 'Enviando fotos…', description: `${photos.length} foto(s) em processamento` });

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

      if (uploadedUrls.length === 0) throw new Error('Nenhuma foto pôde ser enviada para análise');

      setSignedUrls(uploadedUrls);

      toast({ title: 'Analisando com IA…', description: `Legislação: ${targetLegislation}${observation ? ` | Obs: ${observation}` : ''}` });

      const body: Record<string, unknown> = {
        documentType: 'auto_infracao',
        photos: uploadedUrls,
        targetLegislation,
      };
      if (observation) body.observation = observation;

      const { data, error } = await supabase.functions.invoke('analyze-photos', { body });
      if (error) throw error;

      const photoAnalysis = data?.photoAnalysis as Array<{ foto: number; legenda: string; item_rdc: string }> | undefined;

      const legends: PhotoLegend[] = photos.map((_, i) => {
        const aiResult = photoAnalysis?.find(pa => pa.foto - 1 === i || pa.foto === i + 1);
        return {
          photoIndex: i,
          legenda: aiResult?.legenda || '',
          item_rdc: aiResult?.item_rdc || targetLegislation,
          signedUrl: uploadedUrls[i],
        };
      });

      setPhotoLegends(legends);
      setAnalysisComplete(true);
      setShowReanalysisPanel(false);

      const identified = legends.filter(l => l.legenda.trim()).length;
      toast({
        title: 'Análise concluída ✓',
        description: `${identified}/${photos.length} foto(s) com irregularidades. Edite as legendas abaixo e clique em "Adicionar como Infrações".`,
      });
    } catch (error: any) {
      console.error('AI analysis error:', error);
      const fallbackLegends: PhotoLegend[] = photos.map((_, i) => ({
        photoIndex: i,
        legenda: '',
        item_rdc: targetLegislation,
        signedUrl: signedUrls[i],
      }));
      setPhotoLegends(fallbackLegends);
      setAnalysisComplete(true);
      toast({ title: 'Análise falhou', description: 'Preencha as legendas manualmente abaixo.', variant: 'destructive' });
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleReanalyzePhoto = async (photoIndex: number) => {
    const legend = photoLegends[photoIndex];
    if (!legend?.legenda.trim() || !legend.signedUrl) return;
    setReanalyzingPhoto(photoIndex);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-photos', {
        body: {
          documentType: 'suggest_legal_basis',
          photos: [legend.signedUrl],
          description: legend.legenda,
        },
      });
      if (error) throw error;
      const { photoAnalysis } = data || {};
      if (photoAnalysis?.[0]?.item_rdc) {
        updateLegend(photoIndex, 'item_rdc', photoAnalysis[0].item_rdc);
        toast({ title: 'Base legal sugerida', description: photoAnalysis[0].item_rdc });
      }
    } catch {
      toast({ title: 'Não foi possível sugerir base legal', variant: 'destructive' });
    } finally {
      setReanalyzingPhoto(null);
    }
  };

  // ── checklist helpers ─────────────────────────────────────────────────────

  const toggleChecklistItem = (item: ChecklistItem) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(item.id)) newSelected.delete(item.id);
    else newSelected.add(item.id);
    setSelectedItems(newSelected);
  };

  const addSelectedChecklistItems = () => {
    if (!selectedChecklist) return;
    const template = checklistTemplates.find(c => c.id === selectedChecklist);
    if (!template) return;
    const newInfracoes: InfracaoItem[] = [];
    template.items.filter(item => selectedItems.has(item.id)).forEach(item => {
      const alreadyExists = value.infracoes.some(inf => inf.descricao.toLowerCase() === item.text.toLowerCase());
      if (!alreadyExists) {
        const legislacaoRef = item.legislation
          ? legislationDatabase.find(l =>
              l.code.toLowerCase().includes(item.legislation!.toLowerCase()) ||
              item.legislation!.toLowerCase().includes(l.code.toLowerCase())
            )
          : undefined;
        newInfracoes.push({
          id: `inf_${Date.now()}_${item.id}`,
          descricao: convertToNegativeNarration(item.text),
          dispositivo: item.legislation || 'Legislação não especificada',
          dispositivoCompleto: legislacaoRef,
        });
      }
    });
    if (newInfracoes.length > 0) onChange({ ...value, infracoes: [...value.infracoes, ...newInfracoes] });
    setSelectedItems(new Set());
    setShowChecklist(false);
    setSelectedChecklist(null);
  };

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

  const getCategoriesFromItems = (items: ChecklistItem[]) => Array.from(new Set(items.map(item => item.category)));

  const filteredItems = getFilteredChecklistItems();
  const categories = getCategoriesFromItems(filteredItems);

  const effectiveLegislation = reanalysisLegislation === 'custom' ? reanalysisCustomLeg : reanalysisLegislation;

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Aviso */}
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

      {/* Registro Fotográfico */}
      <Card className={cn("border-0 shadow-sm", photosRequired && photos.length === 0 && "border-2 border-destructive")}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Registro Fotográfico</Label>
              <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">Obrigatório</span>
            </div>
            <span className="text-xs text-muted-foreground">{photos.length}/50 foto(s)</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Até 50 fotos. Anexe as irregularidades como prova documental.
          </p>

          {photos.length > 0 && !analysisComplete && (
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

          {!analysisComplete && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCapturePhoto || onAddPhoto} className="flex-1 h-12">
                <Camera className="h-5 w-5 mr-2" />
                Capturar
              </Button>
              <Button variant="outline" size="sm" onClick={onAddPhoto} className="flex-1 h-12">
                <FolderOpen className="h-5 w-5 mr-2" />
                Galeria
              </Button>
            </div>
          )}

          {/* Botão principal: Identificar por IA */}
          {photos.length > 0 && !analysisComplete && (
            <Button
              className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-primary-foreground"
              onClick={() => setShowLegislationDialog(true)}
              disabled={aiAnalyzing}
            >
              {aiAnalyzing ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Analisando…</>
              ) : (
                <><Sparkles className="h-5 w-5 mr-2" /> Identificar Infrações por IA</>
              )}
            </Button>
          )}

          <LegislationSelectDialog
            open={showLegislationDialog}
            onOpenChange={setShowLegislationDialog}
            onConfirm={(leg, obs) => handleAIAnalysis(leg, obs)}
            isLoading={aiAnalyzing}
          />

          {photosRequired && photos.length === 0 && (
            <p className="text-xs text-destructive">⚠️ É obrigatório anexar pelo menos uma foto das irregularidades</p>
          )}
        </CardContent>
      </Card>

      {/* ── Resultado da análise: fotos com legendas editáveis ── */}
      {analysisComplete && photoLegends.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-primary">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold">Resultado da Análise — {photos.length} foto(s)</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setAnalysisComplete(false); setPhotoLegends([]); setSignedUrls([]); }} className="text-xs h-7">
                <X className="h-3 w-3 mr-1" /> Cancelar
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Edite as descrições e bases legais antes de adicionar como infrações. Fotos sem descrição serão ignoradas.
            </p>

            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3 pr-1">
                {photoLegends.map((legend) => (
                  <div key={legend.photoIndex} className="border rounded-xl overflow-hidden">
                    <div className="flex gap-3 p-3">
                      {/* Thumbnail */}
                      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                        <img
                          src={photos[legend.photoIndex]?.previewUrl}
                          alt={`Foto ${legend.photoIndex + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Fields */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground">#{legend.photoIndex + 1}</span>
                          {legend.legenda.trim() && (
                            <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Identificada</span>
                          )}
                        </div>
                        <Textarea
                          placeholder="Descreva a irregularidade encontrada nesta foto…"
                          value={legend.legenda}
                          onChange={e => updateLegend(legend.photoIndex, 'legenda', e.target.value)}
                          className="min-h-[52px] text-xs resize-none"
                          rows={2}
                        />
                        <div className="flex gap-1">
                          <Input
                            placeholder="Base legal (ex: RDC 216/2004 Item 4.1.3)"
                            value={legend.item_rdc}
                            onChange={e => updateLegend(legend.photoIndex, 'item_rdc', e.target.value)}
                            className="text-xs h-8 flex-1"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 flex-shrink-0"
                            title="Sugerir base legal pela IA"
                            onClick={() => handleReanalyzePhoto(legend.photoIndex)}
                            disabled={!legend.legenda.trim() || !legend.signedUrl || reanalyzingPhoto === legend.photoIndex}
                          >
                            {reanalyzingPhoto === legend.photoIndex ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Re-analysis panel */}
            <div className="border rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowReanalysisPanel(!showReanalysisPanel)}
                className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span>Analisar de novo com outra legislação ou observação</span>
                </div>
                {showReanalysisPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showReanalysisPanel && (
                <div className="p-3 border-t space-y-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Escolha a legislação específica e/ou adicione uma observação para direcionar a análise.
                  </p>

                  <div className="space-y-1">
                    <Label className="text-xs">Legislação base</Label>
                    <div className="flex flex-wrap gap-1">
                      {specificLegislations.map(leg => (
                        <button
                          key={leg.value}
                          type="button"
                          onClick={() => setReanalysisLegislation(leg.value)}
                          className={cn(
                            "text-xs px-2 py-1 rounded-lg border transition-colors",
                            reanalysisLegislation === leg.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted hover:bg-primary/10 border-border"
                          )}
                        >
                          {leg.label}
                        </button>
                      ))}
                    </div>
                    {reanalysisLegislation === 'custom' && (
                      <Input
                        placeholder="Digite a legislação (ex: RDC 50/2002)"
                        value={reanalysisCustomLeg}
                        onChange={e => setReanalysisCustomLeg(e.target.value)}
                        className="text-sm mt-1"
                      />
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Observação para a IA (opcional)</Label>
                    <Textarea
                      placeholder="Ex: Foque em temperatura de conservação, higiene dos manipuladores, validade dos produtos…"
                      value={reanalysisObservation}
                      onChange={e => setReanalysisObservation(e.target.value)}
                      className="text-sm min-h-[60px] resize-none"
                      rows={2}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleAIAnalysis(effectiveLegislation, reanalysisObservation)}
                    disabled={aiAnalyzing || (reanalysisLegislation === 'custom' && !reanalysisCustomLeg.trim())}
                  >
                    {aiAnalyzing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando…</>
                    ) : (
                      <><RefreshCw className="h-4 w-4 mr-2" /> Reanalisar com {effectiveLegislation || 'legislação selecionada'}</>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Apply legends button */}
            <Button
              className="w-full h-12"
              onClick={applyLegendsAsInfracoes}
              disabled={photoLegends.filter(l => l.legenda.trim()).length === 0}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              Adicionar {photoLegends.filter(l => l.legenda.trim()).length} infração(ões) à lista
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Importar do Checklist */}
      <Card className="border-0 shadow-sm border-primary/50">
        <CardContent className="p-4 space-y-3">
          <button type="button" onClick={() => setShowChecklist(!showChecklist)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium cursor-pointer">Importar do Checklist</Label>
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Recomendado</span>
            </div>
            {showChecklist ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>

          {showChecklist && (
            <div className="space-y-3 pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Selecione itens do checklist pré-definido com as legislações já associadas.
              </p>

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
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => { setSelectedChecklist(null); setSelectedItems(new Set()); setChecklistSearch(''); }} className="text-xs text-primary hover:underline">
                      ← Voltar aos checklists
                    </button>
                    <span className="text-xs text-muted-foreground">{selectedItems.size} selecionado(s)</span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar no checklist…" value={checklistSearch} onChange={e => setChecklistSearch(e.target.value)} className="pl-9 text-sm" />
                  </div>

                  <ScrollArea className="h-[300px] rounded-md border p-2">
                    {categories.map(category => {
                      const categoryItems = filteredItems.filter(item => item.category === category);
                      if (categoryItems.length === 0) return null;
                      return (
                        <div key={category} className="mb-4">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{category}</p>
                          <div className="space-y-2">
                            {categoryItems.map(item => (
                              <label key={item.id} className={cn("flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors", selectedItems.has(item.id) ? "bg-primary/10 border border-primary/30" : "hover:bg-muted/50")}>
                                <Checkbox checked={selectedItems.has(item.id)} onCheckedChange={() => toggleChecklistItem(item)} className="mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm">{item.text}</p>
                                  {item.legislation && <p className="text-xs text-primary/80 mt-1 font-medium">📜 {item.legislation}</p>}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </ScrollArea>

                  <Button onClick={addSelectedChecklistItems} disabled={selectedItems.size === 0} className="w-full">
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

          {value.infracoes.length > 0 && (
            <div className="space-y-2">
              {value.infracoes.map((infracao, idx) => (
                <div key={infracao.id} className="p-3 rounded-lg border bg-muted/30 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{idx + 1}. {infracao.descricao}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-medium">{infracao.dispositivo}</span>
                        {infracao.dispositivoCompleto && <span className="text-xs text-muted-foreground">- {infracao.dispositivoCompleto.name}</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => removeInfracao(infracao.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Adicionar manualmente */}
          <div className="space-y-3 p-3 rounded-lg border border-dashed">
            <p className="text-xs text-muted-foreground font-medium">Adicionar Infração Manualmente:</p>
            <div className="space-y-2">
              <Textarea placeholder="Descreva a infração encontrada…" value={novaInfracao} onChange={e => setNovaInfracao(e.target.value)} className="min-h-[60px] text-sm" />
              <div className="space-y-1">
                <Label className="text-xs">Dispositivo Legal Infringido</Label>
                <Input placeholder="Ex: RDC 216/2004, Art. 5º; LM 8741/08 Art. 81 Inc. XIX" value={novoDispositivo} onChange={e => setNovoDispositivo(e.target.value)} className="text-sm" />
                <div className="flex flex-wrap gap-1 mt-1">
                  {commonLegislations.map(leg => (
                    <button key={leg} type="button" className="text-xs bg-muted px-2 py-0.5 rounded hover:bg-primary/20 transition-colors" onClick={() => setNovoDispositivo(leg)}>
                      {leg.length > 30 ? leg.substring(0, 30) + '…' : leg}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" onClick={addInfracao} disabled={!novaInfracao.trim() || !novoDispositivo.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Infração
            </Button>
          </div>

          {value.infracoes.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              Nenhuma infração adicionada. Use o checklist ou adicione manualmente.
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
          <p className="text-xs text-muted-foreground">Conforme legislação vigente, o autuado tem direito a apresentar defesa.</p>
          <div className="flex items-center gap-3">
            <Input type="number" min="10" max="30" value={value.prazoDefesa} onChange={e => updateField('prazoDefesa', parseInt(e.target.value) || 15)} className="w-20 text-sm" />
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
              <Input id="autoDate" type="date" value={value.documentDate} onChange={e => updateField('documentDate', e.target.value)} className="text-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="autoTime" className="text-xs">Horário</Label>
              <Input id="autoTime" type="time" value={value.documentTime} onChange={e => updateField('documentTime', e.target.value)} className="text-sm" />
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

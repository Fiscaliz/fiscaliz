import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Ban, Camera, X, FolderOpen, Calendar, Clock, ClipboardList, ChevronDown, ChevronUp,
  Sparkles, Loader2, CheckCircle2, RefreshCw, MessageSquare, Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { checklistTemplates as defaultTemplates, type ChecklistTemplate } from '@/data/checklists';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LegislationSelectDialog, DEFAULT_LEGISLATION } from '@/components/documents/LegislationSelectDialog';

export interface InterdicaoData {
  tipoInterdicao: 'total' | 'parcial' | '';
  areasInterditadas: string;
  motivoInterdicao: string;
  fundamentacaoLegal: string;
  condicoesDesinterdicao: string;
  usarChecklistDesinterdicao: boolean;
  checklistDesinterdicaoId: string;
  osNumero: string;
  observacoes: string;
  documentDate: string;
  documentTime: string;
}

interface PhotoLegend {
  photoIndex: number;
  legenda: string;
  item_rdc: string;
  signedUrl?: string;
}

interface InterdicaoFormProps {
  value: InterdicaoData;
  onChange: (data: InterdicaoData) => void;
  photos: { id: string; previewUrl: string; file?: File }[];
  onAddPhoto: () => void;
  onCapturePhoto?: () => void;
  onRemovePhoto: (index: number) => void;
}

const motivosInterdicao = [
  'Risco iminente à saúde pública',
  'Condições higiênico-sanitárias precárias',
  'Funcionamento sem alvará sanitário',
  'Descumprimento de intimação anterior',
  'Surto alimentar relacionado ao estabelecimento',
  'Infestação de pragas',
  'Falta de água potável',
  'Estrutura física comprometida',
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

export function InterdicaoForm({
  value, onChange, photos, onAddPhoto, onCapturePhoto, onRemovePhoto,
}: InterdicaoFormProps) {
  const { toast } = useToast();
  const [showChecklistPicker, setShowChecklistPicker] = useState(false);

  // AI analysis state
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [photoLegends, setPhotoLegends] = useState<PhotoLegend[]>([]);
  const [signedUrls, setSignedUrls] = useState<string[]>([]);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [reanalyzingPhoto, setReanalyzingPhoto] = useState<number | null>(null);
  const [showLegislationDialog, setShowLegislationDialog] = useState(false);

  // Re-analysis panel
  const [showReanalysisPanel, setShowReanalysisPanel] = useState(false);
  const [reanalysisLegislation, setReanalysisLegislation] = useState(DEFAULT_LEGISLATION);
  const [reanalysisCustomLeg, setReanalysisCustomLeg] = useState('');
  const [reanalysisObservation, setReanalysisObservation] = useState('');

  const updateField = <K extends keyof InterdicaoData>(field: K, val: InterdicaoData[K]) => {
    onChange({ ...value, [field]: val });
  };

  // ── AI Photo Analysis ──────────────────────────────────────────────────

  const updateLegend = (photoIndex: number, field: 'legenda' | 'item_rdc', val: string) => {
    setPhotoLegends(prev => prev.map(l => l.photoIndex === photoIndex ? { ...l, [field]: val } : l));
  };

  const applyLegendsToForm = () => {
    const filled = photoLegends.filter(l => l.legenda.trim());
    if (filled.length === 0) {
      toast({ title: 'Nenhuma legenda preenchida', variant: 'destructive' });
      return;
    }
    // Build motivo and fundamentação from AI results
    const motivo = filled.map(l => l.legenda).join('; ');
    const legalBases = [...new Set(filled.map(l => l.item_rdc).filter(Boolean))].join('; ');
    
    onChange({
      ...value,
      motivoInterdicao: value.motivoInterdicao || motivo,
      fundamentacaoLegal: value.fundamentacaoLegal || legalBases,
      observacoes: value.observacoes
        ? value.observacoes + '\n\nIrregularidades identificadas por IA:\n' + filled.map((l, i) => `${i + 1}. ${l.legenda} (${l.item_rdc})`).join('\n')
        : 'Irregularidades identificadas por IA:\n' + filled.map((l, i) => `${i + 1}. ${l.legenda} (${l.item_rdc})`).join('\n'),
    });
    toast({ title: `${filled.length} irregularidade(s) aplicada(s)` });
    setAnalysisComplete(false);
    setPhotoLegends([]);
    setSignedUrls([]);
  };

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

      toast({ title: `Enviando ${photos.length} foto(s)…` });

      const uploadPromises = photos.map(async (photo) => {
        if (photo.file) {
          const fileExt = photo.file.name?.split('.').pop() || 'jpg';
          const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
          const { error: uploadError } = await supabase.storage
            .from('fiscal-photos')
            .upload(fileName, photo.file, { upsert: true });
          if (uploadError) throw uploadError;
          const { data: signedData } = await supabase.storage.from('fiscal-photos').createSignedUrl(fileName, 3600);
          return signedData?.signedUrl;
        } else if (photo.previewUrl && !photo.previewUrl.startsWith('blob:')) {
          return photo.previewUrl;
        }
        return null;
      });

      const uploadResults = await Promise.all(uploadPromises);
      const uploadedUrls = uploadResults.filter((url): url is string => Boolean(url));
      if (uploadedUrls.length === 0) throw new Error('Nenhuma foto pôde ser enviada');
      setSignedUrls(uploadedUrls);

      toast({ title: 'Analisando com IA…', description: `Legislação: ${targetLegislation}` });

      const body: Record<string, unknown> = {
        documentType: 'interdicao',
        photos: uploadedUrls,
        targetLegislation,
      };
      if (observation) body.observation = observation;

      const { data, error } = await supabase.functions.invoke('analyze-photos', { body });
      if (error) throw error;

      const nonConformities = (data as any)?.analysisResult?.nonConformities as Array<{
        foto: number; description: string; severity: string; legalBasis: string;
      }> | undefined;
      const legacyPhotoAnalysis = (data as any)?.photoAnalysis as Array<{ foto: number; legenda: string; item_rdc: string }> | undefined;

      let legends: PhotoLegend[];

      if (nonConformities && nonConformities.length > 0) {
        legends = photos.map((_, i) => {
          const photoNCs = nonConformities.filter(nc => nc.foto === i + 1);
          const legenda = photoNCs.map(nc => nc.description).join('; ') || '';
          const itemRdc = photoNCs.map(nc => (nc.legalBasis || '').replace('RDC 216/2004 - Item ', '')).filter(Boolean).join(', ');
          return { photoIndex: i, legenda, item_rdc: itemRdc || targetLegislation, signedUrl: uploadedUrls[i] };
        });
      } else if (legacyPhotoAnalysis && legacyPhotoAnalysis.length > 0) {
        legends = photos.map((_, i) => {
          const aiResult = legacyPhotoAnalysis.find(pa => pa.foto - 1 === i || pa.foto === i + 1);
          return { photoIndex: i, legenda: aiResult?.legenda || '', item_rdc: aiResult?.item_rdc || targetLegislation, signedUrl: uploadedUrls[i] };
        });
      } else {
        legends = photos.map((_, i) => ({ photoIndex: i, legenda: '', item_rdc: '', signedUrl: uploadedUrls[i] }));
      }

      setPhotoLegends(legends);
      setAnalysisComplete(true);
      setShowReanalysisPanel(false);

      const identified = legends.filter(l => l.legenda.trim()).length;
      toast({ title: 'Análise concluída ✓', description: `${identified}/${photos.length} foto(s) com irregularidades.` });
    } catch (error: any) {
      console.error('AI analysis error:', error);
      setPhotoLegends(photos.map((_, i) => ({ photoIndex: i, legenda: '', item_rdc: '', signedUrl: signedUrls[i] })));
      setAnalysisComplete(true);
      toast({ title: 'Análise falhou', description: 'Preencha manualmente.', variant: 'destructive' });
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
        body: { documentType: 'suggest_legal_basis', photos: [legend.signedUrl], description: legend.legenda },
      });
      if (error) throw error;
      if (data?.photoAnalysis?.[0]?.item_rdc) {
        updateLegend(photoIndex, 'item_rdc', data.photoAnalysis[0].item_rdc);
        toast({ title: 'Base legal sugerida', description: data.photoAnalysis[0].item_rdc });
      }
    } catch {
      toast({ title: 'Não foi possível sugerir', variant: 'destructive' });
    } finally {
      setReanalyzingPhoto(null);
    }
  };

  const effectiveLegislation = reanalysisLegislation === 'custom' ? reanalysisCustomLeg : reanalysisLegislation;

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm border-l-4 border-l-destructive">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Ban className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-destructive">Termo de Interdição</p>
              <p className="text-xs text-muted-foreground mt-1">
                Documento que determina a interdição total ou parcial do estabelecimento por risco sanitário.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tipo de Interdição */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Label className="text-sm font-medium">Tipo de Interdição</Label>
          <div className="grid grid-cols-2 gap-3">
            <div
              className={cn(
                'p-4 rounded-xl border-2 cursor-pointer transition-all text-center',
                value.tipoInterdicao === 'total' ? 'border-destructive bg-destructive/10' : 'border-muted hover:border-destructive/50'
              )}
              onClick={() => updateField('tipoInterdicao', 'total')}
            >
              <Ban className={cn('h-6 w-6 mx-auto mb-2', value.tipoInterdicao === 'total' ? 'text-destructive' : 'text-muted-foreground')} />
              <p className="font-semibold text-sm">Total</p>
              <p className="text-xs text-muted-foreground">Todo o estabelecimento</p>
            </div>
            <div
              className={cn(
                'p-4 rounded-xl border-2 cursor-pointer transition-all text-center',
                value.tipoInterdicao === 'parcial' ? 'border-warning bg-warning/10' : 'border-muted hover:border-warning/50'
              )}
              onClick={() => updateField('tipoInterdicao', 'parcial')}
            >
              <Ban className={cn('h-6 w-6 mx-auto mb-2', value.tipoInterdicao === 'parcial' ? 'text-warning' : 'text-muted-foreground')} />
              <p className="font-semibold text-sm">Parcial</p>
              <p className="text-xs text-muted-foreground">Áreas específicas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nº de O.S. (para interdição total) */}
      {value.tipoInterdicao === 'total' && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-2">
            <Label className="text-sm font-medium">Nº da O.S. (Ordem de Serviço)</Label>
            <Input placeholder="Número da Ordem de Serviço" value={value.osNumero} onChange={(e) => updateField('osNumero', e.target.value)} className="text-sm" />
          </CardContent>
        </Card>
      )}

      {/* Áreas Interditadas (se parcial) */}
      {value.tipoInterdicao === 'parcial' && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 space-y-2">
            <Label className="text-sm font-medium">Áreas Interditadas</Label>
            <Textarea placeholder="Descreva as áreas específicas que foram interditadas..." value={value.areasInterditadas} onChange={(e) => updateField('areasInterditadas', e.target.value)} className="min-h-[80px] text-sm" />
          </CardContent>
        </Card>
      )}

      {/* Motivo */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Label className="text-sm font-medium">Motivo da Interdição</Label>
          <div className="space-y-2">
            {motivosInterdicao.map((motivo) => (
              <label
                key={motivo}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all text-sm',
                  value.motivoInterdicao === motivo ? 'bg-destructive/10 border border-destructive/30' : 'hover:bg-muted/50'
                )}
              >
                <input type="radio" name="motivoInterdicao" checked={value.motivoInterdicao === motivo} onChange={() => updateField('motivoInterdicao', motivo)} className="accent-destructive" />
                <span>{motivo}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fundamentação e condições */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Fundamentação Legal</Label>
            <Input placeholder="Ex: LM 8741/08 Art. 81 Inc. XVI" value={value.fundamentacaoLegal} onChange={(e) => updateField('fundamentacaoLegal', e.target.value)} className="text-sm" />
          </div>

          {/* Condições para Desinterdição */}
          <div className="space-y-2">
            <Label className="text-xs">Condições para Desinterdição</Label>
            
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={value.usarChecklistDesinterdicao}
                  onCheckedChange={(checked) => {
                    updateField('usarChecklistDesinterdicao', checked as boolean);
                    if (!checked) updateField('checklistDesinterdicaoId', '');
                  }}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Usar Checklist como condição</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vincular um checklist sanitário como requisito para desinterdição
                  </p>
                </div>
              </label>
            </div>

            {value.usarChecklistDesinterdicao && (
              <div className="space-y-2 pl-2">
                <button type="button" onClick={() => setShowChecklistPicker(!showChecklistPicker)} className="w-full flex items-center justify-between p-3 rounded-lg border text-sm">
                  <span>{value.checklistDesinterdicaoId ? checklistTemplates.find(c => c.id === value.checklistDesinterdicaoId)?.name || 'Selecionar...' : 'Selecionar checklist...'}</span>
                  {showChecklistPicker ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {showChecklistPicker && (
                  <div className="space-y-1">
                    {checklistTemplates.map(template => (
                      <button
                        key={template.id} type="button"
                        onClick={() => { updateField('checklistDesinterdicaoId', template.id); setShowChecklistPicker(false); }}
                        className={cn('w-full text-left p-3 rounded-lg border text-sm transition-colors', value.checklistDesinterdicaoId === template.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50')}
                      >
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.items.length} itens</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!value.usarChecklistDesinterdicao && (
              <Textarea placeholder="Descreva as condições necessárias para a desinterdição..." value={value.condicoesDesinterdicao} onChange={(e) => updateField('condicoesDesinterdicao', e.target.value)} className="min-h-[80px] text-sm" />
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Observações</Label>
            <Textarea placeholder="Observações adicionais..." value={value.observacoes} onChange={(e) => updateField('observacoes', e.target.value)} className="min-h-[60px] text-sm" />
          </div>
        </CardContent>
      </Card>

      {/* Fotos + IA */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Registro Fotográfico</Label>
              <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">Obrigatório</span>
            </div>
            <span className="text-xs text-muted-foreground">{photos.length} foto(s)</span>
          </div>
          {photos.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {photos.map((photo, idx) => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={photo.previewUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => onRemovePhoto(idx)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCapturePhoto || onAddPhoto} className="flex-1 h-12"><Camera className="h-5 w-5 mr-2" /> Capturar</Button>
            <Button variant="outline" size="sm" onClick={onAddPhoto} className="flex-1 h-12"><FolderOpen className="h-5 w-5 mr-2" /> Galeria (múltiplas)</Button>
          </div>
          {photos.length === 0 && <p className="text-xs text-destructive">⚠️ Registro fotográfico obrigatório para interdição</p>}

          {/* Botão Identificar por IA */}
          {photos.length > 0 && !analysisComplete && (
            <Button
              className="w-full h-12 bg-gradient-to-r from-primary to-secondary text-primary-foreground"
              onClick={() => setShowLegislationDialog(true)}
              disabled={aiAnalyzing}
            >
              {aiAnalyzing ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Analisando…</>
              ) : (
                <><Sparkles className="h-5 w-5 mr-2" /> Identificar Irregularidades por IA</>
              )}
            </Button>
          )}

          <LegislationSelectDialog
            open={showLegislationDialog}
            onOpenChange={setShowLegislationDialog}
            onConfirm={(leg, obs) => handleAIAnalysis(leg, obs)}
            isLoading={aiAnalyzing}
          />
        </CardContent>
      </Card>

      {/* Resultado da análise IA */}
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
              Edite as descrições e bases legais. Ao confirmar, serão aplicadas ao motivo e fundamentação.
            </p>

            <ScrollArea className="max-h-[500px]">
              <div className="space-y-3 pr-1">
                {photoLegends.map((legend) => (
                  <div key={legend.photoIndex} className="border rounded-xl overflow-hidden">
                    <div className="flex gap-3 p-3">
                      <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                        <img src={photos[legend.photoIndex]?.previewUrl} alt={`Foto ${legend.photoIndex + 1}`} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-muted-foreground">#{legend.photoIndex + 1}</span>
                          {legend.legenda.trim() && <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Identificada</span>}
                        </div>
                        <Textarea
                          placeholder="Descreva a irregularidade nesta foto…"
                          value={legend.legenda}
                          onChange={e => updateLegend(legend.photoIndex, 'legenda', e.target.value)}
                          className="min-h-[52px] text-xs resize-none"
                          rows={2}
                        />
                        <div className="flex gap-1">
                          <Input placeholder="Base legal" value={legend.item_rdc} onChange={e => updateLegend(legend.photoIndex, 'item_rdc', e.target.value)} className="text-xs h-8 flex-1" />
                          <Button variant="outline" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => handleReanalyzePhoto(legend.photoIndex)} disabled={!legend.legenda.trim() || !legend.signedUrl || reanalyzingPhoto === legend.photoIndex}>
                            {reanalyzingPhoto === legend.photoIndex ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
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
              <button type="button" onClick={() => setShowReanalysisPanel(!showReanalysisPanel)} className="w-full flex items-center justify-between p-3 text-sm font-medium hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span>Analisar de novo com outra legislação</span>
                </div>
                {showReanalysisPanel ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showReanalysisPanel && (
                <div className="p-3 border-t space-y-3">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> Escolha a legislação e/ou observação para direcionar.
                  </p>
                  <div className="space-y-1">
                    <Label className="text-xs">Legislação base</Label>
                    <div className="flex flex-wrap gap-1">
                      {specificLegislations.map(leg => (
                        <button key={leg.value} type="button" onClick={() => setReanalysisLegislation(leg.value)}
                          className={cn("text-xs px-2 py-1 rounded-lg border transition-colors",
                            reanalysisLegislation === leg.value ? "bg-primary text-primary-foreground border-primary" : "bg-muted hover:bg-primary/10 border-border"
                          )}>
                          {leg.label}
                        </button>
                      ))}
                    </div>
                    {reanalysisLegislation === 'custom' && (
                      <Input placeholder="Digite a legislação" value={reanalysisCustomLeg} onChange={e => setReanalysisCustomLeg(e.target.value)} className="text-sm mt-1" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Observação para a IA (opcional)</Label>
                    <Textarea placeholder="Ex: Foque em condições estruturais…" value={reanalysisObservation} onChange={e => setReanalysisObservation(e.target.value)} className="text-sm min-h-[60px] resize-none" rows={2} />
                  </div>
                  <Button className="w-full" onClick={() => handleAIAnalysis(effectiveLegislation, reanalysisObservation)} disabled={aiAnalyzing || (reanalysisLegislation === 'custom' && !reanalysisCustomLeg.trim())}>
                    {aiAnalyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando…</> : <><RefreshCw className="h-4 w-4 mr-2" /> Reanalisar</>}
                  </Button>
                </div>
              )}
            </div>

            <Button className="w-full h-12" onClick={applyLegendsToForm} disabled={photoLegends.filter(l => l.legenda.trim()).length === 0}>
              <Edit3 className="h-4 w-4 mr-2" />
              Aplicar {photoLegends.filter(l => l.legenda.trim()).length} irregularidade(s) ao documento
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Data/Hora */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> Data</Label>
              <Input type="date" value={value.documentDate} onChange={(e) => updateField('documentDate', e.target.value)} className="text-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1"><Clock className="h-3 w-3" /> Horário</Label>
              <Input type="time" value={value.documentTime} onChange={(e) => updateField('documentTime', e.target.value)} className="text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function formatInterdicaoContent(data: InterdicaoData): string {
  const lines: string[] = ['TERMO DE INTERDIÇÃO', ''];
  lines.push(`Tipo: Interdição ${data.tipoInterdicao === 'total' ? 'TOTAL' : 'PARCIAL'}`);
  if (data.tipoInterdicao === 'total' && data.osNumero) lines.push(`O.S. nº: ${data.osNumero}`);
  if (data.tipoInterdicao === 'parcial' && data.areasInterditadas) lines.push(`Áreas: ${data.areasInterditadas}`);
  if (data.motivoInterdicao) lines.push(`Motivo: ${data.motivoInterdicao}`);
  if (data.fundamentacaoLegal) lines.push(`Fundamentação Legal: ${data.fundamentacaoLegal}`);
  if (data.usarChecklistDesinterdicao && data.checklistDesinterdicaoId) {
    const checklist = checklistTemplates.find(c => c.id === data.checklistDesinterdicaoId);
    lines.push(`Condições para Desinterdição: Atendimento integral ao ${checklist?.name || 'checklist'}`);
  } else if (data.condicoesDesinterdicao) {
    lines.push(`Condições para Desinterdição: ${data.condicoesDesinterdicao}`);
  }
  if (data.observacoes) lines.push(`Observações: ${data.observacoes}`);
  return lines.join('\n');
}

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, Plus, X, Camera, FolderOpen, Calendar, Clock, Hash, Trash2, Sparkles, Loader2,
  CheckCircle2, RefreshCw, ChevronDown, ChevronUp, MessageSquare, Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { LegislationSelectDialog, DEFAULT_LEGISLATION } from '@/components/documents/LegislationSelectDialog';

export interface ProdutoApreendido {
  id: string;
  produto: string;
  marca: string;
  lote: string;
  quantidade: string;
  unidade: string;
  pesoKg: string;
  naoConformidade: string;
  dispositivoLegal: string;
}

export interface ApreensaoData {
  produtos: ProdutoApreendido[];
  lacreNumeros: string[];
  destinacao: string;
  fielDepositario: boolean;
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

interface ApreensaoFormProps {
  value: ApreensaoData;
  onChange: (data: ApreensaoData) => void;
  photos: { id: string; previewUrl: string; file?: File }[];
  onAddPhoto: () => void;
  onCapturePhoto?: () => void;
  onRemovePhoto: (index: number) => void;
}

const naoConformidades = [
  'Produto sem registro/notificação sanitária',
  'Produto vencido',
  'Produto sem rotulagem adequada',
  'Produto em condições impróprias',
  'Produto de origem desconhecida/clandestina',
  'Produto sem nota fiscal',
  'Produto falsificado/adulterado',
  'Produto sem alvará sanitário',
];

const unidades = ['kg', 'g', 'L', 'mL', 'unidade(s)', 'caixa(s)'];

const specificLegislations = [
  { label: 'RDC 216/2004 – Alimentos', value: 'RDC 216/2004' },
  { label: 'Resolução 20 – DIVISA GO', value: 'Resolução 20 DIVISA' },
  { label: 'RDC 275/2002 – BPF Indústria', value: 'RDC 275/2002' },
  { label: 'Código Sanitário Municipal (Lei 8741/08)', value: 'Lei 8741/2008' },
  { label: 'RDC 44/2009 – Farmácias', value: 'RDC 44/2009' },
  { label: 'RDC 222/2018 – RSS', value: 'RDC 222/2018' },
  { label: 'Outra (digitar)…', value: 'custom' },
];

const createEmptyProduto = (): ProdutoApreendido => ({
  id: `apr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  produto: '',
  marca: '',
  lote: '',
  quantidade: '',
  unidade: 'kg',
  pesoKg: '',
  naoConformidade: '',
  dispositivoLegal: '',
});

export function ApreensaoForm({
  value, onChange, photos, onAddPhoto, onCapturePhoto, onRemovePhoto,
}: ApreensaoFormProps) {
  const { toast } = useToast();
  const [expandedProduto, setExpandedProduto] = useState<string | null>(
    value.produtos.length > 0 ? value.produtos[0].id : null
  );
  const [suggestingLegal, setSuggestingLegal] = useState<string | null>(null);

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

  const updateField = <K extends keyof ApreensaoData>(field: K, val: ApreensaoData[K]) => {
    onChange({ ...value, [field]: val });
  };

  const addProduto = () => {
    const novo = createEmptyProduto();
    updateField('produtos', [...value.produtos, novo]);
    setExpandedProduto(novo.id);
  };

  const removeProduto = (id: string) => {
    updateField('produtos', value.produtos.filter(p => p.id !== id));
    if (expandedProduto === id) setExpandedProduto(null);
  };

  const updateProduto = (id: string, field: keyof ProdutoApreendido, val: string) => {
    updateField('produtos', value.produtos.map(p =>
      p.id === id ? { ...p, [field]: val } : p
    ));
  };

  const handleSuggestLegal = async (produtoId: string, naoConformidade: string) => {
    if (!naoConformidade.trim()) return;
    setSuggestingLegal(produtoId);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-photos', {
        body: {
          documentType: 'suggest_legal_basis',
          photos: [],
          description: `Apreensão de produto - Não conformidade: ${naoConformidade}`,
        },
      });
      if (error) throw error;
      const suggested = data?.photoAnalysis?.[0]?.item_rdc;
      if (suggested) {
        updateProduto(produtoId, 'dispositivoLegal', suggested);
        toast({ title: 'Dispositivo sugerido', description: suggested });
      }
    } catch {
      toast({ title: 'Erro na sugestão', variant: 'destructive' });
    } finally {
      setSuggestingLegal(null);
    }
  };

  // ── AI Photo Analysis ──────────────────────────────────────────────────

  const updateLegend = (photoIndex: number, field: 'legenda' | 'item_rdc', val: string) => {
    setPhotoLegends(prev => prev.map(l => l.photoIndex === photoIndex ? { ...l, [field]: val } : l));
  };

  const applyLegendsAsProdutos = () => {
    const filled = photoLegends.filter(l => l.legenda.trim());
    if (filled.length === 0) {
      toast({ title: 'Nenhuma legenda preenchida', variant: 'destructive' });
      return;
    }
    const newProdutos: ProdutoApreendido[] = filled.map((l) => ({
      id: `apr_ai_${Date.now()}_${l.photoIndex}`,
      produto: l.legenda,
      marca: '',
      lote: '',
      quantidade: '',
      unidade: 'unidade(s)',
      pesoKg: '',
      naoConformidade: l.legenda,
      dispositivoLegal: l.item_rdc || '',
    }));
    onChange({ ...value, produtos: [...value.produtos, ...newProdutos] });
    toast({ title: `${newProdutos.length} produto(s) adicionado(s)` });
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
        documentType: 'apreensao',
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
  const totalProdutos = value.produtos.length;

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm border-l-4 border-l-warning">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Package className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-warning">Termo de Apreensão</p>
              <p className="text-xs text-muted-foreground mt-1">
                Registro de produtos apreendidos e lacrados.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {totalProdutos > 0 && (
        <Card className="border-0 shadow-sm bg-warning/5">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">Total Apreendido</span>
            </div>
            <span className="font-bold text-warning">{totalProdutos} produto(s)</span>
          </CardContent>
        </Card>
      )}

      {/* Lacres */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Hash className="h-4 w-4 text-warning" />
              Lacres
            </Label>
            <span className="text-xs text-muted-foreground">{value.lacreNumeros.length} lacre(s)</span>
          </div>
          {value.lacreNumeros.map((lacre, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <Input
                placeholder={`Nº do lacre ${idx + 1}`}
                value={lacre}
                onChange={(e) => {
                  const updated = [...value.lacreNumeros];
                  updated[idx] = e.target.value;
                  updateField('lacreNumeros', updated);
                }}
                className="text-sm border-warning/50 flex-1"
              />
              <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => updateField('lacreNumeros', value.lacreNumeros.filter((_, i) => i !== idx))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" className="w-full" onClick={() => updateField('lacreNumeros', [...value.lacreNumeros, ''])}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar Lacre
          </Button>
        </CardContent>
      </Card>

      {/* Fotos + IA */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Registro Fotográfico</Label>
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Opcional</span>
            </div>
            <span className="text-xs text-muted-foreground">{photos.length} foto(s)</span>
          </div>
          {photos.length > 0 && !analysisComplete && (
            <div className="grid grid-cols-4 gap-2">
              {photos.map((photo, idx) => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden">
                  <img src={photo.previewUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                  <button onClick={() => onRemovePhoto(idx)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
          {!analysisComplete && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onCapturePhoto || onAddPhoto} className="flex-1 h-12"><Camera className="h-5 w-5 mr-2" /> Capturar</Button>
              <Button variant="outline" size="sm" onClick={onAddPhoto} className="flex-1 h-12"><FolderOpen className="h-5 w-5 mr-2" /> Galeria</Button>
            </div>
          )}

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
                <><Sparkles className="h-5 w-5 mr-2" /> Identificar Produtos por IA</>
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
              Edite as descrições e bases legais. Ao confirmar, serão adicionados como produtos apreendidos.
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
                          placeholder="Descreva o produto/irregularidade nesta foto…"
                          value={legend.legenda}
                          onChange={e => updateLegend(legend.photoIndex, 'legenda', e.target.value)}
                          className="min-h-[52px] text-xs resize-none"
                          rows={2}
                        />
                        <div className="flex gap-1">
                          <Input
                            placeholder="Base legal"
                            value={legend.item_rdc}
                            onChange={e => updateLegend(legend.photoIndex, 'item_rdc', e.target.value)}
                            className="text-xs h-8 flex-1"
                          />
                          <Button
                            variant="outline" size="icon" className="h-8 w-8 flex-shrink-0"
                            onClick={() => handleReanalyzePhoto(legend.photoIndex)}
                            disabled={!legend.legenda.trim() || !legend.signedUrl || reanalyzingPhoto === legend.photoIndex}
                          >
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
                    <MessageSquare className="h-3 w-3" /> Escolha a legislação e/ou observação para direcionar a análise.
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
                    <Textarea placeholder="Ex: Foque em temperatura, validade…" value={reanalysisObservation} onChange={e => setReanalysisObservation(e.target.value)} className="text-sm min-h-[60px] resize-none" rows={2} />
                  </div>
                  <Button className="w-full" onClick={() => handleAIAnalysis(effectiveLegislation, reanalysisObservation)} disabled={aiAnalyzing || (reanalysisLegislation === 'custom' && !reanalysisCustomLeg.trim())}>
                    {aiAnalyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando…</> : <><RefreshCw className="h-4 w-4 mr-2" /> Reanalisar</>}
                  </Button>
                </div>
              )}
            </div>

            <Button className="w-full h-12" onClick={applyLegendsAsProdutos} disabled={photoLegends.filter(l => l.legenda.trim()).length === 0}>
              <Edit3 className="h-4 w-4 mr-2" />
              Adicionar {photoLegends.filter(l => l.legenda.trim()).length} produto(s) à lista
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista de Produtos */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Produtos Apreendidos</Label>
            <span className="text-xs text-muted-foreground">{totalProdutos} item(ns)</span>
          </div>

          {value.produtos.map((produto, idx) => (
            <Card key={produto.id} className={cn('border shadow-none', expandedProduto === produto.id ? 'border-warning/50' : '')}>
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <button type="button" className="flex items-center gap-2 text-sm font-medium" onClick={() => setExpandedProduto(expandedProduto === produto.id ? null : produto.id)}>
                    <Package className="h-4 w-4 text-warning" />
                    <span>Produto {idx + 1}</span>
                    {produto.produto && <span className="text-xs text-muted-foreground">- {produto.produto}</span>}
                  </button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeProduto(produto.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {expandedProduto === produto.id && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="space-y-1">
                      <Label className="text-xs">Produto *</Label>
                      <Input placeholder="Descrição do produto apreendido" value={produto.produto} onChange={(e) => updateProduto(produto.id, 'produto', e.target.value)} className="text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Marca</Label>
                        <Input placeholder="Marca" value={produto.marca} onChange={(e) => updateProduto(produto.id, 'marca', e.target.value)} className="text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Lote</Label>
                        <Input placeholder="Lote" value={produto.lote} onChange={(e) => updateProduto(produto.id, 'lote', e.target.value)} className="text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Quantidade</Label>
                        <Input type="number" placeholder="Qtd" value={produto.quantidade} onChange={(e) => updateProduto(produto.id, 'quantidade', e.target.value)} className="text-sm" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Unidade</Label>
                        <select value={produto.unidade} onChange={(e) => updateProduto(produto.id, 'unidade', e.target.value)} className="flex h-12 w-full rounded-xl border border-border/60 bg-background px-3 py-3 text-sm">
                          {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Peso (kg)</Label>
                        <Input type="number" step="0.1" placeholder="kg" value={produto.pesoKg} onChange={(e) => updateProduto(produto.id, 'pesoKg', e.target.value)} className="text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Não Conformidade Encontrada *</Label>
                      <select value={produto.naoConformidade} onChange={(e) => updateProduto(produto.id, 'naoConformidade', e.target.value)} className="flex h-12 w-full rounded-xl border border-border/60 bg-background px-3 py-3 text-sm">
                        <option value="">Selecione...</option>
                        {naoConformidades.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Dispositivo Legal</Label>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Ex: LM 8741/08 Art. 81 Inc. X" 
                          value={produto.dispositivoLegal} 
                          onChange={(e) => updateProduto(produto.id, 'dispositivoLegal', e.target.value)} 
                          className="text-sm flex-1" 
                        />
                        <Button variant="outline" size="sm" className="h-12 px-3" disabled={!produto.naoConformidade || suggestingLegal === produto.id} onClick={() => handleSuggestLegal(produto.id, produto.naoConformidade)}>
                          {suggestingLegal === produto.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">Selecione a não conformidade e clique ✨ para sugestão por IA</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" className="w-full" onClick={addProduto}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar Produto
          </Button>
        </CardContent>
      </Card>

      {/* Dados Gerais */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Label className="text-sm font-medium">Dados Gerais da Apreensão</Label>
          <div className="space-y-1">
            <Label className="text-xs">Destinação</Label>
            <Textarea 
              placeholder="Destinação dos produtos apreendidos..." 
              value={value.destinacao} 
              onChange={(e) => updateField('destinacao', e.target.value)} 
              className="min-h-[60px] text-sm" 
            />
          </div>

          <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
            <label className="flex items-start gap-3 cursor-pointer">
              <Checkbox
                checked={value.fielDepositario}
                onCheckedChange={(checked) => updateField('fielDepositario', checked as boolean)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <span className="font-medium text-sm">Fiel Depositário</span>
                <p className="text-xs text-muted-foreground mt-1">
                  O responsável pela empresa ficará como fiel depositário até o recolhimento.
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5 italic">
                  Desmarque se o fiscal levará a apreensão imediatamente (não aparecerá no PDF)
                </p>
              </div>
            </label>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Observações</Label>
            <Textarea placeholder="Observações adicionais..." value={value.observacoes} onChange={(e) => updateField('observacoes', e.target.value)} className="min-h-[60px] text-sm" />
          </div>
        </CardContent>
      </Card>

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

export function formatApreensaoContent(data: ApreensaoData): string {
  const lines: string[] = ['TERMO DE APREENSÃO', ''];
  
  const lacresPreenchidos = data.lacreNumeros.filter(l => l.trim());
  if (lacresPreenchidos.length > 0) lines.push(`Lacre(s) nº: ${lacresPreenchidos.join(', ')}`);
  lines.push(`Total de produtos apreendidos: ${data.produtos.length}`);
  lines.push('');

  data.produtos.forEach((p, idx) => {
    lines.push(`${idx + 1}. ${p.produto}${p.marca ? ` (${p.marca})` : ''}`);
    if (p.lote) lines.push(`   Lote: ${p.lote}`);
    if (p.quantidade) lines.push(`   Quantidade: ${p.quantidade} ${p.unidade}`);
    if (p.pesoKg) lines.push(`   Peso: ${p.pesoKg} kg`);
    if (p.naoConformidade) lines.push(`   Não Conformidade: ${p.naoConformidade}`);
    if (p.dispositivoLegal) lines.push(`   Dispositivo Legal: ${p.dispositivoLegal}`);
    lines.push('');
  });

  if (data.destinacao) lines.push(`Destinação: ${data.destinacao}`);
  if (data.fielDepositario) lines.push(`O responsável pela empresa ficará como fiel depositário até o recolhimento.`);
  if (data.observacoes) lines.push(`Observações: ${data.observacoes}`);
  return lines.join('\n');
}

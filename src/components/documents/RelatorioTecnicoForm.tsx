import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Sparkles, 
  Edit3, 
  Camera, 
  X, 
  ChevronDown, 
  ChevronUp,
  Users,
  Target,
  Scale,
  ClipboardList,
  Gavel,
  CheckCircle,
  Loader2,
  FolderOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { checklistTemplates, getAllCategories, type ChecklistItem } from '@/data/checklists';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type RelatorioTecnicoData = {
  // Método de criação
  method: 'manual' | 'ai' | null;
  
  // Dados do documento
  equipe: Array<{ nome: string; cargo: string; matricula: string }>;
  objetivos: string[];
  outroObjetivo: string;
  baseLegal: string[];
  outraBaseLegal: string;
  descricao: string;
  medidasLegais: string;
  conclusao: string;
  
  // Data e hora
  documentDate: string;
  documentTime: string;
  
  // Irregularidades detectadas (via IA ou checklist)
  irregularidades: Array<{
    id: string;
    descricao: string;
    dispositivo: string;
  }>;
  
  // Fotos com legendas editáveis (para análise IA)
  photoLegends: Array<{
    photoIndex: number;
    legenda: string;
    item_rdc: string;
    previewUrl?: string;
  }>;
  
  // Fotos para análise IA
  aiAnalysisResult: string;
  isAnalyzing: boolean;
};

type UploadedImage = {
  id: string;
  file: File;
  previewUrl: string;
};

interface RelatorioTecnicoFormProps {
  value: RelatorioTecnicoData;
  onChange: (data: RelatorioTecnicoData) => void;
  photos: UploadedImage[];
  onAddPhoto: () => void;
  onCapturePhoto?: () => void;
  onRemovePhoto: (index: number) => void;
  establishmentType?: string;
}

const objetivosOptions = [
  'Verificar condições estruturais e higiênico-sanitárias do estabelecimento',
  'Atendimento de Denúncia',
  'Verificar cumprimento de Termo de Intimação anterior',
  'Investigação de surto alimentar',
  'Operação conjunta com outros órgãos',
  'Acompanhamento de interdição',
  'Coleta de amostras para análise',
  'Verificar adequação pós Auto de Infração',
];

const baseLegalOptions = [
  'Lei Federal 6437/77',
  'RDC 216/04 ANVISA',
  'LM 8741/08 Art. 81 Inc. XIX',
  'LM 8741/08 Art. 81 Inc. IV c/c Art. 82',
  'LM 8741/08 Art. 81 Inc. X',
  'LM 8741/08 Art. 81 Inc. XI',
  'LM 8741/08 Art. 81 Inc. XVI',
  'Lei Municipal 8.217/2008',
  'Portaria SMS 64/2023',
  'Portaria MS 888/2021',
  'Lei 8078/90 - CDC',
];

export function RelatorioTecnicoForm({
  value,
  onChange,
  photos,
  onAddPhoto,
  onCapturePhoto,
  onRemovePhoto,
  establishmentType,
}: RelatorioTecnicoFormProps) {
  const { toast } = useToast();
  const [expandedSections, setExpandedSections] = useState<string[]>(['objetivos', 'base_legal', 'descricao', 'medidas', 'conclusao']);
  const [showChecklistImport, setShowChecklistImport] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section) 
        : [...prev, section]
    );
  };

  const updateField = <K extends keyof RelatorioTecnicoData>(field: K, fieldValue: RelatorioTecnicoData[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const toggleObjetivo = (objetivo: string) => {
    const current = value.objetivos;
    const updated = current.includes(objetivo)
      ? current.filter(o => o !== objetivo)
      : [...current, objetivo];
    updateField('objetivos', updated);
  };

  const toggleBaseLegal = (base: string) => {
    const current = value.baseLegal;
    const updated = current.includes(base)
      ? current.filter(b => b !== base)
      : [...current, base];
    updateField('baseLegal', updated);
  };

  const addEquipeMember = () => {
    updateField('equipe', [...value.equipe, { nome: '', cargo: '', matricula: '' }]);
  };

  const updateEquipeMember = (index: number, field: 'nome' | 'cargo' | 'matricula', val: string) => {
    const updated = [...value.equipe];
    updated[index] = { ...updated[index], [field]: val };
    updateField('equipe', updated);
  };

  const removeEquipeMember = (index: number) => {
    updateField('equipe', value.equipe.filter((_, i) => i !== index));
  };

  // Análise por IA - retorna legendas curtas para cada foto
  const handleAnalyzeWithAI = async () => {
    if (photos.length === 0) {
      toast({
        title: 'Adicione fotos',
        description: 'É necessário adicionar pelo menos 1 foto para análise por IA.',
        variant: 'destructive',
      });
      return;
    }

    updateField('isAnalyzing', true);

    try {
      // Get authenticated user for RLS-compliant file paths
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Notify user that upload is starting
      toast({
        title: `Enviando ${photos.length} foto${photos.length > 1 ? 's' : ''}...`,
        description: 'Aguarde o processamento.',
      });

      // Upload photos in PARALLEL for much faster processing
      const uploadPromises = photos.map(async (img) => {
        const fileExt = img.file.name.split('.').pop() || 'jpg';
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('fiscal-photos')
          .upload(fileName, img.file, { upsert: true });
        
        if (uploadError) {
          console.error('[AI Analysis] Upload error for file:', fileName, uploadError);
          throw uploadError;
        }

        const { data: signedData } = await supabase.storage.from('fiscal-photos').createSignedUrl(fileName, 3600);
        return signedData?.signedUrl;
      });

      // Wait for all uploads to complete in parallel
      const uploadResults = await Promise.all(uploadPromises);
      const uploadedUrls = uploadResults.filter((url): url is string => Boolean(url));

      if (uploadedUrls.length === 0) {
        throw new Error('Nenhuma foto foi enviada com sucesso');
      }

      // Notify that analysis is starting
      toast({
        title: 'Analisando fotos com IA...',
        description: `${uploadedUrls.length} foto${uploadedUrls.length > 1 ? 's enviadas' : ' enviada'}. Processamento pode levar até 1 minuto.`,
      });

      // Call AI analysis
      console.log('[AI Analysis] Calling edge function with', uploadedUrls.length, 'photos');
      const { data: aiData, error: aiError } = await supabase.functions.invoke('analyze-photos', {
        body: {
          documentType: 'relatorio_tecnico',
          photos: uploadedUrls,
          establishmentType: establishmentType || 'Estabelecimento de Alimentos',
        },
      });

      console.log('[AI Analysis] Response:', aiData, 'Error:', aiError);

      if (aiError) throw aiError;
      
      // Parse response - the edge function now returns analysisResult with new format
      const analysisResult = (aiData as any)?.analysisResult as {
        nonConformities: Array<{
          foto: number;
          description: string;
          severity: string;
          legalBasis: string;
          recommendation: string;
          deadline: string;
        }>;
        generalObservations?: string;
        confidence?: number;
      } | undefined;
      
      // Also check legacy photoAnalysis format for backward compatibility
      const legacyPhotoAnalysis = (aiData as any)?.photoAnalysis as Array<{ 
        foto: number; 
        legenda: string; 
        item_rdc: string;
      }> | undefined;
      
      // Get non-conformities from either format
      const nonConformities = analysisResult?.nonConformities || [];
      
      console.log('[AI Analysis] Received response:', { 
        analysisResult, 
        nonConformitiesCount: nonConformities.length 
      });
      
      if (nonConformities.length > 0) {
        // Group non-conformities by photo number for new format
        const legends = photos.map((photo, idx) => {
          const photoNumber = idx + 1;
          // Find all non-conformities for this photo
          const photoNCs = nonConformities.filter(nc => nc.foto === photoNumber);
          
          console.log(`[AI Analysis] Photo ${photoNumber}: found ${photoNCs.length} non-conformities`);
          
          // Combine descriptions if multiple
          const legenda = photoNCs.map(nc => nc.description).join('; ') || '';
          
          // Combine all RDC items if multiple
          const itemRdcList = photoNCs.map(nc => {
            const legalBasis = nc.legalBasis || '';
            return legalBasis.replace('RDC 216/2004 - Item ', '');
          }).filter(Boolean);
          const itemRdc = itemRdcList.join(', ');
          
          console.log(`[AI Analysis] Photo ${photoNumber}: legenda="${legenda}", item_rdc="${itemRdc}"`);
          
          return {
            photoIndex: idx,
            legenda,
            item_rdc: itemRdc,
            previewUrl: photo.previewUrl,
          };
        });
        
        console.log('[AI Analysis] Final legends to save:', JSON.stringify(legends, null, 2));
        
        updateField('photoLegends', legends);
        
        const photosWithLegends = legends.filter(l => l.legenda);
        
        console.log('[AI Analysis] Photos with legends:', photosWithLegends.length);
        
        toast({
          title: 'Análise concluída!',
          description: `${nonConformities.length} irregularidades em ${photosWithLegends.length} fotos. Edite as legendas conforme necessário.`,
        });
      } else if (legacyPhotoAnalysis && legacyPhotoAnalysis.length > 0) {
        // Fallback to legacy format
        const legends = photos.map((photo, idx) => {
          const analysis = legacyPhotoAnalysis.find(a => a.foto === idx + 1);
          return {
            photoIndex: idx,
            legenda: analysis?.legenda || '',
            item_rdc: analysis?.item_rdc || '',
            previewUrl: photo.previewUrl,
          };
        });
        
        updateField('photoLegends', legends);
        
        toast({
          title: 'Análise concluída!',
          description: `${legends.filter(l => l.legenda).length} irregularidades identificadas. Edite as legendas conforme necessário.`,
        });
      } else {
        // Fallback: create empty legends for editing
        const legends = photos.map((photo, idx) => ({
          photoIndex: idx,
          legenda: '',
          item_rdc: '',
          previewUrl: photo.previewUrl,
        }));
        updateField('photoLegends', legends);
        
        toast({
          title: 'Análise incompleta',
          description: 'Não foi possível identificar irregularidades. Preencha as legendas manualmente.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('AI analysis error:', error);
      toast({
        title: 'Erro na análise',
        description: error.message || 'Não foi possível analisar as fotos.',
        variant: 'destructive',
      });
    } finally {
      updateField('isAnalyzing', false);
    }
  };

  // Update a single photo legend
  const updatePhotoLegend = (index: number, field: 'legenda' | 'item_rdc', val: string) => {
    const updated = [...value.photoLegends];
    if (updated[index]) {
      updated[index] = { ...updated[index], [field]: val };
      updateField('photoLegends', updated);
    }
  };

  // Generate text from photo legends
  const generateTextFromLegends = () => {
    const legendsWithContent = value.photoLegends.filter(l => l.legenda.trim());
    if (legendsWithContent.length === 0) {
      toast({
        title: 'Nenhuma legenda',
        description: 'Preencha pelo menos uma legenda para gerar o texto.',
        variant: 'destructive',
      });
      return;
    }
    
    const text = legendsWithContent.map((l, idx) => 
      `${idx + 1}. ${l.legenda}${l.item_rdc ? ` (RDC 216/04 - item ${l.item_rdc})` : ''}`
    ).join('\n');
    
    updateField('descricao', text);
    
    // Also populate irregularidades for document generation
    const irregularidades = legendsWithContent.map((l, idx) => ({
      id: `irr_${idx}`,
      descricao: l.legenda,
      dispositivo: l.item_rdc ? `RDC 216/04 item ${l.item_rdc}` : '',
    }));
    updateField('irregularidades', irregularidades);
    
    toast({
      title: 'Texto gerado!',
      description: `${legendsWithContent.length} irregularidades incluídas no relatório.`,
    });
  };

  // Import from checklist
  const currentChecklist = checklistTemplates.find(c => c.id === selectedChecklist);
  const categories = currentChecklist ? getAllCategories(currentChecklist) : [];

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const importChecklistItem = (item: ChecklistItem) => {
    const exists = value.irregularidades.some(i => i.id === item.id);
    if (exists) {
      updateField('irregularidades', value.irregularidades.filter(i => i.id !== item.id));
    } else {
      updateField('irregularidades', [
        ...value.irregularidades,
        {
          id: item.id,
          descricao: item.text,
          dispositivo: item.legislation || 'RDC 216/04; LM 8741/08 Art. 81 Inc. XIX',
        },
      ]);
    }
  };

  // Render method selection if not chosen
  if (value.method === null) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Como deseja criar o Relatório Técnico?
        </p>
        
        <Card 
          className="border-0 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          onClick={() => updateField('method', 'manual')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-xl p-3 bg-primary/10">
                <Edit3 className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Preenchimento Manual</p>
                <p className="text-sm text-muted-foreground">
                  Preencha os campos do relatório técnico padrão
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="border-0 shadow-sm cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
          onClick={() => updateField('method', 'ai')}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-xl p-3 bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Análise por IA</p>
                <p className="text-sm text-muted-foreground">
                  Upload de fotos para detecção automática de irregularidades com dispositivos legais
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Method indicator */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {value.method === 'ai' ? (
              <Sparkles className="h-4 w-4 text-primary" />
            ) : (
              <Edit3 className="h-4 w-4 text-primary" />
            )}
            <span className="text-sm font-medium">
              {value.method === 'ai' ? 'Análise por IA' : 'Preenchimento Manual'}
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => updateField('method', null)}
            className="text-xs"
          >
            Alterar
          </Button>
        </CardContent>
      </Card>

      {/* AI Method - Photo Upload and Analysis */}
      {value.method === 'ai' && (
        <Card className="border-0 shadow-sm border-l-4 border-l-primary">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Fotos para Análise</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione fotos e clique em "Analisar" para legendas automáticas
                </p>
              </div>
            </div>

            {/* Photo grid with upload buttons */}
            {photos.length > 0 && value.photoLegends.length === 0 && (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((img, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                    <img src={img.previewUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => onRemovePhoto(idx)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                      {idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center">
              {photos.length}/50 fotos
            </p>

            {photos.length < 50 && value.photoLegends.length === 0 && (
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
            )}

            {value.photoLegends.length === 0 && (
              <Button 
                onClick={handleAnalyzeWithAI}
                disabled={photos.length === 0 || value.isAnalyzing}
                className="w-full"
              >
                {value.isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analisando fotos...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analisar com IA ({photos.length} fotos)
                  </>
                )}
              </Button>
            )}

            {/* Editable photo legends after analysis */}
            {value.photoLegends.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary">Legendas Editáveis</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => updateField('photoLegends', [])}
                    className="text-xs"
                  >
                    Reanalisar
                  </Button>
                </div>
                
                {value.photoLegends.map((legend, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                      <img 
                        src={legend.previewUrl || photos[idx]?.previewUrl} 
                        alt={`Foto ${idx + 1}`} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          Foto {idx + 1}
                        </span>
                        <Input
                          placeholder="Item RDC (ex: 4.1.3)"
                          value={legend.item_rdc}
                          onChange={(e) => updatePhotoLegend(idx, 'item_rdc', e.target.value)}
                          className="h-7 text-xs w-28 px-2"
                        />
                      </div>
                      <Input
                        placeholder="Legenda da irregularidade..."
                        value={legend.legenda}
                        onChange={(e) => updatePhotoLegend(idx, 'legenda', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>
                ))}
                
                <Button 
                  onClick={generateTextFromLegends}
                  className="w-full"
                  disabled={value.photoLegends.filter(l => l.legenda.trim()).length === 0}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Gerar Texto das Infrações ({value.photoLegends.filter(l => l.legenda.trim()).length})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data e Hora */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="relatorioDate" className="text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Data
              </Label>
              <Input
                id="relatorioDate"
                type="date"
                value={value.documentDate}
                onChange={(e) => updateField('documentDate', e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relatorioTime" className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Horário
              </Label>
              <Input
                id="relatorioTime"
                type="time"
                value={value.documentTime}
                onChange={(e) => updateField('documentTime', e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipe */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Equipe de Inspeção
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {value.equipe.map((membro, idx) => (
            <div key={idx} className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Membro {idx + 1}</span>
                {value.equipe.length > 1 && (
                  <button onClick={() => removeEquipeMember(idx)} className="text-destructive">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Input
                placeholder="Nome completo"
                value={membro.nome}
                onChange={(e) => updateEquipeMember(idx, 'nome', e.target.value)}
                className="text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Cargo"
                  value={membro.cargo}
                  onChange={(e) => updateEquipeMember(idx, 'cargo', e.target.value)}
                  className="text-sm"
                />
                <Input
                  placeholder="Matrícula"
                  value={membro.matricula}
                  onChange={(e) => updateEquipeMember(idx, 'matricula', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addEquipeMember} className="w-full">
            + Adicionar membro
          </Button>
        </CardContent>
      </Card>

      {/* Objetivos */}
      <Card className="border-0 shadow-sm">
        <button
          className="w-full flex items-center justify-between p-4"
          onClick={() => toggleSection('objetivos')}
        >
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Objetivos</span>
            {value.objetivos.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {value.objetivos.length}
              </span>
            )}
          </div>
          {expandedSections.includes('objetivos') ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.includes('objetivos') && (
          <CardContent className="p-4 pt-0 space-y-2">
            {objetivosOptions.map((objetivo) => (
              <label key={objetivo} className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
                <Checkbox
                  checked={value.objetivos.includes(objetivo)}
                  onCheckedChange={() => toggleObjetivo(objetivo)}
                  className="mt-0.5"
                />
                <span className="text-sm">{objetivo}</span>
              </label>
            ))}
            <div className="pt-2 border-t">
              <Label className="text-xs text-muted-foreground">Outro objetivo</Label>
              <Input
                placeholder="Especifique outro objetivo..."
                value={value.outroObjetivo}
                onChange={(e) => updateField('outroObjetivo', e.target.value)}
                className="text-sm mt-1"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Base Legal */}
      <Card className="border-0 shadow-sm">
        <button
          className="w-full flex items-center justify-between p-4"
          onClick={() => toggleSection('base_legal')}
        >
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Base Legal</span>
            {value.baseLegal.length > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {value.baseLegal.length}
              </span>
            )}
          </div>
          {expandedSections.includes('base_legal') ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.includes('base_legal') && (
          <CardContent className="p-4 pt-0 space-y-2">
            {baseLegalOptions.map((base) => (
              <label key={base} className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
                <Checkbox
                  checked={value.baseLegal.includes(base)}
                  onCheckedChange={() => toggleBaseLegal(base)}
                  className="mt-0.5"
                />
                <span className="text-sm">{base}</span>
              </label>
            ))}
            <div className="pt-2 border-t">
              <Label className="text-xs text-muted-foreground">Outra base legal</Label>
              <Input
                placeholder="Especifique outra base legal..."
                value={value.outraBaseLegal}
                onChange={(e) => updateField('outraBaseLegal', e.target.value)}
                className="text-sm mt-1"
              />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Descrição / Irregularidades */}
      <Card className="border-0 shadow-sm">
        <button
          className="w-full flex items-center justify-between p-4"
          onClick={() => toggleSection('descricao')}
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Descrição / Irregularidades</span>
          </div>
          {expandedSections.includes('descricao') ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.includes('descricao') && (
          <CardContent className="p-4 pt-0 space-y-3">
            {value.method === 'ai' && value.aiAnalysisResult && (
              <div className="bg-primary/5 p-3 rounded-lg border border-primary/20">
                <p className="text-xs text-primary font-medium mb-1 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Análise gerada por IA (edite conforme necessário)
                </p>
              </div>
            )}
            
            <div className="flex gap-2 mb-2">
              <Button
                variant={showChecklistImport ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowChecklistImport(!showChecklistImport)}
                className="text-xs"
              >
                <ClipboardList className="h-3 w-3 mr-1" />
                Importar do Checklist
              </Button>
            </div>

            {showChecklistImport && (
              <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                {!selectedChecklist ? (
                  <div className="grid grid-cols-2 gap-2">
                    {checklistTemplates.map((checklist) => (
                      <button
                        key={checklist.id}
                        onClick={() => {
                          setSelectedChecklist(checklist.id);
                          setExpandedCategories(getAllCategories(checklist));
                        }}
                        className="p-3 text-left rounded-lg border bg-background hover:bg-muted/50 transition-colors"
                      >
                        <p className="font-medium text-xs">{checklist.name}</p>
                        <p className="text-[10px] text-muted-foreground">{checklist.items.length} itens</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">{currentChecklist?.name}</span>
                      <button
                        onClick={() => setSelectedChecklist(null)}
                        className="text-xs text-primary"
                      >
                        Trocar
                      </button>
                    </div>
                    {categories.map((category) => (
                      <div key={category} className="border rounded overflow-hidden">
                        <button
                          className="w-full flex items-center justify-between p-2 bg-muted/50 text-left"
                          onClick={() => toggleCategory(category)}
                        >
                          <span className="text-xs font-medium">{category}</span>
                          {expandedCategories.includes(category) ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                        {expandedCategories.includes(category) && (
                          <div className="p-2 space-y-1">
                            {currentChecklist?.items
                              .filter(item => item.category === category)
                              .map((item) => {
                                const isSelected = value.irregularidades.some(i => i.id === item.id);
                                return (
                                  <label
                                    key={item.id}
                                    className={cn(
                                      'flex items-start gap-2 cursor-pointer p-2 rounded text-xs',
                                      isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                                    )}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => importChecklistItem(item)}
                                      className="mt-0.5"
                                    />
                                    <div>
                                      <p className="text-xs">{item.text}</p>
                                      {item.legislation && (
                                        <p className="text-[10px] text-muted-foreground">{item.legislation}</p>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Irregularidades importadas */}
            {value.irregularidades.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Irregularidades selecionadas ({value.irregularidades.length})
                </p>
                {value.irregularidades.map((irr, idx) => (
                  <div key={irr.id} className="flex items-start gap-2 p-2 bg-destructive/5 rounded-lg border border-destructive/20">
                    <span className="text-xs font-bold text-destructive">{idx + 1}.</span>
                    <div className="flex-1">
                      <p className="text-xs">{irr.descricao}</p>
                      <p className="text-[10px] text-muted-foreground">{irr.dispositivo}</p>
                    </div>
                    <button
                      onClick={() => updateField('irregularidades', value.irregularidades.filter(i => i.id !== irr.id))}
                      className="text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Textarea
              placeholder="Descreva a situação encontrada no estabelecimento, incluindo irregularidades observadas em cada área vistoriada..."
              value={value.descricao}
              onChange={(e) => updateField('descricao', e.target.value)}
              className="min-h-[150px] text-sm"
            />
          </CardContent>
        )}
      </Card>

      {/* Medidas Legais Adotadas */}
      <Card className="border-0 shadow-sm">
        <button
          className="w-full flex items-center justify-between p-4"
          onClick={() => toggleSection('medidas')}
        >
          <div className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Medidas Legais Adotadas</span>
          </div>
          {expandedSections.includes('medidas') ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.includes('medidas') && (
          <CardContent className="p-4 pt-0">
            <Textarea
              placeholder="Descreva as medidas legais adotadas, histórico de fiscalizações anteriores, termos lavrados, recusas de assinatura, etc..."
              value={value.medidasLegais}
              onChange={(e) => updateField('medidasLegais', e.target.value)}
              className="min-h-[120px] text-sm"
            />
          </CardContent>
        )}
      </Card>

      {/* Conclusão */}
      <Card className="border-0 shadow-sm">
        <button
          className="w-full flex items-center justify-between p-4"
          onClick={() => toggleSection('conclusao')}
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Conclusão Final</span>
          </div>
          {expandedSections.includes('conclusao') ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        {expandedSections.includes('conclusao') && (
          <CardContent className="p-4 pt-0">
            <Textarea
              placeholder="Conclusão e recomendações finais, como: solicitar interdição, acompanhamento de guarda municipal, prazo para adequação, etc..."
              value={value.conclusao}
              onChange={(e) => updateField('conclusao', e.target.value)}
              className="min-h-[120px] text-sm"
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export function formatRelatorioTecnicoContent(data: RelatorioTecnicoData): string {
  let content = '';

  // Objetivos
  if (data.objetivos.length > 0 || data.outroObjetivo) {
    content += '5- OBJETIVOS\n';
    data.objetivos.forEach(obj => {
      content += `• ${obj}\n`;
    });
    if (data.outroObjetivo) {
      content += `• ${data.outroObjetivo}\n`;
    }
    content += '\n';
  }

  // Base Legal
  if (data.baseLegal.length > 0 || data.outraBaseLegal) {
    content += '6- BASE LEGAL\n';
    data.baseLegal.forEach(base => {
      content += `• ${base}\n`;
    });
    if (data.outraBaseLegal) {
      content += `• ${data.outraBaseLegal}\n`;
    }
    content += '\n';
  }

  // Descrição
  if (data.descricao || data.irregularidades.length > 0) {
    content += '7- DESCRIÇÃO\n';
    
    if (data.irregularidades.length > 0) {
      data.irregularidades.forEach((irr, idx) => {
        content += `${idx + 1}. ${irr.descricao}\n`;
        content += `   Base Legal: ${irr.dispositivo}\n`;
      });
      content += '\n';
    }
    
    if (data.descricao) {
      content += data.descricao + '\n\n';
    }
  }

  // Medidas Legais
  if (data.medidasLegais) {
    content += '8- MEDIDAS LEGAIS ADOTADAS\n';
    content += data.medidasLegais + '\n\n';
  }

  // Conclusão
  if (data.conclusao) {
    content += '9- CONCLUSÃO FINAL\n';
    content += data.conclusao + '\n';
  }

  return content.trim();
}

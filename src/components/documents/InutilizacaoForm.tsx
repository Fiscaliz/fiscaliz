import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Trash2, Plus, X, Camera, FolderOpen, Calendar, Clock, Hash, Scale
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProdutoInutilizado {
  id: string;
  produto: string;
  marca: string;
  lote: string;
  quantidade: string;
  unidade: string;
  pesoKg: string;
  motivo: string;
}

export interface InutilizacaoData {
  produtos: ProdutoInutilizado[];
  metodoInutilizacao: string;
  localInutilizacao: string;
  testemunhas: string;
  justificativa: string;
  documentDate: string;
  documentTime: string;
}

interface InutilizacaoFormProps {
  value: InutilizacaoData;
  onChange: (data: InutilizacaoData) => void;
  photos: { id: string; previewUrl: string }[];
  onAddPhoto: () => void;
  onCapturePhoto?: () => void;
  onRemovePhoto: (index: number) => void;
}

const motivosInutilizacao = [
  'Produto vencido',
  'Produto sem rotulagem',
  'Produto em condições impróprias para consumo',
  'Produto sem registro/notificação',
  'Produto com temperatura inadequada',
  'Produto com embalagem violada/danificada',
  'Produto com características organolépticas alteradas',
  'Produto de origem desconhecida',
];

const metodosInutilizacao = [
  'Descarte em lixo orgânico com descaracterização',
  'Inutilização no próprio estabelecimento',
  'Encaminhamento para aterro sanitário',
  'Desnaturação com produto químico',
  'Incineração',
];

const unidades = ['kg', 'g', 'L', 'mL', 'unidade(s)'];

const createEmptyProduto = (): ProdutoInutilizado => ({
  id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  produto: '',
  marca: '',
  lote: '',
  quantidade: '',
  unidade: 'kg',
  pesoKg: '',
  motivo: '',
});

export function InutilizacaoForm({
  value,
  onChange,
  photos,
  onAddPhoto,
  onCapturePhoto,
  onRemovePhoto,
}: InutilizacaoFormProps) {
  const [expandedProduto, setExpandedProduto] = useState<string | null>(
    value.produtos.length > 0 ? value.produtos[0].id : null
  );

  const updateField = <K extends keyof InutilizacaoData>(field: K, val: InutilizacaoData[K]) => {
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

  const updateProduto = (id: string, field: keyof ProdutoInutilizado, val: string) => {
    updateField('produtos', value.produtos.map(p =>
      p.id === id ? { ...p, [field]: val } : p
    ));
  };

  const totalPesoKg = value.produtos.reduce((sum, p) => sum + (parseFloat(p.pesoKg) || 0), 0);

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm border-l-4 border-l-destructive">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-destructive">Termo de Inutilização</p>
              <p className="text-xs text-muted-foreground mt-1">
                Registro de produtos inutilizados durante ação fiscal. 
                Inclua todos os produtos descartados com suas respectivas quantidades.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total kg badge */}
      {totalPesoKg > 0 && (
        <Card className="border-0 shadow-sm bg-destructive/5">
          <CardContent className="p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">Total Inutilizado</span>
            </div>
            <span className="font-bold text-destructive">{totalPesoKg.toFixed(1)} kg</span>
          </CardContent>
        </Card>
      )}

      {/* Lista de Produtos */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Produtos Inutilizados</Label>
            <span className="text-xs text-muted-foreground">{value.produtos.length} produto(s)</span>
          </div>

          {value.produtos.map((produto, idx) => (
            <Card key={produto.id} className={cn('border shadow-none', expandedProduto === produto.id ? 'border-destructive/50' : '')}>
              <CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm font-medium"
                    onClick={() => setExpandedProduto(expandedProduto === produto.id ? null : produto.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span>Produto {idx + 1}</span>
                    {produto.produto && <span className="text-xs text-muted-foreground">- {produto.produto}</span>}
                    {produto.pesoKg && <span className="text-xs text-destructive font-semibold">({produto.pesoKg} kg)</span>}
                  </button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeProduto(produto.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {expandedProduto === produto.id && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="space-y-1">
                      <Label className="text-xs">Produto *</Label>
                      <Input placeholder="Descrição do produto" value={produto.produto} onChange={(e) => updateProduto(produto.id, 'produto', e.target.value)} className="text-sm" />
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
                        <Label className="text-xs font-semibold text-destructive">Peso (kg) *</Label>
                        <Input type="number" step="0.1" placeholder="kg" value={produto.pesoKg} onChange={(e) => updateProduto(produto.id, 'pesoKg', e.target.value)} className="text-sm border-destructive/50" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Motivo da Inutilização</Label>
                      <select value={produto.motivo} onChange={(e) => updateProduto(produto.id, 'motivo', e.target.value)} className="flex h-12 w-full rounded-xl border border-border/60 bg-background px-3 py-3 text-sm">
                        <option value="">Selecione...</option>
                        {motivosInutilizacao.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
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

      {/* Método e Local */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Método de Inutilização</Label>
            <select value={value.metodoInutilizacao} onChange={(e) => updateField('metodoInutilizacao', e.target.value)} className="flex h-12 w-full rounded-xl border border-border/60 bg-background px-3 py-3 text-sm">
              <option value="">Selecione...</option>
              {metodosInutilizacao.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Local da Inutilização</Label>
            <Input placeholder="Ex: No próprio estabelecimento" value={value.localInutilizacao} onChange={(e) => updateField('localInutilizacao', e.target.value)} className="text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Testemunhas</Label>
            <Input placeholder="Nome(s) das testemunhas presentes" value={value.testemunhas} onChange={(e) => updateField('testemunhas', e.target.value)} className="text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Justificativa Legal</Label>
            <Textarea placeholder="Fundamentação legal para a inutilização..." value={value.justificativa} onChange={(e) => updateField('justificativa', e.target.value)} className="min-h-[60px] text-sm" />
          </div>
        </CardContent>
      </Card>

      {/* Fotos */}
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
                  <button onClick={() => onRemovePhoto(idx)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCapturePhoto || onAddPhoto} className="flex-1 h-12">
              <Camera className="h-5 w-5 mr-2" /> Capturar
            </Button>
            <Button variant="outline" size="sm" onClick={onAddPhoto} className="flex-1 h-12">
              <FolderOpen className="h-5 w-5 mr-2" /> Galeria
            </Button>
          </div>
          {photos.length === 0 && (
            <p className="text-xs text-destructive">⚠️ Registro fotográfico obrigatório para inutilização</p>
          )}
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

export function formatInutilizacaoContent(data: InutilizacaoData): string {
  const lines: string[] = ['TERMO DE INUTILIZAÇÃO', ''];
  
  const totalKg = data.produtos.reduce((sum, p) => sum + (parseFloat(p.pesoKg) || 0), 0);
  lines.push(`Total de produtos inutilizados: ${data.produtos.length} | Peso total: ${totalKg.toFixed(1)} kg`);
  lines.push('');

  data.produtos.forEach((p, idx) => {
    lines.push(`${idx + 1}. ${p.produto}${p.marca ? ` (${p.marca})` : ''}`);
    if (p.lote) lines.push(`   Lote: ${p.lote}`);
    lines.push(`   Quantidade: ${p.quantidade} ${p.unidade} | Peso: ${p.pesoKg} kg`);
    if (p.motivo) lines.push(`   Motivo: ${p.motivo}`);
    lines.push('');
  });

  if (data.metodoInutilizacao) lines.push(`Método: ${data.metodoInutilizacao}`);
  if (data.localInutilizacao) lines.push(`Local: ${data.localInutilizacao}`);
  if (data.testemunhas) lines.push(`Testemunhas: ${data.testemunhas}`);
  if (data.justificativa) lines.push(`Justificativa: ${data.justificativa}`);

  return lines.join('\n');
}

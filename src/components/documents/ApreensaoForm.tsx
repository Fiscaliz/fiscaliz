import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Package, Plus, X, Camera, FolderOpen, Calendar, Clock, Hash, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ProdutoApreendido {
  id: string;
  produto: string;
  marca: string;
  lote: string;
  quantidade: string;
  unidade: string;
  pesoKg: string;
  lacre: string;
  motivo: string;
  localGuarda: string;
}

export interface ApreensaoData {
  produtos: ProdutoApreendido[];
  fundamentacaoLegal: string;
  localDeposito: string;
  prazoRetirada: string;
  responsavelGuarda: string;
  observacoes: string;
  documentDate: string;
  documentTime: string;
}

interface ApreensaoFormProps {
  value: ApreensaoData;
  onChange: (data: ApreensaoData) => void;
  photos: { id: string; previewUrl: string }[];
  onAddPhoto: () => void;
  onCapturePhoto?: () => void;
  onRemovePhoto: (index: number) => void;
}

const motivosApreensao = [
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

const createEmptyProduto = (): ProdutoApreendido => ({
  id: `apr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  produto: '',
  marca: '',
  lote: '',
  quantidade: '',
  unidade: 'kg',
  pesoKg: '',
  lacre: '',
  motivo: '',
  localGuarda: '',
});

export function ApreensaoForm({
  value, onChange, photos, onAddPhoto, onCapturePhoto, onRemovePhoto,
}: ApreensaoFormProps) {
  const [expandedProduto, setExpandedProduto] = useState<string | null>(
    value.produtos.length > 0 ? value.produtos[0].id : null
  );

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
                Registro de produtos apreendidos e lacrados. Inclua número do lacre para cada produto retido.
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
                    {produto.lacre && <span className="text-xs bg-warning/20 text-warning px-1.5 py-0.5 rounded">Lacre: {produto.lacre}</span>}
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
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs flex items-center gap-1 font-semibold text-warning"><Hash className="h-3 w-3" /> Nº do Lacre *</Label>
                        <Input placeholder="Número do lacre" value={produto.lacre} onChange={(e) => updateProduto(produto.id, 'lacre', e.target.value)} className="text-sm border-warning/50" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Local de Guarda</Label>
                        <Input placeholder="Onde ficará" value={produto.localGuarda} onChange={(e) => updateProduto(produto.id, 'localGuarda', e.target.value)} className="text-sm" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Motivo da Apreensão</Label>
                      <select value={produto.motivo} onChange={(e) => updateProduto(produto.id, 'motivo', e.target.value)} className="flex h-12 w-full rounded-xl border border-border/60 bg-background px-3 py-3 text-sm">
                        <option value="">Selecione...</option>
                        {motivosApreensao.map(m => <option key={m} value={m}>{m}</option>)}
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

      {/* Dados Gerais */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Label className="text-sm font-medium">Dados Gerais da Apreensão</Label>
          <div className="space-y-1">
            <Label className="text-xs">Fundamentação Legal</Label>
            <Input placeholder="Ex: LM 8741/08 Art. 81 Inc. X" value={value.fundamentacaoLegal} onChange={(e) => updateField('fundamentacaoLegal', e.target.value)} className="text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Local de Depósito</Label>
            <Input placeholder="Local onde os produtos ficarão sob guarda" value={value.localDeposito} onChange={(e) => updateField('localDeposito', e.target.value)} className="text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Prazo para Retirada (dias)</Label>
            <Input type="number" placeholder="Ex: 30" value={value.prazoRetirada} onChange={(e) => updateField('prazoRetirada', e.target.value)} className="text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Responsável pela Guarda</Label>
            <Input placeholder="Nome do responsável" value={value.responsavelGuarda} onChange={(e) => updateField('responsavelGuarda', e.target.value)} className="text-sm" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Observações</Label>
            <Textarea placeholder="Observações adicionais..." value={value.observacoes} onChange={(e) => updateField('observacoes', e.target.value)} className="min-h-[60px] text-sm" />
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
                  <button onClick={() => onRemovePhoto(idx)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onCapturePhoto || onAddPhoto} className="flex-1 h-12"><Camera className="h-5 w-5 mr-2" /> Capturar</Button>
            <Button variant="outline" size="sm" onClick={onAddPhoto} className="flex-1 h-12"><FolderOpen className="h-5 w-5 mr-2" /> Galeria</Button>
          </div>
          {photos.length === 0 && <p className="text-xs text-destructive">⚠️ Registro fotográfico obrigatório para apreensão</p>}
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
  
  lines.push(`Total de produtos apreendidos: ${data.produtos.length}`);
  lines.push('');

  data.produtos.forEach((p, idx) => {
    lines.push(`${idx + 1}. ${p.produto}${p.marca ? ` (${p.marca})` : ''}`);
    if (p.lote) lines.push(`   Lote: ${p.lote}`);
    if (p.quantidade) lines.push(`   Quantidade: ${p.quantidade} ${p.unidade}`);
    if (p.pesoKg) lines.push(`   Peso: ${p.pesoKg} kg`);
    if (p.lacre) lines.push(`   Lacre nº: ${p.lacre}`);
    if (p.motivo) lines.push(`   Motivo: ${p.motivo}`);
    if (p.localGuarda) lines.push(`   Local de guarda: ${p.localGuarda}`);
    lines.push('');
  });

  if (data.fundamentacaoLegal) lines.push(`Fundamentação Legal: ${data.fundamentacaoLegal}`);
  if (data.localDeposito) lines.push(`Local de Depósito: ${data.localDeposito}`);
  if (data.prazoRetirada) lines.push(`Prazo para Retirada: ${data.prazoRetirada} dias`);
  if (data.responsavelGuarda) lines.push(`Responsável pela Guarda: ${data.responsavelGuarda}`);
  if (data.observacoes) lines.push(`Observações: ${data.observacoes}`);

  return lines.join('\n');
}

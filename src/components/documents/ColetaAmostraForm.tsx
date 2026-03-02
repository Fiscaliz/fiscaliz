import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Beaker, 
  Plus, 
  Trash2, 
  Camera, 
  X, 
  FolderOpen,
  Calendar,
  Clock,
  FlaskConical,
  Tag,
  Hash,
  Thermometer,
  Building2,
  Package,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============= Tipos =============

export interface InvolucroItem {
  numero: string;
  lacreNumero: string;
  unidades: string;
  destino: 'LABORATÓRIO' | 'CONTRA PROVA' | '';
}

export interface ProdutoColetaData {
  id: string;
  nome: string;
  marca: string;
  natureza: string;
  apresentacao: string;
  dataFabricacao: string;
  dataValidade: string;
  lote: string;
  numeroRegistro: string;
  volumePeso: string;
  temperatura: string;
  fabricante: string;
  fabricanteCnpj: string;
  fabricanteEndereco: string;
  fabricanteQd: string;
  fabricanteLot: string;
  fabricanteNumero: string;
  fabricanteLocalidade: string;
  fabricanteMunicipio: string;
  fabricanteUf: string;
  fundamentacaoLegal: string;
  tipoAnalise: string;
  quantidadeInvolucros: string;
  involucros: InvolucroItem[];
  observacoes: string;
}

export interface ColetaAmostraData {
  categoriaProduto: string;
  produtos: ProdutoColetaData[];
  documentDate: string;
  documentTime: string;
  // Legacy fields for backward compat
  amostras: any[];
  laboratorio: string;
  motivoColeta: string;
  procedimentoColeta: string;
  condicaoArmazenamento: string;
  responsavelEntrega: string;
}

interface ColetaAmostraFormProps {
  value: ColetaAmostraData;
  onChange: (data: ColetaAmostraData) => void;
  photos: { id: string; previewUrl: string }[];
  onAddPhoto: () => void;
  onCapturePhoto?: () => void;
  onRemovePhoto: (index: number) => void;
}

// ============= Constantes =============

const categoriasProduto = [
  'ALIMENTO',
  'MEDICAMENTO',
  'CORRELATO',
  'QUÍMICO',
  'SANEANTE DOMISSANITÁRIO',
  'OUTROS',
];

const tiposAnalise = [
  'Análise de Orientação',
  'Análise Fiscal',
  'Análise de Controle',
  'Análise Prévia',
  'Análise de Contraprova',
];

export const createEmptyProduto = (): ProdutoColetaData => ({
  id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
  nome: '',
  marca: '',
  natureza: '',
  apresentacao: '',
  dataFabricacao: '',
  dataValidade: '',
  lote: '',
  numeroRegistro: '',
  volumePeso: '',
  temperatura: '',
  fabricante: '',
  fabricanteCnpj: '',
  fabricanteEndereco: '',
  fabricanteQd: '',
  fabricanteLot: '',
  fabricanteNumero: '',
  fabricanteLocalidade: '',
  fabricanteMunicipio: '',
  fabricanteUf: '',
  fundamentacaoLegal: '',
  tipoAnalise: '',
  quantidadeInvolucros: '1',
  involucros: [
    { numero: '01', lacreNumero: '', unidades: '', destino: 'LABORATÓRIO' },
    { numero: '02', lacreNumero: '', unidades: '', destino: '' },
    { numero: '03', lacreNumero: '', unidades: '', destino: 'CONTRA PROVA' },
  ],
  observacoes: '',
});

// ============= Componente =============

export function ColetaAmostraForm({
  value,
  onChange,
  photos,
  onAddPhoto,
  onCapturePhoto,
  onRemovePhoto,
}: ColetaAmostraFormProps) {
  const [expandedProduto, setExpandedProduto] = useState<string | null>(
    value.produtos?.length > 0 ? value.produtos[0].id : null
  );

  const updateField = <K extends keyof ColetaAmostraData>(field: K, fieldValue: ColetaAmostraData[K]) => {
    onChange({ ...value, [field]: fieldValue });
  };

  const addProduto = () => {
    const novo = createEmptyProduto();
    updateField('produtos', [...(value.produtos || []), novo]);
    setExpandedProduto(novo.id);
  };

  const removeProduto = (id: string) => {
    updateField('produtos', (value.produtos || []).filter(p => p.id !== id));
    if (expandedProduto === id) setExpandedProduto(null);
  };

  const updateProduto = (id: string, field: keyof ProdutoColetaData, val: any) => {
    updateField('produtos', (value.produtos || []).map(p =>
      p.id === id ? { ...p, [field]: val } : p
    ));
  };

  const updateInvolucro = (produtoId: string, idx: number, field: keyof InvolucroItem, val: string) => {
    const produto = (value.produtos || []).find(p => p.id === produtoId);
    if (!produto) return;
    const newInvolucros = [...produto.involucros];
    newInvolucros[idx] = { ...newInvolucros[idx], [field]: val };
    updateProduto(produtoId, 'involucros', newInvolucros);
  };

  const produtos = value.produtos || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-0 shadow-sm border-l-4 border-l-secondary">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Beaker className="h-5 w-5 text-secondary mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-secondary">Termo de Coleta para Análise</p>
              <p className="text-xs text-muted-foreground mt-1">
                Formulário oficial conforme modelo da Prefeitura de Goiânia - Coordenação de Fiscalização de Alimentos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categoria do Produto */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            <Label className="text-sm font-medium">Categoria do Produto</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            {categoriasProduto.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => updateField('categoriaProduto', cat)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  value.categoriaProduto === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted/50'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Produtos Coletados</Label>
            </div>
            <span className="text-xs text-muted-foreground">{produtos.length} produto(s)</span>
          </div>

          {produtos.map((produto, idx) => (
            <Card
              key={produto.id}
              className={cn(
                'border shadow-none transition-all',
                expandedProduto === produto.id ? 'border-primary/50' : 'border-border'
              )}
            >
              <CardContent className="p-3 space-y-3">
                {/* Header do Produto */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-sm font-medium"
                    onClick={() => setExpandedProduto(expandedProduto === produto.id ? null : produto.id)}
                  >
                    <Beaker className="h-4 w-4 text-secondary" />
                    <span>Produto {idx + 1}</span>
                    {produto.nome && (
                      <span className="text-xs text-muted-foreground">- {produto.nome}</span>
                    )}
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeProduto(produto.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {expandedProduto === produto.id && (
                  <div className="space-y-4 pt-2 border-t">
                    {/* 2- IDENTIFICAÇÃO DO PRODUTO */}
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">2- Identificação do Produto</p>
                    
                    <div className="space-y-1">
                      <Label className="text-xs">Nome do Produto *</Label>
                      <Input
                        placeholder="Ex: Espetinho de frango com bacon"
                        value={produto.nome}
                        onChange={(e) => updateProduto(produto.id, 'nome', e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Marca</Label>
                        <Input
                          placeholder="Marca"
                          value={produto.marca}
                          onChange={(e) => updateProduto(produto.id, 'marca', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Natureza</Label>
                        <Input
                          placeholder="Ex: Carne de frango"
                          value={produto.natureza}
                          onChange={(e) => updateProduto(produto.id, 'natureza', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Apresentação</Label>
                      <Input
                        placeholder="Ex: Assado, Congelado, In natura..."
                        value={produto.apresentacao}
                        onChange={(e) => updateProduto(produto.id, 'apresentacao', e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Data Fabricação</Label>
                        <Input
                          type="date"
                          value={produto.dataFabricacao}
                          onChange={(e) => updateProduto(produto.id, 'dataFabricacao', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Data Validade</Label>
                        <Input
                          type="date"
                          value={produto.dataValidade}
                          onChange={(e) => updateProduto(produto.id, 'dataValidade', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Lote</Label>
                        <Input
                          placeholder="Lote"
                          value={produto.lote}
                          onChange={(e) => updateProduto(produto.id, 'lote', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Nº Reg.</Label>
                        <Input
                          placeholder="Nº Registro"
                          value={produto.numeroRegistro}
                          onChange={(e) => updateProduto(produto.id, 'numeroRegistro', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Volume/Peso</Label>
                        <Input
                          placeholder="Ex: 152g"
                          value={produto.volumePeso}
                          onChange={(e) => updateProduto(produto.id, 'volumePeso', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        <Thermometer className="h-3 w-3" />
                        Temperatura (°C)
                      </Label>
                      <Input
                        placeholder="Ex: 68°C"
                        value={produto.temperatura}
                        onChange={(e) => updateProduto(produto.id, 'temperatura', e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    {/* Fabricante */}
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Fabricante</p>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Nome/Razão Social</Label>
                        <Input
                          placeholder="Fabricante"
                          value={produto.fabricante}
                          onChange={(e) => updateProduto(produto.id, 'fabricante', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">CNPJ</Label>
                        <Input
                          placeholder="CNPJ"
                          value={produto.fabricanteCnpj}
                          onChange={(e) => updateProduto(produto.id, 'fabricanteCnpj', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs">Endereço</Label>
                      <Input
                        placeholder="Endereço do fabricante"
                        value={produto.fabricanteEndereco}
                        onChange={(e) => updateProduto(produto.id, 'fabricanteEndereco', e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Qd</Label>
                        <Input
                          placeholder="Quadra"
                          value={produto.fabricanteQd || ''}
                          onChange={(e) => updateProduto(produto.id, 'fabricanteQd', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Lot.</Label>
                        <Input
                          placeholder="Lote"
                          value={produto.fabricanteLot || ''}
                          onChange={(e) => updateProduto(produto.id, 'fabricanteLot', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Nº</Label>
                        <Input
                          placeholder="Número"
                          value={produto.fabricanteNumero || ''}
                          onChange={(e) => updateProduto(produto.id, 'fabricanteNumero', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Localidade/Setor</Label>
                        <Input
                          value={produto.fabricanteLocalidade}
                          onChange={(e) => updateProduto(produto.id, 'fabricanteLocalidade', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Município</Label>
                        <Input
                          value={produto.fabricanteMunicipio}
                          onChange={(e) => updateProduto(produto.id, 'fabricanteMunicipio', e.target.value)}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">UF</Label>
                        <Input
                          maxLength={2}
                          value={produto.fabricanteUf}
                          onChange={(e) => updateProduto(produto.id, 'fabricanteUf', e.target.value.toUpperCase())}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    {/* Fundamentação Legal */}
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        Fundamentação Legal
                      </Label>
                      <Input
                        placeholder="Ex: Lei Federal 6437/77 - Surto 02/26 (Ficha anexa)"
                        value={produto.fundamentacaoLegal}
                        onChange={(e) => updateProduto(produto.id, 'fundamentacaoLegal', e.target.value)}
                        className="text-sm"
                      />
                    </div>

                    {/* Tipo de Análise */}
                    <div className="space-y-2">
                      <Label className="text-xs">Tipo de Análise</Label>
                      <div className="flex flex-wrap gap-2">
                        {tiposAnalise.map((tipo) => (
                          <button
                            key={tipo}
                            type="button"
                            onClick={() => updateProduto(produto.id, 'tipoAnalise', tipo)}
                            className={cn(
                              'px-2.5 py-1 rounded text-xs border transition-all',
                              produto.tipoAnalise === tipo
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background border-border hover:bg-muted/50'
                            )}
                          >
                            {tipo}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Invólucros */}
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Invólucros</p>

                    {produto.involucros.map((inv, invIdx) => (
                      <div key={invIdx} className="grid grid-cols-4 gap-2 items-end">
                        <div className="space-y-1">
                          <Label className="text-[10px]">Invólucro {inv.numero}</Label>
                          <div className="text-xs font-medium text-muted-foreground bg-muted/50 rounded px-2 py-2.5">
                            Nº {inv.numero}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] flex items-center gap-1">
                            <Hash className="h-2.5 w-2.5" />
                            Lacre Nº
                          </Label>
                          <Input
                            placeholder="Nº lacre"
                            value={inv.lacreNumero}
                            onChange={(e) => updateInvolucro(produto.id, invIdx, 'lacreNumero', e.target.value)}
                            className="text-sm h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Unidades</Label>
                          <Input
                            type="number"
                            placeholder="Qtd"
                            value={inv.unidades}
                            onChange={(e) => updateInvolucro(produto.id, invIdx, 'unidades', e.target.value)}
                            className="text-sm h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Destino</Label>
                          <select
                            value={inv.destino}
                            onChange={(e) => updateInvolucro(produto.id, invIdx, 'destino', e.target.value)}
                            className="flex h-9 w-full rounded-lg border border-border/60 bg-background px-2 text-[11px]"
                          >
                            <option value="">-</option>
                            <option value="LABORATÓRIO">Laboratório</option>
                            <option value="CONTRA PROVA">Contra Prova</option>
                          </select>
                        </div>
                      </div>
                    ))}

                    {/* Observações */}
                    <div className="space-y-1">
                      <Label className="text-xs">Observações</Label>
                      <Textarea
                        placeholder="Condições do produto, aparência, embalagem..."
                        value={produto.observacoes}
                        onChange={(e) => updateProduto(produto.id, 'observacoes', e.target.value)}
                        className="min-h-[60px] text-sm"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" className="w-full" onClick={addProduto}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
        </CardContent>
      </Card>

      {/* Registro Fotográfico */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Registro Fotográfico</Label>
              <span className="text-xs bg-secondary/20 text-secondary px-2 py-0.5 rounded">Recomendado</span>
            </div>
            <span className="text-xs text-muted-foreground">{photos.length} foto(s)</span>
          </div>

          <p className="text-xs text-muted-foreground">
            Fotografe os produtos coletados, rótulos, lacres e condições de armazenamento.
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
            <Button variant="outline" size="sm" onClick={onCapturePhoto || onAddPhoto} className="flex-1 h-12">
              <Camera className="h-5 w-5 mr-2" />
              Capturar
            </Button>
            <Button variant="outline" size="sm" onClick={onAddPhoto} className="flex-1 h-12">
              <FolderOpen className="h-5 w-5 mr-2" />
              Galeria
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data e Hora */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Data da Coleta
              </Label>
              <Input
                type="date"
                value={value.documentDate}
                onChange={(e) => updateField('documentDate', e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Horário
              </Label>
              <Input
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

// ============= Formatação para conteúdo =============

export function formatColetaAmostraContent(data: ColetaAmostraData): string {
  const lines: string[] = [];
  
  lines.push('TERMO DE COLETA PARA ANÁLISE');
  lines.push('');
  
  if (data.categoriaProduto) {
    lines.push(`Categoria: ${data.categoriaProduto}`);
  }
  lines.push('');

  (data.produtos || []).forEach((produto, idx) => {
    lines.push(`--- PRODUTO ${idx + 1} ---`);
    if (produto.nome) lines.push(`Nome: ${produto.nome}`);
    if (produto.marca) lines.push(`Marca: ${produto.marca}`);
    if (produto.natureza) lines.push(`Natureza: ${produto.natureza}`);
    if (produto.apresentacao) lines.push(`Apresentação: ${produto.apresentacao}`);
    if (produto.dataFabricacao) lines.push(`Fabricação: ${produto.dataFabricacao}`);
    if (produto.dataValidade) lines.push(`Validade: ${produto.dataValidade}`);
    if (produto.lote) lines.push(`Lote: ${produto.lote}`);
    if (produto.numeroRegistro) lines.push(`Nº Registro: ${produto.numeroRegistro}`);
    if (produto.volumePeso) lines.push(`Volume/Peso: ${produto.volumePeso}`);
    if (produto.temperatura) lines.push(`Temperatura: ${produto.temperatura}`);
    
    if (produto.fabricante) {
      lines.push(`Fabricante: ${produto.fabricante}`);
      if (produto.fabricanteCnpj) lines.push(`CNPJ Fabricante: ${produto.fabricanteCnpj}`);
      if (produto.fabricanteEndereco) lines.push(`Endereço: ${produto.fabricanteEndereco}`);
      const loc = [produto.fabricanteLocalidade, produto.fabricanteMunicipio, produto.fabricanteUf].filter(Boolean).join(', ');
      if (loc) lines.push(`Local: ${loc}`);
    }
    
    if (produto.fundamentacaoLegal) lines.push(`Fundamentação Legal: ${produto.fundamentacaoLegal}`);
    if (produto.tipoAnalise) lines.push(`Tipo de Análise: ${produto.tipoAnalise}`);
    
    produto.involucros.forEach(inv => {
      if (inv.lacreNumero || inv.unidades) {
        lines.push(`Invólucro ${inv.numero}: Lacre nº ${inv.lacreNumero || 'N/A'} | ${inv.unidades || '-'} unidade(s) | Destino: ${inv.destino || '-'}`);
      }
    });

    if (produto.observacoes) lines.push(`Observações: ${produto.observacoes}`);
    lines.push('');
  });

  return lines.join('\n');
}

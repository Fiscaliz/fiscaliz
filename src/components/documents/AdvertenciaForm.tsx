import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileWarning, Calendar, Clock, ClipboardList, ChevronDown, ChevronUp, Search, Plus, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { checklistTemplates as defaultTemplates, legislationDatabase, type ChecklistItem } from '@/data/checklists';

export interface AdvertenciaItem {
  id: string;
  descricao: string;
  dispositivo: string;
}

export interface AdvertenciaData {
  irregularidades: AdvertenciaItem[];
  prazo: string;
  fundamentacaoLegal: string;
  orientacoes: string;
  documentDate: string;
  documentTime: string;
}

interface AdvertenciaFormProps {
  value: AdvertenciaData;
  onChange: (data: AdvertenciaData) => void;
  checklists?: import('@/data/checklists').ChecklistTemplate[];
}

export function AdvertenciaForm({ value, onChange, checklists }: AdvertenciaFormProps) {
  const checklistTemplates = checklists || defaultTemplates;
  const [novaDesc, setNovaDesc] = useState('');
  const [novoDisp, setNovoDisp] = useState('');
  const [showChecklist, setShowChecklist] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [checklistSearch, setChecklistSearch] = useState('');

  const updateField = <K extends keyof AdvertenciaData>(field: K, val: AdvertenciaData[K]) => {
    onChange({ ...value, [field]: val });
  };

  const addIrregularidade = () => {
    if (!novaDesc.trim()) return;
    updateField('irregularidades', [...value.irregularidades, {
      id: `adv_${Date.now()}`,
      descricao: novaDesc.trim(),
      dispositivo: novoDisp.trim(),
    }]);
    setNovaDesc('');
    setNovoDisp('');
  };

  const removeIrregularidade = (id: string) => {
    updateField('irregularidades', value.irregularidades.filter(i => i.id !== id));
  };

  const addFromChecklist = () => {
    if (!selectedChecklist) return;
    const template = checklistTemplates.find(c => c.id === selectedChecklist);
    if (!template) return;

    const newItems: AdvertenciaItem[] = [];
    template.items.filter(item => selectedItems.has(item.id)).forEach(item => {
      if (!value.irregularidades.some(i => i.descricao === item.text)) {
        newItems.push({
          id: `adv_${Date.now()}_${item.id}`,
          descricao: item.text,
          dispositivo: item.legislation || '',
        });
      }
    });
    if (newItems.length > 0) updateField('irregularidades', [...value.irregularidades, ...newItems]);
    setSelectedItems(new Set());
    setShowChecklist(false);
    setSelectedChecklist(null);
  };

  const filteredItems = selectedChecklist
    ? (checklistTemplates.find(c => c.id === selectedChecklist)?.items || []).filter(item =>
        !checklistSearch.trim() || item.text.toLowerCase().includes(checklistSearch.toLowerCase())
      )
    : [];

  const categories = [...new Set(filteredItems.map(i => i.category))];

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-sm border-l-4 border-l-warning">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileWarning className="h-5 w-5 text-warning mt-0.5" />
            <div>
              <p className="font-semibold text-sm text-warning">Advertência</p>
              <p className="text-xs text-muted-foreground mt-1">
                Penalidade administrativa sem multa, com prazo para adequação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Importar do Checklist */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <button type="button" onClick={() => setShowChecklist(!showChecklist)} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium cursor-pointer">Importar do Checklist</Label>
            </div>
            {showChecklist ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showChecklist && (
            <div className="space-y-3 pt-2 border-t">
              {!selectedChecklist ? (
                <div className="grid grid-cols-2 gap-2">
                  {checklistTemplates.map(t => (
                    <button key={t.id} type="button" onClick={() => setSelectedChecklist(t.id)} className="p-3 text-left rounded-lg border hover:border-primary transition-colors">
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.items.length} itens</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <button type="button" onClick={() => { setSelectedChecklist(null); setSelectedItems(new Set()); }} className="text-xs text-primary hover:underline">← Voltar</button>
                    <span className="text-xs text-muted-foreground">{selectedItems.size} selecionado(s)</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Buscar..." value={checklistSearch} onChange={(e) => setChecklistSearch(e.target.value)} className="pl-9 text-sm" />
                  </div>
                  <ScrollArea className="h-[250px] rounded-md border p-2">
                    {categories.map(cat => (
                      <div key={cat} className="mb-3">
                        <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{cat}</p>
                        {filteredItems.filter(i => i.category === cat).map(item => (
                          <label key={item.id} className={cn('flex items-start gap-2 p-2 rounded cursor-pointer text-sm', selectedItems.has(item.id) ? 'bg-primary/10' : 'hover:bg-muted/50')}>
                            <Checkbox checked={selectedItems.has(item.id)} onCheckedChange={() => {
                              const s = new Set(selectedItems);
                              s.has(item.id) ? s.delete(item.id) : s.add(item.id);
                              setSelectedItems(s);
                            }} className="mt-0.5" />
                            <div>
                              <span>{item.text}</span>
                              {item.legislation && <p className="text-xs text-primary/80 mt-0.5">📜 {item.legislation}</p>}
                            </div>
                          </label>
                        ))}
                      </div>
                    ))}
                  </ScrollArea>
                  <Button onClick={addFromChecklist} disabled={selectedItems.size === 0} className="w-full">
                    <Plus className="h-4 w-4 mr-2" /> Adicionar {selectedItems.size} item(ns)
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Irregularidades */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <Label className="text-sm font-medium">Irregularidades</Label>
          {value.irregularidades.map((item, idx) => (
            <div key={item.id} className="p-3 rounded-lg border bg-muted/30 space-y-1">
              <div className="flex justify-between">
                <p className="text-sm">{idx + 1}. {item.descricao}</p>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeIrregularidade(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {item.dispositivo && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">{item.dispositivo}</span>}
            </div>
          ))}
          <div className="space-y-2 p-3 rounded-lg border border-dashed">
            <Textarea placeholder="Descreva a irregularidade..." value={novaDesc} onChange={(e) => setNovaDesc(e.target.value)} className="min-h-[50px] text-sm" />
            <Input placeholder="Dispositivo legal" value={novoDisp} onChange={(e) => setNovoDisp(e.target.value)} className="text-sm" />
            <Button variant="outline" size="sm" onClick={addIrregularidade} disabled={!novaDesc.trim()} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prazo e Orientações */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Prazo para Adequação (dias)</Label>
              <Input type="number" min="1" max="45" placeholder="Ex: 30" value={value.prazo} onChange={(e) => updateField('prazo', e.target.value)} className="text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fundamentação Legal</Label>
              <Input placeholder="Ex: LM 8741/08" value={value.fundamentacaoLegal} onChange={(e) => updateField('fundamentacaoLegal', e.target.value)} className="text-sm" />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Orientações ao Contribuinte</Label>
            <Textarea placeholder="Orientações para regularização..." value={value.orientacoes} onChange={(e) => updateField('orientacoes', e.target.value)} className="min-h-[60px] text-sm" />
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

export function formatAdvertenciaContent(data: AdvertenciaData): string {
  const lines: string[] = ['ADVERTÊNCIA', ''];
  data.irregularidades.forEach((item, idx) => {
    lines.push(`${idx + 1}. ${item.descricao}`);
    if (item.dispositivo) lines.push(`   Dispositivo: ${item.dispositivo}`);
  });
  lines.push('');
  if (data.prazo) lines.push(`Prazo para adequação: ${data.prazo} dias`);
  if (data.fundamentacaoLegal) lines.push(`Fundamentação Legal: ${data.fundamentacaoLegal}`);
  if (data.orientacoes) lines.push(`Orientações: ${data.orientacoes}`);
  return lines.join('\n');
}

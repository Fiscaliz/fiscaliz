import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, Trash2, Edit3, ClipboardList, Search, ChevronDown, ChevronUp, 
  GripVertical, Save, X, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Json } from '@/integrations/supabase/types';

interface ChecklistItemData {
  id: string;
  text: string;
  category: string;
  legislation?: string;
}

interface ChecklistRecord {
  id: string;
  name: string;
  establishment_type: string;
  items: ChecklistItemData[];
  legislation_references: string[];
  is_active: boolean;
  user_id: string | null;
  created_at: string;
}

export default function Checklists() {
  const { user } = useAuth();
  const [checklists, setChecklists] = useState<ChecklistRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('');
  const [formItems, setFormItems] = useState<ChecklistItemData[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemLegislation, setNewItemLegislation] = useState('');
  const [expandedChecklist, setExpandedChecklist] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchChecklists();
  }, [user]);

  const fetchChecklists = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('checklists')
      .select('*')
      .or(`user_id.eq.${user!.id},user_id.is.null`)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Erro ao carregar checklists');
    } else {
      setChecklists((data || []).map(d => ({
        ...d,
        items: (d.items as unknown as ChecklistItemData[]) || [],
        legislation_references: (d.legislation_references as unknown as string[]) || [],
      })));
    }
    setLoading(false);
  };

  const openNew = () => {
    setEditingId(null);
    setFormName('');
    setFormType('');
    setFormItems([]);
    setDialogOpen(true);
  };

  const openEdit = (c: ChecklistRecord) => {
    setEditingId(c.id);
    setFormName(c.name);
    setFormType(c.establishment_type);
    setFormItems([...c.items]);
    setDialogOpen(true);
  };

  const duplicateChecklist = (c: ChecklistRecord) => {
    setEditingId(null);
    setFormName(`${c.name} (Cópia)`);
    setFormType(c.establishment_type);
    setFormItems(c.items.map(item => ({ ...item, id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` })));
    setDialogOpen(true);
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    setFormItems(prev => [...prev, {
      id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      text: newItemText.trim(),
      category: newItemCategory.trim() || 'Geral',
      legislation: newItemLegislation.trim() || undefined,
    }]);
    setNewItemText('');
    setNewItemLegislation('');
  };

  const removeItem = (id: string) => {
    setFormItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSave = async () => {
    if (!formName.trim() || !formType.trim()) {
      toast.error('Preencha nome e tipo do checklist');
      return;
    }
    if (formItems.length === 0) {
      toast.error('Adicione pelo menos um item');
      return;
    }

    const payload = {
      name: formName.trim(),
      establishment_type: formType.trim(),
      items: formItems as unknown as Json,
      legislation_references: [] as unknown as Json,
      user_id: user!.id,
      is_active: true,
    };

    if (editingId) {
      const { error } = await supabase
        .from('checklists')
        .update(payload)
        .eq('id', editingId);
      if (error) {
        toast.error('Erro ao atualizar checklist');
        return;
      }
      toast.success('Checklist atualizado!');
    } else {
      const { error } = await supabase
        .from('checklists')
        .insert(payload);
      if (error) {
        toast.error('Erro ao criar checklist');
        return;
      }
      toast.success('Checklist criado!');
    }

    setDialogOpen(false);
    fetchChecklists();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('checklists').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir checklist');
      return;
    }
    toast.success('Checklist excluído');
    fetchChecklists();
  };

  const filtered = checklists.filter(c =>
    !search.trim() || 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.establishment_type.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(formItems.map(i => i.category))];

  return (
    <AppLayout>
      <Header title="Meus Checklists" showBack />

      <div className="p-4 space-y-4 pb-24">
        {/* Search + Add */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar checklist..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="pl-9" 
            />
          </div>
          <Button onClick={openNew} size="icon" className="shrink-0">
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Carregando...</div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum checklist encontrado</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={openNew}>
                <Plus className="h-4 w-4 mr-1" /> Criar Checklist
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => {
              const isOwn = c.user_id === user?.id;
              const isExpanded = expandedChecklist === c.id;
              return (
                <Card key={c.id} className={cn('transition-all', !isOwn && 'border-primary/20 bg-primary/5')}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <button 
                        type="button" 
                        className="flex-1 text-left" 
                        onClick={() => setExpandedChecklist(isExpanded ? null : c.id)}
                      >
                        <div className="flex items-center gap-2">
                          <ClipboardList className="h-4 w-4 text-primary shrink-0" />
                          <span className="font-medium text-sm">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-[10px]">{c.establishment_type}</Badge>
                          <span className="text-xs text-muted-foreground">{c.items.length} itens</span>
                          {!isOwn && <Badge variant="outline" className="text-[10px]">Sistema</Badge>}
                        </div>
                      </button>
                      <div className="flex gap-1">
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t space-y-2">
                        {[...new Set(c.items.map(i => i.category))].map(cat => (
                          <div key={cat}>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">{cat}</p>
                            {c.items.filter(i => i.category === cat).map(item => (
                              <div key={item.id} className="flex items-start gap-2 py-1 text-xs">
                                <span className="text-muted-foreground">•</span>
                                <div>
                                  <span>{item.text}</span>
                                  {item.legislation && (
                                    <span className="ml-1 text-primary/70">({item.legislation})</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                        <div className="flex gap-2 pt-2">
                          {isOwn && (
                            <>
                              <Button variant="outline" size="sm" onClick={() => openEdit(c)}>
                                <Edit3 className="h-3 w-3 mr-1" /> Editar
                              </Button>
                              <Button variant="outline" size="sm" className="text-destructive" onClick={() => handleDelete(c.id)}>
                                <Trash2 className="h-3 w-3 mr-1" /> Excluir
                              </Button>
                            </>
                          )}
                          <Button variant="outline" size="sm" onClick={() => duplicateChecklist(c)}>
                            <Copy className="h-3 w-3 mr-1" /> Duplicar
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Editar Checklist' : 'Novo Checklist'}</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 pb-4">
              <div className="space-y-2">
                <Label className="text-xs">Nome do Checklist *</Label>
                <Input 
                  placeholder="Ex: Roteiro de Restaurantes" 
                  value={formName} 
                  onChange={e => setFormName(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Tipo de Estabelecimento *</Label>
                <Input 
                  placeholder="Ex: Restaurante, Supermercado, etc." 
                  value={formType} 
                  onChange={e => setFormType(e.target.value)} 
                />
              </div>

              {/* Items */}
              <div className="space-y-2">
                <Label className="text-xs">Itens do Checklist ({formItems.length})</Label>
                
                {categories.map(cat => (
                  <div key={cat} className="space-y-1">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase">{cat}</p>
                    {formItems.filter(i => i.category === cat).map(item => (
                      <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 text-xs">
                        <GripVertical className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <span>{item.text}</span>
                          {item.legislation && (
                            <span className="ml-1 text-primary/70">({item.legislation})</span>
                          )}
                        </div>
                        <button type="button" onClick={() => removeItem(item.id)} className="text-destructive hover:text-destructive/80">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Add item */}
                <div className="space-y-2 p-3 rounded-lg border border-dashed">
                  <Textarea 
                    placeholder="Texto do item..." 
                    value={newItemText} 
                    onChange={e => setNewItemText(e.target.value)} 
                    className="min-h-[40px] text-sm" 
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input 
                      placeholder="Categoria" 
                      value={newItemCategory} 
                      onChange={e => setNewItemCategory(e.target.value)} 
                      className="text-sm" 
                    />
                    <Input 
                      placeholder="Legislação (opcional)" 
                      value={newItemLegislation} 
                      onChange={e => setNewItemLegislation(e.target.value)} 
                      className="text-sm" 
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={addItem} disabled={!newItemText.trim()} className="w-full">
                    <Plus className="h-4 w-4 mr-1" /> Adicionar Item
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-1" /> {editingId ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

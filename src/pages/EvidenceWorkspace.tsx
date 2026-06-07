import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Upload, Grid3x3, ListOrdered, ChevronLeft, ImagePlus, Pencil, Trash2,
  FolderPlus, Sparkles, MessageSquare, AlertTriangle, Flag, FileText, Tag
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EvidenceAnnotator, type Annotation } from '@/components/evidences/EvidenceAnnotator';

interface Evidence {
  id: string; project_id: string; user_id: string;
  category_id: string | null; storage_path: string; file_name: string | null;
  position: number; captured_at: string | null;
  caption: string | null; observation: string | null;
  finding: string | null; risk_level: string | null;
  annotations: Annotation[]; ai_status: string;
  created_at: string;
}

interface Category { id: string; project_id: string; name: string; color: string; position: number; }
interface Project { id: string; name: string; client: string | null; area: string; status: string; }

const SIDE_TABS = [
  { id: 'evidences', label: 'Evidências', icon: ImagePlus },
  { id: 'observations', label: 'Observações', icon: MessageSquare },
  { id: 'findings', label: 'Achados', icon: Flag },
  { id: 'risks', label: 'Riscos', icon: AlertTriangle },
  { id: 'captions', label: 'Legendas', icon: Tag },
] as const;

export default function EvidenceWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | 'all'>('all');
  const [view, setView] = useState<'grid' | 'timeline'>('grid');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState<Evidence | null>(null);
  const [editingUrl, setEditingUrl] = useState<string>('');
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user && projectId) load(); }, [user, projectId]); // eslint-disable-line

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: cats }, { data: evs }] = await Promise.all([
      supabase.from('projects').select('id,name,client,area,status').eq('id', projectId!).maybeSingle(),
      supabase.from('evidence_categories').select('*').eq('project_id', projectId!).order('position'),
      supabase.from('evidences').select('*').eq('project_id', projectId!).order('position'),
    ]);
    setProject(p as any);
    setCategories((cats as any) || []);
    setEvidences(((evs as any) || []) as Evidence[]);
    await refreshUrls(((evs as any) || []) as Evidence[]);
    setLoading(false);
  };

  const refreshUrls = async (list: Evidence[]) => {
    if (list.length === 0) { setPreviewUrls({}); return; }
    const paths = list.map(e => e.storage_path);
    const { data } = await supabase.storage.from('evidences').createSignedUrls(paths, 3600);
    const map: Record<string, string> = {};
    (data || []).forEach((d, i) => { if (d.signedUrl) map[list[i].id] = d.signedUrl; });
    setPreviewUrls(map);
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (!user || !projectId) return;
    const arr = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!arr.length) return;
    setUploading(true);
    try {
      const startPos = evidences.length;
      const inserts: any[] = [];
      for (let i = 0; i < arr.length; i++) {
        const f = arr[i];
        const ext = f.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${user.id}/${projectId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('evidences')
          .upload(path, f, { contentType: f.type, upsert: false });
        if (upErr) { toast.error(`Falha ao enviar ${f.name}`); continue; }
        inserts.push({
          project_id: projectId, user_id: user.id,
          category_id: activeCategory === 'all' ? null : activeCategory,
          storage_path: path, file_name: f.name, mime_type: f.type,
          position: startPos + i,
          captured_at: new Date(f.lastModified).toISOString(),
        });
      }
      if (inserts.length) {
        const { error } = await supabase.from('evidences').insert(inserts);
        if (error) toast.error(error.message);
        else toast.success(`${inserts.length} evidência(s) adicionada(s)`);
      }
      await load();
    } finally {
      setUploading(false);
    }
  };

  const onDropZone = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const startReorder = (id: string) => setDraggingId(id);
  const onDropCard = async (targetId: string) => {
    if (!draggingId || draggingId === targetId) { setDraggingId(null); return; }
    const list = [...filtered];
    const from = list.findIndex(e => e.id === draggingId);
    const to = list.findIndex(e => e.id === targetId);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setEvidences(prev => {
      const others = prev.filter(e => !list.find(l => l.id === e.id));
      return [...others, ...list.map((e, i) => ({ ...e, position: i }))]
        .sort((a, b) => a.position - b.position);
    });
    setDraggingId(null);
    await Promise.all(list.map((e, i) =>
      supabase.from('evidences').update({ position: i }).eq('id', e.id)
    ));
  };

  const openEditor = async (ev: Evidence) => {
    const url = previewUrls[ev.id] ||
      (await supabase.storage.from('evidences').createSignedUrl(ev.storage_path, 3600)).data?.signedUrl || '';
    setEditingUrl(url);
    setEditing(ev);
  };

  const saveEditor = async (data: any) => {
    if (!editing) return;
    const { error } = await supabase.from('evidences').update({
      annotations: data.annotations, caption: data.caption,
      observation: data.observation, finding: data.finding,
      risk_level: data.risk_level || null,
    }).eq('id', editing.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Evidência salva');
    await load();
  };

  const removeEvidence = async (ev: Evidence) => {
    if (!confirm('Excluir esta evidência?')) return;
    await supabase.storage.from('evidences').remove([ev.storage_path]);
    await supabase.from('evidences').delete().eq('id', ev.id);
    toast.success('Excluída');
    await load();
  };

  const createCategory = async () => {
    if (!user || !projectId || !newCatName.trim()) return;
    const { error } = await supabase.from('evidence_categories').insert({
      project_id: projectId, user_id: user.id, name: newCatName.trim(),
      position: categories.length,
    });
    if (error) toast.error(error.message);
    else { setNewCatName(''); setNewCatOpen(false); await load(); }
  };

  const filtered = useMemo(() => {
    let list = [...evidences];
    if (activeCategory !== 'all') list = list.filter(e => e.category_id === activeCategory);
    if (view === 'timeline') {
      list.sort((a, b) => new Date(a.captured_at || a.created_at).getTime()
        - new Date(b.captured_at || b.created_at).getTime());
    } else {
      list.sort((a, b) => a.position - b.position);
    }
    return list;
  }, [evidences, activeCategory, view]);

  const counts = {
    evidences: evidences.length,
    observations: evidences.filter(e => e.observation).length,
    findings: evidences.filter(e => e.finding).length,
    risks: evidences.filter(e => e.risk_level).length,
    captions: evidences.filter(e => e.caption).length,
  };

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground truncate">Workspace de Evidências</p>
            <h1 className="text-base font-semibold truncate">
              {project?.name || 'Projeto'} {project?.client && <span className="text-muted-foreground font-normal">· {project.client}</span>}
            </h1>
          </div>
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 mr-1" /> {uploading ? 'Enviando…' : 'Enviar'}
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        </div>

        {/* Category bar */}
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto">
          <Button size="sm" variant={activeCategory === 'all' ? 'default' : 'outline'}
            onClick={() => setActiveCategory('all')}>
            Todas <Badge variant="secondary" className="ml-2">{evidences.length}</Badge>
          </Button>
          {categories.map(c => (
            <Button key={c.id} size="sm"
              variant={activeCategory === c.id ? 'default' : 'outline'}
              onClick={() => setActiveCategory(c.id)}
              style={activeCategory === c.id ? { background: c.color, borderColor: c.color } : {}}>
              {c.name}
              <Badge variant="secondary" className="ml-2">
                {evidences.filter(e => e.category_id === c.id).length}
              </Badge>
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={() => setNewCatOpen(true)}>
            <FolderPlus className="h-4 w-4 mr-1" /> Categoria
          </Button>
          <div className="flex-1" />
          <div className="inline-flex rounded-md border bg-muted/30">
            <Button size="sm" variant={view === 'grid' ? 'default' : 'ghost'}
              onClick={() => setView('grid')}>
              <Grid3x3 className="h-4 w-4 mr-1" /> Grade
            </Button>
            <Button size="sm" variant={view === 'timeline' ? 'default' : 'ghost'}
              onClick={() => setView('timeline')}>
              <ListOrdered className="h-4 w-4 mr-1" /> Timeline
            </Button>
          </div>
        </div>
      </header>

      {/* Main + side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4 p-4">
        {/* Canvas / drop zone */}
        <section
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDropZone}
          className="min-h-[60vh]"
        >
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : filtered.length === 0 ? (
            <div className="border-2 border-dashed rounded-2xl py-20 text-center">
              <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Arraste imagens aqui ou clique em Enviar</p>
              <p className="text-sm text-muted-foreground">Upload múltiplo, JPG/PNG/HEIC</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filtered.map((ev, idx) => (
                <Card key={ev.id}
                  draggable
                  onDragStart={() => startReorder(ev.id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => onDropCard(ev.id)}
                  className={cn('overflow-hidden group cursor-move transition',
                    draggingId === ev.id && 'opacity-50')}>
                  <div className="relative aspect-[4/3] bg-muted">
                    {previewUrls[ev.id] && (
                      <img src={previewUrls[ev.id]} alt={ev.file_name || ''}
                        className="absolute inset-0 w-full h-full object-cover" />
                    )}
                    <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                      {idx + 1}
                    </div>
                    {ev.annotations?.length > 0 && (
                      <Badge className="absolute top-1.5 right-1.5" variant="secondary">
                        <Pencil className="h-3 w-3 mr-1" />{ev.annotations.length}
                      </Badge>
                    )}
                    {ev.risk_level && (
                      <Badge className="absolute bottom-1.5 left-1.5 capitalize" variant="destructive">
                        {ev.risk_level}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-2 space-y-1">
                    <p className="text-xs line-clamp-2 min-h-[2rem]">
                      {ev.caption || <span className="text-muted-foreground italic">Sem legenda</span>}
                    </p>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" className="flex-1 h-7 text-xs"
                        onClick={() => openEditor(ev)}>
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
                        onClick={() => removeEvidence(ev)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="relative pl-8">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {filtered.map((ev, idx) => (
                  <div key={ev.id} className="relative">
                    <div className="absolute -left-[1.35rem] top-3 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                    <Card>
                      <div className="flex gap-3 p-3">
                        <button onClick={() => openEditor(ev)}
                          className="w-32 h-24 bg-muted rounded-md overflow-hidden shrink-0 relative">
                          {previewUrls[ev.id] && (
                            <img src={previewUrls[ev.id]} alt=""
                              className="w-full h-full object-cover" />
                          )}
                          <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                            {idx + 1}
                          </span>
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground">
                            {new Date(ev.captured_at || ev.created_at).toLocaleString('pt-BR')}
                          </p>
                          <p className="text-sm font-medium">{ev.caption || 'Sem legenda'}</p>
                          {ev.finding && <p className="text-xs mt-1 line-clamp-2"><strong>Achado:</strong> {ev.finding}</p>}
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {ev.risk_level && <Badge variant="destructive" className="capitalize">{ev.risk_level}</Badge>}
                            {ev.annotations?.length > 0 && <Badge variant="secondary">{ev.annotations.length} anotações</Badge>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button size="sm" variant="outline" onClick={() => openEditor(ev)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => removeEvidence(ev)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Side panel */}
        <aside className="lg:sticky lg:top-32 self-start">
          <Card>
            <Tabs defaultValue="evidences">
              <TabsList className="w-full justify-start rounded-none rounded-t-lg border-b h-9 px-1 overflow-x-auto">
                {SIDE_TABS.map(t => (
                  <TabsTrigger key={t.id} value={t.id} className="text-xs">
                    <t.icon className="h-3.5 w-3.5 mr-1" />{t.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="evidences" className="p-3 space-y-2">
                <Stat label="Total" value={counts.evidences} />
                <Stat label="Com anotações" value={evidences.filter(e => e.annotations?.length).length} />
                <Stat label="Sem categoria" value={evidences.filter(e => !e.category_id).length} />
                <div className="pt-2 border-t mt-2">
                  <Button size="sm" variant="outline" className="w-full" disabled>
                    <Sparkles className="h-4 w-4 mr-1" /> Analisar com IA (em breve)
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-1 text-center">
                    Arquitetura pronta — provedor a definir
                  </p>
                </div>
              </TabsContent>

              <ListTab tab="observations" items={evidences.filter(e => e.observation)}
                pick={e => e.observation!} onOpen={openEditor} />
              <ListTab tab="findings" items={evidences.filter(e => e.finding)}
                pick={e => e.finding!} onOpen={openEditor} />
              <ListTab tab="risks" items={evidences.filter(e => e.risk_level)}
                pick={e => `[${e.risk_level}] ${e.caption || e.finding || ''}`} onOpen={openEditor} />
              <ListTab tab="captions" items={evidences.filter(e => e.caption)}
                pick={e => e.caption!} onOpen={openEditor} />
            </Tabs>
          </Card>
        </aside>
      </div>

      {/* Annotator */}
      {editing && (
        <EvidenceAnnotator
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          imageUrl={editingUrl}
          initial={{
            annotations: editing.annotations || [],
            caption: editing.caption || '',
            observation: editing.observation || '',
            finding: editing.finding || '',
            risk_level: editing.risk_level || '',
          }}
          onSave={saveEditor}
        />
      )}

      {/* New category */}
      <Dialog open={newCatOpen} onOpenChange={setNewCatOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Nova categoria</DialogTitle></DialogHeader>
          <Input value={newCatName} onChange={e => setNewCatName(e.target.value)}
            placeholder="Ex.: Fachada, Cozinha, Estrutura" />
          <Button onClick={createCategory} disabled={!newCatName.trim()}>Criar</Button>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Badge variant="secondary">{value}</Badge>
    </div>
  );
}

function ListTab({ tab, items, pick, onOpen }: {
  tab: string; items: Evidence[]; pick: (e: Evidence) => string;
  onOpen: (e: Evidence) => void;
}) {
  return (
    <TabsContent value={tab} className="p-2 max-h-[60vh] overflow-y-auto">
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground p-3 text-center">Nada por aqui ainda.</p>
      ) : items.map((e, i) => (
        <button key={e.id} onClick={() => onOpen(e)}
          className="w-full text-left p-2 rounded-md hover:bg-muted/60 flex gap-2">
          <span className="text-xs font-bold text-primary shrink-0 w-5">{i + 1}.</span>
          <span className="text-xs line-clamp-3">{pick(e)}</span>
        </button>
      ))}
    </TabsContent>
  );
}

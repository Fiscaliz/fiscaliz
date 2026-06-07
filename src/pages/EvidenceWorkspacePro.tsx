import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ChevronLeft, Upload, Search, FolderPlus, ImagePlus, Pencil, Trash2,
  Sparkles, Wand2, FileText, GitCompare, Layers, Tag, ZoomIn, ZoomOut,
  Send, Loader2, AlertTriangle, CheckCircle2, MinusCircle, Plus, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EvidenceAnnotator, type Annotation } from "@/components/evidences/EvidenceAnnotator";

interface Evidence {
  id: string; project_id: string; user_id: string;
  category_id: string | null; storage_path: string; file_name: string | null;
  position: number; captured_at: string | null;
  caption: string | null; observation: string | null;
  finding: string | null; risk_level: string | null;
  annotations: Annotation[]; ai_analysis: any; ai_status: string;
  created_at: string;
}
interface Category { id: string; project_id: string; name: string; color: string; position: number; }
interface Project { id: string; name: string; client: string | null; area: string; }

type Classification = "conforme" | "observacao" | "nao_conforme" | "critico";
const CLASS_OPTS: { id: Classification; label: string; color: string; icon: any }[] = [
  { id: "conforme", label: "Conforme", color: "bg-emerald-500/15 text-emerald-700 border-emerald-300", icon: CheckCircle2 },
  { id: "observacao", label: "Observação", color: "bg-amber-500/15 text-amber-700 border-amber-300", icon: MinusCircle },
  { id: "nao_conforme", label: "Não Conforme", color: "bg-orange-500/15 text-orange-700 border-orange-300", icon: AlertTriangle },
  { id: "critico", label: "Crítico", color: "bg-red-500/15 text-red-700 border-red-300", icon: AlertTriangle },
];

const DEFAULT_GROUPS = ["Estrutura", "Higiene", "Equipamentos", "Documentação", "Armazenamento", "Segurança"];

export default function EvidenceWorkspacePro() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const [timeline, setTimeline] = useState<"antes" | "durante" | "depois" | "all">("all");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [zoom, setZoom] = useState(1);

  const [annotatorOpen, setAnnotatorOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (user && projectId) load(); }, [user, projectId]); // eslint-disable-line

  const load = async () => {
    setLoading(true);
    const [{ data: p }, { data: cats }, { data: evs }] = await Promise.all([
      supabase.from("projects").select("id,name,client,area").eq("id", projectId!).maybeSingle(),
      supabase.from("evidence_categories").select("*").eq("project_id", projectId!).order("position"),
      supabase.from("evidences").select("*").eq("project_id", projectId!).order("position"),
    ]);
    setProject(p as any);
    setCategories((cats as any) ?? []);
    const list = ((evs as any) ?? []) as Evidence[];
    setEvidences(list);
    await refreshUrls(list);
    setLoading(false);
  };

  const refreshUrls = async (list: Evidence[]) => {
    if (!list.length) { setUrls({}); return; }
    const { data } = await supabase.storage.from("evidences")
      .createSignedUrls(list.map(e => e.storage_path), 3600);
    const m: Record<string, string> = {};
    (data ?? []).forEach((d, i) => { if (d.signedUrl) m[list[i].id] = d.signedUrl; });
    setUrls(m);
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (!user || !projectId) return;
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    if (!arr.length) return;
    setUploading(true);
    try {
      const inserts: any[] = [];
      for (let i = 0; i < arr.length; i++) {
        const f = arr[i];
        const ext = f.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/${projectId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("evidences")
          .upload(path, f, { contentType: f.type, upsert: false });
        if (error) { toast.error(`Falha: ${f.name}`); continue; }
        inserts.push({
          project_id: projectId, user_id: user.id,
          category_id: activeCat === "all" ? null : activeCat,
          storage_path: path, file_name: f.name, mime_type: f.type,
          position: evidences.length + i,
          captured_at: new Date(f.lastModified).toISOString(),
        });
      }
      if (inserts.length) {
        const { error } = await supabase.from("evidences").insert(inserts);
        if (error) toast.error(error.message);
        else toast.success(`${inserts.length} evidência(s) enviadas`);
      }
      await load();
    } finally { setUploading(false); }
  };

  const onDropZone = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
  };

  const filtered = useMemo(() => {
    let list = [...evidences];
    if (activeCat !== "all") list = list.filter(e => e.category_id === activeCat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e =>
        (e.file_name ?? "").toLowerCase().includes(q) ||
        (e.caption ?? "").toLowerCase().includes(q) ||
        (e.finding ?? "").toLowerCase().includes(q));
    }
    return list.sort((a, b) => a.position - b.position);
  }, [evidences, activeCat, search]);

  const selected = useMemo(() => evidences.find(e => e.id === selectedId) ?? null, [evidences, selectedId]);

  useEffect(() => {
    if (!selectedId && filtered.length > 0) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  const updateEvidence = async (id: string, patch: Partial<Evidence>) => {
    setEvidences(prev => prev.map(e => e.id === id ? { ...e, ...patch } as Evidence : e));
    const { error } = await supabase.from("evidences").update(patch as any).eq("id", id);
    if (error) toast.error(error.message);
  };

  const removeEvidence = async (ev: Evidence) => {
    if (!confirm("Excluir esta evidência?")) return;
    await supabase.storage.from("evidences").remove([ev.storage_path]);
    await supabase.from("evidences").delete().eq("id", ev.id);
    toast.success("Excluída");
    if (selectedId === ev.id) setSelectedId(null);
    await load();
  };

  const createCategory = async () => {
    if (!user || !projectId || !newCatName.trim()) return;
    const { error } = await supabase.from("evidence_categories").insert({
      project_id: projectId, user_id: user.id, name: newCatName.trim(),
      position: categories.length,
    });
    if (error) toast.error(error.message);
    else { setNewCatName(""); setNewCatOpen(false); await load(); }
  };

  const seedDefaultGroups = async () => {
    if (!user || !projectId) return;
    const existing = new Set(categories.map(c => c.name.toLowerCase()));
    const rows = DEFAULT_GROUPS
      .filter(n => !existing.has(n.toLowerCase()))
      .map((name, i) => ({ project_id: projectId, user_id: user.id, name, position: categories.length + i }));
    if (!rows.length) { toast.info("Grupos já criados"); return; }
    const { error } = await supabase.from("evidence_categories").insert(rows);
    if (error) toast.error(error.message);
    else { toast.success("Grupos padrão criados"); await load(); }
  };

  const runAI = async () => {
    if (!selected) return;
    setAiLoading(true);
    try {
      const url = urls[selected.id];
      const { data, error } = await supabase.functions.invoke("evidence-engine", {
        body: {
          image_url: url, evidence_id: selected.id,
          area_of_practice: project?.area, context: selected.file_name,
        },
      });
      if (error) throw error;
      const a = (data as any)?.analysis ?? {};
      await updateEvidence(selected.id, {
        ai_analysis: a, ai_status: "completed",
        caption: a.caption ?? selected.caption,
        observation: a.description ?? selected.observation,
        finding: Array.isArray(a.possible_findings)
          ? a.possible_findings.map((f: any) => f.finding).join("; ")
          : selected.finding,
        risk_level: a.criticality ?? selected.risk_level,
      } as any);
      toast.success("Análise IA concluída");
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao analisar");
    } finally { setAiLoading(false); }
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const sendToReport = (ev: Evidence) => {
    const url = urls[ev.id];
    if (!url) { toast.error("Imagem não disponível"); return; }
    const payload = {
      url,
      caption: ev.caption ?? "",
      observation: ev.observation ?? "",
      finding: ev.finding ?? "",
      annotations: ev.annotations ?? [],
    };
    const raw = sessionStorage.getItem("if_pending_evidences");
    const list = raw ? JSON.parse(raw) : [];
    list.push(payload);
    sessionStorage.setItem("if_pending_evidences", JSON.stringify(list));
    toast.success("Adicionado ao Report Builder", {
      action: { label: "Abrir", onClick: () => navigate("/report-builder") },
    });
  };

  const sendBatchToReport = () => {
    const list = filtered
      .filter(e => urls[e.id])
      .map(e => ({
        url: urls[e.id], caption: e.caption ?? "",
        observation: e.observation ?? "", finding: e.finding ?? "",
        annotations: e.annotations ?? [],
      }));
    if (!list.length) { toast.error("Nada para enviar"); return; }
    sessionStorage.setItem("if_pending_evidences", JSON.stringify(list));
    toast.success(`${list.length} evidência(s) enviadas`, {
      action: { label: "Abrir Builder", onClick: () => navigate("/report-builder") },
    });
  };

  // ---------- Render ----------
  return (
    <AppLayout>
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-2 px-3 py-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Evidence Workspace Pro</p>
            <h1 className="text-sm font-semibold truncate">
              {project?.name ?? "Projeto"}
              {project?.client && <span className="text-muted-foreground font-normal"> · {project.client}</span>}
            </h1>
          </div>
          <Button size="sm" variant={compareMode ? "default" : "outline"}
            onClick={() => { setCompareMode(v => !v); setCompareIds([]); }}>
            <GitCompare className="h-4 w-4 mr-1" />
            {compareMode ? "Sair de Comparar" : "Comparar"}
          </Button>
          <Button size="sm" variant="outline" onClick={sendBatchToReport}>
            <Send className="h-4 w-4 mr-1" /> Enviar visíveis
          </Button>
          <Button size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="h-4 w-4 mr-1" /> {uploading ? "Enviando…" : "Enviar"}
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_340px] gap-0 h-[calc(100vh-3.25rem)] min-h-[600px]">
        {/* ───────── COLUNA ESQUERDA — Biblioteca ───────── */}
        <aside className="border-r bg-muted/20 flex flex-col min-h-0">
          <div className="p-3 space-y-2 border-b">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-2.5 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar evidências…" className="pl-8 h-9" />
            </div>
            <div className="flex items-center gap-1">
              <p className="text-[11px] font-semibold uppercase text-muted-foreground flex-1">Grupos</p>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={seedDefaultGroups} title="Criar grupos padrão">
                <Layers className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setNewCatOpen(true)} title="Novo grupo">
                <FolderPlus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              <Button size="sm" variant={activeCat === "all" ? "default" : "outline"}
                className="h-7 text-xs" onClick={() => setActiveCat("all")}>
                Todas <Badge variant="secondary" className="ml-1.5">{evidences.length}</Badge>
              </Button>
              {categories.map(c => (
                <Button key={c.id} size="sm" variant={activeCat === c.id ? "default" : "outline"}
                  className="h-7 text-xs" onClick={() => setActiveCat(c.id)}>
                  {c.name}
                  <Badge variant="secondary" className="ml-1.5">
                    {evidences.filter(e => e.category_id === c.id).length}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDropZone}
            className="flex-1 overflow-y-auto p-3"
          >
            {loading ? (
              <p className="text-xs text-muted-foreground">Carregando…</p>
            ) : filtered.length === 0 ? (
              <div className="border-2 border-dashed rounded-xl py-10 text-center text-xs text-muted-foreground">
                <ImagePlus className="h-8 w-8 mx-auto mb-2 opacity-60" />
                Arraste imagens aqui<br />ou clique em Enviar
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filtered.map((ev, idx) => {
                  const isSel = ev.id === selectedId;
                  const isCmp = compareIds.includes(ev.id);
                  return (
                    <button key={ev.id}
                      onClick={() => compareMode ? toggleCompare(ev.id) : setSelectedId(ev.id)}
                      className={cn(
                        "relative aspect-[4/3] rounded-md overflow-hidden border bg-muted text-left group",
                        isSel && !compareMode && "ring-2 ring-primary",
                        isCmp && "ring-2 ring-accent",
                      )}>
                      {urls[ev.id] && (
                        <img src={urls[ev.id]} alt="" className="w-full h-full object-cover" />
                      )}
                      <span className="absolute top-1 left-1 bg-background/90 text-foreground text-[10px] font-bold rounded-full h-5 min-w-5 px-1.5 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      {ev.risk_level && (
                        <span className="absolute bottom-1 left-1 bg-destructive text-destructive-foreground text-[9px] font-semibold px-1.5 py-0.5 rounded capitalize">
                          {ev.risk_level}
                        </span>
                      )}
                      {ev.annotations?.length > 0 && (
                        <span className="absolute top-1 right-1 bg-primary text-primary-foreground text-[9px] font-semibold px-1.5 py-0.5 rounded">
                          {ev.annotations.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ───────── ÁREA CENTRAL — Canvas ───────── */}
        <section className="bg-[radial-gradient(circle_at_center,hsl(var(--muted))_0%,hsl(var(--background))_100%)] flex flex-col min-h-0">
          {compareMode ? (
            <CompareView ids={compareIds} evidences={evidences} urls={urls} />
          ) : selected ? (
            <>
              <div className="border-b bg-background/60 backdrop-blur px-3 py-2 flex items-center gap-2">
                <p className="text-xs text-muted-foreground truncate flex-1">
                  {selected.file_name ?? "Sem nome"} ·{" "}
                  {new Date(selected.captured_at ?? selected.created_at).toLocaleString("pt-BR")}
                </p>
                <Button size="icon" variant="ghost" className="h-7 w-7"
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs w-10 text-center">{Math.round(zoom * 100)}%</span>
                <Button size="icon" variant="ghost" className="h-7 w-7"
                  onClick={() => setZoom(z => Math.min(3, z + 0.25))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-5" />
                <Button size="sm" variant="outline" onClick={() => setAnnotatorOpen(true)}>
                  <Pencil className="h-4 w-4 mr-1" /> Anotar
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive"
                  onClick={() => removeEvidence(selected)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto flex items-center justify-center p-4">
                {urls[selected.id] && (
                  <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
                    <img src={urls[selected.id]} alt=""
                      className="max-h-[70vh] max-w-full shadow-2xl rounded-lg" />
                    {selected.annotations?.length > 0 && (
                      <svg viewBox="0 0 1 1" preserveAspectRatio="none"
                        className="absolute inset-0 w-full h-full pointer-events-none">
                        {selected.annotations.map(a => renderAnnotationStatic(a))}
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {selected.caption && (
                <div className="border-t bg-background/70 px-4 py-2 text-sm italic text-center">
                  {selected.caption}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Selecione uma evidência à esquerda
            </div>
          )}
        </section>

        {/* ───────── COLUNA DIREITA — Painel IA ───────── */}
        <aside className="border-l bg-background flex flex-col min-h-0">
          {selected ? (
            <Tabs defaultValue="ai" className="flex-1 flex flex-col min-h-0">
              <TabsList className="rounded-none border-b h-9 px-2 justify-start">
                <TabsTrigger value="ai" className="text-xs"><Sparkles className="h-3.5 w-3.5 mr-1" />IA</TabsTrigger>
                <TabsTrigger value="meta" className="text-xs"><Tag className="h-3.5 w-3.5 mr-1" />Dados</TabsTrigger>
                <TabsTrigger value="class" className="text-xs"><AlertTriangle className="h-3.5 w-3.5 mr-1" />Status</TabsTrigger>
              </TabsList>

              <ScrollArea className="flex-1">
                <TabsContent value="ai" className="p-3 space-y-3 m-0">
                  <Button className="w-full" onClick={runAI} disabled={aiLoading}>
                    {aiLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                    Analisar com IA
                  </Button>

                  {selected.ai_analysis && (
                    <Card>
                      <CardContent className="p-3 space-y-2 text-xs">
                        {selected.ai_analysis.description && (
                          <div>
                            <p className="font-semibold text-[11px] uppercase text-muted-foreground">Descrição</p>
                            <p>{selected.ai_analysis.description}</p>
                          </div>
                        )}
                        {Array.isArray(selected.ai_analysis.possible_findings) && selected.ai_analysis.possible_findings.length > 0 && (
                          <div>
                            <p className="font-semibold text-[11px] uppercase text-muted-foreground">Achados sugeridos</p>
                            <ul className="list-disc pl-4 space-y-1">
                              {selected.ai_analysis.possible_findings.map((f: any, i: number) => (
                                <li key={i}><strong className="capitalize">[{f.confidence}]</strong> {f.finding}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {Array.isArray(selected.ai_analysis.tags) && (
                          <div className="flex flex-wrap gap-1">
                            {selected.ai_analysis.tags.map((t: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-[10px]">{t}</Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" disabled={!selected.ai_analysis}
                      onClick={() => updateEvidence(selected.id, { caption: selected.ai_analysis?.caption ?? selected.caption })}>
                      Usar Legenda
                    </Button>
                    <Button variant="outline" size="sm" disabled={!selected.ai_analysis}
                      onClick={() => updateEvidence(selected.id, { observation: selected.ai_analysis?.description ?? selected.observation })}>
                      Usar Narrativa
                    </Button>
                    <Button variant="outline" size="sm" disabled={!selected.ai_analysis}
                      onClick={() => updateEvidence(selected.id, {
                        finding: (selected.ai_analysis?.possible_findings ?? [])
                          .map((f: any) => f.finding).join("; ") || selected.finding,
                      })}>
                      Usar Achado
                    </Button>
                    <Button variant="outline" size="sm" disabled={!selected.ai_analysis}
                      onClick={() => updateEvidence(selected.id, { risk_level: selected.ai_analysis?.criticality ?? selected.risk_level })}>
                      Usar Risco
                    </Button>
                  </div>

                  <Separator />
                  <Button className="w-full" variant="default" onClick={() => sendToReport(selected)}>
                    <Send className="h-4 w-4 mr-2" /> Adicionar ao Relatório
                  </Button>
                </TabsContent>

                <TabsContent value="meta" className="p-3 space-y-3 m-0">
                  <div>
                    <Label className="text-xs">Legenda</Label>
                    <Input value={selected.caption ?? ""} maxLength={160}
                      onChange={e => updateEvidence(selected.id, { caption: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Observação técnica</Label>
                    <Textarea rows={4} value={selected.observation ?? ""}
                      onChange={e => updateEvidence(selected.id, { observation: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Achado / Não conformidade</Label>
                    <Textarea rows={4} value={selected.finding ?? ""}
                      onChange={e => updateEvidence(selected.id, { finding: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Categoria / Grupo</Label>
                    <select
                      className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                      value={selected.category_id ?? ""}
                      onChange={e => updateEvidence(selected.id, { category_id: e.target.value || null } as any)}>
                      <option value="">— Sem grupo —</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Linha do tempo</Label>
                    <div className="grid grid-cols-3 gap-1">
                      {(["antes", "durante", "depois"] as const).map(t => (
                        <Button key={t} size="sm"
                          variant={selected.ai_analysis?.timeline === t ? "default" : "outline"}
                          onClick={() => updateEvidence(selected.id, {
                            ai_analysis: { ...(selected.ai_analysis ?? {}), timeline: t },
                          } as any)}
                          className="capitalize text-xs">{t}</Button>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="class" className="p-3 space-y-3 m-0">
                  <Label className="text-xs">Classificação</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {CLASS_OPTS.map(opt => {
                      const active = selected.ai_analysis?.classification === opt.id;
                      const Icon = opt.icon;
                      return (
                        <button key={opt.id}
                          onClick={() => updateEvidence(selected.id, {
                            ai_analysis: { ...(selected.ai_analysis ?? {}), classification: opt.id },
                          } as any)}
                          className={cn("border rounded-md px-3 py-2 text-sm text-left flex items-center gap-2 transition",
                            active ? opt.color + " font-semibold" : "hover:bg-muted")}>
                          <Icon className="h-4 w-4" /> {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <Separator />
                  <Label className="text-xs">Nível de risco</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {(["baixo", "medio", "alto", "critico"] as const).map(r => (
                      <Button key={r} size="sm"
                        variant={selected.risk_level === r ? "default" : "outline"}
                        onClick={() => updateEvidence(selected.id, { risk_level: r })}
                        className="capitalize text-xs">{r}</Button>
                    ))}
                  </div>
                </TabsContent>
              </ScrollArea>
            </Tabs>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground p-4 text-center">
              <Sparkles className="h-5 w-5 mr-2" /> Painel IA aparecerá ao selecionar uma evidência
            </div>
          )}
        </aside>
      </div>

      {selected && (
        <EvidenceAnnotator
          open={annotatorOpen}
          onOpenChange={setAnnotatorOpen}
          imageUrl={urls[selected.id]}
          initial={{
            annotations: selected.annotations ?? [],
            caption: selected.caption ?? "",
            observation: selected.observation ?? "",
            finding: selected.finding ?? "",
            risk_level: selected.risk_level ?? "",
          }}
          onSave={async (d) => {
            await updateEvidence(selected.id, {
              annotations: d.annotations, caption: d.caption,
              observation: d.observation, finding: d.finding,
              risk_level: d.risk_level || null,
            } as any);
          }}
        />
      )}

      <Dialog open={newCatOpen} onOpenChange={setNewCatOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Novo grupo</DialogTitle></DialogHeader>
          <Input value={newCatName} onChange={e => setNewCatName(e.target.value)}
            placeholder="Ex.: Estrutura" autoFocus />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setNewCatOpen(false)}>Cancelar</Button>
            <Button onClick={createCategory}><Plus className="h-4 w-4 mr-1" />Criar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function CompareView({ ids, evidences, urls }: { ids: string[]; evidences: Evidence[]; urls: Record<string, string> }) {
  const items = ids.map(id => evidences.find(e => e.id === id)).filter(Boolean) as Evidence[];
  return (
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 p-4 overflow-auto">
      {[0, 1].map(i => {
        const ev = items[i];
        return (
          <div key={i} className="bg-background rounded-lg border overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b bg-muted/40 text-xs font-semibold flex items-center gap-2">
              <Badge>{i === 0 ? "Antes" : "Depois"}</Badge>
              {ev?.file_name ?? "Selecione uma evidência na biblioteca"}
            </div>
            <div className="flex-1 flex items-center justify-center bg-muted/30 min-h-[40vh]">
              {ev && urls[ev.id]
                ? <img src={urls[ev.id]} alt="" className="max-h-[60vh] max-w-full" />
                : <p className="text-xs text-muted-foreground">Clique em uma evidência</p>}
            </div>
            {ev?.caption && <p className="text-xs italic text-center px-3 py-2 border-t">{ev.caption}</p>}
          </div>
        );
      })}
    </div>
  );
}

function renderAnnotationStatic(a: Annotation) {
  const sw = 0.004;
  if (a.type === "rect" || a.type === "highlight") {
    const x = Math.min(a.x, a.x2!), y = Math.min(a.y, a.y2!);
    const w = Math.abs((a.x2! - a.x)), h = Math.abs((a.y2! - a.y));
    return <rect key={a.id} x={x} y={y} width={w} height={h}
      fill={a.type === "highlight" ? a.color : "none"}
      fillOpacity={a.type === "highlight" ? 0.35 : 0}
      stroke={a.color} strokeWidth={sw} />;
  }
  if (a.type === "circle")
    return <circle key={a.id} cx={a.x} cy={a.y} r={a.r ?? 0.02} fill="none" stroke={a.color} strokeWidth={sw} />;
  if (a.type === "arrow")
    return <line key={a.id} x1={a.x} y1={a.y} x2={a.x2!} y2={a.y2!} stroke={a.color} strokeWidth={sw} />;
  if (a.type === "text")
    return <text key={a.id} x={a.x} y={a.y} fill={a.color} fontSize={0.028} fontWeight={700}>{a.text}</text>;
  if (a.type === "number")
    return (
      <g key={a.id}>
        <circle cx={a.x} cy={a.y} r={0.022} fill={a.color} stroke="#fff" strokeWidth={0.003} />
        <text x={a.x} y={a.y + 0.008} textAnchor="middle" fontSize={0.028} fontWeight={800} fill="#fff">{a.number}</text>
      </g>
    );
  return null;
}

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  FileText, Plus, GripVertical, Trash2, Save, FileDown, FileType2, ImagePlus, BookOpen, X,
} from "lucide-react";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  BLOCK_DEFS, defaultBlock, exportReportDOCX, exportReportPDF, type BlockType, type ReportBlock,
} from "@/lib/reportBuilder";
import { STARTER_TEMPLATES, type StarterTemplate } from "@/lib/starterTemplates";

function SortableBlock({
  block, onChange, onRemove, onAddImage, onRemoveImage,
}: {
  block: ReportBlock;
  onChange: (b: ReportBlock) => void;
  onRemove: () => void;
  onAddImage: () => void;
  onRemoveImage: (idx: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <button {...attributes} {...listeners} className="cursor-grab p-1 text-muted-foreground hover:text-foreground">
            <GripVertical className="h-4 w-4" />
          </button>
          <Input
            value={block.title}
            onChange={(e) => onChange({ ...block, title: e.target.value })}
            className="h-8 font-semibold"
          />
          <Badge variant="outline" className="text-[10px] uppercase">{block.type}</Badge>
          <Button variant="ghost" size="icon" onClick={onRemove}><Trash2 className="h-4 w-4" /></Button>
        </div>
        <Textarea
          rows={4}
          placeholder="Conteúdo do bloco..."
          value={block.content ?? ""}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
        />
        {(block.type === "evidences" || block.type === "attachments") && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">Imagens & Legendas</span>
              <Button size="sm" variant="outline" onClick={onAddImage}>
                <ImagePlus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
            {block.evidences && block.evidences.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {block.evidences.map((ev, i) => (
                  <div key={i} className="relative border border-border rounded-lg p-2 space-y-1">
                    <button onClick={() => onRemoveImage(i)} className="absolute top-1 right-1 bg-background/80 rounded-full p-0.5">
                      <X className="h-3 w-3" />
                    </button>
                    <img src={ev.url} alt={ev.caption ?? ""} className="w-full h-24 object-cover rounded" />
                    <Input
                      value={ev.caption ?? ""}
                      onChange={(e) => {
                        const next = [...(block.evidences ?? [])];
                        next[i] = { ...next[i], caption: e.target.value };
                        onChange({ ...block, evidences: next });
                      }}
                      placeholder="Legenda"
                      className="h-7 text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function ReportBuilder() {
  const { user } = useAuth();
  const [title, setTitle] = useState("Novo Relatório");
  const [blocks, setBlocks] = useState<ReportBlock[]>([
    defaultBlock("cover"),
    defaultBlock("identification"),
    defaultBlock("introduction"),
    defaultBlock("evidences"),
    defaultBlock("findings"),
    defaultBlock("conclusion"),
  ]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [reportId, setReportId] = useState<string | null>(null);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = async () => {
    if (!user) return;
    const [{ data: t }, { data: r }] = await Promise.all([
      supabase.from("report_templates").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
      supabase.from("reports").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(20),
    ]);
    setTemplates(t ?? []);
    setReports(r ?? []);
  };

  useEffect(() => { load(); }, [user]);

  // Consume pending template from Biblioteca de Templates
  useEffect(() => {
    const raw = sessionStorage.getItem("if_pending_template");
    if (!raw) return;
    sessionStorage.removeItem("if_pending_template");
    try {
      const tpl = JSON.parse(raw);
      setTitle(tpl.name ?? "Novo Relatório");
      setBlocks((tpl.blocks ?? []).map((b: any) => ({ ...b, id: crypto.randomUUID() })));
      setReportId(null);
    } catch { /* ignore */ }
  }, []);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = blocks.findIndex((b) => b.id === active.id);
    const to = blocks.findIndex((b) => b.id === over.id);
    setBlocks(arrayMove(blocks, from, to));
  };

  const addBlock = (type: BlockType) => setBlocks([...blocks, defaultBlock(type)]);
  const updateBlock = (id: string, b: ReportBlock) =>
    setBlocks(blocks.map((x) => (x.id === id ? b : x)));
  const removeBlock = (id: string) => setBlocks(blocks.filter((b) => b.id !== id));

  const addImageToBlock = (blockId: string) => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*"; input.multiple = true;
    input.onchange = async () => {
      const files = Array.from(input.files ?? []);
      const items = await Promise.all(files.map(async (f) => ({
        url: await fileToDataUrl(f), caption: "",
      })));
      setBlocks((prev) => prev.map((b) =>
        b.id === blockId ? { ...b, evidences: [...(b.evidences ?? []), ...items] } : b
      ));
    };
    input.click();
  };

  const removeImage = (blockId: string, idx: number) =>
    setBlocks((prev) => prev.map((b) =>
      b.id === blockId
        ? { ...b, evidences: (b.evidences ?? []).filter((_, i) => i !== idx) }
        : b
    ));

  const saveReport = async () => {
    if (!user) return;
    setSaving(true);
    const payload = { user_id: user.id, title, blocks: blocks as any };
    const q = reportId
      ? supabase.from("reports").update(payload).eq("id", reportId).select().maybeSingle()
      : supabase.from("reports").insert(payload).select().maybeSingle();
    const { data, error } = await q;
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    if (data) setReportId(data.id);
    toast.success("Relatório salvo");
    load();
  };

  const saveAsTemplate = async () => {
    if (!user) return;
    const name = prompt("Nome do template:", title);
    if (!name) return;
    const blank = blocks.map((b) => ({ ...b, content: "", evidences: [] }));
    const { error } = await supabase.from("report_templates").insert({
      user_id: user.id, name, blocks: blank as any,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Template salvo");
    load();
  };


  const loadTemplate = (tpl: any) => {
    setBlocks((tpl.blocks ?? []).map((b: any) => ({ ...b, id: crypto.randomUUID() })));
    setReportId(null);
    setTitle(tpl.name);
    setTemplatesOpen(false);
  };

  const loadReport = (r: any) => {
    setReportId(r.id);
    setTitle(r.title);
    setBlocks(r.blocks ?? []);
    setTemplatesOpen(false);
  };

  const loadStarter = (s: StarterTemplate) => {
    setBlocks(s.blocks.map((b) => ({ ...b, id: crypto.randomUUID() })));
    setReportId(null);
    setTitle(s.name);
    setTemplatesOpen(false);
    toast.success(`Modelo "${s.name}" carregado`);
  };

  return (
    <AppLayout>
      <div className="container max-w-5xl py-4 pb-32 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 text-primary"><FileText className="h-6 w-6" /></div>
          <div className="flex-1">
            <h1 className="text-h2 font-bold">Report Builder</h1>
            <p className="text-sm text-muted-foreground">Monte seus relatórios com blocos reordenáveis</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setTemplatesOpen(true)}>
            <BookOpen className="h-4 w-4 mr-1" /> Modelos
          </Button>
        </div>

        <Card className="p-3">
          <Label className="text-xs uppercase text-muted-foreground">Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="font-semibold" />
        </Card>

        <div className="grid md:grid-cols-[220px_1fr] gap-4">
          <Card className="p-3 space-y-2 h-fit md:sticky md:top-4">
            <div className="text-xs font-semibold uppercase text-muted-foreground">Adicionar bloco</div>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-1.5">
              {BLOCK_DEFS.map((d) => (
                <Button
                  key={d.type} size="sm" variant="outline"
                  className="justify-start text-xs"
                  onClick={() => addBlock(d.type)}
                >
                  <Plus className="h-3 w-3 mr-1" /> {d.label}
                </Button>
              ))}
            </div>
          </Card>

          <div className="space-y-3">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                {blocks.map((b) => (
                  <SortableBlock
                    key={b.id}
                    block={b}
                    onChange={(nb) => updateBlock(b.id, nb)}
                    onRemove={() => removeBlock(b.id)}
                    onAddImage={() => addImageToBlock(b.id)}
                    onRemoveImage={(i) => removeImage(b.id, i)}
                  />
                ))}
              </SortableContext>
            </DndContext>
            {blocks.length === 0 && (
              <Card className="p-8 text-center text-sm text-muted-foreground">
                Nenhum bloco. Adicione um bloco no painel ao lado.
              </Card>
            )}
          </div>
        </div>

        <div className="fixed bottom-20 left-0 right-0 px-4 z-40">
          <Card className="container max-w-5xl p-2 flex flex-wrap gap-2 shadow-lg">
            <Button onClick={saveReport} disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> Salvar
            </Button>
            <Button variant="outline" onClick={saveAsTemplate}>
              <BookOpen className="h-4 w-4 mr-1" /> Salvar modelo
            </Button>
            <div className="flex-1" />
            <Button variant="secondary" onClick={() => exportReportPDF(title, blocks)}>
              <FileDown className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button variant="secondary" onClick={() => exportReportDOCX(title, blocks)}>
              <FileType2 className="h-4 w-4 mr-1" /> DOCX
            </Button>
          </Card>
        </div>

        <Dialog open={templatesOpen} onOpenChange={setTemplatesOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Modelos e Relatórios</DialogTitle></DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-auto">
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Modelos Prontos</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {STARTER_TEMPLATES.map((s) => (
                    <button key={s.id} onClick={() => loadStarter(s)}
                      className="text-left p-3 rounded-lg border border-border hover:bg-accent hover:border-primary/40 transition">
                      <div className="flex items-center gap-2">
                        <span className="text-xl leading-none">{s.icon}</span>
                        <div className="font-medium text-sm">{s.name}</div>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{s.area}</div>
                      <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Meus Modelos</div>
                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum modelo salvo ainda.</p>
                ) : (
                  <div className="space-y-1.5">
                    {templates.map((t) => (
                      <button key={t.id} onClick={() => loadTemplate(t)}
                        className="w-full text-left p-2 rounded-lg border border-border hover:bg-accent">
                        <div className="font-medium text-sm">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{(t.blocks ?? []).length} blocos</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Relatórios Recentes</div>
                {reports.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum relatório salvo.</p>
                ) : (
                  <div className="space-y-1.5">
                    {reports.map((r) => (
                      <button key={r.id} onClick={() => loadReport(r)}
                        className="w-full text-left p-2 rounded-lg border border-border hover:bg-accent">
                        <div className="font-medium text-sm">{r.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(r.updated_at).toLocaleString("pt-BR")}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

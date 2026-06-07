import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, Copy, Sparkles, Clock, LayoutGrid, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  LIBRARY_TEMPLATES,
  TEMPLATE_CATEGORIES,
  getFavorites,
  toggleFavorite,
  getRecents,
  pushRecent,
  type LibraryTemplate,
  type TemplateCategory,
} from "@/lib/templateLibrary";

type Tab = "all" | "favorites" | "recents" | TemplateCategory;

export default function TemplateLibrary() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [selected, setSelected] = useState<LibraryTemplate | null>(null);

  useEffect(() => {
    setFavorites(getFavorites());
    setRecents(getRecents());
  }, []);

  const filtered = useMemo(() => {
    let items = LIBRARY_TEMPLATES;
    if (tab === "favorites") items = items.filter((t) => favorites.includes(t.id));
    else if (tab === "recents") {
      const order = new Map(recents.map((id, i) => [id, i]));
      items = items.filter((t) => order.has(t.id)).sort((a, b) => (order.get(a.id)! - order.get(b.id)!));
    } else if (tab !== "all") items = items.filter((t) => t.category === tab);

    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          t.area.toLowerCase().includes(q),
      );
    }
    return items;
  }, [tab, search, favorites, recents]);

  const handleFav = (id: string) => setFavorites(toggleFavorite(id));

  const useTemplate = (tpl: LibraryTemplate) => {
    pushRecent(tpl.id);
    setRecents(getRecents());
    sessionStorage.setItem(
      "if_pending_template",
      JSON.stringify({
        name: tpl.name,
        description: tpl.description,
        blocks: tpl.blocks,
        category: tpl.category,
        checklist: tpl.checklist,
      }),
    );
    toast.success(`Template "${tpl.name}" carregado`);
    navigate("/report-builder");
  };

  const duplicate = (tpl: LibraryTemplate) => {
    useTemplate({ ...tpl, name: `${tpl.name} (cópia)` });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute inset-0 opacity-30 [background:radial-gradient(circle_at_top_right,hsl(var(--primary)/.3),transparent_60%)]" />
        <div className="relative px-4 sm:px-6 py-8 sm:py-12 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs uppercase tracking-widest text-primary font-medium">Biblioteca</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight">
            Biblioteca de Templates
          </h1>
          <p className="mt-2 text-muted-foreground max-w-2xl">
            Comece um projeto em segundos com modelos profissionais de inspeção, auditoria e laudos técnicos.
          </p>

          <div className="mt-6 relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por categoria, área ou nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 bg-background/60 backdrop-blur border-border/60"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ScrollArea className="border-b border-border/40">
        <div className="flex gap-2 px-4 sm:px-6 py-3 max-w-7xl mx-auto whitespace-nowrap">
          <TabPill active={tab === "all"} onClick={() => setTab("all")} icon={<LayoutGrid className="h-3.5 w-3.5" />}>
            Todos
          </TabPill>
          <TabPill active={tab === "favorites"} onClick={() => setTab("favorites")} icon={<Star className="h-3.5 w-3.5" />}>
            Favoritos
          </TabPill>
          <TabPill active={tab === "recents"} onClick={() => setTab("recents")} icon={<Clock className="h-3.5 w-3.5" />}>
            Recentes
          </TabPill>
          <div className="w-px bg-border/60 mx-1" />
          {TEMPLATE_CATEGORIES.map((c) => (
            <TabPill key={c} active={tab === c} onClick={() => setTab(c)}>
              {c}
            </TabPill>
          ))}
        </div>
      </ScrollArea>

      {/* Grid */}
      <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
        {filtered.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                tpl={t}
                isFav={favorites.includes(t.id)}
                onFav={() => handleFav(t.id)}
                onUse={() => useTemplate(t)}
                onPreview={() => setSelected(t)}
                onDuplicate={() => duplicate(t)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <div className={`h-40 -mx-6 -mt-6 rounded-t-lg bg-gradient-to-br ${selected.cover} flex items-center justify-center mb-2`}>
                <span className="text-6xl drop-shadow-lg">{selected.icon}</span>
              </div>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">{selected.name}</DialogTitle>
                <Badge variant="secondary" className="w-fit">{selected.category}</Badge>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">{selected.description}</p>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <PreviewBlock title="Estrutura do relatório" items={selected.blocks.map((b) => b.title)} />
                <PreviewBlock title="Categorias de evidências" items={selected.evidenceCategories} />
                <PreviewBlock title="Checklist inicial" items={selected.checklist} />
                <PreviewBlock title="Campos obrigatórios" items={selected.requiredFields} />
              </div>

              {selected.conclusionTemplate && (
                <div className="rounded-md border border-border/60 bg-muted/30 p-3 text-xs">
                  <div className="font-medium mb-1">Modelo de conclusão</div>
                  <p className="text-muted-foreground">{selected.conclusionTemplate}</p>
                </div>
              )}

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => duplicate(selected)}>
                  <Copy className="h-4 w-4 mr-2" /> Duplicar
                </Button>
                <Button onClick={() => useTemplate(selected)}>
                  <Plus className="h-4 w-4 mr-2" /> Usar template
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TabPill({ active, onClick, children, icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-medium transition-colors border ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function TemplateCard({
  tpl, isFav, onFav, onUse, onPreview, onDuplicate,
}: {
  tpl: LibraryTemplate; isFav: boolean; onFav: () => void; onUse: () => void; onPreview: () => void; onDuplicate: () => void;
}) {
  return (
    <Card className="group overflow-hidden border-border/60 hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer" onClick={onPreview}>
      <div className={`relative aspect-[16/10] bg-gradient-to-br ${tpl.cover} flex items-center justify-center`}>
        <span className="text-7xl drop-shadow-xl group-hover:scale-110 transition-transform">{tpl.icon}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onFav(); }}
          className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center hover:bg-background"
          aria-label="Favoritar"
        >
          <Star className={`h-4 w-4 ${isFav ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground"}`} />
        </button>
        <Badge className="absolute bottom-2 left-2 bg-background/80 backdrop-blur text-foreground hover:bg-background/80">
          {tpl.category}
        </Badge>
      </div>
      <div className="p-4">
        <h3 className="font-display font-semibold text-base truncate">{tpl.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-[2rem]">{tpl.description}</p>
        <div className="flex gap-2 mt-3">
          <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); onUse(); }}>
            Usar
          </Button>
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onDuplicate(); }} aria-label="Duplicar">
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function PreviewBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-md border border-border/60 p-3">
      <div className="text-xs font-medium mb-2">{title}</div>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">—</p>
      ) : (
        <ul className="text-xs text-muted-foreground space-y-1">
          {items.slice(0, 6).map((i, idx) => (
            <li key={idx} className="truncate">• {i}</li>
          ))}
          {items.length > 6 && <li className="text-[10px]">+{items.length - 6} itens</li>}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const msg =
    tab === "favorites" ? "Nenhum favorito ainda. Toque na estrela para salvar." :
    tab === "recents" ? "Você ainda não usou nenhum template." :
    "Nenhum template encontrado.";
  return (
    <div className="text-center py-16">
      <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
        <Sparkles className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{msg}</p>
    </div>
  );
}

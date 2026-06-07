import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Store, Download, Check, Search, Sparkles, FileText, ListChecks, Brain } from "lucide-react";
import { toast } from "sonner";

type ItemType = "report_template" | "checklist" | "ai_profile";

interface MarketplaceItem {
  id: string;
  author_id: string;
  type: ItemType;
  title: string;
  description: string | null;
  area: string | null;
  icon: string | null;
  payload: any;
  price_cents: number;
  is_premium: boolean;
  status: string;
  installs_count: number;
  rating_avg: number;
  created_at: string;
}

const TYPE_META: Record<ItemType, { label: string; icon: any }> = {
  report_template: { label: "Modelo de Relatório", icon: FileText },
  checklist: { label: "Checklist", icon: ListChecks },
  ai_profile: { label: "Perfil de IA", icon: Brain },
};

export default function Marketplace() {
  const { user } = useAuth();
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [installed, setInstalled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"all" | ItemType>("all");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: list }, { data: inst }] = await Promise.all([
      supabase.from("marketplace_items").select("*")
        .eq("status", "approved")
        .order("installs_count", { ascending: false }),
      supabase.from("marketplace_installs").select("item_id").eq("user_id", user.id),
    ]);
    setItems((list as MarketplaceItem[]) ?? []);
    setInstalled(new Set((inst ?? []).map((i: any) => i.item_id)));
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const install = async (item: MarketplaceItem) => {
    if (!user) return;
    if (item.is_premium) {
      toast.info("Item premium — pagamento em breve.");
      return;
    }
    try {
      if (item.type === "report_template") {
        const { error } = await supabase.from("report_templates").insert({
          user_id: user.id,
          name: item.title,
          description: item.description ?? "",
          blocks: item.payload?.blocks ?? [],
        });
        if (error) throw error;
      } else if (item.type === "checklist") {
        const { error } = await supabase.from("checklists").insert({
          user_id: user.id,
          name: item.title,
          description: item.description ?? "",
          items: item.payload?.items ?? [],
          category: item.area ?? "geral",
        } as any);
        if (error) throw error;
      }
      await supabase.from("marketplace_installs").insert({ user_id: user.id, item_id: item.id });
      await supabase.from("marketplace_items")
        .update({ installs_count: item.installs_count + 1 })
        .eq("id", item.id);
      toast.success(`"${item.title}" instalado`);
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao instalar");
    }
  };

  const filtered = items.filter((i) => {
    if (tab !== "all" && i.type !== tab) return false;
    if (search && !`${i.title} ${i.description ?? ""} ${i.area ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="container max-w-5xl py-4 pb-24 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 text-primary"><Store className="h-6 w-6" /></div>
          <div className="flex-1">
            <h1 className="text-h2 font-bold">Marketplace</h1>
            <p className="text-sm text-muted-foreground">Modelos, checklists e perfis de IA da comunidade</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, área ou descrição..."
            className="pl-9"
          />
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="report_template">Modelos</TabsTrigger>
            <TabsTrigger value="checklist">Checklists</TabsTrigger>
            <TabsTrigger value="ai_profile">IA</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-4">
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-12">Carregando…</p>
            ) : filtered.length === 0 ? (
              <Card className="p-8 text-center space-y-2">
                <Store className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Nenhum item no marketplace ainda. Publique o primeiro!
                </p>
                <p className="text-xs text-muted-foreground">
                  Use o botão "Publicar no Marketplace" dentro do Report Builder.
                </p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filtered.map((item) => {
                  const Meta = TYPE_META[item.type];
                  const isInstalled = installed.has(item.id);
                  return (
                    <Card key={item.id} className="p-4 space-y-3 hover:border-primary/40 transition">
                      <div className="flex items-start gap-2">
                        <div className="text-2xl leading-none">{item.icon ?? "📄"}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{item.title}</div>
                          <div className="text-[11px] text-muted-foreground">{item.area ?? "—"}</div>
                        </div>
                        {item.is_premium && (
                          <Badge className="bg-amber-500/15 text-amber-700 border-amber-500/30">
                            <Sparkles className="h-3 w-3 mr-1" />Premium
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-3 min-h-[3rem]">
                        {item.description ?? "Sem descrição."}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px]">
                          <Meta.icon className="h-3 w-3 mr-1" />{Meta.label}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                          {item.installs_count} instalações
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        variant={isInstalled ? "secondary" : "default"}
                        disabled={isInstalled}
                        onClick={() => install(item)}
                      >
                        {isInstalled ? (
                          <><Check className="h-4 w-4 mr-1" />Instalado</>
                        ) : (
                          <><Download className="h-4 w-4 mr-1" />Instalar</>
                        )}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

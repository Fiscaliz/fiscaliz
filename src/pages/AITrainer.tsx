import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Brain, Upload, FileText, Sparkles, Trash2, Loader2, Link2, Globe, Wand2 } from "lucide-react";

const DOC_TYPES = [
  { value: "relatorio", label: "Relatório" },
  { value: "laudo", label: "Laudo" },
  { value: "procedimento", label: "Procedimento" },
  { value: "norma", label: "Norma" },
  { value: "checklist", label: "Checklist" },
  { value: "modelo_interno", label: "Modelo Interno" },
  { value: "prompt", label: "Prompt / Skill" },
  { value: "outro", label: "Outro" },
];

export default function AITrainer() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [training, setTraining] = useState(false);
  const [uploadType, setUploadType] = useState("relatorio");
  const [area, setArea] = useState("");
  const [profession, setProfession] = useState("");
  const [reportTypes, setReportTypes] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [fetchingUrl, setFetchingUrl] = useState(false);
  const [promptName, setPromptName] = useState("");
  const [promptText, setPromptText] = useState("");
  const [savingPrompt, setSavingPrompt] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data: p } = await supabase
      .from("ai_company_profile")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (p) {
      setProfile(p);
      setArea(p.area_of_practice ?? "");
      setProfession(p.profession ?? "");
      setReportTypes((p.report_types ?? []).join(", "));
    }
    const { data: d } = await supabase
      .from("ai_training_documents")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setDocs(d ?? []);
  };

  useEffect(() => { load(); }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);
    const payload = {
      user_id: user.id,
      area_of_practice: area,
      profession,
      report_types: reportTypes.split(",").map((s) => s.trim()).filter(Boolean),
    };
    const { error } = await supabase.from("ai_company_profile").upsert(payload, { onConflict: "user_id" });
    setLoading(false);
    if (error) toast.error(error.message); else { toast.success("Perfil salvo"); load(); }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    for (const file of Array.from(files)) {
      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("ai-training").upload(path, file);
      if (upErr) { toast.error(upErr.message); continue; }
      let text = "";
      if (file.type.startsWith("text/") || /\.(txt|md|csv|json)$/i.test(file.name)) {
        text = await file.text();
      }
      const { error } = await supabase.from("ai_training_documents").insert({
        user_id: user.id,
        name: file.name,
        doc_type: uploadType as any,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
        extracted_text: text || null,
        status: "pending",
      });
      if (error) toast.error(error.message);
    }
    toast.success("Arquivos enviados");
    load();
  };

  const removeDoc = async (doc: any) => {
    if (doc.file_path && !doc.file_path.startsWith("url://") && !doc.file_path.startsWith("prompt://")) {
      await supabase.storage.from("ai-training").remove([doc.file_path]);
    }
    await supabase.from("ai_training_documents").delete().eq("id", doc.id);
    load();
  };

  const handleAddUrl = async () => {
    if (!user) return;
    const url = urlInput.trim();
    if (!/^https?:\/\//i.test(url)) {
      toast.error("Informe uma URL válida (http/https)");
      return;
    }
    setFetchingUrl(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-url-content", { body: { url } });
      if (error || !data?.text) throw new Error(error?.message || "Falha ao acessar URL");
      const { error: insErr } = await supabase.from("ai_training_documents").insert({
        user_id: user.id,
        name: data.title || url,
        doc_type: uploadType as any,
        file_path: `url://${url}`,
        file_size: data.length ?? data.text.length,
        mime_type: "text/html",
        extracted_text: data.text,
        status: "pending",
      });
      if (insErr) throw insErr;
      toast.success("Conteúdo importado da URL");
      setUrlInput("");
      load();
    } catch (e: any) {
      toast.error(e.message || "Falha ao importar URL");
    } finally {
      setFetchingUrl(false);
    }
  };

  const handleAddPrompt = async () => {
    if (!user) return;
    const text = promptText.trim();
    if (text.length < 5) {
      toast.error("Escreva o prompt ou skill");
      return;
    }
    setSavingPrompt(true);
    const { error } = await supabase.from("ai_training_documents").insert({
      user_id: user.id,
      name: promptName.trim() || `Prompt — ${new Date().toLocaleString("pt-BR")}`,
      doc_type: "prompt" as any,
      file_path: `prompt://${crypto.randomUUID()}`,
      file_size: text.length,
      mime_type: "text/plain",
      extracted_text: text,
      status: "pending",
    });
    setSavingPrompt(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Prompt/skill adicionado");
    setPromptName("");
    setPromptText("");
    load();
  };



  const trainAI = async () => {
    setTraining(true);
    const { data, error } = await supabase.functions.invoke("train-ai-profile");
    setTraining(false);
    if (error) { toast.error(error.message); return; }
    toast.success("IA treinada com sucesso");
    load();
  };

  return (
    <AppLayout>
      <div className="container max-w-4xl py-4 space-y-4 pb-32">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 text-primary"><Brain className="h-6 w-6" /></div>
          <div>
            <h1 className="text-h2 font-bold">AI Trainer</h1>
            <p className="text-sm text-muted-foreground">Treine a IA com o conhecimento da sua empresa</p>
          </div>
        </div>

        <Card className="p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Cadastro da Empresa</h2>
          <div className="grid gap-3">
            <div>
              <Label>Área de atuação</Label>
              <Input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Ex: Engenharia Civil, Vigilância Sanitária..." />
            </div>
            <div>
              <Label>Profissão</Label>
              <Input value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Ex: Engenheiro, Auditor Fiscal..." />
            </div>
            <div>
              <Label>Tipos de relatório produzidos</Label>
              <Input value={reportTypes} onChange={(e) => setReportTypes(e.target.value)} placeholder="Separados por vírgula" />
            </div>
            <Button onClick={saveProfile} disabled={loading}>Salvar cadastro</Button>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2"><Upload className="h-4 w-4 text-primary" /> Base de Conhecimento</h2>
          <div className="flex flex-wrap gap-2">
            {DOC_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setUploadType(t.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                  uploadType === t.value ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-accent/30">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Clique para enviar arquivos ({DOC_TYPES.find(t => t.value === uploadType)?.label})</span>
            <input type="file" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />
          </label>

          <div className="space-y-2 pt-1">
            <Label className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <Globe className="h-3.5 w-3.5" /> Importar de URL (site ou legislação)
            </Label>
            <div className="flex gap-2">
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://www.planalto.gov.br/... ou link de norma/site"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddUrl(); } }}
              />
              <Button onClick={handleAddUrl} disabled={fetchingUrl || !urlInput.trim()} variant="secondary">
                {fetchingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Link2 className="h-4 w-4 mr-1" /> Importar</>}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Cole o link de uma lei, norma técnica, RDC, manual ou página de referência. O conteúdo será extraído e usado no treinamento.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <Label className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <Wand2 className="h-3.5 w-3.5" /> Prompt ou Skill personalizado
            </Label>
            <Input
              value={promptName}
              onChange={(e) => setPromptName(e.target.value)}
              placeholder="Nome (ex.: Estilo de redação, Checklist de inspeção predial)"
            />
            <Textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Escreva instruções, regras de escrita, modelo de conclusão, terminologia, ou qualquer skill que a IA deve seguir..."
              rows={5}
            />
            <div className="flex justify-end">
              <Button onClick={handleAddPrompt} disabled={savingPrompt || !promptText.trim()} variant="secondary" size="sm">
                {savingPrompt ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Wand2 className="h-4 w-4 mr-1" /> Adicionar prompt</>}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Use prompts e skills para ensinar à IA como você escreve, o tom técnico, formatos preferidos e regras específicas do seu trabalho.
            </p>
          </div>



          {docs.length > 0 && (
            <div className="space-y-2 pt-2">
              {docs.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-2 rounded-lg border border-border">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{d.name}</div>
                    <div className="text-xs text-muted-foreground">{d.doc_type}</div>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{d.status}</Badge>
                  <Button size="icon" variant="ghost" onClick={() => removeDoc(d)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          )}

          <Button onClick={trainAI} disabled={training || docs.length === 0} className="w-full">
            {training ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analisando...</> : <><Brain className="h-4 w-4 mr-2" /> Treinar IA com {docs.length} documento(s)</>}
          </Button>
        </Card>

        <Card className="p-4 space-y-4">
          <h2 className="font-semibold flex items-center gap-2"><Brain className="h-4 w-4 text-primary" /> Perfil Técnico Aprendido</h2>
          {!profile?.last_trained_at ? (
            <p className="text-sm text-muted-foreground">Nenhum treinamento realizado ainda. Envie documentos e clique em "Treinar IA".</p>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">
                {profile.documents_analyzed} documento(s) analisados · Último treino: {new Date(profile.last_trained_at).toLocaleString("pt-BR")}
              </div>
              {profile.summary && (
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Resumo</div>
                  <p className="text-sm">{profile.summary}</p>
                </div>
              )}
              {Array.isArray(profile.vocabulary) && profile.vocabulary.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Vocabulário</div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.vocabulary.map((v: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {Array.isArray(profile.evidence_types) && profile.evidence_types.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">Tipos de Evidência</div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.evidence_types.map((v: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {profile.document_structure && Object.keys(profile.document_structure).length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Estrutura dos Documentos</div>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">{JSON.stringify(profile.document_structure, null, 2)}</pre>
                </div>
              )}
              {profile.report_format && Object.keys(profile.report_format).length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Formato dos Relatórios</div>
                  <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto">{JSON.stringify(profile.report_format, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ArrowUpRight, Circle, Square, Highlighter, Type, Hash, MousePointer2,
  Trash2, Undo2, Save, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AnnotationTool =
  | 'select' | 'arrow' | 'circle' | 'rect' | 'highlight' | 'text' | 'number';

export interface Annotation {
  id: string;
  type: Exclude<AnnotationTool, 'select'>;
  x: number; y: number;        // normalized 0..1
  x2?: number; y2?: number;    // for arrow/rect/highlight (bottom-right)
  r?: number;                  // for circle (normalized)
  color: string;
  text?: string;
  number?: number;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  imageUrl: string;
  initial: {
    annotations: Annotation[];
    caption?: string;
    observation?: string;
    finding?: string;
    risk_level?: string;
  };
  onSave: (data: {
    annotations: Annotation[];
    caption: string;
    observation: string;
    finding: string;
    risk_level: string;
  }) => Promise<void> | void;
}

const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#0F4C5C', '#111827', '#FFFFFF'];

export function EvidenceAnnotator({ open, onOpenChange, imageUrl, initial, onSave }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tool, setTool] = useState<AnnotationTool>('select');
  const [color, setColor] = useState<string>('#EF4444');
  const [annotations, setAnnotations] = useState<Annotation[]>(initial.annotations || []);
  const [drawing, setDrawing] = useState<Annotation | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [caption, setCaption] = useState(initial.caption || '');
  const [observation, setObservation] = useState(initial.observation || '');
  const [finding, setFinding] = useState(initial.finding || '');
  const [risk, setRisk] = useState(initial.risk_level || '');

  useEffect(() => {
    if (open) {
      setAnnotations(initial.annotations || []);
      setCaption(initial.caption || '');
      setObservation(initial.observation || '');
      setFinding(initial.finding || '');
      setRisk(initial.risk_level || '');
      setSelectedId(null);
      setTool('select');
    }
  }, [open]); // eslint-disable-line

  const nextNumber = () => {
    const nums = annotations.filter(a => a.type === 'number').map(a => a.number || 0);
    return (nums.length ? Math.max(...nums) : 0) + 1;
  };

  const getPos = (e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  const onDown = (e: React.PointerEvent) => {
    if (tool === 'select') return;
    const p = getPos(e);
    const id = crypto.randomUUID();
    if (tool === 'number') {
      setAnnotations(a => [...a, { id, type: 'number', x: p.x, y: p.y, color, number: nextNumber() }]);
      return;
    }
    if (tool === 'text') {
      const text = window.prompt('Texto:') || '';
      if (text) setAnnotations(a => [...a, { id, type: 'text', x: p.x, y: p.y, color, text }]);
      return;
    }
    if (tool === 'circle') {
      setDrawing({ id, type: 'circle', x: p.x, y: p.y, r: 0, color });
      return;
    }
    setDrawing({ id, type: tool, x: p.x, y: p.y, x2: p.x, y2: p.y, color });
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawing) return;
    const p = getPos(e);
    if (drawing.type === 'circle') {
      const r = Math.hypot(p.x - drawing.x, p.y - drawing.y);
      setDrawing({ ...drawing, r });
    } else {
      setDrawing({ ...drawing, x2: p.x, y2: p.y });
    }
  };

  const onUp = () => {
    if (drawing) {
      setAnnotations(a => [...a, drawing]);
      setDrawing(null);
    }
  };

  const undo = () => setAnnotations(a => a.slice(0, -1));
  const removeSelected = () => {
    if (!selectedId) return;
    setAnnotations(a => a.filter(x => x.id !== selectedId));
    setSelectedId(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({ annotations, caption, observation, finding, risk_level: risk });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const tools: { id: AnnotationTool; icon: any; label: string }[] = [
    { id: 'select', icon: MousePointer2, label: 'Selecionar' },
    { id: 'arrow', icon: ArrowUpRight, label: 'Seta' },
    { id: 'circle', icon: Circle, label: 'Círculo' },
    { id: 'rect', icon: Square, label: 'Retângulo' },
    { id: 'highlight', icon: Highlighter, label: 'Destaque' },
    { id: 'text', icon: Type, label: 'Texto' },
    { id: 'number', icon: Hash, label: 'Numeração' },
  ];

  const renderAnnotation = (a: Annotation, idx: number) => {
    const sel = a.id === selectedId;
    const strokeW = sel ? 0.006 : 0.004;
    const click = (e: React.MouseEvent) => {
      if (tool !== 'select') return;
      e.stopPropagation();
      setSelectedId(a.id);
    };
    const common = { onClick: click, style: { cursor: tool === 'select' ? 'pointer' : 'crosshair' } };
    if (a.type === 'rect' || a.type === 'highlight') {
      const x = Math.min(a.x, a.x2!), y = Math.min(a.y, a.y2!);
      const w = Math.abs((a.x2! - a.x)), h = Math.abs((a.y2! - a.y));
      return (
        <rect key={a.id} x={x} y={y} width={w} height={h}
          fill={a.type === 'highlight' ? a.color : 'none'}
          fillOpacity={a.type === 'highlight' ? 0.35 : 0}
          stroke={a.color} strokeWidth={strokeW} {...common} />
      );
    }
    if (a.type === 'circle') {
      return <circle key={a.id} cx={a.x} cy={a.y} r={a.r || 0.02} fill="none"
        stroke={a.color} strokeWidth={strokeW} {...common} />;
    }
    if (a.type === 'arrow') {
      const id = `arrow-${idx}`;
      return (
        <g key={a.id} {...common}>
          <defs>
            <marker id={id} viewBox="0 0 10 10" refX="8" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" fill={a.color} />
            </marker>
          </defs>
          <line x1={a.x} y1={a.y} x2={a.x2!} y2={a.y2!}
            stroke={a.color} strokeWidth={strokeW} markerEnd={`url(#${id})`} />
        </g>
      );
    }
    if (a.type === 'text') {
      return (
        <text key={a.id} x={a.x} y={a.y} fill={a.color}
          fontSize={0.028} fontWeight={700} {...common}>{a.text}</text>
      );
    }
    if (a.type === 'number') {
      return (
        <g key={a.id} {...common}>
          <circle cx={a.x} cy={a.y} r={0.022} fill={a.color} stroke="#fff" strokeWidth={0.003} />
          <text x={a.x} y={a.y + 0.008} textAnchor="middle"
            fontSize={0.028} fontWeight={800} fill="#fff">{a.number}</text>
        </g>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl p-0 gap-0 h-[92vh] flex flex-col overflow-hidden">
        <DialogHeader className="px-4 py-2 border-b">
          <DialogTitle className="text-base">Editor de evidência</DialogTitle>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[64px_1fr_320px] min-h-0">
          {/* Toolbar */}
          <div className="border-r p-2 flex md:flex-col gap-1 overflow-auto">
            {tools.map(t => (
              <Button key={t.id} variant={tool === t.id ? 'default' : 'ghost'}
                size="icon" title={t.label} onClick={() => setTool(t.id)}>
                <t.icon className="h-4 w-4" />
              </Button>
            ))}
            <div className="h-px md:w-full md:h-px bg-border my-1" />
            <Button variant="ghost" size="icon" onClick={undo} title="Desfazer">
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={removeSelected}
              disabled={!selectedId} title="Excluir seleção">
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="h-px md:w-full md:h-px bg-border my-1" />
            <div className="grid grid-cols-2 md:grid-cols-1 gap-1">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={cn('h-6 w-6 rounded-full border', color === c && 'ring-2 ring-offset-1 ring-primary')}
                  style={{ background: c }} aria-label={c} />
              ))}
            </div>
          </div>

          {/* Canvas */}
          <div className="relative bg-muted flex items-center justify-center overflow-hidden">
            <div className="relative max-h-full max-w-full">
              <img src={imageUrl} alt="evidência" className="block max-h-[80vh] max-w-full select-none"
                draggable={false} />
              <svg ref={svgRef} viewBox="0 0 1 1" preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full"
                style={{ cursor: tool === 'select' ? 'default' : 'crosshair' }}
                onPointerDown={onDown} onPointerMove={onMove}
                onPointerUp={onUp} onPointerLeave={onUp}
                onClick={() => tool === 'select' && setSelectedId(null)}>
                {annotations.map(renderAnnotation)}
                {drawing && renderAnnotation(drawing, -1)}
              </svg>
            </div>
          </div>

          {/* Side panel */}
          <div className="border-l overflow-y-auto">
            <Tabs defaultValue="caption" className="w-full">
              <TabsList className="w-full justify-start rounded-none border-b h-9 px-2 overflow-x-auto">
                <TabsTrigger value="caption">Legenda</TabsTrigger>
                <TabsTrigger value="observation">Observação</TabsTrigger>
                <TabsTrigger value="finding">Achado</TabsTrigger>
                <TabsTrigger value="risk">Risco</TabsTrigger>
              </TabsList>
              <TabsContent value="caption" className="p-3 space-y-2">
                <Label>Legenda</Label>
                <Input value={caption} onChange={e => setCaption(e.target.value)}
                  placeholder="Ex.: Fissura na viga V-04 (foto 1/3)" maxLength={160} />
                <p className="text-xs text-muted-foreground">{caption.length}/160</p>
              </TabsContent>
              <TabsContent value="observation" className="p-3 space-y-2">
                <Label>Observação técnica</Label>
                <Textarea rows={8} value={observation} onChange={e => setObservation(e.target.value)}
                  placeholder="Descrição factual do que foi observado." maxLength={2000} />
              </TabsContent>
              <TabsContent value="finding" className="p-3 space-y-2">
                <Label>Achado / Não conformidade</Label>
                <Textarea rows={8} value={finding} onChange={e => setFinding(e.target.value)}
                  placeholder="Conclusão técnica, citação normativa, etc." maxLength={2000} />
              </TabsContent>
              <TabsContent value="risk" className="p-3 space-y-2">
                <Label>Nível de risco</Label>
                <div className="grid grid-cols-4 gap-2">
                  {['baixo', 'medio', 'alto', 'critico'].map(r => (
                    <Button key={r} variant={risk === r ? 'default' : 'outline'}
                      size="sm" onClick={() => setRisk(r)} className="capitalize">{r}</Button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <div className="border-t px-4 py-2 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {annotations.length} anotação(ões) · ferramenta: <span className="capitalize">{tool}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4 mr-1" /> Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-1" /> {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

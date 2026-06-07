import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Briefcase, ClipboardCheck, MapPin, FileText, Sparkles, LayoutTemplate,
  Upload, X, ChevronLeft, ChevronRight, Check, Link2, Globe,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface OnboardingData {
  profession: string;
  activityTypes: string[];
  areas: string[];
  reportTools: string[];
  trainingFiles: File[];
  trainingUrls: string[];
  initialTemplate: string;
}

export const EMPTY_ONBOARDING: OnboardingData = {
  profession: '',
  activityTypes: [],
  areas: [],
  reportTools: [],
  trainingFiles: [],
  trainingUrls: [],
  initialTemplate: '',
};

interface Props {
  data: OnboardingData;
  onChange: (d: OnboardingData) => void;
}

const PROFESSIONS = [
  'Engenheiro', 'Arquiteto', 'Auditor', 'Fiscal', 'Consultor',
  'Perito', 'Técnico', 'Segurança do Trabalho', 'Gestor', 'Outro',
];

const ACTIVITIES = [
  'Inspeções', 'Vistorias', 'Auditorias', 'Perícias', 'Fiscalizações',
  'Laudos Técnicos', 'Relatórios Operacionais', 'Consultoria', 'Outro',
];

const AREAS = [
  'Engenharia Civil', 'Engenharia Elétrica', 'Engenharia Mecânica',
  'Arquitetura', 'Segurança do Trabalho', 'Vigilância Sanitária',
  'Alimentos', 'Meio Ambiente', 'Energia Solar', 'Seguros',
  'Agronegócio', 'Facilities', 'Condomínios', 'Perícia Veicular',
  'Personalizado',
];

const TOOLS = [
  'Word', 'Excel', 'PowerPoint', 'Canva', 'Google Docs', 'Sistema próprio', 'Outro',
];

const TEMPLATES = [
  { id: 'vigilancia-sanitaria',  label: 'Fiscalização Sanitária', icon: '🥗' },
  { id: 'inspecao-predial',      label: 'Inspeção Predial',       icon: '🏢' },
  { id: 'vistoria-veicular',     label: 'Vistoria Veicular',      icon: '🚗' },
  { id: 'sst',                   label: 'Segurança do Trabalho',  icon: '🦺' },
  { id: 'auditoria-franquias',   label: 'Auditoria',              icon: '📋' },
  { id: 'agronegocio',           label: 'Agronegócio',            icon: '🌾' },
  { id: 'energia-solar',         label: 'Energia Solar',          icon: '☀️' },
  { id: 'personalizado',         label: 'Personalizado',          icon: '✨' },
];

const STEP_META = [
  { title: 'Quem é você?',                 desc: 'Sua profissão principal.',                Icon: Briefcase },
  { title: 'Tipo de atividade',            desc: 'O que você mais faz no dia a dia?',       Icon: ClipboardCheck },
  { title: 'Área de atuação',              desc: 'Selecione uma ou mais áreas.',            Icon: MapPin },
  { title: 'Como produz relatórios hoje?', desc: 'Suas ferramentas atuais.',                Icon: FileText },
  { title: 'Treine sua IA',                desc: 'Quanto mais exemplos, mais personalizada será sua IA.', Icon: Sparkles },
  { title: 'Template inicial',             desc: 'Comece com uma estrutura pronta.',        Icon: LayoutTemplate },
];

export function OnboardingWizard({ data, onChange }: Props) {
  const [step, setStep] = useState(0);
  const update = (p: Partial<OnboardingData>) => onChange({ ...data, ...p });

  const toggle = (key: 'activityTypes' | 'areas' | 'reportTools', v: string) => {
    const list = data[key];
    update({ [key]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] } as any);
  };

  const canAdvance = () => {
    switch (step) {
      case 0: return !!data.profession;
      case 1: return data.activityTypes.length > 0;
      case 2: return data.areas.length > 0;
      case 3: return data.reportTools.length > 0;
      case 4: return true;
      case 5: return !!data.initialTemplate;
      default: return false;
    }
  };

  const meta = STEP_META[step];
  const Icon = meta.Icon;
  const total = STEP_META.length;

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center gap-1.5">
        {STEP_META.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-h2 font-bold leading-tight">{meta.title}</h3>
          <p className="text-xs text-muted-foreground">
            Etapa {step + 1} de {total} · {meta.desc}
          </p>
        </div>
      </div>

      {/* Step 0 — profession (single) */}
      {step === 0 && (
        <div className="grid grid-cols-2 gap-2">
          {PROFESSIONS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => update({ profession: p })}
              className={`py-3 px-3 text-sm font-semibold rounded-xl border-2 transition-all text-left ${
                data.profession === p
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border/60 hover:bg-accent'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Step 1 — activities (multi) */}
      {step === 1 && (
        <ChipList
          options={ACTIVITIES}
          selected={data.activityTypes}
          onToggle={(v) => toggle('activityTypes', v)}
        />
      )}

      {/* Step 2 — areas (multi) */}
      {step === 2 && (
        <ChipList
          options={AREAS}
          selected={data.areas}
          onToggle={(v) => toggle('areas', v)}
        />
      )}

      {/* Step 3 — report tools (multi) */}
      {step === 3 && (
        <ChipList
          options={TOOLS}
          selected={data.reportTools}
          onToggle={(v) => toggle('reportTools', v)}
        />
      )}

      {/* Step 4 — AI training upload (optional) */}
      {step === 4 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Envie relatórios antigos, laudos, checklists, procedimentos, normas
            ou modelos próprios. Quanto mais exemplos, mais personalizada será
            sua IA.
          </p>
          <label className="flex items-center justify-center gap-2 w-full p-6 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 hover:bg-accent/30 transition-all cursor-pointer">
            <Upload className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Selecionar arquivos (opcional)
            </span>
            <input
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md,.xlsx,.xls,.csv,image/*"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                update({ trainingFiles: [...data.trainingFiles, ...files] });
              }}
            />
          </label>
          {data.trainingFiles.length > 0 && (
            <ul className="space-y-1.5">
              {data.trainingFiles.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-lg bg-accent/40 border border-border/40"
                >
                  <span className="truncate">{f.name}</span>
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        trainingFiles: data.trainingFiles.filter((_, idx) => idx !== i),
                      })
                    }
                    className="text-destructive hover:opacity-70"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Step 5 — initial template */}
      {step === 5 && (
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => update({ initialTemplate: t.id })}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                data.initialTemplate === t.id
                  ? 'bg-primary/10 border-primary'
                  : 'bg-background border-border/60 hover:bg-accent/30'
              }`}
            >
              <div className="text-2xl mb-1">{t.icon}</div>
              <div className="text-sm font-semibold leading-tight">{t.label}</div>
              {data.initialTemplate === t.id && (
                <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-primary font-semibold">
                  <Check className="h-3 w-3" /> Selecionado
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Nav */}
      <div className="flex items-center justify-between pt-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        {step < total - 1 ? (
          <Button
            type="button"
            size="sm"
            onClick={() => canAdvance() && setStep((s) => s + 1)}
            disabled={!canAdvance()}
          >
            Continuar <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            {canAdvance() ? 'Pronto! Finalize abaixo.' : 'Selecione um template.'}
          </span>
        )}
      </div>
    </div>
  );
}

function ChipList({
  options, selected, onToggle,
}: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={`px-3.5 py-2 text-sm font-medium rounded-full border-2 transition-all ${
              on
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background border-border/60 hover:bg-accent'
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function isOnboardingComplete(d: OnboardingData) {
  return (
    !!d.profession &&
    d.activityTypes.length > 0 &&
    d.areas.length > 0 &&
    d.reportTools.length > 0 &&
    !!d.initialTemplate
  );
}

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Upload, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export interface SignupExtraData {
  userType: string;
  institutionalLink: string;
  institutionName: string;
  areasOfPractice: string[];
  logoFile: File | null;
  city: string;
  state: string;
  organName: string;
  pdfHeaderText: string;
  customLegislations: string[];
}

interface Props {
  data: SignupExtraData;
  onChange: (data: SignupExtraData) => void;
}

const AREAS_OPTIONS = [
  { value: 'alimentos', label: 'Alimentos' },
  { value: 'saude', label: 'Saúde' },
  { value: 'interesses_saude', label: 'Interesses da Saúde' },
  { value: 'medicamentos', label: 'Medicamentos' },
  { value: 'cosmeticos', label: 'Cosméticos' },
  { value: 'saneantes', label: 'Saneantes' },
  { value: 'meio_ambiente', label: 'Meio Ambiente' },
  { value: 'saude_trabalhador', label: 'Saúde do Trabalhador' },
  { value: 'zoonoses', label: 'Zoonoses' },
  { value: 'outras', label: 'Outras áreas da Vigilância Sanitária' },
];

const BRAZILIAN_STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA',
  'PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

export function SignupExtraFields({ data, onChange }: Props) {
  const [newLegislation, setNewLegislation] = useState('');

  const update = (partial: Partial<SignupExtraData>) => onChange({ ...data, ...partial });

  const toggleArea = (value: string) => {
    const areas = data.areasOfPractice.includes(value)
      ? data.areasOfPractice.filter((a) => a !== value)
      : [...data.areasOfPractice, value];
    update({ areasOfPractice: areas });
  };

  const addLegislation = () => {
    const trimmed = newLegislation.trim();
    if (trimmed && !data.customLegislations.includes(trimmed)) {
      update({ customLegislations: [...data.customLegislations, trimmed] });
      setNewLegislation('');
    }
  };

  const removeLegislation = (index: number) => {
    update({ customLegislations: data.customLegislations.filter((_, i) => i !== index) });
  };

  const institutionLabel =
    data.userType === 'consultor_privado'
      ? 'Nome da Empresa / Marca'
      : 'Nome da Instituição / Órgão';

  const logoLabel =
    data.userType === 'consultor_privado'
      ? 'Logomarca da Empresa'
      : 'Logomarca do Órgão / Município';

  return (
    <div className="space-y-5">
      {/* User Type */}
      <div className="space-y-2">
        <Label className="text-caption font-semibold uppercase tracking-wide">
          Tipo de Usuário <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-1 gap-2">
          {[
            { value: 'auditor_fiscal', label: 'Auditor Fiscal / Servidor Público' },
            { value: 'consultor_privado', label: 'Consultor Privado / Iniciativa Privada' },
          ].map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => update({ userType: type.value, institutionalLink: '', institutionName: '' })}
              className={`py-3 px-4 text-sm font-semibold rounded-xl border-2 transition-all duration-200 text-left ${
                data.userType === type.value
                  ? 'bg-primary text-primary-foreground border-primary shadow-premium-sm'
                  : 'bg-background border-border/60 hover:bg-accent hover:border-accent'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Institutional Link */}
      {data.userType && (
        <div className="space-y-2">
          <Label className="text-caption font-semibold uppercase tracking-wide">
            Vínculo Institucional <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-1 gap-2">
            {(data.userType === 'auditor_fiscal'
              ? [
                  { value: 'municipio', label: 'Município' },
                  { value: 'estado', label: 'Estado' },
                ]
              : [
                  { value: 'empresa_privada', label: 'Empresa Privada / Consultoria' },
                ]
            ).map((link) => (
              <button
                key={link.value}
                type="button"
                onClick={() => update({ institutionalLink: link.value })}
                className={`py-3 px-4 text-sm font-semibold rounded-xl border-2 transition-all duration-200 text-left ${
                  data.institutionalLink === link.value
                    ? 'bg-primary text-primary-foreground border-primary shadow-premium-sm'
                    : 'bg-background border-border/60 hover:bg-accent hover:border-accent'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* State & City */}
      {data.institutionalLink && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-caption font-semibold uppercase tracking-wide">
              Estado <span className="text-destructive">*</span>
            </Label>
            <select
              value={data.state}
              onChange={(e) => update({ state: e.target.value })}
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">UF</option>
              {BRAZILIAN_STATES.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-caption font-semibold uppercase tracking-wide">
              Cidade <span className="text-destructive">*</span>
            </Label>
            <Input
              type="text"
              placeholder="Ex: Goiânia"
              value={data.city}
              onChange={(e) => update({ city: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Organ / Institution Name */}
      {data.institutionalLink && (
        <div className="space-y-2">
          <Label className="text-caption font-semibold uppercase tracking-wide">
            {institutionLabel} <span className="text-destructive">*</span>
          </Label>
          <Input
            type="text"
            placeholder={
              data.userType === 'consultor_privado'
                ? 'Ex: Consultoria Silva & Associados'
                : 'Ex: Prefeitura de Goiânia / Secretaria de Saúde'
            }
            value={data.institutionName}
            onChange={(e) => update({ institutionName: e.target.value })}
          />
        </div>
      )}

      {/* Organ Name (department/division) */}
      {data.institutionalLink && data.userType === 'auditor_fiscal' && (
        <div className="space-y-2">
          <Label className="text-caption font-semibold uppercase tracking-wide">
            Órgão / Departamento <span className="text-muted-foreground text-xs">(opcional)</span>
          </Label>
          <Input
            type="text"
            placeholder="Ex: Divisão de Vigilância Sanitária"
            value={data.organName}
            onChange={(e) => update({ organName: e.target.value })}
          />
        </div>
      )}

      {/* PDF Header Text */}
      {data.institutionalLink && (
        <div className="space-y-2">
          <Label className="text-caption font-semibold uppercase tracking-wide">
            Cabeçalho dos PDFs <span className="text-muted-foreground text-xs">(texto que aparecerá nos documentos)</span>
          </Label>
          <Textarea
            placeholder={
              data.userType === 'consultor_privado'
                ? 'Ex: CONSULTORIA SILVA & ASSOCIADOS\nAssessoria em Vigilância Sanitária'
                : 'Ex: PREFEITURA DE GOIÂNIA\nSecretaria Municipal de Saúde\nDivisão de Vigilância Sanitária'
            }
            value={data.pdfHeaderText}
            onChange={(e) => update({ pdfHeaderText: e.target.value })}
            rows={3}
          />
        </div>
      )}

      {/* Logo Upload */}
      {data.institutionalLink && (
        <div className="space-y-2">
          <Label className="text-caption font-semibold uppercase tracking-wide">
            {logoLabel} <span className="text-muted-foreground text-xs">(opcional)</span>
          </Label>
          <div className="flex items-center gap-3">
            {data.logoFile ? (
              <div className="flex items-center gap-3 w-full p-3 rounded-xl border border-border/60 bg-accent/30">
                <Building2 className="h-5 w-5 text-primary shrink-0" />
                <span className="text-sm truncate flex-1">{data.logoFile.name}</span>
                <button
                  type="button"
                  onClick={() => update({ logoFile: null })}
                  className="text-xs text-destructive font-semibold hover:underline"
                >
                  Remover
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 w-full p-4 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/40 hover:bg-accent/30 transition-all cursor-pointer">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Selecionar imagem</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    update({ logoFile: file });
                  }}
                />
              </label>
            )}
          </div>
        </div>
      )}

      {/* Areas of Practice */}
      <div className="space-y-3">
        <Label className="text-caption font-semibold uppercase tracking-wide">
          Área de Atuação <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-1 gap-2">
          {AREAS_OPTIONS.map((area) => (
            <label
              key={area.value}
              className={`flex items-center gap-3 py-3 px-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                data.areasOfPractice.includes(area.value)
                  ? 'bg-primary/10 border-primary/40'
                  : 'bg-background border-border/60 hover:bg-accent/30'
              }`}
            >
              <Checkbox
                checked={data.areasOfPractice.includes(area.value)}
                onCheckedChange={() => toggleArea(area.value)}
              />
              <span className="text-sm font-medium">{area.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Legislations */}
      <div className="space-y-3">
        <Label className="text-caption font-semibold uppercase tracking-wide">
          Legislações de Referência <span className="text-muted-foreground text-xs">(cadastre as legislações que você utiliza)</span>
        </Label>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Ex: RDC 216/2004, Lei Municipal 8741/2008..."
            value={newLegislation}
            onChange={(e) => setNewLegislation(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addLegislation();
              }
            }}
          />
          <Button type="button" size="icon" variant="outline" onClick={addLegislation} className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {data.customLegislations.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.customLegislations.map((leg, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                {leg}
                <button type="button" onClick={() => removeLegislation(idx)} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MobilePhotoUpload } from '@/components/documents/MobilePhotoUpload';
import { Building2, Upload } from 'lucide-react';

export interface SignupExtraData {
  userType: string;
  institutionalLink: string;
  institutionName: string;
  areasOfPractice: string[];
  logoFile: File | null;
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

export function SignupExtraFields({ data, onChange }: Props) {
  const update = (partial: Partial<SignupExtraData>) => onChange({ ...data, ...partial });

  const toggleArea = (value: string) => {
    const areas = data.areasOfPractice.includes(value)
      ? data.areasOfPractice.filter((a) => a !== value)
      : [...data.areasOfPractice, value];
    update({ areasOfPractice: areas });
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

      {/* Institution Name */}
      {data.institutionalLink && (
        <div className="space-y-2">
          <Label className="text-caption font-semibold uppercase tracking-wide">
            {institutionLabel}
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
    </div>
  );
}

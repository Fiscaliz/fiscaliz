import { useAuth } from '@/hooks/useAuth';
import { Sparkles } from 'lucide-react';
import fiscalizLogo from '@/assets/logo-fiscaliz.png';

export function BrandHeader() {
  const { user } = useAuth();

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const registrationNumber = user?.user_metadata?.registration_number;

  return (
    <div
      className="relative overflow-hidden px-5 py-8"
      style={{ background: 'var(--gradient-brand)' }}
    >
      <div
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{ background: 'var(--gradient-mesh)' }}
      />
      <div className="relative flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur-md p-1.5 flex items-center justify-center shadow-lg">
          <img
            src={fiscalizLogo}
            alt="Fiscaliz"
            className="h-full w-full object-contain rounded-xl"
            width={64}
            height={64}
          />
        </div>
        <div className="text-white">
          <h2
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            FISCALIZ
          </h2>
          <p className="text-sm text-white/85">
            {fullName}{registrationNumber ? ` · ${registrationNumber}` : ''}
          </p>
          <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-white/75">
            <Sparkles className="h-3 w-3" />
            <span>Evidências em conhecimento</span>
          </div>
        </div>
      </div>
    </div>
  );
}

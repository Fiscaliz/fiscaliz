import { useAuth } from '@/hooks/useAuth';
import { Shield } from 'lucide-react';
import fiscalizLogo from '@/assets/logo-fiscaliz.png';

export function BrandHeader() {
  const { user } = useAuth();
  
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const registrationNumber = user?.user_metadata?.registration_number;

  return (
    <div className="fiscaliz-gradient px-4 py-6">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-xl bg-primary-foreground/10 p-1 backdrop-blur-sm flex items-center justify-center">
          <img src={fiscalizLogo} alt="Fiscaliz" className="h-full w-full object-contain" />
        </div>
        <div className="text-primary-foreground">
          <h2 className="text-lg font-bold">{fullName}</h2>
          <p className="text-sm text-primary-foreground/80">
            Matrícula: {registrationNumber || 'Não informada'}
          </p>
          <div className="mt-1 flex items-center gap-1 text-xs text-primary-foreground/70">
            <Shield className="h-3 w-3" />
            <span>Auditor Fiscal de Saúde Pública</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useAuth } from '@/hooks/useAuth';
import { Sparkles } from 'lucide-react';
import fiscalizLogo from '@/assets/logo-fiscaliz.png';

export function BrandHeader() {
  const { user } = useAuth();

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuário';
  const registrationNumber = user?.user_metadata?.registration_number;

  return (
    <div className="fiscaliz-gradient px-5 py-8">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-2xl bg-primary-foreground/10 p-2 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <img src={fiscalizLogo} alt="InspectFlow AI" className="h-full w-full object-contain drop-shadow-md" />
        </div>
        <div className="text-primary-foreground">
          <h2 className="text-h2 font-bold tracking-tight">InspectFlow AI</h2>
          <p className="text-body text-primary-foreground/85">
            {fullName}{registrationNumber ? ` · ${registrationNumber}` : ''}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-caption text-primary-foreground/70">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Relatórios técnicos com evidências</span>
          </div>
        </div>
      </div>
    </div>
  );
}

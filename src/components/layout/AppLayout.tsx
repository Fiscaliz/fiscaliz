import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { cn } from '@/lib/utils';
import fiscalizLogo from '@/assets/logo-fiscaliz.png';

interface AppLayoutProps {
  children: ReactNode;
  hideBottomNav?: boolean;
  className?: string;
  showWatermark?: boolean;
}

export function AppLayout({ children, hideBottomNav, className, showWatermark = true }: AppLayoutProps) {
  return (
    <div className={cn('flex min-h-screen flex-col bg-background relative', className)}>
      {/* Marca d'água Fiscaliz como plano de fundo */}
      {showWatermark && (
        <div className="app-watermark pointer-events-none">
          <img 
            src={fiscalizLogo} 
            alt="" 
            className="w-full h-full object-contain"
          />
        </div>
      )}
      
      <main className={cn(
        'flex-1 relative z-10',
        !hideBottomNav && 'pb-24' // Space for bottom nav
      )}>
        {children}
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}

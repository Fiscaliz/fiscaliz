import { ReactNode } from 'react';
import { ArrowLeft, WifiOff, Wifi } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import fiscalizLogo from '@/assets/logo-fiscaliz.png';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  className?: string;
  showLogo?: boolean;
}

export function Header({ title, subtitle, showBack, rightAction, className, showLogo = false }: HeaderProps) {
  const navigate = useNavigate();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <header className={cn(
      'sticky top-0 z-40 border-b border-border/50 bg-card/95 backdrop-blur-md pt-safe-top',
      className
    )}>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10 rounded-xl"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {showLogo && (
            <img 
              src={fiscalizLogo} 
              alt="Fiscaliz" 
              className="h-10 w-auto drop-shadow-sm"
            />
          )}
          <div>
            <h1 className="text-h3 text-foreground">{title}</h1>
            {subtitle && (
              <p className="text-caption text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Online/Offline indicator */}
          <div className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-micro font-semibold uppercase tracking-wide',
            isOnline 
              ? 'bg-success/15 text-success' 
              : 'bg-warning/15 text-warning'
          )}>
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3" />
                <span className="hidden sm:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                <span>Offline</span>
              </>
            )}
          </div>
          
          {rightAction}
        </div>
      </div>
    </header>
  );
}

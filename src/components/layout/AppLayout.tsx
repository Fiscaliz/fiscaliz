import { ReactNode } from 'react';
import { BottomNav } from './BottomNav';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
  hideBottomNav?: boolean;
  className?: string;
}

export function AppLayout({ children, hideBottomNav, className }: AppLayoutProps) {
  return (
    <div className={cn('flex min-h-screen flex-col bg-background', className)}>
      <main className={cn(
        'flex-1',
        !hideBottomNav && 'pb-20' // Space for bottom nav
      )}>
        {children}
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}

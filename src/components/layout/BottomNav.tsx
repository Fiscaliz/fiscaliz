import { NavLink } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  BarChart3, 
  User,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/nova-acao', icon: FileText, label: 'Nova Ação' },
  { to: '/relatorios-mensais', icon: ClipboardList, label: 'Relatórios' },
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/perfil', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/95 backdrop-blur-md pb-safe-bottom print:!hidden print:!opacity-0 print:!invisible" style={{ display: 'var(--nav-display, flex)' }}>
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-4 py-2.5 text-micro uppercase tracking-wide transition-all duration-200 touch-target rounded-xl',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-5 w-5 transition-transform duration-200', isActive && 'scale-110')} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn('font-semibold', isActive && 'text-primary')}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

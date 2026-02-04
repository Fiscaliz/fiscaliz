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
  { to: '/', icon: Home, label: 'Início', color: 'text-primary', bgActive: 'bg-primary/15' },
  { to: '/nova-acao', icon: FileText, label: 'Ação', color: 'text-secondary', bgActive: 'bg-secondary/15' },
  { to: '/relatorios-mensais', icon: ClipboardList, label: 'Relatórios', color: 'text-info', bgActive: 'bg-info/15' },
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard', color: 'text-warning', bgActive: 'bg-warning/15' },
  { to: '/perfil', icon: User, label: 'Perfil', color: 'text-muted-foreground', bgActive: 'bg-muted' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-card/98 backdrop-blur-lg pb-safe-bottom print:!hidden print:!opacity-0 print:!invisible" style={{ display: 'var(--nav-display, flex)' }}>
      <div className="flex items-center justify-evenly w-full py-2 px-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-w-[64px] text-center transition-all duration-200 rounded-xl',
                isActive
                  ? `${item.color} ${item.bgActive}`
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200',
                  isActive && item.bgActive
                )}>
                  <item.icon 
                    className={cn(
                      'h-5 w-5 transition-all duration-200',
                      isActive ? item.color : 'text-muted-foreground'
                    )} 
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                </div>
                <span className={cn(
                  'text-[10px] font-semibold uppercase tracking-wide leading-tight',
                  isActive ? item.color : 'text-muted-foreground'
                )}>
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

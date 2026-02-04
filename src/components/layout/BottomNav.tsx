import { NavLink } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  FolderOpen, 
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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card pb-safe-bottom print:!hidden print:!opacity-0 print:!invisible" style={{ display: 'var(--nav-display, flex)' }}>
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors touch-target',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                <span className={cn('font-medium', isActive && 'font-semibold')}>
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

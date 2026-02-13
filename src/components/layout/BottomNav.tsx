import { NavLink } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  BarChart3, 
  User,
  Scale,
  ClipboardList
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/nova-acao', icon: FileText, label: 'Ação' },
  { to: '/consultar-ia', icon: Scale, label: 'Consultar' },
  { to: '/relatorios-mensais', icon: ClipboardList, label: 'Relatórios' },
  { to: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { to: '/perfil', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-primary shadow-[0_-4px_24px_rgba(15,76,92,0.3)] pb-safe-bottom print:!hidden" style={{ display: 'var(--nav-display, flex)' }}>
      <div className="flex items-center justify-evenly w-full py-2 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 py-2 px-3 min-w-[52px] text-center transition-all duration-300 rounded-2xl',
                isActive
                  ? 'text-white'
                  : 'text-primary-foreground/60 hover:text-primary-foreground/80'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300',
                  isActive 
                    ? 'bg-white/20 text-white shadow-lg' 
                    : 'text-primary-foreground/60'
                )}>
                  <item.icon 
                    className="h-5 w-5"
                    strokeWidth={isActive ? 2.5 : 2} 
                  />
                </div>
                <span className={cn(
                  'text-[10px] font-bold uppercase tracking-wider leading-tight transition-colors duration-300',
                  isActive ? 'text-white' : 'text-primary-foreground/60'
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

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Terminal, 
  Settings, 
  Key, 
  Activity, 
  BookOpen, 
  CreditCard,
  ChevronRight
} from 'lucide-react';

export const DashboardSidebar = () => {
  const pathname = usePathname();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Hub', href: '/dashboard' },
    { icon: Activity, label: 'Pipeline', href: '/pipeline' },
    { icon: Key, label: 'API Keys', href: '/api-keys' },
    { icon: CreditCard, label: 'Usage', href: '/usage' },
    { icon: BookOpen, label: 'Docs', href: '/docs' },
  ];

  return (
    <aside className="w-64 border-r border-surface-overlay bg-surface-lvl1 flex flex-col h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-surface-overlay flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-neon-cyan flex items-center justify-center rounded-sm rotate-45">
            <span className="text-canvas font-bold -rotate-45 text-xl">V</span>
          </div>
          <span className="font-heading text-xl font-bold tracking-tight text-white">VEXT</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between p-3 rounded-md font-heading text-sm transition-all group ${
                isActive 
                  ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' 
                  : 'text-text-dim hover:text-text-primary hover:bg-surface-lvl2 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan neon-glow-cyan" />}
              {!isActive && <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-surface-overlay">
        <Link 
          href="/settings"
          className={`flex items-center gap-3 p-3 rounded-md text-text-dim hover:text-text-primary hover:bg-surface-lvl2 transition-all font-heading text-sm ${
            pathname === '/settings' ? 'text-text-primary bg-surface-lvl2' : ''
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
};

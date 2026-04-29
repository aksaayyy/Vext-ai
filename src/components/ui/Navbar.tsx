import Link from 'next/link';
import { Button } from './Button';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-surface-overlay">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-neon-cyan flex items-center justify-center rounded-sm rotate-45">
            <span className="text-canvas font-bold -rotate-45 text-xl">V</span>
          </div>
          <span className="font-heading text-2xl font-bold tracking-tight text-white">VEXT</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-heading font-medium text-text-secondary">
          <Link href="/pipeline" className="hover:text-neon-cyan transition-colors">Pipeline</Link>
          <Link href="/docs" className="hover:text-neon-cyan transition-colors">Docs</Link>
          <Link href="/pricing" className="hover:text-neon-cyan transition-colors">Pricing</Link>
          <Link href="/dashboard">
            <Button size="sm">Dashboard</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

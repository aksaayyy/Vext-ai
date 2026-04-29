'use client';

import { Navbar } from '@/components/ui/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn('credentials', { 
        email, 
        callbackUrl: '/dashboard',
        redirect: true 
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas scanlines flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 blur-3xl opacity-50 pointer-events-none" />
          
          <Card className="relative border-t-4 border-t-neon-cyan">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-surface-lvl2 border border-surface-overlay rounded-xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-neon-cyan" />
              </div>
              <h1 className="text-3xl font-heading font-bold text-white mb-2">Initialize Session</h1>
              <p className="text-text-dim text-sm">Enter your credentials to access the intelligence hub.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-text-dim uppercase tracking-widest mb-2">Corporate Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.so" 
                    required
                    className="w-full bg-surface-lvl2 border border-surface-overlay rounded-md pl-10 pr-4 py-3 text-sm focus:border-neon-cyan/50 focus:outline-none transition-all text-white"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full py-6 text-lg group" loading={loading}>
                Continue to Dashboard
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-surface-overlay text-center">
              <p className="text-xs text-text-dim">
                By continuing, you agree to the 
                <a href="#" className="text-text-secondary hover:text-neon-cyan mx-1 underline">Terms of Service</a> 
                and 
                <a href="#" className="text-text-secondary hover:text-neon-cyan mx-1 underline">Privacy Policy</a>.
              </p>
            </div>
          </Card>

          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
              <span className="text-[10px] uppercase tracking-widest text-text-dim font-bold">Systems Nominal</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-surface-overlay" />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-widest text-text-dim font-bold">Node: VX-PROD-01</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import { Activity, Loader2 } from 'lucide-react';
import { Card } from './Card';

interface QueueStatusProps {
  activeJobs: number;
}

export function QueueStatus({ activeJobs }: QueueStatusProps) {
  if (activeJobs === 0) return null;

  return (
    <div className="mb-8 animate-in slide-in-from-top duration-500">
      <div className="bg-neon-purple/5 border border-neon-purple/20 rounded-md p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Activity className="w-5 h-5 text-neon-purple" />
            <div className="absolute inset-0 text-neon-purple animate-ping opacity-20">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div>
            <p className="text-sm text-white font-heading font-bold uppercase tracking-wider">Active Neural Pipeline</p>
            <p className="text-xs text-text-dim">{activeJobs} job{activeJobs > 1 ? 's' : ''} currently being analyzed by VEXT Neural Engine.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-neon-purple/10 rounded-full border border-neon-purple/20">
          <Loader2 className="w-3 h-3 text-neon-purple animate-spin" />
          <span className="text-[10px] font-bold text-neon-purple uppercase tracking-widest">Processing</span>
        </div>
      </div>
    </div>
  );
}

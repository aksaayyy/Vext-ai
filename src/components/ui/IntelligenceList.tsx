'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Clock, CheckCircle2, MoreHorizontal, Loader2 } from 'lucide-react';

interface ExtractionItem {
  id: string;
  title: string;
  date: string;
  type: string;
  status: string;
  shareId?: string;
}

export function IntelligenceList({ initialItems }: { initialItems: ExtractionItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);

  // Poll for updates if there are any processing jobs
  useEffect(() => {
    const hasProcessing = initialItems.some(item => item.status === 'Processing' || item.status === 'Queued');
    
    if (hasProcessing) {
      const interval = setInterval(() => {
        router.refresh();
      }, 5000); // Poll every 5s
      return () => clearInterval(interval);
    }
  }, [initialItems, router]);

  if (initialItems.length === 0) {
    return (
      <div className="text-center py-20 bg-surface-lvl1/50 rounded-lg border border-dashed border-surface-overlay">
        <p className="text-text-dim italic">No extractions found. Queue your first video above.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {initialItems.map((item) => (
        <Card key={item.id} level={1} className="flex items-center justify-between py-4 group">
          <div className="flex items-center gap-6">
            <div className={`w-1 h-10 rounded-full ${
              item.status === 'Processing' ? 'bg-neon-purple animate-pulse' : 
              item.status === 'Failed' ? 'bg-red-500' :
              item.status === 'Queued' ? 'bg-yellow-500' :
              'bg-neon-cyan'
            }`} />
            <div>
              <h4 className="text-white font-medium group-hover:text-neon-cyan transition-colors">{item.title}</h4>
              <div className="flex items-center gap-4 text-xs text-text-dim mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {item.date}
                </span>
                <span className="bg-surface-lvl2 px-2 py-0.5 rounded border border-surface-overlay text-text-secondary uppercase text-[10px] tracking-widest font-bold">
                  {item.type}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right mr-2 flex items-center gap-2">
              {item.status === 'Processing' && <Loader2 className="w-3 h-3 text-neon-purple animate-spin" />}
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                item.status === 'Processing' ? 'text-neon-purple' : 
                item.status === 'Failed' ? 'text-red-500' :
                item.status === 'Queued' ? 'text-yellow-500' :
                'text-neon-green'
              }`}>
                {item.status}
              </span>
            </div>
            
            {item.shareId ? (
              <Button variant="secondary" size="sm" asChild className="neon-glow-cyan/20">
                <a href={`/card/${item.shareId}`}>View Results</a>
              </Button>
            ) : item.status === 'Completed' ? (
              <span className="text-[10px] text-text-dim italic">Finalizing SIG...</span>
            ) : null}

            <Button variant="ghost" size="sm" className="p-2 min-w-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}

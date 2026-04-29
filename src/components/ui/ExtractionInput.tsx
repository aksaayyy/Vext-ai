'use client';

import { useState, useEffect } from 'react';
import { Video, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createExtractionJob } from '@/lib/actions/dashboard';
import { useRouter } from 'next/navigation';

export function ExtractionInput() {
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [estTime, setEstTime] = useState(45); // Default 45s
  const router = useRouter();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isProcessing && estTime > 0) {
      timer = setInterval(() => {
        setEstTime((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isProcessing, estTime]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsProcessing(true);
    setEstTime(45); 

    try {
      const job = await createExtractionJob(url);
      setUrl('');
      
      // Wait for the router to refresh and the list to update
      // We'll keep the processing state active for a bit longer
      router.refresh();
      
      // Transition to a "Queued" success state briefly
      setTimeout(() => {
        setIsProcessing(false);
      }, 3000);
      
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="mb-12 border border-neon-cyan/20 bg-neon-cyan/[0.02] p-6 rounded-md relative overflow-hidden">
      {/* Processing Overlay Effect */}
      {isProcessing && (
        <div className="absolute inset-0 bg-canvas/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="relative">
            <Loader2 className="w-12 h-12 text-neon-cyan animate-spin" />
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-neon-purple animate-pulse" />
          </div>
          <p className="mt-4 text-white font-heading font-bold uppercase tracking-widest text-sm">Initializing Neural Pipeline</p>
          <p className="mt-2 text-neon-cyan font-code text-xs">EST COMPLETE: {estTime}s</p>
        </div>
      )}

      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-md bg-neon-cyan/10 flex items-center justify-center flex-shrink-0">
          <Video className="w-8 h-8 text-neon-cyan" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl text-white mb-1">Queue Intelligence Extraction</h3>
          <p className="text-text-dim text-sm mb-4">Paste a YouTube or Instagram Reels URL to begin the "Video-to-Execution" pipeline.</p>
          
          <form onSubmit={handleSubmit} className="flex gap-4">
            <input 
              type="text" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=... or https://instagram.com/reel/..." 
              required
              className="flex-1 bg-surface-lvl2 border border-surface-overlay rounded-md px-4 py-3 text-sm font-code focus:outline-none focus:border-neon-cyan transition-colors text-white"
            />
            <Button type="submit" loading={isProcessing}>
              Process
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

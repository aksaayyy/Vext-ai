import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Terminal } from '@/components/ui/Terminal';
import { Play, Cpu, Code2, Box, ArrowRight, Layers } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { auth } from '@/auth';

export default async function PipelinePage() {
  const session = await auth();
  
  // Fetch the most recent active or completed job
  const activeJob = await prisma.processingJob.findFirst({
    where: { userId: session?.user?.id },
    orderBy: { createdAt: 'desc' },
  });

  const status = activeJob?.status || 'idle';
  const isProcessing = status === 'processing' || status === 'queued';

  return (
    <>
      <header className="mb-12">
        <h1 className="text-3xl font-heading font-bold mb-1 text-white">Processing Pipeline</h1>
        <p className="text-text-dim text-sm">Visualizing real-time video-to-execution data flows.</p>
      </header>

      {/* Pipeline Visualization */}
      <div className="relative mb-16 p-12 bg-surface-lvl1/30 rounded-xl border border-surface-overlay">
        <div className="absolute inset-0 bg-neon-cyan/[0.02] pointer-events-none" />
        
        <div className="flex items-center justify-between relative z-10">
          {/* Node 1: Video Ingest */}
          <div className="flex flex-col items-center gap-4">
            <div className={`w-20 h-20 rounded-full bg-surface-lvl2 border-2 ${isProcessing ? 'border-neon-cyan neon-glow-cyan' : 'border-surface-overlay'} flex items-center justify-center transition-all duration-500`}>
              <Play className={`w-8 h-8 ${isProcessing ? 'text-neon-cyan fill-neon-cyan/20' : 'text-text-dim'}`} />
            </div>
            <div className="text-center">
              <p className="font-heading font-bold text-sm text-white">INGEST</p>
              <p className="text-[10px] text-text-dim uppercase tracking-widest">Video Stream</p>
            </div>
          </div>

          {/* Connection 1 */}
          <div className="flex-1 px-4">
            <div className={`data-flow-line ${isProcessing ? 'bg-neon-cyan/20' : 'bg-surface-overlay'}`}>
              {isProcessing && <div className="data-flow-pulse" />}
            </div>
          </div>

          {/* Node 2: Neural Parse */}
          <div className="flex flex-col items-center gap-4">
            <div className={`w-20 h-20 rounded-full bg-surface-lvl2 border-2 ${status === 'processing' ? 'border-neon-purple shadow-[0_0_20px_-5px_rgba(176,132,255,0.3)]' : 'border-surface-overlay'} flex items-center justify-center transition-all duration-500`}>
              <Cpu className={`w-8 h-8 ${status === 'processing' ? 'text-neon-purple' : 'text-text-dim'}`} />
            </div>
            <div className="text-center">
              <p className="font-heading font-bold text-sm text-white">NEURAL</p>
              <p className="text-[10px] text-text-dim uppercase tracking-widest">Logic Extraction</p>
            </div>
          </div>

          {/* Connection 2 */}
          <div className="flex-1 px-4">
            <div className={`data-flow-line ${status === 'processing' ? 'bg-neon-purple/20' : 'bg-surface-overlay'}`}>
              {status === 'processing' && <div className="data-flow-pulse" style={{ animationDelay: '0.5s' }} />}
            </div>
          </div>

          {/* Node 3: Synthesis */}
          <div className="flex flex-col items-center gap-4">
            <div className={`w-20 h-20 rounded-full bg-surface-lvl2 border-2 ${status === 'completed' ? 'border-neon-green shadow-[0_0_20px_-5px_rgba(0,255,136,0.3)]' : 'border-surface-overlay'} flex items-center justify-center transition-all duration-500`}>
              <Code2 className={`w-8 h-8 ${status === 'completed' ? 'text-neon-green' : 'text-text-dim'}`} />
            </div>
            <div className="text-center">
              <p className="font-heading font-bold text-sm text-white">SYNTHESIS</p>
              <p className="text-[10px] text-text-dim uppercase tracking-widest">Code Generation</p>
            </div>
          </div>

          {/* Connection 3 */}
          <div className="flex-1 px-4">
            <div className={`data-flow-line ${status === 'completed' ? 'bg-neon-green/20' : 'bg-surface-overlay'}`}>
              {status === 'completed' && <div className="data-flow-pulse" style={{ animationDelay: '1s' }} />}
            </div>
          </div>

          {/* Node 4: Export */}
          <div className="flex flex-col items-center gap-4">
            <div className={`w-20 h-20 rounded-full bg-surface-lvl2 border-2 ${status === 'completed' ? 'border-white/50' : 'border-surface-overlay'} flex items-center justify-center transition-all duration-500`}>
              <Box className={`w-8 h-8 ${status === 'completed' ? 'text-white' : 'text-text-dim'}`} />
            </div>
            <div className="text-center">
              <p className="font-heading font-bold text-sm text-white">PACK</p>
              <p className="text-[10px] text-text-dim uppercase tracking-widest">Execution Bundle</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Logs / Detail */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-heading font-bold flex items-center gap-2 text-white">
              <Layers className="w-4 h-4 text-neon-cyan" />
              Extraction Lifecycle
            </h3>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${isProcessing ? 'bg-neon-green/10 text-neon-green animate-pulse' : 'bg-surface-lvl2 text-text-dim'}`}>
              {status}
            </span>
          </div>
          
          <Terminal 
            code={activeJob ? `[ID: ${activeJob.id.slice(0, 8)}] 
[SOURCE: ${activeJob.videoUrl}]
[STATUS: ${status.toUpperCase()}]
${activeJob.startedAt ? `[STARTED: ${activeJob.startedAt.toISOString()}]` : ''}
${activeJob.errorMessage ? `[ERROR: ${activeJob.errorMessage}]` : ''}
${activeJob.transcription ? `[TRANSCRIPTION: Available (${activeJob.transcription.slice(0, 50)}...)]` : '[LOGS: Waiting for stream...]'}
` : 'No active jobs in the pipeline. Start an extraction from the Hub.'}
            className="h-[300px]"
          />
        </Card>

        <div className="flex flex-col gap-6">
          <Card level={2}>
            <h4 className="font-heading font-bold mb-2 text-white">Multi-Model Analysis</h4>
            <p className="text-sm text-text-dim mb-4">Current verification agreement across Groq, NVIDIA, and OpenRouter layers.</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-2 bg-surface-lvl1 rounded-full overflow-hidden">
                <div className={`h-full bg-neon-cyan transition-all duration-1000 ${status === 'completed' ? 'w-[98%]' : isProcessing ? 'w-[45%]' : 'w-0'}`} />
              </div>
              <span className="text-xs font-code text-neon-cyan">{status === 'completed' ? '98%' : isProcessing ? '45%' : '0%'} Consensus</span>
            </div>
          </Card>

          <Card level={2}>
            <h4 className="font-heading font-bold mb-2 text-white">Metadata</h4>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-text-dim uppercase tracking-wider">Video Title</span>
                <span className="text-white font-medium">{activeJob?.title || 'Unknown'}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-text-dim uppercase tracking-wider">Duration</span>
                <span className="text-white font-medium">{activeJob?.durationSeconds ? `${Math.floor(activeJob.durationSeconds / 60)}m ${activeJob.durationSeconds % 60}s` : 'Unknown'}</span>
              </div>
            </div>
          </Card>

          <Button className="w-full py-6 text-lg" disabled={status !== 'completed'}>
            View Final Card
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </>
  );
}

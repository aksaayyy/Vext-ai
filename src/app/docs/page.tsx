import { Navbar } from '@/components/ui/Navbar';
import { Card } from '@/components/ui/Card';
import { Terminal } from '@/components/ui/Terminal';
import { Book, Code, Zap, Cpu, Server } from 'lucide-react';

export default function DocsPage() {
  const sections = [
    { icon: Zap, title: 'Quick Start', description: 'Begin your first extraction in under 60 seconds.' },
    { icon: Code, title: 'SDK References', description: 'Deep dive into Node.js, Python, and Go libraries.' },
    { icon: Cpu, title: 'Model Tuning', description: 'Configure GPT-4o vs Claude 3.5 weights.' },
    { icon: Server, title: 'Webhooks', description: 'Real-time event integration for CI/CD pipelines.' },
  ];

  return (
    <div className="min-h-screen bg-canvas pt-16">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-[250px_1fr] gap-16">
        {/* Sidebar Nav */}
        <aside className="hidden md:block">
          <div className="sticky top-24">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-6">Introduction</h4>
            <nav className="flex flex-col gap-3 text-sm">
              <a href="#" className="text-neon-cyan font-medium">What is VEXT?</a>
              <a href="#" className="text-text-dim hover:text-white transition-colors">Architecture</a>
              <a href="#" className="text-text-dim hover:text-white transition-colors">Fidelity Metrics</a>
            </nav>

            <h4 className="text-xs font-bold uppercase tracking-widest text-white mt-10 mb-6">API Core</h4>
            <nav className="flex flex-col gap-3 text-sm">
              <a href="#" className="text-text-dim hover:text-white transition-colors">Authentication</a>
              <a href="#" className="text-text-dim hover:text-white transition-colors">Endpoints</a>
              <a href="#" className="text-text-dim hover:text-white transition-colors">Rate Limits</a>
            </nav>
          </div>
        </aside>

        {/* Content */}
        <div className="max-w-3xl">
          <div className="mb-12">
            <div className="flex items-center gap-2 text-neon-cyan mb-4">
              <Book className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-widest">Documentation</span>
            </div>
            <h1 className="text-5xl font-heading font-bold text-white mb-6">Build with Intelligence</h1>
            <p className="text-xl text-text-secondary leading-relaxed">
              VEXT provides a set of highly-specialized APIs to extract structural logic from video data. 
              Whether you're building a developer portal or an automated testing suite, VEXT is the engine for video-to-code.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {sections.map((section) => (
              <Card key={section.title} className="hover:border-neon-cyan/30 border border-transparent transition-all">
                <section.icon className="w-6 h-6 text-neon-cyan mb-4" />
                <h4 className="font-heading font-bold text-white mb-2">{section.title}</h4>
                <p className="text-sm text-text-dim">{section.description}</p>
              </Card>
            ))}
          </div>

          <section className="mb-16">
            <h2 className="text-3xl font-heading font-bold text-white mb-6">Authentication</h2>
            <p className="text-text-secondary mb-6">
              All API requests must include your Bearer token in the <code className="text-neon-cyan bg-surface-lvl1 px-1 rounded">Authorization</code> header.
            </p>
            <Terminal 
              code={`# Set your VEXT_API_KEY as an env variable
export VEXT_API_KEY='vx_live_...'

# Request intelligence
curl https://api.vext.so/v1/user \\
  -H "Authorization: Bearer $VEXT_API_KEY"`}
            />
          </section>

          <section>
            <h2 className="text-3xl font-heading font-bold text-white mb-6">Fidelity Levels</h2>
            <p className="text-text-secondary mb-6">
              VEXT supports three levels of extraction fidelity, ranging from quick summaries to deep logic analysis.
            </p>
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-surface-lvl1 rounded border border-surface-overlay flex justify-between items-center">
                <div>
                  <span className="font-bold text-white block">Standard</span>
                  <span className="text-xs text-text-dim italic">OCR + Basic NLP</span>
                </div>
                <span className="text-xs font-code text-text-secondary">Latency: ~200ms</span>
              </div>
              <div className="p-4 bg-surface-lvl1 rounded border border-neon-purple/30 flex justify-between items-center ring-1 ring-neon-purple/10">
                <div>
                  <span className="font-bold text-white block">High Fidelity</span>
                  <span className="text-xs text-text-dim italic">Multi-Model + Logic Check</span>
                </div>
                <span className="text-xs font-code text-neon-purple">Latency: ~420ms</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

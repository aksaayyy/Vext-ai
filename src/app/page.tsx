import { Navbar } from '@/components/ui/Navbar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Terminal } from '@/components/ui/Terminal';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-canvas scanlines pt-16">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-neon-cyan/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-lvl2 border border-surface-overlay mb-8">
            <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
            <span className="text-xs font-heading font-bold uppercase tracking-widest text-neon-green">Intelligence v2.4 Live</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl mb-8 leading-[0.9]">
            Turn Any Video into <br />
            <span className="text-neon-cyan neon-glow-cyan">Execution.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-text-secondary max-w-3xl mx-auto mb-12 font-body leading-relaxed">
            VEXT extracts high-fidelity code, configuration, and structural logic from video tutorials and demos. Move from screen to script in seconds.
          </p>
          
          <div className="flex flex-wrap justify-center gap-6">
            <Link href="/dashboard">
              <Button size="lg">Start Extracting</Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="ghost">View API Docs</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-surface-lvl1/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-md bg-neon-cyan/10 flex items-center justify-center text-neon-cyan">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl text-white">Multi-Model Intelligence</h3>
              <p className="text-text-secondary">Synchronized analysis using GPT-4o and Claude 3.5 to cross-verify extracted logic and configuration flags.</p>
            </Card>

            <Card className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-md bg-neon-purple/10 flex items-center justify-center text-neon-purple">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl text-white">Execution Pack Generator</h3>
              <p className="text-text-secondary">Instantly generates Dockerfiles, Terraform scripts, and CLI commands found within the video stream.</p>
            </Card>

            <Card className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-md bg-neon-green/10 flex items-center justify-center text-neon-green">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl text-white">Shareable Intelligence Cards</h3>
              <p className="text-text-secondary">Export summaries as technical documentation or interactive cards for engineering teams to review.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Code Section */}
      <section className="py-24 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-5xl mb-6">API-First. Always.</h2>
            <p className="text-xl text-text-secondary mb-8">
              Integrate the VEXT engine directly into your CI/CD pipelines. Automate tutorial ingestion for internal wiki generation or automated testing.
            </p>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 text-neon-cyan">
                <div className="w-6 h-px bg-neon-cyan" />
                <span className="font-code text-sm">cURL-ready endpoint</span>
              </div>
              <div className="flex items-center gap-4 text-text-dim">
                <div className="w-6 h-px bg-text-dim" />
                <span className="font-code text-sm">420ms average extraction time</span>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-4 bg-neon-cyan/10 blur-2xl rounded-lg" />
            <Terminal 
              code={`curl -X POST https://api.vext.so/v1/extract \\
  -H "Authorization: Bearer $VEXT_API_KEY" \\
  -d '{
    "source": "https://youtu.be/dQw4w9WgXcQ",
    "format": "terraform",
    "high_fidelity": true
  }'

// Output arriving in 420ms...`}
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-surface-overlay">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between gap-12">
          <div>
            <div className="font-heading font-bold text-2xl mb-4">VEXT</div>
            <p className="text-text-dim max-w-xs text-sm italic">
              Made for builders who ship.<br />
              © 2024 VEXT SYSTEMS // VIDEO-TO-EXECUTION INTERFACE
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white mb-2">Platform</span>
              <Link href="/pricing" className="text-sm text-text-dim hover:text-neon-cyan">Pricing</Link>
              <Link href="/features" className="text-sm text-text-dim hover:text-neon-cyan">Features</Link>
              <Link href="/enterprise" className="text-sm text-text-dim hover:text-neon-cyan">Enterprise</Link>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white mb-2">Developers</span>
              <Link href="/docs" className="text-sm text-text-dim hover:text-neon-cyan">Documentation</Link>
              <Link href="/github" className="text-sm text-text-dim hover:text-neon-cyan">GitHub</Link>
              <Link href="/status" className="text-sm text-text-dim hover:text-neon-cyan">Status</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

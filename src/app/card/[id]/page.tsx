import { Navbar } from '@/components/ui/Navbar';
import { Card as CardUI } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DownloadButton } from '@/components/ui/DownloadButton';
import { CopyButton } from '@/components/ui/CopyButton';
import { AgentZipButton } from '@/components/ui/AgentZipButton';
import { Terminal } from '@/components/ui/Terminal';
import { 
  Download, Share2, Shield, Box, FileCode, CheckCircle2, 
  Copy, ListChecks, Lightbulb, TrendingUp, Target, 
  Users, Microscope, Scale, Quote, AlertCircle, Zap,
  Globe, Rocket, Landmark, Database
} from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { notFound } from 'next/navigation';

export default async function CardViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const card = await prisma.card.findUnique({
    where: { shareId: id },
  });

  if (!card) notFound();

  const output = card.output as any;
  const classification = card.classification;

  // Check if it's a God Mode Blueprint
  const isBlueprint = classification === 'saas/blueprint' || !!output.core_opportunity;

  return (
    <div className="min-h-screen bg-canvas scanlines pt-16 pb-24">
      <Navbar />
      
      <main className="max-w-5xl mx-auto px-6 py-16">
        {/* Header Section */}
        <header className="mb-12 border-b border-surface-overlay pb-8 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-2 py-0.5 rounded bg-neon-cyan/10 border border-neon-cyan/30 text-[10px] font-bold text-neon-cyan uppercase tracking-widest animate-pulse">
                God Mode Active
              </span>
              <span className="text-text-dim text-[10px] uppercase tracking-widest font-code">
                BLUEPRINT-{card.shareId.toUpperCase()}
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4 text-white leading-tight">
              {isBlueprint ? output.core_opportunity?.problem_statement?.split('–')[0] || 'SaaS Intelligence' : (output.title || card.title || 'Extracted Intelligence')}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-text-dim">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-neon-cyan" />
                <span className="uppercase tracking-wider font-bold">Vext Intelligence v2.0</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-neon-purple" />
                <span>Logic Fidelity: 100% (High Confidence)</span>
              </div>
            </div>
          </div>
          
          {isBlueprint && (
            <div className="shrink-0 mt-4 md:mt-0">
              <AgentZipButton output={output} shareId={card.shareId} />
            </div>
          )}
        </header>

        {isBlueprint ? (
          <div className="grid gap-16">
            {/* 1. CORE OPPORTUNITY */}
            <div className="grid md:grid-cols-2 gap-8">
              <Section icon={Lightbulb} title="Core Opportunity" color="text-neon-cyan">
                <div className="bg-surface-lvl1 p-6 rounded-lg border border-surface-overlay space-y-4">
                  <div>
                    <p className="text-[10px] uppercase text-text-dim mb-1 font-bold">Problem Statement</p>
                    <p className="text-white text-lg">{output.core_opportunity.problem_statement}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-text-dim mb-1 font-bold">Market Gap</p>
                    <p className="text-text-secondary">{output.core_opportunity.gap_in_market}</p>
                  </div>
                </div>
              </Section>
              <Section icon={Globe} title="Market Analysis" color="text-neon-green">
                <div className="bg-surface-lvl2 p-6 rounded-lg border border-surface-overlay h-full">
                  <div className="mb-6">
                    <p className="text-[10px] uppercase text-text-dim mb-1 font-bold text-center">Target Market</p>
                    <p className="text-3xl text-neon-green font-heading font-bold text-center">{output.core_opportunity.target_market}</p>
                  </div>
                  <p className="text-[10px] uppercase text-text-dim mb-2 font-bold">Existing Solutions</p>
                  <div className="flex flex-wrap gap-2">
                    {output.core_opportunity.existing_solutions.map((s: string) => (
                      <span key={s} className="px-3 py-1 bg-surface-lvl1 rounded border border-surface-overlay text-xs text-text-secondary italic">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </Section>
            </div>

            {/* 2. TECHNICAL BLUEPRINT */}
            <Section icon={Database} title="Technical Architecture" color="text-neon-purple">
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-surface-lvl1 rounded-lg border border-surface-overlay p-6">
                    <p className="text-[10px] uppercase text-text-dim mb-4 font-bold">Recommended Stack</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {output.technical_blueprint.recommended_stack.map((item: string) => (
                        <div key={item} className="p-3 bg-surface-lvl2 rounded border border-surface-overlay text-center text-xs text-white font-bold uppercase tracking-wider">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-surface-lvl1 rounded-lg border border-surface-overlay p-6">
                    <p className="text-[10px] uppercase text-text-dim mb-4 font-bold">External APIs</p>
                    <div className="flex flex-wrap gap-3">
                      {output.technical_blueprint.external_apis.map((api: string) => (
                        <span key={api} className="px-4 py-2 bg-neon-purple/10 border border-neon-purple/30 rounded text-xs text-neon-purple font-bold">
                          {api}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="bg-surface-lvl1 rounded-lg border border-surface-overlay p-6 h-full">
                  <p className="text-[10px] uppercase text-text-dim mb-4 font-bold">Data Model</p>
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {output.technical_blueprint.data_model.tables_or_collections.map((t: string) => (
                        <span key={t} className="px-2 py-1 bg-surface-lvl2 rounded border border-surface-overlay text-[10px] text-text-dim font-code">
                          {t}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-text-secondary italic pt-2 border-t border-surface-overlay">
                      {output.technical_blueprint.data_model.key_relationships}
                    </p>
                  </div>
                </div>
              </div>
            </Section>

            {/* 3. AI ENGINE (PROMPTS) */}
            <Section icon={Zap} title="AI Intelligence Engine" color="text-neon-cyan">
              <div className="space-y-8">
                {output.technical_blueprint.prompts_to_generate.map((p: any, i: number) => (
                  <div key={i} className="space-y-4">
                    <div className="bg-surface-lvl1 rounded-lg border border-surface-overlay overflow-hidden">
                      <div className="px-4 py-2 bg-surface-lvl2 border-b border-surface-overlay flex justify-between items-center">
                        <span className="text-[10px] text-neon-cyan font-bold uppercase tracking-widest">System Prompt {i + 1}</span>
                        <CopyButton content={p.system_prompt_text} />
                      </div>
                      <div className="p-4 text-sm text-text-secondary font-code bg-surface-lvl1/50 whitespace-pre-wrap leading-relaxed">
                        {p.system_prompt_text}
                      </div>
                    </div>
                    <div className="bg-surface-lvl1 rounded-lg border border-surface-overlay overflow-hidden">
                      <div className="px-4 py-2 bg-surface-lvl2 border-b border-surface-overlay flex justify-between items-center">
                        <span className="text-[10px] text-text-dim font-bold uppercase tracking-widest">User Template</span>
                        <CopyButton content={p.user_prompt_template} />
                      </div>
                      <div className="p-4 text-sm text-text-dim font-code bg-surface-lvl1/50">
                        {p.user_prompt_template}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* 4. BUSINESS MODEL */}
            <div className="grid lg:grid-cols-2 gap-8">
              <Section icon={Landmark} title="Business Model" color="text-neon-green">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-surface-lvl1 p-4 rounded border border-surface-overlay">
                    <p className="text-[10px] uppercase text-text-dim mb-3 font-bold">Revenue Streams</p>
                    <ul className="space-y-1">
                      {output.business_model.revenue_streams.map((r: string) => (
                        <li key={r} className="text-xs text-white flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-neon-green" /> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-surface-lvl1 p-4 rounded border border-surface-overlay">
                    <p className="text-[10px] uppercase text-text-dim mb-3 font-bold">Pricing Models</p>
                    <ul className="space-y-1">
                      {output.business_model.pricing_models.map((p: string) => (
                        <li key={p} className="text-xs text-white flex items-center gap-2">
                          <Landmark className="w-3 h-3 text-neon-cyan" /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Section>
              <Section icon={TrendingUp} title="Unit Economics" color="text-neon-cyan">
                <div className="grid grid-cols-3 gap-4 h-full">
                  <MetricCard label="CAC" value={`$${output.business_model.unit_economics.cac_estimate}`} color="text-neon-cyan" />
                  <MetricCard label="LTV" value={`$${output.business_model.unit_economics.ltv_estimate}`} color="text-neon-green" />
                  <MetricCard label="Payback" value={output.business_model.unit_economics.payback_period} color="text-neon-purple" />
                </div>
              </Section>
            </div>

            {/* 5. MOAT & EXECUTION */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <Section icon={Rocket} title="Execution Roadmap" color="text-neon-cyan">
                  <div className="space-y-4">
                    <RoadmapItem month="Month 1: MVP" tasks={output.execution_roadmap.month_1_mvp} />
                    <RoadmapItem month="Month 2: Traction" tasks={output.execution_roadmap.month_2_traction} />
                    <RoadmapItem month="Month 3: Scale" tasks={output.execution_roadmap.month_3_scale} />
                  </div>
                </Section>
              </div>
              <Section icon={Shield} title="The Moat" color="text-neon-purple">
                <div className="bg-surface-lvl1 p-6 rounded-lg border border-surface-overlay h-full space-y-6">
                  <div>
                    <p className="text-[10px] uppercase text-text-dim mb-2 font-bold">Switching Costs</p>
                    <p className="text-sm text-text-secondary">{output.moat_analysis.switching_costs}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-text-dim mb-2 font-bold">Brand Advantage</p>
                    <p className="text-sm text-text-secondary">{output.moat_analysis.brand_advantage}</p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 text-center p-2 rounded bg-surface-lvl2 border border-surface-overlay">
                      <p className="text-[8px] uppercase text-text-dim mb-1">Network</p>
                      <p className={`text-[10px] font-bold ${output.moat_analysis.network_effects ? 'text-neon-green' : 'text-text-dim'}`}>
                        {output.moat_analysis.network_effects ? 'YES' : 'NO'}
                      </p>
                    </div>
                    <div className="flex-1 text-center p-2 rounded bg-surface-lvl2 border border-surface-overlay">
                      <p className="text-[8px] uppercase text-text-dim mb-1">Data Net</p>
                      <p className={`text-[10px] font-bold ${output.moat_analysis.data_network_effects ? 'text-neon-green' : 'text-text-dim'}`}>
                        {output.moat_analysis.data_network_effects ? 'YES' : 'NO'}
                      </p>
                    </div>
                  </div>
                </div>
              </Section>
            </div>

            {/* 6. STARTER LOGIC */}
            <Section icon={FileCode} title="Implementation Script" color="text-neon-cyan">
              <Terminal code={output.technical_blueprint.starter_code_snippet} />
            </Section>

            {/* 7. ASSETS */}
            <Section icon={Box} title="Generated Files" color="text-neon-dim">
              <div className="grid sm:grid-cols-2 gap-4">
                {output.generated_files.scripts.map((f: any) => (
                  <div key={f.filename} className="bg-surface-lvl1 p-4 rounded border border-surface-overlay flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileCode className="w-4 h-4 text-neon-purple" />
                      <span className="text-xs text-white font-code">{f.filename}</span>
                    </div>
                    <DownloadButton filename={f.filename} content={f.content} />
                  </div>
                ))}
                {output.generated_files.configs.map((f: any) => (
                  <div key={f.filename} className="bg-surface-lvl1 p-4 rounded border border-surface-overlay flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Box className="w-4 h-4 text-neon-cyan" />
                      <span className="text-xs text-white font-code">{f.filename}</span>
                    </div>
                    <DownloadButton filename={f.filename} content={f.content} />
                  </div>
                ))}
              </div>
            </Section>
          </div>
        ) : (
          /* LEGACY RENDERING (Fallback) */
          <div className="grid gap-16">
             <Section icon={AlertCircle} title="Intelligence Extraction" color="text-text-dim">
                <Terminal code={JSON.stringify(output, null, 2)} />
             </Section>
          </div>
        )}
      </main>
    </div>
  );
}

// UI HELPER COMPONENTS
function Section({ icon: Icon, title, children, color }: any) {
  return (
    <section>
      <h3 className={`text-xl font-heading font-bold text-white mb-6 flex items-center gap-3`}>
        <Icon className={`w-5 h-5 ${color}`} />
        {title}
      </h3>
      {children}
    </section>
  );
}

function MetricCard({ label, value, color }: any) {
  return (
    <div className="bg-surface-lvl1 p-4 rounded border border-surface-overlay flex flex-col justify-center items-center text-center">
      <p className="text-[10px] uppercase text-text-dim mb-1 font-bold">{label}</p>
      <p className={`text-xl font-heading font-bold ${color}`}>{value}</p>
    </div>
  );
}

function RoadmapItem({ month, tasks }: { month: string; tasks: string[] }) {
  return (
    <div className="bg-surface-lvl1 p-5 rounded-lg border border-surface-overlay">
      <h4 className="text-white font-bold mb-3 text-sm border-b border-surface-overlay pb-2">{month}</h4>
      <ul className="space-y-2">
        {tasks.map((task, i) => (
          <li key={i} className="text-xs text-text-secondary flex gap-3">
            <span className="text-neon-cyan font-code">0{i+1}</span> {task}
          </li>
        ))}
      </ul>
    </div>
  );
}

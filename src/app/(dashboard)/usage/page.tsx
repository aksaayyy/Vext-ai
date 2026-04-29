import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BarChart3, Globe, Zap, Bell, Plus } from 'lucide-react';

export default function UsagePage() {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const data = [40, 65, 30, 85, 45, 90, 75];

  return (
    <>
      <header className="mb-12">
        <h1 className="text-3xl font-heading font-bold mb-1 text-white">Usage & Webhooks</h1>
        <p className="text-text-dim text-sm">Monitor intelligence consumption and external event triggers.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Usage Chart Placeholder */}
        <Card className="lg:col-span-2 h-[400px] flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-heading font-bold flex items-center gap-2 text-white">
              <BarChart3 className="w-4 h-4 text-neon-cyan" />
              Extraction Velocity
            </h3>
            <select className="bg-surface-lvl2 border border-surface-overlay text-xs px-2 py-1 rounded focus:outline-none text-text-secondary">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          
          <div className="flex-1 flex items-end gap-2 px-4 pb-8">
            {data.map((val, i) => (
              <div key={i} className="flex-1 group relative">
                <div 
                  className="w-full bg-neon-cyan/20 group-hover:bg-neon-cyan/40 transition-all rounded-t-sm" 
                  style={{ height: `${val}%` }}
                ></div>
                <div className="absolute bottom-[-24px] left-1/2 -translate-x-1/2 text-[10px] text-text-dim uppercase">
                  {days[i]}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quota */}
        <div className="flex flex-col gap-6">
          <Card level={2}>
            <p className="text-[10px] text-text-dim uppercase tracking-widest mb-2 font-bold">Credit Balance</p>
            <p className="text-4xl font-heading font-bold text-white mb-4">42,840</p>
            <div className="h-1 bg-surface-lvl1 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-neon-cyan w-[60%]"></div>
            </div>
            <p className="text-xs text-text-dim">60% of monthly quota remaining.</p>
          </Card>

          <Card level={2}>
            <p className="text-[10px] text-text-dim uppercase tracking-widest mb-2 font-bold">Active Subscriptions</p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-secondary">Pro Plan</span>
              <span className="text-[10px] font-bold text-neon-green uppercase tracking-widest px-2 py-0.5 border border-neon-green/30 rounded">Active</span>
            </div>
          </Card>

          <Button className="w-full">Upgrade Quota</Button>
        </div>
      </div>

      {/* Webhooks Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-heading font-bold flex items-center gap-2 text-white">
            <Globe className="w-5 h-5 text-neon-purple" />
            Webhook Endpoints
          </h2>
          <Button variant="secondary" size="sm">
            <Plus className="w-3 h-3 mr-2" />
            Add Endpoint
          </Button>
        </div>

        <div className="grid gap-4">
          <Card className="flex items-center justify-between border-l-4 border-l-neon-purple">
            <div className="flex items-center gap-6">
              <div className="w-10 h-10 rounded bg-surface-lvl2 flex items-center justify-center">
                <Zap className="w-5 h-5 text-neon-purple" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">CI/CD Production Trigger</h4>
                <p className="text-xs text-text-dim font-code mt-0.5">https://api.myapp.com/hooks/vext</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[10px] text-text-dim uppercase tracking-widest mb-1 font-bold">Success Rate</p>
                <p className="text-xs text-neon-green font-code">100%</p>
              </div>
              <Button variant="ghost" size="sm" className="p-2 min-w-0">
                <Bell className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}

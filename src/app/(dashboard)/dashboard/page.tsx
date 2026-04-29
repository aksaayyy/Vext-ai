import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Search, Plus, Filter, MoreHorizontal, Video, Clock, CheckCircle2 } from 'lucide-react';
import { getDashboardStats, getRecentExtractions } from '@/lib/actions/dashboard';
import { ExtractionInput } from '@/components/ui/ExtractionInput';
import { IntelligenceList } from '@/components/ui/IntelligenceList';
import { QueueStatus } from '@/components/ui/QueueStatus';
import { auth } from '@/auth';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  // Fetch real data from server actions
  const statsData = await getDashboardStats();
  const recentExtractions = await getRecentExtractions();

  const stats = [
    { label: 'Total Extractions', value: statsData.totalExtractions, icon: CheckCircle2, color: 'text-neon-cyan' },
    { label: 'Active Pipelines', value: statsData.activeJobs, icon: Clock, color: 'text-neon-purple' },
    { label: 'Intelligence Tokens', value: statsData.credits, icon: Filter, color: 'text-neon-green' },
  ];

  const activeJobsCount = parseInt(statsData.activeJobs) || 0;

  return (
    <>
      {/* Header */}
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-1 text-white">Intelligence Hub</h1>
          <p className="text-text-dim text-sm">Managing extraction cycles across all pipelines.</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[10px] bg-surface-lvl2 px-2 py-0.5 rounded border border-surface-overlay text-text-dim font-code uppercase">
              User ID: {userId || 'Not Logged In'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
            <input 
              type="text" 
              placeholder="Search extractions..." 
              className="bg-surface-lvl2 border border-surface-overlay rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-neon-cyan/50 transition-colors w-64 text-white"
            />
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Extraction
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center justify-between">
            <div>
              <p className="text-text-dim text-xs font-heading uppercase tracking-wider mb-1">{stat.label}</p>
              <p className="text-3xl font-heading font-bold text-white">{stat.value}</p>
            </div>
            <stat.icon className={`w-8 h-8 ${stat.color} opacity-80`} />
          </Card>
        ))}
      </div>

      {/* Active Queue Status */}
      <QueueStatus activeJobs={activeJobsCount} />

      {/* Extraction Input with UI Feedback & EST */}
      <ExtractionInput />

      {/* Extractions Table Header */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xl font-heading font-bold text-white">Recent Intelligence</h2>
        <Button variant="secondary" size="sm">
          <Filter className="w-3 h-3 mr-2" />
          Filter
        </Button>
      </div>

      {/* Recent Extractions List (with auto-polling) */}
      <IntelligenceList initialItems={recentExtractions} />
    </>
  );
}

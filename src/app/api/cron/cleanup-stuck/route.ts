import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { sendAlert } from '@/lib/monitoring/alerts';

export const dynamic = 'force-dynamic';

/**
 * CRON: Cleanup stuck jobs.
 * Runs every 10 minutes (configured in vercel.json).
 * Marks jobs in 'processing' for >30 minutes as 'failed'.
 */
export async function GET(req: NextRequest) {
  // Verify CRON_SECRET if present
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  try {
    // Find stuck jobs
    const stuckJobs = await prisma.processingJob.findMany({
      where: {
        status: 'processing',
        updatedAt: { lte: thirtyMinutesAgo }
      },
      select: { id: true }
    });

    if (stuckJobs.length === 0) {
      return NextResponse.json({ count: 0, message: 'No stuck jobs found' });
    }

    // Mark as failed
    const { count } = await prisma.processingJob.updateMany({
      where: {
        id: { in: stuckJobs.map(j => j.id) }
      },
      data: {
        status: 'failed',
        errorMessage: 'Job timed out after 30 minutes of processing',
      }
    });

    await sendAlert(
      `CRON: Cleaned up **${count}** stuck jobs that were processing for >30 minutes.`,
      'warn'
    );

    return NextResponse.json({ count, message: 'Cleaned up stuck jobs' });
  } catch (err: any) {
    console.error('Stuck job cleanup failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

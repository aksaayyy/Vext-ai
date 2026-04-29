import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    // First delete orphaned cards linked to failed jobs
    const failedJobs = await prisma.processingJob.findMany({
      where: {
        status: 'failed',
        createdAt: { lt: sevenDaysAgo },
      },
      select: { id: true },
    });

    const failedJobIds = failedJobs.map((j) => j.id);

    let deletedCards = 0;
    if (failedJobIds.length > 0) {
      const cardsResult = await prisma.card.deleteMany({
        where: { jobId: { in: failedJobIds } },
      });
      deletedCards = cardsResult.count;
    }

    // Delete the failed jobs
    const jobsResult = await prisma.processingJob.deleteMany({
      where: {
        status: 'failed',
        createdAt: { lt: sevenDaysAgo },
      },
    });

    const result = {
      deleted: {
        jobs: jobsResult.count,
        cards: deletedCards,
      },
      cutoffDate: sevenDaysAgo.toISOString(),
      ranAt: new Date().toISOString(),
    };

    console.log('Cron cleanup completed:', result);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Cron cleanup failed:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

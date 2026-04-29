import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// POST /api/auth/claim
// After sign-in, claim anonymous cards/jobs by anonSessionId
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id as string;
    const cookieStore = await cookies();
    const anonSessionId = cookieStore.get('vext_anon')?.value;

    if (!anonSessionId) {
      return NextResponse.json({ claimed: { jobs: 0, cards: 0 } });
    }

    // Backfill jobs
    const jobsResult = await prisma.processingJob.updateMany({
      where: { anonSessionId, userId: null },
      data: { userId },
    });

    // Backfill cards
    const cardsResult = await prisma.card.updateMany({
      where: { anonSessionId, userId: null },
      data: { userId },
    });

    return NextResponse.json({
      claimed: {
        jobs: jobsResult.count,
        cards: cardsResult.count,
      },
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Claim error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

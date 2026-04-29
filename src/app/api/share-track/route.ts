import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

const SHARES_FOR_BONUS = 3;
const BONUS_CREDITS = 5;

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  try {
    const { shareId } = await req.json();
    if (!shareId || typeof shareId !== 'string') {
      return NextResponse.json({ error: 'shareId required' }, { status: 400 });
    }

    const session = await auth();
    const userId = session?.user ? (session.user as any).id as string : null;
    const ip = getIp(req);

    // Avoid duplicate share events within the same session (debounce 60s)
    const recentDupe = await prisma.shareEvent.findFirst({
      where: {
        shareId,
        ...(userId ? { userId } : { ipAddress: ip }),
        createdAt: { gte: new Date(Date.now() - 60_000) },
      },
    });
    if (recentDupe) {
      return NextResponse.json({ counted: false, reason: 'debounced' });
    }

    // Record the share event
    await prisma.shareEvent.create({
      data: { shareId, userId, ipAddress: userId ? null : ip },
    });

    // Count total unique shares by this identity for this card
    const totalShares = await prisma.shareEvent.count({
      where: {
        shareId,
        ...(userId ? { userId } : { ipAddress: ip }),
      },
    });

    let bonusAwarded = false;

    // Award bonus every SHARES_FOR_BONUS threshold
    if (userId && totalShares % SHARES_FOR_BONUS === 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { bonusCredits: { increment: BONUS_CREDITS } },
      });
      bonusAwarded = true;
    }

    return NextResponse.json({
      counted: true,
      totalShares,
      bonusAwarded,
      bonusCredits: bonusAwarded ? BONUS_CREDITS : 0,
      nextBonusAt: SHARES_FOR_BONUS - (totalShares % SHARES_FOR_BONUS),
    });
  } catch (err: unknown) {
    console.error('share-track error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

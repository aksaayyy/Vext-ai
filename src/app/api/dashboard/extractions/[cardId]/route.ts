import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  try {
    const { cardId } = await params;

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      select: {
        id: true,
        title: true,
        classification: true,
        output: true,
        createdAt: true,
        shareId: true,
      },
    });

    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    const output = card.output as any;
    const techStack: string[] = output?.technical_blueprint?.recommended_stack || [];

    return NextResponse.json({
      id: card.id,
      title: card.title,
      classification: card.classification,
      techStack,
      concepts: [],
    });
  } catch (error: any) {
    console.error('Error fetching extraction:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

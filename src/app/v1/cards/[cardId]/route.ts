import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { verifyApiKey, apiError } from '@/lib/auth/api-key';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const apiKeyRecord = await verifyApiKey(req.headers.get('authorization'));
  if (!apiKeyRecord) return apiError('unauthorized', 401);

  const { cardId } = await params;

  const card = await prisma.card.findFirst({
    where: {
      shareId: cardId,
      // Only allow access to own cards via API key
      userId: apiKeyRecord.userId,
    },
    select: {
      id:             true,
      shareId:        true,
      title:          true,
      classification: true,
      output:         true,
      views:          true,
      createdAt:      true,
    },
  });

  if (!card) return apiError('card_not_found', 404, { cardId });

  // Increment view count
  prisma.card.update({ where: { id: card.id }, data: { views: { increment: 1 } } }).catch(() => {});

  return Response.json({
    cardId:         card.shareId,
    title:          card.title,
    classification: card.classification,
    output:         card.output,
    views:          card.views,
    shareUrl:       `https://vext.so/card/${card.shareId}`,
    exportUrl:      `https://vext.so/api/card/${card.shareId}/export`,
    createdAt:      card.createdAt,
  });
}

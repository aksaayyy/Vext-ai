import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSearchVolume, getInterestOverTime } from '@/lib/search-volume/trends';

export const dynamic = 'force-dynamic';

const QuerySchema = z.object({
  topic: z.string().min(1).max(200),
  type: z.enum(['trends', 'interest']).optional().default('trends'),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get('topic');
    const type = searchParams.get('type') || 'trends';

    if (!topic) {
      return NextResponse.json({ error: 'topic parameter is required' }, { status: 400 });
    }

    if (type === 'interest') {
      const interestData = await getInterestOverTime(topic);
      return NextResponse.json({ topic, interest_over_time: interestData });
    }

    const trendsData = await getSearchVolume(topic);
    return NextResponse.json(trendsData);
  } catch (error: any) {
    console.error('Search volume error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch search volume' },
      { status: 500 }
    );
  }
}

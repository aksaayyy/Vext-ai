import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { brainstormService } from '@/lib/brainstorm/service';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  title: z.string().min(1).max(300),
  transcript: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  concepts: z.array(z.string()).optional(),
  classification: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = BodySchema.parse(body);

    const result = await brainstormService.brainstorm({
      title: input.title,
      transcript: input.transcript,
      techStack: input.techStack,
      concepts: input.concepts,
      classification: input.classification,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors,
      }, { status: 400 });
    }
    console.error('Brainstorm error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate brainstorm' },
      { status: 500 }
    );
  }
}

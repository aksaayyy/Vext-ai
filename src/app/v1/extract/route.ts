import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  videoUrl: z.string().url({ message: 'videoUrl must be a valid URL' }),
  title: z.string().max(300).optional(),
  classification: z.enum([
    'saas/blueprint',
    'setup/tutorial',
    'strategy/framework',
    'tool demo',
    'finance/setup',
    'product teardown',
    'interview/talk',
    'research/paper',
    'debate/discussion'
  ]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoUrl, title, classification } = BodySchema.parse(body);

    const job = await prisma.processingJob.create({
      data: {
        videoUrl,
        title: title || null,
        status: 'queued',
      },
    });

    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('host');
    const baseUrl = `${protocol}://${host}`;

    fetch(`${baseUrl}/.netlify/functions/process-background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl, jobId: job.id, classification }),
    }).catch(err => console.error('[v1/extract] Failed to trigger background function:', err));

    return NextResponse.json({
      jobId: job.id,
      status: 'queued',
      message: 'Processing started. Poll GET /v1/jobs/{jobId} for status.',
    });

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.errors,
      }, { status: 400 });
    }
    console.error('Error in v1/extract:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
  }

  const job = await prisma.processingJob.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      title: true,
      errorMessage: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
    },
  });

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(job);
}

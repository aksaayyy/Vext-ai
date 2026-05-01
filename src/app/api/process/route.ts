import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { v4 as uuidv4 } from 'uuid';

/** Generate a random 8-char alphanumeric shareId (e.g. "aB3dF9xQ") */
function generateShareId(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, jobId: existingJobId } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 });
    }

    // 1. Get or Create Job
    let job;
    if (existingJobId) {
      job = await prisma.processingJob.findUnique({ where: { id: existingJobId } });
      console.log(`[API] Found existing job ${existingJobId}. User: ${job?.userId}`);
    }

    if (!job) {
      job = await prisma.processingJob.create({
        data: {
          videoUrl,
          status: 'queued',
        },
      });
    }

    // 2. Trigger Background Processing
    // We call the Netlify background function which has a 15-minute timeout
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    // We don't await this because background functions are asynchronous anyway
    fetch(`${baseUrl}/.netlify/functions/process-background`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoUrl, jobId: job.id }),
    }).catch(err => console.error('[API] Failed to trigger background function:', err));

    return NextResponse.json({
      jobId: job.id,
      status: 'processing',
    });

  } catch (error: any) {
    console.error('Error in process endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
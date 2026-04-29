'use server';

import { prisma } from '@/lib/db/client';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

/**
 * Trigger a new extraction job
 */
export async function createExtractionJob(videoUrl: string) {
  const session = await auth();
  let userId = session?.user?.id;
  
  if (!userId) throw new Error('Unauthorized');

  // SAFETY: If the user ID is from a legacy session or doesn't exist, 
  // ensure we have a valid DB record to prevent foreign key errors.
  if (session?.user?.email) {
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: {},
      create: { email: session.user.email, name: session.user.name || 'Vext User' },
    });
    userId = user.id;
    console.log(`[Action] Verified User: ${session.user.email} -> DB ID: ${userId}`);
  }

  // Basic URL validation
  if (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be') && !videoUrl.includes('instagram.com')) {
    throw new Error('Invalid URL. Please provide a YouTube or Instagram video link.');
  }

  const job = await prisma.processingJob.create({
    data: {
      userId: userId,
      videoUrl: videoUrl,
      status: 'queued',
    },
  });

  // Trigger the background processing pipeline
  // We use the absolute URL to ensure it works in both dev and prod
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  fetch(`${baseUrl}/api/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ videoUrl, jobId: job.id }),
  }).catch(err => console.error('Failed to trigger background process:', err));

  // Revalidate the dashboard to show the new job in the list
  revalidatePath('/dashboard');
  
  return job;
}

/**
 * Get aggregate stats for the Hub
 */
export async function getDashboardStats() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const [totalExtractions, activeJobs, user] = await Promise.all([
    prisma.processingJob.count({ where: { userId: session.user.id } }),
    prisma.processingJob.count({ where: { userId: session.user.id, status: { in: ['processing', 'queued'] } } }),
    prisma.user.findUnique({ where: { id: session.user.id }, select: { bonusCredits: true } })
  ]);

  return {
    totalExtractions: totalExtractions.toLocaleString(),
    activeJobs: activeJobs.toString(),
    credits: user?.bonusCredits?.toLocaleString() ?? '0',
  };
}

/**
 * Fetch recent extractions for the Hub table
 */
export async function getRecentExtractions(limit = 10) {
  const session = await auth();
  if (!session?.user?.id) return [];

  console.log(`[Dashboard] Fetching extractions for user: ${session.user.id}`);

  const jobs = await prisma.processingJob.findMany({
    where: { userId: session.user.id },
    include: {
      cards: true
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  console.log(`[Dashboard] Found ${jobs.length} jobs. Active: ${jobs.filter(j => j.status !== 'completed').length}`);

  return jobs.map(job => {
    const card = job.cards[0];
    if (card) {
      console.log(`[Dashboard] Card ${card.shareId}: ${card.classification}`);
      // console.log(`[Dashboard] Output:`, JSON.stringify(card.output).slice(0, 100));
    }

    return {
      id: job.id,
      title: job.title ?? (job.status === 'failed' ? 'Failed Extraction' : 'Analyzing Stream...'),
      date: formatRelativeDate(job.createdAt),
      type: card?.classification ?? (job.status === 'failed' ? 'Error' : 'Processing...'),
      status: job.status.charAt(0).toUpperCase() + job.status.slice(1),
      shareId: card?.shareId,
    };
  });
}

// Helper for relative time
function formatRelativeDate(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hours ago`;
  return date.toLocaleDateString();
}

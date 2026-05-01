import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  videoUrl: z.string().url({ message: 'videoUrl must be a valid URL' }),
  title:    z.string().max(300).optional(),
});

/** Generate random 8-char alphanumeric ID */
function genId(len = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < len; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export async function POST(req: NextRequest) {
  return Response.json({
    error: 'Synchronous extraction is not supported on this platform. Please use the dashboard.',
  }, { status: 501 });
}

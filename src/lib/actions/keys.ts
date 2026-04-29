'use server';

import { prisma } from '@/lib/db/client';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

/**
 * Generate a new API Key for the user
 */
export async function createApiKey(name: string = 'Default') {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const rawKey = `vx_${crypto.randomBytes(24).toString('hex')}`;
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.slice(0, 8) + '...';

  await prisma.apiKey.create({
    data: {
      userId: session.user.id,
      name,
      keyHash,
      keyPrefix,
    },
  });

  revalidatePath('/api-keys');
  
  // Return the raw key ONLY once
  return { rawKey, name };
}

/**
 * Revoke an existing API Key
 */
export async function revokeApiKey(keyId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  await prisma.apiKey.delete({
    where: {
      id: keyId,
      userId: session.user.id, // Security check
    },
  });

  revalidatePath('/api-keys');
}

/**
 * List all API Keys for the current user
 */
export async function getApiKeys() {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  return prisma.apiKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });
}

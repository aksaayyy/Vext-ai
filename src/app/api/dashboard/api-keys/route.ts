import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db/client';
import { generateApiKey } from '@/lib/auth/api-key';

export const dynamic = 'force-dynamic';

const MAX_KEYS_PER_USER = 5;

/** GET /api/dashboard/api-keys — list user's keys */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    select: { id: true, keyPrefix: true, name: true, plan: true, totalExtractions: true, isActive: true, createdAt: true, lastUsedAt: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ keys });
}

/** POST /api/dashboard/api-keys — generate a new key */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;

  const body = await req.json().catch(() => ({}));
  const name = String(body.name ?? 'Default').slice(0, 64);

  const count = await prisma.apiKey.count({ where: { userId, isActive: true } });
  if (count >= MAX_KEYS_PER_USER) {
    return NextResponse.json({ error: `Maximum ${MAX_KEYS_PER_USER} active keys allowed` }, { status: 400 });
  }

  const { raw, hash, prefix } = generateApiKey();

  await prisma.apiKey.create({
    data: { userId, keyHash: hash, keyPrefix: prefix, name },
  });

  // Return the raw key ONCE — never stored in plaintext
  return NextResponse.json({ key: `vxt_${raw}`, prefix, name }, { status: 201 });
}

/** DELETE /api/dashboard/api-keys/:id — revoke */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const userId = (session.user as any).id as string;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  await prisma.apiKey.updateMany({
    where: { id, userId },
    data: { isActive: false },
  });

  return NextResponse.json({ revoked: true });
}

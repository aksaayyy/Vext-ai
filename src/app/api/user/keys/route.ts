import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { auth } from '@/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  groqApiKey: z.string().optional(),
  nvidiaApiKey: z.string().optional(),
  openrouterApiKey: z.string().optional(),
  instagramCookies: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: {
        groqApiKey: true,
        nvidiaApiKey: true,
        openrouterApiKey: true,
        instagramCookies: true,
      },
    });

    return NextResponse.json({
      groqApiKey: user?.groqApiKey ? '••••••••••••' : '',
      nvidiaApiKey: user?.nvidiaApiKey ? '••••••••••••' : '',
      openrouterApiKey: user?.openrouterApiKey ? '••••••••••••' : '',
      instagramCookies: user?.instagramCookies ? '••••••••••••' : '',
    });
  } catch (error: any) {
    console.error('Error fetching user keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { groqApiKey, nvidiaApiKey, openrouterApiKey, instagramCookies } = BodySchema.parse(body);

    await prisma.user.update({
      where: { id: session.user.id as string },
      data: {
        groqApiKey: groqApiKey || null,
        nvidiaApiKey: nvidiaApiKey || null,
        openrouterApiKey: openrouterApiKey || null,
        instagramCookies: instagramCookies || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error saving user keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';
import { prisma } from '@/lib/db/client';
import { generateExecutionPack } from '@/lib/pack/generator';

export const dynamic = 'force-dynamic';

// In-memory cache: shareId → { buffer, expiresAt }
// Vercel Blob can replace this for multi-instance persistence
const CACHE = new Map<string, { buffer: Buffer; expiresAt: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;

  // Check in-memory cache first
  const cached = CACHE.get(shareId);
  if (cached && cached.expiresAt > Date.now()) {
    return zipResponse(cached.buffer, shareId);
  }

  // Fetch card from DB
  const card = await prisma.card.findUnique({
    where: { shareId },
    select: {
      id: true,
      shareId: true,
      title: true,
      classification: true,
      output: true,
      createdAt: true,
    },
  });

  if (!card) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 });
  }

  // Generate file map
  const fileMap = generateExecutionPack({
    shareId: card.shareId,
    title: card.title,
    classification: card.classification,
    output: card.output,
    createdAt: card.createdAt,
  });

  // Build zip in memory
  const zip = new JSZip();
  for (const [filePath, content] of Object.entries(fileMap)) {
    // Normalise line endings to LF, encode as UTF-8
    zip.file(filePath, content.replace(/\r\n/g, '\n'), {
      binary: false,
      createFolders: true,
    });
  }

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // Store in cache
  CACHE.set(shareId, { buffer, expiresAt: Date.now() + CACHE_TTL_MS });

  // Evict stale entries (keep cache lean)
  if (CACHE.size > 500) {
    const now = Date.now();
    for (const [key, val] of CACHE.entries()) {
      if (val.expiresAt <= now) CACHE.delete(key);
    }
  }

  return zipResponse(buffer, shareId);
}

function zipResponse(buffer: Buffer, shareId: string) {
  // Copy to ArrayBuffer to satisfy NextResponse binary body type
  const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  return new NextResponse(ab, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="vext-pack-${shareId}.zip"`,
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
    },
  });
}

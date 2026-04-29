import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';

export const dynamic = 'force-dynamic';

const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'setup/tutorial':     { bg: '#00ff881a', text: '#00ff88', border: '#00ff8840' },
  'strategy/framework': { bg: '#00d4ff1a', text: '#00d4ff', border: '#00d4ff40' },
  'tool demo':          { bg: '#b084ff1a', text: '#b084ff', border: '#b084ff40' },
  'finance/setup':      { bg: '#ffd60a1a', text: '#ffd60a', border: '#ffd60a40' },
  'product teardown':   { bg: '#ff6b351a', text: '#ff6b35', border: '#ff6b3540' },
  'interview/talk':     { bg: '#00ff881a', text: '#00ff88', border: '#00ff8840' },
  'research/paper':     { bg: '#00d4ff1a', text: '#00d4ff', border: '#00d4ff40' },
  'debate/discussion':  { bg: '#b084ff1a', text: '#b084ff', border: '#b084ff40' },
};

const LABELS: Record<string, string> = {
  'setup/tutorial':     'Setup / Tutorial',
  'strategy/framework': 'Strategy / Framework',
  'tool demo':          'Tool Demo',
  'finance/setup':      'Finance / Setup',
  'product teardown':   'Product Teardown',
  'interview/talk':     'Interview / Talk',
  'research/paper':     'Research / Paper',
  'debate/discussion':  'Debate / Discussion',
};

function buildDescription(classification: string, output: any): string {
  const o = output as Record<string, any>;
  switch (classification) {
    case 'setup/tutorial':     return `${o.steps?.length ?? 0} steps extracted`;
    case 'strategy/framework': return o.methodology?.slice(0, 100) ?? 'Framework breakdown';
    case 'tool demo':          return `${o.features?.length ?? 0} features · ${o.useCases?.length ?? 0} use cases`;
    case 'finance/setup':      return o.strategy?.slice(0, 100) ?? 'Trading strategy';
    case 'product teardown':   return `${o.strengths?.length ?? 0} strengths · ${o.weaknesses?.length ?? 0} weaknesses`;
    case 'interview/talk':     return `${o.speaker ?? ''} · ${o.keyTakeaways?.length ?? 0} takeaways`;
    case 'research/paper':     return o.hypothesis?.slice(0, 100) ?? 'Research findings';
    case 'debate/discussion':  return `${o.viewpoints?.length ?? 0} viewpoints on "${o.topic ?? ''}"`;
    default:                   return 'Extracted with Vext';
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params;

  const card = await prisma.card.findUnique({
    where: { shareId },
    select: { title: true, classification: true, output: true, shareId: true },
  });

  const title = card?.title ?? 'Video Intelligence Card';
  const classification = card?.classification ?? 'setup/tutorial';
  const description = card ? buildDescription(classification, card.output) : 'Extracted with Vext';
  const badge = BADGE_COLORS[classification] ?? BADGE_COLORS['setup/tutorial'];
  const label = LABELS[classification] ?? classification;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px', height: '630px',
          backgroundColor: '#0d0d0f',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px', fontFamily: 'sans-serif',
          position: 'relative', overflow: 'hidden',
        }}
      >
        {/* Grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />

        {/* Top neon bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '3px',
          background: 'linear-gradient(90deg, #00ff88, #00d4ff, #b084ff)',
        }} />

        {/* Left glow */}
        <div style={{
          position: 'absolute', left: '-80px', top: '40%',
          width: '300px', height: '300px', borderRadius: '50%',
          background: `radial-gradient(circle, ${badge.text}18 0%, transparent 70%)`,
        }} />

        {/* Header: logo + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', fontWeight: '800', color: '#000',
            }}>V</div>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#f0f0f4' }}>Vext</span>
          </div>

          <div style={{
            backgroundColor: badge.bg, color: badge.text,
            border: `1px solid ${badge.border}`,
            borderRadius: '8px', padding: '5px 14px',
            fontSize: '13px', fontWeight: '700',
            letterSpacing: '1px', textTransform: 'uppercase',
          }}>{label}</div>
        </div>

        {/* Main title + description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', zIndex: 1 }}>
          <div style={{
            fontSize: title.length > 55 ? '38px' : '50px',
            fontWeight: '800', color: '#f0f0f4',
            lineHeight: 1.15, letterSpacing: '-1px',
            maxWidth: '1000px',
          }}>
            {title.length > 75 ? title.slice(0, 75) + '…' : title}
          </div>
          <div style={{
            fontSize: '22px', color: '#9898a8',
            maxWidth: '850px', lineHeight: 1.5,
          }}>
            {description.length > 110 ? description.slice(0, 110) + '…' : description}
          </div>

          {/* CTA pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
              borderRadius: '10px', padding: '10px 24px',
              fontSize: '16px', fontWeight: '700', color: '#000',
            }}>
              Try Vext Free →
            </div>
            <span style={{ fontSize: '15px', color: '#5a5a6a' }}>Extract intelligence from any video</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', zIndex: 1,
        }}>
          <div style={{ fontSize: '15px', color: '#5a5a6a', fontFamily: 'monospace' }}>
            vext.so/card/{shareId}
          </div>
          <div style={{
            fontSize: '13px', color: '#3a3a46',
            border: '1px solid #2a2a32', borderRadius: '6px',
            padding: '4px 12px',
          }}>
            Extract · Share · Build
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

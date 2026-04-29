import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const BADGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'setup/tutorial':      { bg: '#00ff881a', text: '#00ff88', border: '#00ff8840' },
  'strategy/framework':  { bg: '#00d4ff1a', text: '#00d4ff', border: '#00d4ff40' },
  'tool demo':           { bg: '#b084ff1a', text: '#b084ff', border: '#b084ff40' },
  'finance/setup':       { bg: '#ffd60a1a', text: '#ffd60a', border: '#ffd60a40' },
  'product teardown':    { bg: '#ff6b351a', text: '#ff6b35', border: '#ff6b3540' },
  'interview/talk':      { bg: '#00ff881a', text: '#00ff88', border: '#00ff8840' },
  'research/paper':      { bg: '#00d4ff1a', text: '#00d4ff', border: '#00d4ff40' },
  'debate/discussion':   { bg: '#b084ff1a', text: '#b084ff', border: '#b084ff40' },
};

const CLASSIFICATION_LABELS: Record<string, string> = {
  'setup/tutorial':     'Setup / Tutorial',
  'strategy/framework': 'Strategy / Framework',
  'tool demo':          'Tool Demo',
  'finance/setup':      'Finance / Setup',
  'product teardown':   'Product Teardown',
  'interview/talk':     'Interview / Talk',
  'research/paper':     'Research / Paper',
  'debate/discussion':  'Debate / Discussion',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') ?? 'Video Intelligence Card';
  const classification = searchParams.get('classification') ?? 'setup/tutorial';
  const shareId = searchParams.get('shareId') ?? '';
  const description = searchParams.get('description') ?? 'Extracted with Vext';

  const badge = BADGE_COLORS[classification] ?? BADGE_COLORS['setup/tutorial'];
  const label = CLASSIFICATION_LABELS[classification] ?? classification;

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          backgroundColor: '#0d0d0f',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background grid pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Top neon accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, #00ff88, #00d4ff, #b084ff)',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00ff88, #00d4ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '700',
                color: '#000',
              }}
            >
              V
            </div>
            <span
              style={{
                fontSize: '22px',
                fontWeight: '700',
                color: '#f0f0f4',
                letterSpacing: '-0.5px',
              }}
            >
              Vext
            </span>
          </div>

          {/* Badge */}
          <div
            style={{
              backgroundColor: badge.bg,
              color: badge.text,
              border: `1px solid ${badge.border}`,
              borderRadius: '6px',
              padding: '4px 12px',
              fontSize: '13px',
              fontWeight: '600',
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}
          >
            {label}
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 1 }}>
          <div
            style={{
              fontSize: title.length > 60 ? '36px' : '48px',
              fontWeight: '700',
              color: '#f0f0f4',
              lineHeight: 1.2,
              letterSpacing: '-1px',
              maxWidth: '900px',
            }}
          >
            {title.length > 80 ? title.slice(0, 80) + '…' : title}
          </div>
          <div
            style={{
              fontSize: '20px',
              color: '#9898a8',
              maxWidth: '800px',
              lineHeight: 1.5,
            }}
          >
            {description.length > 120 ? description.slice(0, 120) + '…' : description}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: '15px',
              color: '#5a5a6a',
              fontFamily: 'monospace',
            }}
          >
            vext.so/card/{shareId}
          </div>
          <div
            style={{
              fontSize: '15px',
              color: '#5a5a6a',
            }}
          >
            Extract · Share · Build
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}

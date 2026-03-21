import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text') || 'AI systems that drive revenue';
  const pillar = searchParams.get('pillar') || '';
  const format = searchParams.get('format') || 'landscape'; // landscape, square, portrait
  const style = searchParams.get('style') || 'quote'; // quote, stat, tip, blog

  const sizes: Record<string, { width: number; height: number }> = {
    landscape: { width: 1200, height: 630 },
    square: { width: 1080, height: 1080 },
    portrait: { width: 1080, height: 1350 },
  };

  const { width, height } = sizes[format] || sizes.landscape;

  // Brand colors
  const navy = '#0a0e1a';
  const periwinkle = '#7c9bf5';
  const lavender = '#c4b5e0';
  const white = '#f0f0f5';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: navy,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${periwinkle}30 0%, transparent 70%)`,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '-60px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${lavender}20 0%, transparent 70%)`,
            display: 'flex',
          }}
        />

        {/* Accent line at top */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${periwinkle}, ${lavender})`,
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: style === 'stat' ? 'center' : 'flex-start',
            justifyContent: 'center',
            padding: format === 'landscape' ? '60px 80px' : '80px 60px',
            maxWidth: '100%',
            flex: 1,
          }}
        >
          {/* Pillar tag */}
          {pillar && (
            <div
              style={{
                fontSize: 14,
                color: periwinkle,
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginBottom: '20px',
                display: 'flex',
              }}
            >
              {pillar}
            </div>
          )}

          {/* Main text */}
          <div
            style={{
              fontSize: style === 'stat' ? 72 : format === 'landscape' ? 42 : 36,
              fontWeight: 600,
              color: white,
              lineHeight: 1.3,
              maxWidth: '90%',
              display: 'flex',
            }}
          >
            {text.length > 140 ? text.slice(0, 137) + '...' : text}
          </div>

          {/* Divider */}
          <div
            style={{
              width: '60px',
              height: '3px',
              background: periwinkle,
              marginTop: '30px',
              display: 'flex',
            }}
          />
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: '30px',
            left: '80px',
            right: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Logo dot */}
            <div
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: periwinkle,
                display: 'flex',
              }}
            />
            <div style={{ fontSize: 22, fontWeight: 600, color: white, display: 'flex' }}>
              zev.ai
            </div>
          </div>
          <div style={{ fontSize: 14, color: lavender, display: 'flex' }}>
            AI Systems That Drive Revenue
          </div>
        </div>
      </div>
    ),
    { width, height },
  );
}
